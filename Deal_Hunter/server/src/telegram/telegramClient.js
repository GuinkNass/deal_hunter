const settingsStore = require('../database/settingsStore');
const logger = require('../utils/logger');

const BOT_TOKEN_KEY = 'telegram_bot_token';
const CHAT_ID_KEY = 'telegram_chat_id';

function getConfig() {
  const botToken = settingsStore.get(BOT_TOKEN_KEY, null);
  const chatId = settingsStore.get(CHAT_ID_KEY, null);
  return { botToken, chatId, configured: Boolean(botToken && chatId) };
}

function setConfig({ botToken, chatId }) {
  if (botToken) settingsStore.set(BOT_TOKEN_KEY, botToken.trim());
  if (chatId) settingsStore.set(CHAT_ID_KEY, chatId.trim());
}

function clearConfig() {
  settingsStore.remove(BOT_TOKEN_KEY);
  settingsStore.remove(CHAT_ID_KEY);
}

/** Nunca expor o token completo de volta para a extensão */
function maskToken(token) {
  if (!token) return null;
  const [id, rest] = token.split(':');
  if (!rest) return `${token.slice(0, 4)}${'*'.repeat(Math.max(0, token.length - 4))}`;
  return `${id}:${'*'.repeat(Math.min(12, rest.length))}`;
}

async function sendMessage(text, options = {}) {
  const { botToken, chatId, configured } = getConfig();
  if (!configured) {
    return { ok: false, error: 'Telegram não configurado (Bot Token ou Chat ID ausente).' };
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const body = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: false,
  };
  if (options.inlineButton) {
    body.reply_markup = {
      inline_keyboard: [[{ text: options.inlineButton.text, url: options.inlineButton.url }]],
    };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      const desc = data?.description || `HTTP ${response.status}`;
      logger.error(`Falha ao enviar mensagem Telegram: ${desc}`);
      return { ok: false, error: desc };
    }
    return { ok: true };
  } catch (err) {
    logger.error(`Erro de rede ao contatar Telegram: ${err.message}`);
    return { ok: false, error: 'Não foi possível conectar à API do Telegram. Verifique sua internet.' };
  }
}

async function sendPhoto(caption, photo, options = {}) {
  const { botToken, chatId, configured } = getConfig();
  if (!configured) return { ok: false, error: 'Telegram não configurado (Bot Token ou Chat ID ausente).' };
  const imageUrl = String(photo || '');
  if (!/^https?:\/\//i.test(imageUrl)) return { ok: false, error: 'URL da imagem inválida.' };
  let telegramUploadStarted = false;
  try {
    const referer = String(options.referer || '');
    // Prefer formats Telegram reliably decodes. Several storefront CDNs answer
    // with AVIF/WebP when the request advertises those formats, which can lead
    // to Telegram's IMAGE_PROCESS_FAILED even though the browser shows them.
    let imageHeaders = { 'User-Agent': 'Mozilla/5.0 DealHunter/2.9', Accept: 'image/jpeg,image/png,image/*;q=0.8,*/*;q=0.5' };
    try {
      const refererUrl = new URL(referer);
      if (['http:', 'https:'].includes(refererUrl.protocol)) imageHeaders.Referer = refererUrl.origin + '/';
    } catch { /* O referer é opcional para imagens públicas. */ }
    const imageResponse = await fetch(imageUrl, {
      headers: imageHeaders,
      signal: AbortSignal.timeout(10000),
    });
    if (!imageResponse.ok) throw new Error(`A loja respondeu HTTP ${imageResponse.status} para a imagem.`);
    const contentType = (imageResponse.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!contentType.startsWith('image/')) throw new Error('O endereço do produto não retornou um arquivo de imagem.');
    if (!['image/jpeg', 'image/png'].includes(contentType)) {
      logger.warn(`A loja retornou ${contentType}; imagem não está em JPEG/PNG e pode ser recusada pelo Telegram.`);
    }
    const maxImageBytes = 10 * 1024 * 1024;
    const contentLength = Number(imageResponse.headers.get('content-length'));
    if (contentLength > maxImageBytes) throw new Error('A imagem do produto excede 10 MB.');
    const reader = imageResponse.body.getReader();
    const chunks = [];
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxImageBytes) {
        await reader.cancel();
        throw new Error('A imagem do produto excede 10 MB.');
      }
      chunks.push(value);
    }
    if (!totalBytes) throw new Error('A imagem está vazia.');

    const body = new FormData();
    body.append('chat_id', chatId);
    const extension = contentType === 'image/png' ? 'png' : contentType === 'image/jpeg' ? 'jpg' : 'img';
    body.append('photo', new Blob(chunks, { type: contentType }), `produto.${extension}`);
    body.append('caption', caption);
    body.append('parse_mode', 'HTML');
    if (options.inlineButton) {
      body.append('reply_markup', JSON.stringify({ inline_keyboard: [[{ text: options.inlineButton.text, url: options.inlineButton.url }]] }));
    }
    telegramUploadStarted = true;
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: 'POST', body,
      signal: AbortSignal.timeout(15000),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      const desc = data?.description || `HTTP ${response.status}`;
      if (/IMAGE_PROCESS_FAILED/i.test(desc)) {
        // Some CDNs ignore Accept and return AVIF/WebP. Let Telegram fetch the
        // public image URL itself; its downloader may negotiate a compatible
        // JPEG/PNG representation from the storefront CDN.
        const urlPayload = {
          chat_id: chatId, photo: imageUrl, caption, parse_mode: 'HTML',
          ...(options.inlineButton ? { reply_markup: { inline_keyboard: [[{ text: options.inlineButton.text, url: options.inlineButton.url }]] } } : {}),
        };
        try {
          const urlResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(urlPayload),
            signal: AbortSignal.timeout(12000),
          });
          const urlData = await urlResponse.json();
          if (urlResponse.ok && urlData.ok) return { ok: true };
        } catch (urlError) {
          logger.warn(`Telegram não conseguiu baixar a imagem pelo endereço: ${urlError.message}`);
        }
      }
      logger.warn(`Telegram recusou a foto do produto; tentando enviar apenas o texto: ${desc}`);
      return { ok: false, error: desc, photoRejected: true };
    }
    return { ok: true };
  } catch (err) {
    logger.error(`Erro ao enviar foto ao Telegram: ${err.message}`);
    return { ok: false, error: err.message, photoRejected: !telegramUploadStarted };
  }
}

async function sendTestMessage() {
  return sendMessage('✅ <b>Deal Hunter</b> conectado com sucesso! Este é um alerta de teste.');
}

module.exports = { getConfig, setConfig, clearConfig, maskToken, sendMessage, sendPhoto, sendTestMessage };
