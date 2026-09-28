const crypto = require('node:crypto');

/**
 * Gera um fingerprint estável para deduplicação de alertas de oportunidade.
 * O mesmo produto (nome normalizado) + preço + loja não deve gerar um
 * novo alerta antes do intervalo mínimo configurado, mesmo com URLs distintas.
 */
function buildFingerprint(parts) {
  const normalized = parts
    .map((p) => (p === null || p === undefined ? '' : String(p).trim().toLowerCase()))
    .join('|');
  return crypto.createHash('sha1').update(normalized).digest('hex');
}

function normalizeProductName(value) {
  return String(value || '')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

function alertFingerprint({ siteId, productId, productName, alertType, price }) {
  const roundedPrice = typeof price === 'number' ? price.toFixed(2) : '';
  const productIdentity = normalizeProductName(productName) || productId;
  return buildFingerprint(['alert', siteId, productIdentity, alertType, roundedPrice]);
}

module.exports = { buildFingerprint, alertFingerprint, normalizeProductName };
