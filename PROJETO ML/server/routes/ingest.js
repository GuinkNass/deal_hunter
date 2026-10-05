const express = require('express');
const router = express.Router();
const { getSetting } = require('../db/db');
const { enqueueDeal } = require('../services/queueService');

/**
 * POST /api/ingest
 * Webhook endpoint to receive deal alerts from external bots
 */
router.post('/', (req, res) => {
  const configuredApiKey = getSetting('webhook_api_key', '');
  const providedApiKey = req.headers['x-api-key'] || req.query.api_key;

  if (configuredApiKey && providedApiKey !== configuredApiKey) {
    return res.status(401).json({
      success: false,
      error: 'Chave de API inválida (header x-api-key incorreto)'
    });
  }

  const {
    nome, title,
    url, productUrl,
    preco, price,
    preco_anterior, original_price, originalPrice,
    desconto, discount,
    foto_url, image_url, imageUrl,
    loja, store,
    userId, user_id
  } = req.body || {};

  const dealName = title || nome;
  const dealUrl = productUrl || url;
  const dealPrice = price !== undefined ? price : preco;

  if (!dealName || !dealUrl || dealPrice === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Campos obrigatórios faltando: "title" (ou nome), "productUrl" (ou url) e "price" (ou preco)'
    });
  }

  const normalizedDeal = {
    nome: String(dealName).trim(),
    url: String(dealUrl).trim(),
    preco: Number(dealPrice),
    preco_anterior: originalPrice !== undefined ? Number(originalPrice) : (original_price !== undefined ? Number(original_price) : (preco_anterior !== undefined ? Number(preco_anterior) : null)),
    desconto: desconto !== undefined ? Number(desconto) : (discount !== undefined ? Number(discount) : null),
    foto_url: imageUrl || foto_url || image_url || '',
    loja: store || loja || 'Online',
    userId: userId || user_id || null,
    source_type: 'deal_hunter_pro'
  };

  const result = enqueueDeal(normalizedDeal);

  return res.status(result.status === 'discarded' ? 200 : 202).json({
    success: true,
    result
  });
});

module.exports = router;
