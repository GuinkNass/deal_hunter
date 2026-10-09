import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { tagAmazonUrl } from '@/lib/ml-radar/affiliate';
import {
  invalidateShowcaseCache,
  addDealToShowcaseMemory,
  removeDealFromShowcaseMemory,
} from '@/lib/showcase/store';
import { verifyAdminToken } from '@/lib/auth/admin';
import { revalidatePath } from 'next/cache';

const isValidUUID = (str?: any): boolean =>
  Boolean(typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim()));

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    const supabase = createAdminClient();
    const { isAdmin, userId } = await verifyAdminToken(supabase, token);

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Acesso restrito. Apenas administradores autorizados podem adicionar ou remover produtos da vitrine oficial.',
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const targetIsFeatured =
      body.isFeatured !== undefined
        ? Boolean(body.isFeatured)
        : body.featured !== undefined
        ? Boolean(body.featured)
        : true;

    // =========================================================================
    // 1. AÇÃO EM LOTE (Batch Update)
    // =========================================================================
    if (Array.isArray(body.dealIds) && body.dealIds.length > 0) {
      const validUuids = body.dealIds.filter(isValidUUID);
      if (validUuids.length > 0) {
        const { error: batchErr } = await supabase
          .from('ml_radar_deals')
          .update({ is_featured: targetIsFeatured })
          .in('id', validUuids);

        if (batchErr) {
          console.warn('[Featured Deal Batch] Tentando fallback para gemini_analysis:', batchErr.message);
          // Fallback individual para gemini_analysis
          for (const uid of validUuids) {
            const { data: d } = await supabase.from('ml_radar_deals').select('gemini_analysis').eq('id', uid).maybeSingle();
            const analysis = d?.gemini_analysis || {};
            analysis.is_featured = targetIsFeatured;
            await supabase.from('ml_radar_deals').update({ gemini_analysis: analysis }).eq('id', uid);
          }
        }
      }

      // Invalida cache após lote
      invalidateShowcaseCache();

      return NextResponse.json({
        success: true,
        count: body.dealIds.length,
        is_featured: targetIsFeatured,
      });
    }

    // =========================================================================
    // 2. AÇÃO INDIVIDUAL (Single Item)
    // =========================================================================
    const dealData = body.dealData || body.dealPayload || body.deal || {};
    const rawId = body.dealId || body.id || dealData.id;
    const cleanUrl = tagAmazonUrl(dealData.product_url || dealData.productUrl || '');

    // Sincroniza memória imediatamente para refletir na vitrine sem delay
    if (targetIsFeatured) {
      addDealToShowcaseMemory({
        ...dealData,
        id: rawId,
        product_url: cleanUrl || dealData.product_url,
        is_featured: true,
      });
    } else {
      removeDealFromShowcaseMemory(rawId, cleanUrl || dealData.product_url);
    }

    // Se temos um UUID válido
    if (isValidUUID(rawId)) {
      const { error: updateError } = await supabase
        .from('ml_radar_deals')
        .update({
          is_featured: targetIsFeatured,
          ...(dealData.description ? { description: dealData.description } : {}),
          ...(dealData.category ? { category: dealData.category } : {}),
        })
        .eq('id', rawId);

      // Sempre sincroniza gemini_analysis para garantir compatibilidade se a coluna is_featured ainda não existir
      try {
        const { data: existingDeal } = await supabase
          .from('ml_radar_deals')
          .select('gemini_analysis')
          .eq('id', rawId)
          .maybeSingle();

        const existingAnalysis = existingDeal?.gemini_analysis || {};
        existingAnalysis.is_featured = targetIsFeatured;

        await supabase
          .from('ml_radar_deals')
          .update({ gemini_analysis: existingAnalysis })
          .eq('id', rawId);
      } catch (analysisErr) {
        console.warn('[Featured Deal] Aviso ao sincronizar gemini_analysis:', analysisErr);
      }

      invalidateShowcaseCache();

      return NextResponse.json({
        success: true,
        dealId: rawId,
        is_featured: targetIsFeatured,
      });
    }

    // Se o ID não é um UUID (ex: render-xxx, virtual-xxx ou produto recém-encontrado)
    // Verifica se já existe um registro correspondente no Supabase pela URL do produto
    let existingByUrl: any = null;
    if (cleanUrl) {
      const { data } = await supabase
        .from('ml_radar_deals')
        .select('id, gemini_analysis')
        .eq('product_url', cleanUrl)
        .maybeSingle();

      existingByUrl = data;
    }

    if (existingByUrl && isValidUUID(existingByUrl.id)) {
      const realId = existingByUrl.id;

      await supabase
        .from('ml_radar_deals')
        .update({ is_featured: targetIsFeatured })
        .eq('id', realId);

      const analysis = existingByUrl.gemini_analysis || {};
      analysis.is_featured = targetIsFeatured;
      await supabase
        .from('ml_radar_deals')
        .update({ gemini_analysis: analysis })
        .eq('id', realId);

      invalidateShowcaseCache();

      return NextResponse.json({
        success: true,
        dealId: realId,
        is_featured: targetIsFeatured,
      });
    }

    // Caso NÃO exista registro no Supabase e queremos DESTACAR na vitrine:
    // Persistimos o produto agora no banco de dados com is_featured = true
    if (targetIsFeatured) {
      const insertPayload: any = {
        title: dealData.title || dealData.source_title || 'Oferta em Destaque',
        price: Number(dealData.price || dealData.source_price || 0),
        original_price: dealData.original_price || dealData.source_original_price ? Number(dealData.original_price || dealData.source_original_price) : null,
        image_url: dealData.image_url || dealData.source_image_url || dealData.imageUrl || null,
        product_url: cleanUrl || dealData.product_url || '',
        store: dealData.store || dealData.site_name || 'Amazon Brasil',
        ml_title: dealData.ml_title || null,
        ml_price: dealData.ml_price ? Number(dealData.ml_price) : null,
        ml_url: dealData.ml_url || null,
        ml_image_url: dealData.ml_image_url || null,
        net_profit: dealData.net_profit ? Number(dealData.net_profit) : null,
        roi_percent: dealData.roi_percent ? Number(dealData.roi_percent) : null,
        margin_percent: dealData.margin_percent ? Number(dealData.margin_percent) : null,
        verdict: dealData.verdict || 'Viável',
        status: 'completed',
        is_featured: true,
        description: dealData.description || null,
        category: dealData.category || null,
        gemini_analysis: {
          ...(dealData.gemini_analysis || {}),
          is_featured: true,
        },
      };

      const targetUserId = body.userId || userId || dealData.userId || dealData.user_id;
      let finalUserId: string | null = isValidUUID(targetUserId) ? targetUserId : null;

      if (!finalUserId) {
        const { data: firstAdmin } = await supabase
          .from('profiles')
          .select('id')
          .limit(1)
          .maybeSingle();

        if (firstAdmin?.id && isValidUUID(firstAdmin.id)) {
          finalUserId = firstAdmin.id;
        }
      }

      if (!finalUserId) {
        // Tenta recuperar qualquer user_id válido já registrado em ml_radar_deals
        const { data: existingDealUser } = await supabase
          .from('ml_radar_deals')
          .select('user_id')
          .limit(1)
          .maybeSingle();

        if (existingDealUser?.user_id && isValidUUID(existingDealUser.user_id)) {
          finalUserId = existingDealUser.user_id;
        }
      }

      if (finalUserId) {
        insertPayload.user_id = finalUserId;
      }

      const { data: inserted, error: insertError } = await supabase
        .from('ml_radar_deals')
        .insert(insertPayload)
        .select()
        .single();

      if (insertError) {
        console.warn('[Featured Deal] Falha ao inserir com colunas estendidas, tentando payload padrão:', insertError.message);
        // Fallback sem colunas que possam não existir na tabela ainda
        const fallbackPayload = { ...insertPayload };
        delete fallbackPayload.is_featured;
        delete fallbackPayload.description;
        delete fallbackPayload.category;

        const { data: fallbackInserted, error: fallbackError } = await supabase
          .from('ml_radar_deals')
          .insert(fallbackPayload)
          .select()
          .single();

        if (fallbackError) {
          console.warn('[Featured Deal] Aviso ao persistir no Supabase (mantendo oferta na vitrine via memoria):', fallbackError.message);
          invalidateShowcaseCache();
          return NextResponse.json({
            success: true,
            dealId: rawId || `featured-${Date.now()}`,
            is_featured: true,
            note: 'Salvo em memoria da vitrine com sucesso',
          });
        }

        invalidateShowcaseCache();
        return NextResponse.json({
          success: true,
          dealId: fallbackInserted?.id || rawId,
          is_featured: true,
        });
      }

      invalidateShowcaseCache();
      return NextResponse.json({
        success: true,
        dealId: inserted?.id || rawId,
        is_featured: true,
      });
    }

    // Caso NÃO exista registro no Supabase e queremos REMOVER da vitrine:
    removeDealFromShowcaseMemory(rawId, cleanUrl || dealData.product_url);
    invalidateShowcaseCache();
    return NextResponse.json({
      success: true,
      dealId: rawId,
      is_featured: false,
    });
  } catch (err: any) {
    console.error('[API Featured Deal] Erro ao alternar destaque na vitrine:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
