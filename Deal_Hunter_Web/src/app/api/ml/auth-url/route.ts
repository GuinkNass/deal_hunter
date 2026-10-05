import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ success: false, error: 'Client ID é obrigatório' }, { status: 400 });
    }

    const redirectUri = `${url.origin}/api/ml/callback`;
    const authUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;

    return NextResponse.json({ success: true, url: authUrl });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
