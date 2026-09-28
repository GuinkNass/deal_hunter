const express = require('express');
const { db } = require('../database/db');
const { processProduct, processCoupons } = require('../monitors/checker');
const { extractCandidateCoupons } = require('../analyzers/coupon');

const router = express.Router();

const getSiteByDomain = db.prepare('SELECT * FROM sites WHERE domain = ?');

/**
 * O content script chama esta rota quando o usuário navega numa página de
 * um site monitorado. Complementa a verificação periódica server-side,
 * que não executa JavaScript e por isso pode não enxergar preços de
 * sites SPA (Shopee, AliExpress etc.).
 */
router.post('/', async (req, res) => {
  const { domain, url, name, price, currency, imageUrl, pageText } = req.body || {};
  if (!domain || !url) return res.status(400).json({ error: 'domain e url são obrigatórios.' });

  const site = getSiteByDomain.get(domain);
  if (!site || !site.active) {
    return res.status(200).json({ ignored: true, reason: 'Site não monitorado ou pausado.' });
  }

  let alertsSent = 0;

  if (typeof price === 'number' && price > 0 && (site.monitor_prices || site.monitor_anomalies)) {
    const result = await processProduct(site, { name, url, price, currency, imageUrl });
    alertsSent += result.alertsSent;
  }

  if (site.monitor_coupons && pageText) {
    const candidates = extractCandidateCoupons(String(pageText).slice(0, 50000));
    if (candidates.length) {
      const result = await processCoupons(site, candidates, url);
      alertsSent += result.alertsSent;
    }
  }

  res.json({ ok: true, alertsSent });
});

module.exports = router;
