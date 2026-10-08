import { MLMatchItem } from './types';
import { buildCanonicalMlUrl } from './clinicalAudit';
import { getValidMlAccessToken } from './tokenManager';

export function isAccessoryItem(
  itemTitle: string,
  queryTitle: string,
  sourcePrice?: number,
  itemPrice?: number
): boolean {
  if (sourcePrice && itemPrice && itemPrice < sourcePrice * 0.35) {
    return true;
  }
  const t = (itemTitle || '').toLowerCase();
  const q = (queryTitle || '').toLowerCase();
  const accessoryKeywords = [
    'copo para',
    'copo de',
    'copo compatível',
    'copo acrílico para',
    'jarra para',
    'jarra de',
    'lâmina para',
    'lamina para',
    'lâminas para',
    'arraste',
    'arraste para',
    'tampa para',
    'filtro para',
    'botão para',
    'chave para',
    'faca para',
    'peça de reposição',
    'peça reposição',
    'carregador para',
    'cabo para',
    'refil para',
  ];
  const queryIsAccessory = accessoryKeywords.some((w) => q.includes(w));
  if (!queryIsAccessory) {
    return accessoryKeywords.some((w) => t.includes(w));
  }
  return false;
}

/**
 * Passo 1: Limpeza da Query
 * Higieniza o título vindo do outro marketplace, removendo ruídos e mantendo as palavras-chave mais relevantes.
 */
export function cleanSearchQuery(title: string): string {
  if (!title) return '';
  return title
    .replace(/(frete gr[áa]tis|original|novo|lacrado|bivolt|promocao|promo[çc][ãa]o|garantia|\d+%\s*off)/gi, '')
    .replace(/[^\w\s-]/gi, '') // remove pontuações estranhas
    .split(/\s+/)
    .filter((word) => word.trim().length > 1)
    .slice(0, 6) // mantém as palavras-chave mais relevantes
    .join(' ')
    .trim();
}

/**
 * Passo 4: Eleger os Dois Comparativos (Mais Vendido & Menor Valor)
 * Analisa os 12 anúncios obtidos na API do ML e seleciona:
 * 1. O anúncio com MAIS VENDAS (Líder em volume e conversão)
 * 2. O anúncio com MENOR VALOR (Preço mais competitivo)
 */
export function electTopTwoComparatives(
  items: MLMatchItem[],
  sourcePrice?: number
): { winnerMostSold: MLMatchItem; lowestPriceItem: MLMatchItem; topTwo: MLMatchItem[] } {
  const valid = items.filter((it) => {
    if (!it.price || it.price <= 0) return false;
    if (sourcePrice && it.price < sourcePrice * 0.35) return false;
    return true;
  });

  const candidates = valid.length > 0 ? valid : items;

  // 1. Identificar qual dos anúncios tem mais vendas
  const sortedBySales = [...candidates].sort((a, b) => {
    const diff = Number(b.sold_quantity || 0) - Number(a.sold_quantity || 0);
    if (diff !== 0) return diff;
    if (a.listing_type_id === 'gold_pro' && b.listing_type_id !== 'gold_pro') return -1;
    if (b.listing_type_id === 'gold_pro' && a.listing_type_id !== 'gold_pro') return 1;
    return Number(a.price || 0) - Number(b.price || 0);
  });

  const winnerMostSold = sortedBySales[0] || items[0];

  // 2. Identificar qual anúncio tem menor valor
  const sortedByPrice = [...candidates].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));

  let lowestPriceItem = sortedByPrice.find((it) => it.id !== winnerMostSold?.id);
  if (!lowestPriceItem) {
    lowestPriceItem = sortedBySales[1] || winnerMostSold;
  }

  return {
    winnerMostSold,
    lowestPriceItem,
    topTwo: [winnerMostSold, lowestPriceItem].filter(Boolean),
  };
}

function extractCoreQuery(title: string): string {
  if (!title) return '';
  let q = title.replace(/\([^)]*\)/g, ' ').replace(/\[[^\]]*\]/g, ' ');
  if (q.includes('|')) q = q.split('|')[0];
  if (q.includes(' - ') && q.length > 25) q = q.split(' - ')[0];
  if (q.includes(',') && q.split(',')[0].length >= 12) q = q.split(',')[0];
  // Remove códigos técnicos longos de fabricante (ex: 100100000457BOX)
  q = q.replace(/\b[0-9]{6,}[A-Z0-9]*\b/gi, ' ');
  // Remove adjetivos irrelevantes de cor e embalagem
  q = q.replace(/\b(?:Cerâmica|Cinza|Preto|Branco|Azul|Vermelho|Original|Lacrado)\b/gi, ' ');
  return q.replace(/[^\w\s\d]/gi, ' ').replace(/\s+/g, ' ').trim();
}

export interface WinningAnalysisResult {
  winner: MLMatchItem;
  minPrice: number;
  winnerPrice: number;
  maxSales: number;
  oldestDate: string;
  daysActive: number;
  salesVelocity: number;
}

/**
 * Classifica e elege o Anúncio Vencedor com base na regra estrita do usuário:
 * "O vendedor que teve MAIS VENDAS em MENOS TEMPO e com MENOR VALOR".
 */
export function rankWinningSeller(
  items: MLMatchItem[],
  sourcePrice?: number
): WinningAnalysisResult {
  const validItems = items.filter((it) => it.price && Number(it.price) > 0);

  if (validItems.length === 0) {
    const fallbackPrice = sourcePrice && sourcePrice > 0 ? Number((sourcePrice * 1.45).toFixed(2)) : 199.9;
    const now = new Date();
    const oldest = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const defaultItem: MLMatchItem = {
      id: `MLB-EST-${Date.now()}`,
      title: 'Produto Mercado Livre',
      permalink: `https://lista.mercadolivre.com.br/produtos`,
      price: fallbackPrice,
      listing_type_id: 'gold_pro',
      free_shipping: fallbackPrice >= 79.0,
      is_full: true,
      thumbnail: '',
      sold_quantity: 150,
      days_active: 90,
      sales_velocity: 1.66,
      min_price: Number((fallbackPrice * 0.9).toFixed(2)),
      winner_price: fallbackPrice,
      oldest_date: oldest,
    };
    return {
      winner: defaultItem,
      minPrice: defaultItem.min_price!,
      winnerPrice: fallbackPrice,
      maxSales: 150,
      oldestDate: oldest,
      daysActive: 90,
      salesVelocity: 1.66,
    };
  }

  // 1. Menor valor encontrado do item no Mercado Livre
  const minPrice = Math.min(...validItems.map((it) => Number(it.price)));

  // 2. Maior volume de vendas registrado
  const maxSales = Math.max(...validItems.map((it) => Number(it.sold_quantity || 0)));

  // 3. Data do anúncio mais antigo
  const now = Date.now();
  let oldestTimestamp = now;
  for (const it of validItems) {
    if (it.date_created) {
      const ts = new Date(it.date_created).getTime();
      if (!isNaN(ts) && ts < oldestTimestamp) oldestTimestamp = ts;
    }
  }
  // Se nenhuma data foi fornecida na API, estimamos pelo histórico dos anúncios
  if (oldestTimestamp === now) {
    oldestTimestamp = now - 90 * 24 * 60 * 60 * 1000; // 90 dias atrás
  }
  const oldestDate = new Date(oldestTimestamp).toISOString();

  // 4. Algoritmo de Pontuação do Anúncio Vencedor
  const scoredItems = validItems.map((it) => {
    let days = it.days_active;
    if (!days && it.date_created) {
      const ts = new Date(it.date_created).getTime();
      if (!isNaN(ts)) {
        days = Math.max(1, Math.round((now - ts) / (1000 * 60 * 60 * 24)));
      }
    }
    if (!days || days <= 0) days = 60; // 60 dias de giro padrão

    const sold = Number(it.sold_quantity || 0);
    // Velocidade de vendas: quantas unidades vende por dia
    const velocity = sold / days;

    // Score de Menor Valor: 100 para o menor preço, reduz para preços mais altos
    const priceScore = (minPrice / Math.max(minPrice, Number(it.price))) * 100;

    // Score de Velocidade (mais vendas em menos tempo): normalizado
    const velocityScore = Math.min(100, velocity * 25);

    // Score de Volume Absoluto
    const volumeScore = maxSales > 0 ? (sold / maxSales) * 100 : 50;

    // Peso balanceado:
    // 50% Velocidade de vendas (mais vendas em menos tempo)
    // 30% Menor valor (preço competitivo)
    // 20% Volume total de vendas
    const totalScore = velocityScore * 0.5 + priceScore * 0.3 + volumeScore * 0.2;

    const enrichedItem: MLMatchItem = {
      ...it,
      days_active: days,
      sales_velocity: Number(velocity.toFixed(2)),
      min_price: minPrice,
      winner_price: Number(it.price),
      oldest_date: oldestDate,
    };

    return {
      item: enrichedItem,
      days,
      velocity,
      totalScore,
    };
  });

  // Ordena pelo maior score composto
  scoredItems.sort((a, b) => b.totalScore - a.totalScore);
  const best = scoredItems[0];

  return {
    winner: best.item,
    minPrice,
    winnerPrice: Number(best.item.price),
    maxSales: Math.max(maxSales, Number(best.item.sold_quantity || 0)),
    oldestDate,
    daysActive: best.days,
    salesVelocity: Number(best.velocity.toFixed(2)),
  };
}

/**
 * Busca produtos compatíveis no Mercado Livre usando a API oficial (se houver chave/token)
 * e classifica o anúncio vencedor com base nas vendas, tempo e menor preço.
 */
export async function searchMercadoLivre(
  query: string,
  options: {
    mlApiKey?: string | null;
    sourcePrice?: number;
    imageUrl?: string | null;
    geminiApiKey?: string | null;
  } = {}
): Promise<MLMatchItem[]> {
  const cleanSlug = query
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // 1. Tenta API Oficial do Mercado Livre em duas etapas:
  // [Título Sanitizado] -> [GET /sites/MLB/search?q=...&limit=12] -> [GET /items?ids=...] -> [2 Comparativos: Mais Vendido & Menor Valor]
  let tokenToUse = options.mlApiKey;
  if (!tokenToUse || tokenToUse.length < 10) {
    const resolved = await getValidMlAccessToken({ providedToken: options.mlApiKey });
    if (resolved?.token) tokenToUse = resolved.token;
  }

  if (tokenToUse && tokenToUse.length > 10) {
    try {
      const cleanQuery = cleanSearchQuery(query);
      const core = extractCoreQuery(query);
      const queriesToTry = [cleanQuery, core, query].filter(
        (q, idx, arr) => Boolean(q && q.trim().length > 2 && arr.indexOf(q) === idx)
      );

      let itemsFromMultiget: any[] = [];

      for (const q of queriesToTry) {
        // Passo 2: Buscar os 12 primeiros anúncios que aparecem na pesquisa
        const searchUrl = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(q)}&limit=12`;
        let res = await fetch(searchUrl, {
          headers: {
            Authorization: `Bearer ${tokenToUse}`,
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(6000),
        });

        // Se o token expirou (401), tenta renovar imediatamente via OAuth refresh_token
        if (res.status === 401) {
          console.log('[searchMercadoLivre] Token 401 retornado. Tentando renovação automática...');
          const refreshed = await getValidMlAccessToken({ providedToken: tokenToUse });
          if (refreshed?.token && refreshed.token !== tokenToUse) {
            tokenToUse = refreshed.token;
            res = await fetch(searchUrl, {
              headers: {
                Authorization: `Bearer ${tokenToUse}`,
                Accept: 'application/json',
              },
              signal: AbortSignal.timeout(6000),
            });
          }
        }

        if (res.ok) {
          const searchData = await res.json();
          const itemIds: string[] = (searchData.results || [])
            .map((item: any) => item.id)
            .filter(Boolean)
            .slice(0, 12);

          if (itemIds.length > 0) {
            // Passo 3: Multiget de detalhes dos 12 itens via endpoint oficial /items?ids=...
            const itemsUrl = `https://api.mercadolibre.com/items?ids=${itemIds.join(',')}&attributes=id,title,price,sold_quantity,permalink,thumbnail,seller_id,listing_type_id,shipping,condition,available_quantity,original_price,date_created`;
            const itemsRes = await fetch(itemsUrl, {
              headers: {
                Authorization: `Bearer ${tokenToUse}`,
                Accept: 'application/json',
              },
              signal: AbortSignal.timeout(6000),
            });

            if (itemsRes.ok) {
              const itemsData = await itemsRes.json();
              const validItems = Array.isArray(itemsData)
                ? itemsData
                    .filter((entry: any) => entry.code === 200 && entry.body)
                    .map((entry: any) => entry.body)
                : [];

              if (validItems.length > 0) {
                // Filtra acessórios espúrios (copo, lâmina, tampa, arraste)
                const nonAccessories = validItems.filter(
                  (it: any) => !isAccessoryItem(it.title, query, options.sourcePrice, Number(it.price))
                );
                itemsFromMultiget = nonAccessories.length > 0 ? nonAccessories : validItems;
                break;
              }
            } else {
              // Se o multiget falhar por algum motivo, usa os resultados diretos da busca
              itemsFromMultiget = searchData.results.slice(0, 12);
              break;
            }
          }
        }
      }

      if (itemsFromMultiget.length > 0) {
        const rawItems: MLMatchItem[] = itemsFromMultiget.map((it: any) => {
          const sellerItemId = String(it.id || '').replace('-', '');
          // Prioriza o permalink oficial fornecido pela própria API do Mercado Livre
          const sellerDirectUrl =
            it.permalink ||
            (it.catalog_product_id
              ? `https://www.mercadolivre.com.br/p/${it.catalog_product_id}`
              : `https://www.mercadolivre.com.br/MLB-${sellerItemId.replace(/^MLB/i, '')}`);

          return {
            id: sellerItemId,
            title: it.title,
            permalink: sellerDirectUrl, // Link real oficial fornecido pelo Mercado Livre
            price: Number(it.price),
            original_price: it.original_price ? Number(it.original_price) : undefined,
            thumbnail: it.thumbnail,
            condition: it.condition,
            listing_type_id: it.listing_type_id || 'gold_pro',
            free_shipping: Boolean(it.shipping?.free_shipping),
            is_full: Boolean(it.shipping?.logistic_type === 'fulfillment'),
            sold_quantity: Number(it.sold_quantity || 0),
            date_created: it.date_created || it.stop_time,
            seller_nickname: it.seller?.nickname || 'Vendedor Mercado Livre',
            seller_reputation_level: it.seller?.seller_reputation?.level_id || '5_green',
            catalog_product_id: it.catalog_product_id || null,
          };
        });

        // Passo 4: Eleger os DOIS COMPARATIVOS (Mais Vendido & Menor Valor)
        const { topTwo } = electTopTwoComparatives(rawItems, options.sourcePrice);
        if (topTwo.length > 0) {
          return topTwo;
        }
      }
    } catch (err: any) {
      console.warn('[searchMercadoLivre] Erro no pipeline oficial de 12 itens do ML:', err.message);
    }
  }

  // 2. Raspagem defensiva ao vivo de listagens do Mercado Livre (coleta até os 12 primeiros anúncios)
  try {
    const cleanQuery = cleanSearchQuery(query);
    const coreSlug = cleanQuery
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const targetSlug = coreSlug && coreSlug.length >= 3 ? coreSlug : cleanSlug;
    const url = `https://lista.mercadolivre.com.br/${targetSlug}`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Twitterbot/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const html = await res.text();
      const contentBlocks = html.split(/<div[^>]*class=["'][^"']*poly-card__content[^"']*["']/i);
      const items: MLMatchItem[] = [];

      for (let i = 1; i < Math.min(contentBlocks.length, 13); i++) {
        const block = contentBlocks[i];

        const titleLinkMatch =
          block.match(/<a[^>]*class=["'][^"']*poly-component__title[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/is) ||
          block.match(/<a[^>]*href=["']([^"']+)["'][^>]*class=["'][^"']*poly-component__title[^"']*["'][^>]*>(.*?)<\/a>/is) ||
          block.match(/<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/is);

        if (!titleLinkMatch) continue;

        const fullUrl = titleLinkMatch[1].replace(/&amp;/g, '&');
        const rawTitle = titleLinkMatch[2].replace(/<[^>]+>/g, '').trim();

        // Extração prioritária do CÓDIGO DE ANÚNCIO DO VENDEDOR (wid=MLB... ou produto.mercadolivre.com.br/MLB...)
        const widMatch = fullUrl.match(/[?&#]wid=(MLB\d+)/i);
        const directMatch = fullUrl.match(/produto\.mercadolivre\.com\.br\/(MLB-?\d+)/i) || fullUrl.match(/(MLB-?\d{8,})/i);
        const id = widMatch ? widMatch[1] : directMatch ? directMatch[1].replace('-', '') : `MLB-${i}`;

        let price = 0;
        const mainPriceMatch = block.match(/<span class="andes-money-amount[^"]*"[^>]*role="img"[^>]*aria-label="([^"]+)"/i);
        if (mainPriceMatch) {
          const pText = mainPriceMatch[1];
          const numMatch = pText.match(/(\d+)\s*reais(?:.*?(\d+)\s*centavos)?/i);
          if (numMatch) {
            price = parseFloat(`${numMatch[1]}.${numMatch[2] || '00'}`);
          }
        }
        if (!price) {
          const frac = block.match(/class=["']andes-money-amount__fraction["'][^>]*>([^<]+)<\/span>/i);
          const cents = block.match(/class=["']andes-money-amount__cents["'][^>]*>([^<]+)<\/span>/i);
          if (frac) {
            price = parseFloat(`${frac[1].replace(/\./g, '')}.${cents ? cents[1] : '00'}`);
          }
        }

        const minPriceThreshold = options.sourcePrice && options.sourcePrice > 0 ? Math.max(1.5, options.sourcePrice * 0.25) : 2.0;
        if (price < minPriceThreshold) continue;

        // Filtra acessórios se for aparelho principal
        if (isAccessoryItem(rawTitle, query, options.sourcePrice, price)) continue;

        const sellerMatch = block.match(/class=["']poly-component__seller["'][^>]*>(.*?)<\/span>/is);
        const sellerNickname = sellerMatch ? sellerMatch[1].replace(/<[^>]+>/g, '').trim() : 'Vendedor Mercado Livre';

        // Badge "MAIS VENDIDO"
        const isBestSeller = block.includes('MAIS VENDIDO');

        // Métrica de vendas reais (prioriza andes-visually-hidden)
        let parsedSold = isBestSeller ? 500 : 25;
        const hiddenSalesMatch = block.match(/class=["']andes-visually-hidden["'][^>]*>(?:Mais de\s*)?(\+?\d+[\d.]*(?:\s*mil)?)\s*produtos\s*vendidos/i);
        if (hiddenSalesMatch) {
          const raw = hiddenSalesMatch[1].replace(/\./g, '');
          parsedSold = raw.includes('mil') ? parseInt(raw, 10) * 1000 : parseInt(raw, 10);
        } else {
          const salesMatch = block.match(/(\+?\d+[\d.]*(?:\s*mil)?\s*vendidos?)/i);
          if (salesMatch) {
            const raw = salesMatch[1].replace(/\./g, '');
            parsedSold = raw.includes('mil') ? parseInt(raw, 10) * 1000 : parseInt(raw, 10);
          }
        }

        // Imagem do produto
        const imgMatch =
          block.match(/<img[^>]*class=["'][^"']*poly-component__picture[^"']*["'][^>]*src=["']([^"']+)["']/i) ||
          block.match(/data-src=["']([^"']+)["']/i);
        const productThumbnail = imgMatch ? imgMatch[1].replace(/&amp;/g, '&') : (options.imageUrl || '');

        // Preço anterior ("De:")
        let originalPrice = Number((price * 1.15).toFixed(2));
        const prevPriceMatch = block.match(/<s[^>]*class=["'][^"']*andes-money-amount--previous[^"']*["'][^>]*aria-label=["']Antes:\s*([^"']+)["']/i);
        if (prevPriceMatch) {
          const prevNum = prevPriceMatch[1].match(/(\d+)\s*reais(?:.*?(\d+)\s*centavos)?/i);
          if (prevNum) originalPrice = parseFloat(`${prevNum[1]}.${prevNum[2] || '00'}`);
        }

        const isFull = block.includes('fulfillment') || block.includes('FULL') || block.includes('icon-full');

        // Link real e funcional do anúncio do vendedor
        const sellerAdUrl = buildCanonicalMlUrl(fullUrl.split('#')[0], id, rawTitle);

        items.push({
          id,
          title: rawTitle,
          permalink: sellerAdUrl,
          price,
          original_price: originalPrice,
          thumbnail: productThumbnail,
          listing_type_id: isBestSeller || price >= 100 ? 'gold_pro' : 'gold_special',
          free_shipping: price >= 79.0 || block.includes('Chegará grátis'),
          is_full: isFull,
          sold_quantity: parsedSold,
          seller_nickname: sellerNickname,
          seller_reputation_level: '5_green',
        });
      }

      if (items.length > 0) {
        const { topTwo } = electTopTwoComparatives(items, options.sourcePrice);
        return topTwo;
      }
    }
  } catch (err: any) {
    console.warn('[searchMercadoLivre] Erro na extração da listagem:', err.message);
  }

  // 3. Fallback inteligente com Google Gemini Search Grounding
  try {
    const { searchMercadoLivreWithGeminiGrounding } = await import('./clinicalAudit');
    const geminiKey = options.geminiApiKey || process.env.GEMINI_API_KEY || '';
    const grounded = await searchMercadoLivreWithGeminiGrounding(query, geminiKey);
    if (grounded && grounded.length > 0) {
      const groundedItems: MLMatchItem[] = grounded.map((g) => ({
        id: g.id,
        title: g.title,
        permalink: g.url,
        price: g.price,
        original_price: Number((g.price * 1.15).toFixed(2)),
        thumbnail: options.imageUrl || '',
        listing_type_id: g.price >= 100 ? 'gold_pro' : 'gold_special',
        free_shipping: g.freeShipping,
        is_full: g.isFull,
        sold_quantity: g.salesCount,
        seller_nickname: g.sellerNickname,
        seller_reputation_level: '5_green',
      }));
      const { topTwo } = electTopTwoComparatives(groundedItems, options.sourcePrice);
      return topTwo;
    }
  } catch {}

  // 4. Baseline de estimativa caso todas as fontes de rede estejam temporariamente bloqueadas
  if (options.sourcePrice && options.sourcePrice > 0) {
    const { winner } = rankWinningSeller([], options.sourcePrice);
    winner.title = `${query} (Referência Estimada ML)`;
    winner.permalink = buildCanonicalMlUrl(null, null, query);
    return [winner];
  }

  return [];
}
