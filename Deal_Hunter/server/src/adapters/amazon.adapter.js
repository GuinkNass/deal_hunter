const { parseGeneric } = require('./generic.adapter');

/**
 * Amazon: a maioria das páginas de produto expõe dados suficientes via
 * meta tags/JSON-LD para o parser genérico funcionar. Ponto de extensão
 * para seletores específicos (ex. #priceblock_ourprice) quando necessário.
 */
function parseAmazon(html, pageUrl) {
  return parseGeneric(html, pageUrl);
}

module.exports = { parseAmazon };
