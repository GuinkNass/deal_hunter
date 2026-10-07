const { tagAmazonUrl } = require('../adapters/amazon.adapter');

function formatCurrency(value) {
  if (typeof value !== 'number') return '—';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

/**
 * Mensagem genérica de oferta de uma loja monitorada.
 * Retorna { text, inlineButton } — o botão é anexado pelo telegramClient.
 */
function opportunityMessage({ siteName = 'Mercado Livre', title, currentPrice, referencePrice, referencePriceSource, discountPercent, score, sampleSize, url }) {
  const referenceLabel = referencePriceSource === 'historico'
    ? 'Preço de referência (histórico)'
    : 'Preço de referência (loja)';
  const lines = [
    '🚨 <b>OFERTA ENCONTRADA</b>',
    '',
    `🏪 ${escapeHtml(siteName)}`,
    '',
    `📦 ${escapeHtml(title)}`,
    '',
    `💰 Preço atual: <b>${formatCurrency(currentPrice)}</b>`,
    `📊 ${referenceLabel}: ${formatCurrency(referencePrice)}`,
    `📉 Desconto: ${discountPercent}%`,
    `🔥 Score: ${score}/100`,
  ];
  if (sampleSize) lines.push('', `📅 Histórico: ${sampleSize} registro(s)`);

  const finalUrl = tagAmazonUrl(url);

  return {
    text: lines.join('\n'),
    inlineButton: { text: '🛒 ADICIONAR AO CARRINHO', url: finalUrl },
  };
}

function anomalyAlertMessage(params) {
  return opportunityMessage({
    siteName: params.siteName,
    title: params.productName || params.title,
    currentPrice: params.currentPrice,
    referencePrice: params.referenceAverage || params.referencePrice,
    referencePriceSource: 'historico',
    discountPercent: params.calculatedDiscountPercent || params.discountPercent,
    score: params.score,
    sampleSize: params.sampleSize,
    url: params.url,
  });
}

function couponAlertMessage(params) {
  return opportunityMessage(params);
}

module.exports = {
  opportunityMessage,
  anomalyAlertMessage,
  couponAlertMessage,
  formatCurrency,
};

