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

  const endpoints = [];

  if (process.env.ML_RADAR_INGEST_URL) {
    endpoints.push(process.env.ML_RADAR_INGEST_URL);
  }

  // Next.js local comum (3001 quando server usa 3000)
  endpoints.push('http://localhost:3001/api/ml-radar/ingest');
  endpoints.push('http://127.0.0.1:3001/api/ml-radar/ingest');

  // Nuvem Vercel oficial
  if (config.webAuthUrl) {
    const cloudUrl = `${config.webAuthUrl.replace(/\/$/, '')}/api/ml-radar/ingest`;
    if (!endpoints.includes(cloudUrl)) {
      endpoints.push(cloudUrl);
    }
  }

  // Fallback para localhost:3000 (rota ponte ou Next se rodando na 3000)
  endpoints.push('http://localhost:3000/api/ml-radar/ingest');

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (res.ok) {
        logger.info(`[ML Radar Pipeline] Oferta sincronizada com sucesso no ML Radar (${endpoint}): "${payload.title}" (R$ ${payload.price})`);
        return true;
      }
    } catch {
      // Tenta próximo endpoint na lista
    }
  }

  logger.warn(`[ML Radar Pipeline] Não foi possível despachar "${payload.title}" para os endpoints do ML Radar.`);
  return false;
}

module.exports = { sendToMLRadar };
