const path = require('node:path');
const fs = require('node:fs');
const { config } = require('../config');
const logger = require('../utils/logger');
const { STORES } = require('../catalog/categories');

let isPostgres = Boolean(config.databaseUrl);
let pgPool = null;
let sqliteDb = null;

if (isPostgres) {
  const { Pool } = require('pg');
  const isRender = Boolean(
    process.env.RENDER ||
    process.env.RENDER_SERVICE_ID ||
    config.databaseUrl.includes('render.com') ||
    config.databaseUrl.includes('dpg-') ||
    config.databaseUrl.includes('.onrender.')
  );
  const needsSsl = isRender ||
    process.env.NODE_ENV === 'production' ||
    process.env.DATABASE_SSL === 'true';

  pgPool = new Pool({
    connectionString: config.databaseUrl,
    ssl: needsSsl ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pgPool.on('error', (err) => {
    logger.error(`Erro inesperado no pool PostgreSQL: ${err.message}`);
  });
} else {
  const { DatabaseSync } = require('node:sqlite');
  const dbPath = path.resolve(config.databasePath);
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  sqliteDb = new DatabaseSync(dbPath);
  sqliteDb.exec('PRAGMA journal_mode = WAL');
  sqliteDb.exec('PRAGMA foreign_keys = ON');
  try {
    const tableInfo = sqliteDb.prepare("PRAGMA table_info(products)").all();
    if (tableInfo.length > 0 && !tableInfo.some((c) => c.name === 'image_url')) {
      sqliteDb.exec('ALTER TABLE products ADD COLUMN image_url TEXT');
    }
    const alertInfo = sqliteDb.prepare("PRAGMA table_info(alerts)").all();
    if (alertInfo.length > 0 && !alertInfo.some((c) => c.name === 'coupon_id')) {
      sqliteDb.exec('ALTER TABLE alerts ADD COLUMN coupon_id INTEGER');
    }
  } catch {}
}

function adaptSqlForPostgres(sql) {
  let adapted = sql;

  // Substitui datetime('now') por NOW()
  adapted = adapted.replace(/datetime\('now'\)/gi, 'NOW()');

  // Substitui INSERT OR IGNORE INTO sites ... por ON CONFLICT DO NOTHING
  if (/INSERT\s+OR\s+IGNORE\s+INTO\s+sites/i.test(adapted)) {
    adapted = adapted.replace(/INSERT\s+OR\s+IGNORE\s+INTO\s+sites/i, 'INSERT INTO sites');
    if (!/ON\s+CONFLICT/i.test(adapted)) {
      adapted += ' ON CONFLICT (domain) DO NOTHING';
    }
  }

  // Converte placeholders "?" para "$1, $2, $3..."
  let paramIndex = 1;
  adapted = adapted.replace(/\?/g, () => `$${paramIndex++}`);

  return adapted;
}

const db = {
  isPostgres,

  async query(sql, params = []) {
    if (isPostgres) {
      const pgSql = adaptSqlForPostgres(sql);
      const res = await pgPool.query(pgSql, params);
      return res;
    }
    const stmt = sqliteDb.prepare(sql);
    if (/^\s*(SELECT|PRAGMA)/i.test(sql)) {
      return { rows: stmt.all(...params) };
    }
    const info = stmt.run(...params);
    return { rows: [], rowCount: info.changes, lastInsertRowid: info.lastInsertRowid };
  },

  async all(sql, params = []) {
    if (isPostgres) {
      const res = await this.query(sql, params);
      return res.rows;
    }
    return sqliteDb.prepare(sql).all(...params);
  },

  async get(sql, params = []) {
    if (isPostgres) {
      const res = await this.query(sql, params);
      return res.rows[0] || null;
    }
    return sqliteDb.prepare(sql).get(...params) || null;
  },

  async run(sql, params = []) {
    if (isPostgres) {
      const res = await this.query(sql, params);
      return { changes: res.rowCount, lastInsertRowid: res.rows?.[0]?.id };
    }
    return sqliteDb.prepare(sql).run(...params);
  },

  async exec(sql) {
    if (isPostgres) {
      return pgPool.query(sql);
    }
    return sqliteDb.exec(sql);
  },

  prepare(sql) {
    if (isPostgres) {
      return {
        async all(...params) {
          const pgSql = adaptSqlForPostgres(sql);
          const res = await pgPool.query(pgSql, params);
          return res.rows;
        },
        async get(...params) {
          const pgSql = adaptSqlForPostgres(sql);
          const res = await pgPool.query(pgSql, params);
          return res.rows[0] || null;
        },
        async run(...params) {
          const pgSql = adaptSqlForPostgres(sql);
          const res = await pgPool.query(pgSql, params);
          return { changes: res.rowCount, lastInsertRowid: res.rows?.[0]?.id };
        },
      };
    }

    const stmt = sqliteDb.prepare(sql);
    return {
      all(...params) {
        return stmt.all(...params);
      },
      get(...params) {
        return stmt.get(...params);
      },
      run(...params) {
        return stmt.run(...params);
      },
    };
  },
};

async function initPostgresDatabase() {
  const schemaPath = path.join(__dirname, 'schema.pg.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  // 1. Retry loop de conexão inicial (até 5 tentativas)
  let connected = false;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await pgPool.query('SELECT 1');
      connected = true;
      break;
    } catch (connErr) {
      logger.warn(`Tentativa ${attempt}/5 de conectar ao PostgreSQL no Render falhou: ${connErr.message}. Aguardando 2s...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  if (!connected) {
    logger.error('Não foi possível estabelecer conexão inicial com o PostgreSQL no Render após 5 tentativas.');
    throw new Error('Falha de conexão com PostgreSQL');
  }

  await pgPool.query(schema);

  // 2. Garante que keyword_filter existe e remove constraints que possam causar conflito
  try {
    await pgPool.query('ALTER TABLE monitored_categories ADD COLUMN IF NOT EXISTS keyword_filter TEXT');
  } catch {}
  try {
    await pgPool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT');
  } catch {}
  try {
    await pgPool.query('ALTER TABLE monitored_categories DROP CONSTRAINT IF EXISTS uq_site_url');
  } catch {}

  // 3. Sincroniza sites e categorias de forma segura
  for (const store of STORES) {
    try {
      await pgPool.query(
        `INSERT INTO sites (domain, name, url) VALUES ($1, $2, $3)
         ON CONFLICT (domain) DO UPDATE SET name = EXCLUDED.name, url = EXCLUDED.url`,
        [store.domain, store.name, store.url]
      );
    } catch (e) {
      logger.warn(`Aviso ao atualizar site ${store.domain}: ${e.message}`);
    }

    let siteId = null;
    try {
      const siteRes = await pgPool.query('SELECT id FROM sites WHERE domain = $1', [store.domain]);
      siteId = siteRes.rows[0]?.id;
    } catch {}
    if (!siteId) continue;

    for (const [id, name, url] of store.categories) {
      try {
        await pgPool.query(
          `INSERT INTO monitored_categories (id, site_id, name, url)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO UPDATE SET site_id = EXCLUDED.site_id, name = EXCLUDED.name, url = EXCLUDED.url`,
          [id, siteId, name, url]
        );
      } catch (catErr) {
        try {
          await pgPool.query(
            `UPDATE monitored_categories SET id = $1, name = $2 WHERE site_id = $3 AND url = $4`,
            [id, name, siteId, url]
          );
        } catch {}
      }
    }
  }

  // 4. Categorias padrão ativas caso nenhuma esteja selecionada ainda
  try {
    const countSelected = await pgPool.query('SELECT COUNT(*) AS c FROM monitored_categories WHERE selected = 1');
    if (Number(countSelected.rows[0]?.c || 0) === 0) {
      await pgPool.query("UPDATE monitored_categories SET selected = 1 WHERE id IN ('amazon-deals', 'eletroclub-outlet', 'magalu-1')");
    }
  } catch {}

  // 5. Exclui categoria 'Access Point' e remove duplicatas de categorias por loja e URL
  try {
    await pgPool.query("DELETE FROM monitored_categories WHERE LOWER(name) LIKE '%access point%' OR id = 'pichau-56' OR url LIKE '%/access-point%'");
  } catch {}

  try {
    await pgPool.query(`
      DELETE FROM monitored_categories
      WHERE id NOT IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY site_id, url ORDER BY selected DESC, id ASC) as rn
          FROM monitored_categories
        ) t WHERE t.rn = 1
      )
    `);
  } catch {}

  logger.info('Banco de dados PostgreSQL (Render) inicializado com sucesso.');
}

function initSqliteDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  sqliteDb.exec(schema);

  const migrations = {
    products: {
      site_id: 'INTEGER REFERENCES sites(id) ON DELETE CASCADE',
      name: "TEXT NOT NULL DEFAULT ''",
      ml_item_id: 'TEXT',
      title: "TEXT NOT NULL DEFAULT ''",
      thumbnail: 'TEXT',
      image_url: 'TEXT',
      site_original_price: 'REAL',
      category_id: 'TEXT',
      first_seen: 'TEXT',
      last_seen: 'TEXT',
    },
    alerts: {
      site_id: 'INTEGER REFERENCES sites(id) ON DELETE CASCADE',
      coupon_id: 'INTEGER REFERENCES coupons(id) ON DELETE CASCADE',
      discount_percent: 'INTEGER',
      sent: 'INTEGER NOT NULL DEFAULT 1',
    },
    monitored_categories: {
      keyword_filter: 'TEXT',
    },
  };

  for (const [table, columns] of Object.entries(migrations)) {
    const existing = new Set(sqliteDb.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name));
    for (const [column, definition] of Object.entries(columns)) {
      if (!existing.has(column)) sqliteDb.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  }

  const productColumns = new Set(sqliteDb.prepare('PRAGMA table_info(products)').all().map((c) => c.name));
  if (productColumns.has('name')) sqliteDb.exec("UPDATE products SET title = name WHERE title = '' AND name IS NOT NULL");
  if (productColumns.has('image_url')) sqliteDb.exec('UPDATE products SET thumbnail = image_url WHERE thumbnail IS NULL');
  if (productColumns.has('site_declared_original_price')) {
    sqliteDb.exec('UPDATE products SET site_original_price = site_declared_original_price WHERE site_original_price IS NULL');
  }
  const firstSeenFallback = productColumns.has('created_at') ? 'created_at, ' : '';
  const lastSeenFallback = productColumns.has('updated_at') ? 'updated_at, ' : '';
  sqliteDb.exec(`UPDATE products SET first_seen = COALESCE(first_seen, ${firstSeenFallback}datetime('now')), last_seen = COALESCE(last_seen, ${lastSeenFallback}datetime('now'))`);

  sqliteDb.prepare(`INSERT OR IGNORE INTO sites (domain, name, url)
    VALUES ('mercadolivre.com.br', 'Mercado Livre', 'https://www.mercadolivre.com.br')`).run();
  const insertSite = sqliteDb.prepare(`INSERT INTO sites (domain, name, url) VALUES (?, ?, ?)
    ON CONFLICT(domain) DO UPDATE SET name = excluded.name, url = excluded.url`);
  const getSiteId = sqliteDb.prepare('SELECT id FROM sites WHERE domain = ?');
  const insertCategory = sqliteDb.prepare(`INSERT INTO monitored_categories (id, site_id, name, url)
    VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET
    site_id = excluded.site_id, name = excluded.name, url = excluded.url`);

  for (const store of STORES) {
    insertSite.run(store.domain, store.name, store.url);
    const site = getSiteId.get(store.domain);
    const validIds = new Set(store.categories.map(([id]) => id));

    for (const [id, name, url] of store.categories) {
      const existingByUrl = sqliteDb.prepare('SELECT id, selected FROM monitored_categories WHERE site_id = ? AND url = ?').get(site.id, url);
      if (existingByUrl) {
        if (existingByUrl.id !== id) {
          const wasSelected = existingByUrl.selected;
          sqliteDb.prepare('DELETE FROM monitored_categories WHERE id = ?').run(existingByUrl.id);
          sqliteDb.prepare('INSERT INTO monitored_categories (id, site_id, name, url, selected) VALUES (?, ?, ?, ?, ?)').run(id, site.id, name, url, wasSelected);
        } else {
          sqliteDb.prepare('UPDATE monitored_categories SET name = ?, url = ? WHERE id = ?').run(name, url, id);
        }
      } else {
        insertCategory.run(id, site.id, name, url);
      }
    }

    if (store.id !== 'eletroclub') {
      const currentSiteCats = sqliteDb.prepare('SELECT id FROM monitored_categories WHERE site_id = ?').all(site.id);
      for (const cat of currentSiteCats) {
        if (!validIds.has(cat.id)) {
          sqliteDb.prepare('DELETE FROM monitored_categories WHERE id = ?').run(cat.id);
        }
      }
    }
  }

  // Exclui categoria 'Access Point' e IDs órfãos
  try {
    sqliteDb.exec("DELETE FROM monitored_categories WHERE LOWER(name) LIKE '%access point%' OR id = 'pichau-56' OR url LIKE '%/access-point%'");
  } catch {}

  sqliteDb.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_products_ml_item_id ON products(ml_item_id) WHERE ml_item_id IS NOT NULL AND ml_item_id <> \'\'');
  sqliteDb.exec('CREATE INDEX IF NOT EXISTS idx_products_site_url ON products(site_id, url)');
  sqliteDb.exec('CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id)');
  sqliteDb.exec('CREATE INDEX IF NOT EXISTS idx_alerts_fingerprint ON alerts(fingerprint)');
  sqliteDb.exec('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)');

  logger.info(`Banco de dados SQLite pronto em ${path.resolve(config.databasePath)}`);
}

async function initDatabase() {
  if (isPostgres) {
    await initPostgresDatabase();
  } else {
    initSqliteDatabase();
  }
}

module.exports = { db, initDatabase, isPostgres };
