const { db } = require('./db');

const getStmt = db.prepare('SELECT value FROM settings WHERE key = ?');
const setStmt = db.prepare(
  'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
);
const deleteStmt = db.prepare('DELETE FROM settings WHERE key = ?');

function get(key, fallback = null) {
  const row = getStmt.get(key);
  return row ? row.value : fallback;
}

function getJSON(key, fallback = null) {
  const raw = get(key, null);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function set(key, value) {
  setStmt.run(key, value);
}

function setJSON(key, value) {
  set(key, JSON.stringify(value));
}

function remove(key) {
  deleteStmt.run(key);
}

module.exports = { get, getJSON, set, setJSON, remove };
