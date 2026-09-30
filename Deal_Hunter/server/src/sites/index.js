const path = require('node:path');
const { readAllDocxFiles, findSitesDir } = require('./docxReader');
const { parseStoreDocx, SITE_RULES } = require('./siteDocxParser');

/**
 * Carrega dinamicamente todas as lojas e regras contidas na pasta "sites/".
 */
function loadDynamicSites(customDir) {
  const { sitesDir, files } = readAllDocxFiles(customDir);
  const stores = [];
  let totalCategories = 0;
  let totalProducts = 0;

  for (const docxData of files) {
    const storeSpec = parseStoreDocx(docxData);
    stores.push(storeSpec);
    totalCategories += storeSpec.totalCategories;
    totalProducts += storeSpec.totalSampleProducts;
  }

  return {
    sitesDir,
    stores,
    totalStores: stores.length,
    totalCategories,
    totalProducts,
  };
}

/**
 * Converte as lojas carregadas dinamicamente para o formato compatível com STORES do catálogo.
 */
function getDynamicCatalogStores(customDir) {
  const { stores } = loadDynamicSites(customDir);
  return stores.map((store) => ({
    id: store.siteId,
    domain: store.domain,
    name: store.name,
    url: store.baseUrl,
    categories: store.categories,
    loadedFrom: `docx:${store.filename}`,
    requiresLogin: store.requiresLogin,
    loginUrl: store.loginUrl,
    notes: store.notes,
  }));
}

/**
 * Imprime no console a confirmação do mapeamento e tabelas limpas de produtos.
 */
function runCliInspection() {
  console.log('========================================================================');
  console.log('🔍 MÓDULO DE SCRAPING MULTI-SITE — LEITURA DINÂMICA DA PASTA "sites/"');
  console.log('========================================================================\n');

  const result = loadDynamicSites();
  if (!result.sitesDir || result.stores.length === 0) {
    console.error('❌ Nenhuma pasta "sites/" com arquivos .docx foi localizada.');
    return;
  }

  console.log(`📁 Diretório detectado: ${result.sitesDir}`);
  console.log(`🏬 Total de lojas mapeadas: ${result.totalStores}`);
  console.log(`📂 Total de categorias com filtros: ${result.totalCategories}`);
  console.log(`📦 Total de produtos limpos extraídos: ${result.totalProducts}\n`);

  for (const store of result.stores) {
    console.log('------------------------------------------------------------------------');
    console.log(`🏬 LOJA: ${store.name.toUpperCase()} (${store.filename})`);
    console.log(`🌐 Domínio: ${store.domain} | URL Base: ${store.baseUrl}`);
    console.log(`🎯 Padrão de URL de Produto: ${store.productPattern}`);
    console.log(`🛡️ Regra de Exclusão de Lixo: Ativa`);
    console.log(`🔐 Requer Login Prévio: ${store.requiresLogin ? `SIM (${store.loginUrl || 'Página de login'})` : 'NÃO'}`);
    console.log(`📌 Observações: ${store.notes}`);
    console.log(`📂 Categorias mapeadas na fila: ${store.totalCategories}`);
    console.log(`📦 Produtos de amostra extraídos: ${store.totalSampleProducts}`);

    if (store.categories.length > 0) {
      console.log('\n  [Top 3 Categorias Mapeadas]:');
      for (const [id, catName, catUrl] of store.categories.slice(0, 3)) {
        console.log(`    • ${catName}: ${catUrl}`);
      }
    }

    if (store.sampleProducts.length > 0) {
      console.log('\n  [Tabela Limpa de Produtos Encontrados (Top 5)]:');
      console.log('  | Produto | URL Absoluta | Preço Original | Preço Promocional | Desconto |');
      console.log('  |---|---|---|---|---|');
      for (const p of store.sampleProducts.slice(0, 5)) {
        console.log(`  | ${p.name.slice(0, 45)}... | ${p.url.slice(0, 50)}... | ${p.originalPrice} | ${p.promotionalPrice} | ${p.discount} |`);
      }
    }
    console.log('\n');
  }
}

if (require.main === module) {
  runCliInspection();
}

module.exports = {
  loadDynamicSites,
  getDynamicCatalogStores,
  runCliInspection,
  SITE_RULES,
};
