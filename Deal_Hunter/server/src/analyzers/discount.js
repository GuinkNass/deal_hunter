/**
 * Funções de estatística sobre o histórico de preços de um produto.
 * Nunca confiam no "% OFF" que o site anuncia — calculam a partir do
 * histórico real armazenado (price_history).
 */

function mean(values) {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function stdDev(values) {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = mean(values.map((v) => (v - avg) ** 2));
  return Math.sqrt(variance);
}

/**
 * Calcula o desconto real do preço atual em relação ao histórico,
 * separado do desconto que o site eventualmente declarar.
 * @param {number} currentPrice
 * @param {number[]} historicalPrices - preços anteriores (sem incluir o atual)
 */
function calculateHistoricalDiscount(currentPrice, historicalPrices) {
  const cleanHistory = historicalPrices.filter((p) => typeof p === 'number' && p > 0);
  if (!cleanHistory.length) {
    return {
      calculatedDiscountPercent: null,
      referenceAverage: null,
      referenceMedian: null,
      historicalMin: null,
      sampleSize: 0,
      reliable: false,
    };
  }

  const avg = mean(cleanHistory);
  const med = median(cleanHistory);
  const min = Math.min(...cleanHistory);

  // Usa a mediana como referência principal — mais resistente a outliers
  // (ex.: um único pico de preço não deveria inflar o desconto calculado)
  const reference = med;
  const calculatedDiscountPercent = reference > 0
    ? Math.round(((reference - currentPrice) / reference) * 100)
    : null;

  return {
    calculatedDiscountPercent,
    referenceAverage: round2(avg),
    referenceMedian: round2(med),
    historicalMin: round2(min),
    sampleSize: cleanHistory.length,
    // menos de 3 registros = pouca confiança na conclusão
    reliable: cleanHistory.length >= 3,
  };
}

function round2(n) {
  if (n === null || n === undefined) return null;
  return Math.round(n * 100) / 100;
}

/**
 * Decide o desconto efetivo: prioriza o histórico próprio e só recai no
 * preço anterior informado pela loja quando ainda não há amostra suficiente.
 * @param {{price: number, siteOriginalPrice: number|null}} item
 * @param {ReturnType<typeof calculateHistoricalDiscount>} stats
 */
function resolveEffectiveDiscount(item, stats) {
  const declaredReference = item.siteOriginalPrice && item.siteOriginalPrice > item.price
    ? item.siteOriginalPrice : null;
  if (stats.reliable) {
    // Storefront "de" prices can be inflated, while the observed history can
    // also represent an old list price. Use the lower credible reference so
    // the configured threshold is evaluated conservatively.
    const useHistory = !declaredReference || stats.referenceMedian <= declaredReference;
    const referencePrice = useHistory ? stats.referenceMedian : declaredReference;
    return {
      discountPercent: Math.max(0, Math.round(((referencePrice - item.price) / referencePrice) * 100)),
      referencePrice,
      sampleSize: stats.sampleSize,
      source: useHistory ? 'historico' : 'declarado_ml',
    };
  }
  if (declaredReference) {
    const declared = Math.round(((declaredReference - item.price) / declaredReference) * 100);
    return {
      discountPercent: declared,
      referencePrice: declaredReference,
      sampleSize: stats.sampleSize,
      source: 'declarado_site',
    };
  }
  if (item.advertisedDiscount && Number(item.advertisedDiscount) > 0 && Number(item.advertisedDiscount) < 100) {
    const discount = Math.round(Number(item.advertisedDiscount));
    const refPrice = Math.round((item.price / (1 - discount / 100)) * 100) / 100;
    return {
      discountPercent: discount,
      referencePrice: refPrice,
      sampleSize: stats.sampleSize,
      source: 'declarado_site',
    };
  }
  return null;
}

module.exports = { mean, median, stdDev, calculateHistoricalDiscount, resolveEffectiveDiscount, round2 };
