const express = require('express');
const router = express.Router();
const { db } = require('../db/db');
const { calculateROI } = require('../services/roiService');

/**
 * POST /api/calculator/calculate
 * Computes ROI and margin in real time from parameters
 */
router.post('/calculate', (req, res) => {
  try {
    const result = calculateROI(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/calculator/history
 * List saved margin calculations
 */
router.get('/history', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM margin_calculations ORDER BY created_at DESC LIMIT 50').all();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/calculator/save
 * Saves a named margin calculation
 */
router.post('/save', (req, res) => {
  try {
    const { name, analysis_id, ...calcParams } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'O nome da simulação é obrigatório' });
    }

    const calc = calculateROI(calcParams);
    const id = `calc-${Date.now()}`;

    db.prepare(`
      INSERT INTO margin_calculations (
        id, name, analysis_id, ml_price, listing_type, product_cost, tax_percent,
        free_shipping_auto, custom_shipping_enabled, shipping_cost, packaging_cost,
        ads_percent, return_percent, commission_rate, commission_value, fixed_fee,
        net_profit, margin_percent, roi_percent, break_even_price
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?
      )
    `).run(
      id,
      name,
      analysis_id || null,
      calc.salePrice,
      calc.listingType,
      calc.productCost,
      calc.taxPercent,
      calcParams.freeShippingAuto !== undefined ? (calcParams.freeShippingAuto ? 1 : 0) : 1,
      calcParams.customShippingEnabled ? 1 : 0,
      calc.shippingCost,
      calc.packagingCost,
      calc.adsPercent,
      calc.returnPercent,
      calc.commissionRate,
      calc.commissionFee,
      calc.fixedFee,
      calc.netProfit,
      calc.marginPercent,
      calc.roiPercent,
      calc.breakEvenPrice
    );

    res.json({
      success: true,
      message: 'Cálculo salvo com sucesso!',
      id,
      data: calc
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/calculator/history/:id
 */
router.delete('/history/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM margin_calculations WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Cálculo excluído com sucesso' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
