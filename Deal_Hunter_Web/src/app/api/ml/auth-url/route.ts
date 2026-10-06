import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const clientIdParam = url.searchParams.get('clientId');
    const userId = url.searchParams.get('userId') || '';

    let clientId = (
      clientIdParam?.trim() ||
      process.env.ML_CLIENT_ID?.trim() ||
      process.env.MERCADOLIVRE_APP_ID?.trim() ||
      process.env.MERCADO_LIVRE_CLIENT_ID?.trim() ||
      '226238620730357'
    );

    // Corrige automaticamente erro de digitação comum (falta do segundo '2')
    if (clientId === '26238620730357') {
      clientId = '226238620730357';
    }

    const redirectUri = (
      process.env.ML_REDIRECT_URI?.trim() ||
      process.env.MERCADOLIVRE_REDIRECT_URI?.trim() ||
      (url.origin.includes('dealhunterpro.com.br')
        ? 'https://www.dealhunterpro.com.br/api/ml/callback'
        : `${url.origin}/api/ml/callback`)
    );

    const stateParam = userId ? `&state=${encodeURIComponent(userId)}` : '';
    const authUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}${stateParam}`;

    console.log('[ML Auth URL] URL de autorização gerada:', { clientId, redirectUri, userId });

    return NextResponse.json({ success: true, url: authUrl, redirectUri });
  } catch (err: any) {
    console.error('[ML Auth URL] Erro ao gerar URL:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
