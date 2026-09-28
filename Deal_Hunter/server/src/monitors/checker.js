const { db } = require("../database/db");
const settingsStore = require("../database/settingsStore");
const logger = require("../utils/logger");
const { getAdapterForDomain } = require("../adapters");
const { calculateHistoricalDiscount } = require("../analyzers/discount");
const { calculateOpportunityScore } = require("../analyzers/score");
const {
  couponFingerprint,
  alertFingerprint,
} = require("../analyzers/fingerprint");
const {
  anomalyAlertMessage,
  couponAlertMessage,
} = require("../telegram/messageTemplates");
const { sendMessage } = require("../telegram/telegramClient");

const DEFAULT_MIN_DISCOUNT_PERCENT = 70;
const DEFAULT_ALERT_REPEAT_HOURS = 24;

const stmts = {
  getSite: db.prepare("SELECT * FROM sites WHERE id = ?"),
  getActiveSites: db.prepare("SELECT id FROM sites WHERE active = 1"),
  getProduct: db.prepare(
    "SELECT * FROM products WHERE site_id = ? AND url = ?",
  ),
  insertProduct:
    db.prepare(`INSERT INTO products (site_id, name, url, currency, current_price, image_url)
    VALUES (?, ?, ?, ?, ?, ?)`),
  updateProduct: db.prepare(`UPDATE products SET name = ?, current_price = ?,
    image_url = ?, updated_at = datetime('now') WHERE id = ?`),
  insertPriceHistory: db.prepare(
    "INSERT INTO price_history (product_id, price) VALUES (?, ?)",
  ),
  getPriceHistory: db.prepare(
    "SELECT price FROM price_history WHERE product_id = ? ORDER BY observed_at DESC LIMIT 200",
  ),
  getCouponByFingerprint: db.prepare(
    "SELECT * FROM coupons WHERE fingerprint = ?",
  ),
  insertCoupon:
    db.prepare(`INSERT INTO coupons (site_id, code, discount_type, discount_value, source_url, description, fingerprint)
    VALUES (?, ?, ?, ?, ?, ?, ?)`),
  touchCoupon: db.prepare(
    "UPDATE coupons SET last_seen = datetime('now') WHERE id = ?",
  ),
  getRecentAlertByFingerprint: db.prepare(
    "SELECT * FROM alerts WHERE fingerprint = ? AND sent_at >= datetime('now', ?) ORDER BY sent_at DESC LIMIT 1",
  ),
  insertAlert:
    db.prepare(`INSERT INTO alerts (site_id, product_id, coupon_id, alert_type, fingerprint, score, message)
    VALUES (?, ?, ?, ?, ?, ?, ?)`),
  updateSiteChecked: db.prepare(
    "UPDATE sites SET last_checked_at = datetime('now') WHERE id = ?",
  ),
  insertRun:
    db.prepare(`INSERT INTO monitor_runs (site_id, status, products_analyzed, changes_detected, alerts_sent, message, finished_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`),
};

function getAlertFilters() {
  return {
    minDiscountPercent: Number(
      settingsStore.get(
        "alert_min_discount_percent",
        DEFAULT_MIN_DISCOUNT_PERCENT,
      ),
    ),
    maxPrice: settingsStore.get("alert_max_price", null),
    minScore: Number(settingsStore.get("alert_min_score", 0)),
    repeatIntervalHours: Number(
      settingsStore.get(
        "alert_repeat_interval_hours",
        DEFAULT_ALERT_REPEAT_HOURS,
      ),
    ),
  };
}

async function wasAlertedRecently(fingerprint, hours) {
  const row = stmts.getRecentAlertByFingerprint.get(
    fingerprint,
    `-${hours} hours`,
  );
  return Boolean(row);
}

/**
 * Verifica um site: busca o HTML da URL cadastrada, roda o adaptador
 * apropriado, atualiza produto/histórico, detecta cupons e decide
 * alertas. Respeita timeouts e nunca lança exceção para o chamador —
 * erros são registrados em monitor_runs.
 */
async function checkSite(siteId) {
  const site = stmts.getSite.get(siteId);
  if (!site) return { status: "error", message: "Site não encontrado" };
  if (!site.active) return { status: "skipped", message: "Site pausado" };

  let productsAnalyzed = 0;
  let changesDetected = 0;
  let alertsSent = 0;

  try {
    const html = await fetchHtml(site.url);
    const parse = getAdapterForDomain(site.domain);
    const data = parse(html, site.url);

    if (!data.priceFound && !data.couponCandidates?.length) {
      finishRun(
        site.id,
        "blocked",
        0,
        0,
        0,
        "Site não pôde ser analisado automaticamente.",
      );
      return { status: "blocked" };
    }

    if (data.priceFound) {
      productsAnalyzed = 1;
      const result = await processProduct(site, data);
      changesDetected += result.changed ? 1 : 0;
      alertsSent += result.alertsSent;
    }

    if (site.monitor_coupons && data.couponCandidates?.length) {
      const result = await processCoupons(
        site,
        data.couponCandidates,
        data.url,
      );
      changesDetected += result.newCoupons;
      alertsSent += result.alertsSent;
    }

    stmts.updateSiteChecked.run(site.id);
    finishRun(
      site.id,
      "success",
      productsAnalyzed,
      changesDetected,
      alertsSent,
      null,
    );
    logger.info(
      `${site.name}: verificado. ${productsAnalyzed} produto(s), ${changesDetected} mudança(s), ${alertsSent} alerta(s).`,
    );
    return { status: "success", productsAnalyzed, changesDetected, alertsSent };
  } catch (err) {
    logger.error(`Erro ao verificar ${site.name}: ${err.message}`);
    finishRun(
      site.id,
      "error",
      productsAnalyzed,
      changesDetected,
      alertsSent,
      err.message,
    );
    return { status: "error", message: err.message };
  }
}

/**
 * Função global para varrer todos os sites ativos cadastrados.
 */
async function checkAllSites() {
  logger.info("Iniciando varredura geral em todos os sites ativos...");
  const sites = stmts.getActiveSites.all();
  const results = [];

  for (const site of sites) {
    const res = await checkSite(site.id);
    results.push({ siteId: site.id, ...res });
  }

  logger.info("Varredura geral concluída.");
  return results;
}

async function processProduct(site, data) {
  let product = stmts.getProduct.get(site.id, data.url);
  const previousPrice = product?.current_price ?? null;

  if (!product) {
    const info = stmts.insertProduct.run(
      site.id,
      data.name || site.name,
      data.url,
      data.currency || "BRL",
      data.price,
      data.imageUrl || null,
    );
    product = stmts.getProduct.get(site.id, data.url);
    stmts.insertPriceHistory.run(product.id, data.price);
    return { changed: true, alertsSent: 0 };
  }

  const priceChanged =
    previousPrice !== null && Number(previousPrice) !== Number(data.price);
  if (priceChanged || previousPrice === null) {
    stmts.insertPriceHistory.run(product.id, data.price);
  }
  stmts.updateProduct.run(
    data.name || product.name,
    data.price,
    data.imageUrl || product.image_url,
    product.id,
  );

  if (!site.monitor_prices && !site.monitor_anomalies) {
    return { changed: priceChanged, alertsSent: 0 };
  }

  const history = stmts.getPriceHistory
    .all(product.id)
    .map((r) => r.price)
    .filter((p) => p !== data.price);
  const stats = calculateHistoricalDiscount(data.price, history);

  if (!stats.reliable) {
    return { changed: priceChanged, alertsSent: 0 };
  }

  const score = calculateOpportunityScore({
    calculatedDiscountPercent: stats.calculatedDiscountPercent,
    sampleSize: stats.sampleSize,
    reliable: stats.reliable,
    hasCoupon: false,
    historicalMin: stats.historicalMin,
    currentPrice: data.price,
  });

  const filters = getAlertFilters();
  const meetsDiscount =
    (stats.calculatedDiscountPercent ?? 0) >= filters.minDiscountPercent;
  const meetsMaxPrice = filters.maxPrice
    ? data.price <= Number(filters.maxPrice)
    : true;
  const meetsScore = score >= filters.minScore;

  if (!(meetsDiscount && meetsMaxPrice && meetsScore)) {
    return { changed: priceChanged, alertsSent: 0 };
  }

  const fp = alertFingerprint({
    siteId: site.id,
    productId: product.id,
    couponId: null,
    alertType: "anomaly",
    price: data.price,
  });
  if (await wasAlertedRecently(fp, filters.repeatIntervalHours)) {
    return { changed: priceChanged, alertsSent: 0 };
  }

  const message = anomalyAlertMessage({
    siteName: site.name,
    productName: product.name,
    currentPrice: data.price,
    referenceAverage: stats.referenceAverage,
    calculatedDiscountPercent: stats.calculatedDiscountPercent,
    score,
    sampleSize: stats.sampleSize,
    url: product.url,
  });

  const sendResult = await sendMessage(message);
  if (sendResult.ok) {
    stmts.insertAlert.run(
      site.id,
      product.id,
      null,
      "anomaly",
      fp,
      score,
      message,
    );
  }

  return { changed: priceChanged, alertsSent: sendResult.ok ? 1 : 0 };
}

async function processCoupons(site, candidates, sourceUrl) {
  let newCoupons = 0;
  let alertsSent = 0;
  const filters = getAlertFilters();

  for (const candidate of candidates.slice(0, 20)) {
    const fp = couponFingerprint({ siteId: site.id, code: candidate.code });
    let coupon = stmts.getCouponByFingerprint.get(fp);
    if (coupon) {
      stmts.touchCoupon.run(coupon.id);
    } else {
      stmts.insertCoupon.run(
        site.id,
        candidate.code,
        null,
        null,
        sourceUrl,
        candidate.contextSnippet,
        fp,
      );
      newCoupons += 1;
      coupon = stmts.getCouponByFingerprint.get(fp);
    }
    const alertFp = alertFingerprint({
      siteId: site.id,
      productId: null,
      couponId: coupon.id,
      alertType: "coupon",
      price: null,
    });
    if (await wasAlertedRecently(alertFp, filters.repeatIntervalHours))
      continue;

    const message = couponAlertMessage({
      siteName: site.name,
      code: candidate.code,
      discountType: null,
      discountValue: null,
      minimumPurchase: null,
      expirationDate: null,
      url: sourceUrl,
    });
    const sendResult = await sendMessage(message);
    if (sendResult.ok) {
      stmts.insertAlert.run(
        site.id,
        null,
        coupon.id,
        "coupon",
        alertFp,
        null,
        message,
      );
      alertsSent += 1;
    }
  }

  return { newCoupons, alertsSent };
}

function finishRun(
  siteId,
  status,
  productsAnalyzed,
  changesDetected,
  alertsSent,
  message,
) {
  stmts.insertRun.run(
    siteId,
    status,
    productsAnalyzed,
    changesDetected,
    alertsSent,
    message,
  );
}

async function fetchHtml(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) DealHunter/1.0 (monitoramento local do usuário)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!response.ok)
      throw new Error(`HTTP ${response.status} ao acessar ${url}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  checkSite,
  processProduct,
  processCoupons,
  checkAllSites,
  checkAllNow: checkAllSites,
};
