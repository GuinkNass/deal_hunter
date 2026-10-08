import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { syncShowcaseDeals, getShowcaseDeals } from '@/lib/showcase/store';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    const supabase = createAdminClient();
    let userId: string | null = null;

    if (token) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser(token);
        if (user) {
          userId = user.id;
        }
      } catch (authErr: any) {
        console.warn('[Showcase Sync] Aviso de autenticação:', authErr.message);
      }
    }

    const body = await req.json().catch(() => ({}));
    const deals = Array.isArray(body.deals) ? body.deals : [];

    if (deals.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhuma oferta fornecida para sincronizar a vitrine.',
      }, { status: 400 });
    }

    const saved = await syncShowcaseDeals(deals, userId || body.userId);

    return NextResponse.json({
      success: true,
      message: `Vitrine sincronizada com sucesso com ${saved.length} oferta(s)!`,
      count: saved.length,
      data: saved,
      updated_at: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[API Showcase Sync] Erro fatal:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Erro ao sincronizar vitrine' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const deals = await getShowcaseDeals();
    return NextResponse.json({
      success: true,
      count: deals.length,
      data: deals,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
