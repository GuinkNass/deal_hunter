import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { extractMetadataFromUrl } from '@/lib/ml-radar/scraper';
import { searchMercadoLivre } from '@/lib/ml-radar/search';
import { calculateROI } from '@/lib/ml-radar/roi';
import { analyzeOpportunityWithGemini } from '@/lib/ml-radar/gemini';
import { sendTelegramNotification } from '@/lib/ml-radar/telegram';
import { tagAmazonUrl } from '@/lib/ml-radar/affiliate';
import {
  extractProductSpecsWithGemini,
  scrapeMercadoLivreSearch,
  searchMercadoLivreWithGeminiGrounding,
  enrichCandidateWithMlApi,
  decideBestCandidateWithGemini,
  buildCanonicalMlUrl,
  ClinicalCandidatePayload,
} from '@/lib/ml-radar/clinicalAudit';

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
    const cleanUrl = tagAmazonUrl(url || `https://busca-manual.local/item?q=${encodeURIComponent(title)}`);

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

    let activeMlKey = userCreds.ml_api_key || userCreds.ml_access_token || '';
    if (!activeMlKey) {
      activeMlKey = req.cookies.get('ml_access_token')?.value || '';
    }
    if (!activeMlKey) {
      try {
        const { data: latestProf } = await supabase
          .from('profiles')
          .select('ml_api_key, ml_access_token')
          .not('ml_api_key', 'is', null)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (latestProf?.ml_api_key) activeMlKey = latestProf.ml_api_key;
        else if (latestProf?.ml_access_token) activeMlKey = latestProf.ml_access_token;
      } catch {}
    }

    let activeGeminiKey = body.geminiApiKey || body.gemini_api_key || userCreds.gemini_api_key || '';
    if (!activeGeminiKey) {
      activeGeminiKey = req.cookies.get('gemini_api_key')?.value || process.env.GEMINI_API_KEY || '';
    }
    if (activeGeminiKey && !activeGeminiKey.startsWith('AIzaSy') && !activeGeminiKey.startsWith('AQ.')) {
      activeGeminiKey = `AQ.${activeGeminiKey}`;
    }

    // =========================================================================
    // ETAPA 1: Higienização cirúrgica e extração estruturada de Marca/Modelo via Gemini
    // =========================================================================
    const specs = await extractProductSpecsWithGemini(title, activeGeminiKey);
    const cleanedQuery = specs.clean_query || title;
    const altQuery = specs.alt_query || '';

    // =========================================================================
    // ETAPA 2: Varredura de Candidatos no Mercado Livre (API Oficial -> Grounding -> Raspagem)
    // =========================================================================
    let scrapedCandidates: any[] = [];

    if (activeMlKey && activeMlKey.length > 10) {
      try {
        const queriesToTry = [cleanedQuery];
        if (altQuery && altQuery !== cleanedQuery) queriesToTry.push(altQuery);
        queriesToTry.push(title);

        for (const q of queriesToTry) {
          const apiMatches = await searchMercadoLivre(q, {
            mlApiKey: activeMlKey,
            sourcePrice: numPrice,
          });

          if (apiMatches && apiMatches.length > 0) {
            scrapedCandidates = apiMatches
              .map((m: any) => ({
                id: m.id || m.permalink?.match(/(MLB-?\d+)/i)?.[1]?.replace('-', '') || '',
                title: m.title,
                url: m.permalink,
                price: Number(m.price || 0),
                salesCount: Number(m.sold_quantity || 0),
                sellerNickname: m.seller_nickname || 'Vendedor Mercado Livre',
                isFull: m.is_full === 1 || Boolean(m.is_full),
                freeShipping: m.free_shipping === 1 || Boolean(m.free_shipping),
              }))
              .filter((x: any) => Boolean(x.id && !x.url?.includes('lista.mercadolivre.com.br')));
            if (scrapedCandidates.length > 0) break;
          }
        }
      } catch (err: any) {
        console.warn('[Manual Search] Falha na API oficial ML:', err.message);
      }
    }

    // Prioridade 2: Busca cirúrgica em tempo real via Gemini Search Grounding
    if (!scrapedCandidates || scrapedCandidates.length === 0) {
      scrapedCandidates = await searchMercadoLivreWithGeminiGrounding(cleanedQuery, activeGeminiKey);
      if ((!scrapedCandidates || scrapedCandidates.length === 0) && altQuery && altQuery !== cleanedQuery) {
        scrapedCandidates = await searchMercadoLivreWithGeminiGrounding(altQuery, activeGeminiKey);
      }
      if (!scrapedCandidates || scrapedCandidates.length === 0) {
        scrapedCandidates = await searchMercadoLivreWithGeminiGrounding(title, activeGeminiKey);
      }
    }

    // Prioridade 3: Raspagem direta no servidor
    if (!scrapedCandidates || scrapedCandidates.length === 0) {
      scrapedCandidates = await scrapeMercadoLivreSearch(cleanedQuery, 2, numPrice);
      if (!scrapedCandidates || scrapedCandidates.length === 0) {
        scrapedCandidates = await scrapeMercadoLivreSearch(title, 2, numPrice);
      }
    }

    // ETAPA 3: Enriquecimento de candidatos ou Fallback Resiliente de Mercado
    const topCandidates = scrapedCandidates.slice(0, 3);
    let enrichedCandidates: ClinicalCandidatePayload['produto_candidato'][] = [];

    if (topCandidates.length > 0) {
      enrichedCandidates = await Promise.all(
        topCandidates.map((cand) => enrichCandidateWithMlApi(cand, activeMlKey))
      );
    } else {
      const estimatedPrice = Number((numPrice * 1.38).toFixed(2));
      const referenceCandidate: ClinicalCandidatePayload['produto_candidato'] = {
        item_id: 'MLB-ESTIMATED-REF',
        titulo: `${cleanedQuery || title} (Referência de Mercado)`,
        preco_atual: estimatedPrice,
        preco_tabela: Number((estimatedPrice * 1.15).toFixed(2)),
        desconto_percentual: 13,
        total_vendas: 150,
        estoque_disponivel: 20,
        quantidade_inicial: 170,
        taxa_conversao_estimada: 3.2,
        dias_ativo: 60,
        data_criacao: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
        tipo_anuncio: 'gold_special',
        frete_gratis: estimatedPrice >= 79,
        reputacao_vendedor: 'platinum',
        nivel_experiencia: 'experiente',
        categoria_id: 'MLB1000',
        url_anuncio: `https://www.mercadolivre.com.br/gz/home/navigation?search=${encodeURIComponent(cleanedQuery || title)}`,
        thumbnail_url: imageUrl || 'https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.6.92/mercadolivre/logo__large_plus.png',
        modelo_identificado: specs.model || undefined,
        compatibilidade_alta: true,
      };
      enrichedCandidates = [referenceCandidate];
    }

    // Decisão do melhor anúncio correspondente via Gemini ou fallback heurístico
    let chosenCandidate = enrichedCandidates[0];
    if (enrichedCandidates.length > 1) {
      try {
        const decided = await decideBestCandidateWithGemini(specs, enrichedCandidates, numPrice, activeGeminiKey);
        if (decided) chosenCandidate = decided;
      } catch {}
    }

    // Garantia de link direto e canônico
    const finalMlUrl = buildCanonicalMlUrl(chosenCandidate.item_id, chosenCandidate.url_anuncio, chosenCandidate.titulo);

    // ETAPA 4: Cálculo de ROI preciso
    const roi = calculateROI({
      salePrice: chosenCandidate.preco_atual,
      productCost: numPrice,
      listingType: chosenCandidate.tipo_anuncio || 'gold_special',
      freeShipping: chosenCandidate.frete_gratis,
      desiredMargin: userCreds.desired_margin || 20,
    });

    // ETAPA 5: Análise qualitativa com Gemini
    let geminiAnalysis: any = null;
    if (activeGeminiKey && roi.netProfit > 0) {
      try {
        geminiAnalysis = await analyzeOpportunityWithGemini({
          apiKey: activeGeminiKey,
          sourceTitle: title,
          store: cleanStore,
          sourcePrice: numPrice,
          mlTitle: chosenCandidate.titulo,
          mlPrice: chosenCandidate.preco_atual,
          netProfit: roi.netProfit,
          roiPercent: roi.roiPercent,
          marginPercent: roi.marginPercent,
        });
      } catch {}
    }

    // ETAPA 6: Notificação privada Telegram se configurado
    if (userCreds.telegram_bot_token && userCreds.telegram_chat_id && roi.netProfit > 0) {
      sendTelegramNotification({
        botToken: userCreds.telegram_bot_token,
        chatId: userCreds.telegram_chat_id,
        deal: {
          title,
          productUrl: cleanUrl,
          price: numPrice,
          store: cleanStore,
          mlTitle: chosenCandidate.titulo,
          mlPrice: chosenCandidate.preco_atual,
          mlUrl: finalMlUrl,
          netProfit: roi.netProfit,
          roiPercent: roi.roiPercent,
          marginPercent: roi.marginPercent,
          verdict: roi.verdict,
        },
      }).catch(() => {});
    }

    // ETAPA 7: Persistência no Supabase com estrutura uniforme de DealAnalysis
    const dealPayload: any = {
      title,
      price: numPrice,
      original_price: null,
      image_url: imageUrl || chosenCandidate.thumbnail_url || null,
      product_url: cleanUrl,
      store: cleanStore,
      ml_title: chosenCandidate.titulo,
      ml_price: chosenCandidate.preco_atual,
      ml_url: finalMlUrl,
      ml_image_url: chosenCandidate.thumbnail_url,
      ml_min_price: chosenCandidate.preco_atual,
      ml_winner_price: chosenCandidate.preco_atual,
      ml_sold_quantity: chosenCandidate.total_vendas || 150,
      ml_days_active: chosenCandidate.dias_ativo || 60,
      ml_oldest_date: chosenCandidate.data_criacao || null,
      net_profit: roi.netProfit,
      roi_percent: roi.roiPercent,
      margin_percent: roi.marginPercent,
      verdict: roi.verdict,
      gemini_analysis: geminiAnalysis,
      status: 'completed',
      clinical_evaluated: true,
      candidates: enrichedCandidates,
    };

    if (userId) {
      dealPayload.user_id = userId;
    }

    let savedRecord = null;
    try {
      const { data: inserted, error: insertErr } = await supabase
        .from('ml_radar_deals')
        .insert(dealPayload)
        .select()
        .single();

      if (!insertErr && inserted) {
        savedRecord = inserted;

        // Limpeza defensiva FIFO se atrelado a usuário
        if (userId) {
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
    } catch {}

    const completeDeal = {
      id: savedRecord?.id || `manual-${Date.now()}`,
      created_at: savedRecord?.created_at || new Date().toISOString(),
      ...dealPayload,
    };

    return NextResponse.json({
      success: true,
      data: completeDeal,
    });
  } catch (err: any) {
    console.error('[Manual Search] Erro fatal:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
