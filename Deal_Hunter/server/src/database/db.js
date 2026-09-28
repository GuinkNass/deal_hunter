const path = require('node:path');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');
const { config } = require('../config');
const logger = require('../utils/logger');
const { STORES } = require('../catalog/categories');

// Usamos o módulo nativo node:sqlite (disponível a partir do Node 22.5,
// sem flag desde o Node 22.13/23.4) em vez de better-sqlite3 — isso evita
// a necessidade de compilar um addon nativo (node-gyp/Visual Studio) na
// máquina do usuário, que é uma fonte comum de falha de instalação no Windows.

const dbPath = path.resolve(config.databasePath);
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

function initDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);

  // Bancos de versões anteriores usavam um modelo multi-site. Adicione as
  // colunas do scanner atual em vez de descartar ou substituir os dados locais.
  const migrations = {
    products: {
      site_id: 'INTEGER REFERENCES sites(id) ON DELETE CASCADE',
      name: "TEXT NOT NULL DEFAULT ''",
      ml_item_id: 'TEXT',
      title: "TEXT NOT NULL DEFAULT ''",
      thumbnail: 'TEXT',
      site_original_price: 'REAL',
      category_id: 'TEXT',
      first_seen: 'TEXT',
      last_seen: 'TEXT',
    },
    alerts: {
      site_id: 'INTEGER REFERENCES sites(id) ON DELETE CASCADE',
      discount_percent: 'INTEGER',
      sent: 'INTEGER NOT NULL DEFAULT 1',
    },
  };

  for (const [table, columns] of Object.entries(migrations)) {
    const existing = new Set(db.prepare(`PRAGMA table_info(${table})`).all().map((column) => column.name));
    for (const [column, definition] of Object.entries(columns)) {
      if (!existing.has(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  }

  // Migra campos equivalentes do esquema antigo para a interface atual.
  const productColumns = new Set(db.prepare('PRAGMA table_info(products)').all().map((column) => column.name));
  if (productColumns.has('name')) db.exec("UPDATE products SET title = name WHERE title = '' AND name IS NOT NULL");
  if (productColumns.has('image_url')) db.exec('UPDATE products SET thumbnail = image_url WHERE thumbnail IS NULL');
  if (productColumns.has('site_declared_original_price')) {
    db.exec('UPDATE products SET site_original_price = site_declared_original_price WHERE site_original_price IS NULL');
  }
  const firstSeenFallback = productColumns.has('created_at') ? 'created_at, ' : '';
  const lastSeenFallback = productColumns.has('updated_at') ? 'updated_at, ' : '';
  db.exec(`UPDATE products SET first_seen = COALESCE(first_seen, ${firstSeenFallback}datetime('now')), last_seen = COALESCE(last_seen, ${lastSeenFallback}datetime('now'))`);

  db.prepare(`INSERT OR IGNORE INTO sites (domain, name, url)
    VALUES ('mercadolivre.com.br', 'Mercado Livre', 'https://www.mercadolivre.com.br')`).run();
  const insertSite = db.prepare(`INSERT INTO sites (domain, name, url) VALUES (?, ?, ?)
    ON CONFLICT(domain) DO UPDATE SET name = excluded.name, url = excluded.url`);
  const getSiteId = db.prepare('SELECT id FROM sites WHERE domain = ?');
  const insertCategory = db.prepare(`INSERT INTO monitored_categories (id, site_id, name, url)
    VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET
    site_id = excluded.site_id, name = excluded.name, url = excluded.url`);
  const dealPagesMigrationKey = 'catalog_deal_pages_selection_v1';
  const hasMigratedDealPages = Boolean(db.prepare('SELECT key FROM settings WHERE key = ?').get(dealPagesMigrationKey));
  const getSiteIdBeforeSeed = db.prepare('SELECT id FROM sites WHERE domain = ?');
  const selectedBeforeSeed = (domain) => {
    const site = getSiteIdBeforeSeed.get(domain);
    return site ? db.prepare('SELECT COUNT(*) AS count FROM monitored_categories WHERE site_id = ? AND selected = 1').get(site.id).count > 0 : false;
  };
  const hadSelectedAmazon = selectedBeforeSeed('amazon.com.br');
  const hadSelectedEletroclub = selectedBeforeSeed('eletroclub.com.br');
  for (const store of STORES) {
    insertSite.run(store.domain, store.name, store.url);
    const site = getSiteId.get(store.domain);
    const validIds = new Set(store.categories.map(([id]) => id));

    for (const [id, name, url] of store.categories) {
      const existingByUrl = db.prepare('SELECT id, selected FROM monitored_categories WHERE site_id = ? AND url = ?').get(site.id, url);
      if (existingByUrl) {
        if (existingByUrl.id !== id) {
          // Atualiza id preservando o estado de seleção anterior
          const wasSelected = existingByUrl.selected;
          db.prepare('DELETE FROM monitored_categories WHERE id = ?').run(existingByUrl.id);
          db.prepare('INSERT INTO monitored_categories (id, site_id, name, url, selected) VALUES (?, ?, ?, ?, ?)').run(id, site.id, name, url, wasSelected);
        } else {
          db.prepare('UPDATE monitored_categories SET name = ?, url = ? WHERE id = ?').run(name, url, id);
        }
      } else {
        insertCategory.run(id, site.id, name, url);
      }
    }

    // Para Amazon e Magalu, remove categorias antigas que foram descontinuadas ou substituídas
    if (store.id !== 'eletroclub') {
      const currentSiteCats = db.prepare('SELECT id FROM monitored_categories WHERE site_id = ?').all(site.id);
      for (const cat of currentSiteCats) {
        if (!validIds.has(cat.id)) {
          db.prepare('DELETE FROM monitored_categories WHERE id = ?').run(cat.id);
        }
      }
    }
  }
  // Transfere uma única vez as seleções antigas às novas páginas solicitadas.
  // As escolhas feitas pelo usuário depois deste update continuam persistindo normalmente.
  if (!hasMigratedDealPages) {
    const amazonId = getSiteIdBeforeSeed.get('amazon.com.br')?.id;
    if (hadSelectedAmazon && amazonId) {
      db.prepare('UPDATE monitored_categories SET selected = 0 WHERE site_id = ?').run(amazonId);
      db.prepare('UPDATE monitored_categories SET selected = 1 WHERE id = ?').run('amazon-deals');
    }
    const eletroclubId = getSiteIdBeforeSeed.get('eletroclub.com.br')?.id;
    if (hadSelectedEletroclub && eletroclubId) {
      db.prepare('UPDATE monitored_categories SET selected = 0 WHERE site_id = ?').run(eletroclubId);
      db.prepare('UPDATE monitored_categories SET selected = 1 WHERE id = ?').run('eletroclub-outlet');
    }
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
      .run(dealPagesMigrationKey, '1');
  }
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_products_ml_item_id ON products(ml_item_id) WHERE ml_item_id IS NOT NULL AND ml_item_id <> \'\'');
  db.exec('CREATE INDEX IF NOT EXISTS idx_products_site_url ON products(site_id, url)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_alerts_fingerprint ON alerts(fingerprint)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)');

  logger.info(`Banco de dados pronto em ${dbPath}`);
}

module.exports = { db, initDatabase };
