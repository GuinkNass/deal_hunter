import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { extractMetadataFromUrl } from '@/lib/ml-radar/scraper';
import { searchMercadoLivre } from '@/lib/ml-radar/search';
import { calculateROI } from '@/lib/ml-radar/roi';
import { analyzeOpportunityWithGemini } from '@/lib/ml-radar/gemini';
import { sendTelegramNotification } from '@/lib/ml-radar/telegram';

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
    let { title, url, price, store, imageUrl } = body;

    if (!userId && body.userId) {
      userId = body.userId;
    }

    if (!userId) {
      const { data: firstAdmin } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
      if (firstAdmin) userId = firstAdmin.id;
    }

    // 1. Enriquecimento via URL se fornecida
    if (url && url.startsWith('http')) {
      try {
        const scraped = await extractMetadataFromUrl(url);
        if (scraped) {
          if (!title) title = scraped.title;
          if ((price === undefined || price === null || price === '') && scraped.price) price = scraped.price;
          if (!imageUrl && scraped.imageUrl) imageUrl = scraped.imageUrl;
          if ((!store || store === 'Online' || store === 'Busca Manual') && scraped.store) store = scraped.store;
        }
      } catch {}
    }

    if (!title || price === undefined || price === null || isNaN(Number(price))) {
      return NextResponse.json(
        { success: false, error: 'Informe o título do produto (ou uma URL válida) e o preço de custo.' },
        { status: 400 }
      );
    }

    const numPrice = Number(price);
    const cleanStore = store || 'Busca Manual';
    const cleanUrl = url || `https://busca-manual.local/item?q=${encodeURIComponent(title)}`;

    // 2. Busca credenciais do usuário
    let userCreds: any = {};
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (profile) userCreds = profile;
    }

    // 3. Busca no Mercado Livre
    const candidates = await searchMercadoLivre(title, {
      mlApiKey: userCreds.ml_api_key,
      sourcePrice: numPrice,
      imageUrl,
    });

    if (!candidates || candidates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhum anúncio correspondente encontrado no Mercado Livre.' },
        { status: 404 }
      );
    }

    const bestMl = candidates[0];

    // 4. Cálculo de ROI
    const roi = calculateROI({
      salePrice: bestMl.price,
      productCost: numPrice,
      listingType: bestMl.listing_type_id,
      freeShipping: bestMl.free_shipping,
      desiredMargin: userCreds.desired_margin || 20,
    });

    // 5. Análise com Google Gemini (sob demanda com prompt minificado)
    let geminiAnalysis: any = null;
    const geminiKey = userCreds.gemini_api_key || process.env.GEMINI_API_KEY || '';
    if (geminiKey && roi.netProfit > 0) {
      geminiAnalysis = await analyzeOpportunityWithGemini({
        apiKey: geminiKey,
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

    // 6. Notificação privada Telegram se configurado
    if (userCreds.telegram_bot_token && userCreds.telegram_chat_id && roi.netProfit > 0) {
      sendTelegramNotification({
        botToken: userCreds.telegram_bot_token,
        chatId: userCreds.telegram_chat_id,
        deal: {
          title,
          productUrl: cleanUrl,
          price: numPrice,
          store: cleanStore,
          mlTitle: bestMl.title,
          mlPrice: bestMl.price,
          mlUrl: bestMl.permalink,
          netProfit: roi.netProfit,
          roiPercent: roi.roiPercent,
          marginPercent: roi.marginPercent,
          verdict: roi.verdict,
        },
      }).catch(() => {});
    }

    // 7. Salva na tabela ml_radar_deals com retenção FIFO de 100 itens
    let savedRecord = null;
    if (userId) {
      const { data: inserted, error: insertErr } = await supabase
        .from('ml_radar_deals')
        .insert({
          user_id: userId,
          title,
          price: numPrice,
          original_price: null,
          image_url: imageUrl || bestMl.thumbnail || null,
          product_url: cleanUrl,
          store: cleanStore,
          ml_title: bestMl.title,
          ml_price: bestMl.price,
          ml_url: bestMl.permalink,
          ml_image_url: bestMl.thumbnail,
          ml_min_price: bestMl.min_price || null,
          ml_winner_price: bestMl.winner_price || bestMl.price,
          ml_sold_quantity: bestMl.sold_quantity || 1500,
          ml_days_active: bestMl.days_active || 85,
          ml_oldest_date: bestMl.oldest_date || null,
          net_profit: roi.netProfit,
          roi_percent: roi.roiPercent,
          margin_percent: roi.marginPercent,
          verdict: roi.verdict,
          gemini_analysis: geminiAnalysis,
          status: 'completed',
        })
        .select()
        .single();

      if (!insertErr && inserted) {
        savedRecord = inserted;

        // Limpeza defensiva FIFO
        try {
          const { data: toRemove } = await supabase
            .from('ml_radar_deals')
            .select('id')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(100, 200);

          if (toRemove && toRemove.length > 0) {
            await supabase
              .from('ml_radar_deals')
              .delete()
              .in('id', toRemove.map((r: any) => r.id));
          }
        } catch {}
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...(savedRecord || {}),
        title,
        price: numPrice,
        productUrl: cleanUrl,
        store: cleanStore,
        mlMatch: bestMl,
        roi,
        gemini_analysis: geminiAnalysis,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
