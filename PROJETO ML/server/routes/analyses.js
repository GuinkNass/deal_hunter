const express = require('express');
const router = express.Router();
const { db } = require('../db/db');
const { processDeal, createDealHash } = require('../services/queueService');

/**
 * GET /api/analyses
 * Lists analyses with filtering, pagination and sorting
 */
router.get('/', (req, res) => {
  try {
    const { store, verdict, source_type, search, sort = 'newest', limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM analyses WHERE 1=1';
    const params = [];

    if (store && store !== 'all') {
      query += ' AND store_name = ?';
      params.push(store);
    }

    if (verdict && verdict !== 'all') {
      query += ' AND verdict = ?';
      params.push(verdict);
    }

    if (source_type && source_type !== 'all') {
      query += ' AND source_type = ?';
      params.push(source_type);
    }

    if (search) {
      query += ' AND (source_title LIKE ? OR ml_title LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Sort order
    if (sort === 'highest_roi') {
      query += ' ORDER BY roi_percent DESC';
    } else if (sort === 'highest_profit') {
      query += ' ORDER BY net_profit DESC';
    } else if (sort === 'oldest') {
      query += ' ORDER BY created_at ASC';
    } else {
      query += ' ORDER BY created_at DESC';
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const rows = db.prepare(query).all(...params);

    // Parse JSON fields
    const parsedRows = rows.map(r => {
      let gemini = null;
      if (r.gemini_analysis_json) {
        try {
          gemini = JSON.parse(r.gemini_analysis_json);
        } catch {}
      }
      return {
        ...r,
        gemini_analysis: gemini
      };
    });

    // Get count for pagination
    let countQuery = 'SELECT count(*) as total FROM analyses WHERE 1=1';
    const countParams = [];
    if (store && store !== 'all') {
      countQuery += ' AND store_name = ?';
      countParams.push(store);
    }
    if (verdict && verdict !== 'all') {
      countQuery += ' AND verdict = ?';
      countParams.push(verdict);
    }
    if (source_type && source_type !== 'all') {
      countQuery += ' AND source_type = ?';
      countParams.push(source_type);
    }
    if (search) {
      countQuery += ' AND (source_title LIKE ? OR ml_title LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const total = db.prepare(countQuery).get(...countParams)?.total || 0;

    // Distinct stores for filter dropdown
    const stores = db.prepare('SELECT DISTINCT store_name FROM analyses WHERE store_name IS NOT NULL').all().map(s => s.store_name);

    res.json({
      success: true,
      data: parsedRows,
      total,
      stores
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/analyses/:id
 * Get single analysis detail
 */
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM analyses WHERE id = ?').get(req.params.id);
    if (!row) {
      return res.status(404).json({ success: false, error: 'Análise não encontrada' });
    }

    let gemini = null;
    if (row.gemini_analysis_json) {
      try {
        gemini = JSON.parse(row.gemini_analysis_json);
      } catch {}
    }

    res.json({
      success: true,
      data: {
        ...row,
        gemini_analysis: gemini
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/analyses/preview-url
 * Fast preview of e-commerce metadata (title, image, price, store)
 */
router.post('/preview-url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !url.startsWith('http')) {
      return res.status(400).json({ success: false, error: 'URL inválida' });
    }
    const scraperService = require('../services/scraperService');
    const data = await scraperService.extractMetadataFromUrl(url);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/analyses/manual
 * Run immediate manual search and analysis for a URL or product name
 */
router.post('/manual', async (req, res) => {
  try {
    let { title, url, price, store, foto_url, image_url } = req.body;
    let photo = foto_url || image_url || '';

    // If URL is provided, enrich metadata first if anything is missing
    if (url && url.startsWith('http')) {
      try {
        const scraperService = require('../services/scraperService');
        const scraped = await scraperService.extractMetadataFromUrl(url);
        if (scraped) {
          if (!title || title.trim().length === 0) title = scraped.title;
          if ((price === undefined || price === null || price === '') && scraped.price) price = scraped.price;
          if (!photo && scraped.imageUrl) photo = scraped.imageUrl;
          if ((!store || store === 'Online' || store === 'Busca Manual') && scraped.store) store = scraped.store;
        }
      } catch (err) {
        console.warn('[Manual Search] Scraper warning:', err.message);
      }
    }

    if (!title || price === undefined || price === null || isNaN(Number(price))) {
      return res.status(400).json({
        success: false,
        error: 'É obrigatório informar o nome do produto (ou uma URL válida) e o preço de compra.'
      });
    }

    const dummyUrl = url || `https://busca-manual.local/item?q=${encodeURIComponent(title)}`;
    const deal = {
      nome: title,
      title: title,
      url: dummyUrl,
      preco: Number(price),
      foto_url: photo,
      loja: store || 'Busca Manual',
      source_type: 'manual'
    };

    const id = `manual-${Date.now()}`;
    const hash = createDealHash(dummyUrl, price);

    // Delete prior analysis with this hash if retrying so it updates cleanly
    try {
      db.prepare('DELETE FROM analyses WHERE source_hash = ?').run(hash);
    } catch {}

    const result = await processDeal(id, deal, hash);
    if (!result) {
      const disc = db.prepare('SELECT discard_reason FROM analyses WHERE id = ?').get(id);
      return res.status(400).json({
        success: false,
        error: disc?.discard_reason || 'Não foi possível encontrar um anúncio correspondente no Mercado Livre para este item.'
      });
    }

    let gemini = null;
    if (result.gemini_analysis_json) {
      try {
        gemini = JSON.parse(result.gemini_analysis_json);
      } catch {}
    }

    res.json({
      success: true,
      data: {
        ...result,
        gemini_analysis: gemini
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/analyses/:id
 */
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM analyses WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Análise removida com sucesso' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/analyses/export/csv
 * Export analyses history as CSV
 */
router.get('/export/csv', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM analyses ORDER BY created_at DESC').all();
    
    const headers = [
      'ID', 'Data', 'Tipo', 'Loja', 'Produto Origem', 'Preço Origem', 'Anúncio ML',
      'Preço ML', 'Modalidade', 'Vendas Totais', 'Vendedor', 'Reputação',
      'Lucro Líquido', 'ROI %', 'Margem %', 'Veredito', 'Status'
    ];

    const escapeCsv = (str) => `"${String(str || '').replace(/"/g, '""')}"`;

    const csvLines = [headers.join(';')];
    for (const r of rows) {
      csvLines.push([
        escapeCsv(r.id),
        escapeCsv(r.created_at),
        escapeCsv(r.source_type),
        escapeCsv(r.store_name),
        escapeCsv(r.source_title),
        r.source_price ? r.source_price.toFixed(2) : '0.00',
        escapeCsv(r.ml_title),
        r.ml_price ? r.ml_price.toFixed(2) : '0.00',
        escapeCsv(r.ml_listing_type),
        escapeCsv(r.ml_sold_quantity_text || r.ml_sold_quantity),
        escapeCsv(r.ml_seller_name),
        escapeCsv(r.ml_seller_reputation_level),
        r.net_profit ? r.net_profit.toFixed(2) : '0.00',
        r.roi_percent ? r.roi_percent.toFixed(2) : '0.00',
        r.margin_percent ? r.margin_percent.toFixed(2) : '0.00',
        escapeCsv(r.verdict),
        escapeCsv(r.status)
      ].join(';'));
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="ml_radar_analises.csv"');
    res.send('\uFEFF' + csvLines.join('\r\n')); // UTF-8 BOM for Excel
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
