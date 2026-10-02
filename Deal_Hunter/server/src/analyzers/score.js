/**
 * Score de oportunidade (0-100). É uma métrica técnica de apoio à
 * filtragem de alertas — NUNCA deve ser apresentado como garantia de
 * que o preço é realmente um erro ou uma oferta genuína.
 */
function calculateOpportunityScore({
  calculatedDiscountPercent,
  sampleSize,
  reliable,
  hasCoupon,
  historicalMin,
  currentPrice,
}) {
  let score = 0;

  // Desconto calculado (peso maior): até 50 pontos
  if (typeof calculatedDiscountPercent === 'number') {
    score += Math.max(0, Math.min(50, calculatedDiscountPercent * 0.5));
  }

  // Confiabilidade da amostra histórica: até 20 pontos
  if (reliable) {
    score += Math.min(20, sampleSize * 2);
  } else {
    score += Math.min(8, sampleSize * 2); // amostra pequena soma pouco
  }

  // Preço atual abaixo do mínimo histórico já visto: até 20 pontos
  if (typeof historicalMin === 'number' && typeof currentPrice === 'number' && currentPrice < historicalMin) {
    const dropBelowMin = ((historicalMin - currentPrice) / historicalMin) * 100;
    score += Math.max(0, Math.min(20, dropBelowMin));
  }

  // Cupom ativo somado à oferta: 10 pontos
  if (hasCoupon) score += 10;

  return Math.round(Math.max(0, Math.min(100, score)));
}

function normalizeText(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Validação de filtro dinâmico por palavra-chave:
 * O alerta só é disparado e enviado se o título ou descrição do produto
 * contiver a palavra-chave específica digitada pelo usuário (modelo, marca ou característica).
 * Se nenhum filtro estiver configurado para a categoria, retorna true.
 * Suporta múltiplos termos separados por vírgula ou ponto-e-vírgula (ex: "RTX 4070, RTX 4080").
 * @param {string|{title?: string, name?: string, description?: string}} product
 * @param {string|null|undefined} keywordFilter
 * @returns {boolean}
 */
function validateKeywordFilter(product, keywordFilter) {
  if (!keywordFilter || typeof keywordFilter !== 'string') return true;
  const rawFilter = keywordFilter.trim();
  if (!rawFilter) return true;

  const productText = typeof product === 'string'
    ? product
    : `${product?.title || ''} ${product?.name || ''} ${product?.description || ''}`;

  const normalizedProduct = normalizeText(productText);
  if (!normalizedProduct) return false;

  const terms = rawFilter
    .split(/[,;]/)
    .map((t) => normalizeText(t))
    .filter(Boolean);

  if (!terms.length) return true;

  // Retorna true se qualquer um dos termos configurados estiver presente no título ou descrição
  return terms.some((term) => normalizedProduct.includes(term));
}

module.exports = { calculateOpportunityScore, validateKeywordFilter, normalizeText };
