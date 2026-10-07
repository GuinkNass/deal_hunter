const cheerio = require('cheerio');
const { parseGeneric } = require('./generic.adapter');

const INSTALLMENT_REGEX = /(?:\b\d+\s*x\s*(?:de\s*)?|parcelas?|sem\s*juros|com\s*juros|a\s*prazo|no\s*cart[aã]o)/i;

function cleanPriceText(text) {
  if (!text) return '';
  return text.replace(/\u00a0/g, ' ').trim();
}

function parsePrice(value) {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : null;
  const str = cleanPriceText(String(value || ''));
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
  const match = String(value || '').match(/(?:^|[^\d])[-]?(\d{1,2}(?:\.\d+)?)\s*%\s*(?:off|de\s+desconto)?/i);
  return match ? Math.round(parseFloat(match[1])) : null;
}

function isInstallmentElement($, el) {
  const text = cleanPriceText($(el).text());
  if (INSTALLMENT_REGEX.test(text)) return true;
  const className = $(el).attr('class') || '';
  if (/installment|cardPayment|aPrazo/i.test(className)) return true;
  const parent = $(el).parent();
  if (parent.length && !parent.is('body, html, main, section, article, #content, .content')) {
    const parentClass = parent.attr('class') || '';
    if (/installment|cardPayment|aPrazo/i.test(parentClass)) return true;
    const parentText = cleanPriceText(parent.text());
    if (parentText.length < 150 && INSTALLMENT_REGEX.test(parentText)) {
      return true;
    }
  }
  return false;
}

/**
 * Adaptador KaBuM!:
 * Extrai preço à vista/PIX ignorando parcelas e juros.
 */
function parseKabum(html, pageUrl) {
  const $ = cheerio.load(html);
  const base = parseGeneric(html, pageUrl);

  const title = $('h1[class*="title"], h1, [data-testid="product-title"]').first().text().trim() || base.name;

  // Detecção de indisponibilidade
  const bodyText = $('body').text();
  const isOutOfStock = $('[class*="unavailable"], [class*="produtoIndisponivel"], [id*="indisponivel"]').length > 0
    || /(?:produto indisponível|esgotado|avise-me quando chegar|ops! produto esgotado)/i.test(bodyText);

  // Prioridade 0: Extração direta do __NEXT_DATA__ da KaBuM
  const nextMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (nextMatch) {
    try {
      const nextData = JSON.parse(nextMatch[1]);
      const prod = nextData?.props?.pageProps?.product || nextData?.props?.pageProps?.data?.product;
      if (prod) {
        const prodName = prod.name ? String(prod.name).trim() : null;
        const pixPrice = Number(prod.prices?.priceWithDiscount || prod.prices?.price || prod.price || 0);
        const oldPrice = Number(prod.prices?.oldPrice || 0);
        const prodOutOfStock = Boolean(prod.available === false || (prod.offer === false && prod.prices?.price === 0));

        if (pixPrice > 0) {
          const disc = oldPrice > pixPrice
            ? Math.round(((oldPrice - pixPrice) / oldPrice) * 100)
            : (prod.prices?.discountPercentage || null);

          return {
            ...base,
            name: prodName || title || base.name,
            priceFound: true,
            price: pixPrice,
            originalPrice: oldPrice > pixPrice ? oldPrice : null,
            advertisedDiscount: disc,
            discount: disc,
            outOfStock: prodOutOfStock || isOutOfStock,
            is_available: !(prodOutOfStock || isOutOfStock),
            available: !(prodOutOfStock || isOutOfStock),
            url: pageUrl,
          };
        }
      }
    } catch {}
  }

  // 1. Extração preventiva de todos os valores de parcelas para expurgo
  const installmentValues = new Set();
  const instRegexes = [
    /(?:\b\d+\s*x\s*(?:sem\s*juros\s*)?(?:com\s*juros\s*)?(?:no\s*cart[aã]o\s*)?(?:de\s*)?:?\s*|em\s+at[ée]\s+\d+\s*x\s*(?:sem\s*juros\s*)?(?:com\s*juros\s*)?(?:no\s*cart[aã]o\s*)?(?:de\s*)?:?\s*)R\$\s*([\d.,]+)/gi,
    /R\$\s*([\d.,]+)\s*(?:em\s+at[ée]\s+\d+x|\(?sem\s*juros\)?|\/\s*m[êe]s|cada\s+parcela)/gi,
  ];
  for (const re of instRegexes) {
    for (const m of bodyText.matchAll(re)) {
      const val = parsePrice(m[1]);
      if (val) installmentValues.add(val);
    }
  }

  // Coleta todos os preços brutos presentes na página
  const allPricesRaw = [];
  for (const m of bodyText.matchAll(/R\$\s*([\d.]+,\d{2})/gi)) {
    const p = parsePrice(m[1]);
    if (p && p > 5) allPricesRaw.push(p);
  }

  // Filtro Matemático Multiplicador Universal (detecta parcelas onde P / p ~= N)
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

  // 2. Preço à vista / PIX
  let currentPrice = null;

  // Prioridade 1: Preço explícito com tag PIX / à vista no texto
  const matchPix = bodyText.match(/(?:R\$\s*([\d.]+,\d{2})\s*(?:no\s+Pix|à\s+vista|em\s+1x)|(?:no\s+Pix|à\s+vista)\s*(?:por\s*)?R\$\s*([\d.]+,\d{2}))/i);
  if (matchPix) {
    const candPix = parsePrice(matchPix[1] || matchPix[2]);
    if (candPix && !Array.from(installmentValues).some((iv) => Math.abs(iv - candPix) < 0.05)) {
      currentPrice = candPix;
    }
  }

  if (!currentPrice) {
    const priceElements = $('[class*="finalPrice"], [class*="priceText"], [class*="priceCard"], h4[class*="text-"], [class*="font-semibold"], [class*="font-bold"], .preco_desconto_a_vista, [data-testid*="price"]');
    priceElements.each((_, el) => {
      if (currentPrice) return;
      if (isInstallmentElement($, el)) return;
      const cls = $(el).attr('class') || '';
      if (/line-through|oldprice/i.test(cls) || $(el).is('del, s')) return;
      const val = parsePrice($(el).text());
      if (val > 0 && !Array.from(installmentValues).some((iv) => Math.abs(iv - val) < 0.05)) {
        currentPrice = val;
      }
    });
  }

  // 3. Preço original "De" (prioriza elemento riscado line-through)
  let originalPrice = null;
  const oldPriceElements = $('[class*="line-through"], [class*="oldPrice"], [class*="oldPriceCard"], del, s');
  oldPriceElements.each((_, el) => {
    if (originalPrice) return;
    if (isInstallmentElement($, el)) return;
    const val = parsePrice($(el).text());
    if (val > 0 && !Array.from(installmentValues).some((iv) => Math.abs(iv - val) < 0.05) && (!currentPrice || val > currentPrice)) {
      originalPrice = val;
    }
  });

  // 4. Desconto: Prioriza dedução matemática a partir do preço riscado vs atual
  let advertisedDiscount = null;
  if (originalPrice && currentPrice && originalPrice > currentPrice) {
    advertisedDiscount = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  } else {
    const discEl = $('[class*="discountBadge"], [class*="tagDiscount"], [class*="discountCard"], [class*="bg-green"]').first();
    if (discEl.length) {
      advertisedDiscount = parseDiscount(discEl.text());
    }
  }

  // 5. Trava anti-parcela KaBuM! abrangente
  if (currentPrice) {
    for (const other of allPricesRaw) {
      if (other > currentPrice) {
        const ratio = other / currentPrice;
        if (ratio >= 1.8 && ratio <= 25 && Math.abs(ratio - Math.round(ratio)) < 0.08) {
          // currentPrice era uma parcela de other!
          if (!originalPrice || originalPrice <= currentPrice) {
            originalPrice = other;
          }
          currentPrice = other;
          break;
        }
      }
    }
  }

  const finalPrice = currentPrice || (base.price && !isInstallmentPrice(base.price, html) ? base.price : null);

  return {
    ...base,
    name: title,
    priceFound: Boolean(finalPrice && finalPrice > 0),
    price: finalPrice,
    originalPrice: originalPrice && originalPrice > finalPrice ? originalPrice : null,
    advertisedDiscount,
    discount: advertisedDiscount,
    outOfStock: isOutOfStock,
    is_available: !isOutOfStock,
    available: !isOutOfStock,
    url: pageUrl,
  };
}

function isInstallmentPrice(price, html) {
  if (!price || !html) return false;
  const strPrice = price.toFixed(2).replace('.', ',');
  const regex = new RegExp(`\\b\\d+\\s*x\\s*(?:de\\s*)?R?\\$\\s*${strPrice.replace(',', '[,.]')}`, 'i');
  return regex.test(html);
}

module.exports = { parseKabum };
