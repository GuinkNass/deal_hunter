const crypto = require('crypto');
const { db, getSetting } = require('../db/db');
const mlApiService = require('./mlApiService');
const identityService = require('./identityService');
const sellerRankingService = require('./sellerRankingService');
const roiService = require('./roiService');
const geminiService = require('./geminiService');
const telegramBotService = require('./telegramBotService');
const scraperService = require('./scraperService');

// Internal job queue state
const jobQueue = [];
let activeWorkers = 0;
let lastMLCallTime = 0;

/**
 * Creates SHA-256 hash of URL + Price for deduplication
 */
function createDealHash(url, price) {
  const normUrl = (url || '').trim().toLowerCase().split('?')[0];
  const normPrice = Number(price || 0).toFixed(2);
  return crypto.createHash('sha256').update(`${normUrl}_${normPrice}`).digest('hex');
}

/**
 * Enqueue a new deal alert
 */
function enqueueDeal(dealData) {
  const hash = createDealHash(dealData.url, dealData.preco);

  // 1. Check if hash already exists in database
  const existing = db.prepare('SELECT id, status, created_at FROM analyses WHERE source_hash = ?').get(hash);
  if (existing) {
    console.log(`[Queue] Alerta ignorado por deduplicação: ${dealData.nome} (Hash: ${hash.substring(0, 8)})`);
    return {
      status: 'duplicate',
      id: existing.id,
      message: 'Alerta já processado anteriormente'
    };
  }

  // 2. Check exclusion filters
  const filterCheck = checkFilters(dealData);
  if (!filterCheck.allowed) {
    console.log(`[Queue] Alerta descartado por regra de filtro: ${dealData.nome} (${filterCheck.reason})`);
    // Save as discarded
    const discardId = `disc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    db.prepare(`
      INSERT OR REPLACE INTO analyses (id, source_type, store_name, source_title, source_url, source_price, source_hash, status, discard_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'discarded', ?)
    `).run(
      discardId,
      dealData.source_type || 'webhook',
      dealData.loja || dealData.store_name || 'Online',
      dealData.nome || dealData.title,
      dealData.url,
      Number(dealData.preco || 0),
      hash,
      filterCheck.reason
    );
    return {
      status: 'discarded',
      id: discardId,
      reason: filterCheck.reason
    };
  }

  // 3. Add to processing queue
  const jobId = `job-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  jobQueue.push({
    id: jobId,
    deal: dealData,
    hash,
    enqueuedAt: Date.now()
  });

  console.log(`[Queue] Alerta enfileirado para processamento: "${dealData.nome}" (ID: ${jobId})`);
  processNext();

  return {
    status: 'enqueued',
    id: jobId
  };
}

/**
 * Check inclusion / exclusion filters
 */
function checkFilters(deal) {
  const minPrice = Number(getSetting('min_price_filter', 15.0));
  const maxPrice = Number(getSetting('max_price_filter', 50000.0));
  const price = Number(deal.preco || 0);

  if (price < minPrice) return { allowed: false, reason: `Preço R$ ${price} abaixo do mínimo (R$ ${minPrice})` };
  if (price > maxPrice) return { allowed: false, reason: `Preço R$ ${price} acima do máximo (R$ ${maxPrice})` };

  const excludedStr = getSetting('excluded_keywords', '');
  if (excludedStr) {
    const keywords = excludedStr.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    const titleLower = (deal.nome || deal.title || '').toLowerCase();
    for (const kw of keywords) {
      if (titleLower.includes(kw)) {
        return { allowed: false, reason: `Contém palavra-chave excluída: "${kw}"` };
      }
    }
  }

  const ignoredStores = getSetting('ignored_brands_stores', '');
  if (ignoredStores) {
    const stores = ignoredStores.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const storeLower = (deal.loja || deal.store_name || '').toLowerCase();
    if (stores.includes(storeLower)) {
      return { allowed: false, reason: `Loja ignorada: "${deal.loja}"` };
    }
  }

  return { allowed: true };
}

/**
 * Process queue with concurrency and rate limiting
 */
async function processNext() {
  const maxConcurrency = Number(getSetting('queue_concurrency', 2));
  if (activeWorkers >= maxConcurrency || jobQueue.length === 0) {
    return;
  }

  activeWorkers++;
  const item = jobQueue.shift();

  try {
    await processDeal(item.id, item.deal, item.hash);
  } catch (err) {
    console.error(`[Queue] Erro ao processar job ${item.id}:`, err);
  } finally {
    activeWorkers--;
    // Check if more jobs waiting
    if (jobQueue.length > 0) {
      setTimeout(processNext, 50);
    }
  }
}

/**
 * Execute the full pipeline for a single deal
 */
async function processDeal(id, deal, hash) {
  console.log(`[Pipeline] Iniciando processamento de: "${deal.nome}"`);

  // Rate limit delay before Mercado Livre API calls
  const delayMs = Number(getSetting('ml_request_delay_ms', 1000));
  const timeSinceLast = Date.now() - lastMLCallTime;
  if (timeSinceLast < delayMs) {
    await new Promise(r => setTimeout(r, delayMs - timeSinceLast));
  }
  let title = deal.nome || deal.title;
  let price = Number(deal.preco);
  let photoUrl = deal.foto_url || deal.image_url || '';
  let storeName = deal.loja || deal.store_name || 'Online';

  // If URL is provided and photo is missing, extract from the page
  if (deal.url && deal.url.startsWith('http') && !photoUrl) {
    try {
      const scraped = await scraperService.extractMetadataFromUrl(deal.url);
      if (scraped?.imageUrl) photoUrl = scraped.imageUrl;
      if (scraped?.title && (!title || title.length < 5)) title = scraped.title;
      if (scraped?.store && (!storeName || storeName === 'Online' || storeName === 'Busca Manual')) storeName = scraped.store;
    } catch {}
  }

  // 1. Search Mercado Livre
  let mlCandidates = [];
  try {
    mlCandidates = await mlApiService.searchMLB(title, { 
      sourcePrice: price,
      foto_url: photoUrl,
      store: storeName
    });
  } catch (err) {
    console.error(`[Pipeline] Falha na busca ML para "${title}":`, err.message);
  }

  if (!mlCandidates || mlCandidates.length === 0) {
    console.log(`[Pipeline] Nenhum anúncio encontrado no Mercado Livre para "${title}"`);
    db.prepare(`
      INSERT OR REPLACE INTO analyses (id, source_type, store_name, source_title, source_url, source_price, source_image_url, source_hash, status, discard_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'discarded', 'Nenhum anúncio correspondente encontrado no Mercado Livre')
    `).run(
      id,
      deal.source_type || 'webhook',
      deal.loja || deal.store_name || 'Online',
      title,
      deal.url,
      price,
      deal.foto_url || deal.image_url || '',
      hash
    );
    return null;
  }

  // 2. Identity match filter
  const minIdentityScore = Number(getSetting('min_identity_score', 70));
  const scoredItems = [];

  for (const candidate of mlCandidates) {
    const match = await identityService.compareIdentity(
      { title, foto_url: deal.foto_url || deal.image_url },
      candidate,
      { useGeminiVision: true, geminiService }
    );
    if (match.score >= minIdentityScore) {
      candidate._identityScore = match.score;
      candidate._identityMethod = match.method;
      scoredItems.push(candidate);
    }
  }

  if (scoredItems.length === 0) {
    console.log(`[Pipeline] Anúncios descartados por baixa confiança de identidade (< ${minIdentityScore}%)`);
    db.prepare(`
      INSERT OR REPLACE INTO analyses (id, source_type, store_name, source_title, source_url, source_price, source_image_url, source_hash, status, discard_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'discarded', 'Confiança de identidade abaixo do mínimo')
    `).run(
      id,
      deal.source_type || 'webhook',
      deal.loja || deal.store_name || 'Online',
      title,
      deal.url,
      price,
      deal.foto_url || deal.image_url || '',
      hash
    );
    return null;
  }

  // 3. Choose Best Seller
  const bestSeller = sellerRankingService.rankSellers(scoredItems);
  if (!bestSeller) {
    console.log(`[Pipeline] Nenhum vendedor atendeu aos critérios mínimos de reputação e vendas.`);
    return null;
  }

  // 4. Calculate ROI & Financial Viability
  const roi = roiService.calculateROI({
    salePrice: bestSeller.price,
    productCost: price,
    listingType: bestSeller.listingTypeId,
    freeShipping: bestSeller.freeShipping
  });

  // 5. Enrich with Google Gemini Analysis
  const geminiData = await geminiService.analyzeProduct({
    sourceTitle: title,
    storeName: deal.loja || deal.store_name || 'Online',
    sourcePrice: price,
    mlTitle: bestSeller.title,
    mlPrice: bestSeller.price,
    mlListingType: bestSeller.listingTypeId === 'gold_pro' ? 'Premium' : 'Clássico',
    mlFreeShipping: bestSeller.freeShipping,
    mlIsFull: bestSeller.isFull,
    mlSoldQuantity: bestSeller.soldQuantity,
    mlSoldQuantityText: bestSeller.soldQuantityText,
    mlDaysActive: bestSeller.daysActive,
    mlSellerReputationLevel: bestSeller.sellerReputationLevel,
    mlSellerPositiveRate: bestSeller.sellerPositiveRate,
    netProfit: roi.netProfit,
    roiPercent: roi.roiPercent,
    marginPercent: roi.marginPercent
  });

  const finalSourceImage = photoUrl || bestSeller.thumbnail || '';
  const finalMlImage = bestSeller.thumbnail || photoUrl || '';

  // 6. Save complete analysis to Database
  const analysisRecord = {
    id,
    source_type: deal.source_type || 'webhook',
    store_name: storeName,
    source_title: title,
    source_url: deal.url,
    source_price: price,
    source_original_price: Number(deal.preco_anterior || 0),
    source_discount_percent: Number(deal.desconto || 0),
    source_image_url: finalSourceImage,
    source_hash: hash,
    
    ml_item_id: bestSeller.itemId,
    ml_title: bestSeller.title,
    ml_url: bestSeller.permalink,
    ml_price: bestSeller.price,
    ml_image_url: finalMlImage,
    ml_listing_type: bestSeller.listingTypeId,
    ml_free_shipping: bestSeller.freeShipping,
    ml_is_full: bestSeller.isFull,
    ml_is_flex: bestSeller.isFlex,
    ml_days_active: bestSeller.daysActive,
    ml_sold_quantity: bestSeller.soldQuantity,
    ml_sold_quantity_text: bestSeller.soldQuantityText,
    ml_visits: bestSeller.visits,
    ml_available_quantity: bestSeller.availableQuantity,
    ml_category_id: bestSeller.categoryId,

    ml_seller_id: bestSeller.sellerId,
    ml_seller_name: bestSeller.sellerNickname,
    ml_seller_reputation_level: bestSeller.sellerReputationLevel,
    ml_seller_positive_rate: bestSeller.sellerPositiveRate,
    ml_seller_sales_completed: bestSeller.sellerSalesCompleted,
    ml_seller_is_mercadolider: bestSeller.sellerIsMercadoLider,
    ml_seller_location: bestSeller.sellerLocation,

    ml_product_rating_avg: bestSeller.productRatingAvg,
    ml_product_reviews_count: bestSeller.productReviewsCount,

    identity_score: bestSeller._identityScore || 90,
    identity_method: bestSeller._identityMethod || 'standard',

    commission_fee: roi.commissionFee,
    fixed_fee: roi.fixedFee,
    shipping_cost: roi.shippingCost,
    packaging_cost: roi.packagingCost,
    tax_amount: roi.taxAmount,
    extra_costs: roi.extraCosts,
    net_profit: roi.netProfit,
    roi_percent: roi.roiPercent,
    margin_percent: roi.marginPercent,
    break_even_price: roi.breakEvenPrice,
    min_price_for_target: roi.minPriceForTarget,
    verdict: roi.verdict,

    gemini_analysis_json: JSON.stringify(geminiData),
    status: 'completed'
  };

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO analyses (
      id, source_type, store_name, source_title, source_url, source_price,
      source_original_price, source_discount_percent, source_image_url, source_hash,
      ml_item_id, ml_title, ml_url, ml_price, ml_image_url, ml_listing_type,
      ml_free_shipping, ml_is_full, ml_is_flex, ml_days_active, ml_sold_quantity,
      ml_sold_quantity_text, ml_visits, ml_available_quantity, ml_category_id,
      ml_seller_id, ml_seller_name, ml_seller_reputation_level, ml_seller_positive_rate,
      ml_seller_sales_completed, ml_seller_is_mercadolider, ml_seller_location,
      ml_product_rating_avg, ml_product_reviews_count, identity_score, identity_method,
      commission_fee, fixed_fee, shipping_cost, packaging_cost, tax_amount, extra_costs,
      net_profit, roi_percent, margin_percent, break_even_price, min_price_for_target,
      verdict, gemini_analysis_json, status
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  stmt.run(
    analysisRecord.id, analysisRecord.source_type, analysisRecord.store_name, analysisRecord.source_title,
    analysisRecord.source_url, analysisRecord.source_price, analysisRecord.source_original_price,
    analysisRecord.source_discount_percent, analysisRecord.source_image_url, analysisRecord.source_hash,
    analysisRecord.ml_item_id, analysisRecord.ml_title, analysisRecord.ml_url, analysisRecord.ml_price,
    analysisRecord.ml_image_url, analysisRecord.ml_listing_type, analysisRecord.ml_free_shipping,
    analysisRecord.ml_is_full, analysisRecord.ml_is_flex, analysisRecord.ml_days_active,
    analysisRecord.ml_sold_quantity, analysisRecord.ml_sold_quantity_text, analysisRecord.ml_visits,
    analysisRecord.ml_available_quantity, analysisRecord.ml_category_id, analysisRecord.ml_seller_id,
    analysisRecord.ml_seller_name, analysisRecord.ml_seller_reputation_level, analysisRecord.ml_seller_positive_rate,
    analysisRecord.ml_seller_sales_completed, analysisRecord.ml_seller_is_mercadolider, analysisRecord.ml_seller_location,
    analysisRecord.ml_product_rating_avg, analysisRecord.ml_product_reviews_count, analysisRecord.identity_score,
    analysisRecord.identity_method, analysisRecord.commission_fee, analysisRecord.fixed_fee, analysisRecord.shipping_cost,
    analysisRecord.packaging_cost, analysisRecord.tax_amount, analysisRecord.extra_costs, analysisRecord.net_profit,
    analysisRecord.roi_percent, analysisRecord.margin_percent, analysisRecord.break_even_price,
    analysisRecord.min_price_for_target, analysisRecord.verdict, analysisRecord.gemini_analysis_json,
    analysisRecord.status
  );

  console.log(`[Pipeline] Análise ${id} concluída! Veredito: ${roi.verdict} (ROI: ${roi.roiPercent}%, Lucro: R$ ${roi.netProfit})`);

  // 7. Dispatch Telegram Notification
  try {
    const notifyRes = await telegramBotService.sendDealAlert(analysisRecord);
    if (notifyRes.sent) {
      db.prepare('UPDATE analyses SET telegram_sent = 1, telegram_sent_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
    }
  } catch (tgErr) {
    console.warn('[Pipeline] Falha no disparo do Telegram:', tgErr.message);
  }

  return analysisRecord;
}

function getQueueStatus() {
  return {
    queueLength: jobQueue.length,
    activeWorkers,
    maxConcurrency: Number(getSetting('queue_concurrency', 2))
  };
}

module.exports = {
  enqueueDeal,
  processDeal,
  createDealHash,
  checkFilters,
  getQueueStatus
};
