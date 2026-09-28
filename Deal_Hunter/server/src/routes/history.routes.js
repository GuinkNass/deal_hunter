const express = require('express');
const { db } = require('../database/db');

const router = express.Router();

const listStmt = db.prepare(`
  SELECT alerts.id, alerts.alert_type, alerts.discount_percent, alerts.score, alerts.sent, alerts.sent_at,
         products.title AS product_title, products.url AS product_url, products.current_price,
         products.site_original_price, products.thumbnail,
         sites.name AS site_name
  FROM alerts
  JOIN products ON products.id = alerts.product_id
  LEFT JOIN sites ON sites.id = COALESCE(alerts.site_id, products.site_id)
  ORDER BY sent_at DESC
  LIMIT 500
`);

const deleteAllStmt = db.prepare('DELETE FROM alerts');

router.get('/', (req, res) => {
  const { q } = req.query;
  let rows = listStmt.all();
  if (q) {
    const needle = String(q).toLowerCase();
    rows = rows.filter((r) => (r.product_title || '').toLowerCase().includes(needle));
  }
  res.json(rows);
});

router.delete('/', (req, res) => {
  deleteAllStmt.run();
  res.status(204).end();
});

module.exports = router;
