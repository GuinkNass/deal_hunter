const cheerio = require('cheerio');
const { parseGeneric } = require('./generic.adapter');

const INSTALLMENT_REGEX = /(?:\b\d+\s*x\s*(?:de\s*)?|parcelas?|sem\s*juros|com\s*juros|a\s*prazo)/i;
const AMAZON_AFFILIATE_TAG = 'dealhunterp07-20';

/**
 * Injeta defensivamente a tag de afiliado Amazon (dealhunterp07-20).
 * - Valida se o domínio pertence à Amazon (ex: amazon.com.br, amazon.com, amzn.to).
 * - Anexa ou substitui o parâmetro tag=dealhunterp07-20.
 * - Preserva todos os outros parâmetros de query (ref, psc, etc.).
 * - Se a URL for inválida ou não pertencer à Amazon, retorna a URL original intacta.
 */
function tagAmazonUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return urlStr;
  try {
    const trimmed = urlStr.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return urlStr;
    }
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.toLowerCase();
    const isAmazon = /(?:^|\.)amazon\.(?:[a-z]{2,3}(?:\.[a-z]{2})?)$/i.test(hostname) ||
                     /(?:^|\.)amazon\.[a-z.]+$/i.test(hostname) ||
                     /(?:^|\.)amzn\.(?:to|com)$/i.test(hostname);

    if (isAmazon) {
      parsed.searchParams.set('tag', AMAZON_AFFILIATE_TAG);
      return parsed.toString();
    }
    return urlStr;
  } catch {
    return urlStr;
  }
}

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
  if (/installment|aPrazo|parcela/i.test(className)) return true;
  const parent = $(el).parent();
  if (parent.length && !parent.is('body, html, main, section, article, #content, .content')) {
    const parentClass = parent.attr('class') || '';
    if (/installment|aPrazo|parcela/i.test(parentClass)) return true;
    const parentText = cleanPriceText(parent.text());
    if (parentText.length < 150 && INSTALLMENT_REGEX.test(parentText)) {
      return true;
    }
  }
  return false;
}

/**
 * Adaptador Amazon:
 * Ignora valores extraídos de parcelas (ex: "x de", "sem juros") e valida disponibilidade.
 */
function parseAmazon(html, pageUrl) {
  const $ = cheerio.load(html);
  const base = parseGeneric(html, pageUrl);

  const title = $('#productTitle, #title, [data-testid="product-title"], h1').first().text().trim() || base.name;

  // Detecção de indisponibilidade Amazon
  const availText = $('#availability').text().toLowerCase();
  const bodyText = $('body').text();
  const isOutOfStock = /(?:não temos previsão|indisponível|não\s+dispon[íi]vel|atualmente\s+indispon[íi]vel|currently unavailable|esgotado|sem estoque|out of stock)/i.test(availText)
    || /(?:não temos previsão de quando este produto estará disponível|avise-me quando estiver disponível|não disponível|atualmente indisponível)/i.test(bodyText);

  // 1. Preço atual
  let currentPrice = null;
  const priceElements = $([
    '[data-testid="price-section"] [class*="priceToPay"] .a-price:not(.a-text-price) .a-offscreen',
    '[class*="priceToPay"] .a-price:not(.a-text-price) .a-offscreen',
    '#priceblock_dealprice',
    '#priceblock_ourprice',
    '#price_inside_buybox',
    '.a-price:not(.a-text-price) .a-offscreen',
  ].join(', '));

  priceElements.each((_, el) => {
    if (currentPrice) return;
    if (isInstallmentElement($, el)) return;
    const val = parsePrice($(el).text());
    if (val > 0) currentPrice = val;
  });

  if (!currentPrice) {
    const whole = $('.a-price-whole').first().text().replace(/\D/g, '');
    const fraction = $('.a-price-fraction').first().text().replace(/\D/g, '').slice(0, 2).padEnd(2, '0');
    if (whole) currentPrice = parsePrice(`${whole},${fraction || '00'}`);
  }

  // 2. Preço original "De"
  let originalPrice = null;
  const origElements = $([
    '[data-testid="price-section"] [class*="wrapPrice"] .a-price.a-text-price .a-offscreen',
    '[class*="wrapPrice"] .a-price.a-text-price .a-offscreen',
    '.a-price.a-text-price .a-offscreen',
    '[data-a-strike="true"] .a-offscreen',
    'span.a-text-price',
    'del',
  ].join(', '));

  origElements.each((_, el) => {
    if (originalPrice) return;
    if (isInstallmentElement($, el)) return;
    const val = parsePrice($(el).text());
    if (val > 0 && (!currentPrice || val > currentPrice)) originalPrice = val;
  });

  if (!originalPrice || originalPrice <= currentPrice) {
    const deMatch = bodyText.match(/(?:De|De:|Preço de lista:|Lista:)\s*R\$\s*([\d.,]+)/i);
    if (deMatch) {
      const parsedDe = parsePrice(deMatch[1]);
      if (parsedDe && (!currentPrice || parsedDe > currentPrice)) originalPrice = parsedDe;
    }
  }

  // 3. Desconto anunciado
  let advertisedDiscount = null;
  const badgeEl = $('[data-component="dui-badge"] [class*="BadgeLabel"], span.savingsPercentage, [data-a-badge-color="savings"]').first();
  if (badgeEl.length) {
    advertisedDiscount = parseDiscount(badgeEl.text());
  }

  // Trava anti-parcela Amazon
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
    outOfStock: isOutOfStock,
    is_available: !isOutOfStock,
    available: !isOutOfStock,
    url: tagAmazonUrl(pageUrl),
  };
}

function isInstallmentPrice(price, html) {
  if (!price || !html) return false;
  const strPrice = price.toFixed(2).replace('.', ',');
  const regex = new RegExp(`\\b\\d+\\s*x\\s*(?:de\\s*)?R?\\$\\s*${strPrice.replace(',', '[,.]')}`, 'i');
  return regex.test(html);
}

module.exports = { parseAmazon, tagAmazonUrl, AMAZON_AFFILIATE_TAG };
