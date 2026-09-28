const express = require('express');
const { db } = require('../database/db');
const { checkSite } = require('../monitors/checker');

const router = express.Router();

const stmts = {
  list: db.prepare('SELECT * FROM sites ORDER BY created_at DESC'),
  getById: db.prepare('SELECT * FROM sites WHERE id = ?'),
  getByDomain: db.prepare('SELECT * FROM sites WHERE domain = ?'),
  insert: db.prepare(`INSERT INTO sites (domain, name, url, check_interval_minutes)
    VALUES (?, ?, ?, ?)`),
  update: db.prepare(`UPDATE sites SET name = ?, active = ?,
    monitor_coupons = ?, monitor_prices = ?,
    monitor_anomalies = ?, check_interval_minutes = ?,
    updated_at = datetime('now') WHERE id = ?`),
  delete: db.prepare('DELETE FROM sites WHERE id = ?'),
  setActive: db.prepare("UPDATE sites SET active = ?, updated_at = datetime('now') WHERE id = ?"),
};

function normalizeDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

router.get('/', (req, res) => {
  res.json(stmts.list.all());
});

router.post('/', (req, res) => {
  const { url, name, checkIntervalMinutes } = req.body || {};
  if (!url) return res.status(400).json({ error: 'Campo "url" é obrigatório.' });

  const domain = normalizeDomain(url);
  if (!domain) return res.status(400).json({ error: 'URL inválida.' });

  const existing = stmts.getByDomain.get(domain);
  if (existing) return res.status(409).json({ error: 'Este site já está sendo monitorado.', site: existing });

  const info = stmts.insert.run(domain, name || domain, url, checkIntervalMinutes || 30);
  const site = stmts.getById.get(info.lastInsertRowid);
  res.status(201).json(site);
});

router.get('/:id', (req, res) => {
  const site = stmts.getById.get(req.params.id);
  if (!site) return res.status(404).json({ error: 'Site não encontrado.' });
  res.json(site);
});

router.put('/:id', (req, res) => {
  const existing = stmts.getById.get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Site não encontrado.' });

  const body = req.body || {};
  const toBit = (v, fallback) => (v === undefined ? fallback : (v ? 1 : 0));

  stmts.update.run(
    body.name ?? existing.name,
    toBit(body.active, existing.active),
    toBit(body.monitor_coupons, existing.monitor_coupons),
    toBit(body.monitor_prices, existing.monitor_prices),
    toBit(body.monitor_anomalies, existing.monitor_anomalies),
    body.check_interval_minutes ?? existing.check_interval_minutes,
    existing.id
  );
  res.json(stmts.getById.get(existing.id));
});

router.delete('/:id', (req, res) => {
  const existing = stmts.getById.get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Site não encontrado.' });
  stmts.delete.run(existing.id);
  res.status(204).end();
});

router.post('/:id/pause', (req, res) => {
  const existing = stmts.getById.get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Site não encontrado.' });
  stmts.setActive.run(0, existing.id);
  res.json(stmts.getById.get(existing.id));
});

router.post('/:id/resume', (req, res) => {
  const existing = stmts.getById.get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Site não encontrado.' });
  stmts.setActive.run(1, existing.id);
  res.json(stmts.getById.get(existing.id));
});

router.post('/:id/check', async (req, res) => {
  const existing = stmts.getById.get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Site não encontrado.' });
  const result = await checkSite(existing.id);
  res.json(result);
});

module.exports = router;
