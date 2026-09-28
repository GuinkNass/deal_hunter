const { parseGeneric } = require('./generic.adapter');
const { parseMercadoLivre } = require('./mercadolivre.adapter');
const { parseAmazon } = require('./amazon.adapter');
const { parseShopee } = require('./shopee.adapter');
const { parseAliExpress } = require('./aliexpress.adapter');

// Mapeamento de fragmentos de domínio -> parser específico.
// Para adicionar um novo site: crie <site>.adapter.js e registre aqui.
const DOMAIN_ADAPTERS = [
  { match: (domain) => domain.includes('mercadolivre.') || domain.includes('mercadolibre.'), parse: parseMercadoLivre },
  { match: (domain) => domain.includes('amazon.'), parse: parseAmazon },
  { match: (domain) => domain.includes('shopee.'), parse: parseShopee },
  { match: (domain) => domain.includes('aliexpress.'), parse: parseAliExpress },
];

function getAdapterForDomain(domain) {
  const found = DOMAIN_ADAPTERS.find((a) => a.match(domain));
  return found ? found.parse : parseGeneric;
}

module.exports = { getAdapterForDomain };
