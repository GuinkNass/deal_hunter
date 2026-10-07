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

  // 1. Extração preventiva de todos os valores de parcelas para expurgo
  const installmentValues = new Set();
  const instMatches = bodyText.matchAll(/(?:\b\d+\s*x\s*(?:de\s*)?|em\s+at[ée]\s+\d+\s*x\s*(?:de\s*)?)R\$\s*([\d.,]+)/gi);
  for (const m of instMatches) {
    const val = parsePrice(m[1]);
    if (val) installmentValues.add(val);
  }
  const suffixMatches = bodyText.matchAll(/R\$\s*([\d.,]+)\s*(?:em\s+at[ée]\s+\d+x|\(?sem\s*juros\)?)/gi);
  for (const m of suffixMatches) {
    const val = parsePrice(m[1]);
    if (val) installmentValues.add(val);
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
      // Não confunde preço riscado com preço atual
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

  // 5. Trava anti-parcela KaBuM!
  if (currentPrice && originalPrice && originalPrice > currentPrice) {
    const ratio = Math.round(originalPrice / currentPrice);
    if ((ratio >= 2 && ratio <= 24 && (new RegExp(`\\b${ratio}\\s*x\\b`, 'i').test(bodyText) || /x\s*de/i.test(bodyText))) ||
        Array.from(installmentValues).some((iv) => Math.abs(iv - currentPrice) < 0.05)) {
      currentPrice = originalPrice;
      originalPrice = null;
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
