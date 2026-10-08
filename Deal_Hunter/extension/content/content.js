// Deal Hunter Pro — Content Script de Scraping Semântico e Resiliente (Manifest V3)
// Captura somente marcações de produto da página já renderizada no Chrome.
// Credenciais e cookies nunca são lidos nem enviados ao backend.

(function () {
  'use strict';

  // --- 1. SELETORES HOMOLOGADOS DE CONTAINERS DE PRODUTO ---
  const PAGE_SELECTORS = [
    // Amazon Brasil
    'div[data-component-type="s-search-result"]',
    'div[role="listitem"][data-asin]:not([data-asin=""])',

    // KaBuM!
    'a[href^="/produto/"]',
    'a[href*="/produto/"]',
    'article[class*="productCard"]',

    // Magazine Luiza (Magalu)
    'div[data-testid="product-card-container"]',
    'div[data-testid="inview-container"]',
    'li[data-testid="product-list-item"]',

    // Lojas Renner
    'div[data-product-id]',
    'div[class*="ProductBox_productBoxContent"]',
    'div[class*="product_item"]',

    // Shein Brasil / Global
    'div[role="listitem"].bs-product-card',
    'div[role="listitem"][data-eid]',
    'div[role="listitem"][class*="product-card"]',

    // Shopee Brasil
    'div[role="group"][aria-label^="Product card:"]',
    'li[data-sqe="item"]',
    'div[data-sq="item"]',
    'div[class*="shopee-search-item-result__item"]',

    // Eletroclub (VTEX)
    '.vtex-product-summary-2-x-container',
    'section[class*="vtex-product-summary"]',
    'article[class*="vtex-product-summary"]',
    '[data-af-element="search-result"]',

    // Pichau
    'a[data-cy="list-product"]',
    '[data-cy="list-product"]',
    'div.MuiCard-root',

    // Mercado Livre (poly-card e andes-card da listagem oficial)
    'li.ui-search-layout__item',
    'div.ui-search-result__wrapper',
    'div.poly-card',
    'div.poly-card__content',
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
  const isMercadoLivre = host.includes('mercadolivre.') || host.includes('mercadolibre.');

  const siteTag = isMagalu ? 'Magalu'
    : isEletroclub ? 'Eletroclub'
    : isAmazon ? 'Amazon'
    : isPichau ? 'Pichau'
    : isShein ? 'Shein'
    : isShopee ? 'Shopee'
    : isKabum ? 'KaBuM!'
    : isRenner ? 'Renner'
    : isMercadoLivre ? 'Mercado Livre'
    : 'Loja';

  const MONEY_RE = /R\$\s*\d[\d.\u00a0 ]*(?:,\d{2})?/g;
  const INSTALLMENT_RE = /(?:\b\d+\s*x\s*(?:de\s*)?|parcelas?|sem\s*juros|com\s*juros|a\s*prazo|no\s*cart[aã]o)/i;
  const MAX_SCROLL_ROUNDS = 20;

  // --- 2. UTILITÁRIOS GLOBAIS DE HIGIENIZAÇÃO E FORMATAÇÃO ---

  function sanitizeText(str) {
    if (!str) return '';
    return String(str)
      .replace(/&nbsp;/g, ' ')
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function parseCurrencyToNumber(raw) {
    if (typeof raw === 'number') return Number.isFinite(raw) && raw > 0 ? raw : null;
    const cleanStr = sanitizeText(raw);
    if (!cleanStr) return null;

    // Procura padrão R$ 1.234,56 ou 1.234,56
    const match = cleanStr.match(/(?:R\$\s*)?([\d.]+,\d{2})/i) || cleanStr.match(/([\d.]+,\d{2})/);
    if (match) {
      const num = Number(match[1].replace(/\./g, '').replace(',', '.'));
      if (Number.isFinite(num) && num > 0) return num;
    }

    // Fallback numérico genérico
    const genericMatch = cleanStr.match(/(?:R\$\s*)?(\d+(?:[.,]\d+)?)/i);
    if (genericMatch) {
      let s = genericMatch[1];
      if (s.includes(',')) {
        s = s.replace(/\./g, '').replace(',', '.');
      }
      const num = Number(s);
      if (Number.isFinite(num) && num > 0) return num;
    }
    return null;
  }

  function formatBRL(num) {
    if (num == null || !Number.isFinite(num) || num <= 0) return '';
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function calculateDiscount(precoOriginal, precoAtual) {
    if (!precoOriginal || !precoAtual || precoOriginal <= precoAtual) return '';
    const pct = Math.round(((precoOriginal - precoAtual) / precoOriginal) * 100);
    if (pct <= 0 || pct >= 100) return '';
    return `-${pct}%`;
  }

  function resolveUrl(url, base = location.origin) {
    if (!url) return '';
    let str = String(url).trim();
    if (str.startsWith('//')) {
      str = 'https:' + str;
    }
    try {
      return new URL(str, base).href;
    } catch {
      return str;
    }
  }

  const AMAZON_AFFILIATE_TAG = 'dealhunterp07-20';

  function tagAmazonUrl(urlStr) {
    if (!urlStr || typeof urlStr !== 'string') return urlStr;
    try {
      const u = new URL(urlStr, location.origin);
      const host = u.hostname.toLowerCase();
      if (host.includes('amazon.') || host.includes('amzn.')) {
        u.searchParams.set('tag', AMAZON_AFFILIATE_TAG);
        return u.href;
      }
      return urlStr;
    } catch {
      return urlStr;
    }
  }

  function cleanCanonicalUrl(url) {
    if (!url) return '';
    try {
      const u = new URL(url, location.origin);
      u.hash = '';
      const isAmazon = u.hostname.toLowerCase().includes('amazon.') || u.hostname.toLowerCase().includes('amzn.');
      for (const p of [...u.searchParams.keys()]) {
        if (/^(ref|tag|psc|crid|sprefix|qid|sr|dib|dib_tag|utm_.*)$/i.test(p)) {
          u.searchParams.delete(p);
        }
      }
      if (isAmazon) {
        u.searchParams.set('tag', AMAZON_AFFILIATE_TAG);
      }
      return u.href;
    } catch {
      return url;
    }
  }

  function resolveImageUrl(imgEl, base = location.origin) {
    if (!imgEl) return '';
    let src = imgEl.getAttribute('src')
      || imgEl.getAttribute('data-src')
      || imgEl.getAttribute('data-lazy-src')
      || imgEl.getAttribute('data-original')
      || imgEl.currentSrc
      || '';

    if (!src && imgEl.getAttribute('srcset')) {
      const firstCandidate = imgEl.getAttribute('srcset').split(',')[0]?.trim().split(/\s+/)[0];
      if (firstCandidate) src = firstCandidate;
    }

    if (!src) return '';
    return resolveUrl(src, base);
  }

  function isInstallmentElement(el) {
    if (!el) return false;
    const text = sanitizeText(el.innerText || el.textContent);
    if (INSTALLMENT_RE.test(text)) return true;
    const parentText = sanitizeText(el.parentElement?.innerText || el.parentElement?.textContent);
    if (/(?:\b\d+\s*x\s*de|sem\s*juros|parcelas?)/i.test(parentText)) return true;
    const className = String(el.className || '');
    return /installment|parcela|cardPayment/i.test(className);
  }

  function isCardOutOfStock(card) {
    if (!card) return false;
    const text = sanitizeText(card.innerText || card.textContent).toLowerCase();
    return /(?:produto\s*esgotado|produto\s*indispon[íi]vel|esgotado|indispon[íi]vel|sem\s*estoque|fora\s*de\s*estoque|sold\s*out|out\s*of\s*stock|avise-me\s*quando|n[ãa]o\s*dispon[íi]vel)/i.test(text)
      || Boolean(card.querySelector?.('[class*="unavailable"], [class*="esgotado"], [class*="sold-out"], [class*="soldout"], [data-testid*="unavailable"]'));
  }

  // --- 3. MÓDULOS DE EXTRAÇÃO SEMÂNTICA POR E-COMMERCE ---

  /**
   * MÓDULO 1: AMAZON BRASIL
   */
  function parseAmazon(root = document) {
    const cards = root.querySelectorAll('div[data-component-type="s-search-result"], div[role="listitem"][data-asin]:not([data-asin=""])');
    const items = [];

    for (const card of cards) {
      try {
        const id = card.getAttribute('data-asin')
          || card.querySelector('[data-asin]')?.getAttribute('data-asin')
          || '';
        if (!id) continue;

        // Título: Prioriza nós h2 span ou a.a-text-normal span
        const titleEl = card.querySelector('h2 span')
          || card.querySelector('a.a-text-normal span')
          || card.querySelector('h2 a')
          || card.querySelector('h2');
        const rawTitle = titleEl?.innerText || titleEl?.textContent || '';
        const titulo = sanitizeText(rawTitle);
        if (!titulo) continue;

        // URL Canônica: a.a-text-normal ou h2 a
        const linkEl = card.querySelector('a.a-text-normal')
          || card.querySelector('h2 a')
          || card.querySelector('a[href*="/dp/"]')
          || card.querySelector('a[href]');
        const rawHref = linkEl?.getAttribute('href') || linkEl?.href || '';
        const url_produto = cleanCanonicalUrl(resolveUrl(rawHref, 'https://www.amazon.com.br'));
        if (!url_produto) continue;

        // Imagem: img.s-image com suporte a lazy loading
        const imgEl = card.querySelector('img.s-image') || card.querySelector('img');
        const url_imagem = resolveImageUrl(imgEl, 'https://www.amazon.com.br');

        // Preço Atual: .a-price:not([data-a-strike="true"]) .a-offscreen
        const curEl = card.querySelector('.a-price:not([data-a-strike="true"]) .a-offscreen')
          || card.querySelector('.a-price:not(.a-text-price) .a-offscreen')
          || card.querySelector('.a-price .a-offscreen');
        let precoAtualNum = curEl ? parseCurrencyToNumber(curEl.textContent || curEl.innerText) : null;

        // Fallback numérico por partes de preço caso o offscreen não esteja presente
        if (!precoAtualNum) {
          const whole = card.querySelector('.a-price-whole')?.innerText?.replace(/\D/g, '');
          const fraction = card.querySelector('.a-price-fraction')?.innerText?.replace(/\D/g, '').slice(0, 2).padEnd(2, '0');
          if (whole) precoAtualNum = parseCurrencyToNumber(`${whole},${fraction || '00'}`);
        }

        // Preço Original: span[data-a-strike="true"] .a-offscreen ou .a-text-price .a-offscreen
        const origEl = card.querySelector('span[data-a-strike="true"] .a-offscreen')
          || card.querySelector('.a-text-price .a-offscreen')
          || card.querySelector('span.a-text-strike')
          || card.querySelector('del');
        let precoOriginalNum = origEl ? parseCurrencyToNumber(origEl.textContent || origEl.innerText) : null;

        if (!precoOriginalNum || precoOriginalNum <= precoAtualNum) {
          const deMatch = (card.innerText || '').match(/(?:De|De:|Preço de lista:|Lista:)\s*R\$\s*([\d.,]+)/i);
          if (deMatch) {
            const parsedDe = parseCurrencyToNumber(deMatch[1]);
            if (parsedDe && (!precoAtualNum || parsedDe > precoAtualNum)) precoOriginalNum = parsedDe;
          }
        }

        // Desconto Percentual
        let descontoStr = '';
        if (precoOriginalNum && precoAtualNum && precoOriginalNum > precoAtualNum) {
          descontoStr = calculateDiscount(precoOriginalNum, precoAtualNum);
        } else {
          const badgeEl = card.querySelector('span.savingsPercentage, [data-a-badge-color="savings"], [class*="savingPriceOverride"]');
          const badgeText = sanitizeText(badgeEl?.innerText || badgeEl?.textContent);
          const badgeMatch = badgeText.match(/(\d{1,2})%/);
          if (badgeMatch) {
            const pct = parseInt(badgeMatch[1], 10);
            descontoStr = `-${pct}%`;
            if (!precoOriginalNum && precoAtualNum) {
              precoOriginalNum = Math.round((precoAtualNum / (1 - pct / 100)) * 100) / 100;
            }
          }
        }

        const outOfStock = isCardOutOfStock(card);
        const preco_atual = precoAtualNum ? formatBRL(precoAtualNum) : '';
        const preco_original = precoOriginalNum ? formatBRL(precoOriginalNum) : '';

        items.push({
          id: String(id),
          titulo,
          preco_atual,
          preco_original,
          desconto: descontoStr,
          url_produto,
          url_imagem,
          loja: 'Amazon',

          // Propriedades de compatibilidade com background.js e server
          name: titulo,
          url: url_produto,
          price: precoAtualNum || 0,
          originalPrice: precoOriginalNum > precoAtualNum ? precoOriginalNum : null,
          advertisedDiscount: descontoStr ? parseInt(descontoStr.replace(/\D/g, ''), 10) : null,
          imageUrl: url_imagem,
          currency: 'BRL',
          html: card.outerHTML,
          outOfStock,
        });
      } catch (err) {
        console.debug('[Deal Hunter Amazon] Erro ao parsear card:', err.message);
      }
    }

    return items;
  }

  /**
   * MÓDULO 2: KABUM!
   */
  function parseKabum(root = document) {
    const items = [];
    const seenUrls = new Set();

    // 1. SUPORTE A PÁGINA INDIVIDUAL DE PRODUTO (PDP)
    if (location.pathname.includes('/produto/')) {
      try {
        let pdpAdded = false;
        const nextScript = document.getElementById('__NEXT_DATA__');
        if (nextScript) {
          try {
            const nextData = JSON.parse(nextScript.textContent);
            const prod = nextData?.props?.pageProps?.product || nextData?.props?.pageProps?.data?.product;
            if (prod) {
              const sku = String(prod.id || location.pathname.match(/\/produto\/(\d+)/)?.[1] || '');
              const titulo = sanitizeText(prod.name || document.querySelector('h1')?.innerText || '');
              const pixPrice = Number(prod.prices?.priceWithDiscount || prod.prices?.price || prod.price || 0);
              const oldPrice = Number(prod.prices?.oldPrice || 0);
              const url_produto = cleanCanonicalUrl(location.href);
              const imgEl = document.querySelector('[data-testid="carousel-active-image"] img, img[class*="imageSlide"], img');
              const url_imagem = resolveImageUrl(imgEl, 'https://www.kabum.com.br') || (prod.photos?.[0] || '');

              if (sku && titulo && pixPrice > 0) {
                const descontoStr = oldPrice > pixPrice
                  ? calculateDiscount(oldPrice, pixPrice)
                  : (prod.prices?.discountPercentage ? `-${prod.prices.discountPercentage}%` : '');

                seenUrls.add(url_produto);
                items.push({
                  id: sku,
                  titulo,
                  preco_atual: formatBRL(pixPrice),
                  preco_original: oldPrice > pixPrice ? formatBRL(oldPrice) : '',
                  desconto: descontoStr,
                  url_produto,
                  url_imagem,
                  loja: 'KaBuM!',
                  name: titulo,
                  url: url_produto,
                  price: pixPrice,
                  originalPrice: oldPrice > pixPrice ? oldPrice : null,
                  advertisedDiscount: descontoStr ? parseInt(descontoStr.replace(/\D/g, ''), 10) : null,
                  imageUrl: url_imagem,
                  currency: 'BRL',
                  outOfStock: Boolean(prod.available === false),
                });
                pdpAdded = true;
              }
            }
          } catch {}
        }

        // Fallback DOM para PDP se __NEXT_DATA__ não estiver disponível
        if (!pdpAdded) {
          const h1 = document.querySelector('h1');
          const titulo = sanitizeText(h1?.innerText || '');
          const skuMatch = location.pathname.match(/\/produto\/(\d+)/);
          const id = skuMatch ? skuMatch[1] : '';

          if (id && titulo) {
            const url_produto = cleanCanonicalUrl(location.href);
            const imgEl = document.querySelector('[data-testid="carousel-active-image"] img, img');
            const url_imagem = resolveImageUrl(imgEl, 'https://www.kabum.com.br');

            // Busca preço PIX no buybox
            const buyBoxText = sanitizeText(document.querySelector('[class*="buyBox"], [class*="product-info"], main')?.innerText || '');
            const pixMatch = buyBoxText.match(/(?:R\$\s*([\d.,]+)\s*(?:à\s*vista|no\s*Pix|no\s*PIX|em\s*1x)|(?:à\s*vista|no\s*Pix|no\s*PIX)\s*(?:por\s*)?R\$\s*([\d.,]+))/i);
            let pdpPrice = pixMatch ? parseCurrencyToNumber(pixMatch[1] || pixMatch[2]) : null;

            if (!pdpPrice) {
              const curEl = document.querySelector('h4[class*="finalPrice"], h4[class*="priceText"], [class*="preco_desconto_a_vista"]');
              if (curEl && !isInstallmentElement(curEl)) {
                pdpPrice = parseCurrencyToNumber(curEl.innerText || curEl.textContent);
              }
            }

            if (pdpPrice && pdpPrice > 0) {
              seenUrls.add(url_produto);
              items.push({
                id: String(id),
                titulo,
                preco_atual: formatBRL(pdpPrice),
                preco_original: '',
                desconto: '',
                url_produto,
                url_imagem,
                loja: 'KaBuM!',
                name: titulo,
                url: url_produto,
                price: pdpPrice,
                originalPrice: null,
                advertisedDiscount: null,
                imageUrl: url_imagem,
                currency: 'BRL',
                outOfStock: isCardOutOfStock(document.body),
              });
            }
          }
        }
      } catch (pdpErr) {
        console.debug('[Deal Hunter KaBuM PDP] Erro:', pdpErr.message);
      }
    }

    // 2. PARSEAMENTO DE LISTAGENS E CARDS
    const cards = root.querySelectorAll('a[href^="/produto/"], a[href*="/produto/"]');

    for (const card of cards) {
      try {
        const rawHref = card.getAttribute('href') || card.href || '';
        const skuMatch = rawHref.match(/\/produto\/(\d+)\//);
        const id = skuMatch ? skuMatch[1] : '';
        if (!id) continue;

        const url_produto = cleanCanonicalUrl(resolveUrl(rawHref, 'https://www.kabum.com.br'));
        if (!url_produto || seenUrls.has(url_produto)) continue;
        seenUrls.add(url_produto);

        // Título: card.querySelector('img')?.alt ou span[class*="line-clamp"]
        const imgEl = card.querySelector('img');
        const lineClamp = card.querySelector('span[class*="line-clamp"]');
        const fallbackTitle = card.querySelector('[class*="nameCard"], h2, h3');
        const rawTitle = imgEl?.alt || lineClamp?.innerText || fallbackTitle?.innerText || '';
        const titulo = sanitizeText(rawTitle);
        if (!titulo) continue;

        // Imagem: img src com lazy load
        const url_imagem = resolveImageUrl(imgEl, 'https://www.kabum.com.br');

        // Preço Original (De): span[class*="line-through"]
        const origEl = card.querySelector('span[class*="line-through"], [class*="line-through"], [class*="oldPriceCard"], del');
        let precoOriginalNum = origEl ? parseCurrencyToNumber(origEl.innerText || origEl.textContent) : null;

        const fullCardText = sanitizeText(card.innerText || card.textContent || '');

        // 1. Extração prioritária de valores de parcela para expurgo absoluto
        const installmentValues = new Set();

        // 1.1 Coleta valores de qualquer elemento de texto secundário com parcelamento
        const secondarySpans = card.querySelectorAll('span[class*="text-gray-400"]:not([class*="line-through"]), span[class*="text-xs"]:not([class*="line-through"])');
        for (const sp of secondarySpans) {
          const spText = sanitizeText(sp.innerText || sp.textContent || '');
          if (/(?:\b\d+\s*x|ou\s*\d+\s*x|parcela|no\s*pix\s*ou)/i.test(spText)) {
            const m = spText.match(/R\$\s*([\d.,]+)/i);
            if (m) {
              const val = parseCurrencyToNumber(m[1]);
              if (val) installmentValues.add(val);
            }
          }
        }

        // 1.2 Regex abrangente de parcelamento no texto completo do card
        const instRegexes = [
          /(?:No\s*PIX\s*ou\s*)?\b\d+\s*x\s*(?:sem\s*juros\s*)?(?:com\s*juros\s*)?(?:no\s*cart[aã]o\s*)?(?:de\s*)?:?\s*R\$\s*([\d.,]+)/gi,
          /ou\s+\d+\s*x\s*(?:de\s*)?:?\s*R\$\s*([\d.,]+)/gi,
          /em\s+at[ée]\s+\d+\s*x\s*(?:sem\s*juros\s*)?(?:com\s*juros\s*)?(?:no\s*cart[aã]o\s*)?(?:de\s*)?:?\s*R\$\s*([\d.,]+)/gi,
          /R\$\s*([\d.,]+)\s*(?:em\s+at[ée]\s+\d+x|\(?sem\s*juros\)?|\/\s*m[êe]s|cada\s+parcela)/gi,
        ];
        for (const re of instRegexes) {
          for (const m of fullCardText.matchAll(re)) {
            const val = parseCurrencyToNumber(m[1]);
            if (val) installmentValues.add(val);
          }
        }

        let precoAtualNum = null;

        // =========================================================================
        // PRIORIDADE 1: Novo Layout KaBuM (Tailwind) - Seletores exatos do DOM
        // Container: div.flex.gap-4.items-center contendo span.text-base.font-semibold (ex: R$ 399,99)
        // =========================================================================
        const currentPriceContainer = card.querySelector(
          'div[class*="gap-4"][class*="items-center"], div.flex.gap-4.items-center, div[class*="items-center"]:has(span[class*="text-base"])'
        );

        if (currentPriceContainer) {
          // Busca os spans de preço dentro do container principal de valor atual
          const textBaseSpans = currentPriceContainer.querySelectorAll('span[class*="text-base"][class*="font-semibold"], span[class*="font-semibold"]');
          for (const sp of textBaseSpans) {
            const rawVal = sp.innerText || sp.textContent || '';
            const parsed = parseCurrencyToNumber(rawVal);
            if (parsed && parsed > 5 && !installmentValues.has(parsed)) {
              precoAtualNum = parsed;
              break;
            }
          }

          // Se os spans estiverem separados em "R$" e "399,99", extrai do container excluindo desconto
          if (!precoAtualNum) {
            const containerText = sanitizeText(currentPriceContainer.innerText || currentPriceContainer.textContent || '');
            const m = containerText.match(/R\$\s*([\d.,]+)/i);
            if (m) {
              const parsed = parseCurrencyToNumber(m[1]);
              if (parsed && parsed > 5 && !installmentValues.has(parsed)) {
                precoAtualNum = parsed;
              }
            }
          }
        }

        // Se ainda não encontrou, busca qualquer span.text-base.font-semibold fora de elementos de parcela
        if (!precoAtualNum) {
          const directPriceSpans = card.querySelectorAll('span[class*="text-base"][class*="font-semibold"], [class*="priceText"], [class*="finalPrice"]');
          for (const sp of directPriceSpans) {
            if (isInstallmentElement(sp)) continue;
            const parsed = parseCurrencyToNumber(sp.innerText || sp.textContent || '');
            if (parsed && parsed > 5 && !installmentValues.has(parsed)) {
              precoAtualNum = parsed;
              break;
            }
          }
        }

        // =========================================================================
        // PRIORIDADE 2: Preço à vista / PIX com regex cirúrgico
        // =========================================================================
        if (!precoAtualNum) {
          const pixMatch = fullCardText.match(/(?:R\$\s*([\d.,]+)\s*(?:à\s*vista|no\s*Pix|no\s*PIX|em\s*1x)|(?:à\s*vista|no\s*Pix|no\s*PIX)\s*(?:por\s*)?R\$\s*([\d.,]+))/i);
          if (pixMatch) {
            const candPix = parseCurrencyToNumber(pixMatch[1] || pixMatch[2]);
            if (candPix && !Array.from(installmentValues).some((iv) => Math.abs(iv - candPix) < 0.05)) {
              precoAtualNum = candPix;
            }
          }
        }

        // =========================================================================
        // PRIORIDADE 3: Fallback Matemático para extrair preço cheio (NUNCA parcela)
        // =========================================================================
        const moneyMatches = fullCardText.match(/R\$\s?[\d.,]+/g) || [];
        const extractedPrices = moneyMatches
          .map(parseCurrencyToNumber)
          .filter((p) => p && p > 5);

        // Se existir um preço maior P e um menor p tal que P / p ~= 2..24, p é parcela!
        for (let i = 0; i < extractedPrices.length; i++) {
          const p = extractedPrices[i];
          for (let j = 0; j < extractedPrices.length; j++) {
            if (i === j) continue;
            const P = extractedPrices[j];
            if (P > p) {
              const ratio = P / p;
              if (ratio >= 1.8 && ratio <= 25) {
                const nearestInt = Math.round(ratio);
                if (Math.abs(ratio - nearestInt) < 0.12) {
                  installmentValues.add(p);
                }
              }
            }
          }
        }

        const nonInstallmentPrices = extractedPrices.filter(
          (p) => !Array.from(installmentValues).some((iv) => Math.abs(iv - p) < 0.05)
        );

        if (!precoAtualNum && nonInstallmentPrices.length > 0) {
          const validCandidates = nonInstallmentPrices.filter((p) => !precoOriginalNum || p < precoOriginalNum);
          if (validCandidates.length > 0) {
            precoAtualNum = Math.min(...validCandidates);
          } else {
            precoAtualNum = Math.min(...nonInstallmentPrices);
          }
        }

        // =========================================================================
        // TRAVA ANTI-PARCELA FINAL (Garantia de que preço cheio nunca é a parcela)
        // Se precoAtualNum for <= 150 e houver outro preço válido >= 200 no card,
        // ou se precoOriginalNum existir e precoOriginalNum / precoAtualNum > 4,
        // então precoAtualNum era a parcela! Corrige para o preço cheio.
        // =========================================================================
        if (precoAtualNum) {
          // Se o preço atual bate com alguma parcela identificada
          if (Array.from(installmentValues).some((iv) => Math.abs(iv - precoAtualNum) < 0.05)) {
            const alternate = nonInstallmentPrices.find((p) => p > precoAtualNum);
            if (alternate) precoAtualNum = alternate;
          }

          // Se a proporção com o preço original for surreal (ex: 588,78 / 44,44 = 13.2x)
          if (precoOriginalNum && precoAtualNum && (precoOriginalNum / precoAtualNum > 3.5)) {
            const betterCandidate = extractedPrices.find(
              (p) => p > precoAtualNum && p <= precoOriginalNum && !installmentValues.has(p)
            );
            if (betterCandidate) {
              precoAtualNum = betterCandidate;
            }
          }
        }

        // Desconto
        let descontoStr = '';
        if (precoOriginalNum && precoAtualNum && precoOriginalNum > precoAtualNum) {
          descontoStr = calculateDiscount(precoOriginalNum, precoAtualNum);
        } else {
          const discEl = card.querySelector('[class*="discountCard"], [class*="tagDiscount"]');
          const discMatch = (discEl?.innerText || '').match(/(\d{1,2})%/);
          if (discMatch) {
            const pct = parseInt(discMatch[1], 10);
            descontoStr = `-${pct}%`;
            if (!precoOriginalNum && precoAtualNum) {
              precoOriginalNum = Math.round((precoAtualNum / (1 - pct / 100)) * 100) / 100;
            }
          }
        }

        const outOfStock = isCardOutOfStock(card);
        const preco_atual = precoAtualNum ? formatBRL(precoAtualNum) : '';
        const preco_original = precoOriginalNum ? formatBRL(precoOriginalNum) : '';

        items.push({
          id: String(id),
          titulo,
          preco_atual,
          preco_original,
          desconto: descontoStr,
          url_produto,
          url_imagem,
          loja: 'KaBuM!',

          name: titulo,
          url: url_produto,
          price: precoAtualNum || 0,
          originalPrice: precoOriginalNum > precoAtualNum ? precoOriginalNum : null,
          advertisedDiscount: descontoStr ? parseInt(descontoStr.replace(/\D/g, ''), 10) : null,
          imageUrl: url_imagem,
          currency: 'BRL',
          html: card.outerHTML,
          outOfStock,
        });
      } catch (err) {
        console.debug('[Deal Hunter KaBuM] Erro ao parsear card:', err.message);
      }
    }

    return items;
  }

  /**
   * MÓDULO 3: MAGAZINE LUIZA (MAGALU)
   */
  function parseMagalu(root = document) {
    const cards = root.querySelectorAll('div[data-testid="product-card-container"], div[data-testid="inview-container"], li[data-testid="product-list-item"]');
    const items = [];
    const seenUrls = new Set();

    for (const card of cards) {
      try {
        // Link Canônico: a[data-testid="product-card-link"]
        const linkEl = card.querySelector('a[data-testid="product-card-link"]')
          || card.querySelector('a[href*="/p/"]')
          || (card.matches('a[href]') ? card : null);
        const rawHref = linkEl?.getAttribute('href') || linkEl?.href || '';
        if (!rawHref) continue;

        // ID Único: Regex na rota do link: /\/p\/([a-zA-Z0-9]+)\//
        const idMatch = rawHref.match(/\/p\/([a-zA-Z0-9]+)\//);
        const id = idMatch ? idMatch[1] : (card.getAttribute('data-product-id') || '');
        if (!id) continue;

        const url_produto = cleanCanonicalUrl(resolveUrl(rawHref, 'https://www.magazineluiza.com.br'));
        if (!url_produto || seenUrls.has(url_produto)) continue;
        seenUrls.add(url_produto);

        // Título: img[data-testid="product-card-media"] via alt (removendo prefixo ^Imagem do produto\s*) ou h2
        const imgEl = card.querySelector('img[data-testid="product-card-media"]') || card.querySelector('img');
        const h2El = card.querySelector('h2[data-testid*="product-card-title"], h2, h3');
        let rawTitle = '';
        if (imgEl?.alt) {
          rawTitle = imgEl.alt.replace(/^Imagem do produto\s*/i, '');
        }
        if (!rawTitle && h2El) {
          rawTitle = h2El.innerText || h2El.textContent || '';
        }
        const titulo = sanitizeText(rawTitle);
        if (!titulo) continue;

        // Imagem: img[data-testid="product-card-media"] via src
        const url_imagem = resolveImageUrl(imgEl, 'https://www.magazineluiza.com.br');

        // Preço Atual: Nó de acessibilidade span.sr-only (removendo prefixo ^Preço\s*) ou [data-testid="product-card-price-final"]
        let precoAtualNum = null;
        const srOnlyPrice = card.querySelector('[data-testid="product-card-price-final"] .sr-only, [data-testid="product-card-price"] [class*="grid-area:final"] .sr-only, span.sr-only');
        if (srOnlyPrice && !isInstallmentElement(srOnlyPrice)) {
          const rawPriceText = (srOnlyPrice.textContent || srOnlyPrice.innerText || '').replace(/^Preço\s*/i, '');
          precoAtualNum = parseCurrencyToNumber(rawPriceText);
        }

        if (!precoAtualNum) {
          const finalPriceEl = card.querySelector('[data-testid="product-card-price-final"], [data-testid*="product-card-price-final"]');
          if (finalPriceEl) {
            const integer = finalPriceEl.querySelector('[data-testid="price-value-integer"]')?.innerText?.replace(/\D/g, '');
            const centsEl = finalPriceEl.querySelector('[data-testid="price-value-split-cents-fraction"], [data-testid="price-value-cents"]');
            const cents = centsEl ? centsEl.innerText.replace(/\D/g, '').slice(0, 2).padEnd(2, '0') : '00';
            if (integer) precoAtualNum = parseCurrencyToNumber(`${integer},${cents}`);
            if (!precoAtualNum) precoAtualNum = parseCurrencyToNumber(finalPriceEl.getAttribute('content') || finalPriceEl.innerText);
          }
        }

        // Preço Original (De): [data-testid="product-card-price-original"]
        const origEl = card.querySelector('[data-testid="product-card-price-original"] .sr-only, [data-testid="product-card-price-original"], [data-testid*="price-original"], del');
        let precoOriginalNum = origEl ? parseCurrencyToNumber(origEl.getAttribute('content') || origEl.textContent || origEl.innerText) : null;

        if (!precoOriginalNum || precoOriginalNum <= precoAtualNum) {
          const deMatch = (card.innerText || '').match(/(?:De|De:)\s*R\$\s*([\d.,]+)/i);
          if (deMatch) {
            const parsedDe = parseCurrencyToNumber(deMatch[1]);
            if (parsedDe && (!precoAtualNum || parsedDe > precoAtualNum)) precoOriginalNum = parsedDe;
          }
        }

        // Trava anti-parcela para Magalu
        if (precoAtualNum && precoOriginalNum && precoOriginalNum > precoAtualNum) {
          const ratio = Math.round(precoOriginalNum / precoAtualNum);
          if (ratio >= 2 && ratio <= 24) {
            const cardFullText = card.innerText || '';
            if (new RegExp(`\\b${ratio}\\s*x\\b`, 'i').test(cardFullText)) {
              precoAtualNum = precoOriginalNum;
            }
          }
        }

        // Badge Desconto: div[data-testid="tag-aria-label"] (via aria-label) ou dedução algébrica
        let descontoStr = '';
        const tagAriaLabel = card.querySelector('div[data-testid="tag-aria-label"], [data-testid="tag"], [class*="discount"]');
        const ariaText = tagAriaLabel?.getAttribute('aria-label') || tagAriaLabel?.textContent || '';
        const discMatch = ariaText.match(/(\d{1,2})%/);

        if (precoOriginalNum && precoAtualNum && precoOriginalNum > precoAtualNum) {
          descontoStr = calculateDiscount(precoOriginalNum, precoAtualNum);
        } else if (discMatch) {
          const pct = parseInt(discMatch[1], 10);
          descontoStr = `-${pct}%`;
          if (!precoOriginalNum && precoAtualNum) {
            precoOriginalNum = Math.round((precoAtualNum / (1 - pct / 100)) * 100) / 100;
          }
        }

        const outOfStock = isCardOutOfStock(card);
        const preco_atual = precoAtualNum ? formatBRL(precoAtualNum) : '';
        const preco_original = precoOriginalNum ? formatBRL(precoOriginalNum) : '';

        items.push({
          id: String(id),
          titulo,
          preco_atual,
          preco_original,
          desconto: descontoStr,
          url_produto,
          url_imagem,
          loja: 'Magazine Luiza',

          name: titulo,
          url: url_produto,
          price: precoAtualNum || 0,
          originalPrice: precoOriginalNum > precoAtualNum ? precoOriginalNum : null,
          advertisedDiscount: descontoStr ? parseInt(descontoStr.replace(/\D/g, ''), 10) : null,
          imageUrl: url_imagem,
          currency: 'BRL',
          html: card.outerHTML,
          outOfStock,
        });
      } catch (err) {
        console.debug('[Deal Hunter Magalu] Erro ao parsear card:', err.message);
      }
    }

    return items;
  }

  /**
   * MÓDULO 4: LOJAS RENNER
   */
  function parseRenner(root = document) {
    const cards = root.querySelectorAll('div[data-product-id], div[class*="ProductBox_productBoxContent"], div[class*="product_item"]');
    const items = [];
    const seenUrls = new Set();

    for (const card of cards) {
      try {
        // ID / SKU: data-product-id e data-sku-id do nó pai
        const id = card.getAttribute('data-product-id')
          || card.getAttribute('data-sku-id')
          || card.querySelector('[data-product-id]')?.getAttribute('data-product-id')
          || '';

        // Link: a[href*="/p/"] (concatenar domínio se relativo)
        const linkEl = card.querySelector('a[href*="/p/"]') || card.querySelector('a[href]');
        const rawHref = linkEl?.getAttribute('href') || linkEl?.href || '';
        if (!rawHref) continue;

        const url_produto = cleanCanonicalUrl(resolveUrl(rawHref, 'https://www.lojasrenner.com.br'));
        if (!url_produto || seenUrls.has(url_produto)) continue;
        seenUrls.add(url_produto);

        // Título: h3[class*="ProductBox_title"] ou alt da img
        const h3El = card.querySelector('h3[class*="ProductBox_title"], h3, h2, [class*="product_name"]');
        const imgEl = card.querySelector('img[loading="eager"]') || card.querySelector('img');
        const rawTitle = h3El?.innerText || imgEl?.alt || '';
        const titulo = sanitizeText(rawTitle);
        if (!titulo) continue;

        // Imagem: img[loading="eager"] ou img, normalizando link com protocolo relativo //
        const url_imagem = resolveImageUrl(imgEl, 'https://www.lojasrenner.com.br');

        // Preço Original: span[class*="listPrice"]
        const listPriceEl = card.querySelector('span[class*="listPrice"], [class*="list_price"], del, s');
        let precoOriginalNum = listPriceEl ? parseCurrencyToNumber(listPriceEl.innerText || listPriceEl.textContent) : null;

        // Preço Atual: Procura de padrões monetários no container de preço excluindo o listPrice
        let precoAtualNum = null;
        const curEl = card.querySelector('[class*="best_price"], [class*="price_sale"], [class*="price"]:not([class*="list"])');
        if (curEl && !isInstallmentElement(curEl)) {
          precoAtualNum = parseCurrencyToNumber(curEl.innerText || curEl.textContent);
        }

        if (!precoAtualNum) {
          const priceContainer = card.querySelector('[class*="price"]') || card;
          const fullText = (priceContainer.innerText || '').replace(listPriceEl?.innerText || '', '');
          const prices = (fullText.match(MONEY_RE) || []).map(parseCurrencyToNumber).filter((p) => p && p > 0);
          if (prices.length > 0) {
            precoAtualNum = prices[0];
          }
        }

        // Desconto: Cálculo matemático ou atributo visual span[class*="flagDiscount"]
        let descontoStr = '';
        if (precoOriginalNum && precoAtualNum && precoOriginalNum > precoAtualNum) {
          descontoStr = calculateDiscount(precoOriginalNum, precoAtualNum);
        } else {
          const flagEl = card.querySelector('span[class*="flagDiscount"], [class*="flag_discount"]');
          const flagText = sanitizeText(flagEl?.innerText || flagEl?.textContent);
          const flagMatch = flagText.match(/(\d{1,2})%/);
          if (flagMatch) {
            const pct = parseInt(flagMatch[1], 10);
            descontoStr = `-${pct}%`;
            if (!precoOriginalNum && precoAtualNum) {
              precoOriginalNum = Math.round((precoAtualNum / (1 - pct / 100)) * 100) / 100;
            }
          }
        }

        const outOfStock = isCardOutOfStock(card);
        const preco_atual = precoAtualNum ? formatBRL(precoAtualNum) : '';
        const preco_original = precoOriginalNum ? formatBRL(precoOriginalNum) : '';

        items.push({
          id: String(id || url_produto),
          titulo,
          preco_atual,
          preco_original,
          desconto: descontoStr,
          url_produto,
          url_imagem,
          loja: 'Lojas Renner',

          name: titulo,
          url: url_produto,
          price: precoAtualNum || 0,
          originalPrice: precoOriginalNum > precoAtualNum ? precoOriginalNum : null,
          advertisedDiscount: descontoStr ? parseInt(descontoStr.replace(/\D/g, ''), 10) : null,
          imageUrl: url_imagem,
          currency: 'BRL',
          html: card.outerHTML,
          outOfStock,
        });
      } catch (err) {
        console.debug('[Deal Hunter Renner] Erro ao parsear card:', err.message);
      }
    }

    return items;
  }

  /**
   * MÓDULO 5: SHEIN BRASIL / GLOBAL
   */
  function parseShein(root = document) {
    const cards = root.querySelectorAll('div[role="listitem"].bs-product-card, div[role="listitem"][data-eid], div[role="listitem"][class*="product-card"]');
    const items = [];
    const seenUrls = new Set();

    for (const card of cards) {
      try {
        // Link: a[href*="-p-"] (prefixar https://br.shein.com se relativo)
        const linkEl = card.querySelector('a[href*="-p-"]') || card.querySelector('a[href]');
        const rawHref = linkEl?.getAttribute('href') || linkEl?.href || '';
        if (!rawHref) continue;

        // ID Único (Goods ID): Regex na rota do link: /-p-(\d+)\.html/
        const idMatch = rawHref.match(/-p-(\d+)\.html/);
        const id = idMatch ? idMatch[1] : (card.getAttribute('data-eid') || card.getAttribute('data-goods-id') || '');
        if (!id) continue;

        const url_produto = cleanCanonicalUrl(resolveUrl(rawHref, 'https://br.shein.com'));
        if (!url_produto || seenUrls.has(url_produto)) continue;
        seenUrls.add(url_produto);

        // Título: a[aria-label] ou [class*="goods-name-text"] ou img[alt]
        const nameEl = card.querySelector('[class*="goods-name-text"], a[aria-label], a[title]');
        const imgEl = card.querySelector('img[class*="crop-image-container__img"]') || card.querySelector('img');
        let rawTitle = nameEl?.getAttribute('aria-label') || nameEl?.innerText || imgEl?.alt || '';
        rawTitle = rawTitle.replace(/^-\d+%\s*/, '');
        const titulo = sanitizeText(rawTitle);
        if (!titulo) continue;

        // Imagem: img[class*="crop-image-container__img"] checando src ou data-src e forçando https:
        const url_imagem = resolveImageUrl(imgEl, 'https://br.shein.com');

        // Preço Atual: Nó dedicado de acessibilidade .bs-product-card__offscreen
        const curEl = card.querySelector('.bs-product-card__offscreen')
          || card.querySelector('[class*="sale-price"]')
          || card.querySelector('[class*="final-price"]')
          || card.querySelector('[class*="price__main"]');
        let precoAtualNum = curEl ? parseCurrencyToNumber(curEl.textContent || curEl.innerText) : null;

        // Preço Original (De): .bs-product-card__original-price ou span.line-through
        const origEl = card.querySelector('.bs-product-card__original-price')
          || card.querySelector('span.line-through')
          || card.querySelector('[class*="original-price"]')
          || card.querySelector('del, s');
        let precoOriginalNum = origEl ? parseCurrencyToNumber(origEl.textContent || origEl.innerText) : null;

        if (!precoAtualNum || !precoOriginalNum) {
          const prices = (card.innerText.match(MONEY_RE) || []).map(parseCurrencyToNumber).filter((p) => p && p > 0);
          const unique = [...new Set(prices)].sort((a, b) => a - b);
          if (unique.length >= 2) {
            precoAtualNum = unique[0];
            precoOriginalNum = unique[unique.length - 1];
          } else if (unique.length === 1 && !precoAtualNum) {
            precoAtualNum = unique[0];
          }
        }

        // Badge Desconto: [class*="discount-label_text"] ou [aria-label*="%"]
        let descontoStr = '';
        if (precoOriginalNum && precoAtualNum && precoOriginalNum > precoAtualNum) {
          descontoStr = calculateDiscount(precoOriginalNum, precoAtualNum);
        } else {
          const discEl = card.querySelector('[class*="discount-label_text"], [aria-label*="%"], [class*="discount"]');
          const discText = sanitizeText(discEl?.getAttribute('aria-label') || discEl?.innerText);
          const discMatch = discText.match(/(\d{1,2})%/);
          if (discMatch) {
            const pct = parseInt(discMatch[1], 10);
            descontoStr = `-${pct}%`;
            if (!precoOriginalNum && precoAtualNum) {
              precoOriginalNum = Math.round((precoAtualNum / (1 - pct / 100)) * 100) / 100;
            }
          }
        }

        const outOfStock = isCardOutOfStock(card);
        const preco_atual = precoAtualNum ? formatBRL(precoAtualNum) : '';
        const preco_original = precoOriginalNum ? formatBRL(precoOriginalNum) : '';

        items.push({
          id: String(id),
          titulo,
          preco_atual,
          preco_original,
          desconto: descontoStr,
          url_produto,
          url_imagem,
          loja: 'Shein',

          name: titulo,
          url: url_produto,
          price: precoAtualNum || 0,
          originalPrice: precoOriginalNum > precoAtualNum ? precoOriginalNum : null,
          advertisedDiscount: descontoStr ? parseInt(descontoStr.replace(/\D/g, ''), 10) : null,
          imageUrl: url_imagem,
          currency: 'BRL',
          html: card.outerHTML,
          outOfStock,
        });
      } catch (err) {
        console.debug('[Deal Hunter Shein] Erro ao parsear card:', err.message);
      }
    }

    return items;
  }

  /**
   * MÓDULO 6: SHOPEE BRASIL
   */
  function parseShopee(root = document) {
    const cards = root.querySelectorAll('div[role="group"][aria-label^="Product card:"], li[data-sqe="item"], div[data-sq="item"], div[class*="shopee-search-item-result__item"]');
    const items = [];
    const seenUrls = new Set();

    for (const card of cards) {
      try {
        // Link: a[href*="-i."] (prefixar https://shopee.com.br se relativo)
        const linkEl = card.querySelector('a[href*="-i."]') || card.querySelector('a[href]');
        const rawHref = linkEl?.getAttribute('href') || linkEl?.href || '';
        if (!rawHref) continue;

        // Identificadores Canônicos: Regex na URL do link /-i\.(\d+)\.(\d+)/ capturando shopId e itemId
        const matchIds = rawHref.match(/-i\.(\d+)\.(\d+)/);
        const shopId = matchIds ? matchIds[1] : '';
        const itemId = matchIds ? matchIds[2] : '';
        const id = itemId ? `${shopId}_${itemId}` : (shopId || rawHref);

        const url_produto = cleanCanonicalUrl(resolveUrl(rawHref, 'https://shopee.com.br'));
        if (!url_produto || seenUrls.has(url_produto)) continue;
        seenUrls.add(url_produto);

        // Título: Atributo aria-label do container pai, removendo o prefixo ^Product card:\s*
        let rawTitle = card.getAttribute('aria-label') || '';
        if (rawTitle.startsWith('Product card:')) {
          rawTitle = rawTitle.replace(/^Product card:\s*/i, '');
        }
        if (!rawTitle) {
          const img = card.querySelector('img[alt]');
          rawTitle = img?.alt || card.querySelector('[class*="line-clamp-2"]')?.innerText || '';
        }
        const titulo = sanitizeText(rawTitle);
        if (!titulo) continue;

        // Imagem: picture img ou img via src ou primeiro item de srcset
        const imgEl = card.querySelector('picture img') || card.querySelector('img');
        const url_imagem = resolveImageUrl(imgEl, 'https://shopee.com.br');

        // Preço Atual & Original: Extração via regex R\$\s?[\d.,]+ sobre texto bruto
        const curEl = card.querySelector('[class*="text-shopee-primary"], span.text-base, [class*="font-medium"], [class*="price"]');
        let precoAtualNum = curEl && !isInstallmentElement(curEl) ? parseCurrencyToNumber(curEl.innerText || curEl.textContent) : null;

        const origEl = card.querySelector('del, s, [class*="line-through"]');
        let precoOriginalNum = origEl ? parseCurrencyToNumber(origEl.innerText || origEl.textContent) : null;

        if (!precoAtualNum) {
          const cleanText = (card.innerText || '').replace(INSTALLMENT_RE, '');
          const prices = (cleanText.match(MONEY_RE) || []).map(parseCurrencyToNumber).filter(Boolean);
          if (prices.length > 0) {
            precoAtualNum = Math.min(...prices);
            if (prices.length > 1 && (!precoOriginalNum || precoOriginalNum <= precoAtualNum)) {
              precoOriginalNum = Math.max(...prices);
            }
          }
        }

        // Badge Desconto: span[data-testid="ally-label"] via atributo aria-label
        let descontoStr = '';
        if (precoOriginalNum && precoAtualNum && precoOriginalNum > precoAtualNum) {
          descontoStr = calculateDiscount(precoOriginalNum, precoAtualNum);
        } else {
          const allyEl = card.querySelector('span[data-testid="ally-label"], [class*="discount"]');
          const allyText = sanitizeText(allyEl?.getAttribute('aria-label') || allyEl?.innerText);
          const allyMatch = allyText.match(/(\d{1,2})%/);
          if (allyMatch) {
            const pct = parseInt(allyMatch[1], 10);
            descontoStr = `-${pct}%`;
            if (!precoOriginalNum && precoAtualNum) {
              precoOriginalNum = Math.round((precoAtualNum / (1 - pct / 100)) * 100) / 100;
            }
          }
        }

        const outOfStock = isCardOutOfStock(card);
        const preco_atual = precoAtualNum ? formatBRL(precoAtualNum) : '';
        const preco_original = precoOriginalNum ? formatBRL(precoOriginalNum) : '';

        items.push({
          id: String(id),
          titulo,
          preco_atual,
          preco_original,
          desconto: descontoStr,
          url_produto,
          url_imagem,
          loja: 'Shopee',

          name: titulo,
          url: url_produto,
          price: precoAtualNum || 0,
          originalPrice: precoOriginalNum > precoAtualNum ? precoOriginalNum : null,
          advertisedDiscount: descontoStr ? parseInt(descontoStr.replace(/\D/g, ''), 10) : null,
          imageUrl: url_imagem,
          currency: 'BRL',
          html: card.outerHTML,
          outOfStock,
        });
      } catch (err) {
        console.debug('[Deal Hunter Shopee] Erro ao parsear card:', err.message);
      }
    }

    return items;
  }

  /**
   * MÓDULO FALLBACK / OUTRAS LOJAS SUPORTADAS (Eletroclub, Pichau e Genéricas)
   */
  function parseEletroclub(root = document) {
    const cards = root.querySelectorAll('.vtex-product-summary-2-x-container, section[class*="vtex-product-summary"], article[class*="vtex-product-summary"], [data-af-element="search-result"]');
    const items = [];
    const seenUrls = new Set();

    for (const card of cards) {
      try {
        const linkEl = card.querySelector('a[href*="/p"]');
        const rawHref = linkEl?.getAttribute('href') || linkEl?.href || '';
        if (!rawHref) continue;

        const url_produto = cleanCanonicalUrl(resolveUrl(rawHref, 'https://www.eletroclub.com.br'));
        if (!url_produto || seenUrls.has(url_produto)) continue;
        seenUrls.add(url_produto);

        const nameEl = card.querySelector('[class*="brandName"], [class*="productName"], [class*="productBrand"], h2, h3');
        const titulo = sanitizeText(nameEl?.textContent || nameEl?.innerText || linkEl?.getAttribute('title'));
        if (!titulo) continue;

        const imgEl = card.querySelector('img');
        const url_imagem = resolveImageUrl(imgEl, 'https://www.eletroclub.com.br');

        const curEl = card.querySelector('[class*="spotPrice"], [class*="sellingPriceValue"], [class*="sellingPrice"] [class*="currencyContainer"], [itemprop="price"]');
        const precoAtualNum = curEl ? parseCurrencyToNumber(curEl.getAttribute('content') || curEl.textContent || curEl.innerText) : null;

        const origEl = card.querySelector('[class*="listPriceValue"], [class*="listPrice"] [class*="currencyContainer"], del, s');
        let precoOriginalNum = origEl ? parseCurrencyToNumber(origEl.getAttribute('content') || origEl.textContent || origEl.innerText) : null;

        let descontoStr = '';
        if (precoOriginalNum && precoAtualNum && precoOriginalNum > precoAtualNum) {
          descontoStr = calculateDiscount(precoOriginalNum, precoAtualNum);
        } else {
          const badgeEl = card.querySelector('[class*="savingsPercentage"], [class*="discountBadge"], [class*="discountPercentage"]');
          const badgeText = sanitizeText(badgeEl?.textContent || badgeEl?.innerText);
          const badgeMatch = badgeText.match(/(\d{1,2})%/);
          if (badgeMatch) {
            const pct = parseInt(badgeMatch[1], 10);
            descontoStr = `-${pct}%`;
            if (!precoOriginalNum && precoAtualNum) {
              precoOriginalNum = Math.round((precoAtualNum / (1 - pct / 100)) * 100) / 100;
            }
          }
        }

        const outOfStock = isCardOutOfStock(card);
        const preco_atual = precoAtualNum ? formatBRL(precoAtualNum) : '';
        const preco_original = precoOriginalNum ? formatBRL(precoOriginalNum) : '';

        items.push({
          id: String(card.getAttribute('data-product-id') || url_produto),
          titulo,
          preco_atual,
          preco_original,
          desconto: descontoStr,
          url_produto,
          url_imagem,
          loja: 'Eletroclub',

          name: titulo,
          url: url_produto,
          price: precoAtualNum || 0,
          originalPrice: precoOriginalNum > precoAtualNum ? precoOriginalNum : null,
          advertisedDiscount: descontoStr ? parseInt(descontoStr.replace(/\D/g, ''), 10) : null,
          imageUrl: url_imagem,
          currency: 'BRL',
          html: card.outerHTML,
          outOfStock,
        });
      } catch (err) {
        console.debug('[Deal Hunter Eletroclub] Erro ao parsear card:', err.message);
      }
    }

    return items;
  }

  function parsePichau(root = document) {
    const cards = root.querySelectorAll('a[data-cy="list-product"], [data-cy="list-product"], div.MuiCard-root');
    const items = [];
    const seenUrls = new Set();

    for (const card of cards) {
      try {
        const linkEl = card.matches('a[href]') ? card : card.querySelector('a[href]');
        const rawHref = linkEl?.getAttribute('href') || linkEl?.href || '';
        if (!rawHref) continue;

        const url_produto = cleanCanonicalUrl(resolveUrl(rawHref, 'https://www.pichau.com.br'));
        if (!url_produto || seenUrls.has(url_produto)) continue;
        seenUrls.add(url_produto);

        const nameEl = card.querySelector('h2, [class*="product_info_title"], [class*="productName"]');
        const imgEl = card.querySelector('img');
        const titulo = sanitizeText(nameEl?.innerText || imgEl?.alt || linkEl?.getAttribute('title'));
        if (!titulo) continue;

        const url_imagem = resolveImageUrl(imgEl, 'https://www.pichau.com.br');

        const porEl = card.querySelector('[class*="price_vista"], [class*="price_total"], [class*="finalPrice"]');
        let precoAtualNum = porEl ? parseCurrencyToNumber(porEl.innerText || porEl.textContent) : null;

        const deEl = card.querySelector('[class*="price_from"] [class*="strikeThrough"], [class*="strikeThrough"], [class*="price_from"], del, s');
        let precoOriginalNum = deEl ? parseCurrencyToNumber(deEl.innerText || deEl.textContent) : null;

        let descontoStr = '';
        if (precoOriginalNum && precoAtualNum && precoOriginalNum > precoAtualNum) {
          descontoStr = calculateDiscount(precoOriginalNum, precoAtualNum);
        }

        const outOfStock = isCardOutOfStock(card);
        const preco_atual = precoAtualNum ? formatBRL(precoAtualNum) : '';
        const preco_original = precoOriginalNum ? formatBRL(precoOriginalNum) : '';

        items.push({
          id: String(url_produto),
          titulo,
          preco_atual,
          preco_original,
          desconto: descontoStr,
          url_produto,
          url_imagem,
          loja: 'Pichau',

          name: titulo,
          url: url_produto,
          price: precoAtualNum || 0,
          originalPrice: precoOriginalNum > precoAtualNum ? precoOriginalNum : null,
          advertisedDiscount: descontoStr ? parseInt(descontoStr.replace(/\D/g, ''), 10) : null,
          imageUrl: url_imagem,
          currency: 'BRL',
          html: card.outerHTML,
          outOfStock,
        });
      } catch (err) {
        console.debug('[Deal Hunter Pichau] Erro ao parsear card:', err.message);
      }
    }

    return items;
  }

  function parseFallback(root = document) {
    const cards = root.querySelectorAll(PAGE_SELECTORS.join(', '));
    const items = [];
    const seenUrls = new Set();

    for (const card of cards) {
      try {
        const linkEl = card.matches('a[href]') ? card : card.querySelector('a[href]');
        const rawHref = linkEl?.getAttribute('href') || linkEl?.href || '';
        if (!rawHref) continue;

        const url_produto = cleanCanonicalUrl(resolveUrl(rawHref, location.origin));
        if (!url_produto || seenUrls.has(url_produto)) continue;
        seenUrls.add(url_produto);

        const titleEl = card.querySelector('h2, h3, h1, [data-testid*="title"], [data-testid*="name"]');
        const imgEl = card.querySelector('img');
        const titulo = sanitizeText(titleEl?.innerText || imgEl?.alt || linkEl?.getAttribute('title'));
        if (!titulo) continue;

        const url_imagem = resolveImageUrl(imgEl, location.origin);

        const curEl = card.querySelector('.a-offscreen, [itemprop="price"], [class*="sellingPrice"], [class*="finalPrice"], [data-testid*="price"]');
        let precoAtualNum = curEl ? parseCurrencyToNumber(curEl.getAttribute('content') || curEl.textContent || curEl.innerText) : null;

        const origEl = card.querySelector('del, s, [class*="listPrice"], [class*="line-through"]');
        let precoOriginalNum = origEl ? parseCurrencyToNumber(origEl.getAttribute('content') || origEl.textContent || origEl.innerText) : null;

        if (!precoAtualNum) {
          const prices = (card.innerText.match(MONEY_RE) || []).map(parseCurrencyToNumber).filter(Boolean);
          if (prices.length > 0) precoAtualNum = prices[0];
        }

        let descontoStr = '';
        if (precoOriginalNum && precoAtualNum && precoOriginalNum > precoAtualNum) {
          descontoStr = calculateDiscount(precoOriginalNum, precoAtualNum);
        }

        const outOfStock = isCardOutOfStock(card);
        const preco_atual = precoAtualNum ? formatBRL(precoAtualNum) : '';
        const preco_original = precoOriginalNum ? formatBRL(precoOriginalNum) : '';

        items.push({
          id: String(url_produto),
          titulo,
          preco_atual,
          preco_original,
          desconto: descontoStr,
          url_produto,
          url_imagem,
          loja: siteTag,

          name: titulo,
          url: url_produto,
          price: precoAtualNum || 0,
          originalPrice: precoOriginalNum > precoAtualNum ? precoOriginalNum : null,
          advertisedDiscount: descontoStr ? parseInt(descontoStr.replace(/\D/g, ''), 10) : null,
          imageUrl: url_imagem,
          currency: 'BRL',
          html: card.outerHTML,
          outOfStock,
        });
      } catch (err) {
        console.debug('[Deal Hunter Generic] Erro ao parsear card:', err.message);
      }
    }

    return items;
  }

  /**
   * MÓDULO 9: MERCADO LIVRE (Extração Direta e Completa de Busca / Listagem)
   * Baseado nos prints oficiais do DOM: poly-card, andes-card, poly-component__*
   */
  function parseMercadoLivre(root = document) {
    const cards = root.querySelectorAll(
      'li.ui-search-layout__item, div.ui-search-result__wrapper, div.poly-card, div.andes-card.poly-card'
    );
    const items = [];
    const seenIds = new Set();

    for (const card of cards) {
      try {
        // 1. Título e Link Principal do Produto
        const titleLinkEl = card.querySelector('a.poly-component__title, h3.poly-component__title-wrapper a, a[class*="poly-component__title"]');
        if (!titleLinkEl) continue;

        const rawHref = titleLinkEl.getAttribute('href') || titleLinkEl.href || '';
        const rawTitle = titleLinkEl.innerText || titleLinkEl.textContent || '';
        const titulo = sanitizeText(rawTitle);
        if (!titulo) continue;

        // 2. Extração prioritária do CÓDIGO DE ANÚNCIO REAL DO VENDEDOR (wid=MLB...)
        const widMatch = rawHref.match(/[?&#]wid=(MLB\d+)/i);
        const directMlbMatch = rawHref.match(/produto\.mercadolivre\.com\.br\/(MLB-?\d+)/i) || rawHref.match(/(MLB-?\d{8,})/i);
        const mlbId = widMatch ? widMatch[1] : (directMlbMatch ? directMlbMatch[1].replace('-', '') : '');

        const id = mlbId || String(rawHref.split('?')[0]);
        if (seenIds.has(id)) continue;
        seenIds.add(id);

        // 2.1 URL Real e Funcional do anúncio ou catálogo
        let url_produto = rawHref ? cleanCanonicalUrl(rawHref.split('#')[0]) : '';
        if (url_produto && url_produto.startsWith('/')) {
          url_produto = 'https://www.mercadolivre.com.br' + url_produto;
        }
        if (!url_produto && mlbId) {
          url_produto = `https://www.mercadolivre.com.br/MLB-${mlbId.replace(/^MLB/i, '')}`;
        }

        // 3. Imagem de Alta Resolução com suporte a srcset
        const imgEl = card.querySelector('img.poly-component__picture, img[data-testid="picture"], img');
        let url_imagem = '';
        if (imgEl) {
          const srcset = imgEl.getAttribute('srcset') || '';
          if (srcset) {
            const candidates = srcset.split(',').map((s) => s.trim().split(/\s+/)[0]).filter(Boolean);
            url_imagem = candidates[candidates.length - 1] || candidates[0] || '';
          }
          if (!url_imagem) {
            url_imagem = imgEl.getAttribute('src') || imgEl.getAttribute('data-src') || imgEl.currentSrc || '';
          }
        }
        if (url_imagem && url_imagem.startsWith('//')) {
          url_imagem = 'https:' + url_imagem;
        }

        // 4. Preço Atual ("Por:")
        const curPriceContainer = card.querySelector('.poly-price__current, [class*="poly-price__current"]');
        let precoAtualNum = null;
        if (curPriceContainer) {
          const fracEl = curPriceContainer.querySelector('.andes-money-amount__fraction');
          const centsEl = curPriceContainer.querySelector('.andes-money-amount__cents');
          if (fracEl) {
            const cleanFrac = fracEl.innerText.replace(/\./g, '').trim();
            const cleanCents = centsEl ? centsEl.innerText.trim() : '00';
            precoAtualNum = parseFloat(`${cleanFrac}.${cleanCents}`);
          }
        }
        if (!precoAtualNum) {
          const amountEl = card.querySelector('.poly-price__current .andes-money-amount, .andes-money-amount');
          const ariaLabel = amountEl?.getAttribute('aria-label') || '';
          const matchAria = ariaLabel.match(/(\d+)\s*reais(?:.*?(\d+)\s*centavos)?/i);
          if (matchAria) {
            precoAtualNum = parseFloat(`${matchAria[1]}.${matchAria[2] || '00'}`);
          }
        }

        // 5. Preço Original de Tabela ("De:")
        const prevPriceContainer = card.querySelector('s.andes-money-amount--previous, s.andes-money-amount');
        let precoOriginalNum = null;
        if (prevPriceContainer) {
          const prevFrac = prevPriceContainer.querySelector('.andes-money-amount__fraction');
          const prevCents = prevPriceContainer.querySelector('.andes-money-amount__cents');
          if (prevFrac) {
            const cleanFrac = prevFrac.innerText.replace(/\./g, '').trim();
            const cleanCents = prevCents ? prevCents.innerText.trim() : '00';
            precoOriginalNum = parseFloat(`${cleanFrac}.${cleanCents}`);
          }
        }

        // 6. Desconto Percentual
        const discountEl = card.querySelector('.poly-price__discount-polylabel .polylabel-pill, [class*="poly-price__discount"]');
        let descontoStr = discountEl ? sanitizeText(discountEl.innerText) : '';
        if (!descontoStr && precoOriginalNum && precoAtualNum && precoOriginalNum > precoAtualNum) {
          descontoStr = calculateDiscount(precoOriginalNum, precoAtualNum);
        }

        // 7. Vendedor & Loja Oficial
        const sellerEl = card.querySelector('.poly-component__seller');
        const vendedor_nome = sellerEl ? sanitizeText(sellerEl.innerText) : 'Mercado Livre';
        const isLojaOficial = Boolean(
          card.querySelector('.poly-component__seller svg[aria-label*="Loja Oficial" i], svg[aria-label*="Oficial" i]')
        );

        // 8. Badge "MAIS VENDIDO"
        const isBestSeller = Boolean(
          card.querySelector('.poly-component__widget--bottom-left, [class*="poly-component__widget"]')?.innerText?.includes('MAIS VENDIDO')
        );

        // 9. Avaliações (Rating) & Quantidade Real de Vendas
        const accessibleText = card.querySelector('.andes-visually-hidden')?.innerText || '';
        let rating = null;
        let totalVendas = isBestSeller ? 500 : 25;

        // Vendas Comprovadas
        const salesMatch =
          accessibleText.match(/(?:Mais de\s*)?(\+?\d+[\d.]*(?:\s*mil)?)\s*produtos\s*vendidos/i) ||
          (card.innerText || '').match(/(\+?\d+[\d.]*(?:\s*mil)?)\s*vendidos/i);
        if (salesMatch) {
          const raw = salesMatch[1].replace(/\./g, '').trim();
          totalVendas = raw.includes('mil') ? parseInt(raw, 10) * 1000 : parseInt(raw, 10);
        }

        // Avaliação (Rating)
        const ratingMatch =
          accessibleText.match(/Classificação\s*([\d.]+)\s*de\s*5/i) ||
          card.querySelector('.poly-component__review-compacted .polylabel-label')?.innerText?.match(/([\d.]+)/);
        if (ratingMatch) {
          rating = parseFloat(ratingMatch[1]);
        }

        // 10. Frete & Envio Full
        const shippingEl = card.querySelector('.poly-component__shipping-v2');
        const shippingText = shippingEl ? sanitizeText(shippingEl.innerText) : '';
        const freeShipping = shippingText.toLowerCase().includes('grátis') || (precoAtualNum && precoAtualNum >= 79.0);
        const isFull = Boolean(
          card.querySelector('.poly-component__shipping-v2 svg[aria-label*="FULL" i], svg[aria-label*="Enviado pelo FULL" i], [class*="icon-full"]')
        );

        const outOfStock = isCardOutOfStock(card);
        const preco_atual = precoAtualNum ? formatBRL(precoAtualNum) : '';
        const preco_original = precoOriginalNum ? formatBRL(precoOriginalNum) : '';

        items.push({
          id,
          mlbId,
          titulo,
          preco_atual,
          preco_original,
          desconto: descontoStr,
          url_produto,
          url_imagem,
          loja: 'Mercado Livre',

          // Atributos enriquecidos extraídos dos prints
          vendedor: vendedor_nome,
          isLojaOficial,
          isBestSeller,
          salesCount: totalVendas,
          rating,
          freeShipping,
          isFull,

          // Propriedades compatíveis com o background e Deal Hunter
          name: titulo,
          url: url_produto,
          price: precoAtualNum || 0,
          originalPrice: precoOriginalNum > precoAtualNum ? precoOriginalNum : null,
          advertisedDiscount: descontoStr ? parseInt(descontoStr.replace(/\D/g, ''), 10) : null,
          imageUrl: url_imagem,
          currency: 'BRL',
          html: card.outerHTML,
          outOfStock,
        });
      } catch (err) {
        console.debug('[Deal Hunter Mercado Livre] Erro ao parsear card:', err.message);
      }
    }

    return items;
  }

  // --- 4. FUNÇÃO UNIFICADA DE DESPACHO (DISPATCHER) ---

  function dispatchScraper(root = document) {
    const curHost = location.hostname.toLowerCase();
    if (curHost.includes('mercadolivre.') || curHost.includes('mercadolibre.')) {
      return parseMercadoLivre(root);
    }
    if (curHost.includes('amazon.')) {
      return parseAmazon(root);
    }
    if (curHost.includes('kabum.')) {
      return parseKabum(root);
    }
    if (curHost.includes('magazineluiza.')) {
      return parseMagalu(root);
    }
    if (curHost.includes('lojasrenner.') || curHost.includes('renner.')) {
      return parseRenner(root);
    }
    if (curHost.includes('shein.')) {
      return parseShein(root);
    }
    if (curHost.includes('shopee.')) {
      return parseShopee(root);
    }
    if (curHost.includes('eletroclub.')) {
      return parseEletroclub(root);
    }
    if (curHost.includes('pichau.')) {
      return parsePichau(root);
    }
    return parseFallback(root);
  }

  // Exporta scrapers no escopo de window para diagnóstico e extensibilidade
  window.DealHunterScrapers = {
    parseMercadoLivre,
    parseAmazon,
    parseKabum,
    parseMagalu,
    parseRenner,
    parseShein,
    parseShopee,
    parseEletroclub,
    parsePichau,
    parseFallback,
    dispatchScraper,
    sanitizeText,
    parseCurrencyToNumber,
    formatBRL,
    calculateDiscount,
    resolveUrl,
    resolveImageUrl,
  };

  // --- 5. ROLAGEM LAZY, HIDRATAÇÃO E PAGINAÇÃO ---

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
    const isBackground = typeof document !== 'undefined' && document.hidden;
    const maxRounds = isBackground ? 3 : MAX_SCROLL_ROUNDS;
    const scrollWait = isBackground ? 150 : 450;
    for (; rounds < maxRounds; rounds += 1) {
      const heightBefore = document.documentElement.scrollHeight;
      const currentCardCount = document.querySelectorAll(PAGE_SELECTORS.join(', ')).length;

      window.scrollBy(0, Math.max(450, Math.floor(window.innerHeight * 0.85)));
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('resize'));

      await wait(scrollWait);

      const heightAfter = document.documentElement.scrollHeight;
      const newCardCount = document.querySelectorAll(PAGE_SELECTORS.join(', ')).length;
      const atBottom = window.scrollY + window.innerHeight >= heightAfter - 25;

      if (newCardCount > currentCardCount || heightAfter > heightBefore) {
        idleRounds = 0;
      } else if (atBottom) {
        idleRounds += 1;
      }
      lastCardCount = newCardCount;
      if (idleRounds >= 2) break;
    }
    const limitReached = rounds >= maxRounds;
    window.scrollTo(0, 0);
    window.dispatchEvent(new Event('scroll'));
    await wait(isBackground ? 100 : 250);
    return { scrollRounds: rounds, scrollLimitReached: limitReached };
  }

  function nextPageInfo() {
    const disabled = (element) => element.hasAttribute('disabled')
      || element.getAttribute('aria-disabled') === 'true'
      || element.classList.contains('disabled')
      || element.classList.contains('s-pagination-disabled');

    // Amazon
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

    // Magazine Luiza
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

    // Eletroclub
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
      !disabled(element) && !isCarouselOrSlider(element) && matchesNext(element)
      && (element.closest('nav, [role="navigation"], [class*="pagination" i], [data-testid*="pagination" i], [aria-label*="pagination" i], .s-pagination-strip, [class*="buttonShowMore"]')
        || /next page|pr[oó]xima p[aá]gina|p[aá]gina seguinte|mostrar mais|carregar mais|load more/i.test(labelOf(element))));
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
    let hostEl = document.getElementById('deal-hunter-offer-alert-host');
    if (!hostEl) {
      hostEl = document.createElement('div');
      hostEl.id = 'deal-hunter-offer-alert-host';
      const root = hostEl.attachShadow({ mode: 'open' });
      root.innerHTML = `<style>
        :host{all:initial;position:fixed;z-index:2147483647;left:50%;bottom:22px;transform:translateX(-50%);font-family:Arial,sans-serif}
        .box{display:flex;align-items:center;gap:14px;width:min(600px,calc(100vw - 32px));padding:12px 16px;border:2px solid #fb923c;border-radius:20px;background:#101827f2;color:#fff;box-shadow:0 12px 44px #0009;animation:pop .28s ease-out}
        img{width:104px;height:104px;object-fit:contain;flex:none}.copy{min-width:0;flex:1}.eyebrow{font-size:13px;font-weight:800;color:#fdba74;letter-spacing:.08em}.name{margin-top:5px;font-size:16px;font-weight:700;line-height:1.3;max-height:42px;overflow:hidden}.price{margin-top:6px;font-size:14px;color:#a7f3d0}.close{align-self:flex-start;border:0;border-radius:50%;width:30px;height:30px;color:#fff;background:#ffffff22;font-size:22px;cursor:pointer}
        @keyframes pop{from{opacity:0;transform:translateY(20px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
        @media(max-width:480px){.box{gap:8px;padding:8px}.box img{width:76px;height:76px}.name{font-size:13px}}
      </style><aside class="box" role="alert"><img id="gif" alt="Alerta de oferta"/><div class="copy"><div class="eyebrow">🔔 OFERTA ENCONTRADA · <span id="store"></span></div><div id="name" class="name"></div><div id="price" class="price"></div></div><button class="close" aria-label="Fechar">×</button></aside>`;
      root.querySelector('.close').addEventListener('click', () => hostEl.remove());
      document.documentElement.appendChild(hostEl);
    }
    const root = hostEl.shadowRoot;
    const image = root.getElementById('gif');
    image.src = chrome.runtime.getURL('sidepanel/assets/alert.gif');
    root.getElementById('store').textContent = String(offer.siteName || 'Loja').slice(0, 60);
    root.getElementById('name').textContent = String(offer.name || 'Produto encontrado').slice(0, 180);
    const price = Number(offer.price);
    root.getElementById('price').textContent = `${Number.isFinite(price) ? price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : ''} · ${Math.round(Number(offer.discountPercent) || 0)}% OFF`;
    clearTimeout(hostEl._dealHunterAlertTimer);
    hostEl._dealHunterAlertTimer = setTimeout(() => hostEl.remove(), 10000);
  }

  // --- 6. CICLO DE CAPTURA PRINCIPAL ---

  async function capture() {
    // 1. Aguarda explicitamente a tela carregar e hidratar produtos no DOM
    const hydration = await waitForHydration(isMagalu ? 12000 : 10000);
    await wait(600);

    // 2. Rolagem suave e dinâmica com eventos de lazy-load
    const scroll = await loadLazyContent();
    await wait(400);

    // 3. Extração dos produtos através do dispatcher modular
    const deadline = Date.now() + 15000;
    let products = [];
    const progressProducts = new Set();
    let rawElementsCount = 0;

    while (Date.now() < deadline) {
      const extracted = dispatchScraper(document);
      rawElementsCount = extracted.length;
      const found = new Map();

      for (const item of extracted) {
        if (item && item.url_produto && !found.has(item.url_produto)) {
          found.set(item.url_produto, item);

          // Transmissão em tempo real cadenciada para o painel da extensão
          if (!progressProducts.has(item.url_produto)) {
            progressProducts.add(item.url_produto);
            chrome.runtime.sendMessage({
              type: 'DEAL_HUNTER_PRODUCT_PROGRESS',
              product: {
                id: item.id,
                name: item.titulo,
                titulo: item.titulo,
                price: item.price,
                preco_atual: item.preco_atual,
                originalPrice: item.originalPrice,
                preco_original: item.preco_original,
                discountPercent: item.advertisedDiscount,
                desconto: item.desconto,
                imageUrl: item.url_imagem,
                url_imagem: item.url_imagem,
                loja: item.loja,
                count: found.size,
              },
            }, () => void chrome.runtime.lastError);

            if (!document.hidden) {
              await wait(50);
            }
          }
        }
      }

      products = [...found.values()];
      if (products.length) break;
      await wait(600);
    }

    // 4. Diagnóstico no console
    const withTitle = products.filter((p) => p.titulo).length;
    const withPrice = products.filter((p) => p.price > 0).length;
    const withOriginal = products.filter((p) => p.originalPrice > 0).length;
    const withDiscount = products.filter((p) => p.desconto).length;

    console.groupCollapsed(`[Deal Hunter ${siteTag} Diagnostic] Varredura em ${location.pathname}`);
    console.log('URL Completa:', location.href);
    console.log('Título da Página:', document.title);
    console.log('Carga/Hidratação:', hydration.hydrated ? `OK (${hydration.elapsedMs}ms)` : `Incompleta/Lenta (${hydration.elapsedMs}ms)`);
    console.log(`Cards processados no DOM: ${rawElementsCount}`);
    console.log(`Produtos válidos extraídos: ${products.length}`);
    console.log(`- Com Título: ${withTitle}/${products.length}`);
    console.log(`- Com Preço Atual: ${withPrice}/${products.length}`);
    console.log(`- Com Preço Original: ${withOriginal}/${products.length}`);
    console.log(`- Com Desconto: ${withDiscount}/${products.length}`);

    if (products.length > 0) {
      console.log('Amostra dos primeiros produtos (formato padronizado):');
      console.table(products.slice(0, 5).map((p) => ({
        ID: p.id,
        Título: p.titulo.length > 35 ? p.titulo.slice(0, 35) + '...' : p.titulo,
        'Preço Atual': p.preco_atual,
        'Preço Original': p.preco_original || '(s/ preço De)',
        Desconto: p.desconto || '(s/ desconto)',
        Loja: p.loja,
      })));
    }
    console.groupEnd();

    let html = '';
    for (const product of products) {
      if (html.length + (product.html || '').length > 180_000) break;
      html += `${product.html}\n`;
    }
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      if (html.length + script.outerHTML.length > 180_000) break;
      html += `\n${script.outerHTML}`;
    }

    const capturedProducts = products
      .filter((p) => p && p.titulo && p.url_produto && Number.isFinite(Number(p.price)) && Number(p.price) > 0)
      .map(({ html: _html, ...product }) => ({
        ...product,
        id: String(product.id || ''),
        titulo: String(product.titulo).slice(0, 500),
        name: String(product.titulo).slice(0, 500),
        url_produto: String(product.url_produto).slice(0, 2048),
        url: String(product.url_produto).slice(0, 2048),
        preco_atual: String(product.preco_atual || ''),
        preco_original: String(product.preco_original || ''),
        desconto: String(product.desconto || ''),
        url_imagem: String(product.url_imagem || ''),
        imageUrl: String(product.url_imagem || ''),
        loja: String(product.loja || siteTag),
        price: Number(product.price),
        originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
        advertisedDiscount: product.advertisedDiscount ? Number(product.advertisedDiscount) : null,
      }));

    let scanError = null;
    if (isEletroclub && capturedProducts.length === 0) {
      const pageText = document.body ? (document.body.innerText || '') : '';
      if (/faça login|entre na sua conta|acesse para ver|preço exclusivo|identifique-se|informe seu e-mail/i.test(pageText)
        || !document.cookie.includes('VtexIdclientAutCookie')) {
        scanError = 'Sessão do Eletroclub não identificada ou expirada. Faça login no Eletroclub no Chrome e confirme se os preços aparecem na tela.';
      }
    }

    let outOfStockFound = false;
    let outOfStockCount = 0;
    for (const p of products) {
      if (p.outOfStock || !p.price || p.price <= 0) {
        outOfStockFound = true;
        outOfStockCount += 1;
      }
    }
    const pageBodyText = document.body ? (document.body.innerText || '').toLowerCase() : '';
    const pageIndicatesUnavailable = /(?:nenhum\s*produto\s*encontrado|nenhum\s*resultado|todos\s*os\s*produtos\s*esgotados|produtos\s*esgotados|estoque\s*esgotado)/i.test(pageBodyText);
    if (pageIndicatesUnavailable || outOfStockCount > 0) {
      outOfStockFound = true;
    }

    return {
      html,
      products: capturedProducts,
      productsFound: capturedProducts.length,
      pageTitle: document.title,
      error: scanError,
      hasOutOfStock: outOfStockFound,
      stopCategory: outOfStockFound,
      outOfStockCount,
      ...nextPageInfo(),
      ...scroll,
    };
  }

  // --- 7. MENSAGERIA RUNTIME ---

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
    if (message?.type === 'DEAL_HUNTER_SCRAPE_ML_FAST') {
      (async () => {
        try {
          const start = Date.now();
          let products = [];
          // Aguarda ativamente os cards no DOM por ate 4.5 segundos
          while (Date.now() - start < 4500) {
            products = parseMercadoLivre(document);
            if (products && products.length >= 3) break;
            await new Promise((r) => setTimeout(r, 200));
          }
          if (!products || products.length === 0) {
            window.scrollBy(0, 450);
            await new Promise((r) => setTimeout(r, 350));
            products = parseMercadoLivre(document);
          }
          console.log('[Deal Hunter Content] Scraping rápido do Mercado Livre concluído com', products.length, 'produtos');
          sendResponse({
            success: true,
            products: (products || []).slice(0, 16),
            productsFound: products ? products.length : 0,
            url: location.href,
          });
        } catch (err) {
          console.warn('[Deal Hunter Content] Erro no scraping rápido ML:', err.message);
          sendResponse({ success: false, error: err.message, products: [] });
        }
      })();
      return true;
    }
    if (message?.type !== 'DEAL_HUNTER_CAPTURE_CATEGORY') return false;
    capture()
      .then(sendResponse)
      .catch((error) => sendResponse({ html: '', productsFound: 0, error: error.message }));
    return true;
  });
})();
