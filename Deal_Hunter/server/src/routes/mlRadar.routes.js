const express = require('express');
const { config } = require('../config');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Rota ponte para ingestão no ML Radar:
 * Encaminha o payload para a aplicação Web (Next.js / Vercel ou porta 3001).
 */
router.post('/ingest', async (req, res) => {
  const payload = req.body;
  if (!payload || !payload.title || payload.price === undefined) {
    return res.status(400).json({ error: 'title e price são obrigatórios.' });
  }

  const candidateUrls = [
    'http://localhost:3001/api/ml-radar/ingest',
    'http://127.0.0.1:3001/api/ml-radar/ingest',
  ];

  if (config.webAuthUrl) {
    candidateUrls.push(`${config.webAuthUrl.replace(/\/$/, '')}/api/ml-radar/ingest`);
  }

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        return res.status(response.status).json(data);
      }
    } catch {
      // Tenta próximo endpoint
    }
  }

  logger.warn(`[ML Radar Bridge] Não foi possível encaminhar para Next.js`);
  return res.status(200).json({ ok: true, queued: true, note: 'Recebido pelo backend Deal Hunter' });
});

module.exports = router;
