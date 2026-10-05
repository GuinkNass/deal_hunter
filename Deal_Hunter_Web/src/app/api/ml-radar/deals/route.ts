import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    const supabase = createAdminClient();

    let userId: string | null = null;

    if (token) {
      const {
        data: { user },
      } = await supabase.auth.getUser(token);
      if (user) userId = user.id;
    }

    // Se não há token, busca parâmetro userId na query (para desenvolvimento/teste local)
    if (!userId) {
      const url = new URL(req.url);
      userId = url.searchParams.get('userId');
    }

    if (!userId) {
      // Se ainda não tiver userId, busca os deals mais recentes gerais
      const { data: deals, error } = await supabase
        .from('ml_radar_deals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return NextResponse.json({ success: true, data: deals || [] });
    }

    const { data: userDeals, error } = await supabase
      .from('ml_radar_deals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({ success: true, data: userDeals || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Erro ao carregar ofertas do ML Radar' },
      { status: 500 }
    );
  }
}
