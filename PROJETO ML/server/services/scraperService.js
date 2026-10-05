/**
 * Scrapes metadata (product photo, title, price, store) from e-commerce product URLs
 * Supports Eletroclub (VTEX), Amazon, Magalu, KaBuM, Shopee, Pichau, Mercado Livre, etc.
 */
async function extractMetadataFromUrl(url) {
  if (!url || !url.startsWith('http')) return null;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!res.ok) return null;
    const html = await res.text();

    let imageUrl = null;
    let title = null;
    let price = null;

    // 1. JSON-LD Schema.org extraction (VTEX, Shopify, Nuvemshop, etc.)
    const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    if (jsonLdMatches) {
      for (const tag of jsonLdMatches) {
        try {
          const jsonContent = tag.replace(/<\/?script[^>]*>/gi, '').trim();
          const parsed = JSON.parse(jsonContent);
          
          let product = null;
          if (Array.isArray(parsed)) {
            product = parsed.find(item => item['@type'] === 'Product' || (Array.isArray(item['@type']) && item['@type'].includes('Product')));
          } else if (parsed['@graph'] && Array.isArray(parsed['@graph'])) {
            product = parsed['@graph'].find(item => item['@type'] === 'Product');
          } else if (parsed['@type'] === 'Product') {
            product = parsed;
          }

          if (product) {
            if (!title && product.name) title = String(product.name).trim();
            if (!imageUrl && product.image) {
              if (typeof product.image === 'string') {
                imageUrl = product.image;
              } else if (Array.isArray(product.image)) {
                imageUrl = typeof product.image[0] === 'string' ? product.image[0] : (product.image[0]?.url || null);
              } else if (typeof product.image === 'object') {
                imageUrl = product.image.url || product.image.contentUrl || null;
              }
            }
            if (!price && product.offers) {
              const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
              if (offer && (offer.price || offer.lowPrice)) {
                price = Number(offer.price || offer.lowPrice);
              }
            }
          }
        } catch {}
      }
    }

    // 2. OpenGraph / Twitter meta tags fallback
    if (!imageUrl) {
      const ogImgMatch = html.match(/<meta[^>]*property=["'](?:og:image|og:image:secure_url)["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["'](?:og:image|og:image:secure_url)["']/i) ||
                         html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
      if (ogImgMatch && ogImgMatch[1]) {
        imageUrl = ogImgMatch[1].trim();
      }
    }

    // 3. VTEX images regex fallback (Eletroclub, Philco, Britânia, etc.)
    if (!imageUrl) {
      const vtexImgMatch = html.match(/https:\/\/[^"'\s]+(?:vtexassets|vteximg)\.com\/arquivos\/ids\/\d+[^"'\s]*\.(?:jpg|jpeg|png|webp)/i);
      if (vtexImgMatch) {
        imageUrl = vtexImgMatch[0];
      }
    }

    // 4. Clean relative image URL
    if (imageUrl) {
      if (imageUrl.startsWith('//')) {
        imageUrl = 'https:' + imageUrl;
      } else if (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) {
        const u = new URL(url);
        imageUrl = `${u.origin}${imageUrl}`;
      }
    }

    // 5. Title extraction fallback
    if (!title) {
      const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                           html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i) ||
                           html.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
                           html.match(/<title>([^<]+)<\/title>/i);
      if (ogTitleMatch && ogTitleMatch[1]) {
        title = ogTitleMatch[1]
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s*[-|]\s*(Eletroclub|Amazon|Magalu|KaBuM|Shopee|Pichau|Mercado Livre).*$/i, '')
          .trim();
      }
    }

    // 6. Price extraction fallback
    if (!price || isNaN(price)) {
      const priceRegex = [
        /"price":\s*([0-9.]+)/i,
        /"Price":\s*([0-9.]+)/i,
        /"lowPrice":\s*([0-9.]+)/i,
        /R\$\s*([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})/i
      ];
      for (const regex of priceRegex) {
        const m = html.match(regex);
        if (m && m[1]) {
          const raw = m[1].replace(/\./g, '').replace(',', '.');
          const val = parseFloat(raw);
          if (!isNaN(val) && val > 0) {
            price = val;
            break;
          }
        }
      }
    }

    // 7. Store Name detection
    let store = 'Online';
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('eletroclub.')) store = 'Eletroclub';
    else if (lowerUrl.includes('amazon.')) store = 'Amazon';
    else if (lowerUrl.includes('kabum.')) store = 'KaBuM!';
    else if (lowerUrl.includes('magazineluiza.') || lowerUrl.includes('magalu.')) store = 'Magalu';
    else if (lowerUrl.includes('shopee.')) store = 'Shopee';
    else if (lowerUrl.includes('pichau.')) store = 'Pichau';
    else if (lowerUrl.includes('terabyte.')) store = 'Terabyte';
    else if (lowerUrl.includes('mercadolivre.') || lowerUrl.includes('mercadolibre.')) store = 'Mercado Livre';

    return {
      imageUrl,
      title,
      price: price ? Number(price.toFixed(2)) : null,
      store
    };
  } catch (err) {
    console.warn(`[Scraper] Não foi possível extrair metadados de ${url}:`, err.message);
    return null;
  }
}

module.exports = {
  extractMetadataFromUrl
};
