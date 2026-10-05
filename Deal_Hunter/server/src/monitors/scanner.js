const crypto = require('node:crypto');
const { db } = require('../database/db');
const settingsStore = require('../database/settingsStore');
const logger = require('../utils/logger');
const { parseListing, parseCapturedProducts, diagnoseListing } = require('../adapters/listing.adapter');
const { calculateHistoricalDiscount, resolveEffectiveDiscount } = require('../analyzers/discount');
const { calculateOpportunityScore, validateKeywordFilter } = require('../analyzers/score');
const { alertFingerprint } = require('../analyzers/fingerprint');
const { opportunityMessage } = require('../telegram/messageTemplates');
const { sendMessage, sendPhoto } = require('../telegram/telegramClient');
const { sendToMLRadar } = require('../utils/mlRadarPipeline');

const DEFAULTS = { pages: 2, intervalMinutes: 30, minDiscountPercent: 70, repeatIntervalHours: 24 };
const MAX_TELEGRAM_ALERTS_PER_SCAN = 15; // Máximo de 15 produtos por vez no Telegram
const TELEGRAM_BATCH_SIZE = 5;           // 5 produtos por lote
const TELEGRAM_BATCH_PAUSE_MS = 5000;    // Pausa de 5 segundos a cada 5 produtos
const TELEGRAM_MESSAGE_PAUSE_MS = 1000;  // 1 segundo entre mensagens do mesmo lote
const PAGE_PAUSE_MS = 1200;

const stmts = {
  getSelectedCategories: db.prepare(`SELECT categories.id, categories.name AS category_name, categories.url, categories.keyword_filter,
    sites.id AS site_id, sites.name AS site_name, sites.domain
    FROM monitored_categories AS categories JOIN sites ON sites.id = categories.site_id
    WHERE categories.selected = 1 ORDER BY sites.name, categories.name`),
  getProductByUrl: db.prepare('SELECT * FROM products WHERE site_id = ? AND url = ?'),
  insertProduct: db.prepare(`INSERT INTO products
    (site_id, name, ml_item_id, title, url, thumbnail, currency, current_price, site_original_price, category_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),
  updateProduct: db.prepare(`UPDATE products SET name = ?, title = ?, url = ?, thumbnail = ?,
    currency = ?, current_price = ?, site_original_price = ?, category_id = ?,
    last_seen = datetime('now'), updated_at = datetime('now') WHERE id = ?`),
  touchProduct: db.prepare("UPDATE products SET last_seen = datetime('now'), updated_at = datetime('now') WHERE id = ?"),
  insertPrice: db.prepare('INSERT INTO price_history (product_id, price) VALUES (?, ?)'),
  getPriceHistory: db.prepare('SELECT price FROM price_history WHERE product_id = ? ORDER BY observed_at DESC LIMIT 200'),
  getRecentAlert: db.prepare('SELECT id FROM alerts WHERE fingerprint = ? AND sent = 1 AND sent_at >= ? LIMIT 1'),
  getRecentAlertByNameAndPrice: db.prepare(`SELECT alerts.id FROM alerts
    JOIN products ON products.id = alerts.product_id
    WHERE alerts.site_id = ? AND alerts.sent = 1
      AND lower(trim(products.name)) = lower(trim(?))
      AND abs(products.current_price - ?) < 0.005
      AND alerts.sent_at >= ? LIMIT 1`),
  insertAlert: db.prepare(`INSERT INTO alerts
    (site_id, product_id, alert_type, discount_percent, score, sent, fingerprint, message)
    VALUES (?, ?, 'anomaly', ?, ?, ?, ?, ?)`),
  updateSiteChecked: db.prepare("UPDATE sites SET last_checked_at = datetime('now') WHERE id = ?"),
  insertRun: db.prepare(`INSERT INTO scan_runs (status, items_scanned, candidates_found, alerts_sent, message, finished_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))`),
};

async function getScanConfig() {
  const categories = await stmts.getSelectedCategories.all();
  return {
    pages: Math.max(1, Math.min(15, Number(settingsStore.get('scan_pages', DEFAULTS.pages)) || DEFAULTS.pages)),
    scanIntervalMinutes: Number(settingsStore.get('scan_interval_minutes', DEFAULTS.intervalMinutes)) >= 15
      ? Number(settingsStore.get('scan_interval_minutes', DEFAULTS.intervalMinutes))
      : DEFAULTS.intervalMinutes,
    minDiscountPercent: Number(settingsStore.get('alert_min_discount_percent', DEFAULTS.minDiscountPercent)),
    maxPrice: settingsStore.get('alert_max_price', null),
    repeatIntervalHours: Number(settingsStore.get('alert_repeat_interval_hours', DEFAULTS.repeatIntervalHours)),
    selectedCategories: categories.length,
  };
}

let activeScan = null;
const browserScanSessions = new Map();
const cancelledBrowserScans = new Set();

function cancelBrowserScan(scanId) {
  const session = browserScanSessions.get(scanId);
  if (session) session.cancelled = true;
  else cancelledBrowserScans.add(scanId);
  return { ok: true };
}

async function runScan() {
  if (activeScan) return { status: 'running', message: 'Uma varredura já está em andamento.' };
  activeScan = runScanCycle();
  try {
    return await activeScan;
  } finally {
    activeScan = null;
  }
}

async function runScanCycle() {
  const config = await getScanConfig();
  const categories = await stmts.getSelectedCategories.all();
  if (!categories.length) {
    const message = 'Selecione ao menos uma loja/categoria na configuração.';
    logger.warn(message);
    return { status: 'skipped', message };
  }

  let itemsScanned = 0;
  const candidates = [];
  const errors = [];
  const scannedProducts = new Set();
  const seenDeals = new Set();

  for (const category of categories) {
    try {
      const items = await fetchCategory(category, config.pages);
      if (!items.length) throw new Error('A categoria não retornou produtos.');
      for (const item of items) {
        const identity = `${category.site_id}:${item.url}`;
        if (scannedProducts.has(identity)) continue;
        scannedProducts.add(identity);
        itemsScanned += 1;
        const candidate = await updateProductAndFindDeal(category, item, config);
        if (candidate && !seenDeals.has(candidate.fingerprint)) {
          seenDeals.add(candidate.fingerprint);
          candidates.push(candidate);
        }
      }
      logger.info(`${category.site_name} / ${category.category_name}: ${items.length} produto(s) lido(s).`);
    } catch (err) {
      const message = `${category.site_name} / ${category.category_name}: ${err.message}`;
      errors.push(message);
      logger.error(`Falha na categoria ${message}`);
    } finally {
      await stmts.updateSiteChecked.run(category.site_id);
    }
    await delay(PAGE_PAUSE_MS);
  }

  const bestCandidates = [...candidates]
    .sort((a, b) => b.discountPercent - a.discountPercent || b.score - a.score)
    .slice(0, MAX_TELEGRAM_ALERTS_PER_SCAN);
  const candidatesToSend = [...bestCandidates]
    .sort((a, b) => a.discountPercent - b.discountPercent || a.score - b.score);

  let alertsSent = 0;
  let alertsAttempted = 0;
  let batchCounter = 0;

  for (let i = 0; i < candidatesToSend.length; i += 1) {
    const candidate = candidatesToSend[i];
    if (candidate.category.keyword_filter && !validateKeywordFilter({ name: candidate.item.name, title: candidate.item.name, description: candidate.item.description }, candidate.category.keyword_filter)) {
      continue;
    }
    if (batchCounter > 0 && batchCounter % TELEGRAM_BATCH_SIZE === 0) {
      logger.info(`Deal Hunter Telegram: lote de ${TELEGRAM_BATCH_SIZE} produtos enviado; aguardando ${TELEGRAM_BATCH_PAUSE_MS / 1000}s...`);
      await delay(TELEGRAM_BATCH_PAUSE_MS);
    } else if (i > 0) {
      await delay(TELEGRAM_MESSAGE_PAUSE_MS);
    }
    const message = opportunityMessage({
      siteName: candidate.category.site_name,
      title: candidate.item.name,
      currentPrice: candidate.item.price,
      referencePrice: candidate.referencePrice,
      referencePriceSource: candidate.referencePriceSource,
      discountPercent: candidate.discountPercent,
      score: candidate.score,
      sampleSize: candidate.sampleSize,
      url: candidate.item.url,
    });
    const candidateImage = candidate.item.imageUrl || candidate.product.thumbnail || '';
    const imageUrl = /^https?:\/\//i.test(candidateImage) ? candidateImage : null;

    // Encaminha para o ML Radar (Etapa 1.3)
    sendToMLRadar({
      title: candidate.item.name,
      price: candidate.item.price,
      originalPrice: candidate.referencePrice || candidate.item.originalPrice || null,
      imageUrl,
      productUrl: candidate.item.url,
      store: candidate.category.site_name,
    }).catch(() => {});

    let sendResult = imageUrl ? await sendPhoto(message.text, imageUrl, { inlineButton: message.inlineButton, referer: candidate.item.url }) : await sendMessage(message.text, { inlineButton: message.inlineButton });
    if (!sendResult.ok && imageUrl && sendResult.photoRejected) {
      sendResult = await sendMessage(`${message.text}\n\n${candidate.item.url}`, { inlineButton: message.inlineButton });
    }
    alertsAttempted += 1;
    await stmts.insertAlert.run(
      candidate.category.site_id, candidate.product.id, candidate.discountPercent,
      candidate.score, sendResult.ok ? 1 : 0, candidate.fingerprint, message.text
    );
    candidate._alertSaved = true;
    if (sendResult.ok) alertsSent += 1;
    batchCounter += 1;
  }

  for (const candidate of candidates) {
    if (candidate._alertSaved) continue;
    const message = opportunityMessage({
      siteName: candidate.category.site_name,
      title: candidate.item.name,
      currentPrice: candidate.item.price,
      referencePrice: candidate.referencePrice,
      referencePriceSource: candidate.referencePriceSource,
      discountPercent: candidate.discountPercent,
      score: candidate.score,
      sampleSize: candidate.sampleSize,
      url: candidate.item.url,
    });
    await stmts.insertAlert.run(
      candidate.category.site_id, candidate.product.id, candidate.discountPercent,
      candidate.score, 0, candidate.fingerprint, message.text
    );
  }

  const status = !errors.length ? 'success' : itemsScanned ? 'partial' : 'error';
  const errorMessage = errors.length ? errors.slice(0, 10).join(' | ') : null;
  await stmts.insertRun.run(status, itemsScanned, candidates.length, alertsSent, errorMessage);
  logger.info(`Varredura concluída: ${itemsScanned} produto(s) avaliado(s), ${candidates.length} oportunidade(s), ${alertsSent} alerta(s) enviado(s).`);
  return { status, itemsScanned, candidatesFound: candidates.length, alertsSent, errors };
}

async function processBrowserPages(pages, scanId = null, complete = true) {
  if (scanId && cancelledBrowserScans.has(scanId)) {
    cancelledBrowserScans.delete(scanId);
    browserScanSessions.delete(scanId);
    return { status: 'cancelled', message: 'Varredura cancelada pelo usuário.' };
  }
  return processBrowserPagesCycle(pages, scanId, complete);
}

async function processBrowserPagesCycle(pages, scanId, complete) {
  const config = await getScanConfig();
  const categoriesList = await stmts.getSelectedCategories.all();
  const categories = new Map(categoriesList.map((category) => [category.id, category]));
  if (!categories.size) return { status: 'skipped', message: 'Selecione ao menos uma loja/categoria.' };
  const session = scanId
    ? browserScanSessions.get(scanId) || { itemsScanned: 0, candidatesFound: 0, alertsSent: 0, alertsAttempted: 0, alertsByCategory: {}, errors: [], seen: new Set(), seenDeals: new Set(), cancelled: cancelledBrowserScans.has(scanId) }
    : { itemsScanned: 0, candidatesFound: 0, alertsSent: 0, alertsAttempted: 0, alertsByCategory: {}, errors: [], seen: new Set(), seenDeals: new Set(), cancelled: false };
  if (scanId) browserScanSessions.set(scanId, session);
  const candidates = [];
  const offers = [];

  for (const page of pages) {
    const category = categories.get(page.categoryId);
    if (!category) {
      session.errors.push(`Categoria não selecionada ou desconhecida: ${String(page.categoryId).slice(0, 80)}`);
      continue;
    }
    if (page.error) {
      session.errors.push(`${category.site_name} / ${category.category_name}: ${String(page.error).slice(0, 300)}`);
      continue;
    }
    const html = String(page.html || '');
    const capturedProducts = parseCapturedProducts(page.products, category.url, category.domain);
    const items = capturedProducts.length ? capturedProducts : parseListing(html, category.url, category.domain);
    if (page.scrollLimitReached) {
      logger.warn(`${category.site_name} / ${category.category_name}: limite de rolagem atingido; parte do catálogo pode não ter sido carregada.`);
    }
    if (!items.length) {
      session.errors.push(`${category.site_name} / ${category.category_name}: nenhum produto/preço extraído (${diagnoseListing(html, category.domain)}).`);
      continue;
    }
    for (const item of items) {
      const identity = `${category.site_id}:${item.url}`;
      if (session.seen.has(identity)) continue;
      session.seen.add(identity);
      session.itemsScanned += 1;
      const candidate = await updateProductAndFindDeal(category, item, config);
      if (candidate && !session.seenDeals.has(candidate.fingerprint)) {
        session.seenDeals.add(candidate.fingerprint);
        candidates.push(candidate);
      }
    }
    await stmts.updateSiteChecked.run(category.site_id);
    logger.info(`${category.site_name} / ${category.category_name}: ${items.length} produto(s) processado(s) pelo backend na nuvem.`);
  }

  session.candidatesFound += candidates.length;

  for (const candidate of candidates) {
    const candidateImage = candidate.item.imageUrl || candidate.product.thumbnail || '';
    const imageUrl = /^https?:\/\//i.test(candidateImage) ? candidateImage : null;
    offers.push({
      siteName: candidate.category.site_name,
      categoryName: candidate.category.category_name,
      name: candidate.item.name,
      url: candidate.item.url,
      imageUrl,
      price: candidate.item.price,
      discountPercent: candidate.discountPercent,
    });
  }

  const remainingSlots = Math.max(0, MAX_TELEGRAM_ALERTS_PER_SCAN - session.alertsAttempted);
  const bestCandidates = [...candidates]
    .sort((a, b) => b.discountPercent - a.discountPercent || b.score - a.score)
    .slice(0, remainingSlots);

  const candidatesToSend = [...bestCandidates]
    .sort((a, b) => a.discountPercent - b.discountPercent || a.score - b.score);

  let batchCounter = 0;
  for (let i = 0; i < candidatesToSend.length; i += 1) {
    const candidate = candidatesToSend[i];
    if (session.cancelled) break;
    if (candidate.category.keyword_filter && !validateKeywordFilter({ name: candidate.item.name, title: candidate.item.name, description: candidate.item.description }, candidate.category.keyword_filter)) {
      continue;
    }

    if (batchCounter > 0 && batchCounter % TELEGRAM_BATCH_SIZE === 0) {
      logger.info(`Deal Hunter Telegram: lote de ${TELEGRAM_BATCH_SIZE} produtos enviado; aguardando ${TELEGRAM_BATCH_PAUSE_MS / 1000}s...`);
      await delay(TELEGRAM_BATCH_PAUSE_MS);
    } else if (i > 0) {
      await delay(TELEGRAM_MESSAGE_PAUSE_MS);
    }
    if (session.cancelled) break;

    const message = opportunityMessage({
      siteName: candidate.category.site_name,
      title: candidate.item.name,
      currentPrice: candidate.item.price,
      referencePrice: candidate.referencePrice,
      referencePriceSource: candidate.referencePriceSource,
      discountPercent: candidate.discountPercent,
      score: candidate.score,
      sampleSize: candidate.sampleSize,
      url: candidate.item.url,
    });
    const candidateImage = candidate.item.imageUrl || candidate.product.thumbnail || '';
    const imageUrl = /^https?:\/\//i.test(candidateImage) ? candidateImage : null;

    // Encaminha dados higienizados para o ML Radar (Etapa 1.3)
    sendToMLRadar({
      title: candidate.item.name,
      price: candidate.item.price,
      originalPrice: candidate.referencePrice || candidate.item.originalPrice || null,
      imageUrl,
      productUrl: candidate.item.url,
      store: candidate.category.site_name,
    }).catch(() => {});

    let sent = imageUrl ? await sendPhoto(message.text, imageUrl, { inlineButton: message.inlineButton, referer: candidate.item.url }) : await sendMessage(message.text, { inlineButton: message.inlineButton });
    if (!sent.ok && imageUrl && sent.photoRejected) {
      sent = await sendMessage(`${message.text}\n\n${candidate.item.url}`, { inlineButton: message.inlineButton });
    }
    await stmts.insertAlert.run(
      candidate.category.site_id, candidate.product.id, candidate.discountPercent,
      candidate.score, sent.ok ? 1 : 0, candidate.fingerprint, message.text
    );
    candidate._alertSaved = true;
    session.alertsAttempted += 1;
    session.alertsByCategory[candidate.category.id] = (session.alertsByCategory[candidate.category.id] || 0) + 1;
    batchCounter += 1;
    if (sent.ok) session.alertsSent += 1;
  }

  for (const candidate of candidates) {
    if (candidate._alertSaved) continue;
    const message = opportunityMessage({
      siteName: candidate.category.site_name,
      title: candidate.item.name,
      currentPrice: candidate.item.price,
      referencePrice: candidate.referencePrice,
      referencePriceSource: candidate.referencePriceSource,
      discountPercent: candidate.discountPercent,
      score: candidate.score,
      sampleSize: candidate.sampleSize,
      url: candidate.item.url,
    });
    await stmts.insertAlert.run(
      candidate.category.site_id, candidate.product.id, candidate.discountPercent,
      candidate.score, 0, candidate.fingerprint, message.text
    );
  }

  if (!complete) {
    return { status: session.cancelled ? 'cancelled' : 'running', itemsScanned: session.itemsScanned, candidatesFound: session.candidatesFound, alertsSent: session.alertsSent, errors: session.errors, offers };
  }
  const status = session.cancelled ? 'cancelled' : !session.errors.length ? 'success' : session.itemsScanned ? 'partial' : 'error';
  const errorMessage = session.errors.length ? session.errors.slice(0, 10).join(' | ') : null;
  await stmts.insertRun.run(status, session.itemsScanned, session.candidatesFound, session.alertsSent, errorMessage);
  if (scanId) browserScanSessions.delete(scanId);
  if (scanId) cancelledBrowserScans.delete(scanId);
  logger.info(`Varredura remota concluída: ${session.itemsScanned} produto(s), ${session.candidatesFound} oportunidade(s), ${session.alertsSent} alerta(s) enviado(s).`);
  return { status, itemsScanned: session.itemsScanned, candidatesFound: session.candidatesFound, alertsSent: session.alertsSent, errors: session.errors, offers };
}

async function fetchCategory(category, pages) {
  const products = new Map();
  for (let page = 1; page <= pages; page += 1) {
    const pageUrl = page === 1 ? category.url : getPageUrl(category.url, category.domain, page);
    const html = await fetchHtml(pageUrl, category.domain);
    const pageProducts = parseListing(html, pageUrl, category.domain);
    for (const product of pageProducts) {
      if (!product.outOfStock) products.set(product.url, product);
    }
    if (page === 1 && !pageProducts.length) {
      throw new Error(`Nenhum produto extraído (${diagnoseListing(html, category.domain)}).`);
    }

    // Regra de parada para produtos esgotados
    const hasOutOfStock = pageProducts.some((p) => p.outOfStock)
      || /(?:todos\s*os\s*produtos\s*esgotados|produtos\s*esgotados|estoque\s*esgotado)/i.test(html);

    if (!pageProducts.length || hasOutOfStock) {
      if (hasOutOfStock) logger.info(`${category.site_name} / ${category.category_name}: produtos esgotados detectados na página ${page}. Interrompendo loop da categoria.`);
      break;
    }
    if (page < pages) await delay(PAGE_PAUSE_MS);
  }
  return [...products.values()];
}

function getPageUrl(base, domain, page) {
  const url = new URL(base);
  if (domain.includes('amazon.')) url.searchParams.set('page', String(page));
  else if (domain.includes('eletroclub.')) url.searchParams.set('page', String(page));
  else url.searchParams.set('page', String(page));
  return url.href;
}

async function fetchHtml(url, allowedDomain) {
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol) || !isAllowedDomain(parsed.hostname, allowedDomain)) {
    throw new Error('URL de categoria ou redirecionamento fora do domínio cadastrado.');
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('HTTP 403: o site recusou a leitura automatizada. A categoria ficará indisponível até o site permitir o acesso.');
      }
      if (response.status === 429) {
        throw new Error('HTTP 429: o site limitou as requisições. Aumente o intervalo de varredura e tente novamente mais tarde.');
      }
      throw new Error(`HTTP ${response.status} ao acessar a categoria.`);
    }
    const html = await response.text();
    if (html.length > 8_000_000) throw new Error('A página excede o limite de tamanho de 8 MB.');
    if (isBlockPage(html)) throw new Error('O site retornou uma página de verificação/bloqueio em vez do catálogo. O Deal Hunter não tenta contornar essa proteção.');
    return html;
  } finally {
    clearTimeout(timeout);
  }
}

function isBlockPage(html) {
  const sample = String(html).slice(0, 500_000);
  return /(?:captcha|robot check|automated access|validate you are human|verifique se você é humano|acesso negado)/i.test(sample)
    && !/<(?:article|li|div)[^>]*(?:data-asin|product-summary|product-card|product-item)/i.test(sample);
}

function isAllowedDomain(hostname, domain) {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

async function updateProductAndFindDeal(category, item, config) {
  let originalPrice = Number(item.originalPrice) > item.price
    && Number(item.originalPrice) <= Number(item.price) * 10
    ? Number(item.originalPrice) : null;
  if (!originalPrice && Number(item.advertisedDiscount) > 0 && Number(item.advertisedDiscount) < 100) {
    originalPrice = Math.round((Number(item.price) / (1 - Number(item.advertisedDiscount) / 100)) * 100) / 100;
  }
  item = { ...item, originalPrice };
  let product = await stmts.getProductByUrl.get(category.site_id, item.url);
  const oldPrice = product ? Number(product.current_price) : null;
  if (!product) {
    const scraperId = `scrape-${crypto.createHash('sha256').update(`${category.site_id}|${item.url}`).digest('hex')}`;
    const result = await stmts.insertProduct.run(
      category.site_id, item.name, scraperId, item.name, item.url, item.imageUrl,
      item.currency || 'BRL', item.price, item.originalPrice, category.id
    );
    product = await stmts.getProductByUrl.get(category.site_id, item.url);
    const productId = product?.id || result.lastInsertRowid;
    if (productId) await stmts.insertPrice.run(productId, item.price);
  } else {
    if (oldPrice !== item.price) await stmts.insertPrice.run(product.id, item.price);
    else await stmts.touchProduct.run(product.id);
    await stmts.updateProduct.run(
      item.name, item.name, item.url, item.imageUrl || product.thumbnail,
      item.currency || 'BRL', item.price, item.originalPrice, category.id, product.id
    );
    product = { ...product, name: item.name, title: item.name, current_price: item.price, site_original_price: item.originalPrice };
  }

  const priceHistoryRows = await stmts.getPriceHistory.all(product.id);
  const history = priceHistoryRows.map((row) => Number(row.price)).filter((price) => price !== item.price);
  const stats = calculateHistoricalDiscount(item.price, history);
  const effective = resolveEffectiveDiscount({
    price: item.price,
    siteOriginalPrice: originalPrice,
    advertisedDiscount: item.advertisedDiscount,
    rawText: `${item.name} ${item.url}`,
  }, stats);
  if (!effective || effective.referencePrice > item.price * 10
    || effective.discountPercent < config.minDiscountPercent) return null;

  // Filtro Dinâmico por Palavra-Chave na Categoria
  if (category.keyword_filter && !validateKeywordFilter({ name: item.name, title: item.name, description: item.description }, category.keyword_filter)) {
    return null;
  }
  const discountPercent = effective.discountPercent;
  if (config.maxPrice && item.price > Number(config.maxPrice)) return null;

  const score = calculateOpportunityScore({
    calculatedDiscountPercent: discountPercent,
    sampleSize: stats.sampleSize,
    reliable: stats.reliable,
    hasCoupon: false,
    historicalMin: stats.historicalMin,
    currentPrice: item.price,
  });
  const fingerprint = alertFingerprint({ siteId: category.site_id, productId: product.id, productName: item.name, alertType: 'anomaly', price: item.price });
  
  // Data limite ISO para checagem agnóstica de banco
  const repeatHours = Number(config.repeatIntervalHours) || DEFAULTS.repeatIntervalHours;
  const thresholdDate = new Date(Date.now() - repeatHours * 3600 * 1000).toISOString();

  const recentAlert = await stmts.getRecentAlert.get(fingerprint, thresholdDate);
  if (recentAlert) return null;

  const recentByName = await stmts.getRecentAlertByNameAndPrice.get(category.site_id, item.name, item.price, thresholdDate);
  if (recentByName) return null;

  return {
    category, item, product, discountPercent, score, fingerprint,
    referencePrice: effective.referencePrice,
    referencePriceSource: effective.source,
    sampleSize: effective.sampleSize,
  };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { runScan, getScanConfig, fetchCategory, processBrowserPages, cancelBrowserScan };
