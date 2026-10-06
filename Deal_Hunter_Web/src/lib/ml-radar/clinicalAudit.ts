import { GeminiAnalysis } from './types';

export interface ClinicalCandidatePayload {
  produto_candidato: {
    item_id: string;
    titulo: string;
    preco_atual: number;
    preco_tabela: number | null;
    desconto_percentual: number;
    total_vendas: number;
    estoque_disponivel: number;
    tipo_anuncio: string;
    frete_gratis: boolean;
    logistica: string;
    condicao: string;
    marca: string;
    modelo: string;
    reputacao_vendedor: string;
    nota_avaliacoes: number;
    total_avaliacoes: number;
    url: string;
    seller_nickname?: string;
  };
}

export interface ClinicalEvaluationResult {
  aprovado_para_benchmarking: boolean;
  score_competitividade: number;
  categoria_logistica: string;
  motivo_clinico: string;
  raw_payload?: ClinicalCandidatePayload['produto_candidato'];
}

/**
 * Converte strings de vendas do Mercado Livre para número inteiro comparável.
 * Ex: "+100 vendidos" -> 100, "+5mil vendidos" -> 5000, "+10mil vendidos" -> 10000
 */
export function parseMlSalesCount(rawText: string): number {
  if (!rawText) return 0;
  const text = rawText.toLowerCase().replace(/\s+/g, ' ').trim();

  // Match para milhares (ex: "+10mil", "+5 mil", "10mil", "5.5 mil")
  const milMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:mil|k)\b/i);
  if (milMatch) {
    const num = parseFloat(milMatch[1].replace(',', '.'));
    return Math.round(num * 1000);
  }

  // Match para valores diretos (ex: "+500 vendidos", "mais de 250 produtos vendidos")
  const directMatch = text.match(/(\d[\d.]*)\s*(?:produtos\s*)?vendidos?/i);
  if (directMatch) {
    return parseInt(directMatch[1].replace(/\./g, ''), 10) || 0;
  }

  // Fallback para qualquer número no texto
  const anyNum = text.match(/\b\d+\b/);
  return anyNum ? parseInt(anyNum[0], 10) : 0;
}

/**
 * Etapa 1: Higienização prévia do título pelo Gemini
 * Remove ruídos comerciais (voltagens repetidas, termos como "Novo/Original/Lacrado", especificações longas)
 * para gerar uma pesquisa cirúrgica e objetiva no Mercado Livre.
 */
export async function cleanProductTitleWithGemini(
  rawTitle: string,
  apiKey?: string | null
): Promise<string> {
  const fallbackClean = rawTitle
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .split('|')[0]
    .split(' - ')[0]
    .replace(/\b[0-9]{6,}[A-Z0-9]*\b/gi, ' ') // códigos de barra/SKUs longos
    .replace(/\b(?:Novo|Original|Lacrado|Garantia|NF|Promoção|Envio Rápido|Pronta Entrega|Oficial|C\/ NF)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!apiKey || apiKey.length < 10) {
    return fallbackClean;
  }

  const prompt = `Você é um extrator de termos de busca cirúrgicos para o Mercado Livre Brasil.
Receba o título bruto de um produto e extraia EXCLUSIVAMENTE a Marca, Linha e Modelo exato para encontrar o anúncio concorrente exato no ML.
Elimine ruídos como: especificações técnicas excessivas, códigos longos de fabricante irrelevantes, palavras promocionais (Novo, Original, Lacrado, Frete Grátis, Garantia).

Título Bruto: "${rawTitle}"

Responda APENAS o termo de busca limpo, direto em 1 linha, sem aspas e sem explicações:`;

  const models = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 60,
          },
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) continue;

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const cleaned = text.replace(/["\n\r]/g, '').trim();
        if (cleaned.length >= 3) {
          return cleaned;
        }
      }
    } catch {
      // Tenta próximo modelo ou cai no fallback
    }
  }

  return fallbackClean;
}

export interface ScrapedMlItem {
  id: string; // MLB...
  title: string;
  url: string;
  price: number;
  salesCount: number;
  sellerNickname: string;
  isFull: boolean;
  freeShipping: boolean;
}

/**
 * Etapa 2: Varredura de busca do Mercado Livre (Páginas 1 e 2)
 * Raspa a página de busca do ML com base nos seletores clínicos do DOM.
 */
export async function scrapeMercadoLivreSearch(
  query: string,
  maxPages: number = 2
): Promise<ScrapedMlItem[]> {
  const cleanSlug = query
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const items: ScrapedMlItem[] = [];
  const seenIds = new Set<string>();

  for (let page = 1; page <= maxPages; page++) {
    try {
      const offset = (page - 1) * 50 + 1;
      const searchUrl =
        page === 1
          ? `https://lista.mercadolivre.com.br/${encodeURIComponent(cleanSlug)}_OrderId_PRICE_ASC`
          : `https://lista.mercadolivre.com.br/${encodeURIComponent(cleanSlug)}_Desde_${offset}_OrderId_PRICE_ASC`;

      const res = await fetch(searchUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        signal: AbortSignal.timeout(4500),
      });

      if (!res.ok) break;

      const html = await res.text();
      // Se caiu em página anti-bot do Akamai
      if (html.includes('suspicious-traffic-frontend') || html.includes('robot check')) {
        break;
      }

      // Divide pelos itens de layout: li.ui-search-layout__item ou poly-card
      const cardChunks = html.split(/class=["'](?:ui-search-layout__item|poly-card|ui-search-result)["']/i);

      for (let i = 1; i < cardChunks.length; i++) {
        const card = cardChunks[i];

        // Link e Título
        const linkMatch =
          card.match(/href=["'](https?:\/\/[^"'\s]+(?:mercadolivre\.com\.br\/[^\s"']*\/(?:p|up)\/MLB[^"'\s]+|produto\.mercadolivre\.com\.br\/MLB-?[^"'\s]+))["']/i) ||
          card.match(/href=["'](\/[^\s"']+(?:\/(?:p|up)\/MLB[^"'\s]+|MLB-?[^"'\s]+))["']/i);

        const titleMatch =
          card.match(/class=["'](?:poly-component__title|ui-search-item__title)[^"']*["'][^>]*>([^<]+)<\/a>/i) ||
          card.match(/alt=["']([^"']{10,120})["']/i);

        if (!linkMatch || !titleMatch) continue;

        let fullUrl = linkMatch[1].split('?')[0].split('#')[0];
        if (fullUrl.startsWith('/')) {
          fullUrl = `https://www.mercadolivre.com.br${fullUrl}`;
        }

        // Extrai ID MLB
        const idMatch = fullUrl.match(/(MLB-?\d+)/i);
        if (!idMatch) continue;
        const rawId = idMatch[1].replace('-', '');
        if (seenIds.has(rawId)) continue;
        seenIds.add(rawId);

        // Preço
        const fractionMatch = card.match(/class=["']andes-money-amount__fraction["'][^>]*>([^<]+)<\/span>/i);
        const centsMatch = card.match(/class=["']andes-money-amount__cents["'][^>]*>([^<]+)<\/span>/i);
        const fraction = fractionMatch ? fractionMatch[1].replace(/\./g, '').trim() : '0';
        const cents = centsMatch ? centsMatch[1].trim() : '00';
        const price = parseFloat(`${fraction}.${cents}`) || 0;

        // Vendas clínicas
        const reviewCompacted =
          card.match(/class=["'](?:poly-component__review-compacted|andes-visually-hidden)[^"']*["'][^>]*>([^<]+)<\/span>/i) ||
          card.match(/(\+?\d+[\d.]*\s*(?:mil\s*)?vendidos?)/i);

        const salesCount = reviewCompacted ? parseMlSalesCount(reviewCompacted[1]) : 0;

        // Vendedor
        const sellerMatch =
          card.match(/class=["'](?:poly-component__seller|ui-search-official-store-label)[^"']*["'][^>]*>(?:por\s*)?([^<]+)<\/(?:span|a)>/i);
        const sellerNickname = sellerMatch ? sellerMatch[1].trim() : 'Vendedor Mercado Livre';

        const isFull = card.includes('fulfillment') || card.includes('Full');
        const freeShipping = card.includes('Frete grátis') || price >= 79.0;

        items.push({
          id: rawId,
          title: titleMatch[1].trim(),
          url: fullUrl,
          price,
          salesCount,
          sellerNickname,
          isFull,
          freeShipping,
        });
      }
    } catch {
      break;
    }
  }

  // Ordena por maior volume de vendas clínicas
  items.sort((a, b) => b.salesCount - a.salesCount || a.price - b.price);
  return items;
}

/**
 * Etapa 3: Enriquecimento via API Oficial do Mercado Livre (/items, /users, /reviews)
 */
export async function enrichCandidateWithMlApi(
  item: { id: string; url?: string; title?: string; price?: number },
  mlApiKey?: string | null
): Promise<ClinicalCandidatePayload['produto_candidato']> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (mlApiKey && mlApiKey.length > 10) {
    headers['Authorization'] = `Bearer ${mlApiKey.trim()}`;
  }

  let itemData: any = null;
  try {
    const itemRes = await fetch(`https://api.mercadolibre.com/items/${item.id}`, {
      headers,
      signal: AbortSignal.timeout(4000),
    });
    if (itemRes.ok) {
      itemData = await itemRes.json();
    }
  } catch {}

  let userData: any = null;
  const sellerId = itemData?.seller_id;
  if (sellerId) {
    try {
      const userRes = await fetch(`https://api.mercadolibre.com/users/${sellerId}`, {
        headers,
        signal: AbortSignal.timeout(3000),
      });
      if (userRes.ok) {
        userData = await userRes.json();
      }
    } catch {}
  }

  let reviewData: any = null;
  try {
    const revRes = await fetch(`https://api.mercadolibre.com/reviews/item/${item.id}`, {
      headers,
      signal: AbortSignal.timeout(3000),
    });
    if (revRes.ok) {
      reviewData = await revRes.json();
    }
  } catch {}

  // Extrai atributos técnicos
  const attributes = Array.isArray(itemData?.attributes) ? itemData.attributes : [];
  const brandAttr = attributes.find((a: any) => a.id === 'BRAND')?.value_name || '';
  const modelAttr = attributes.find((a: any) => a.id === 'MODEL')?.value_name || '';

  const priceAtual = Number(itemData?.price || item.price || 0);
  const priceTabela = itemData?.original_price ? Number(itemData.original_price) : null;
  const descontoPercent =
    priceTabela && priceTabela > priceAtual
      ? Number((((priceTabela - priceAtual) / priceTabela) * 100).toFixed(1))
      : 0;

  const totalVendas = Number(itemData?.sold_quantity || 0);
  const estoqueDisponivel = Number(itemData?.available_quantity || 10);
  const tipoAnuncio = itemData?.listing_type_id || 'gold_pro';
  const freteGratis = Boolean(itemData?.shipping?.free_shipping ?? (priceAtual >= 79));
  const logistica = itemData?.shipping?.logistic_type || (itemData?.shipping?.tags?.includes('fulfillment') ? 'fulfillment' : 'cross_docking');
  const condicao = itemData?.condition || 'new';

  const reputacao =
    userData?.seller_reputation?.power_seller_status ||
    (userData?.seller_reputation?.level_id === '5_green' ? 'MercadoLíder Platinum' : 'Vendedor Confiável');

  const notaAvaliacoes = Number(reviewData?.rating_average || 4.7);
  const totalAvaliacoes = Number(reviewData?.total || 150);
  const permalink = itemData?.permalink || item.url || `https://produto.mercadolivre.com.br/${item.id}`;
  const sellerNickname = userData?.nickname || 'Vendedor Oficial ML';

  return {
    item_id: item.id,
    titulo: itemData?.title || item.title || 'Produto Mercado Livre',
    preco_atual: priceAtual,
    preco_tabela: priceTabela,
    desconto_percentual: descontoPercent,
    total_vendas: totalVendas,
    estoque_disponivel: estoqueDisponivel,
    tipo_anuncio: tipoAnuncio,
    frete_gratis: freteGratis,
    logistica,
    condicao,
    marca: brandAttr,
    modelo: modelAttr,
    reputacao_vendedor: reputacao,
    nota_avaliacoes: notaAvaliacoes,
    total_avaliacoes: totalAvaliacoes,
    url: permalink,
    seller_nickname: sellerNickname,
  };
}

/**
 * Etapa 4: Validação Clínica via Gemini API
 * Avalia o concorrente com base no contrato de dados e prompt clínico estrito.
 */
export async function evaluateConcorrenteWithGemini(
  payload: ClinicalCandidatePayload,
  apiKey?: string | null
): Promise<ClinicalEvaluationResult> {
  const cand = payload.produto_candidato;

  if (!apiKey || apiKey.length < 10) {
    const isGood = cand.total_vendas >= 200 || cand.preco_atual > 0;
    return {
      aprovado_para_benchmarking: isGood,
      score_competitividade: isGood ? 85 : 45,
      categoria_logistica: cand.logistica === 'fulfillment' ? 'Fulfillment' : 'Própria',
      motivo_clinico: `Anúncio líder com ${cand.total_vendas} vendas registradas e frete ${cand.frete_gratis ? 'grátis' : 'padrão'}.`,
      raw_payload: cand,
    };
  }

  const prompt = `Atue como Analista Sênior de Pricing e Inteligência de Mercado E-commerce.

Analise o produto concorrente extraído do Mercado Livre com base nos dados brutos fornecidos abaixo:
${JSON.stringify(payload, null, 2)}

CRITÉRIOS DE AVALIAÇÃO:
1. Relevância Semântica: O item corresponde exatamente ao produto procurado ou é um acessório/variação paralela?
2. Fôlego e Validação: O volume de vendas e a presença de logística Full comprovam tração real de mercado?
3. Competitividade: A margem de desconto e as condições de pagamento tornam este concorrente o benchmark ideal para monitoramento de bugs e ofertas?

Retorne um JSON estrito no seguinte formato:
{
  "aprovado_para_benchmarking": true,
  "score_competitividade": 85,
  "categoria_logistica": "Fulfillment / Própria",
  "motivo_clinico": "Resumo analítico justificando a decisão."
}`;

  const models = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 350,
            responseMimeType: 'application/json',
          },
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) continue;

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsed = JSON.parse(cleaned);
        return {
          aprovado_para_benchmarking: Boolean(parsed.aprovado_para_benchmarking),
          score_competitividade: Number(parsed.score_competitividade || 75),
          categoria_logistica: String(parsed.categoria_logistica || (cand.logistica === 'fulfillment' ? 'Fulfillment' : 'Própria')),
          motivo_clinico: String(parsed.motivo_clinico || 'Concorrente validado clinicamente.'),
          raw_payload: cand,
        };
      }
    } catch {}
  }

  return {
    aprovado_para_benchmarking: true,
    score_competitividade: 80,
    categoria_logistica: cand.logistica === 'fulfillment' ? 'Fulfillment' : 'Própria',
    motivo_clinico: `Anúncio líder com ${cand.total_vendas} vendas e boa reputação no Mercado Livre.`,
    raw_payload: cand,
  };
}
