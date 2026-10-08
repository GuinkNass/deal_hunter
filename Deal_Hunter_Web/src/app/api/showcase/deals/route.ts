import { NextRequest, NextResponse } from 'next/server';
import { getShowcaseDeals } from '@/lib/showcase/store';

// Sempre dinâmico para refletir imediatamente adições e remoções de ofertas
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const deals = await getShowcaseDeals();

    return NextResponse.json({
      success: true,
      count: deals.length,
      data: deals,
    });
  } catch (err: any) {
    console.error('[API Showcase Deals] Erro inesperado:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
