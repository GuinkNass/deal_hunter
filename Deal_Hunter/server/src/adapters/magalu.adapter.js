const cheerio = require('cheerio');
const { parseGeneric } = require('./generic.adapter');
const { extractCandidateCoupons } = require('../analyzers/coupon');

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
  if (/installment|parcela/i.test(className)) return true;
  const parent = $(el).parent();
  if (parent.length && !parent.is('body, html, main, section, article, #content, .content')) {
    const parentClass = parent.attr('class') || '';
    if (/installment|parcela/i.test(parentClass)) return true;
    const parentText = cleanPriceText(parent.text());
    if (parentText.length < 150 && INSTALLMENT_REGEX.test(parentText)) {
      return true;
    }
  }
  return false;
}

/**
 * Adaptador Magazine Luiza:
 * Prioriza preços à vista / Pix e rejeita estritamente valores de parcelas isoladas.
 */
function parseMagalu(html, pageUrl) {
  const $ = cheerio.load(html);
  const base = parseGeneric(html, pageUrl);

  const title = $('[data-testid="product-title"], [data-testid="heading-product-title"], h1').first().text().trim() || base.name;

  // Verifica esgotamento / indisponibilidade
  const bodyText = $('body').text().toLowerCase();
  const isOutOfStock = $('[data-testid="product-unavailable"], .unavailable, [class*="unavailable"]').length > 0
    || /(?:produto esgotado|produto indisponível|avise-me quando chegar)/i.test(bodyText);

  // 1. Preço à vista / PIX no Magalu
  let currentPrice = null;
  const finalSrOnly = $('[data-testid="price-final"] .sr-only, [data-testid="product-card-price-final"] .sr-only, [id^="price-final-label-"]').first().text();
  if (finalSrOnly && !INSTALLMENT_REGEX.test(finalSrOnly)) {
    currentPrice = parsePrice(finalSrOnly);
  }

  if (!currentPrice) {
    const finalEl = $('[data-testid="price-final"], [data-testid="product-card-price-final"], [id^="price-final-label-"]').first();
    if (finalEl.length && !isInstallmentElement($, finalEl)) {
      const integer = finalEl.find('[data-testid="price-value-integer"]').first().text().replace(/\D/g, '');
      const centsEl = finalEl.find('[data-testid="price-value-split-cents-fraction"], [data-testid="price-value-cents"]').first();
      const cents = centsEl.length ? centsEl.text().replace(/\D/g, '').slice(0, 2).padEnd(2, '0') : '00';
      if (integer) currentPrice = parsePrice(`${integer},${cents}`);
      if (!currentPrice) currentPrice = parsePrice(finalEl.attr('content') || finalEl.text());
    }
  }

  if (!currentPrice) {
    const pixMatch = $('body').text().match(/R\$\s*([\d.]+,\d{2})\s*(?:no\s+Pix|à\s+vista)/i);
    if (pixMatch) currentPrice = parsePrice(pixMatch[1]);
  }

  // 2. Preço original "De"
  let originalPrice = null;
  const origEl = $('[data-testid="price-original"], [data-testid="product-card-price-original"], [data-testid="price-old"], del').first();
  if (origEl.length && !isInstallmentElement($, origEl)) {
    originalPrice = parsePrice(origEl.attr('content') || origEl.text());
  }

  // 3. Desconto anunciado
  let advertisedDiscount = null;
  const discountEl = $('[data-testid="tag"], [class*="discount"]').first();
  if (discountEl.length) {
    advertisedDiscount = parseDiscount(discountEl.attr('aria-label') || discountEl.text());
  }

  // Proteção rígida anti-parcela:
  // Se o currentPrice foi igual a uma parcela ou razão exata com originalPrice
  if (currentPrice && originalPrice && originalPrice > currentPrice) {
    const ratio = Math.round(originalPrice / currentPrice);
    if (ratio >= 2 && ratio <= 24 && new RegExp(`\\b${ratio}\\s*x\\b`, 'i').test($.text())) {
      // O preço extraído era uma única parcela!
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

module.exports = { parseMagalu, isInstallmentElement };
