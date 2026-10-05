const express = require('express');
const { getScanConfig, runScan, processBrowserPages, cancelBrowserScan } = require('../monitors/scanner');

const router = express.Router();

router.get('/config', async (req, res) => {
  try {
    const config = await getScanConfig();
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar configurações de varredura.' });
  }
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
  const cleanPages = pages
    .filter((page) => page && typeof page.categoryId === 'string')
    .map((page) => ({
      ...page,
      html: typeof page.html === 'string' ? page.html.slice(0, 2_000_000) : '',
      products: Array.isArray(page.products)
        ? page.products.filter(
            (p) => p && typeof p === 'object' && (p.name || p.titulo) && Number(p.price || p.preco_atual) > 0
          )
        : [],
    }));

  const scanId = req.body?.scanId == null ? null : String(req.body.scanId);
  if (scanId && !/^[a-zA-Z0-9-]{8,80}$/.test(scanId)) {
    return res.status(400).json({ error: 'Identificador de varredura inválido.' });
  }
  const userId = req.user?.sub || req.user?.id || req.body?.userId || req.headers['x-user-id'] || null;
  const result = await processBrowserPages(cleanPages, scanId, req.body?.complete !== false, userId);
  res.json(result);
});

module.exports = router;
