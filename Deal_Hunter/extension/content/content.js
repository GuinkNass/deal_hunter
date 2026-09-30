// Captura somente marcações de produto da página já renderizada no Chrome.
// Credenciais e cookies nunca são lidos nem enviados ao backend.
(function () {
  const PAGE_SELECTORS = [
    // Amazon
    '[data-testid="product-card"]',
    '[data-deal-id]',
    '[data-csa-c-item-type="deal"]',
    '[data-component-type="s-search-result"][data-asin]',
    '[data-asin][data-index]',
    '[data-asin]',
    '[class*="ProductCard-module__card"]',
    '[data-testid*="deal-card"]', '[data-testid*="dealCard"]',
    '[class*="DealCard"]', '[class*="deal-card"]', '[class*="DealGridItem"]',
    'a[href*="/dp/"]', 'a[href*="/gp/product/"]', 'a[href*="/deal/"]',

    // Magazine Luiza (prioriza containers de card completos)
    '[data-testid="product-card-container"]',
    'div[data-testid="product-card-container"]',
    'li[data-testid="product-list-item"]',
    'a[data-testid="product-card-link"]',
    'a[href*="/p/"]',

    // Pichau
    'a[data-cy="list-product"]',
    '[data-cy="list-product"]',
    '[class*="product_item"]',
    'div.MuiCard-root',
    '[class*="MuiCard"]',

    // Shein
    '[class*="bs-product-card"]',
    '[class*="product-list__item"]',
    'a[href*="-p-"]',
    '.c-goodsitem',
    '.c-goods-item',

    // Shopee
    '[data-sq="item"]',
    '[class*="shopee-search-item-result__item"]',
    'div.shopee-search-item-result__item',
    'a[href*="-i."]',

    // KaBuM!
    'article[class*="productCard"]',
    '[class*="productCard"]',
    'a[href*="/produto/"]',

    // Lojas Renner
    '[class*="product_item"]',
    '[class*="product-card"]',
    'a[href*="/p/"]',

    // Electro Club / VTEX
    '.vtex-product-summary-2-x-container',
    '[class*="vtex-product-summary-2-x-container"]',
    '[class*="vtex-search-result-3-x-galleryItem"]',
    'section[class*="vtex-product-summary"]',
    'article[class*="vtex-product-summary"]',
    '[data-af-element="search-result"]',
    '[class*="galleryItem"]',
    '[class*="product-summary"]',
    '[class*="productCard"]',
    '[data-product-id]',
    'a[href*="/p"]',
  ];

  const host = location.hostname.toLowerCase();
  const isAmazon = host.includes('amazon.');
  const isMagalu = host.includes('magazineluiza.');
  const isEletroclub = host.includes('eletroclub.');
  const isPichau = host.includes('pichau.');
  const isShein = host.includes('shein.');
  const isShopee = host.includes('shopee.');
  const isKabum = host.includes('kabum.');
  const isRenner = host.includes('lojasrenner.') || host.includes('renner.');
  const siteTag = isMagalu ? 'Magalu'
    : isEletroclub ? 'Eletroclub'
    : isAmazon ? 'Amazon'
    : isPichau ? 'Pichau'
    : isShein ? 'Shein'
    : isShopee ? 'Shopee'
    : isKabum ? 'KaBuM!'
    : isRenner ? 'Renner'
    : 'Loja';

  const MONEY_RE = /R\$\s*\d[\d.\u00a0 ]*(?:,\d{2})?/g;
  const MAX_SCROLL_ROUNDS = 20;

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
    const price = Number(normalized);
    return Number.isFinite(price) && price > 0 ? price : null;
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

  function cardFor(element) {
    if (isMagalu) {
      const container = element.closest('[data-testid="product-card-container"], li[data-testid="product-list-item"]');
      if (container) return container;
    }
    if (isPichau) {
      const pichauCard = element.closest('a[data-cy="list-product"], [class*="product_item"], [class*="MuiCard-root"]');
      if (pichauCard) return pichauCard;
    }
    if (isShein) {
      const sheinCard = element.closest('[class*="bs-product-card"], [class*="product-list__item"], [role="listitem"]');
      if (sheinCard) return sheinCard;
    }
    if (isShopee) {
      const shopeeCard = element.closest('[data-sq="item"], [class*="shopee-search-item-result__item"], a[href*="-i."]');
      if (shopeeCard) return shopeeCard;
    }
    if (isKabum) {
      const kabumCard = element.closest('article[class*="productCard"], [class*="productCard"]');
      if (kabumCard) return kabumCard;
    }
    if (isRenner) {
      const rennerCard = element.closest('[class*="product_item"], [class*="product-card"]');
      if (rennerCard) return rennerCard;
    }

    const knownCard = element.closest([
      '[data-testid="product-card-container"]',
      '[data-testid="product-card"]',
      'a[data-cy="list-product"]',
      '[class*="bs-product-card"]',
      '[data-sq="item"]',
      'article[class*="productCard"]',
      'li[data-testid="product-list-item"]',
      'li[data-testid*="product" i]',
      '[data-deal-id]',
      '[data-csa-c-item-type="deal"]',
      '[data-asin]',
      '[data-component-type="s-search-result"]',
      '[data-testid*="deal-card" i]',
      '[data-testid*="dealCard" i]',
      '[class*="DealCard" i]',
      '[class*="DealGridItem" i]',
      '[class*="ProductCard-module__card" i]',
      '[class*="product-summary-2-x-container" i]',
      'section[class*="vtex-product-summary" i]',
      'article[class*="vtex-product-summary" i]',
      '[data-af-element="search-result"]',
      '[class*="galleryItem" i]',
      '[class*="product-summary" i]',
      '[class*="product_item" i]',
    ].join(', '));
    if (knownCard) return knownCard;

    let current = element;
    for (let depth = 0; depth < 7 && current?.parentElement; depth += 1) {
      const text = current.innerText || '';
      if (text.length > 3000) break;
      MONEY_RE.lastIndex = 0;
      const hasPrice = MONEY_RE.test(text);
      MONEY_RE.lastIndex = 0;
      if (hasPrice) {
        return current;
      }
      current = current.parentElement;
    }
    return element.closest('[data-testid="product-card-container"], [data-testid="product-card"], a[data-cy="list-product"], [class*="bs-product-card"], [data-sq="item"], [data-asin]') || element;
  }

  function productFrom(element) {
    const card = cardFor(element);
    const link = element.closest('a[href]') || (card.matches('a[href]') ? card : card.querySelector('a[href]'));
    if (!link) return null;
    let href = link.getAttribute('href') || link.href;
    if (!href) return null;
    try {
      const parsedUrl = new URL(href, location.origin);
      href = parsedUrl.href;
      const linkHost = parsedUrl.hostname.replace(/^www\./, '');
      const locHost = location.hostname.replace(/^www\./, '');
      if (linkHost !== locHost && !linkHost.endsWith(`.${locHost}`)) return null;
    } catch {
      return null;
    }

    let name = '';
    let price = null;
    let originalPrice = null;
    let advertisedDiscount = null;

    if (isAmazon) {
      // 1. TÍTULO AMAZON (Cascata de 4 níveis)
      const nameElement = card.querySelector([
        'p[class*="ProductCard-module__title"] .a-truncate-full',
        'p[id^="title-"] .a-truncate-full',
        'p[class*="ProductCard-module__title"] .a-truncate-cut',
        '.a-truncate-full',
        '.a-truncate-cut',
        '[data-testid="product-title"]',
        '[data-testid="product-name"]',
        'h2 a', 'h2', 'h3 a', 'h3',
        '.product-title', '.product-name',
      ].join(', '));
      name = (nameElement?.innerText || link.getAttribute('title') || card.querySelector('img')?.alt || '')
        .replace(/\s+/g, ' ').trim().slice(0, 500);

      // 2. PREÇO ATUAL AMAZON (Cascata de 6 níveis resiliente)
      const curEl = card.querySelector([
        '[data-testid="price-section"] [class*="priceToPay"] .a-price:not(.a-text-price) .a-offscreen',
        '[data-testid="price-section"] [class*="priceToPay"] .a-price:not(.a-text-price) span[aria-hidden="true"]',
        '[class*="priceToPay"] .a-price:not(.a-text-price) .a-offscreen',
        '[class*="priceToPay"] .a-price:not(.a-text-price) span[aria-hidden="true"]',
        '[data-testid="price-section"] .a-price:not(.a-text-price) .a-offscreen',
        '.a-price:not(.a-text-price) .a-offscreen',
        '.a-price:not(.a-text-price) span[aria-hidden="true"]',
        '[data-a-color="base"].a-price:not(.a-text-price) .a-offscreen',
        '.a-price .a-offscreen',
      ].join(', '));
      if (curEl) price = parsePrice(curEl.textContent || curEl.innerText);

      if (!price) {
        const whole = card.querySelector('.a-price-whole')?.innerText?.replace(/\D/g, '');
        const fraction = card.querySelector('.a-price-fraction')?.innerText?.replace(/\D/g, '').slice(0, 2).padEnd(2, '0');
        if (whole) price = parsePrice(`${whole},${fraction || '00'}`);
      }

      // 3. PREÇO ORIGINAL "DE" AMAZON (Cascata de 6 níveis + regex resiliente)
      const origEl = card.querySelector([
        '[data-testid="price-section"] [class*="wrapPrice"] .a-price.a-text-price .a-offscreen',
        '[data-testid="price-section"] [class*="wrapPrice"] .a-price.a-text-price span[aria-hidden="true"]',
        '[class*="wrapPrice"] .a-price.a-text-price .a-offscreen',
        '[class*="wrapPrice"] .a-price.a-text-price span[aria-hidden="true"]',
        '.a-price.a-text-price .a-offscreen',
        '.a-price.a-text-price span[aria-hidden="true"]',
        '[data-a-strike="true"] .a-offscreen',
        '[data-a-strike="true"] span[aria-hidden="true"]',
        'span.a-text-strike',
        'del',
      ].join(', '));
      if (origEl) originalPrice = parsePrice(origEl.textContent || origEl.innerText);

      if (!originalPrice || originalPrice <= price) {
        const deMatch = (card.innerText || '').match(/(?:De|De:|Preço de lista:|Lista:)\s*R\$\s*([\d.,]+)/i);
        if (deMatch) {
          const parsedDe = parsePrice(deMatch[1]);
          if (parsedDe && (!price || parsedDe > price)) originalPrice = parsedDe;
        }
      }

      // 4. DESCONTO % AMAZON (Cascata de 5 níveis + regex)
      const badgeEl = card.querySelector([
        '[data-component="dui-badge"] [class*="BadgeLabel"]',
        '[data-component="dui-badge"] span.a-size-mini',
        '[class*="filledRoundedBadgeLabel"]',
        '[class*="badgeContainer"] span',
        '[data-testid*="badge"]',
        'span[class*="savingPriceOverride"]',
        'span.reinventPriceSavingsPercentageMargin',
        'span.savingsPercentage',
        '[data-a-badge-color="savings"]',
      ].join(', '));
      if (badgeEl) advertisedDiscount = parseDiscount(badgeEl.innerText || badgeEl.textContent);
      if (!advertisedDiscount) advertisedDiscount = parseDiscount(card.innerText);

      // Bidirecional Amazon: se temos desconto % e preço atual mas não o original
      if (!originalPrice && advertisedDiscount && price > 0) {
        originalPrice = Math.round((price / (1 - advertisedDiscount / 100)) * 100) / 100;
      }
      // Se temos o preço original e o preço atual mas não o desconto %, calcula a porcentagem
      if (!advertisedDiscount && originalPrice && price && originalPrice > price) {
        advertisedDiscount = Math.round(((originalPrice - price) / originalPrice) * 100);
      }

    } else if (isMagalu) {
      // 1. TÍTULO MAGALU (Cascata de 6 níveis resiliente)
      const nameElement = card.querySelector([
        '[data-testid="product-card-title"]',
        'h3[data-testid="product-card-title"]',
        'h2[data-testid="product-card-title"]',
        '[data-testid*="product-card-title"]',
        '[data-testid*="product-title"]',
        '[data-testid*="product-name"]',
        'h3', 'h2', 'h1',
        '[class*="productName"]',
        '[class*="productTitle"]',
      ].join(', '));
      name = (nameElement?.innerText || link.getAttribute('title') || card.querySelector('img')?.alt || '')
        .replace(/\s+/g, ' ').trim().slice(0, 500);

      // 2. PREÇO ATUAL MAGALU (Cascata de 7 níveis)
      const finalSrOnly = card.querySelector([
        '[data-testid="product-card-price-final"] .sr-only',
        '[data-testid="product-card-price"] [class*="grid-area:final"] .sr-only',
        '[id^="price-final-label-"]',
        '[data-testid*="price-final"] .sr-only',
      ].join(', '));
      if (finalSrOnly) price = parsePrice(finalSrOnly.innerText || finalSrOnly.textContent);

      if (!price) {
        const finalPriceEl = card.querySelector([
          '[data-testid="product-card-price-final"]',
          '[data-testid*="product-card-price-final"]',
          '[data-testid="product-card-price"] [class*="grid-area:final"]',
          '[class*="grid-area:final"]',
          '[data-testid="product-card-price"]',
          '[aria-labelledby^="price-final-label-"]',
          '[data-testid*="price-final"]',
        ].join(', '));
        const searchRoot = finalPriceEl || card;
        const integer = searchRoot.querySelector('[data-testid="price-value-integer"]')?.innerText?.replace(/\D/g, '')
          || card.querySelector('[data-testid="price-value-integer"]')?.innerText?.replace(/\D/g, '');
        const centsEl = searchRoot.querySelector('[data-testid="price-value-split-cents-fraction"], [data-testid="price-value-cents"]')
          || card.querySelector('[data-testid="price-value-split-cents-fraction"], [data-testid="price-value-cents"]');
        const cents = centsEl ? centsEl.innerText.replace(/\D/g, '').slice(0, 2).padEnd(2, '0') : '00';
        if (integer) price = parsePrice(`${integer},${cents}`);
        if (!price && finalPriceEl) {
          price = parsePrice(finalPriceEl.getAttribute('content') || finalPriceEl.innerText);
        }
      }

      if (!price) {
        // Fallback textual para preço no Magalu (ex: "no Pix", "à vista", ou primeiro R$)
        const priceContainer = card.querySelector('[data-testid*="price"], [class*="price"]');
        const priceText = priceContainer ? (priceContainer.innerText || '') : '';
        const matchPix = priceText.match(/R\$\s*([\d.]+,\d{2})\s*(?:no\s+Pix|à\s+vista)?/i);
        if (matchPix) price = parsePrice(matchPix[1]);
      }

      // 3. PREÇO ORIGINAL "DE" MAGALU (Cascata de 6 níveis + regex)
      const origEl = card.querySelector([
        '[data-testid="product-card-price-original"] .sr-only',
        '[data-testid="product-card-price-original"]',
        '[data-testid*="price-original"] .sr-only',
        '[data-testid*="price-original"]',
        '[data-testid="price-old"]',
        '[data-testid*="price-old"]',
        '[data-testid="product-card-price"] [class*="grid-area:original"]',
        '[class*="grid-area:original"]',
        '[data-testid="product-card-price"] del',
        '[class*="originalPrice"]',
        'del, s, strike',
      ].join(', '));
      if (origEl) originalPrice = parsePrice(origEl.getAttribute('content') || origEl.textContent || origEl.innerText);

      if (!originalPrice || originalPrice <= price) {
        const deMatch = (card.innerText || card.textContent || '').match(/(?:De|De:)\s*R\$\s*([\d.,]+)/i);
        if (deMatch) {
          const parsedDe = parsePrice(deMatch[1]);
          if (parsedDe && (!price || parsedDe > price)) originalPrice = parsedDe;
        }
      }

      if (!originalPrice || originalPrice <= price) {
        const installmentEl = card.querySelector('[data-testid*="price-installment"], [data-testid="product-card-price-installment"]');
        const installmentText = installmentEl ? (installmentEl.textContent || installmentEl.innerText || '') : '';
        const ouMatch = installmentText.match(/ou\s+R\$\s*([\d.,]+)/i) || (card.innerText || '').match(/ou\s+R\$\s*([\d.,]+)/i);
        if (ouMatch) {
          const parsedOu = parsePrice(ouMatch[1]);
          if (parsedOu && parsedOu > price) originalPrice = parsedOu;
        }
      }

      // 4. DESCONTO % MAGALU (Loop inteligente sobre todos os badges do card)
      const tagCandidates = card.querySelectorAll([
        '[data-testid="product-card-price"] [class*="grid-area:discount"]',
        '[data-testid="product-card-price"] [data-testid="tag"]',
        '[class*="grid-area:discount"]',
        '[data-testid*="discount"]',
        '[data-testid="tag"]',
        '[class*="discount" i]',
        'span[class*="tag" i]',
      ].join(', '));
      for (const el of tagCandidates) {
        const aria = el.getAttribute('aria-label') || '';
        const d = parseDiscount(aria) || parseDiscount(el.textContent || el.innerText);
        if (d && d > 0 && d < 100) {
          advertisedDiscount = d;
          break;
        }
      }
      if (!advertisedDiscount) advertisedDiscount = parseDiscount(card.innerText || card.textContent);

      // Bidirecional Magalu
      if (!originalPrice && advertisedDiscount && price > 0) {
        originalPrice = Math.round((price / (1 - advertisedDiscount / 100)) * 100) / 100;
      }
      if (!advertisedDiscount && originalPrice && price && originalPrice > price) {
        advertisedDiscount = Math.round(((originalPrice - price) / originalPrice) * 100);
      }

    } else if (isEletroclub) {
      // 1. TÍTULO ELETROCLUB (VTEX)
      const nameElement = card.querySelector([
        '[class*="vtex-product-summary-2-x-brandName"]',
        '[class*="vtex-product-summary-2-x-nameWrapper"]',
        '[class*="productBrand"]',
        '[class*="productName"]',
        '[class*="nameContainer"]',
        '[data-testid="product-title"]',
        '[data-testid="product-name"]',
        'h2', 'h3', 'h1',
        '[class*="product-title"]',
      ].join(', '));
      name = (nameElement?.textContent || nameElement?.innerText || link.getAttribute('title') || card.querySelector('img')?.alt || '')
        .replace(/\s+/g, ' ').trim().slice(0, 500);

      // 2. PREÇO ATUAL ELETROCLUB (VTEX Por)
      const curEl = card.querySelector([
        '[class*="spotPrice"]',
        '[class*="sellingPriceValue"]',
        '[class*="sellingPrice"] [class*="currencyContainer"]',
        '[class*="sellingPrice"]',
        '[class*="currencyContainer"]',
        '[itemprop="price"]',
        '[data-price]',
        '[data-selling-price]',
        '.price',
      ].join(', '));
      if (curEl) price = parsePrice(curEl.getAttribute('content') || curEl.getAttribute('data-price') || curEl.getAttribute('data-selling-price') || curEl.textContent || curEl.innerText);

      // 3. PREÇO ORIGINAL "DE" ELETROCLUB (VTEX De)
      const origEl = card.querySelector([
        '[class*="listPriceValue"]',
        '[class*="listPrice"] [class*="currencyContainer"]',
        '[class*="listPrice"]',
        '[data-list-price]',
        'del', 's', 'strike',
      ].join(', '));
      if (origEl) originalPrice = parsePrice(origEl.getAttribute('content') || origEl.getAttribute('data-list-price') || origEl.textContent || origEl.innerText);

      if (!originalPrice || originalPrice <= price) {
        const deMatch = (card.innerText || card.textContent || '').match(/(?:De|De:)\s*R\$\s*([\d.,]+)/i);
        if (deMatch) {
          const parsedDe = parsePrice(deMatch[1]);
          if (parsedDe && (!price || parsedDe > price)) originalPrice = parsedDe;
        }
      }

      // 4. DESCONTO % ELETROCLUB (VTEX)
      const badgeCandidates = card.querySelectorAll([
        '[class*="savingsPercentage"]',
        '[class*="discountBadge"]',
        '[class*="discountPercentage"]',
        '[class*="discount-tag"]',
        '[class*="discountTag"]',
        '[class*="discount"]',
        '[class*="badge"]',
        '[class*="highlightText"]',
      ].join(', '));
      for (const el of badgeCandidates) {
        const d = parseDiscount(el.textContent || el.innerText);
        if (d && d > 0 && d < 100) {
          advertisedDiscount = d;
          break;
        }
      }
      if (!advertisedDiscount) advertisedDiscount = parseDiscount(card.innerText || card.textContent);

      // Bidirecional Eletroclub
      if (!originalPrice && advertisedDiscount && price > 0) {
        originalPrice = Math.round((price / (1 - advertisedDiscount / 100)) * 100) / 100;
      }
      if (!advertisedDiscount && originalPrice && price && originalPrice > price) {
        advertisedDiscount = Math.round(((originalPrice - price) / originalPrice) * 100);
      }

    } else if (isPichau) {
      // 1. TÍTULO PICHAU
      const nameEl = card.querySelector('h2[class*="product_info_title"], [class*="product_info_title"], h2, [class*="productName"]');
      name = (nameEl?.innerText || card.querySelector('img[alt]')?.alt || card.querySelector('img[title]')?.title || link.getAttribute('title') || '')
        .replace(/\s+/g, ' ').trim().slice(0, 500);

      // 2. PREÇO ATUAL (À vista / Por)
      const porEl = card.querySelector('[class*="price_vista"], [class*="price_total"], [class*="finalPrice"]');
      if (porEl) price = parsePrice(porEl.innerText || porEl.textContent);
      if (!price) {
        const porMatch = (card.innerText || '').match(/(?:por|à\s+vista|no\s+pix|por\s+apenas)\s*R\$\s*([\d.,]+)/i)
          || (card.innerText || '').match(/R\$\s*([\d.,]+)\s*à\s*vista/i);
        if (porMatch) price = parsePrice(porMatch[1]);
      }

      // 3. PREÇO ORIGINAL "DE" PICHAU
      const deEl = card.querySelector('[class*="price_from"] [class*="strikeThrough"], [class*="strikeThrough"], [class*="price_from"], del, s');
      if (deEl) originalPrice = parsePrice(deEl.innerText || deEl.textContent);
      if (!originalPrice || originalPrice <= price) {
        const deMatch = (card.innerText || '').match(/(?:de|de:)\s*R\$\s*([\d.,]+)/i);
        if (deMatch) {
          const parsedDe = parsePrice(deMatch[1]);
          if (parsedDe && (!price || parsedDe > price)) originalPrice = parsedDe;
        }
      }

      // 4. DESCONTO % PICHAU
      const discEl = card.querySelector('[class*="availability_span_discount"], [class*="discount"]');
      if (discEl) advertisedDiscount = parseDiscount(discEl.innerText || discEl.textContent);
      if (!advertisedDiscount) {
        const discMatch = (card.innerText || '').match(/(\d{1,2})\s*%\s*OFF/i);
        if (discMatch) advertisedDiscount = Number(discMatch[1]);
      }

      // Bidirecional Pichau
      if (!originalPrice && advertisedDiscount && price > 0) {
        originalPrice = Math.round((price / (1 - advertisedDiscount / 100)) * 100) / 100;
      }
      if (!advertisedDiscount && originalPrice && price && originalPrice > price) {
        advertisedDiscount = Math.round(((originalPrice - price) / originalPrice) * 100);
      }

    } else if (isShein) {
      // 1. TÍTULO SHEIN
      const nameEl = card.querySelector('[class*="goods-name-text"], [class*="goods-title-link"], a[title]');
      name = (nameEl?.innerText || nameEl?.getAttribute('title') || card.querySelector('img[alt]')?.alt || '')
        .replace(/^-\d+%\s*/, '')
        .replace(/\s+/g, ' ').trim().slice(0, 500);

      // 2. PREÇO ATUAL SHEIN
      const curEl = card.querySelector('[class*="final-price"], [class*="offscreen"], [class*="price__main"], [class*="sale-price"]');
      if (curEl) price = parsePrice(curEl.innerText || curEl.textContent);
      if (!price) {
        const prices = (card.innerText || '').match(MONEY_RE) || [];
        if (prices.length) price = parsePrice(prices[0]);
      }

      // 3. PREÇO ORIGINAL "DE" SHEIN
      const origEl = card.querySelector('[class*="price__secondary"] del, del, s, [class*="original-price"]');
      if (origEl) originalPrice = parsePrice(origEl.innerText || origEl.textContent);

      // 4. DESCONTO % SHEIN
      const discEl = card.querySelector('[class*="discount-label"], [class*="title-discount-label"], [class*="discount"]');
      if (discEl) advertisedDiscount = parseDiscount(discEl.getAttribute('aria-label') || discEl.innerText || discEl.textContent);
      if (!advertisedDiscount) {
        const discMatch = (card.innerText || '').match(/[-](\d{1,2})%/i);
        if (discMatch) advertisedDiscount = Number(discMatch[1]);
      }

      // Bidirecional Shein
      if (!originalPrice && advertisedDiscount && price > 0) {
        originalPrice = Math.round((price / (1 - advertisedDiscount / 100)) * 100) / 100;
      }
      if (!advertisedDiscount && originalPrice && price && originalPrice > price) {
        advertisedDiscount = Math.round(((originalPrice - price) / originalPrice) * 100);
      }

    } else if (isShopee) {
      // 1. TÍTULO SHOPEE
      const nameEl = card.querySelector('[class*="line-clamp-2"], div[class*="truncate"], [class*="title"], [class*="name"]');
      name = (nameEl?.innerText || card.querySelector('img[alt]')?.alt || '')
        .replace(/\s+/g, ' ').trim().slice(0, 500);

      // 2. PREÇO ATUAL SHOPEE
      const curEl = card.querySelector('[class*="text-shopee-primary"], span.text-base, [class*="font-medium"], [class*="price"]');
      if (curEl) price = parsePrice(curEl.innerText || curEl.textContent);
      if (!price) {
        const prices = (card.innerText || '').match(MONEY_RE) || [];
        if (prices.length) price = parsePrice(prices[0]);
      }

      // 3. PREÇO ORIGINAL SHOPEE
      const origEl = card.querySelector('del, s, [class*="text-xs"][class*="line-through"], [class*="line-through"]');
      if (origEl) originalPrice = parsePrice(origEl.innerText || origEl.textContent);

      // 4. DESCONTO % SHOPEE
      const discEl = card.querySelector('[class*="discount"], [class*="text-xs"][class*="text-shopee-primary"]');
      if (discEl) advertisedDiscount = parseDiscount(discEl.innerText || discEl.textContent);
      if (!advertisedDiscount) {
        const discMatch = (card.innerText || '').match(/[-](\d{1,2})%/i);
        if (discMatch) advertisedDiscount = Number(discMatch[1]);
      }

      // Bidirecional Shopee
      if (!originalPrice && advertisedDiscount && price > 0) {
        originalPrice = Math.round((price / (1 - advertisedDiscount / 100)) * 100) / 100;
      }
      if (!advertisedDiscount && originalPrice && price && originalPrice > price) {
        advertisedDiscount = Math.round(((originalPrice - price) / originalPrice) * 100);
      }

    } else if (isKabum) {
      // 1. TÍTULO KABUM
      const nameEl = card.querySelector('[class*="nameCard"], [data-testid="product-title"], h2, h3');
      name = (nameEl?.innerText || card.querySelector('img[alt]')?.alt || '')
        .replace(/\s+/g, ' ').trim().slice(0, 500);

      // 2. PREÇO ATUAL KABUM
      const curEl = card.querySelector('[class*="priceCard"], [class*="price"], [class*="finalPrice"]');
      if (curEl) price = parsePrice(curEl.innerText || curEl.textContent);

      // 3. PREÇO ORIGINAL KABUM
      const origEl = card.querySelector('[class*="oldPriceCard"], del, s');
      if (origEl) originalPrice = parsePrice(origEl.innerText || origEl.textContent);

      // 4. DESCONTO KABUM
      const discEl = card.querySelector('[class*="discountCard"], [class*="tagDiscount"], [class*="discount"]');
      if (discEl) advertisedDiscount = parseDiscount(discEl.innerText || discEl.textContent);

      if (!originalPrice && advertisedDiscount && price > 0) {
        originalPrice = Math.round((price / (1 - advertisedDiscount / 100)) * 100) / 100;
      }
      if (!advertisedDiscount && originalPrice && price && originalPrice > price) {
        advertisedDiscount = Math.round(((originalPrice - price) / originalPrice) * 100);
      }

    } else if (isRenner) {
      // 1. TÍTULO RENNER
      const nameEl = card.querySelector('[class*="product_name"], [class*="title"], h2, h3');
      name = (nameEl?.innerText || card.querySelector('img[alt]')?.alt || '')
        .replace(/\s+/g, ' ').trim().slice(0, 500);

      // 2. PREÇO ATUAL RENNER
      const curEl = card.querySelector('[class*="best_price"], [class*="price_sale"], [class*="price"]');
      if (curEl) price = parsePrice(curEl.innerText || curEl.textContent);

      // 3. PREÇO ORIGINAL RENNER
      const origEl = card.querySelector('[class*="list_price"], del, s');
      if (origEl) originalPrice = parsePrice(origEl.innerText || origEl.textContent);

      // 4. DESCONTO RENNER
      const discEl = card.querySelector('[class*="discount"], [class*="flag_discount"]');
      if (discEl) advertisedDiscount = parseDiscount(discEl.innerText || discEl.textContent);

      if (!originalPrice && advertisedDiscount && price > 0) {
        originalPrice = Math.round((price / (1 - advertisedDiscount / 100)) * 100) / 100;
      }
      if (!advertisedDiscount && originalPrice && price && originalPrice > price) {
        advertisedDiscount = Math.round(((originalPrice - price) / originalPrice) * 100);
      }

    } else {
      // OUTRAS LOJAS
      const nameElement = card.querySelector([
        '[data-testid="product-title"]', '[data-testid="product-name"]',
        'h2', 'h3', 'h1',
        '[class*="productName"]', '[class*="nameContainer"]',
        '[class*="product-title"]',
      ].join(','));
      name = (nameElement?.innerText || link.getAttribute('title') || card.querySelector('img')?.alt || '')
        .replace(/\s+/g, ' ').trim().slice(0, 500);

      const currentPriceElement = card.querySelector([
        '[class*="sellingPriceValue"]', '[class*="sellingPrice"]', '[class*="currencyContainer"]',
        '[itemprop="price"]', '[data-price]', '[data-selling-price]',
        '.a-price:not(.a-text-price) .a-offscreen', '[data-testid="price-value"]',
      ].join(','));
      if (currentPriceElement) {
        price = parsePrice(currentPriceElement.getAttribute('content') || currentPriceElement.getAttribute('data-price') || currentPriceElement.innerText);
      }

      const originalElement = card.querySelector('.a-text-price .a-offscreen, del, [class*="listPriceValue"], [data-list-price]');
      if (originalElement) {
        originalPrice = parsePrice(originalElement.getAttribute('content') || originalElement.getAttribute('data-list-price') || originalElement.innerText);
      }
      advertisedDiscount = parseDiscount(card.innerText);
    }

    // Fallbacks genéricos para qualquer loja
    if (!name) {
      const rawText = link.innerText || '';
      const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 5 && !MONEY_RE.test(l) && !/^\d+x/i.test(l));
      if (lines.length) name = lines[0].slice(0, 500);
    }
    if (!price) {
      const text = card.innerText || '';
      const prices = (text.match(MONEY_RE) || []).map(parsePrice).filter(Boolean);
      MONEY_RE.lastIndex = 0;
      if (prices.length) price = prices[0];
    }
    if (!originalPrice && price) {
      const text = card.innerText || '';
      const prices = (text.match(MONEY_RE) || []).map(parsePrice).filter(Boolean);
      MONEY_RE.lastIndex = 0;
      const higher = prices.find((candidate) => candidate > price);
      if (higher) originalPrice = higher;
    }
    if (!originalPrice && advertisedDiscount && price > 0) {
      originalPrice = Math.round((price / (1 - advertisedDiscount / 100)) * 100) / 100;
    }
    if (!advertisedDiscount && originalPrice && price && originalPrice > price) {
      advertisedDiscount = Math.round(((originalPrice - price) / originalPrice) * 100);
    }

    if (!name || !price) return null;

    const imgEl = card.querySelector('[data-testid="product-card-media"], [data-testid="image"], img');
    const imageUrl = imgEl?.currentSrc || imgEl?.src || imgEl?.getAttribute('data-src') || imgEl?.getAttribute('data-image-src') || null;

    return {
      name,
      url: href,
      price,
      originalPrice: originalPrice > price ? originalPrice : null,
      advertisedDiscount: advertisedDiscount > 0 && advertisedDiscount < 100 ? advertisedDiscount : null,
      currency: 'BRL',
      imageUrl,
      html: card.outerHTML,
    };
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function waitForHydration(timeoutMs = 15000) {
    const start = Date.now();

    // No Eletroclub, se for a primeira carga, concede 2.5s para os cookies de autenticação da VTEX iniciarem a sessão
    if (isEletroclub) {
      await wait(2500);
    }

    while (Date.now() - start < timeoutMs) {
      const cardElements = document.querySelectorAll(PAGE_SELECTORS.join(', '));
      if (cardElements.length > 0) {
        for (const el of cardElements) {
          const text = el.innerText || el.textContent || '';
          if (text.length > 5 && (/R\$\s*[\d.,]+/i.test(text) || /%\s*(?:off|desconto)/i.test(text))) {
            const elapsed = Date.now() - start;
            console.log(`[Deal Hunter ${siteTag}] Hidratação confirmada em ${elapsed}ms: ${cardElements.length} elementos detectados no DOM.`);
            return { hydrated: true, elapsedMs: elapsed, count: cardElements.length };
          }
        }
      }
      await wait(300);
    }
    const elapsed = Date.now() - start;
    console.warn(`[Deal Hunter ${siteTag}] Timeout de hidratação após ${elapsed}ms. Prosseguindo com varredura do DOM atual.`);
    return { hydrated: false, elapsedMs: elapsed, count: document.querySelectorAll(PAGE_SELECTORS.join(', ')).length };
  }

  async function loadLazyContent() {
    let idleRounds = 0;
    let lastCardCount = 0;
    let rounds = 0;
    for (; rounds < MAX_SCROLL_ROUNDS; rounds += 1) {
      const heightBefore = document.documentElement.scrollHeight;
      const currentCardCount = document.querySelectorAll(PAGE_SELECTORS.join(', ')).length;

      window.scrollBy(0, Math.max(350, Math.floor(window.innerHeight * 0.75)));
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('resize'));

      await wait(450);

      const heightAfter = document.documentElement.scrollHeight;
      const newCardCount = document.querySelectorAll(PAGE_SELECTORS.join(', ')).length;
      const atBottom = window.scrollY + window.innerHeight >= heightAfter - 25;

      if (newCardCount > currentCardCount || heightAfter > heightBefore) {
        idleRounds = 0;
      } else if (atBottom) {
        idleRounds += 1;
      }
      lastCardCount = newCardCount;
      if (idleRounds >= 3) break;
    }
    const limitReached = rounds >= MAX_SCROLL_ROUNDS;
    window.scrollTo(0, 0);
    window.dispatchEvent(new Event('scroll'));
    await wait(250);
    return { scrollRounds: rounds, scrollLimitReached: limitReached };
  }

  function nextPageInfo() {
    const disabled = (element) => element.hasAttribute('disabled')
      || element.getAttribute('aria-disabled') === 'true'
      || element.classList.contains('disabled')
      || element.classList.contains('s-pagination-disabled');

    // Suporte prioritário para paginação da Amazon
    const amazonNext = document.querySelector([
      'a.s-pagination-next', 'a[class*="s-pagination-next"]',
      '.s-pagination-strip a.s-pagination-next',
      'a[aria-label*="próxima página" i]', 'a[aria-label*="next page" i]',
    ].join(', '));
    if (amazonNext && !disabled(amazonNext) && amazonNext.href) {
      try {
        const href = new URL(amazonNext.href, location.href);
        if (href.hostname === location.hostname && href.href.replace(/#.*$/, '') !== location.href.replace(/#.*$/, '')) {
          return { nextPageUrl: href.href, hasNextButton: false };
        }
      } catch {}
    }

    // Suporte prioritário para paginação do Magazine Luiza
    const magaluNext = document.querySelector([
      '[data-testid*="pagination"] a[aria-label*="próxim" i]',
      '[data-testid*="pagination-next"]',
      'nav[aria-label*="paginação" i] a[rel="next"]',
      'nav[aria-label*="paginação" i] a[aria-label*="próxim" i]',
      'ul[class*="pagination"] a[aria-label*="próxim" i]',
    ].join(', '));
    if (magaluNext && !disabled(magaluNext) && magaluNext.href) {
      try {
        const href = new URL(magaluNext.href, location.href);
        if (href.hostname === location.hostname && href.href.replace(/#.*$/, '') !== location.href.replace(/#.*$/, '')) {
          return { nextPageUrl: href.href, hasNextButton: false };
        }
      } catch {}
    }

    // Suporte prioritário para paginação do Eletroclub (VTEX "Mostrar mais")
    const eletroclubNext = document.querySelector([
      'a[class*="buttonShowMore"]', 'button[class*="buttonShowMore"]',
      '[class*="buttonShowMore"] a', '[class*="buttonShowMore"] button',
      'a.vtex-button', 'button.vtex-button',
    ].join(', '));
    if (eletroclubNext && !disabled(eletroclubNext) && /mostrar mais|carregar mais/i.test(eletroclubNext.textContent || eletroclubNext.innerText)) {
      return { nextPageUrl: null, hasNextButton: true };
    }

    const isCarouselOrSlider = (element) => Boolean(element.closest(
      '[class*="carousel" i], [class*="slick" i], [class*="swiper" i], [data-testid*="carousel" i], [class*="glider" i]'
    ));

    const labelOf = (element) => [
      element.getAttribute('aria-label'), element.getAttribute('title'),
      element.getAttribute('data-testid'), element.className, element.innerText, element.textContent,
    ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    const matchesNext = (element) => /\bnext\b|pr[oó]xim[oa]|seguinte|avançar|mostrar mais|carregar mais|load more/i.test(labelOf(element));
    const isPaginationControl = (element) => Boolean(element.closest(
      'nav, [role="navigation"], [class*="pagination" i], [data-testid*="pagination" i], [aria-label*="pagination" i], .s-pagination-strip, [class*="buttonShowMore"]'
    )) || /next page|pr[oó]xima p[aá]gina|p[aá]gina seguinte|mostrar mais|carregar mais|load more/i.test(labelOf(element));
    const paginationSelector = 'nav, [role="navigation"], [class*="pagination"], [data-testid*="pagination"], [aria-label*="pagination"], .s-pagination-strip, [class*="buttonShowMore"]';
    const link = [...document.querySelectorAll('a[href]')].find((element) => {
      if (isCarouselOrSlider(element)) return false;
      const relNext = element.rel.split(/\s+/).includes('next');
      const labeledNext = matchesNext(element) && Boolean(element.closest(paginationSelector));
      return !disabled(element) && (relNext || labeledNext);
    });
    if (link) {
      try {
        const href = new URL(link.href, location.href);
        if (href.hostname === location.hostname && href.href.replace(/#.*$/, '') !== location.href.replace(/#.*$/, '')) {
          return { nextPageUrl: href.href, hasNextButton: false };
        }
      } catch {}
    }
    const button = [...document.querySelectorAll('button, [role="button"], a[href], a.vtex-button, [class*="buttonShowMore"]')].find((element) =>
      !disabled(element) && !isCarouselOrSlider(element) && matchesNext(element) && isPaginationControl(element));
    return { nextPageUrl: null, hasNextButton: Boolean(button) };
  }

  function productSignature() {
    const links = [...new Set(PAGE_SELECTORS.flatMap((selector) => [...document.querySelectorAll(selector)]))]
      .map((element) => element.matches('a[href]') ? element.href : element.querySelector('a[href]')?.href || '')
      .filter(Boolean);
    return `${location.href}|${links.length}|${links.slice(-8).join('|')}`;
  }

  async function clickNextPage() {
    const isCarouselOrSlider = (element) => Boolean(element.closest(
      '[class*="carousel" i], [class*="slick" i], [class*="swiper" i], [data-testid*="carousel" i], [class*="glider" i]'
    ));
    const labelOf = (element) => [element.getAttribute('aria-label'), element.getAttribute('title'),
      element.getAttribute('data-testid'), element.className, element.innerText, element.textContent]
      .filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    const button = [...document.querySelectorAll('button, [role="button"], a[href], a.vtex-button, [class*="buttonShowMore"]')].find((element) =>
      !element.hasAttribute('disabled') && element.getAttribute('aria-disabled') !== 'true'
      && !element.classList.contains('s-pagination-disabled')
      && !isCarouselOrSlider(element)
      && /\bnext\b|pr[oó]xim[oa]|seguinte|avançar|mostrar mais|carregar mais|load more/i.test(labelOf(element))
      && (element.closest('nav, [role="navigation"], [class*="pagination" i], [data-testid*="pagination" i], [aria-label*="pagination" i], .s-pagination-strip, [class*="buttonShowMore"]')
        || /next page|pr[oó]xima p[aá]gina|p[aá]gina seguinte|mostrar mais|carregar mais|load more/i.test(labelOf(element))));
    if (!button) return { ok: false, message: 'Não encontrei um controle de próxima página habilitado.' };
    const before = productSignature();
    button.click();
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline) {
      await wait(250);
      if (productSignature() !== before) return { ok: true, url: location.href };
    }
    return { ok: false, message: 'A página não mudou após clicar em próxima.' };
  }

  function showOfferAlert(offer) {
    let host = document.getElementById('deal-hunter-offer-alert-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'deal-hunter-offer-alert-host';
      const root = host.attachShadow({ mode: 'open' });
      root.innerHTML = `<style>
        :host{all:initial;position:fixed;z-index:2147483647;left:50%;bottom:22px;transform:translateX(-50%);font-family:Arial,sans-serif}
        .box{display:flex;align-items:center;gap:14px;width:min(600px,calc(100vw - 32px));padding:12px 16px;border:2px solid #fb923c;border-radius:20px;background:#101827f2;color:#fff;box-shadow:0 12px 44px #0009;animation:pop .28s ease-out}
        img{width:104px;height:104px;object-fit:contain;flex:none}.copy{min-width:0;flex:1}.eyebrow{font-size:13px;font-weight:800;color:#fdba74;letter-spacing:.08em}.name{margin-top:5px;font-size:16px;font-weight:700;line-height:1.3;max-height:42px;overflow:hidden}.price{margin-top:6px;font-size:14px;color:#a7f3d0}.close{align-self:flex-start;border:0;border-radius:50%;width:30px;height:30px;color:#fff;background:#ffffff22;font-size:22px;cursor:pointer}
        @keyframes pop{from{opacity:0;transform:translateY(20px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
        @media(max-width:480px){.box{gap:8px;padding:8px}.box img{width:76px;height:76px}.name{font-size:13px}}
      </style><aside class="box" role="alert"><img id="gif" alt="Alerta de oferta"/><div class="copy"><div class="eyebrow">🔔 OFERTA ENCONTRADA · <span id="store"></span></div><div id="name" class="name"></div><div id="price" class="price"></div></div><button class="close" aria-label="Fechar">×</button></aside>`;
      root.querySelector('.close').addEventListener('click', () => host.remove());
      document.documentElement.appendChild(host);
    }
    const root = host.shadowRoot;
    const image = root.getElementById('gif');
    image.src = chrome.runtime.getURL('sidepanel/assets/alert.gif');
    root.getElementById('store').textContent = String(offer.siteName || 'Loja').slice(0, 60);
    root.getElementById('name').textContent = String(offer.name || 'Produto encontrado').slice(0, 180);
    const price = Number(offer.price);
    root.getElementById('price').textContent = `${Number.isFinite(price) ? price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : ''} · ${Math.round(Number(offer.discountPercent) || 0)}% OFF`;
    clearTimeout(host._dealHunterAlertTimer);
    host._dealHunterAlertTimer = setTimeout(() => host.remove(), 10000);
  }

  async function capture() {
    // 1. Aguarda explicitamente a tela carregar e hidratar produtos no DOM
    const hydration = await waitForHydration(isMagalu ? 12000 : 10000);
    // Tempo de calma pós-hidratação para assentar os componentes
    await wait(600);

    // 2. Rolagem suave e dinâmica com eventos de lazy-load
    const scroll = await loadLazyContent();
    await wait(400);

    // 3. Extração dos produtos com time de milissegundos entre um produto e outro
    const deadline = Date.now() + 15000;
    let products = [];
    const progressProducts = new Set();
    let rawElementsCount = 0;

    while (Date.now() < deadline) {
      const elements = [...new Set(PAGE_SELECTORS.flatMap((selector) => [...document.querySelectorAll(selector)]))];
      rawElementsCount = elements.length;
      const found = new Map();

      for (const element of elements) {
        const item = productFrom(element);
        if (item && !found.has(item.url)) {
          found.set(item.url, item);

          // Transmissão em tempo real cadenciada para o painel da extensão
          if (!progressProducts.has(item.url)) {
            progressProducts.add(item.url);
            chrome.runtime.sendMessage({
              type: 'DEAL_HUNTER_PRODUCT_PROGRESS',
              product: {
                name: item.name,
                price: item.price,
                originalPrice: item.originalPrice,
                discountPercent: item.advertisedDiscount,
                imageUrl: item.imageUrl,
                count: found.size,
              },
            }, () => void chrome.runtime.lastError);

            // Time de milissegundos entre um produto e outro:
            // Permite carregar com calma e exibir no painel em tempo real de forma fluida
            await wait(120);
          }
        }
      }

      products = [...found.values()];
      if (products.length) break;
      await wait(600);
    }

    // 4. Diagnóstico no console para Magazine Luiza, Amazon e Eletroclub
    if (isMagalu || isAmazon || isEletroclub) {
      const siteTag = isMagalu ? 'Magalu' : isEletroclub ? 'Eletroclub' : isAmazon ? 'Amazon' : 'Loja';
      const withTitle = products.filter((p) => p.name).length;
      const withPrice = products.filter((p) => p.price > 0).length;
      const withOriginal = products.filter((p) => p.originalPrice > 0).length;
      const withDiscount = products.filter((p) => p.advertisedDiscount > 0).length;

      console.groupCollapsed(`[Deal Hunter ${siteTag} Diagnostic] Varredura em ${location.pathname}`);
      console.log('URL Completa:', location.href);
      console.log('Título da Página:', document.title);
      console.log('Carga/Hidratação:', hydration.hydrated ? `OK (${hydration.elapsedMs}ms)` : `Incompleta/Lenta (${hydration.elapsedMs}ms)`);
      console.log(`Cards brutos detectados no DOM: ${rawElementsCount}`);
      console.log(`Produtos válidos extraídos: ${products.length}`);
      console.log(`- Com Título: ${withTitle}/${products.length}`);
      console.log(`- Com Preço Atual (Por): ${withPrice}/${products.length}`);
      console.log(`- Com Preço Original (De): ${withOriginal}/${products.length}`);
      console.log(`- Com Desconto %: ${withDiscount}/${products.length}`);

      if (products.length > 0) {
        console.log('Amostra dos primeiros produtos:');
        console.table(products.slice(0, 5).map((p) => ({
          Nome: p.name.length > 40 ? p.name.slice(0, 40) + '...' : p.name,
          Preco: p.price,
          PrecoOriginal: p.originalPrice || '(indisponível/calculado)',
          Desconto: p.advertisedDiscount ? `${p.advertisedDiscount}%` : '(s/ desconto declarado)',
          URL: p.url.slice(0, 60) + '...',
        })));
      } else {
        console.warn(`⚠️ AVISO: Nenhum produto válido foi extraído nesta página da ${siteTag}!`);
        console.log('Diagnóstico do estado da página:', {
          documentTitle: document.title,
          totalLinksCount: document.querySelectorAll('a[href]').length,
          snippet: document.body.innerText.slice(0, 200).replace(/\s+/g, ' '),
        });
      }
      console.groupEnd();
    }

    let html = '';
    for (const product of products) {
      if (html.length + product.html.length > 180_000) break;
      html += `${product.html}\n`;
    }
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      if (html.length + script.outerHTML.length > 180_000) break;
      html += `\n${script.outerHTML}`;
    }
    const capturedProducts = products
      .filter((p) => p && p.name && p.url && Number.isFinite(Number(p.price)) && Number(p.price) > 0)
      .map(({ html: _html, ...product }) => ({
        ...product,
        name: String(product.name).slice(0, 500),
        url: String(product.url).slice(0, 2048),
        price: Number(product.price),
      }));
    let scanError = null;
    if (isEletroclub && capturedProducts.length === 0) {
      const pageText = document.body ? (document.body.innerText || '') : '';
      if (/faça login|entre na sua conta|acesse para ver|preço exclusivo|identifique-se|informe seu e-mail/i.test(pageText)
        || !document.cookie.includes('VtexIdclientAutCookie')) {
        scanError = 'Sessão do Eletroclub não identificada ou expirada. Faça login no Eletroclub no Chrome e confirme se os preços aparecem na tela.';
      }
    }
    return {
      html, products: capturedProducts, productsFound: capturedProducts.length, pageTitle: document.title,
      error: scanError,
      ...nextPageInfo(), ...scroll,
    };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'DEAL_HUNTER_PING') {
      const ready = document.readyState === 'interactive' || document.readyState === 'complete';
      const cardElements = document.querySelectorAll(PAGE_SELECTORS.join(', '));
      let hasPrices = false;
      for (const el of cardElements) {
        const text = el.innerText || el.textContent || '';
        if (/R\$\s*[\d.,]+/i.test(text)) {
          hasPrices = true;
          break;
        }
      }
      sendResponse({ ok: true, ready, count: cardElements.length, hasPrices, url: location.href });
      return false;
    }
    if (message?.type === 'DEAL_HUNTER_SHOW_OFFER_ALERT') {
      showOfferAlert(message.offer || {});
      sendResponse?.({ ok: true });
      return false;
    }
    if (message?.type === 'DEAL_HUNTER_ADVANCE_NEXT_PAGE') {
      clickNextPage().then(sendResponse).catch((error) => sendResponse({ ok: false, message: error.message }));
      return true;
    }
    if (message?.type !== 'DEAL_HUNTER_CAPTURE_CATEGORY') return false;
    capture()
      .then(sendResponse)
      .catch((error) => sendResponse({ html: '', productsFound: 0, error: error.message }));
    return true;
  });
})();
