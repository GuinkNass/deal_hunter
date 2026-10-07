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

  const candidateUrls = [
    process.env.ML_RADAR_INGEST_URL,
    `${(config.webAuthUrl || 'https://deal-hunter-guilhermernascimento-9353s-projects.vercel.app').replace(/\/+$/, '')}/api/ml-radar/ingest`,
    'https://deal-hunter-web.onrender.com/api/ml-radar/ingest',
  ].filter(Boolean);

  for (const targetUrl of candidateUrls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (res.ok) {
        logger.info(`[ML Radar Pipeline] Oferta sincronizada com sucesso no Web (${targetUrl}): "${payload.title}" (R$ ${payload.price})`);
        return true;
      }
    } catch (err) {
      // Tenta a próxima URL disponível
    }
  }

  return false;
}

module.exports = { sendToMLRadar };
