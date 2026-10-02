const express = require('express');
const { db } = require('../database/db');
const { scheduleFromSettings } = require('../monitors/scheduler');
const logger = require('../utils/logger');

const router = express.Router();

const listCategories = db.prepare(`
  SELECT categories.id, categories.name, categories.url, categories.selected, categories.keyword_filter AS "keyword_filter",
         sites.id AS "siteId", sites.name AS "siteName", sites.domain AS domain
  FROM monitored_categories AS categories
  JOIN sites ON sites.id = categories.site_id
  ORDER BY sites.name, categories.name
`);
const getCategories = db.prepare('SELECT id FROM monitored_categories');
const unselectAll = db.prepare('UPDATE monitored_categories SET selected = 0');
const selectOne = db.prepare('UPDATE monitored_categories SET selected = 1 WHERE id = ?');
const updateKeywordFilter = db.prepare('UPDATE monitored_categories SET keyword_filter = ? WHERE id = ?');

router.get('/categories', async (req, res) => {
  try {
    const rows = await listCategories.all();
    res.json(rows);
  } catch (err) {
    logger.error(`Erro ao listar categorias: ${err.message}`);
    res.status(500).json({ error: 'Erro ao listar categorias.' });
  }
});

router.put('/categories', async (req, res) => {
  const selectedIds = req.body?.selectedIds;
  const keywords = req.body?.keywords || req.body?.keywordFilters || {};
  const categoriesList = req.body?.categories;

  if (!Array.isArray(selectedIds) && !Array.isArray(categoriesList)) {
    return res.status(400).json({ error: 'Envie selectedIds como uma lista de categorias.' });
  }

  const idsToSelect = Array.isArray(selectedIds)
    ? selectedIds
    : categoriesList.filter((c) => c.selected).map((c) => c.id);

  const uniqueIds = [...new Set(idsToSelect)];

  try {
    const knownRows = await getCategories.all();
    const knownIds = new Set(knownRows.map((row) => row.id));
    const unknownIds = uniqueIds.filter((id) => !knownIds.has(id));
    if (unknownIds.length) {
      return res.status(400).json({ error: `Categoria desconhecida: ${unknownIds.join(', ')}` });
    }

    await unselectAll.run();
    for (const id of uniqueIds) {
      await selectOne.run(id);
    }

    // Atualiza keyword_filter a partir do objeto keywords ou lista de categorias
    if (typeof keywords === 'object' && keywords !== null) {
      for (const [id, kw] of Object.entries(keywords)) {
        if (knownIds.has(id)) {
          const val = typeof kw === 'string' ? kw.trim() : null;
          await updateKeywordFilter.run(val || null, id);
        }
      }
    }

    if (Array.isArray(categoriesList)) {
      for (const cat of categoriesList) {
        if (cat?.id && knownIds.has(cat.id) && typeof cat.keyword_filter !== 'undefined') {
          const val = typeof cat.keyword_filter === 'string' ? cat.keyword_filter.trim() : null;
          await updateKeywordFilter.run(val || null, cat.id);
        }
      }
    }

    scheduleFromSettings();
    res.json({ ok: true, selectedIds: uniqueIds });
  } catch (err) {
    logger.error(`Erro ao salvar categorias: ${err.message}`);
    res.status(500).json({ error: 'Erro ao salvar categorias.' });
  }
});

module.exports = router;
