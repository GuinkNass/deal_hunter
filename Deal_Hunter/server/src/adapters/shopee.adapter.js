const { parseGeneric } = require('./generic.adapter');

/**
 * Shopee carrega preço via JavaScript (SPA) em muitos casos, então o
 * fetch simples de HTML pode não capturar o preço atual. Enquanto não
 * houver uma estratégia de extração dedicada, cai no genérico e o
 * monitor registra "não pôde ser analisado automaticamente" quando
 * priceFound for false.
 */
function parseShopee(html, pageUrl) {
  return parseGeneric(html, pageUrl);
}

module.exports = { parseShopee };
