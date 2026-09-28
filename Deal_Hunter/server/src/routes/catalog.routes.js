const express = require('express');
const { db } = require('../database/db');
const { scheduleFromSettings } = require('../monitors/scheduler');

const router = express.Router();
const listCategories = db.prepare(`
  SELECT categories.id, categories.name, categories.url, categories.selected,
         sites.id AS siteId, sites.name AS siteName, sites.domain AS domain
  FROM monitored_categories AS categories
  JOIN sites ON sites.id = categories.site_id
  ORDER BY sites.name, categories.name
`);
const getCategories = db.prepare('SELECT id FROM monitored_categories');
const unselectAll = db.prepare('UPDATE monitored_categories SET selected = 0');
const selectOne = db.prepare('UPDATE monitored_categories SET selected = 1 WHERE id = ?');

router.get('/categories', (req, res) => {
  res.json(listCategories.all());
});

router.put('/categories', (req, res) => {
  const selectedIds = req.body?.selectedIds;
  if (!Array.isArray(selectedIds) || selectedIds.some((id) => typeof id !== 'string')) {
    return res.status(400).json({ error: 'Envie selectedIds como uma lista de categorias.' });
  }
  const uniqueIds = [...new Set(selectedIds)];
  const knownIds = new Set(getCategories.all().map((row) => row.id));
  const unknownIds = uniqueIds.filter((id) => !knownIds.has(id));
  if (unknownIds.length) return res.status(400).json({ error: `Categoria desconhecida: ${unknownIds.join(', ')}` });

  db.exec('BEGIN IMMEDIATE');
  try {
    unselectAll.run();
    for (const id of uniqueIds) selectOne.run(id);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  scheduleFromSettings();
  res.json({ ok: true, selectedIds: uniqueIds });
});

module.exports = router;
