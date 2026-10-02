const cheerio = require('cheerio');
const { parseGeneric } = require('./generic.adapter');

const INSTALLMENT_REGEX = /(?:\b\d+\s*x\s*(?:de\s*)?|parcelas?|sem\s*juros|com\s*juros|a\s*prazo)/i;

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
  const match = String(value || '').match(/(?:^|[^\d])[-]?(\d{1,2}(?:\.\d+)?)\s*%/i);
  return match ? Math.round(parseFloat(match[1])) : null;
}

function isInstallmentElement($, el) {
  const text = cleanPriceText($(el).text());
  if (INSTALLMENT_REGEX.test(text)) return true;
  const className = $(el).attr('class') || '';
  if (/installment|parcela|didi/i.test(className)) return true;
  const parent = $(el).parent();
  if (parent.length && !parent.is('body, html, main, section, article, #content, .content')) {
    const parentClass = parent.attr('class') || '';
    if (/installment|parcela|didi/i.test(parentClass)) return true;
    const parentText = cleanPriceText(parent.text());
    if (parentText.length < 150 && INSTALLMENT_REGEX.test(parentText)) {
      return true;
    }
  }
  return false;
}

/**
 * Adaptador Shein:
 * Extrai preço atual ignorando parcelamentos e propagandas de cartões.
 */
function parseShein(html, pageUrl) {
  const $ = cheerio.load(html);
  const base = parseGeneric(html, pageUrl);

  const title = $('h1.product-intro__head-name, h1, [class*="goods-name-text"]').first().text().trim() || base.name;

  // Detecção de indisponibilidade Shein
  const bodyText = $('body').text();
  const isOutOfStock = $('[class*="sold-out"], [class*="goods-soldout"], [class*="soldout"]').length > 0
    || /(?:esgotado|sold out|indisponível|fora de estoque)/i.test(bodyText);

  // 1. Preço atual
  let currentPrice = null;
  const curElements = $('[class*="final-price"], [class*="price__main"], [class*="sale-price"], [class*="current-price"], [class*="product-intro__head-price"] span, [class*="normal-price"], [class*="discount-price"], [class*="salePrice"], [class*="discountPrice"], .from');
  curElements.each((_, el) => {
    if (currentPrice) return;
    if (isInstallmentElement($, el)) return;
    const cls = $(el).attr('class') || '';
    if (/line-through|del|strike|was-price/i.test(cls) || $(el).is('del, s')) return;
    const val = parsePrice($(el).text());
    if (val > 0) currentPrice = val;
  });

  // 2. Preço original "De" (prioriza elemento riscado)
  let originalPrice = null;
  const origElements = $('[class*="line-through"], del, s, [class*="original-price"], [class*="price__secondary"] del, [class*="del"], [class*="strike"], [class*="from-price"], [class*="was-price"]');
  origElements.each((_, el) => {
    if (originalPrice) return;
    if (isInstallmentElement($, el)) return;
    const val = parsePrice($(el).text());
    if (val > 0 && (!currentPrice || val > currentPrice)) originalPrice = val;
  });

  // Fallback numérico se não achou preço atual mas achou no corpo
  if (!currentPrice) {
    const pricesInBody = (bodyText.match(/R\$\s*[\d.]+(?:,\d{2})/g) || [])
      .map(parsePrice)
      .filter((v) => v > 0);
    if (pricesInBody.length > 0) {
      if (originalPrice) {
        currentPrice = pricesInBody.find((p) => p < originalPrice) || Math.min(...pricesInBody);
      } else if (pricesInBody.length >= 2) {
        const sorted = [...pricesInBody].sort((a, b) => a - b);
        currentPrice = sorted[0];
        originalPrice = sorted[sorted.length - 1];
      }
    }
  }

  // 3. Desconto: Prioriza dedução matemática a partir do preço riscado vs atual
  let advertisedDiscount = null;
  if (originalPrice && currentPrice && originalPrice > currentPrice) {
    advertisedDiscount = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  } else {
    const discEl = $('[class*="discount-label"], [class*="title-discount-label"], [class*="discount"]').first();
    if (discEl.length) {
      advertisedDiscount = parseDiscount(discEl.text());
    }
  }

  // Trava anti-parcela Shein
  if (currentPrice && originalPrice && originalPrice > currentPrice) {
    const ratio = Math.round(originalPrice / currentPrice);
    if (ratio >= 2 && ratio <= 24 && new RegExp(`\\b${ratio}\\s*x\\b`, 'i').test(bodyText)) {
      currentPrice = originalPrice;
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

module.exports = { parseShein };
