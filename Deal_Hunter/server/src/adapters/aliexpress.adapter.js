const { parseGeneric } = require('./generic.adapter');

/**
 * AliExpress também é fortemente SPA. Mesmo comportamento do adaptador
 * Shopee: usa o genérico e sinaliza quando não encontra preço.
 */
function parseAliExpress(html, pageUrl) {
  return parseGeneric(html, pageUrl);
}

module.exports = { parseAliExpress };
