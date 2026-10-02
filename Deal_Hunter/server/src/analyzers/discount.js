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
 * Verifica se o preço atual corresponde na verdade ao valor de uma parcela isolada
 * (ex: R$ 79,90 de um produto de 10x de R$ 79,90 que custa R$ 799,00).
 * Nesses casos a oferta é descartada para evitar alertas com falso desconto de 90%.
 */
function isIsolatedInstallment(item) {
  if (!item || !item.price || item.price <= 0) return false;
  const currentPrice = Number(item.price);

  // 1. Se o valor da parcela foi fornecido diretamente no item
  if (item.installmentAmount && Math.abs(currentPrice - Number(item.installmentAmount)) < 0.05) {
    return true;
  }

  // 2. Se temos preço original de referência e a proporção fecha com um número de parcelas comum
  const origPrice = Number(item.siteOriginalPrice || item.originalPrice);
  const text = String(item.rawText || item.text || item.cardText || item.name || item.html || '');

  if (origPrice && origPrice > currentPrice) {
    const ratio = Math.round(origPrice / currentPrice);
    if (ratio >= 2 && ratio <= 24) {
      // Verifica se há menção a "Nx", "N x", "parcelas" ou "sem juros" no texto
      const regexNx = new RegExp(`\\b${ratio}\\s*x\\b`, 'i');
      if (regexNx.test(text) || /(?:x\s*de|parcelas?|sem\s*juros|a\s*prazo)/i.test(text)) {
        return true;
      }
      // Se a divisão fecha com erro menor que 2 centavos
      const expectedParcel = origPrice / ratio;
      if (Math.abs(expectedParcel - currentPrice) < 0.03 && ratio >= 3) {
        return true;
      }
    }
  }

  // 3. Procura no texto por padrões de parcelas como "10x de R$ 79,90"
  if (text) {
    const parcelMatches = text.matchAll(/(?:ou\s+)?(\d{1,2})\s*x\s*(?:de\s*)?R?\$?\s*([\d.]+,\d{2})/gi);
    for (const match of parcelMatches) {
      const numStr = match[2].replace(/\./g, '').replace(',', '.');
      const val = parseFloat(numStr);
      if (Number.isFinite(val) && Math.abs(val - currentPrice) < 0.05) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Decide o desconto efetivo: prioriza o histórico próprio e só recai no
 * preço anterior informado pela loja quando ainda não há amostra suficiente.
 * Descarta imediatamente ofertas onde o preço seja idêntico a uma parcela isolada.
 * @param {{price: number, siteOriginalPrice: number|null}} item
 * @param {ReturnType<typeof calculateHistoricalDiscount>} stats
 */
function resolveEffectiveDiscount(item, stats) {
  // Regra rígida: descarta se o preço promocional for idêntico a uma parcela isolada
  if (isIsolatedInstallment(item)) {
    return null;
  }

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

module.exports = {
  mean,
  median,
  stdDev,
  calculateHistoricalDiscount,
  resolveEffectiveDiscount,
  isIsolatedInstallment,
  round2,
};
