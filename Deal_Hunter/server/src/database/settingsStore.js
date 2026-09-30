const { db } = require('./db');

const memoryCache = new Map();
let cacheLoaded = false;

async function loadSettingsCache() {
  try {
    const rows = await db.all('SELECT key, value FROM settings');
    memoryCache.clear();
    for (const row of rows) {
      if (row.key) memoryCache.set(row.key, row.value);
    }
    cacheLoaded = true;
  } catch (err) {
    console.error('Falha ao pré-carregar cache de configurações:', err.message);
  }
}

function get(key, fallback = null) {
  if (memoryCache.has(key)) {
    return memoryCache.get(key);
  }
  // Se ainda não carregou ou é SQLite, tenta leitura direta
  if (!db.isPostgres) {
    try {
      const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
      if (row && row.value !== undefined) {
        memoryCache.set(key, row.value);
        return row.value;
      }
    } catch {}
  }
  return fallback;
}

function getJSON(key, fallback = null) {
  const raw = get(key, null);
  if (raw === null || raw === undefined) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function set(key, value) {
  const strVal = String(value);
  memoryCache.set(key, strVal);
  // Persiste no banco de dados (SQLite síncrono ou PostgreSQL assíncrono em background)
  const sql = 'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value';
  Promise.resolve(db.run(sql, [key, strVal])).catch((err) => {
    console.error(`Erro ao persistir configuração '${key}':`, err.message);
  });
}

async function setAsync(key, value) {
  const strVal = String(value);
  memoryCache.set(key, strVal);
  const sql = 'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value';
  return db.run(sql, [key, strVal]);
}

function setJSON(key, value) {
  set(key, JSON.stringify(value));
}

function remove(key) {
  memoryCache.delete(key);
  const sql = 'DELETE FROM settings WHERE key = ?';
  Promise.resolve(db.run(sql, [key])).catch((err) => {
    console.error(`Erro ao remover configuração '${key}':`, err.message);
  });
}

module.exports = {
  get,
  getJSON,
  set,
  setAsync,
  setJSON,
  remove,
  loadSettingsCache,
};
