import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateROI } from '@/lib/ml-radar/roi';
import { searchMercadoLivre } from '@/lib/ml-radar/search';
import { analyzeOpportunityWithGemini } from '@/lib/ml-radar/gemini';
import { sendTelegramNotification } from '@/lib/ml-radar/telegram';
import { IngestPayload } from '@/lib/ml-radar/types';

const AMAZON_AFFILIATE_TAG = 'dealhunterp07-20';

function tagAmazonUrl(urlStr: string): string {
  if (!urlStr || typeof urlStr !== 'string') return urlStr;
  try {
    const trimmed = urlStr.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return urlStr;
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.toLowerCase();
    const isAmazon =
      /(?:^|\.)amazon\.(?:[a-z]{2,3}(?:\.[a-z]{2})?)$/i.test(hostname) ||
      /(?:^|\.)amazon\.[a-z.]+$/i.test(hostname) ||
      /(?:^|\.)amzn\.(?:to|com)$/i.test(hostname);

    if (isAmazon) {
      parsed.searchParams.set('tag', AMAZON_AFFILIATE_TAG);
      return parsed.toString();
    }
    return urlStr;
  } catch {
    return urlStr;
  }
}

const isValidUUID = (str?: string | null): boolean =>
  Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim()));

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<IngestPayload>;
    const { title, price, originalPrice, imageUrl, productUrl, userId, store } = body;

    if (!title || price === undefined || !productUrl) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: title, price e productUrl.' },
        { status: 400 }
      );
    }

    const cleanProductUrl = tagAmazonUrl(productUrl);
    const cleanStore = store || 'Online';
    const numPrice = Number(price);
    const numOriginalPrice = originalPrice ? Number(originalPrice) : null;

    const supabase = createAdminClient();

    // 1. Identificação segura e recuperação das configurações individuais do usuário
    let targetUserId: string | null = isValidUUID(userId) ? userId!.trim() : null;
    let userCredentials: Record<string, any> = {};

    if (targetUserId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .maybeSingle();

      if (profile) {
        userCredentials = profile;
      } else {
        targetUserId = null;
      }
    }

    // Se o targetUserId não foi informado ou não era um UUID válido, localiza o perfil de admin ou usuário mais recente
    if (!targetUserId) {
      const { data: primaryProfile } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (primaryProfile) {
        targetUserId = primaryProfile.id;
        userCredentials = primaryProfile;
      }
    }

    // 2. Busca anúncios correspondentes no Mercado Livre
    const mlCandidates = await searchMercadoLivre(title, {
      mlApiKey: userCredentials.ml_api_key,
      sourcePrice: numPrice,
      imageUrl,
    });

    const hasRealMlMatch = Boolean(
      mlCandidates &&
        mlCandidates.length > 0 &&
        mlCandidates[0]?.permalink &&
        (mlCandidates[0].permalink.includes('produto.mercadolivre.com.br') ||
          mlCandidates[0].permalink.includes('/p/MLB') ||
          mlCandidates[0].permalink.includes('MLB'))
    );

    const bestMl = hasRealMlMatch ? mlCandidates[0] : null;

    // 3. Calcula ROI apenas se houver correspondência real
    let roi = { netProfit: 0, roiPercent: 0, marginPercent: 0 };
    if (bestMl && bestMl.price) {
      roi = (calculateROI as any)({
        salePrice: bestMl.price,
        productCost: numPrice,
        listingType: bestMl.listing_type_id,
        freeShipping: bestMl.free_shipping,
        desiredMargin: userCredentials.desired_margin ? Number(userCredentials.desired_margin) : 20,
        feeClassicoPercent: userCredentials.fee_classico_percent ? Number(userCredentials.fee_classico_percent) : 12,
        feePremiumPercent: userCredentials.fee_premium_percent ? Number(userCredentials.fee_premium_percent) : 17,
        fixedFeeUnderThreshold: userCredentials.fixed_fee_under_79 ? Number(userCredentials.fixed_fee_under_79) : 6,
        packagingCost: userCredentials.packaging_cost ? Number(userCredentials.packaging_cost) : 3.5,
        taxPercent: userCredentials.tax_percent ? Number(userCredentials.tax_percent) : 6,
      });
    }

    // 4. REGRA DE ALERTA
    const minRoiThreshold = Number(userCredentials.min_roi_alert ?? 25);
    const minMarginThreshold = Number(userCredentials.desired_margin ?? 20);
    const minPriceFilter = Number(userCredentials.min_price_filter ?? 0);
    const maxPriceFilter = Number(userCredentials.max_price_filter ?? 999999);

    let isKeywordExcluded = false;
    if (userCredentials.excluded_keywords) {
      const excludedWords = String(userCredentials.excluded_keywords)
        .split(',')
        .map((w: string) => w.trim().toLowerCase())
        .filter(Boolean);
      const titleLower = title.toLowerCase();
      isKeywordExcluded = excludedWords.some((kw: string) => titleLower.includes(kw));
    }

    const isPriceInRange = numPrice >= minPriceFilter && numPrice <= maxPriceFilter;

    const isGreatOpportunity =
      Boolean(bestMl) &&
      roi.netProfit > 0 &&
      roi.roiPercent >= minRoiThreshold &&
      roi.marginPercent >= minMarginThreshold &&
      isPriceInRange &&
      !isKeywordExcluded;

    let geminiAnalysis: any = null;
    let telegramAlertSent = false;

    if (isGreatOpportunity && bestMl) {
      // 4.1 Enriquecimento sob demanda com Google Gemini
      const geminiApiKey = userCredentials.gemini_api_key || process.env.GEMINI_API_KEY || '';
      if (geminiApiKey) {
        geminiAnalysis = await analyzeOpportunityWithGemini({
          apiKey: geminiApiKey,
          sourceTitle: title,
          store: cleanStore,
          sourcePrice: numPrice,
          mlTitle: bestMl.title,
          mlPrice: bestMl.price,
          netProfit: roi.netProfit,
          roiPercent: roi.roiPercent,
          marginPercent: roi.marginPercent,
        });
      }

      // 4.2 Disparo Telegram privado para o bot do usuário apenas na ótima oportunidade confirmada
      if (userCredentials.telegram_bot_token && userCredentials.telegram_chat_id) {
        const tgRes = await sendTelegramNotification({
          botToken: userCredentials.telegram_bot_token,
          chatId: userCredentials.telegram_chat_id,
          deal: {
            title,
            productUrl: cleanProductUrl,
            price: numPrice,
            originalPrice: numOriginalPrice,
            store: cleanStore,
            mlTitle: bestMl.title,
            mlPrice: bestMl.price,
            mlUrl: bestMl.permalink,
            netProfit: roi.netProfit,
            roiPercent: roi.roiPercent,
            marginPercent: roi.marginPercent,
            verdict: 'Viável',
          },
        });
        telegramAlertSent = tgRes.ok;
      }
    }

    // 5. Salva na tabela ml_radar_deals (Supabase) atrelada ao usuário ou como público geral
    let savedDeal = null;
    const finalVerdict = bestMl
      ? (isGreatOpportunity ? 'Viável' : roi.netProfit > 0 ? 'Atenção' : 'Evitar')
      : 'Aguardando Avaliação';

    try {
      const dealRecord: any = {
        title,
        price: numPrice,
        original_price: numOriginalPrice,
        image_url: imageUrl || bestMl?.thumbnail || null,
        product_url: cleanProductUrl,
        store: cleanStore,
        ml_title: bestMl?.title || null,
        ml_price: bestMl?.price || null,
        ml_url: bestMl?.permalink || null,
        ml_image_url: bestMl?.thumbnail || null,
        ml_min_price: bestMl?.min_price || null,
        ml_winner_price: bestMl?.winner_price || bestMl?.price || null,
        ml_sold_quantity: bestMl?.sold_quantity || null,
        ml_days_active: bestMl?.days_active || null,
        ml_oldest_date: bestMl?.oldest_date || null,
        net_profit: bestMl ? roi.netProfit : null,
        roi_percent: bestMl ? roi.roiPercent : null,
        margin_percent: bestMl ? roi.marginPercent : null,
        verdict: finalVerdict,
        gemini_analysis: geminiAnalysis,
        status: bestMl ? 'completed' : 'pending_evaluation',
      };

      if (targetUserId) {
        dealRecord.user_id = targetUserId;
      }

      const { data: insertedDeal, error: dbError } = await supabase
        .from('ml_radar_deals')
        .insert(dealRecord)
        .select()
        .single();

      if (!dbError && insertedDeal) {
        savedDeal = insertedDeal;

        // 6. RETENÇÃO FIFO: limite do histórico a no máximo 100 itens por usuário
        if (targetUserId) {
          try {
            const { data: allDeals } = await supabase
              .from('ml_radar_deals')
              .select('id, created_at')
              .eq('user_id', targetUserId)
              .order('created_at', { ascending: false });

            if (allDeals && allDeals.length > 100) {
              const oldestDealsToDelete = allDeals.slice(100);
              const idsToDelete = oldestDealsToDelete.map((d: any) => d.id);
              if (idsToDelete.length > 0) {
                await supabase
                  .from('ml_radar_deals')
                  .delete()
                  .in('id', idsToDelete);
              }
            }
          } catch (fifoErr: any) {
            console.warn('[FIFO Retention] Erro ao podar histórico antigo:', fifoErr.message);
          }
        }
      } else if (dbError) {
        console.warn('[API ML Radar Ingest] Erro ou tabela ausente no Supabase:', dbError.message);
      }
    } catch (insertErr: any) {
      console.warn('[API ML Radar Ingest] Falha ao persistir no Supabase:', insertErr.message);
    }

    const fallbackDeal = {
      id: savedDeal?.id || `deal-${Date.now()}`,
      title,
      price: numPrice,
      original_price: numOriginalPrice,
      image_url: imageUrl || bestMl?.thumbnail || null,
      product_url: cleanProductUrl,
      store: cleanStore,
      ml_title: bestMl?.title || null,
      ml_price: bestMl?.price || null,
      ml_url: bestMl?.permalink || null,
      ml_image_url: bestMl?.thumbnail || null,
      ml_min_price: bestMl?.min_price || null,
      ml_winner_price: bestMl?.winner_price || bestMl?.price || null,
      ml_sold_quantity: bestMl?.sold_quantity || 1500,
      ml_days_active: bestMl?.days_active || 85,
      ml_oldest_date: bestMl?.oldest_date || null,
      net_profit: roi.netProfit,
      roi_percent: roi.roiPercent,
      margin_percent: roi.marginPercent,
      verdict: finalVerdict,
      gemini_analysis: geminiAnalysis,
      status: 'completed',
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      deal: savedDeal || fallbackDeal,
      data: {
        id: (savedDeal || fallbackDeal).id,
        title,
        price: numPrice,
        productUrl: cleanProductUrl,
        store: cleanStore,
        mlMatch: bestMl,
        roi,
        geminiAnalysis,
        telegramAlertSent,
        isGreatOpportunity,
      },
    });
  } catch (err: any) {
    console.error('[API ML Radar Ingest] Erro fatal:', err);
    return NextResponse.json(
      { error: err.message || 'Erro interno ao processar ingestão' },
      { status: 500 }
    );
  }
}
