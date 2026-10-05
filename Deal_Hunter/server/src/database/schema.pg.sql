-- Deal Hunter — Schema PostgreSQL para nuvem (Render)

CREATE TABLE IF NOT EXISTS sites (
  id SERIAL PRIMARY KEY,
  domain VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  monitor_coupons INTEGER NOT NULL DEFAULT 1,
  monitor_prices INTEGER NOT NULL DEFAULT 1,
  monitor_anomalies INTEGER NOT NULL DEFAULT 1,
  check_interval_minutes INTEGER NOT NULL DEFAULT 30,
  last_checked_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monitored_categories (
  id VARCHAR(255) PRIMARY KEY,
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  selected INTEGER NOT NULL DEFAULT 0,
  keyword_filter TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_site_url UNIQUE(site_id, url)
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  site_id INTEGER REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT,
  ml_item_id VARCHAR(255) UNIQUE,
  title TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL,
  thumbnail TEXT,
  currency VARCHAR(10) DEFAULT 'BRL',
  current_price NUMERIC(12, 2),
  site_original_price NUMERIC(12, 2),
  category_id VARCHAR(255),
  first_seen TIMESTAMP NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS price_history (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price NUMERIC(12, 2) NOT NULL,
  observed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  site_id INTEGER REFERENCES sites(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL,
  discount_percent INTEGER,
  score INTEGER,
  sent INTEGER NOT NULL DEFAULT 1,
  fingerprint VARCHAR(255) NOT NULL,
  message TEXT,
  sent_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS scan_runs (
  id SERIAL PRIMARY KEY,
  status VARCHAR(50) NOT NULL,
  items_scanned INTEGER DEFAULT 0,
  candidates_found INTEGER DEFAULT 0,
  alerts_sent INTEGER DEFAULT 0,
  message TEXT,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_site_url ON products(site_id, url);
CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_alerts_fingerprint ON alerts(fingerprint);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

-- ML Radar Deals & FIFO Retention (100 itens por usuário)
CREATE TABLE IF NOT EXISTS ml_radar_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  title TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  original_price NUMERIC(12, 2),
  image_url TEXT,
  product_url TEXT NOT NULL,
  store VARCHAR(255) NOT NULL DEFAULT 'Online',
  ml_title TEXT,
  ml_price NUMERIC(12, 2),
  ml_url TEXT,
  ml_image_url TEXT,
  net_profit NUMERIC(12, 2),
  roi_percent NUMERIC(8, 2),
  margin_percent NUMERIC(8, 2),
  verdict VARCHAR(50),
  gemini_analysis JSONB,
  status VARCHAR(50) NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ml_radar_deals_user ON ml_radar_deals(user_id);
CREATE INDEX IF NOT EXISTS idx_ml_radar_deals_created ON ml_radar_deals(created_at DESC);

