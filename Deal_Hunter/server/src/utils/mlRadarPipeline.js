const logger = require('./logger');
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
  const mlRadarEndpoint = process.env.ML_RADAR_INGEST_URL || 'http://localhost:3000/api/ml-radar/ingest';
  
  // Tagueamento defensivo para Amazon se aplicável
  const cleanUrl = tagAmazonUrl(productUrl);

  const payload = {
    title: String(title || '').trim(),
    price: Number(price),
    originalPrice: originalPrice ? Number(originalPrice) : null,
    imageUrl: imageUrl || null,
    productUrl: cleanUrl,
    userId: String(userId || process.env.DEFAULT_USER_ID || 'master_admin').trim(),
    store: String(store || 'Online').trim(),
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(mlRadarEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      logger.warn(`[ML Radar Pipeline] Resposta ${res.status} ao enviar "${payload.title}": ${errText.substring(0, 100)}`);
      return false;
    }
    logger.info(`[ML Radar Pipeline] Oportunidade enviada com sucesso ao ML Radar: "${payload.title}" (R$ ${payload.price})`);
    return true;
  } catch (err) {
    logger.warn(`[ML Radar Pipeline] Erro ao despachar para ${mlRadarEndpoint}: ${err.message}`);
    return false;
  }
}

module.exports = { sendToMLRadar };
