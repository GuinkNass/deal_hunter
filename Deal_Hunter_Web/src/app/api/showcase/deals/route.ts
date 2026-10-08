import { NextRequest, NextResponse } from 'next/server';
import { getShowcaseDeals } from '@/lib/showcase/store';

// Revalidação a cada 15 segundos para máxima agilidade
export const revalidate = 15;

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
