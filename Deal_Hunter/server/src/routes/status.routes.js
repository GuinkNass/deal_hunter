const express = require('express');
const { db } = require('../database/db');
const telegramClient = require('../telegram/telegramClient');
const settingsStore = require('../database/settingsStore');
const logger = require('../utils/logger');

const router = express.Router();

const counts = {
  products: db.prepare('SELECT COUNT(*) AS c FROM products'),
  opportunities: db.prepare('SELECT COUNT(*) AS c FROM alerts'),
  selectedCategories: db.prepare('SELECT COUNT(*) AS c FROM monitored_categories WHERE selected = 1'),
  lastRun: db.prepare('SELECT * FROM scan_runs ORDER BY finished_at DESC LIMIT 1'),
};

router.get('/ping', (req, res) => res.json({ ok: true }));

router.get('/', (req, res) => {
  const telegram = telegramClient.getConfig();
  const lastRun = counts.lastRun.get();
  const selectedCategories = counts.selectedCategories.get().c;
  res.json({
    active: true,
    telegramConnected: telegram.configured,
    scanConfigured: selectedCategories > 0,
    selectedCategories,
    productsTracked: counts.products.get().c,
    opportunitiesFound: counts.opportunities.get().c,
    lastScan: lastRun ? {
      status: lastRun.status,
      itemsScanned: lastRun.items_scanned,
      alertsSent: lastRun.alerts_sent,
      finishedAt: lastRun.finished_at,
    } : null,
  });
});

router.get('/logs', (req, res) => {
  const limit = Number(req.query.limit) || 100;
  res.json(logger.getRecent(limit));
});

module.exports = router;
