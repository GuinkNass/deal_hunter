const { parseGeneric } = require('./generic.adapter');
const { parseMercadoLivre } = require('./mercadolivre.adapter');
const { parseAmazon } = require('./amazon.adapter');
const { parseShopee } = require('./shopee.adapter');
const { parseAliExpress } = require('./aliexpress.adapter');
const { parseMagalu } = require('./magalu.adapter');
const { parseKabum } = require('./kabum.adapter');
const { parseShein } = require('./shein.adapter');

// Mapeamento de fragmentos de domínio -> parser específico.
const DOMAIN_ADAPTERS = [
  { match: (domain) => domain.includes('mercadolivre.') || domain.includes('mercadolibre.'), parse: parseMercadoLivre },
  { match: (domain) => domain.includes('amazon.'), parse: parseAmazon },
  { match: (domain) => domain.includes('shopee.'), parse: parseShopee },
  { match: (domain) => domain.includes('aliexpress.'), parse: parseAliExpress },
  { match: (domain) => domain.includes('magazineluiza.') || domain.includes('magalu.'), parse: parseMagalu },
  { match: (domain) => domain.includes('kabum.'), parse: parseKabum },
  { match: (domain) => domain.includes('shein.'), parse: parseShein },
];

function getAdapterForDomain(domain) {
  const found = DOMAIN_ADAPTERS.find((a) => a.match(domain));
  return found ? found.parse : parseGeneric;
}

module.exports = { getAdapterForDomain };
