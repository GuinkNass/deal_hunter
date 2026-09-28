const express = require('express');
const { db } = require('../database/db');

const router = express.Router();

const listStmt = db.prepare(`
  SELECT coupons.*, sites.name AS site_name, sites.domain AS site_domain
  FROM coupons JOIN sites ON sites.id = coupons.site_id
  ORDER BY last_seen DESC LIMIT 200
`);

router.get('/', (req, res) => {
  res.json(listStmt.all());
});

module.exports = router;
