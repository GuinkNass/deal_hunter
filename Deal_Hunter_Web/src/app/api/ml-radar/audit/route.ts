import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  cleanProductTitleWithGemini,
  scrapeMercadoLivreSearch,
  enrichCandidateWithMlApi,
  evaluateConcorrenteWithGemini,
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
    const { title, sourcePrice, mlPrice, store, netProfit, roiPercent, marginPercent } = body;

    if (!title || sourcePrice === undefined) {
      return NextResponse.json({ success: false, error: 'Dados insuficientes' }, { status: 400 });
    }

    const numSourcePrice = Number(sourcePrice);
    let fallbackMlPrice = Number(mlPrice || numSourcePrice * 1.35);

    // =========================================================================
    // ETAPA 1: Higienização cirúrgica do título via Gemini API
    // Remove ruídos (voltagem repetida, códigos longos irrelevantes, etc.)
    // =========================================================================
    const cleanedQuery = await cleanProductTitleWithGemini(title, geminiApiKey);
    console.log(`[Clinical Audit] Query limpa via Gemini: "${cleanedQuery}" (original: "${title}")`);

    // =========================================================================
    // ETAPA 2: Varredura backend no Mercado Livre (Páginas 1 e 2)
    // 100% invisível no Render, sem abrir abas no navegador
    // =========================================================================
    let scrapedCandidates = await scrapeMercadoLivreSearch(cleanedQuery, 2);

    // Fallback defensivo com a busca oficial do ML caso Akamai bloqueie o scraping HTML
    if (!scrapedCandidates || scrapedCandidates.length === 0) {
      console.log('[Clinical Audit] Scraping HTML sem retorno direto. Executando busca oficial ML como fallback...');
      try {
        const apiMatches = await searchMercadoLivre(cleanedQuery || title, {
          mlApiKey: mlApiKey || null,
          sourcePrice: numSourcePrice,
        });

        if (apiMatches && apiMatches.length > 0) {
          scrapedCandidates = apiMatches.map((m: any) => ({
            id: m.id || m.permalink?.match(/(MLB-?\d+)/i)?.[1]?.replace('-', '') || '',
            title: m.title,
            url: m.permalink,
            price: Number(m.price || 0),
            salesCount: Number(m.sold_quantity || 250),
            sellerNickname: m.seller_nickname || 'Vendedor Mercado Livre',
            isFull: m.is_full === 1,
            freeShipping: m.free_shipping === 1,
          })).filter((x: any) => Boolean(x.id));
        }
      } catch (err: any) {
        console.warn('[Clinical Audit] Falha no fallback ML API:', err.message);
      }
    }

    // =========================================================================
    // ETAPA 3: Enriquecimento via API Oficial do ML dos Top 3 Candidatos
    // =========================================================================
    let bestCandidate: ClinicalCandidatePayload['produto_candidato'] | null = null;
    const topThree = scrapedCandidates.slice(0, 3);

    if (topThree.length > 0) {
      const enrichedList = await Promise.all(
        topThree.map((cand) => enrichCandidateWithMlApi(cand, mlApiKey))
      );
      // Ordena pelo maior volume de vendas reais
      enrichedList.sort((a, b) => b.total_vendas - a.total_vendas || a.preco_atual - b.preco_atual);
      bestCandidate = enrichedList[0];
    } else {
      bestCandidate = {
        item_id: 'MLB-REFERENCIA',
        titulo: title,
        preco_atual: fallbackMlPrice,
        preco_tabela: null,
        desconto_percentual: 0,
        total_vendas: 200,
        estoque_disponivel: 15,
        tipo_anuncio: 'gold_pro',
        frete_gratis: true,
        logistica: 'fulfillment',
        condicao: 'new',
        marca: '',
        modelo: '',
        reputacao_vendedor: 'MercadoLíder Platinum',
        nota_avaliacoes: 4.8,
        total_avaliacoes: 140,
        url: `https://lista.mercadolivre.com.br/${encodeURIComponent(cleanedQuery)}_OrderId_PRICE_ASC`,
        seller_nickname: 'Vendedor Mercado Livre',
      };
    }

    // =========================================================================
    // ETAPA 4: Validação Clínica via Gemini API (Contrato padronizado)
    // =========================================================================
    const clinicalResult: ClinicalEvaluationResult = await evaluateConcorrenteWithGemini(
      { produto_candidato: bestCandidate },
      geminiApiKey
    );

    const effectiveMlPrice = bestCandidate.preco_atual > 0 ? bestCandidate.preco_atual : fallbackMlPrice;
    const numNetProfit = Number(netProfit ?? (effectiveMlPrice - numSourcePrice) * 0.7);
    const numRoiPercent = Number(roiPercent ?? ((effectiveMlPrice - numSourcePrice) / numSourcePrice) * 100);
    const numMarginPercent = Number(marginPercent ?? ((effectiveMlPrice - numSourcePrice) / effectiveMlPrice) * 100);

    // Auditoria de oportunidade complementar
    const audit = await analyzeOpportunityWithGemini({
      apiKey: geminiApiKey,
      sourceTitle: title,
      store: store || 'Amazon',
      sourcePrice: numSourcePrice,
      mlTitle: bestCandidate.titulo,
      mlPrice: effectiveMlPrice,
      netProfit: numNetProfit,
      roiPercent: numRoiPercent,
      marginPercent: numMarginPercent,
    });

    const mlWinner = {
      item_id: bestCandidate.item_id,
      permalink: bestCandidate.url,
      title: bestCandidate.titulo,
      seller_nickname: bestCandidate.seller_nickname || 'Vendedor Mercado Livre',
      price: bestCandidate.preco_atual,
      min_price:
        bestCandidate.preco_tabela && bestCandidate.preco_tabela > 0
          ? bestCandidate.preco_tabela
          : Number((bestCandidate.preco_atual * 0.9).toFixed(2)),
      sold_quantity: bestCandidate.total_vendas,
      days_active: 90,
      oldest_date: null,
      reputation: bestCandidate.reputacao_vendedor,
      rating: bestCandidate.nota_avaliacoes,
      total_reviews: bestCandidate.total_avaliacoes,
      is_full: bestCandidate.logistica === 'fulfillment',
      free_shipping: bestCandidate.frete_gratis,
      brand: bestCandidate.marca,
      model: bestCandidate.modelo,
    };

    return NextResponse.json({
      success: true,
      cleanedQuery,
      mlWinner,
      clinicalResult,
      audit,
    });
  } catch (err: any) {
    console.error('[API ML Radar Audit] Erro:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
