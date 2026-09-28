const cheerio = require('cheerio');

function parseListing(html, pageUrl, domain) {
  const $ = cheerio.load(html);
  const results = new Map();

  const add = (product) => {
    if (!product?.url || !product.name || !(product.price > 0)) return;
    try {
      const url = new URL(product.url, pageUrl);
      const allowedDomain = domain.toLowerCase().replace(/^www\./, '');
      const productHost = url.hostname.toLowerCase().replace(/^www\./, '');
      if (!['http:', 'https:'].includes(url.protocol)
        || (productHost !== allowedDomain && !productHost.endsWith(`.${allowedDomain}`))) return;
      url.hash = '';
      for (const key of [...url.searchParams.keys()]) {
        if (/^(utm_|ref$|tag$|psc$|crid$)/i.test(key)) url.searchParams.delete(key);
      }
      const existing = results.get(url.href);
      const originalPrice = Number(product.originalPrice) > Number(product.price)
        ? Number(product.originalPrice)
        : (existing?.originalPrice || null);
      const advertisedDiscount = product.advertisedDiscount || existing?.advertisedDiscount || null;
      const imageUrl = product.imageUrl || existing?.imageUrl || null;
      results.set(url.href, {
        name: clean(product.name) || existing?.name,
        url: url.href,
        price: Number(product.price) || existing?.price,
        originalPrice,
        advertisedDiscount,
        currency: product.currency || existing?.currency || 'BRL',
        imageUrl,
      });
    } catch {
      // ignora links malformados
    }
  };

  for (const product of parseJsonLd($)) add(product);

  const selectors = cardSelectors(domain);
  const isAmazon = domain.includes('amazon.');
  const isMagalu = domain.includes('magazineluiza.');
  const isEletroclub = domain.includes('eletroclub.');

  for (const selector of selectors) {
    $(selector).each((_, element) => {
      const card = $(element);
      const link = card.is('a') ? card : (card.find('a[href]').first().length ? card.find('a[href]').first() : card.closest('a[href]'));
      const href = link.attr('href');
      if (!href) return;

      const name = isAmazon
        ? (textFirst(card, [
            'p[class*="ProductCard-module__title"] .a-truncate-full',
            'p[id^="title-"] .a-truncate-full',
            'p[class*="ProductCard-module__title"] .a-truncate-cut',
            '.a-truncate-full',
            '.a-truncate-cut',
            '[data-testid="product-title"]',
            '[data-testid="product-name"]',
            'h2 a', 'h2', 'h3 a', 'h3',
            '.product-title', '.product-name',
          ]) || link.attr('title') || card.find('img').first().attr('alt'))
        : isMagalu
        ? (textFirst(card, [
            '[data-testid="product-card-title"]',
            'h3[data-testid="product-card-title"]',
            'h2[data-testid="product-card-title"]',
            '[data-testid="product-title"]',
            '[data-testid="product-name"]',
            'h2', 'h3', 'h1',
            '[class*="productName"]',
          ]) || link.attr('title') || card.find('img').first().attr('alt'))
        : isEletroclub
        ? (textFirst(card, [
            '[class*="productBrand"]',
            '[class*="productName"]',
            '[class*="brandName"]',
            '[class*="product-summary"] h2',
            '[class*="product-summary"] h3',
            'h2 a', 'h2', 'h3 a', 'h3',
            '[data-testid="product-title"]',
          ]) || link.attr('title') || card.find('img').first().attr('alt'))
        : (textFirst(card, [
            '[data-testid="product-title"]', '[data-testid="product-name"]',
            'h2 a', 'h2', 'h3 a', 'h3', '.product-title', '.product-name',
            '[class*="productName"]', '[class*="nameContainer"]',
            '.a-size-base-plus', '.a-size-medium',
          ]) || link.attr('title') || card.find('img').first().attr('alt'));

      const current = isAmazon
        ? (amazonPriceFromParts(card) || priceFirst(card, currentPriceSelectors(domain)) || firstPrice(card.text()))
        : isMagalu
        ? (magaluPriceFromParts(card) || priceFirst(card, currentPriceSelectors(domain)) || firstPrice(card.text()))
        : isEletroclub
        ? (eletroclubPrice(card) || priceFirst(card, currentPriceSelectors(domain)) || firstPrice(card.text()))
        : (priceFirst(card, currentPriceSelectors(domain)) || firstPrice(card.text()));

      let original = isAmazon
        ? (amazonOriginalPrice(card, current) || priceFirst(card, originalPriceSelectors(domain)))
        : isMagalu
        ? (magaluOriginalPrice(card, current) || priceFirst(card, originalPriceSelectors(domain)))
        : isEletroclub
        ? (eletroclubOriginalPrice(card, current) || priceFirst(card, originalPriceSelectors(domain)))
        : priceFirst(card, originalPriceSelectors(domain));

      let advertisedDiscount = isAmazon
        ? amazonDiscount(card)
        : isMagalu
        ? magaluDiscount(card)
        : isEletroclub
        ? eletroclubDiscount(card)
        : parseDiscount(card.text());

      if (!original && advertisedDiscount && current > 0) {
        original = Math.round((current / (1 - advertisedDiscount / 100)) * 100) / 100;
      }
      if (!advertisedDiscount && original && current && original > current) {
        advertisedDiscount = Math.round(((original - current) / original) * 100);
      }
      const image = card.find('[data-testid="product-card-media"], [data-testid="image"], img').first();
      const imageUrl = image.attr('src') || image.attr('data-src') || image.attr('data-image-src')
        || image.attr('srcset')?.split(' ')[0] || null;
      add({ name, url: href, price: current, originalPrice: original, advertisedDiscount, imageUrl });
    });
  }

  return [...results.values()];
}

function parseCapturedProducts(products, pageUrl, domain) {
  if (!Array.isArray(products)) return [];
  const allowedDomain = domain.toLowerCase().replace(/^www\./, '');
  const results = new Map();
  for (const product of products.slice(0, 500)) {
    const price = parsePrice(product?.price);
    const name = clean(product?.name);
    if (!name || !product?.url || !(price > 0)) continue;
    try {
      const url = new URL(product.url, pageUrl);
      const productHost = url.hostname.toLowerCase().replace(/^www\./, '');
      if (!['http:', 'https:'].includes(url.protocol)
        || (productHost !== allowedDomain && !productHost.endsWith(`.${allowedDomain}`))) continue;
      url.hash = '';
      for (const key of [...url.searchParams.keys()]) {
        if (/^(utm_|ref$|tag$|psc$|crid$)/i.test(key)) url.searchParams.delete(key);
      }
      let originalPrice = parsePrice(product.originalPrice);
      let advertisedDiscount = Number(product.advertisedDiscount) || null;
      if (!originalPrice && advertisedDiscount && price > 0 && advertisedDiscount > 0 && advertisedDiscount < 100) {
        originalPrice = Math.round((price / (1 - advertisedDiscount / 100)) * 100) / 100;
      }
      if (!advertisedDiscount && originalPrice && price && originalPrice > price) {
        advertisedDiscount = Math.round(((originalPrice - price) / originalPrice) * 100);
      }
      results.set(url.href, {
        name, url: url.href, price,
        originalPrice: originalPrice > price ? originalPrice : null,
        advertisedDiscount: advertisedDiscount > 0 && advertisedDiscount < 100 ? advertisedDiscount : null,
        currency: product.currency || 'BRL',
        imageUrl: typeof product.imageUrl === 'string' ? product.imageUrl : null,
      });
    } catch {
      // Dados fornecidos pelo navegador são validados novamente no backend.
    }
  }
  return [...results.values()];
}

function diagnoseListing(html, domain) {
  const $ = cheerio.load(html);
  const title = clean($('title').first().text()) || '(sem título HTML)';
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  const hooks = [
    ['data-asin', $('[data-asin]').length],
    ['cards VTEX', $('[class*="product-summary"], [class*="productCard"]').length],
    ['preços', $('[itemprop="price"], [class*="sellingPrice"], [data-testid*="price"]').length],
    ['links de produto /p', $('a[href$="/p"], a[href*="/p?"]').length],
    ['texto de preço R$', (text.match(/R\$\s*\d/g) || []).length],
    ['JSON-LD de produto', $('script[type="application/ld+json"]').length],
  ].filter(([, count]) => count > 0).map(([name, count]) => `${name}: ${count}`);
  const firstCard = $('[class*="product-summary"], [class*="productCard"], [data-asin]').first();
  const classHints = [...new Set(firstCard.find('[class]').map((_, element) => $(element).attr('class'))
    .get().join(' ').split(/\s+/).filter((className) => /price|valor|selling|listprice|currency/i.test(className)))].slice(0, 8);
  const sample = firstCard.text().replace(/\s+/g, ' ').trim().slice(0, 140);
  const reason = text.length < 300
    ? `conteúdo da página muito curto (${text.length} caracteres)`
    : hooks.length ? hooks.join(', ') : 'HTML sem marcações conhecidas de produto';
  const details = [classHints.length ? `classes de preço: ${classHints.join(' ')}` : '', sample ? `amostra do cartão: "${sample}"` : ''].filter(Boolean).join('; ');
  return `loja=${domain}; título="${title.slice(0, 100)}"; ${reason}${details ? `; ${details}` : ''}`;
}

function cardSelectors(domain) {
  if (domain.includes('amazon.')) return [
    '[data-testid="product-card"]',
    '[data-deal-id]',
    '[data-csa-c-item-type="deal"]',
    '[data-component-type="s-search-result"][data-asin]',
    '[data-asin][data-index]',
    '[data-asin]',
    '[class*="ProductCard-module__card"]',
    '.zg-grid-general-faceout',
    '[data-testid*="deal-card"]',
    '[data-testid*="dealCard"]',
    '[class*="DealCard"]',
    '[class*="deal-card"]',
    '[class*="DealGridItem"]',
  ];
  if (domain.includes('magazineluiza.')) return [
    '[data-testid="product-card-link"]',
    '[data-testid="product-card-container"]',
    '[data-testid="product-card-content"]',
    'a[data-testid="product-card-container"]',
    'a[data-testid="product-card-link"]',
    'li[data-testid="product-list-item"]',
    'li[data-testid*="product"]',
    '[data-testid="product-card"]',
    '[data-testid*="product-card"]',
    'a[href*="/p/"]',
    '[data-testid="product-card-price"]',
  ];
  if (domain.includes('eletroclub.')) return [
    'section[class*="vtex-product-summary"]',
    '.vtex-product-summary-2-x-container',
    '[class*="vtex-product-summary"]',
    '[class*="product-summary-2-x-container"]',
    '[data-af-element="search-result"]',
    '[class*="vtex-search-result-3-x-galleryItem"]',
    '[class*="productCard"]',
    '[data-product-id]',
    'a[href$="/p"]',
    'a[href*="/p?"]',
    'li.product',
    '.product-item',
    '.product-card',
  ];
  return [
    '[itemtype*="schema.org/Product"]', 'li.product', '.product-item', '.product-card',
    '[data-testid="product-card"]',
  ];
}

function currentPriceSelectors(domain) {
  if (domain.includes('amazon.')) return [
    '[data-testid="price-section"] [class*="priceToPay"] .a-price .a-offscreen',
    '[class*="priceToPay"] .a-price:not(.a-text-price) .a-offscreen',
    '[data-testid="price-section"] .a-price:not(.a-text-price) .a-offscreen',
    '.a-price:not(.a-text-price) .a-offscreen',
    '[data-a-color="base"].a-price .a-offscreen',
    '.a-price .a-offscreen',
    '[data-testid="price-section"] .a-price',
  ];
  if (domain.includes('magazineluiza.')) return [
    '[data-testid="product-card-price-final"] .sr-only',
    '[data-testid="product-card-price-final"]',
    '[data-testid="product-card-price"] [class*="grid-area:final"] .sr-only',
    '[data-testid="product-card-price"] [class*="grid-area:final"]',
    '[data-testid="product-card-price"]',
    '[id^="price-final-label-"]',
    '[aria-labelledby^="price-final-label-"]',
    '[itemprop="price"]',
    '[data-testid="price-value"]',
  ];
  if (domain.includes('eletroclub.')) return [
    '[class*="spotPrice"]',
    '[class*="sellingPriceValue"]',
    '[class*="sellingPrice"] [class*="currencyContainer"]',
    '[class*="sellingPrice"]',
    '[class*="currencyContainer"]',
    '[data-price]',
    '[data-selling-price]',
    'ins .woocommerce-Price-amount',
    '.price ins',
    '.price .amount',
    '.price',
  ];
  return ['[itemprop="price"]', '[data-testid="price-value"]', '.price ins', '.sale-price', '.price'];
}

function originalPriceSelectors(domain) {
  if (domain.includes('amazon.')) return [
    '[data-testid="price-section"] [class*="wrapPrice"] .a-price.a-text-price .a-offscreen',
    '[class*="wrapPrice"] .a-price.a-text-price .a-offscreen',
    '[class*="wrapPrice"] .a-price.a-text-price',
    '[data-a-strike="true"] .a-offscreen',
    '.a-text-price .a-offscreen',
    'span.a-text-price',
    'del, [data-list-price]',
  ];
  if (domain.includes('magazineluiza.')) return [
    '[data-testid="product-card-price-original"] .sr-only',
    '[data-testid="product-card-price-original"]',
    '[data-testid="price-original"] .sr-only',
    '[data-testid="price-original"]',
    '[data-testid="price-old"]',
    '[data-testid="product-card-price"] [class*="grid-area:original"] .sr-only',
    '[data-testid="product-card-price"] [class*="grid-area:original"]',
    '[data-testid="product-card-price"] del',
    '[class*="originalPrice"]',
    'del',
  ];
  if (domain.includes('eletroclub.')) return [
    '[class*="listPriceValue"]',
    '[class*="listPrice"] [class*="currencyContainer"]',
    '[class*="listPrice"]',
    '[data-list-price]',
    'del .woocommerce-Price-amount',
    '.price del',
    'del',
    's',
  ];
  return ['del', '[data-testid="price-original"]', '.old-price', '.list-price'];
}

function amazonPriceFromParts(card) {
  const priceToPay = card.find('[data-testid="price-section"] [class*="priceToPay"], [class*="priceToPay"]').first();
  const target = priceToPay.length ? priceToPay : card;
  const offscreen = target.find('.a-price:not(.a-text-price) .a-offscreen, .a-price .a-offscreen').first().text();
  const parsedOff = parsePrice(offscreen);
  if (parsedOff) return parsedOff;

  const whole = target.find('.a-price-whole').first().text().replace(/\D/g, '');
  const fraction = target.find('.a-price-fraction').first().text().replace(/\D/g, '').slice(0, 2).padEnd(2, '0');
  if (whole) {
    const val = parsePrice(`${whole},${fraction || '00'}`);
    if (val) return val;
  }
  return null;
}

function amazonOriginalPrice(card, currentPrice) {
  const wrapPrice = card.find('[data-testid="price-section"] [class*="wrapPrice"], [class*="wrapPrice"]').first();
  const target = wrapPrice.length ? wrapPrice : card;
  const offscreen = target.find('.a-text-price .a-offscreen, [data-a-strike="true"] .a-offscreen, .a-price.a-text-price span[aria-hidden="true"]').first().text();
  const parsed = parsePrice(offscreen);
  if (parsed && (!currentPrice || parsed > currentPrice)) return parsed;

  const textPrice = target.find('.a-text-price, [data-a-strike="true"], span.a-text-strike').first().text();
  const parsedText = parsePrice(textPrice);
  if (parsedText && (!currentPrice || parsedText > currentPrice)) return parsedText;

  const deMatch = target.text().match(/(?:De|De:|Preço de lista:|Lista:)\s*R\$\s*([\d.,]+)/i);
  if (deMatch) {
    const parsedDe = parsePrice(deMatch[1]);
    if (parsedDe && (!currentPrice || parsedDe > currentPrice)) return parsedDe;
  }
  return null;
}

function amazonDiscount(card) {
  const badgeEl = card.find([
    '[data-component="dui-badge"] [class*="BadgeLabel"]',
    '[data-component="dui-badge"] span.a-size-mini',
    '[class*="filledRoundedBadgeLabel"]',
    '[class*="badgeContainer"] span',
    '[data-testid*="badge"]',
    'span[class*="savingPriceOverride"]',
    'span.reinventPriceSavingsPercentageMargin',
    'span.savingsPercentage',
    '[data-a-badge-color="savings"]',
  ].join(', ')).first();
  if (badgeEl.length) {
    const d = parseDiscount(badgeEl.text());
    if (d) return d;
  }
  return parseDiscount(card.text());
}

function magaluPriceFromParts(card) {
  const finalSrOnly = card.find('[data-testid="product-card-price-final"] .sr-only, [data-testid="product-card-price"] [class*="grid-area:final"] .sr-only, [id^="price-final-label-"]').first().text();
  if (finalSrOnly) {
    const parsed = parsePrice(finalSrOnly);
    if (parsed > 0) return parsed;
  }
  const finalEl = card.find('[data-testid="product-card-price-final"], [id^="price-final-label-"], [aria-labelledby^="price-final-label-"], [class*="grid-area:final"], [data-testid="product-card-price"]').first();
  const target = finalEl.length ? finalEl : card;
  const integer = target.find('[data-testid="price-value-integer"]').first().text().replace(/\D/g, '')
    || card.find('[data-testid="price-value-integer"]').first().text().replace(/\D/g, '');
  const centsEl = target.find('[data-testid="price-value-split-cents-fraction"], [data-testid="price-value-cents"]').first();
  const cents = centsEl.length ? centsEl.text().replace(/\D/g, '').slice(0, 2).padEnd(2, '0') : '00';
  if (integer) {
    const parsed = parsePrice(`${integer},${cents}`);
    if (parsed > 0) return parsed;
  }
  const labelPrice = firstPrice(target.text());
  if (labelPrice) return labelPrice;
  return null;
}

function magaluOriginalPrice(card, currentPrice) {
  const origEl = card.find([
    '[data-testid="product-card-price-original"] .sr-only',
    '[data-testid="product-card-price-original"]',
    '[data-testid="price-original"] .sr-only',
    '[data-testid="price-original"]',
    '[data-testid="price-old"]',
    '[data-testid="product-card-price"] [class*="grid-area:original"] .sr-only',
    '[data-testid="product-card-price"] [class*="grid-area:original"]',
    '[class*="grid-area:original"]',
    '[data-testid="product-card-price"] del',
    '[class*="originalPrice"]',
    'del',
  ].join(', ')).first();
  if (origEl.length) {
    const raw = origEl.attr('content') || origEl.text();
    const val = parsePrice(raw);
    if (val && val > currentPrice) return val;
  }
  const cardText = card.text();
  const deMatch = cardText.match(/(?:De|De:)\s*R\$\s*([\d.,]+)/i);
  if (deMatch) {
    const val = parsePrice(deMatch[1]);
    if (val && val > currentPrice) return val;
  }
  const installmentText = card.find('[data-testid="product-card-price-installment"]').text() || cardText;
  const ouMatch = installmentText.match(/ou\s+R\$\s*([\d.,]+)/i);
  if (ouMatch) {
    const val = parsePrice(ouMatch[1]);
    if (val && val > currentPrice) return val;
  }
  return null;
}

function magaluDiscount(card) {
  const tagElements = card.find([
    '[data-testid="tag"]',
    '[class*="grid-area:discount"]',
    '[data-testid*="discount"]',
    '[class*="tag"]',
    'span[aria-label*="off" i]',
  ].join(', '));
  for (let i = 0; i < tagElements.length; i++) {
    const el = tagElements.eq(i);
    const aria = el.attr('aria-label') || '';
    const text = el.text() || '';
    const d = parseDiscount(aria) || parseDiscount(text);
    if (d) return d;
  }
  return parseDiscount(card.text());
}

function eletroclubPrice(card) {
  const spot = card.find('[class*="spotPrice"]').first().text();
  const spotVal = parsePrice(spot);
  if (spotVal > 0) return spotVal;

  const selling = card.find('[class*="sellingPriceValue"], [class*="sellingPrice"] [class*="currencyContainer"]').first().text();
  const sellingVal = parsePrice(selling);
  if (sellingVal > 0) return sellingVal;

  return null;
}

function eletroclubOriginalPrice(card, currentPrice) {
  const listEl = card.find([
    '[class*="listPriceValue"]',
    '[class*="listPrice"] [class*="currencyContainer"]',
    '[class*="listPrice"]',
    '[data-list-price]',
    'del',
    's',
  ].join(', ')).first();
  if (listEl.length) {
    const val = parsePrice(listEl.text());
    if (val && (!currentPrice || val > currentPrice)) return val;
  }
  const deMatch = card.text().match(/(?:De|De:|Por:?)\s*R\$\s*([\d.,]+)/i);
  if (deMatch) {
    const parsedDe = parsePrice(deMatch[1]);
    if (parsedDe && (!currentPrice || parsedDe > currentPrice)) return parsedDe;
  }
  return null;
}

function eletroclubDiscount(card) {
  const badges = card.find([
    '[class*="savingsPercentage"]',
    '[class*="discountBadge"]',
    '[class*="discountPercentage"]',
    '[class*="discount"]',
    '[class*="seal"]',
  ].join(', '));
  for (let i = 0; i < badges.length; i++) {
    const el = badges.eq(i);
    const d = parseDiscount(el.text()) || parseDiscount(el.attr('aria-label'));
    if (d) return d;
  }
  return parseDiscount(card.text());
}

function parseJsonLd($) {
  const products = [];
  $('script[type="application/ld+json"]').each((_, script) => {
    try {
      const value = JSON.parse($(script).contents().text());
      visitStructured(value, products);
    } catch {
      // Ignora blocos inválidos e tenta as marcações/elementos da página.
    }
  });
  return products;
}

function visitStructured(value, products) {
  if (!value) return;
  if (Array.isArray(value)) {
    for (const child of value) visitStructured(child, products);
    return;
  }
  if (typeof value !== 'object') return;
  const types = (Array.isArray(value['@type']) ? value['@type'] : [value['@type']])
    .filter(Boolean).map((type) => String(type).split(/[\/#]/).pop());
  if (types.includes('Product')) {
    const offerValue = Array.isArray(value.offers) ? value.offers[0] : value.offers;
    const offer = offerValue?.offers || offerValue;
    const image = Array.isArray(value.image) ? value.image[0] : value.image;
    products.push({
      name: value.name,
      url: offer?.url || value.url,
      price: parsePrice(offer?.price ?? offer?.lowPrice),
      originalPrice: parsePrice(offer?.highPrice),
      currency: offer?.priceCurrency || 'BRL',
      imageUrl: typeof image === 'object' ? image.url : image,
    });
  }
  if (value.item && typeof value.item === 'object') visitStructured(value.item, products);
  if (value.itemListElement) visitStructured(value.itemListElement, products);
  if (value['@graph']) visitStructured(value['@graph'], products);
}

function textFirst(card, selectors) {
  for (const selector of selectors) {
    const value = card.find(selector).first().text().trim();
    if (value) return value;
  }
  return null;
}

function priceFirst(card, selectors) {
  for (const selector of selectors) {
    const element = card.find(selector).first();
    if (!element.length) continue;
    const raw = element.attr('content') || element.text();
    const value = parsePrice(raw);
    if (value > 0) return value;
  }
  return null;
}

function firstPrice(text) {
  const matches = String(text || '').match(/R\$\s*\d[\d.]*(?:,\d{2})?/g) || [];
  for (const value of matches) {
    const parsed = parsePrice(value);
    if (parsed > 0) return parsed;
  }
  return null;
}

function parsePrice(value) {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : null;
  const str = String(value || '').replace(/\u00a0/g, ' ').trim();
  const match = str.match(/R\$\s*([\d.]+,\d{2})/i) || str.match(/([\d.]+,\d{2})/);
  if (match) {
    const num = Number(match[1].replace(/\./g, '').replace(',', '.'));
    if (Number.isFinite(num) && num > 0) return num;
  }
  const raw = str.replace(/[^\d.,]/g, '');
  if (!raw) return null;
  const normalized = raw.includes(',')
    ? raw.replace(/\./g, '').replace(',', '.')
    : raw.replace(/\.(?=\d{3}(?:\D|$))/g, '');
  const result = Number(normalized);
  return Number.isFinite(result) && result > 0 ? result : null;
}

function parseDiscount(value) {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 && value < 100 ? Math.round(value) : null;
  const str = String(value || '').trim();
  const match = str.match(/(?:^|[^\d])[-]?(\d{1,2}(?:\.\d+)?)\s*%\s*(?:off|de\s+desconto)?/i);
  if (match) {
    const val = parseFloat(match[1]);
    if (Number.isFinite(val) && val > 0 && val < 100) return Math.round(val);
  }
  return null;
}

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 500);
}

module.exports = { parseListing, parseCapturedProducts, parsePrice, parseDiscount, diagnoseListing };
