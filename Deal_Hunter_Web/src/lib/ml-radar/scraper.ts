/**
 * Extrai metadados (foto, título, preço, loja) de links de e-commerce
 */
export async function extractMetadataFromUrl(url: string): Promise<{
  title: string | null;
  price: number | null;
  imageUrl: string | null;
  store: string;
} | null> {
  if (!url || !url.startsWith('http')) return null;

  let store = 'Online';
  const urlLower = url.toLowerCase();
  if (urlLower.includes('amazon')) store = 'Amazon';
  else if (urlLower.includes('eletroclub')) store = 'Eletroclub';
  else if (urlLower.includes('kabum')) store = 'KaBuM!';
  else if (urlLower.includes('magazineluiza') || urlLower.includes('magalu')) store = 'Magalu';
  else if (urlLower.includes('shopee')) store = 'Shopee';
  else if (urlLower.includes('shein')) store = 'Shein';
  else if (urlLower.includes('pichau')) store = 'Pichau';
  else if (urlLower.includes('mercadolivre')) store = 'Mercado Livre';

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return { title: null, price: null, imageUrl: null, store };
    const html = await res.text();

    let imageUrl: string | null = null;
    let title: string | null = null;
    let price: number | null = null;

    // 1. Extração estruturada __NEXT_DATA__ (Prioridade máxima para KaBuM! e lojas Next.js)
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
    if (nextDataMatch) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        const prod = nextData?.props?.pageProps?.product || nextData?.props?.pageProps?.data?.product;
        if (prod) {
          if (!title && prod.name) title = String(prod.name).trim();
          if (!imageUrl) {
            if (prod.photos && Array.isArray(prod.photos) && prod.photos.length > 0) {
              imageUrl = typeof prod.photos[0] === 'string' ? prod.photos[0] : prod.photos[0]?.url || null;
            } else if (prod.image) {
              imageUrl = typeof prod.image === 'string' ? prod.image : prod.image?.url || null;
            }
          }
          // Prioriza preço à vista no PIX com desconto oficial
          const pixPrice = Number(prod.prices?.priceWithDiscount || prod.prices?.price || prod.price);
          if (pixPrice && pixPrice > 0) {
            price = pixPrice;
          }
        }
      } catch {}
    }

    // 2. JSON-LD Schema.org extraction
    if (!price || !title || !imageUrl) {
      const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
      if (jsonLdMatches) {
        for (const tag of jsonLdMatches) {
          try {
            const jsonContent = tag.replace(/<\/?script[^>]*>/gi, '').trim();
            const parsed = JSON.parse(jsonContent);

            let product: any = null;
            if (Array.isArray(parsed)) {
              product = parsed.find(
                (item) => item['@type'] === 'Product' || (Array.isArray(item['@type']) && item['@type'].includes('Product'))
              );
            } else if (parsed['@graph'] && Array.isArray(parsed['@graph'])) {
              product = parsed['@graph'].find((item: any) => item['@type'] === 'Product');
            } else if (parsed['@type'] === 'Product') {
              product = parsed;
            }

            if (product) {
              if (!title && product.name) title = String(product.name).trim();
              if (!imageUrl && product.image) {
                if (typeof product.image === 'string') {
                  imageUrl = product.image;
                } else if (Array.isArray(product.image)) {
                  imageUrl = typeof product.image[0] === 'string' ? product.image[0] : product.image[0]?.url || null;
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
    }

    // 3. OpenGraph / Twitter meta tags
    if (!imageUrl) {
      const ogImgMatch =
        html.match(/<meta[^>]*property=["'](?:og:image|og:image:secure_url)["'][^>]*content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["'](?:og:image|og:image:secure_url)["']/i) ||
        html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
      if (ogImgMatch && ogImgMatch[1]) {
        imageUrl = ogImgMatch[1].trim();
      }
    }

    // 4. Title fallback
    if (!title) {
      const ogTitleMatch =
        html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i) ||
        html.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
        html.match(/<title>([^<]+)<\/title>/i);
      if (ogTitleMatch && ogTitleMatch[1]) {
        title = ogTitleMatch[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim();
      }
    }

    // 5. Price regex fallback (prioriza à vista / PIX e expurga parcelas matematicamente)
    if (!price) {
      const pixMatch = html.match(/(?:R\$\s*([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})\s*(?:no\s+Pix|à\s+vista|em\s+1x)|(?:no\s+Pix|à\s+vista)\s*(?:por\s*)?R\$\s*([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2}))/i);
      if (pixMatch) {
        const valStr = pixMatch[1] || pixMatch[2];
        price = parseFloat(valStr.replace(/\./g, '').replace(',', '.'));
      }
    }

    if (!price) {
      // Coleta parcelas para expurgo textual
      const installmentValues = new Set<number>();
      const instRegexes = [
        /(?:\b\d+\s*x\s*(?:sem\s*juros\s*)?(?:com\s*juros\s*)?(?:no\s*cart[aã]o\s*)?(?:de\s*)?:?\s*|em\s+at[ée]\s+\d+\s*x\s*(?:sem\s*juros\s*)?(?:com\s*juros\s*)?(?:no\s*cart[aã]o\s*)?(?:de\s*)?:?\s*)R\$\s*([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})/gi,
        /R\$\s*([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})\s*(?:em\s+at[ée]\s+\d+x|\(?sem\s*juros\)?|\/\s*m[êe]s|cada\s+parcela)/gi,
      ];
      for (const re of instRegexes) {
        for (const m of html.matchAll(re)) {
          const num = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
          if (num) installmentValues.add(num);
        }
      }

      const allPricesRaw: number[] = [];
      const allPrices = html.matchAll(/R\$\s*([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})/gi);
      for (const match of allPrices) {
        const cand = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
        if (cand && cand > 5) {
          allPricesRaw.push(cand);
        }
      }

      // Filtro Matemático Multiplicador Universal (detecta e elimina parcelas onde P / p ~= N)
      for (let i = 0; i < allPricesRaw.length; i++) {
        const p = allPricesRaw[i];
        for (let j = 0; j < allPricesRaw.length; j++) {
          if (i === j) continue;
          const P = allPricesRaw[j];
          if (P > p) {
            const ratio = P / p;
            if (ratio >= 1.8 && ratio <= 25) {
              const nearestInt = Math.round(ratio);
              if (Math.abs(ratio - nearestInt) < 0.08) {
                installmentValues.add(p);
              }
            }
          }
        }
      }

      for (const cand of allPricesRaw) {
        if (!installmentValues.has(cand)) {
          price = cand;
          break;
        }
      }
    }

    return {
      title,
      price,
      imageUrl,
      store,
    };
  } catch {
    return { title: null, price: null, imageUrl: null, store };
  }
}
