/**
 * Converte strings de preço (ex: "R$ 1.299,90", "$ 19.99", "1299,90") em números float.
 * @param {string} rawPrice
 * @returns {number|null}
 */
function parsePrice(rawPrice) {
  if (!rawPrice || typeof rawPrice !== "string") return null;

  // Limpa caracteres de moeda e espaços, mantendo apenas números, pontos e vírgulas
  let clean = rawPrice.replace(/[^\d.,]/g, "").trim();
  if (!clean) return null;

  // Tratamento quando há ponto e vírgula no mesmo valor
  if (clean.includes(",") && clean.includes(".")) {
    // Formato BR (ex: 1.299,90)
    if (clean.indexOf(".") < clean.indexOf(",")) {
      clean = clean.replace(/\./g, "").replace(",", ".");
    } else {
      // Formato US (ex: 1,299.90)
      clean = clean.replace(/,/g, "");
    }
  } else if (clean.includes(",")) {
    // Apenas vírgula para centavos (ex: 1299,90 -> 1299.90)
    clean = clean.replace(",", ".");
  }

  const parsed = parseFloat(clean);
  return isNaN(parsed) ? null : parsed;
}

// Suporte para ES Modules / Node / Browser Context
if (typeof module !== "undefined" && module.exports) {
  module.exports = { parsePrice };
}