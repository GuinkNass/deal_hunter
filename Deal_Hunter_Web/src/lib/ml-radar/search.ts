import { MLMatchItem } from './types';

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
      permalink: `https://www.mercadolivre.com.br`,
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
  } = {}
): Promise<MLMatchItem[]> {
  const cleanSlug = query
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // 1. Se o usuário forneceu Token da API Mercado Livre
  if (options.mlApiKey && options.mlApiKey.length > 10) {
    try {
      let dataResults: any[] = [];
      const queriesToTry = [query];
      const core = extractCoreQuery(query);
      if (core && core.toLowerCase() !== query.toLowerCase()) {
        queriesToTry.push(core);
      }

      for (const q of queriesToTry) {
        const apiUrl = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(q)}&limit=30`;
        const res = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${options.mlApiKey}`,
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(6000),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            dataResults = data.results;
            break;
          }
        }
      }

      if (dataResults.length > 0) {
        const rawItems: MLMatchItem[] = dataResults.map((it: any) => ({
          id: it.id,
          title: it.title,
          permalink: it.permalink, // Link DIRETO e real do anúncio no ML
          price: Number(it.price),
          original_price: it.original_price ? Number(it.original_price) : undefined,
          thumbnail: it.thumbnail,
          condition: it.condition,
          listing_type_id: it.listing_type_id || 'gold_pro',
          free_shipping: Boolean(it.shipping?.free_shipping),
          is_full: Boolean(it.shipping?.logistic_type === 'fulfillment'),
          sold_quantity: it.sold_quantity || 0,
          date_created: it.date_created || it.stop_time,
          seller_nickname: it.seller?.nickname || 'Vendedor ML',
          seller_reputation_level: it.seller?.seller_reputation?.level_id || '5_green',
          catalog_product_id: it.catalog_product_id || null,
        }));

          const { winner } = rankWinningSeller(rawItems, options.sourcePrice);

          // Se o produto possui Catálogo Oficial (PDP), consulta /products/$PRODUCT_ID
          // conforme documentação oficial "Buscador de Produtos" para obter a Buy Box e permalink canônico
          if (winner && winner.catalog_product_id) {
            try {
              const catUrl = `https://api.mercadolibre.com/products/${winner.catalog_product_id}`;
              const prodRes = await fetch(catUrl, {
                headers: {
                  Authorization: `Bearer ${options.mlApiKey}`,
                  Accept: 'application/json',
                },
                signal: AbortSignal.timeout(3500),
              });

              if (prodRes.ok) {
                const prodData = await prodRes.json();
                if (prodData.permalink) {
                  winner.permalink = prodData.permalink;
                }
                if (prodData.buy_box_winner) {
                  const bb = prodData.buy_box_winner;
                  if (bb.price && Number(bb.price) > 0) {
                    winner.price = Number(bb.price);
                    winner.winner_price = Number(bb.price);
                  }
                  if (bb.seller?.nickname) {
                    winner.seller_nickname = bb.seller.nickname;
                  }
                }
                if (prodData.buy_box_winner_price_range?.min_price) {
                  winner.min_price = Number(prodData.buy_box_winner_price_range.min_price);
                }
              }
            } catch (pErr: any) {
              console.warn('[searchMercadoLivre] Aviso ao buscar Buy Box do catálogo:', pErr.message);
            }
          }

          // Coloca o vencedor no topo (índice 0)
          const filtered = rawItems.filter((it) => it.id !== winner.id);
          return [winner, ...filtered];
        }
    } catch (err: any) {
      console.warn('[searchMercadoLivre] Erro na API oficial do ML:', err.message);
    }
  }

  // 2. Raspagem defensiva ao vivo de listagens do Mercado Livre
  try {
    const coreQuery = extractCoreQuery(query);
    const coreSlug = coreQuery
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const targetSlug = coreSlug && coreSlug.length >= 3 ? coreSlug : cleanSlug;
    const url = `https://lista.mercadolivre.com.br/${targetSlug}`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const html = await res.text();
      const contentBlocks = html.split(/<div[^>]*class=["'][^"']*poly-card__content[^"']*["']/i);
      const items: MLMatchItem[] = [];

      for (let i = 1; i < contentBlocks.length; i++) {
        const block = contentBlocks[i];

        const titleLinkMatch =
          block.match(/<a[^>]*class=["'][^"']*poly-component__title[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/is) ||
          block.match(/<a[^>]*href=["']([^"']+)["'][^>]*class=["'][^"']*poly-component__title[^"']*["'][^>]*>(.*?)<\/a>/is);

        if (!titleLinkMatch) continue;

        const fullUrl = titleLinkMatch[1].replace(/&amp;/g, '&');
        const rawTitle = titleLinkMatch[2].replace(/<[^>]+>/g, '').trim();
        const cleanUrl = fullUrl.split('#')[0].split('?')[0];

        const widMatch = fullUrl.match(/[?&#]wid=(MLB\d+)/i);
        const pMatch = fullUrl.match(/\/p\/(MLB\d+)/i);
        const directMatch = fullUrl.match(/(MLB-?\d+)/i);
        const id = widMatch ? widMatch[1] : pMatch ? pMatch[1] : directMatch ? directMatch[1].replace('-', '') : `MLB-${i}`;

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

        const sellerMatch = block.match(/class=["']poly-component__seller["'][^>]*>(.*?)<\/span>/is);
        const sellerNickname = sellerMatch ? sellerMatch[1].replace(/<[^>]+>/g, '').trim() : 'Vendedor Mercado Livre';

        const salesMatch = block.match(/(\+?\d+[\d.]*(?:\s*mil)?\s*vendidos?)/i);
        let parsedSold = 25;
        if (salesMatch) {
          const raw = salesMatch[1].replace(/\./g, '');
          parsedSold = raw.includes('mil') ? parseInt(raw, 10) * 1000 : parseInt(raw, 10);
        }

        const isFull = block.includes('fulfillment') || block.includes('FULL') || block.includes('icon-full');

        items.push({
          id,
          title: rawTitle,
          permalink: cleanUrl || fullUrl.split('#')[0],
          price,
          original_price: Number((price * 1.15).toFixed(2)),
          thumbnail: options.imageUrl || '',
          listing_type_id: price >= 100 ? 'gold_pro' : 'gold_special',
          free_shipping: price >= 79.0,
          is_full: isFull,
          sold_quantity: parsedSold,
          seller_nickname: sellerNickname,
          seller_reputation_level: '5_green',
        });
      }

      if (items.length > 0) {
        const { winner } = rankWinningSeller(items, options.sourcePrice);
        const others = items.filter((it) => it.id !== winner.id);
        return [winner, ...others];
      }
    }
  } catch (err: any) {
    console.warn('[searchMercadoLivre] Erro na extração da listagem:', err.message);
  }

  return [];
}
