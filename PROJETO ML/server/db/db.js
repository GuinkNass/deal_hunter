const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure db directory exists
const dbDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'ml_radar.sqlite');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    is_secret INTEGER DEFAULT 0,
    category TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS analyses (
    id TEXT PRIMARY KEY,
    source_type TEXT NOT NULL, -- 'webhook', 'telegram', 'manual'
    store_name TEXT,
    source_title TEXT NOT NULL,
    source_url TEXT NOT NULL,
    source_price REAL NOT NULL,
    source_original_price REAL,
    source_discount_percent REAL,
    source_image_url TEXT,
    source_hash TEXT UNIQUE,
    
    -- Mercado Livre Data
    ml_item_id TEXT,
    ml_title TEXT,
    ml_url TEXT,
    ml_price REAL,
    ml_image_url TEXT,
    ml_listing_type TEXT, -- 'gold_special' (Clássico), 'gold_pro' (Premium)
    ml_free_shipping INTEGER DEFAULT 0,
    ml_is_full INTEGER DEFAULT 0,
    ml_is_flex INTEGER DEFAULT 0,
    ml_days_active INTEGER,
    ml_sold_quantity INTEGER,
    ml_sold_quantity_text TEXT,
    ml_visits INTEGER,
    ml_available_quantity INTEGER,
    ml_category_id TEXT,
    
    -- Seller Data
    ml_seller_id TEXT,
    ml_seller_name TEXT,
    ml_seller_reputation_level TEXT,
    ml_seller_positive_rate REAL,
    ml_seller_sales_completed INTEGER,
    ml_seller_is_mercadolider INTEGER DEFAULT 0,
    ml_seller_location TEXT,
    
    -- Reviews
    ml_product_rating_avg REAL,
    ml_product_reviews_count INTEGER,
    
    -- Identity Match
    identity_score REAL,
    identity_method TEXT,
    
    -- Financials & ROI
    commission_fee REAL,
    fixed_fee REAL,
    shipping_cost REAL,
    packaging_cost REAL,
    tax_amount REAL,
    extra_costs REAL,
    net_profit REAL,
    roi_percent REAL,
    margin_percent REAL,
    break_even_price REAL,
    min_price_for_target REAL,
    verdict TEXT, -- 'Viável', 'Atenção', 'Evitar'
    
    -- Gemini Intelligence
    gemini_analysis_json TEXT,
    
    -- Telegram Out
    telegram_sent INTEGER DEFAULT 0,
    telegram_sent_at DATETIME,
    
    -- Status
    status TEXT DEFAULT 'completed',
    discard_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS margin_calculations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    analysis_id TEXT,
    ml_price REAL NOT NULL,
    listing_type TEXT NOT NULL,
    product_cost REAL NOT NULL,
    tax_percent REAL NOT NULL,
    free_shipping_auto INTEGER DEFAULT 1,
    custom_shipping_enabled INTEGER DEFAULT 0,
    shipping_cost REAL DEFAULT 0,
    packaging_cost REAL DEFAULT 0,
    ads_percent REAL DEFAULT 0,
    return_percent REAL DEFAULT 0,
    commission_rate REAL NOT NULL,
    commission_value REAL NOT NULL,
    fixed_fee REAL NOT NULL,
    net_profit REAL NOT NULL,
    margin_percent REAL NOT NULL,
    roi_percent REAL NOT NULL,
    break_even_price REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (analysis_id) REFERENCES analyses (id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS api_cache (
    cache_key TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses (created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_analyses_source_hash ON analyses (source_hash);
  CREATE INDEX IF NOT EXISTS idx_margin_created_at ON margin_calculations (created_at DESC);
`);

// Settings helpers
function getSetting(key, defaultValue = null) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  if (!row) return defaultValue;
  try {
    return JSON.parse(row.value);
  } catch {
    return row.value;
  }
}

function getAllSettings(maskSecrets = true) {
  const rows = db.prepare('SELECT * FROM settings').all();
  const result = {};
  for (const row of rows) {
    let val;
    try {
      val = JSON.parse(row.value);
    } catch {
      val = row.value;
    }

    if (maskSecrets && row.is_secret && typeof val === 'string' && val.length > 0) {
      if (val.length <= 8) {
        val = '********';
      } else {
        val = val.substring(0, 4) + '****' + val.substring(val.length - 4);
      }
    }

    result[row.key] = {
      value: val,
      isSecret: !!row.is_secret,
      category: row.category,
      updatedAt: row.updated_at
    };
  }
  return result;
}

function setSetting(key, value, isSecret = 0, category = 'system') {
  const valString = typeof value === 'object' ? JSON.stringify(value) : String(value);
  db.prepare(`
    INSERT INTO settings (key, value, is_secret, category, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      is_secret = excluded.is_secret,
      category = excluded.category,
      updated_at = CURRENT_TIMESTAMP
  `).run(key, valString, isSecret ? 1 : 0, category);
}

function setMultipleSettings(settingsMap) {
  const stmt = db.prepare(`
    INSERT INTO settings (key, value, is_secret, category, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      is_secret = excluded.is_secret,
      category = excluded.category,
      updated_at = CURRENT_TIMESTAMP
  `);

  const tx = db.transaction((items) => {
    for (const [key, obj] of Object.entries(items)) {
      // If masked value passed back, skip updating if secret
      if (obj.isSecret && typeof obj.value === 'string' && obj.value.includes('****')) {
        continue;
      }
      const valString = typeof obj.value === 'object' ? JSON.stringify(obj.value) : String(obj.value ?? '');
      stmt.run(key, valString, obj.isSecret ? 1 : 0, obj.category || 'system');
    }
  });

  tx(settingsMap);
}

// Cache helpers
function getCache(key) {
  const now = Math.floor(Date.now() / 1000);
  const row = db.prepare('SELECT data, expires_at FROM api_cache WHERE cache_key = ?').get(key);
  if (!row) return null;
  if (row.expires_at < now) {
    db.prepare('DELETE FROM api_cache WHERE cache_key = ?').run(key);
    return null;
  }
  try {
    return JSON.parse(row.data);
  } catch {
    return null;
  }
}

function setCache(key, data, ttlSeconds = 3600) {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const dataString = JSON.stringify(data);
  db.prepare(`
    INSERT INTO api_cache (cache_key, data, expires_at)
    VALUES (?, ?, ?)
    ON CONFLICT(cache_key) DO UPDATE SET
      data = excluded.data,
      expires_at = excluded.expires_at
  `).run(key, dataString, expiresAt);
}

function clearExpiredCache() {
  const now = Math.floor(Date.now() / 1000);
  db.prepare('DELETE FROM api_cache WHERE expires_at < ?').run(now);
}

module.exports = {
  db,
  getSetting,
  getAllSettings,
  setSetting,
  setMultipleSettings,
  getCache,
  setCache,
  clearExpiredCache
};
