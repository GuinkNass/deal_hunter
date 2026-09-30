const express = require('express');
const { db } = require('../database/db');
const telegramClient = require('../telegram/telegramClient');
const logger = require('../utils/logger');

const router = express.Router();

const counts = {
  products: db.prepare('SELECT COUNT(*) AS c FROM products'),
  opportunities: db.prepare('SELECT COUNT(*) AS c FROM alerts'),
  selectedCategories: db.prepare('SELECT COUNT(*) AS c FROM monitored_categories WHERE selected = 1'),
  lastRun: db.prepare('SELECT * FROM scan_runs ORDER BY finished_at DESC LIMIT 1'),
};

router.get('/ping', (req, res) => res.json({ ok: true }));

router.get('/', async (req, res) => {
  try {
    const telegram = telegramClient.getConfig();
    const lastRun = await counts.lastRun.get();
    const selectedRow = await counts.selectedCategories.get();
    const prodRow = await counts.products.get();
    const oppRow = await counts.opportunities.get();

    const selectedCategories = Number(selectedRow?.c || 0);

    res.json({
      active: true,
      authenticated: Boolean(req.isAuthenticated),
      user: req.user ? { email: req.user.email, sub: req.user.sub } : null,
      telegramConnected: telegram.configured,
      scanConfigured: selectedCategories > 0,
      selectedCategories,
      productsTracked: Number(prodRow?.c || 0),
      opportunitiesFound: Number(oppRow?.c || 0),
      lastScan: lastRun ? {
        status: lastRun.status,
        itemsScanned: lastRun.items_scanned,
        alertsSent: lastRun.alerts_sent,
        finishedAt: lastRun.finished_at,
      } : null,
    });
  } catch (err) {
    logger.error(`Erro ao carregar status: ${err.message}`);
    res.status(500).json({ error: 'Erro ao obter status do sistema.' });
  }
});

router.get('/logs', (req, res) => {
  const limit = Number(req.query.limit) || 100;
  res.json(logger.getRecent(limit));
});

module.exports = router;
