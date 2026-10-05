const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const { NewMessage } = require('telegram/events');
const { getSetting, setSetting } = require('../db/db');

let client = null;
let isListening = false;
let messageQueueCallback = null;

/**
 * Tolerant regex parser for Brazilian deal messages (Promobit, Pelando, Gatry, Telegram promo channels)
 */
function parseTelegramMessage(text) {
  if (!text || typeof text !== 'string') return null;

  // 1. Extract URL (http or https)
  const urlMatch = text.match(/(https?:\/\/[^\s\n\r]+)/i);
  if (!urlMatch) {
    return null; // A deal message must contain a product link
  }
  const url = urlMatch[1].replace(/[.,!?)\]]+$/, ''); // clean trailing punctuation

  // 2. Detect Store from URL or text
  let store = 'Outra Loja';
  const urlLower = url.toLowerCase();
  if (urlLower.includes('amazon.')) store = 'Amazon';
  else if (urlLower.includes('magazineluiza.') || urlLower.includes('magalu.')) store = 'Magalu';
  else if (urlLower.includes('kabum.')) store = 'KaBuM!';
  else if (urlLower.includes('shopee.')) store = 'Shopee';
  else if (urlLower.includes('shein.')) store = 'Shein';
  else if (urlLower.includes('pichau.')) store = 'Pichau';
  else if (urlLower.includes('terabyte.')) store = 'Terabyte';
  else if (urlLower.includes('aliexpress.')) store = 'AliExpress';
  else if (urlLower.includes('eletroclub.')) store = 'Eletroclub';
  else if (urlLower.includes('mercadolivre.')) store = 'Mercado Livre';

  // 3. Extract Prices (R$ 1.234,56 or 1234,56 or 123.45)
  // Look for patterns like "De R$ 199 por R$ 99" or "R$ 99,90"
  let currentPrice = null;
  let originalPrice = null;

  // Check "De R$ X Por R$ Y" pattern
  const dePorMatch = text.match(/de\s*r?\$?\s*([0-9.,]+)\s*por\s*(?:apenas\s*)?r?\$?\s*([0-9.,]+)/i);
  if (dePorMatch) {
    originalPrice = parseCurrency(dePorMatch[1]);
    currentPrice = parseCurrency(dePorMatch[2]);
  } else {
    // Collect all price matches
    const priceMatches = [...text.matchAll(/r?\$?\s*([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2}|[0-9]+(?:\.[0-9]{2}))/gi)];
    const parsedPrices = priceMatches
      .map(m => parseCurrency(m[1]))
      .filter(p => p !== null && p > 0);

    if (parsedPrices.length >= 2) {
      // Usually lowest is current price, higher is original
      parsedPrices.sort((a, b) => a - b);
      currentPrice = parsedPrices[0];
      originalPrice = parsedPrices[parsedPrices.length - 1];
    } else if (parsedPrices.length === 1) {
      currentPrice = parsedPrices[0];
    }
  }

  if (!currentPrice || currentPrice <= 0) {
    return null;
  }

  // 4. Extract Discount Percentage (e.g. "30% OFF", "30%", "-30%")
  let discountPercent = null;
  const discountMatch = text.match(/(-?\d{1,2})%\s*(?:off|desconto)?/i);
  if (discountMatch) {
    discountPercent = Math.abs(parseInt(discountMatch[1], 10));
  } else if (originalPrice && currentPrice && originalPrice > currentPrice) {
    discountPercent = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }

  // 5. Extract Title / Product Name
  // Typically the first non-empty line that doesn't start with emoji/promo tags, or cleaned line
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  let title = '';
  for (const line of lines) {
    // Skip lines with only emojis, URLs or price-only indicators
    if (line.includes('http://') || line.includes('https://')) continue;
    if (line.match(/^r?\$?\s*[0-9.,]+$/i)) continue;
    if (line.match(/^(🚨|🔥|⚡|💥|😱|👀|cupom|atenção|imperdível)/i) && line.length < 25) continue;

    // Remove leading emojis and clean line
    const cleaned = line.replace(/^[^\w\s\d]+/, '').trim();
    if (cleaned.length > 10) {
      title = cleaned;
      break;
    }
  }

  if (!title && lines.length > 0) {
    title = lines[0].replace(/^[^\w\s\d]+/, '').trim();
  }

  // Truncate overly long title
  title = title.substring(0, 150);

  return {
    nome: title || `Produto ${store}`,
    url,
    preco: currentPrice,
    preco_anterior: originalPrice,
    desconto: discountPercent,
    loja: store
  };
}

/**
 * Parses Brazilian format currency string to Float
 */
function parseCurrency(str) {
  if (!str) return null;
  let clean = str.replace(/[^\d.,]/g, '').trim();
  // Handle Brazilian 1.234,56 -> 1234.56
  if (clean.includes(',') && clean.includes('.')) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
    clean = clean.replace(',', '.');
  }
  const num = parseFloat(clean);
  return isNaN(num) ? null : Number(num.toFixed(2));
}

/**
 * Rotina de leitura ativa do Telegram completamente removida.
 * O ML Radar agora opera exclusivamente como consumidor passivo dos dados limpos emitidos pelo Deal Hunter Pro.
 */
async function startTelegramListener() {
  console.log('[Telegram Ingest] Leitura ativa de mensagens do Telegram desativada. ML Radar opera exclusivamente como consumidor passivo do Deal Hunter Pro.');
  return false;
}

/**
 * Stop the Telegram client (no-op)
 */
async function stopTelegramListener() {
  return true;
}

function getListenerStatus() {
  return {
    isListening: false,
    mode: 'passive_deal_hunter',
    configured: false
  };
}

module.exports = {
  parseTelegramMessage,
  parseCurrency,
  startTelegramListener,
  stopTelegramListener,
  getListenerStatus
};
