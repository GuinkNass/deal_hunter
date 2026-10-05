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

    if (!userId) {
      const url = new URL(req.url);
      userId = url.searchParams.get('userId');
    }

    if (!userId) {
      return NextResponse.json({ success: true, data: [] });
    }

    const { data: history, error } = await supabase
      .from('margin_calculations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error && error.code !== '42P01') {
      throw error;
    }

    return NextResponse.json({ success: true, data: history || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { name, analysis_id, ...calcParams } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'O nome da simulação é obrigatório' }, { status: 400 });
    }

    if (!userId) {
      userId = body.userId || null;
    }

    if (!userId) {
      const { data: firstAdmin } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .maybeSingle();
      if (firstAdmin) userId = firstAdmin.id;
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Usuário não autenticado' }, { status: 401 });
    }

    const id = `calc-${Date.now()}`;

    const { error } = await supabase.from('margin_calculations').insert({
      id,
      user_id: userId,
      name,
      analysis_id: analysis_id || null,
      ml_price: Number(calcParams.salePrice || 0),
      listing_type: calcParams.listingType || 'gold_pro',
      product_cost: Number(calcParams.productCost || 0),
      tax_percent: Number(calcParams.taxPercent || 0),
      free_shipping_auto: calcParams.freeShippingAuto !== undefined ? Boolean(calcParams.freeShippingAuto) : true,
      custom_shipping_enabled: Boolean(calcParams.customShippingEnabled),
      shipping_cost: Number(calcParams.shippingCost || 0),
      packaging_cost: Number(calcParams.packagingCost || 3.5),
      ads_percent: Number(calcParams.adsPercent || 0),
      return_percent: Number(calcParams.returnPercent || 2),
      commission_rate: Number(calcParams.commissionRate || 17),
      commission_value: Number(calcParams.commissionFee || 0),
      fixed_fee: Number(calcParams.fixedFee || 0),
      net_profit: Number(calcParams.netProfit || 0),
      margin_percent: Number(calcParams.marginPercent || 0),
      roi_percent: Number(calcParams.roiPercent || 0),
      break_even_price: Number(calcParams.breakEvenPrice || 0),
    });

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Cálculo salvo com sucesso!', id });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID obrigatório' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from('margin_calculations').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Cálculo excluído com sucesso' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
