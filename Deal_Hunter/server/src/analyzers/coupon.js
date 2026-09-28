/**
 * Detecção best-effort de cupons a partir de texto de página já extraído
 * pela extensão (content script). Não afirma que todo código parecido
 * é um cupom válido — apenas sinaliza candidatos com contexto.
 */

const KEYWORDS = [
  'cupom', 'cupom de desconto', 'código promocional', 'código de desconto',
  'promocode', 'promo code', 'coupon', 'voucher', 'desconto', 'oferta', 'promoção',
];

// Código plausível: 4-15 caracteres alfanuméricos, ao menos 1 letra e 1 número,
// maiúsculo predominante — reduz falso-positivo de palavras comuns.
const CODE_REGEX = /\b(?=[A-Z0-9]{4,15}\b)(?=[A-Z0-9]*[A-Z])(?=[A-Z0-9]*[0-9])[A-Z0-9]{4,15}\b/g;

function findCandidateKeywordContext(text) {
  const lower = text.toLowerCase();
  return KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * @param {string} pageText texto visível relevante da página (enviado pela extensão)
 * @returns {Array<{code: string, contextSnippet: string}>}
 */
function extractCandidateCoupons(pageText) {
  if (!pageText || !findCandidateKeywordContext(pageText)) return [];

  const candidates = [];
  const seen = new Set();
  let match;
  CODE_REGEX.lastIndex = 0;
  while ((match = CODE_REGEX.exec(pageText)) !== null) {
    const code = match[0];
    if (seen.has(code)) continue;
    seen.add(code);
    const start = Math.max(0, match.index - 60);
    const end = Math.min(pageText.length, match.index + code.length + 60);
    candidates.push({ code, contextSnippet: pageText.slice(start, end).trim() });
  }
  return candidates;
}

/** Extrai percentual de desconto de um trecho de texto, se houver ("20%", "20% off") */
function extractDiscountPercent(text) {
  const m = text.match(/(\d{1,3})\s*%/);
  if (!m) return null;
  const val = Number(m[1]);
  return val > 0 && val <= 100 ? val : null;
}

module.exports = { extractCandidateCoupons, extractDiscountPercent, KEYWORDS };
