/**
 * Extrai nome e preço do produto da página atual.
 */
function extractProductData() {
  let name = null;
  let price = null;

  // Estratégia 1: Dados estruturados JSON-LD (Schema.org)
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse(script.textContent);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        const product = item['@graph']
          ? item['@graph'].find(i => i['@type'] === 'Product')
          : (item['@type'] === 'Product' ? item : null);

        if (product) {
          name = name || product.name;
          if (product.offers) {
            const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
            if (offer && offer.price) {
              price = price || parsePrice(String(offer.price));
            }
          }
        }
      }
    } catch (e) {
      // Ignora JSONs malformatados
    }
  }

  // Estratégia 2: Meta Tags OpenGraph (Facebook/Commerce)
  if (!name) {
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) name = ogTitle.content;
  }
  if (!price) {
    const ogPrice = document.querySelector('meta[property="og:price:amount"]') ||
                     document.querySelector('meta[property="product:price:amount"]');
    if (ogPrice) price = parsePrice(ogPrice.content);
  }

  // Estratégia 3: Título da página como fallback
  if (!name) {
    name = document.title;
  }

  return {
    name: name ? name.trim() : "Produto não identificado",
    price: price || null,
    url: window.location.href
  };
}