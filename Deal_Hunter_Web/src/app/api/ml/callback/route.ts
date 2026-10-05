import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/dashboard?tab=settings&ml_error=${encodeURIComponent(error)}`, req.url));
  }

  if (code) {
    return NextResponse.redirect(new URL(`/dashboard?tab=settings&ml_connected=true&code=${encodeURIComponent(code)}`, req.url));
  }

  return NextResponse.redirect(new URL('/dashboard?tab=settings', req.url));
}
