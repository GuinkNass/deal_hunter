const express = require('express');
const { getScanConfig, runScan, processBrowserPages, cancelBrowserScan } = require('../monitors/scanner');

const router = express.Router();

router.get('/config', (req, res) => {
  res.json(getScanConfig());
});

router.post('/run', async (req, res) => {
  const result = await runScan();
  res.json(result);
});

router.post('/browser-pages/cancel', (req, res) => {
  const scanId = String(req.body?.scanId || '');
  if (!/^[a-zA-Z0-9-]{8,80}$/.test(scanId)) return res.status(400).json({ error: 'Identificador de varredura inválido.' });
  res.json(cancelBrowserScan(scanId));
});

router.post('/browser-pages', async (req, res) => {
  const pages = req.body?.pages;
  if (!Array.isArray(pages) || pages.length > 50) {
    return res.status(400).json({ error: 'Envie pages como uma lista de até 50 páginas.' });
  }
  if (pages.some((page) => typeof page?.categoryId !== 'string'
    || (page.html != null && (typeof page.html !== 'string' || page.html.length > 1_500_000))
    || (page.products != null && (!Array.isArray(page.products) || page.products.length > 500
      || page.products.some((product) => !product || typeof product !== 'object'
        || typeof product.name !== 'string' || product.name.length > 500
        || typeof product.url !== 'string' || product.url.length > 2048
        || !Number.isFinite(Number(product.price)) || Number(product.price) <= 0)))
    || (page.error != null && typeof page.error !== 'string'))) {
    return res.status(400).json({ error: 'Uma ou mais páginas têm formato inválido ou excedem o limite de 1,5 MB.' });
  }
  const scanId = req.body?.scanId == null ? null : String(req.body.scanId);
  if (scanId && !/^[a-zA-Z0-9-]{8,80}$/.test(scanId)) {
    return res.status(400).json({ error: 'Identificador de varredura inválido.' });
  }
  const result = await processBrowserPages(pages, scanId, req.body?.complete !== false);
  res.json(result);
});

module.exports = router;
