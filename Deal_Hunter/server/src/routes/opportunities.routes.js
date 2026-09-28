const express = require('express');
const { db } = require('../database/db');

const router = express.Router();

const listStmt = db.prepare(`
  SELECT alerts.*, sites.name AS site_name, products.name AS product_name, products.url AS product_url
  FROM alerts
  LEFT JOIN sites ON sites.id = alerts.site_id
  LEFT JOIN products ON products.id = alerts.product_id
  WHERE alerts.alert_type IN ('anomaly', 'price_drop', 'possible_error')
  ORDER BY sent_at DESC LIMIT 200
`);

router.get('/', (req, res) => {
  res.json(listStmt.all());
});

module.exports = router;
