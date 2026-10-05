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

    // 1. Busca credenciais individuais do usuário (profiles)
    let userCredentials: {
      gemini_api_key?: string | null;
      ml_api_key?: string | null;
      telegram_bot_token?: string | null;
      telegram_chat_id?: string | null;
    } = {};

    let targetUserId = userId;

    if (targetUserId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, gemini_api_key, ml_api_key, telegram_bot_token, telegram_chat_id')
        .eq('id', targetUserId)
        .maybeSingle();

      if (profile) {
        userCredentials = profile;
      }
    }

    // Se nenhum userId válido foi encontrado no banco, tenta buscar admin ou primeiro usuário
    if (!userCredentials.gemini_api_key && !userCredentials.telegram_bot_token) {
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('id, gemini_api_key, ml_api_key, telegram_bot_token, telegram_chat_id')
        .eq('role', 'admin')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (adminProfile) {
        if (!targetUserId) targetUserId = adminProfile.id;
        userCredentials = adminProfile;
      }
    }

    // 2. Busca anúncios correspondentes no Mercado Livre
    const mlCandidates = await searchMercadoLivre(title, {
      mlApiKey: userCredentials.ml_api_key,
      sourcePrice: numPrice,
      imageUrl,
    });

    const bestMl = mlCandidates[0];

    // 3. Calcula ROI e viabilidade financeira
    const roi = calculateROI({
      salePrice: bestMl.price,
      productCost: numPrice,
      listingType: bestMl.listing_type_id,
      freeShipping: bestMl.free_shipping,
    });

    // 4. Se for elegível ("ótima oportunidade" com lucro positivo):
    //    - Chama Gemini sob demanda com tokens otimizados
    //    - Dispara notificação Telegram se configurado
    let geminiAnalysis: any = null;
    let telegramAlertSent = false;

    const isGoodOpportunity = roi.netProfit > 0 && roi.roiPercent >= 15;

    if (isGoodOpportunity) {
      // 4.1 Chamada sob demanda ao Google Gemini com chave do usuário
      const geminiApiKey = userCredentials.gemini_api_key || process.env.GEMINI_API_KEY || '';
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

      // 4.2 Disparo Telegram privado se usuário configurou
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
            verdict: roi.verdict,
          },
        });
        telegramAlertSent = tgRes.ok;
      }
    }

    // 5. Salva na tabela ml_radar_deals (Supabase)
    let savedDeal = null;
    if (targetUserId) {
      const { data: insertedDeal, error: dbError } = await supabase
        .from('ml_radar_deals')
        .insert({
          user_id: targetUserId,
          title,
          price: numPrice,
          original_price: numOriginalPrice,
          image_url: imageUrl || bestMl.thumbnail || null,
          product_url: cleanProductUrl,
          store: cleanStore,
          ml_title: bestMl.title,
          ml_price: bestMl.price,
          ml_url: bestMl.permalink,
          ml_image_url: bestMl.thumbnail,
          net_profit: roi.netProfit,
          roi_percent: roi.roiPercent,
          margin_percent: roi.marginPercent,
          verdict: roi.verdict,
          gemini_analysis: geminiAnalysis,
          status: 'completed',
        })
        .select()
        .single();

      if (!dbError && insertedDeal) {
        savedDeal = insertedDeal;

        // Regra de retenção FIFO: remove itens além dos 100 mais recentes deste usuário
        try {
          const { data: oldestDeals } = await supabase
            .from('ml_radar_deals')
            .select('id')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false })
            .range(100, 200);

          if (oldestDeals && oldestDeals.length > 0) {
            const idsToDelete = oldestDeals.map((d: any) => d.id);
            await supabase.from('ml_radar_deals').delete().in('id', idsToDelete);
          }
        } catch {
          // Trigger no banco também gerencia FIFO
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: savedDeal?.id,
        title,
        price: numPrice,
        productUrl: cleanProductUrl,
        store: cleanStore,
        mlMatch: bestMl,
        roi,
        geminiAnalysis,
        telegramAlertSent,
      },
    });
  } catch (err: any) {
    console.error('[API ML Radar Ingest] Erro:', err);
    return NextResponse.json(
      { error: err.message || 'Erro interno ao processar ingestão' },
      { status: 500 }
    );
  }
}
