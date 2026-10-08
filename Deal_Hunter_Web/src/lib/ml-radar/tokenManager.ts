import { createAdminClient } from '@/lib/supabase/admin';

interface TokenResolutionOptions {
  userId?: string;
  providedToken?: string | null;
}

interface ResolvedTokenInfo {
  token: string | null;
  refreshed: boolean;
  userId?: string;
  source: 'provided' | 'profile' | 'refreshed' | 'none';
}

/**
 * Valida se um token de acesso do Mercado Livre está atualmente ativo e aceito pela API.
 */
export async function testMlToken(token?: string | null): Promise<boolean> {
  if (!token || token.trim().length < 15) return false;
  try {
    const res = await fetch('https://api.mercadolibre.com/sites/MLB/search?q=fone&limit=1', {
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(3500),
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

/**
 * Renova o access_token do Mercado Livre usando o refresh_token no endpoint oficial OAuth.
 */
export async function refreshMercadoLivreToken(
  refreshToken: string,
  clientId?: string,
  clientSecret?: string
): Promise<{ access_token: string; refresh_token?: string; expires_in?: number } | null> {
  const effectiveClientId =
    clientId?.trim() ||
    process.env.ML_CLIENT_ID?.trim() ||
    process.env.MERCADOLIVRE_APP_ID?.trim() ||
    '226238620730357';

  const effectiveClientSecret =
    clientSecret?.trim() ||
    process.env.ML_CLIENT_SECRET?.trim() ||
    process.env.MERCADOLIVRE_SECRET_KEY?.trim() ||
    'dsjLowWybTxjm2I3EKo6PThe3X4oCEMO';

  if (!refreshToken || !effectiveClientId || !effectiveClientSecret) {
    return null;
  }

  try {
    console.log('[TokenManager] Tentando renovar access_token expirado do Mercado Livre...');
    const res = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: effectiveClientId,
        client_secret: effectiveClientSecret,
        refresh_token: refreshToken.trim(),
      }),
      signal: AbortSignal.timeout(6000),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.access_token) {
      console.log('[TokenManager] ✅ Token do Mercado Livre renovado com sucesso!');
      return {
        access_token: String(data.access_token).trim(),
        refresh_token: data.refresh_token ? String(data.refresh_token).trim() : undefined,
        expires_in: data.expires_in ? Number(data.expires_in) : 21600,
      };
    } else {
      console.warn('[TokenManager] Falha ao renovar token ML:', data?.error || data?.message || res.status);
    }
  } catch (err: any) {
    console.error('[TokenManager] Exceção na renovação do token ML:', err.message);
  }

  return null;
}

/**
 * Obtém um token de acesso válido do Mercado Livre garantido.
 * Se o token atual estiver expirado ou ausente, busca o refresh_token no Supabase e renova automaticamente.
 */
export async function getValidMlAccessToken(
  options: TokenResolutionOptions = {}
): Promise<ResolvedTokenInfo> {
  const supabase = createAdminClient();

  // 1. Se foi fornecido um token explícito (ex: de parâmetro do request ou cookie)
  if (options.providedToken && options.providedToken.trim().length > 15) {
    const rawProvided = options.providedToken.trim();
    // Teste rápido para checar se ainda é válido
    const isValid = await testMlToken(rawProvided);
    if (isValid) {
      return { token: rawProvided, refreshed: false, source: 'provided' };
    }
    console.log('[TokenManager] Token fornecido está expirado/inválido. Buscando refresh_token no banco...');
  }

  // 2. Busca perfil do usuário ou o perfil mais recente com integração ML
  let targetProfile: any = null;
  if (options.userId) {
    const { data } = await supabase
      .from('profiles')
      .select('id, ml_api_key, ml_access_token, ml_refresh_token, ml_token_expires_at, ml_client_id, ml_client_secret')
      .eq('id', options.userId)
      .maybeSingle();
    targetProfile = data;
  }

  if (!targetProfile) {
    const { data } = await supabase
      .from('profiles')
      .select('id, ml_api_key, ml_access_token, ml_refresh_token, ml_token_expires_at, ml_client_id, ml_client_secret')
      .or('ml_refresh_token.neq.null,ml_access_token.neq.null,ml_api_key.neq.null')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    targetProfile = data;
  }

  if (!targetProfile) {
    return { token: null, refreshed: false, source: 'none' };
  }

  const existingToken = (targetProfile.ml_access_token || targetProfile.ml_api_key || '').trim();
  const refreshToken = (targetProfile.ml_refresh_token || '').trim();
  const expiresAtMs = targetProfile.ml_token_expires_at
    ? new Date(targetProfile.ml_token_expires_at).getTime()
    : 0;

  const isNearlyExpired = expiresAtMs > 0 && Date.now() + 5 * 60 * 1000 > expiresAtMs;

  // 3. Se temos um token existente que não está expirado, testa validade
  if (existingToken && !isNearlyExpired) {
    const isValid = await testMlToken(existingToken);
    if (isValid) {
      return {
        token: existingToken,
        refreshed: false,
        userId: targetProfile.id,
        source: 'profile',
      };
    }
  }

  // 4. Se o token expirou ou falhou, tenta renovar usando refresh_token
  if (refreshToken) {
    const refreshResult = await refreshMercadoLivreToken(
      refreshToken,
      targetProfile.ml_client_id,
      targetProfile.ml_client_secret
    );

    if (refreshResult?.access_token) {
      const newAccessToken = refreshResult.access_token;
      const newRefreshToken = refreshResult.refresh_token || refreshToken;
      const expiresInSec = refreshResult.expires_in || 21600;
      const newExpiresAt = new Date(Date.now() + expiresInSec * 1000).toISOString();

      // Atualiza o perfil no Supabase com o token renovado
      try {
        await supabase
          .from('profiles')
          .update({
            ml_access_token: newAccessToken,
            ml_api_key: newAccessToken,
            ml_refresh_token: newRefreshToken,
            ml_token_expires_at: newExpiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetProfile.id);

        console.log(`[TokenManager] Perfil ${targetProfile.id} atualizado com novo token do Mercado Livre.`);
      } catch (err: any) {
        console.warn('[TokenManager] Aviso ao atualizar token renovado no Supabase:', err.message);
      }

      return {
        token: newAccessToken,
        refreshed: true,
        userId: targetProfile.id,
        source: 'refreshed',
      };
    }
  }

  // 5. Fallback final: se não conseguiu renovar, retorna o existingToken se houver
  return {
    token: existingToken || null,
    refreshed: false,
    userId: targetProfile?.id,
    source: existingToken ? 'profile' : 'none',
  };
}
