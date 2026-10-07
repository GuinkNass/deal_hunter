import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { tagAmazonUrl } from '@/lib/ml-radar/affiliate';

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
        if (user) userId = user.id;
      } catch (authErr) {
        console.warn('[Featured Deal] Token inválido:', authErr);
      }
    }

    const body = await req.json();
    const { dealId, isFeatured, dealData } = body;

    if (!dealId && !dealData) {
      return NextResponse.json(
        { success: false, error: 'Parâmetro dealId ou dealData obrigatório.' },
        { status: 400 }
      );
    }

    const targetIsFeatured = Boolean(isFeatured);
    const isRenderOrVirtual = !dealId || String(dealId).startsWith('render-') || !dealId.includes('-');

    if (isRenderOrVirtual && dealData) {
      // Criação ou persistência do item da extensão/Render no Supabase como oferta em destaque
      const cleanUrl = tagAmazonUrl(dealData.product_url || dealData.productUrl || '');
      const insertPayload: any = {
        title: dealData.title || 'Oferta em Destaque',
        price: Number(dealData.price || dealData.source_price || 0),
        original_price: dealData.original_price || dealData.source_original_price || null,
        image_url: dealData.image_url || dealData.imageUrl || null,
        product_url: cleanUrl,
        store: dealData.store || dealData.site_name || 'Amazon Brasil',
        ml_title: dealData.ml_title || null,
        ml_price: dealData.ml_price ? Number(dealData.ml_price) : null,
        ml_url: dealData.ml_url || null,
        ml_image_url: dealData.ml_image_url || null,
        net_profit: dealData.net_profit ? Number(dealData.net_profit) : null,
        roi_percent: dealData.roi_percent ? Number(dealData.roi_percent) : null,
        margin_percent: dealData.margin_percent ? Number(dealData.margin_percent) : null,
        verdict: dealData.verdict || 'Oferta Selecionada',
        status: 'completed',
        is_featured: targetIsFeatured,
        description: dealData.description || null,
        category: dealData.category || null,
      };

      if (userId) {
        insertPayload.user_id = userId;
      } else {
        // Vincula ao primeiro perfil admin disponível
        const { data: firstAdmin } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
        if (firstAdmin) insertPayload.user_id = firstAdmin.id;
      }

      const { data: inserted, error: insertError } = await supabase
        .from('ml_radar_deals')
        .insert(insertPayload)
        .select()
        .single();

      if (insertError) {
        // Tenta sem colunas opcionais caso tabela ainda não tenha migração executada
        const fallbackPayload = { ...insertPayload };
        delete fallbackPayload.description;
        delete fallbackPayload.category;

        const { data: fallbackInserted, error: fallbackError } = await supabase
          .from('ml_radar_deals')
          .insert(fallbackPayload)
          .select()
          .single();

        if (fallbackError) {
          return NextResponse.json({ success: false, error: fallbackError.message }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          dealId: fallbackInserted?.id,
          is_featured: targetIsFeatured,
        });
      }

      return NextResponse.json({
        success: true,
        dealId: inserted?.id,
        is_featured: targetIsFeatured,
      });
    }

    // Se já é um registro no Supabase (UUID)
    const { error: updateError } = await supabase
      .from('ml_radar_deals')
      .update({ is_featured: targetIsFeatured })
      .eq('id', dealId);

    if (updateError) {
      // Caso a coluna is_featured não exista ainda no banco remoto, salva dentro de gemini_analysis
      const { data: existingDeal } = await supabase
        .from('ml_radar_deals')
        .select('gemini_analysis')
        .eq('id', dealId)
        .maybeSingle();

      const existingAnalysis = existingDeal?.gemini_analysis || {};
      existingAnalysis.is_featured = targetIsFeatured;

      await supabase
        .from('ml_radar_deals')
        .update({ gemini_analysis: existingAnalysis })
        .eq('id', dealId);
    }

    return NextResponse.json({
      success: true,
      dealId,
      is_featured: targetIsFeatured,
    });
  } catch (err: any) {
    console.error('[API Featured Deal] Erro ao alternar destaque:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
