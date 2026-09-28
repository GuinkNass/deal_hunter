const cheerio = require('cheerio');
const { extractCandidateCoupons } = require('../analyzers/coupon');

/**
 * Adaptador genérico: usado para qualquer site sem regras específicas.
 * Prioriza, nessa ordem: JSON-LD (schema.org/Product) > meta tags de
 * e-commerce (product:price etc.) > Open Graph > heurística de maior
 * elemento de preço na página.
 * Nunca inventa seletores — se não achar nada confiável, retorna
 * priceFound: false e quem chama decide registrar "não pôde ser analisado".
 */
function parseGeneric(html, pageUrl) {
  const $ = cheerio.load(html);
  const result = fromJsonLd($) || fromMetaTags($) || fromOpenGraph($);

  const title = result?.name || $('title').first().text().trim() || null;
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 20000);
  const coupons = extractCandidateCoupons(bodyText);

  return {
    priceFound: Boolean(result?.price),
    name: title,
    price: result?.price ?? null,
    currency: result?.currency ?? 'BRL',
    availability: result?.availability ?? null,
    imageUrl: result?.image ?? $('meta[property="og:image"]').attr('content') ?? null,
    sku: result?.sku ?? null,
    url: pageUrl,
    couponCandidates: coupons,
  };
}

function fromJsonLd($) {
  let found = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (found) return;
    try {
      const raw = $(el).contents().text();
      const json = JSON.parse(raw);
      const items = Array.isArray(json) ? json : [json, ...(json['@graph'] || [])];
      for (const item of items) {
        if (!item) continue;
        const type = item['@type'];
        const isProduct = type === 'Product' || (Array.isArray(type) && type.includes('Product'));
        if (isProduct) {
          const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
          found = {
            name: item.name || null,
            price: offers?.price ? Number(offers.price) : null,
            currency: offers?.priceCurrency || 'BRL',
            availability: offers?.availability || null,
            image: Array.isArray(item.image) ? item.image[0] : item.image || null,
            sku: item.sku || null,
          };
          break;
        }
      }
    } catch {
      // JSON-LD malformado — ignora e tenta próximo bloco
    }
  });
  return found && found.price ? found : null;
}

function fromMetaTags($) {
  const price = $('meta[property="product:price:amount"]').attr('content')
    || $('meta[itemprop="price"]').attr('content');
  if (!price) return null;
  return {
    name: $('meta[property="og:title"]').attr('content') || null,
    price: Number(price),
    currency: $('meta[property="product:price:currency"]').attr('content') || 'BRL',
    availability: $('meta[property="product:availability"]').attr('content') || null,
    image: $('meta[property="og:image"]').attr('content') || null,
    sku: null,
  };
}

function fromOpenGraph($) {
  const ogTitle = $('meta[property="og:title"]').attr('content');
  if (!ogTitle) return null;
  // Open Graph puro raramente traz preço confiável — retorna sem price
  // para não inventar dado; quem chama trata priceFound=false.
  return {
    name: ogTitle,
    price: null,
    currency: 'BRL',
    availability: null,
    image: $('meta[property="og:image"]').attr('content') || null,
    sku: null,
  };
}

module.exports = { parseGeneric };
