const logger = require('./logger');
const { config } = require('../config');
const { tagAmazonUrl } = require('../adapters/amazon.adapter');

/**
 * Encaminha dados higienizados da oportunidade confirmada para o ML Radar.
 * Payload limpo estrito conforme especificação:
 * - title
 * - price
 * - originalPrice
 * - imageUrl
 * - productUrl
 * - userId
 * - store
 */
async function sendToMLRadar({ title, price, originalPrice, imageUrl, productUrl, userId, store }) {
  if (!title || price === undefined || price === null) return false;

  // Tagueamento defensivo para Amazon se aplicável
  const cleanUrl = tagAmazonUrl(productUrl);

  const payload = {
    title: String(title || '').trim(),
    price: Number(price),
    originalPrice: originalPrice ? Number(originalPrice) : null,
    imageUrl: imageUrl || null,
    productUrl: cleanUrl,
    userId: userId ? String(userId).trim() : null,
    store: String(store || 'Online').trim(),
  };

  const primaryUrl = process.env.ML_RADAR_INGEST_URL || 'https://dealhunterpro.com.br/api/ml-radar/ingest';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(primaryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (res.ok) {
      logger.info(`[ML Radar Pipeline] Oferta sincronizada com sucesso: "${payload.title}" (R$ ${payload.price})`);
      return true;
    }
  } catch (err) {
    // Falha silenciosa para manter a varredura e alertas ultra-rápidos
  }

  return false;
}

module.exports = { sendToMLRadar };
