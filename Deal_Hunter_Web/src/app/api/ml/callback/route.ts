import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');
  const state = url.searchParams.get('state');

  console.log('[ML OAuth Callback] Requisição de autorização recebida:', {
    origin: url.origin,
    fullUrl: req.url,
    hasCode: Boolean(code),
    codePrefix: code ? code.substring(0, 8) + '...' : null,
    error,
    errorDescription,
    state,
  });

  if (error) {
    const errText = errorDescription || error || 'Autorização recusada pelo usuário';
    console.error('[ML OAuth Callback] Erro retornado na URL pelo Mercado Livre:', errText);
    return NextResponse.redirect(
      new URL(`/dashboard?tab=settings&ml_error=${encodeURIComponent(errText)}`, req.url)
    );
  }

  if (!code) {
    console.warn('[ML OAuth Callback] Nenhum authorization code recebido na query string.');
    return NextResponse.redirect(new URL('/dashboard?tab=settings', req.url));
  }

  try {
    const supabase = createAdminClient();

    // 1. Determina as credenciais com prioridade para env vars e fallbacks oficiais atualizados
    const envClientId = (
      process.env.ML_CLIENT_ID?.trim() ||
      process.env.MERCADOLIVRE_APP_ID?.trim() ||
      process.env.MERCADO_LIVRE_CLIENT_ID?.trim() ||
      '226238620730357'
    );

    const envClientSecret = (
      process.env.ML_CLIENT_SECRET?.trim() ||
      process.env.MERCADOLIVRE_SECRET_KEY?.trim() ||
      process.env.MERCADO_LIVRE_CLIENT_SECRET?.trim() ||
      'dsjLowWybTxjm2I3EKo6PThe3X4oCEMO'
    );

    let clientId = envClientId;
    let clientSecret = envClientSecret;
    let targetUserId = state || '';

    // Se houver userId no state, consulta o perfil
    if (targetUserId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, ml_client_id, ml_client_secret')
        .eq('id', targetUserId)
        .maybeSingle();

      if (profile) {
        if (profile.ml_client_id && profile.ml_client_id.trim()) {
          clientId = profile.ml_client_id.trim();
        }
        // Se a chave no banco for a antiga revogada, ignora e usa a nova oficial
        if (
          profile.ml_client_secret &&
          profile.ml_client_secret.trim() &&
          !profile.ml_client_secret.includes('cZDc8xmkvXZqhtJqEncKmTKLDoMCIYRI')
        ) {
          clientSecret = profile.ml_client_secret.trim();
        }
      }
    }

    if (!targetUserId) {
      const { data: latestProf } = await supabase
        .from('profiles')
        .select('id')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latestProf) targetUserId = latestProf.id;
    }

    // 2. Define o Redirect URI rigorosamente idêntico ao cadastrado no DevCenter
    const redirectUri = (
      process.env.ML_REDIRECT_URI?.trim() ||
      process.env.MERCADOLIVRE_REDIRECT_URI?.trim() ||
      (url.origin.includes('dealhunterpro.com.br')
        ? 'https://www.dealhunterpro.com.br/api/ml/callback'
        : `${url.origin}/api/ml/callback`)
    );

    console.log('[ML OAuth Callback] Disparando troca de token em https://api.mercadolibre.com/oauth/token:', {
      client_id: clientId,
      client_secret_masked: clientSecret.substring(0, 6) + '...' + clientSecret.substring(clientSecret.length - 4),
      redirect_uri: redirectUri,
      targetUserId,
    });

    const tokenRes = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId.trim(),
        client_secret: clientSecret.trim(),
        code: code.trim(),
        redirect_uri: redirectUri.trim(),
      }),
    });

    const tokenData = await tokenRes.json().catch(() => ({}));

    console.log('[ML OAuth Callback] Resposta da API Mercado Livre:', {
      status: tokenRes.status,
      ok: tokenRes.ok,
      hasAccessToken: Boolean(tokenData?.access_token),
      hasRefreshToken: Boolean(tokenData?.refresh_token),
      expiresIn: tokenData?.expires_in,
      userId: tokenData?.user_id,
      error: tokenData?.error,
      message: tokenData?.message,
      cause: tokenData?.cause,
    });

    if (tokenRes.ok && tokenData.access_token) {
      const accessToken = String(tokenData.access_token).trim();
      const refreshToken = tokenData.refresh_token ? String(tokenData.refresh_token).trim() : null;
      const expiresIn = tokenData.expires_in ? Number(tokenData.expires_in) : 21600;
      const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

      if (targetUserId) {
        const standardUpdates: Record<string, any> = {
          ml_api_key: accessToken,
          ml_client_id: clientId.trim(),
          ml_client_secret: clientSecret.trim(),
          updated_at: new Date().toISOString(),
        };

        // Tenta salvar com as colunas de refresh/expiração caso existam no schema
        const { error: fullUpdateErr } = await supabase
          .from('profiles')
          .update({
            ...standardUpdates,
            ml_access_token: accessToken,
            ml_refresh_token: refreshToken,
            ml_token_expires_at: expiresAt,
          })
          .eq('id', targetUserId);

        if (fullUpdateErr) {
          console.warn('[ML OAuth Callback] Schema sem colunas estendidas, atualizando colunas padrão:', fullUpdateErr.message);
          await supabase
            .from('profiles')
            .update(standardUpdates)
            .eq('id', targetUserId);
        }

        console.log(`[ML OAuth Callback] ✅ Token oficial salvo com sucesso para o usuário ${targetUserId}!`);
      }

      return NextResponse.redirect(
        new URL('/dashboard?tab=settings&ml_connected=true', req.url)
      );
    } else {
      const errMsg =
        tokenData?.message ||
        tokenData?.error_description ||
        tokenData?.error ||
        `Falha na autorização do Mercado Livre (HTTP ${tokenRes.status})`;

      console.error('[ML OAuth Callback] ❌ Erro detalhado retornado por api.mercadolibre.com:', {
        status: tokenRes.status,
        response: tokenData,
      });

      return NextResponse.redirect(
        new URL(`/dashboard?tab=settings&ml_error=${encodeURIComponent(errMsg)}`, req.url)
      );
    }
  } catch (err: any) {
    console.error('[ML OAuth Callback] 💥 Exceção inesperada:', err);
    return NextResponse.redirect(
      new URL(`/dashboard?tab=settings&ml_error=${encodeURIComponent(err.message)}`, req.url)
    );
  }
}

export async function POST(req: NextRequest) {
  // Responde 200 OK imediatamente para validação de webhooks/notificações do Mercado Livre
  return NextResponse.json({ status: 'ok', received: true }, { status: 200 });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
