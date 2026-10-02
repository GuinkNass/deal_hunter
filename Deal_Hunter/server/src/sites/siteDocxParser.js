const { parsePrice, parseDiscount } = require('../adapters/listing.adapter');

/**
 * Mapeamento e regras específicas de cada e-commerce a partir dos Manuais de Instrução (.docx).
 */
const SITE_RULES = {
  KABUM: {
    siteId: 'kabum',
    name: 'KaBuM!',
    domain: 'kabum.com.br',
    baseUrl: 'https://www.kabum.com.br',
    productPattern: /\/produto\/\d+\/[a-z0-9-]+/i,
    junkRegex: /(?:facebook|instagram|twitter|youtube|linkedin|tiktok|politicas|privacidade|portaldeprivacidade|siteblindado|transparencyreport|ebit|confi\.com|reclameaqui|atendimento|sac\.kabum|login|carrinho|meus-pedidos)/i,
    requiresLogin: false,
    notes: 'Excluir links institucionais, políticas e redes sociais. Padrão obrigatório de produto: conter "/produto/".',
  },
  PICHAU: {
    siteId: 'pichau',
    name: 'Pichau',
    domain: 'pichau.com.br',
    baseUrl: 'https://www.pichau.com.br',
    productPattern: /^\/(?:[a-z0-9-]+-(?:pch|wh|bk|pk|argb|rgb|cooler|ventoinha|kit|memoria|ssd|placa|intel|ryzen|geforce|radeon|fan|water|headset|teclado|mouse)[a-z0-9-]*|[a-z0-9-]+-p-[a-z0-9]+|[a-z0-9-]+-480x480|[a-z0-9-]+-120mm|[a-z0-9-]+-140mm|[a-z0-9-]+-custom-[a-z0-9-]+)/i,
    junkRegex: /(?:main-content|sac\.pichau|\baccount\b|\/cart\b|\/monte-seu-pc|\/promocao|empresas\.pichau|pichauarena|\/como-comprar|\/quem-somos|\/atendimento|\/hardware\/|\/perifericos\/|\/computadores\/|\/cadeiras\/|\/notebooks\/|\/video-games\/|\/redes-wireless\/|\/casa-inteligente|\/casa-e-lazer|\/pets|\/marcas|\/energetico|\/openbox)/i,
    requiresLogin: false,
    notes: 'Excluir menus de conta, atendimento, categorias institucionais e pichauarena. Produtos possuem rotas diretas com slugs descritivos.',
  },
  RENNER: {
    siteId: 'renner',
    name: 'Lojas Renner',
    domain: 'lojasrenner.com.br',
    baseUrl: 'https://www.lojasrenner.com.br',
    productPattern: /\/p\/[a-z0-9-]+/i,
    junkRegex: /(?:realizesolucoesfinanceiras|cartoes-renner|cupom-de-desconto|ajuda|sacola|favoritos|minha-conta|atendimento|wa\.me|whatsapp|facebook|instagram|twitter|youtube|linkedin|tiktok|compre-por-categoria|menu)/i,
    requiresLogin: false,
    notes: 'Excluir links de rodapé, cartões, cupons e redes sociais. Padrão obrigatório de produto: conter "/p/".',
  },
  SHEIN: {
    siteId: 'shein',
    name: 'Shein Brasil',
    domain: 'shein.com',
    baseUrl: 'https://br.shein.com',
    productPattern: /-p-\d+\.html/i,
    junkRegex: /(?:user\/auth\/login|ipp\.shein|facebook|instagram|twitter|youtube|tiktok|whatsapp|googleplay|appstore|help|politica|privacidade|termos|carrinho|cart|wishlist)/i,
    requiresLogin: false,
    requiresSessionManagement: true,
    notes: 'Atenção anti-bot: priorizar sessões/cookies ativos para evitar bloqueios. Padrão obrigatório de produto: conter "-p-" seguido de dígitos e ".html".',
  },
  SHOPEE: {
    siteId: 'shopee',
    name: 'Shopee Brasil',
    domain: 'shopee.com.br',
    baseUrl: 'https://shopee.com.br',
    productPattern: /-i\.\d+\.\d+/i,
    junkRegex: /(?:seller\.shopee|shopee\.com\.br\/m\/|shopee\.com\.br\/list\/|all_categories|help\.shopee|cart|user\/notifications|instagram|whatsapp|tiktok|login\?|signup|\/web\/)/i,
    requiresLogin: true,
    loginUrl: 'https://shopee.com.br/buyer/login',
    notes: 'OBSERVAÇÃO OBRIGATÓRIA: Exige login prévio (mesma regra do Eletroclub) para exibir produtos completos e paginação sem restrição.',
  },
  MAGALU: {
    siteId: 'magalu',
    name: 'Magazine Luiza',
    domain: 'magazineluiza.com.br',
    baseUrl: 'https://www.magazineluiza.com.br',
    productPattern: /(?:\/p\/[a-z0-9-]+|\/produto\/|[a-z0-9-]+-p-[a-z0-9]+|\/l\/[a-z0-9-]+|Smartphone|Preço R\$|data-testid="product-card)/i,
    junkRegex: /(?:facebook|instagram|twitter|youtube|linkedin|tiktok|politicas|privacidade|portaldeprivacidade|siteblindado|atendimento|sac|login|carrinho|retire grátis na loja|meus-pedidos|quem-somos)/i,
    requiresLogin: false,
    notes: 'Proteção anti-bot (Cloudflare/Akamai). Usar rotação ou pausas. URL de produto contém /p/ ou /l/ para categoria. Preço promocional no Pix e proteção anti-parcela para evitar cálculo indevido de valor de parcela como valor final.',
  },
};

/**
 * Normaliza o valor do preço float para exibição formatada R$ X,XX
 */
function formatCurrency(val) {
  if (val == null || !Number.isFinite(val)) return 'R$ 0,00';
  return `R$ ${val.toFixed(2).replace('.', ',')}`;
}

/**
 * Extrai o percentual de desconto limpo a partir de valores ou texto
 */
function extractDiscountPercent(orig, promo, text) {
  if (orig && promo && orig > promo) {
    return `${Math.round(((orig - promo) / orig) * 100)}%`;
  }
  const match = String(text || '').match(/(?:desconto:?\s*|off\s*|[-])?(\d{1,2})%\s*(?:off|de desconto)?/i);
  if (match) {
    return `${match[1]}%`;
  }
  return '0%';
}

/**
 * Extrai categorias e URLs de monitoramento com filtros do manual .docx
 */
function extractCategories(paragraphs, rule) {
  const categories = [];
  let inCategorySection = false;
  let pendingName = '';
  const cleanDomain = rule.domain.toLowerCase().replace(/^www\./, '').split('.')[0];

  for (const text of paragraphs) {
    const lower = text.toLowerCase();
    if (lower.includes('link das principais') || lower.includes('link de cada categoria')) {
      inCategorySection = true;
      pendingName = '';
      continue;
    }
    if (inCategorySection) {
      if (lower.includes('instruções de processamento') || lower.includes('documento de entrada')) {
        inCategorySection = false;
        break;
      }

      // Procura formato: [Nome](URL) ou Nome: URL
      const markdownMatch = text.match(/(?:[•\-\*]\s*)?([^:\[]+?)\s*:\s*\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/i);
      if (markdownMatch) {
        const name = markdownMatch[1].trim();
        const url = markdownMatch[3].trim();
        const slug = `${rule.siteId}-${categories.length + 1}`;
        categories.push([slug, name, url]);
        pendingName = '';
        continue;
      }

      const standardMatch = text.match(/(?:[•\-\*]\s*)?([^:]+?)\s*:\s*(https?:\/\/[^\s]+)/i);
      if (standardMatch) {
        const name = standardMatch[1].trim();
        const url = standardMatch[2].trim();
        const slug = `${rule.siteId}-${categories.length + 1}`;
        categories.push([slug, name, url]);
        pendingName = '';
        continue;
      }

      // Link direto ou multi-linha (nome na linha anterior e URL na linha atual)
      const directUrlMatch = text.match(/(https?:\/\/[^\s\)]+)/i);
      if (directUrlMatch) {
        const url = directUrlMatch[1].trim();
        const urlLower = url.toLowerCase();
        if (urlLower.includes(cleanDomain) || urlLower.includes('magazineluiza') || urlLower.includes(rule.domain)) {
          const rawName = text.replace(url, '').replace(/[•\-\*:\(\)\[\]]/g, '').trim();
          const name = rawName || pendingName || `Categoria ${categories.length + 1}`;
          const slug = `${rule.siteId}-${categories.length + 1}`;
          categories.push([slug, name, url]);
          pendingName = '';
        }
      } else {
        const cleaned = text.replace(/[•\-\*:\(\)\[\]]/g, '').trim();
        if (cleaned && !cleaned.toLowerCase().includes('link das')) {
          pendingName = cleaned;
        }
      }
    }
  }

  // Deduplicação por URL
  const seen = new Set();
  return categories.filter(([_, __, url]) => {
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

/**
 * Extrai produtos reais a partir do bloco bruto do Data Miner no docx
 */
function extractSampleProducts(paragraphs, rule) {
  const products = [];
  const seenUrls = new Set();

  for (const line of paragraphs) {
    const lower = line.toLowerCase();
    if (lower.includes('instruções de processamento') || lower.includes('link das principais') || lower.includes('link de cada categoria')) {
      break;
    }

    // 1. Aplica regra de exclusão de lixo institucional
    if (rule.junkRegex.test(line)) {
      continue;
    }

    // 2. Valida padrão obrigatório de produto do site
    if (!rule.productPattern.test(line)) {
      continue;
    }

    let name = '';
    let url = '';
    let originalPrice = null;
    let promotionalPrice = null;
    let discount = '0%';

    if (rule.siteId === 'kabum') {
      const urlMatch = line.match(/(\/produto\/\d+\/[^\s\"\'<>]+)/i);
      if (!urlMatch) continue;
      url = `${rule.baseUrl}${urlMatch[1]}`;

      const prices = [...line.matchAll(/R\$\s*([\d.]+,\d{2})/gi)].map((m) => parsePrice(m[1])).filter(Boolean);
      if (prices.length >= 2) {
        originalPrice = prices[0];
        promotionalPrice = prices[1];
      } else if (prices.length === 1) {
        promotionalPrice = prices[0];
      }

      const discMatch = line.match(/Desconto:\s*(-?\d+%)/i) || line.match(/(\d+%\s*OFF)/i);
      discount = discMatch ? discMatch[1].replace('-', '') : extractDiscountPercent(originalPrice, promotionalPrice, line);

      let rest = line.substring(line.indexOf(urlMatch[1]) + urlMatch[1].length);
      rest = rest.replace(/[\"\ue8cc\ue4cb\ue87d\ue000-\uf8ff]/g, '');
      rest = rest.replace(/^(?:Frete grátis\*|Selo:[^\s]+|\s+)+/i, '');
      const firstR = rest.indexOf('R$');
      name = (firstR !== -1 ? rest.substring(0, firstR) : rest.substring(0, 100)).trim();
    } else if (rule.siteId === 'pichau') {
      const pichauMatch = line.match(/^\/([a-z0-9]+(?:-[a-z0-9]+)*)/i);
      if (!pichauMatch) continue;
      let rawSlug = pichauMatch[1];
      let afterSlug = line.substring(pichauMatch[0].length);

      if (afterSlug.startsWith('%OFF')) {
        const pctMatch = rawSlug.match(/(\d+)$/);
        if (pctMatch) {
          rawSlug = rawSlug.substring(0, rawSlug.length - pctMatch[1].length).replace(/-+$/, '');
        }
        afterSlug = afterSlug.replace(/^%OFF\s*/i, '');
      }
      url = `${rule.baseUrl}/${rawSlug}`;

      const deMatch = line.match(/de\s+R\$\s*([\d.]+,\d{2})/i);
      const porMatch = line.match(/por\s*R\$\s*([\d.]+,\d{2})/i) || line.match(/R\$\s*([\d.]+,\d{2})\s*À\s*vista/i);

      if (deMatch) originalPrice = parsePrice(deMatch[1]);
      if (porMatch) promotionalPrice = parsePrice(porMatch[1]);
      if (!promotionalPrice) {
        const prices = [...line.matchAll(/R\$\s*([\d.]+,\d{2})/gi)].map((m) => parsePrice(m[1])).filter(Boolean);
        promotionalPrice = prices[prices.length - 1] || null;
      }

      const discMatch = line.match(/(\d{1,2})%\s*OFF/i);
      discount = discMatch ? `${discMatch[1]}%` : extractDiscountPercent(originalPrice, promotionalPrice, line);

      afterSlug = afterSlug.replace(/^(?:EM ESTOQUE|\d+\s*UNID|Frete Grátis:[^]*?)(?=[A-Z\u00C0-\u00DF])/gi, '');
      afterSlug = afterSlug.replace(/^(?:Sul e Sudeste|Sudeste e Sul|Frete Grátis)\s*/gi, '');
      const deIndex = afterSlug.indexOf('de R$') !== -1 ? afterSlug.indexOf('de R$') : afterSlug.indexOf('R$');
      name = (deIndex !== -1 ? afterSlug.substring(0, deIndex) : afterSlug.substring(0, 120)).trim();
      name = name.replace(/^(?:Frete Grátis:?[^]*?)(?=[A-Z\u00C0-\u00DF])/i, '').replace(/^(?:Sul e Sudeste|Sudeste e Sul)\s*/gi, '').trim();
      if (!name) {
        name = rawSlug.replace(/-/g, ' ');
      }
    } else if (rule.siteId === 'renner') {
      const urlMatch = line.match(/^(\/p\/[a-z0-9-]+(?:\/-\/A-[a-z0-9.-]+?)?)(?=\d+%\s*Off|R\$|\s|$)/i);
      if (!urlMatch) continue;
      url = `${rule.baseUrl}${urlMatch[1]}`;

      const prices = [...line.matchAll(/R\$\s*([\d.]+,\d{2})/gi)].map((m) => parsePrice(m[1])).filter(Boolean);
      if (prices.length >= 2) {
        originalPrice = prices[0];
        promotionalPrice = prices[1];
      } else if (prices.length === 1) {
        promotionalPrice = prices[0];
      }

      const discMatch = line.match(/(\d+)%\s*Off/i);
      discount = discMatch ? `${discMatch[1]}%` : extractDiscountPercent(originalPrice, promotionalPrice, line);

      let rest = line.substring(urlMatch[1].length);
      rest = rest.replace(/^(\d+%\s*Off\s*Ver\s*similares)/i, '').trim();
      const firstR = rest.indexOf('R$');
      name = (firstR !== -1 ? rest.substring(0, firstR) : rest.substring(0, 100)).trim();
    } else if (rule.siteId === 'shein') {
      const urlMatch = line.match(/(\/[a-z0-9-]+-p-\d+\.html[^\s\"\'<>]*)/i);
      if (!urlMatch) continue;
      const cleanRelativeUrl = urlMatch[1].split('?')[0];
      url = `${rule.baseUrl}${cleanRelativeUrl}`;

      const econMatch = line.match(/Economize\s*R\$\s*([\d.]+,\d{2})/i);
      const discMatch = line.match(/[-](\d{1,2})%/i);
      if (discMatch) discount = `${discMatch[1]}%`;

      const prices = [...line.matchAll(/R\$\s*([\d.]+,\d{2})/gi)].map((m) => parsePrice(m[1])).filter(Boolean);
      if (prices.length >= 2) {
        originalPrice = prices[0];
        promotionalPrice = prices[1];
      } else if (prices.length === 1) {
        promotionalPrice = prices[0];
      }

      if (econMatch && discMatch && !originalPrice) {
        const econ = parsePrice(econMatch[1]);
        const discPercent = parseInt(discMatch[1], 10);
        if (econ && discPercent > 0 && discPercent < 100) {
          originalPrice = Math.round((econ / (discPercent / 100)) * 100) / 100;
          promotionalPrice = Math.round((originalPrice - econ) * 100) / 100;
        }
      }

      let rest = line.substring(line.indexOf(urlMatch[1]) + urlMatch[1].length);
      rest = rest.replace(/^[-]?\d+%\s*/, '');
      const firstR = rest.indexOf('R$');
      name = (firstR !== -1 ? rest.substring(0, firstR) : rest.substring(0, 100)).replace(/Economize.*$/, '').trim();
      if (!name) {
        name = cleanRelativeUrl.replace(/^\//, '').replace(/-p-\d+\.html$/, '').replace(/-/g, ' ');
      }
    } else if (rule.siteId === 'shopee') {
      const urlMatch = line.match(/(https?:\/\/shopee\.com\.br\/[^\s\"\'<>]+-i\.\d+\.\d+[^\s\"\'<>]*|\/[^\s\"\'<>]+-i\.\d+\.\d+[^\s\"\'<>]*)/i);
      if (!urlMatch) continue;
      const rawUrl = urlMatch[1].split('?')[0];
      url = rawUrl.startsWith('http') ? rawUrl : `${rule.baseUrl}${rawUrl}`;

      const prices = [...line.matchAll(/R\$\s*([\d.]+,\d{2})/gi)].map((m) => parsePrice(m[1])).filter(Boolean);
      promotionalPrice = prices[0] || null;

      const discMatch = line.match(/[-](\d{1,2})%/i);
      discount = discMatch ? `${discMatch[1]}%` : '0%';
      const discVal = parseInt(discount, 10) || 0;

      if (promotionalPrice && discVal > 0 && discVal < 100) {
        originalPrice = Math.round((promotionalPrice / (1 - discVal / 100)) * 100) / 100;
      }

      let rest = line.substring(line.indexOf(urlMatch[1]) + urlMatch[1].length);
      rest = rest.replace(/^[-]?\d+%\s*/, '');
      const firstR = rest.indexOf('R$');
      name = (firstR !== -1 ? rest.substring(0, firstR) : rest.substring(0, 100)).replace(/[\d\.]+\s*(?:mil\+)?\s*Vendido\(s\)/i, '').trim();
      if (!name) {
        name = rawUrl.split('shopee.com.br/').pop().replace(/-i\.\d+\.\d+.*$/, '').replace(/-/g, ' ');
      }
    } else if (rule.siteId === 'magalu') {
      const urlMatch = line.match(/(https?:\/\/www\.magazineluiza\.com\.br\/[^\s\"\'<>]+|\/[a-z0-9-]+(?:\/p\/|\/produto\/)[^\s\"\'<>]*)/i);
      if (urlMatch) {
        const rawUrl = urlMatch[1].split('?')[0];
        url = rawUrl.startsWith('http') ? rawUrl : `${rule.baseUrl}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;

        // Remoção prévia e estrita de parcelas (ex: 10x de R$ 84,55) da linha antes de extrair preços
        // para garantir que o valor da parcela NUNCA seja capturado como preço final com desconto
        const lineWithoutInstallments = line.replace(/(?:\b\d+\s*x\s*(?:de\s*)?|em\s*\d+\s*x\s*(?:de\s*)?)\s*R\$\s*[\d.,]+/gi, '');
        const prices = [...lineWithoutInstallments.matchAll(/R\$\s*([\d.]+,\d{2})/gi)].map((m) => parsePrice(m[1])).filter(Boolean);

        const discMatch = line.match(/(\d{1,2})%\s*off/i) || line.match(/Desconto:?\s*(\d{1,2})%/i);
        discount = discMatch ? `${discMatch[1]}%` : '0%';
        const discVal = parseInt(discount, 10) || 0;

        if (prices.length >= 2) {
          originalPrice = prices[0];
          promotionalPrice = prices[1];
        } else if (prices.length === 1) {
          promotionalPrice = prices[0];
        }

        if (promotionalPrice && discVal > 0 && discVal < 100 && !originalPrice) {
          originalPrice = Math.round((promotionalPrice / (1 - discVal / 100)) * 100) / 100;
        }

        const titleMatch = line.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i)
          || line.match(/product-card-title[^>]*>(.*?)(?:<\/|$)/i);
        if (titleMatch) {
          name = titleMatch[1].replace(/<[^>]+>/g, '').trim();
        } else {
          let rest = line.substring(line.indexOf(urlMatch[1]) + urlMatch[1].length);
          rest = rest.replace(/[\"\ue8cc\ue4cb\ue87d\ue000-\uf8ff]/g, '');
          const firstR = rest.indexOf('R$');
          name = (firstR !== -1 ? rest.substring(0, firstR) : rest.substring(0, 100)).trim();
        }
      }
    }

    if (name && url && (promotionalPrice || originalPrice) && !seenUrls.has(url)) {
      seenUrls.add(url);
      products.push({
        name: name.replace(/\s+/g, ' ').slice(0, 150),
        url,
        originalPrice: originalPrice ? formatCurrency(originalPrice) : '-',
        promotionalPrice: promotionalPrice ? formatCurrency(promotionalPrice) : '-',
        discount,
        rawOriginalPrice: originalPrice,
        rawPromotionalPrice: promotionalPrice,
      });
    }
  }

  // Se nenhum produto foi extraído linha-a-linha no Magalu, extrai o bloco de exemplo do .docx
  if (rule.siteId === 'magalu' && products.length === 0) {
    let sampleTitle = '';
    let samplePrice = null;
    let sampleDiscount = '0%';
    let sampleUrl = '';

    for (const text of paragraphs) {
      if (text.toLowerCase().includes('instruções de processamento')) break;

      const titleMatch = text.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i)
        || text.match(/product-card-title[^>]*>(.*?)(?:<\/|$)/i);
      if (titleMatch) sampleTitle = titleMatch[1].replace(/<[^>]+>/g, '').trim();

      const discMatch = text.match(/(\d{1,2})%\s*off/i);
      if (discMatch) sampleDiscount = `${discMatch[1]}%`;

      const priceMatch = text.match(/Preço\s*R\$\s*&?nbsp;?([\d.]+,\d{2})/i)
        || text.match(/R\$\s*&?nbsp;?([\d.]+,\d{2})/i);
      if (priceMatch && !text.includes('x de')) samplePrice = parsePrice(priceMatch[1]);

      const imgMatch = text.match(/src="https?:\/\/[^\/]+\/[^\/]+\/([^\/]+)\//i);
      if (imgMatch) sampleUrl = `https://www.magazineluiza.com.br/${imgMatch[1]}/p/`;
    }

    if (sampleTitle && samplePrice) {
      const discVal = parseInt(sampleDiscount, 10) || 0;
      let origPrice = null;
      if (discVal > 0 && discVal < 100) {
        origPrice = Math.round((samplePrice / (1 - discVal / 100)) * 100) / 100;
      }
      products.push({
        name: sampleTitle,
        url: sampleUrl || `${rule.baseUrl}/`,
        originalPrice: origPrice ? formatCurrency(origPrice) : '-',
        promotionalPrice: formatCurrency(samplePrice),
        discount: sampleDiscount,
        rawOriginalPrice: origPrice,
        rawPromotionalPrice: samplePrice,
      });
    }
  }

  return products;
}

/**
 * Processa um manual .docx individual gerando a especificação e produtos extraídos
 */
function parseStoreDocx(docxData) {
  const { filename, storeKey, paragraphs } = docxData;
  const rule = SITE_RULES[storeKey] || {
    siteId: storeKey.toLowerCase(),
    name: storeKey,
    domain: `${storeKey.toLowerCase()}.com.br`,
    baseUrl: `https://www.${storeKey.toLowerCase()}.com.br`,
    productPattern: /\/produto\/|\/p\//i,
    junkRegex: /(?:facebook|instagram|twitter|youtube|atendimento|ajuda|politica|privacidade)/i,
    requiresLogin: false,
    notes: 'Configuração genérica carregada dinamicamente.',
  };

  const categories = extractCategories(paragraphs, rule);
  const sampleProducts = extractSampleProducts(paragraphs, rule);

  return {
    filename,
    storeKey,
    siteId: rule.siteId,
    name: rule.name,
    domain: rule.domain,
    baseUrl: rule.baseUrl,
    productPattern: rule.productPattern.toString(),
    junkExclusionRule: rule.junkRegex.toString(),
    requiresLogin: rule.requiresLogin || false,
    loginUrl: rule.loginUrl || null,
    notes: rule.notes,
    totalCategories: categories.length,
    categories,
    totalSampleProducts: sampleProducts.length,
    sampleProducts,
  };
}

module.exports = {
  SITE_RULES,
  extractCategories,
  extractSampleProducts,
  parseStoreDocx,
};
