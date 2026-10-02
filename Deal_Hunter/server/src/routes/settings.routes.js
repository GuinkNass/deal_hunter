const express = require('express');
const settingsStore = require('../database/settingsStore');
const { scheduleFromSettings } = require('../monitors/scheduler');

const router = express.Router();

// As categorias ficam separadas em /api/catalog/categories.
const SCAN_KEYS = ['scan_pages', 'scan_interval_minutes'];

// Chaves de filtro de alerta
const ALERT_KEYS = [
  'alert_min_discount_percent',
  'alert_max_price',
  'alert_repeat_interval_hours',
];

const KNOWN_KEYS = [...SCAN_KEYS, ...ALERT_KEYS];

router.get('/', (req, res) => {
  const result = {};
  for (const key of KNOWN_KEYS) result[key] = settingsStore.get(key, null);
  res.json(result);
});

router.post('/', (req, res) => {
  const body = req.body || {};
  if ('scan_pages' in body && (!Number.isInteger(Number(body.scan_pages)) || Number(body.scan_pages) < 1 || Number(body.scan_pages) > 15)) {
    return res.status(400).json({ error: 'scan_pages deve estar entre 1 e 15.' });
  }
  if ('scan_interval_minutes' in body && ![15, 30, 60, 120].includes(Number(body.scan_interval_minutes))) {
    return res.status(400).json({ error: 'O intervalo deve ser 15, 30, 60 ou 120 minutos.' });
  }
  if ('alert_min_discount_percent' in body && (!Number.isFinite(Number(body.alert_min_discount_percent)) || Number(body.alert_min_discount_percent) < 1 || Number(body.alert_min_discount_percent) > 99)) {
    return res.status(400).json({ error: 'O desconto mínimo deve estar entre 1% e 99%.' });
  }
  if ('alert_max_price' in body && body.alert_max_price !== '' && (!Number.isFinite(Number(body.alert_max_price)) || Number(body.alert_max_price) <= 0)) {
    return res.status(400).json({ error: 'O preço máximo deve ser um valor positivo ou ficar vazio.' });
  }
  if ('alert_repeat_interval_hours' in body && (!Number.isInteger(Number(body.alert_repeat_interval_hours)) || Number(body.alert_repeat_interval_hours) < 1 || Number(body.alert_repeat_interval_hours) > 720)) {
    return res.status(400).json({ error: 'O intervalo para repetir alertas deve estar entre 1 e 720 horas.' });
  }
  let scanChanged = false;
  for (const key of KNOWN_KEYS) {
    if (key in body) {
      settingsStore.set(key, String(body[key]));
      if (SCAN_KEYS.includes(key)) scanChanged = true;
    }
  }
  if (scanChanged) scheduleFromSettings();
  res.json({ ok: true });
});

module.exports = router;
