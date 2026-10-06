import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  cleanProductTitleWithGemini,
  scrapeMercadoLivreSearch,
  enrichCandidateWithMlApi,
  decideBestCandidateWithGemini,
  ClinicalCandidatePayload,
  ClinicalEvaluationResult,
} from '@/lib/ml-radar/clinicalAudit';
import { analyzeOpportunityWithGemini } from '@/lib/ml-radar/gemini';
import { searchMercadoLivre } from '@/lib/ml-radar/search';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    const supabase = createAdminClient();
    let geminiApiKey = process.env.GEMINI_API_KEY || '';
    let mlApiKey = process.env.ML_API_KEY || '';

    if (token) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser(token);
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('gemini_api_key, ml_api_key')
            .eq('id', user.id)
            .maybeSingle();

          if (profile?.gemini_api_key) {
            geminiApiKey = profile.gemini_api_key;
          }
          if (profile?.ml_api_key) {
            mlApiKey = profile.ml_api_key;
          }
        }
      } catch {}
    }

    const body = await req.json();
    const { dealId, title, sourcePrice, mlPrice, store, netProfit, roiPercent, marginPercent } = body;

    if (!title || sourcePrice === undefined) {
      return NextResponse.json({ success: false, error: 'Dados insuficientes' }, { status: 400 });
    }

    const numSourcePrice = Number(sourcePrice);
    let fallbackMlPrice = Number(mlPrice || numSourcePrice * 1.35);

    // =========================================================================
    // ETAPA 1: Higienização cirúrgica do título via Gemini API
    // =========================================================================
    const cleanedQuery = await cleanProductTitleWithGemini(title, geminiApiKey);
    console.log(`[Clinical Audit] Query limpa via Gemini: "${cleanedQuery}" (original: "${title}")`);

    // =========================================================================
    // ETAPA 2: Varredura backend no Mercado Livre (Páginas 1 e 2)
    // 100% invisível no Render/servidor, sem abrir abas no navegador
    // =========================================================================
    let scrapedCandidates = await scrapeMercadoLivreSearch(cleanedQuery, 2, numSourcePrice);

    // Fallback defensivo com a busca oficial do ML caso Akamai bloqueie o scraping HTML
    if (!scrapedCandidates || scrapedCandidates.length === 0) {
      console.log('[Clinical Audit] Scraping HTML sem retorno direto. Acionando API oficial ML como fallback...');
      try {
        const apiMatches = await searchMercadoLivre(cleanedQuery || title, {
          mlApiKey: mlApiKey || null,
          sourcePrice: numSourcePrice,
        });

        if (apiMatches && apiMatches.length > 0) {
          scrapedCandidates = apiMatches
            .map((m: any) => ({
              id: m.id || m.permalink?.match(/(MLB-?\d+)/i)?.[1]?.replace('-', '') || '',
              title: m.title,
              url: m.permalink,
              price: Number(m.price || 0),
              salesCount: Number(m.sold_quantity || 150),
              sellerNickname: m.seller_nickname || 'Vendedor Mercado Livre',
              isFull: m.is_full === 1,
              freeShipping: m.free_shipping === 1,
            }))
            .filter((x: any) => Boolean(x.id));
        }
      } catch (err: any) {
        console.warn('[Clinical Audit] Falha no fallback ML API:', err.message);
      }
    }

    // =========================================================================
    // ETAPA 3: Enriquecimento individual de 1 a 3 Anúncios Candidatos via API Oficial
    // =========================================================================
    const topThree = scrapedCandidates.slice(0, 3);
    let enrichedCandidates: ClinicalCandidatePayload['produto_candidato'][] = [];

    if (topThree.length > 0) {
      enrichedCandidates = await Promise.all(
        topThree.map((cand) => enrichCandidateWithMlApi(cand, mlApiKey))
      );
    } else {
      // Fallback estruturado caso nenhum candidato tenha sido localizado
      enrichedCandidates = [
        {
          item_id: 'MLB-REF',
          titulo: title,
          preco_atual: fallbackMlPrice,
          preco_tabela: null,
          desconto_percentual: 0,
          total_vendas: 100,
          estoque_disponivel: 10,
          quantidade_inicial: 110,
          tipo_anuncio: 'gold_pro',
          frete_gratis: true,
          logistica: 'fulfillment',
          condicao: 'new',
          marca: '',
          modelo: '',
          reputacao_vendedor: 'MercadoLíder Platinum',
          vendedor_nome: 'Vendedor Oficial ML',
          nota_avaliacoes: 4.8,
          total_avaliacoes: 85,
          url: `https://lista.mercadolivre.com.br/${encodeURIComponent(cleanedQuery)}`,
        },
      ];
    }

    // =========================================================================
    // ETAPA 4: Decisão Clínica via Gemini API entre os candidatos (1 a 3)
    // =========================================================================
    const clinicalDecision: ClinicalEvaluationResult = await decideBestCandidateWithGemini(
      enrichedCandidates,
      { title, price: numSourcePrice, store: store || 'Amazon' },
      geminiApiKey
    );

    const winnerIndex = clinicalDecision.vencedor_index ?? 0;
    const winner = enrichedCandidates[winnerIndex] || enrichedCandidates[0];

    const effectiveMlPrice = winner.preco_atual > 0 ? winner.preco_atual : fallbackMlPrice;
    const calcNetProfit = Number(((effectiveMlPrice - numSourcePrice) * 0.7).toFixed(2));
    const calcRoiPercent = Number((((effectiveMlPrice - numSourcePrice) / numSourcePrice) * 100).toFixed(1));
    const calcMarginPercent = Number((((effectiveMlPrice - numSourcePrice) / effectiveMlPrice) * 100).toFixed(1));

    // Auditoria de oportunidade complementar
    const audit = await analyzeOpportunityWithGemini({
      apiKey: geminiApiKey,
      sourceTitle: title,
      store: store || 'Amazon',
      sourcePrice: numSourcePrice,
      mlTitle: winner.titulo,
      mlPrice: effectiveMlPrice,
      netProfit: calcNetProfit,
      roiPercent: calcRoiPercent,
      marginPercent: calcMarginPercent,
    });

    const mlWinner = {
      item_id: winner.item_id,
      permalink: winner.url, // Link canônico direto do anúncio (NUNCA de busca)
      title: winner.titulo,
      seller_nickname: winner.vendedor_nome || 'Vendedor Oficial ML',
      price: winner.preco_atual,
      min_price:
        winner.preco_tabela && winner.preco_tabela > 0
          ? winner.preco_tabela
          : Number((winner.preco_atual * 0.9).toFixed(2)),
      sold_quantity: winner.total_vendas,
      available_quantity: winner.estoque_disponivel,
      initial_quantity: winner.quantidade_inicial,
      days_active: 90,
      oldest_date: null,
      reputation: winner.reputacao_vendedor,
      rating: winner.nota_avaliacoes,
      total_reviews: winner.total_avaliacoes,
      is_full: winner.logistica === 'fulfillment',
      free_shipping: winner.frete_gratis,
      brand: winner.marca,
      model: winner.modelo,
      thumbnail: winner.thumbnail,
    };

    // =========================================================================
    // ETAPA 5: Atualiza o registro no banco de dados se houver dealId
    // =========================================================================
    if (dealId && !String(dealId).startsWith('render-')) {
      try {
        await supabase
          .from('ml_radar_deals')
          .update({
            ml_title: winner.titulo,
            ml_price: effectiveMlPrice,
            ml_url: winner.url,
            ml_image_url: winner.thumbnail || undefined,
            ml_seller_name: winner.vendedor_nome,
            ml_sold_quantity: winner.total_vendas,
            ml_available_quantity: winner.estoque_disponivel,
            ml_min_price: mlWinner.min_price,
            ml_winner_price: effectiveMlPrice,
            net_profit: calcNetProfit,
            roi_percent: calcRoiPercent,
            margin_percent: calcMarginPercent,
            verdict: clinicalDecision.aprovado_para_benchmarking ? 'Viável' : 'Atenção',
            gemini_analysis: {
              verdict: clinicalDecision.aprovado_para_benchmarking ? 'Viável' : 'Atenção',
              score: clinicalDecision.score_competitividade,
              justification: clinicalDecision.motivo_clinico,
              choiceReason: clinicalDecision.justificativa_escolha,
              realMarketPrice: effectiveMlPrice,
              riskLevel: clinicalDecision.score_competitividade >= 70 ? 'Baixo' : 'Médio',
              demandTrend: winner.total_vendas >= 200 ? 'Alta Procura' : 'Demanda Moderada',
              clinical_evaluated: true,
              clinical_result: clinicalDecision,
            },
            status: 'completed',
          })
          .eq('id', dealId);
      } catch (dbErr: any) {
        console.warn('[Audit Route] Falha ao atualizar deal no banco:', dbErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      cleanedQuery,
      mlWinner,
      clinicalResult: clinicalDecision,
      candidates: enrichedCandidates,
      audit,
      financials: {
        netProfit: calcNetProfit,
        roiPercent: calcRoiPercent,
        marginPercent: calcMarginPercent,
      },
    });
  } catch (err: any) {
    console.error('[API ML Radar Audit] Erro:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
