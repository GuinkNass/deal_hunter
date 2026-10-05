const { db, setSetting } = require('./db');

function seedSettings() {
  const defaultSettings = [
    // 1. Mercado Livre
    { key: 'ml_client_id', value: '', isSecret: 1, category: 'mercadolivre' },
    { key: 'ml_client_secret', value: '', isSecret: 1, category: 'mercadolivre' },
    { key: 'ml_redirect_uri', value: 'http://localhost:3001/api/ml/callback', isSecret: 0, category: 'mercadolivre' },
    { key: 'ml_access_token', value: '', isSecret: 1, category: 'mercadolivre' },
    { key: 'ml_refresh_token', value: '', isSecret: 1, category: 'mercadolivre' },
    { key: 'ml_token_expires_at', value: 0, isSecret: 0, category: 'mercadolivre' },

    // 2. Telegram Entrada & Saída
    { key: 'telegram_in_mode', value: 'webhook', isSecret: 0, category: 'telegram_in' },
    { key: 'webhook_api_key', value: 'mlradar-secret-key-12345', isSecret: 1, category: 'telegram_in' },
    { key: 'telegram_api_id', value: '', isSecret: 1, category: 'telegram_in' },
    { key: 'telegram_api_hash', value: '', isSecret: 1, category: 'telegram_in' },
    { key: 'telegram_in_channel', value: '@promocoes_exemplo', isSecret: 0, category: 'telegram_in' },
    { key: 'telegram_session_string', value: '', isSecret: 1, category: 'telegram_in' },

    { key: 'telegram_bot_token', value: '', isSecret: 1, category: 'telegram_out' },
    { key: 'telegram_out_chat_id', value: '', isSecret: 0, category: 'telegram_out' },
    { key: 'telegram_notify_min_roi', value: 25, isSecret: 0, category: 'telegram_out' },

    // 3. Gemini (default model: gemini-1.5-flash / gemini-2.0-flash / gemini-2.5-flash)
    { key: 'gemini_api_key', value: '', isSecret: 1, category: 'gemini' },
    { key: 'gemini_model', value: 'gemini-1.5-flash', isSecret: 0, category: 'gemini' },
    { key: 'gemini_enabled', value: 1, isSecret: 0, category: 'gemini' },
    { key: 'gemini_max_req_per_min', value: 15, isSecret: 0, category: 'gemini' },

    // 4. Regras de Busca & Identidade
    { key: 'min_sold_quantity', value: 10, isSecret: 0, category: 'rules' },
    { key: 'min_seller_reputation', value: 'green', isSecret: 0, category: 'rules' },
    { key: 'min_identity_score', value: 70, isSecret: 0, category: 'rules' },
    { key: 'ignore_used', value: 1, isSecret: 0, category: 'rules' },

    // 5. Financeiro
    { key: 'desired_margin', value: 20, isSecret: 0, category: 'financial' },
    { key: 'min_roi_alert', value: 25, isSecret: 0, category: 'financial' },
    { key: 'tax_percent', value: 6, isSecret: 0, category: 'financial' },
    { key: 'packaging_cost', value: 3.50, isSecret: 0, category: 'financial' },
    { key: 'ads_percent', value: 0, isSecret: 0, category: 'financial' },
    { key: 'return_percent', value: 2, isSecret: 0, category: 'financial' },
    { key: 'free_shipping_threshold', value: 79.00, isSecret: 0, category: 'financial' },
    { key: 'default_shipping_cost', value: 24.90, isSecret: 0, category: 'financial' },
    { key: 'fee_classico_percent', value: 12.0, isSecret: 0, category: 'financial' },
    { key: 'fee_premium_percent', value: 17.0, isSecret: 0, category: 'financial' },
    { key: 'fixed_fee_under_79', value: 6.00, isSecret: 0, category: 'financial' },

    // 6. Filtros
    { key: 'excluded_keywords', value: 'quebrado, defeito, réplica, primeira linha, carcaça, sucata, pirata', isSecret: 0, category: 'filters' },
    { key: 'ignored_brands_stores', value: '', isSecret: 0, category: 'filters' },
    { key: 'min_price_filter', value: 15.00, isSecret: 0, category: 'filters' },
    { key: 'max_price_filter', value: 50000.00, isSecret: 0, category: 'filters' },
    { key: 'blocked_categories', value: '', isSecret: 0, category: 'filters' },

    // 7. Sistema
    { key: 'queue_concurrency', value: 2, isSecret: 0, category: 'system' },
    { key: 'ml_request_delay_ms', value: 1000, isSecret: 0, category: 'system' },
    { key: 'cache_ttl_seconds', value: 7200, isSecret: 0, category: 'system' },
    { key: 'history_retention_days', value: 60, isSecret: 0, category: 'system' },
    { key: 'demo_mode', value: 1, isSecret: 0, category: 'system' }
  ];

  for (const s of defaultSettings) {
    const existing = db.prepare('SELECT key FROM settings WHERE key = ?').get(s.key);
    if (!existing) {
      setSetting(s.key, s.value, s.isSecret, s.category);
    }
  }
}

function seedDemoAnalyses() {
  // Clear and re-populate with realistic demo analyses including Camera A28 from visual reference
  db.prepare('DELETE FROM analyses').run();

  const mockAnalyses = [
    {
      id: 'demo-camera-a28',
      source_type: 'webhook',
      store_name: 'Shopee',
      source_title: 'Câmera Segurança Ip Externa Wifi A28 App Icsee À Prova Dágua Visão Noturna HD',
      source_url: 'https://shopee.com.br/product/12984124/89124124',
      source_price: 68.00,
      source_original_price: 110.00,
      source_discount_percent: 38,
      source_image_url: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&auto=format&fit=crop&q=80',
      source_hash: 'hash_camera_a28',
      ml_item_id: 'MLB3849102481',
      ml_title: 'Câmera Segurança Ip Externa Wifi A28 App Icsee À Prova Dágua',
      ml_url: 'https://produto.mercadolivre.com.br/MLB-3849102481-camera-seguranca-ip-externa-wifi-a28-app-icsee',
      ml_price: 127.99,
      ml_image_url: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&auto=format&fit=crop&q=80',
      ml_listing_type: 'gold_special', // Clássico
      ml_free_shipping: 1,
      ml_is_full: 0,
      ml_is_flex: 1,
      ml_days_active: 396,
      ml_sold_quantity: 100000,
      ml_sold_quantity_text: '100.000',
      ml_visits: 171781,
      ml_available_quantity: 100,
      ml_category_id: 'MLB263532',
      ml_seller_id: '8912401',
      ml_seller_name: 'SAFEHAVEN',
      ml_seller_reputation_level: '5_green',
      ml_seller_positive_rate: 99.2,
      ml_seller_sales_completed: 142000,
      ml_seller_is_mercadolider: 1,
      ml_seller_location: 'São Paulo, BR-SP',
      ml_product_rating_avg: 4.8,
      ml_product_reviews_count: 8420,
      identity_score: 98,
      identity_method: 'catalog_exact',
      commission_fee: 15.36, // 12% clássico
      fixed_fee: 0,
      shipping_cost: 7.75, // Frete reduzido / Flex
      packaging_cost: 3.50,
      tax_amount: 7.68, // 6%
      extra_costs: 2.56,
      net_profit: 30.64,
      roi_percent: 45.06,
      margin_percent: 23.94,
      break_even_price: 92.40,
      min_price_for_target: 121.50,
      verdict: 'Viável',
      gemini_analysis_json: JSON.stringify({
        score: 85,
        demandTrend: 'Muito Alta e Contínua (Segurança Residencial)',
        bestSeason: 'Ano Todo, picos em Férias e Final de Ano',
        riskLevel: 'Baixo',
        alerts: [
          'São 100 unidades anunciadas, o que dá 0 dias no ritmo atual. Reponha antes de zerar. Anúncio sem estoque perde posição e leva tempo pra recuperar.',
          'O anúncio converte 7,4% das visitas em venda, acima do usual no Mercado Livre.',
          '171,8k visitas em 30 dias. O anúncio tem audiência pra sustentar volume.',
          'São pelo menos 252 vendas por dia desde que entrou no ar, algo como 7.557 por mês.',
          'O anúncio usa frete grátis, mas fica fora do filtro de Full. Simule o impacto no preço antes de ativar: as duas alavancas custam margem.'
        ],
        buyerSummary: 'Fácil instalação pelo App Icsee e ótima imagem noturna colorida. Avaliação média de 4.8 estrelas.',
        dimensions: '18cm x 15cm x 12cm, Peso: 480g',
        justification: 'Produto campeão com margem líquida acima de 23% e alta velocidade de giro no Mercado Livre.'
      }),
      telegram_sent: 1,
      status: 'completed'
    },
    {
      id: 'demo-ssd-kingston',
      source_type: 'webhook',
      store_name: 'Amazon',
      source_title: 'SSD Kingston A400 480GB SATA III 2.5 Polegadas Leitura 500MBs',
      source_url: 'https://amazon.com.br/dp/B079XC5PVV',
      source_price: 139.90,
      source_original_price: 219.90,
      source_discount_percent: 36,
      source_image_url: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&auto=format&fit=crop&q=80',
      source_hash: 'hash_demo_1_kingston480',
      ml_item_id: 'MLB3489218201',
      ml_title: 'SSD Kingston A400 480gb Sata 3 2.5 Pol 500mb/s Cor Preto',
      ml_url: 'https://produto.mercadolivre.com.br/MLB-3489218201-ssd-kingston-a400-480gb',
      ml_price: 239.90,
      ml_image_url: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&auto=format&fit=crop&q=80',
      ml_listing_type: 'gold_pro',
      ml_free_shipping: 1,
      ml_is_full: 1,
      ml_is_flex: 0,
      ml_days_active: 280,
      ml_sold_quantity: 5000,
      ml_sold_quantity_text: '+5mil vendidos',
      ml_visits: 12400,
      ml_available_quantity: 85,
      ml_category_id: 'MLB1672',
      ml_seller_id: '1298471',
      ml_seller_name: 'INFOTECH BRASIL OFICIAL',
      ml_seller_reputation_level: '5_green',
      ml_seller_positive_rate: 99.4,
      ml_seller_sales_completed: 28400,
      ml_seller_is_mercadolider: 1,
      ml_seller_location: 'São Paulo, SP',
      ml_product_rating_avg: 4.8,
      ml_product_reviews_count: 1420,
      identity_score: 96,
      identity_method: 'catalog_exact',
      commission_fee: 40.78,
      fixed_fee: 0,
      shipping_cost: 22.90,
      packaging_cost: 3.50,
      tax_amount: 14.39,
      extra_costs: 4.80,
      net_profit: 53.53,
      roi_percent: 38.26,
      margin_percent: 22.31,
      break_even_price: 186.37,
      min_price_for_target: 233.10,
      verdict: 'Viável',
      gemini_analysis_json: JSON.stringify({
        score: 92,
        demandTrend: 'Muito Alta e Contínua',
        bestSeason: 'Ano Todo, com picos em Volta às Aulas e Black Friday',
        riskLevel: 'Baixo',
        alerts: [
          'Verificar procedência para evitar réplicas comuns no mercado informal',
          'Margem sólida acima de 22% no anúncio Premium Full'
        ],
        buyerSummary: 'Rapidez extrema de boot e confiabilidade comprovada.',
        dimensions: '100mm x 69.9mm x 7mm, Peso aprox: 41g',
        justification: 'Alta rotatividade comprovada com +5000 vendas no ML, produto leve e baixo risco de devolução.'
      }),
      telegram_sent: 1,
      status: 'completed'
    },
    {
      id: 'demo-headset-redragon',
      source_type: 'telegram',
      store_name: 'KaBuM!',
      source_title: 'Headset Gamer Redragon Zeus X RGB 7.1 Som Surround USB H510-RGB',
      source_url: 'https://kabum.com.br/produto/158930/headset-zeus-x',
      source_price: 199.90,
      source_original_price: 349.90,
      source_discount_percent: 42,
      source_image_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80',
      source_hash: 'hash_demo_2_zeus_x',
      ml_item_id: 'MLB2894104921',
      ml_title: 'Headset Gamer Redragon Zeus X Rgb 7.1 Surround H510 Preto E Vermelho',
      ml_url: 'https://produto.mercadolivre.com.br/MLB-2894104921-headset-redragon-zeus-x',
      ml_price: 319.00,
      ml_image_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80',
      ml_listing_type: 'gold_pro',
      ml_free_shipping: 1,
      ml_is_full: 1,
      ml_is_flex: 1,
      ml_days_active: 145,
      ml_sold_quantity: 1800,
      ml_sold_quantity_text: '+1000 vendidos',
      ml_visits: 6800,
      ml_available_quantity: 32,
      ml_category_id: 'MLB26332',
      ml_seller_id: '994821',
      ml_seller_name: 'GAMING STORE OFICIAL',
      ml_seller_reputation_level: '5_green',
      ml_seller_positive_rate: 98.7,
      ml_seller_sales_completed: 14500,
      ml_seller_is_mercadolider: 1,
      ml_seller_location: 'Curitiba, PR',
      ml_product_rating_avg: 4.7,
      ml_product_reviews_count: 630,
      identity_score: 94,
      identity_method: 'title_image_match',
      commission_fee: 54.23,
      fixed_fee: 0,
      shipping_cost: 26.50,
      packaging_cost: 4.50,
      tax_amount: 19.14,
      extra_costs: 6.38,
      net_profit: 34.85,
      roi_percent: 17.43,
      margin_percent: 10.92,
      break_even_price: 284.15,
      min_price_for_target: 355.00,
      verdict: 'Atenção',
      gemini_analysis_json: JSON.stringify({
        score: 75,
        demandTrend: 'Alta (Gamer / Periféricos)',
        bestSeason: 'Dia das Crianças, Black Friday e Natal',
        riskLevel: 'Médio',
        alerts: [
          'ROI atual de 17.4% está abaixo da meta desejada de 25%',
          'Caixa volumosa encarece frete fora do Full'
        ],
        buyerSummary: 'Excelente áudio e microfone destacável.',
        dimensions: '22cm x 19cm x 11cm, Peso: 780g com caixa',
        justification: 'Produto muito procurado, com margem espremida se vendido no menor preço com Full.'
      }),
      telegram_sent: 1,
      status: 'completed'
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO analyses (
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
      verdict, gemini_analysis_json, telegram_sent, status
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  for (const a of mockAnalyses) {
    stmt.run(
      a.id, a.source_type, a.store_name, a.source_title, a.source_url, a.source_price,
      a.source_original_price, a.source_discount_percent, a.source_image_url, a.source_hash,
      a.ml_item_id, a.ml_title, a.ml_url, a.ml_price, a.ml_image_url, a.ml_listing_type,
      a.ml_free_shipping, a.ml_is_full, a.ml_is_flex, a.ml_days_active, a.ml_sold_quantity,
      a.ml_sold_quantity_text, a.ml_visits, a.ml_available_quantity, a.ml_category_id,
      a.ml_seller_id, a.ml_seller_name, a.ml_seller_reputation_level, a.ml_seller_positive_rate,
      a.ml_seller_sales_completed, a.ml_seller_is_mercadolider, a.ml_seller_location,
      a.ml_product_rating_avg, a.ml_product_reviews_count, a.identity_score, a.identity_method,
      a.commission_fee, a.fixed_fee, a.shipping_cost, a.packaging_cost, a.tax_amount, a.extra_costs,
      a.net_profit, a.roi_percent, a.margin_percent, a.break_even_price, a.min_price_for_target,
      a.verdict, a.gemini_analysis_json, a.telegram_sent, a.status
    );
  }
}

function seedDemoCalculations() {
  db.prepare('DELETE FROM margin_calculations').run();

  db.prepare(`
    INSERT INTO margin_calculations (
      id, name, analysis_id, ml_price, listing_type, product_cost, tax_percent,
      free_shipping_auto, custom_shipping_enabled, shipping_cost, packaging_cost,
      ads_percent, return_percent, commission_rate, commission_value, fixed_fee,
      net_profit, margin_percent, roi_percent, break_even_price
    ) VALUES (
      'calc-camera-a28', 'Câmera Segurança Ip Externa Wifi A28 App Icsee À Prova Dá', 'demo-camera-a28', 127.99, 'gold_special',
      0.0, 0.0, 1, 0, 7.75, 0.0, 0, 0.0, 12.0, 15.36, 0,
      104.88, 81.94, 0.0, 8.81
    )
  `).run();
}

function runSeed() {
  console.log('[SEED] Populando configurações padrão e dados de demonstração...');
  seedSettings();
  seedDemoAnalyses();
  seedDemoCalculations();
  console.log('[SEED] Concluído com sucesso!');
}

if (require.main === module) {
  runSeed();
}

module.exports = { runSeed, seedSettings };
