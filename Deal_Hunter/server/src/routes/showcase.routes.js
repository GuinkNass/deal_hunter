const express = require('express');
const settingsStore = require('../database/settingsStore');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/showcase
 * Retorna as ofertas ativas configuradas para a Vitrine Pública
 */
router.get('/', (req, res) => {
  try {
    const deals = settingsStore.getJSON('showcase_deals', []);
    res.json({
      success: true,
      count: Array.isArray(deals) ? deals.length : 0,
      data: Array.isArray(deals) ? deals : [],
    });
  } catch (err) {
    logger.error(`Erro ao carregar vitrine: ${err.message}`);
    res.status(500).json({ success: false, error: 'Erro ao carregar vitrine.' });
  }
});

/**
 * POST /api/showcase
 * Salva e sincroniza as ofertas selecionadas pelo Admin para a Vitrine Pública
 */
router.post('/', (req, res) => {
  try {
    const deals = Array.isArray(req.body?.deals) ? req.body.deals : [];
    settingsStore.setJSON('showcase_deals', deals);
    logger.info(`Vitrine sincronizada com sucesso no backend Render: ${deals.length} oferta(s).`);
    res.json({
      success: true,
      message: 'Vitrine salva no backend com sucesso!',
      count: deals.length,
      data: deals,
    });
  } catch (err) {
    logger.error(`Erro ao salvar vitrine: ${err.message}`);
    res.status(500).json({ success: false, error: 'Erro ao salvar vitrine.' });
  }
});

module.exports = router;
