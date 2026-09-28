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

module.exports = { calculateOpportunityScore };
