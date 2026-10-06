import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const state = url.searchParams.get('state');

  if (error) {
    return NextResponse.redirect(new URL(`/dashboard?tab=settings&ml_error=${encodeURIComponent(error)}`, req.url));
  }

  if (code) {
    try {
      const supabase = createAdminClient();
      let clientId = '';
      let clientSecret = '';
      let targetUserId = state || '';

      if (targetUserId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, ml_client_id, ml_client_secret')
          .eq('id', targetUserId)
          .maybeSingle();

        if (profile) {
          clientId = profile.ml_client_id || '';
          clientSecret = profile.ml_client_secret || '';
        }
      }

      if (!clientId || !clientSecret) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, ml_client_id, ml_client_secret')
          .not('ml_client_id', 'is', null)
          .not('ml_client_secret', 'is', null)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (profiles && profiles.length > 0) {
          clientId = profiles[0].ml_client_id;
          clientSecret = profiles[0].ml_client_secret;
          targetUserId = profiles[0].id;
        }
      }

      if (clientId && clientSecret) {
        const redirectUri = `${url.origin}/api/ml/callback`;
        const tokenRes = await fetch('https://api.mercadolibre.com/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: clientId.trim(),
            client_secret: clientSecret.trim(),
            code: code.trim(),
            redirect_uri: redirectUri,
          }),
        });

        const tokenData = await tokenRes.json();
        if (tokenRes.ok && tokenData.access_token) {
          await supabase
            .from('profiles')
            .update({
              ml_api_key: tokenData.access_token,
              updated_at: new Date().toISOString(),
            })
            .eq('id', targetUserId);

          return NextResponse.redirect(
            new URL('/dashboard?tab=settings&ml_connected=true', req.url)
          );
        } else {
          const errMsg = tokenData.message || tokenData.error || 'Falha ao gerar token de acesso';
          return NextResponse.redirect(
            new URL(`/dashboard?tab=settings&ml_error=${encodeURIComponent(errMsg)}`, req.url)
          );
        }
      }
    } catch (err: any) {
      return NextResponse.redirect(
        new URL(`/dashboard?tab=settings&ml_error=${encodeURIComponent(err.message)}`, req.url)
      );
    }
  }

  return NextResponse.redirect(new URL('/dashboard?tab=settings', req.url));
}

export async function POST(req: NextRequest) {
  // Responde 200 OK imediatamente para validação de webhooks/notificações do Mercado Livre
  return NextResponse.json({ status: 'ok', received: true }, { status: 200 });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

