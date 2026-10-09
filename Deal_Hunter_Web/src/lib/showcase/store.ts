import { createAdminClient } from '@/lib/supabase/admin';
import { tagAmazonUrl } from '@/lib/ml-radar/affiliate';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';

export interface ShowcaseDealItem {
  id: string;
  title: string;
  description?: string;
  price: number;
  original_price?: number | null;
  discount_percent?: number | null;
  image_url?: string | null;
  product_url: string;
  store: string;
  category?: string;
  is_featured: boolean;
  created_at?: string;
}

// Fallback inicial seguro (apenas se absolutamente nenhum produto tiver sido configurado pelo admin)
export const CURATED_DEFAULT_DEALS: ShowcaseDealItem[] = [
  {
    id: 'curated-default-1',
    title: 'Echo Dot 5ª Geração Smart Speaker com Alexa e Som Imersivo',
    description: 'Caixa de som inteligente com o melhor custo-benefício da Amazon. Menor preço verificado.',
    price: 249.9,
    original_price: 429.0,
    discount_percent: 42,
    image_url: 'https://m.media-amazon.com/images/I/71C8zGss8pL._AC_SL1000_.jpg',
    product_url: 'https://www.amazon.com.br/dp/B09B8V1LZ3',
    store: 'Amazon Brasil',
    category: 'Eletrônicos & Smart Home',
    is_featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'curated-default-2',
    title: 'SSD Kingston A400 480GB SATA 3 Leitura 500MB/s Gravação 450MB/s',
    description: 'Acelera a inicialização e o desempenho de computadores e notebooks com confiabilidade.',
    price: 139.9,
    original_price: 219.9,
    discount_percent: 36,
    image_url: 'https://m.media-amazon.com/images/I/51r26zY3nEL._AC_SL1000_.jpg',
    product_url: 'https://www.amazon.com.br/dp/B079XC5PVV',
    store: 'Amazon Brasil',
    category: 'Informática & Hardware',
    is_featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'curated-default-3',
    title: 'Fritadeira Elétrica Air Fryer Mondial Grand Family 5L Inox',
    description: 'Capacidade família para até 5 pessoas sem óleo. Superdesconto histórico verificado.',
    price: 269.9,
    original_price: 449.9,
    discount_percent: 40,
    image_url: 'https://m.media-amazon.com/images/I/61K-KzP6b2L._AC_SL1000_.jpg',
    product_url: 'https://www.amazon.com.br/dp/B08HRYF9R8',
    store: 'Amazon Brasil',
    category: 'Casa & Eletrodomésticos',
    is_featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'curated-default-4',
    title: 'Smart TV 50" 4K UHD Samsung Crystal 50DU7700 Gaming Hub',
    description: 'Processador Crystal 4K com Gaming Hub integrado e bordas ultrafinas.',
    price: 1999.0,
    original_price: 2799.0,
    discount_percent: 29,
    image_url: 'https://m.media-amazon.com/images/I/71Y8KzNf3ZL._AC_SL1000_.jpg',
    product_url: 'https://www.amazon.com.br/dp/B0CX237K2V',
    store: 'Amazon Brasil',
    category: 'Eletrônicos & Smart Home',
    is_featured: true,
    created_at: new Date().toISOString(),
  },
];

declare global {
  // eslint-disable-next-line no-var
  var __DH_SHOWCASE_CACHE__: ShowcaseDealItem[] | undefined;
  // eslint-disable-next-line no-var
  var __DH_SHOWCASE_CACHE_TIME__: number | undefined;
  // eslint-disable-next-line no-var
  var __DH_SHOWCASE_CUSTOM_DEALS__: ShowcaseDealItem[] | undefined;
}

const isValidUUID = (str?: any): boolean =>
  Boolean(typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim()));

function getLocalStoreFilePath(): string {
  return path.join(process.cwd(), 'src', 'data', 'showcase_store.json');
}

/**
 * Lê produtos salvos do arquivo de persistência em disco local
 */
export function readLocalStoreFile(): ShowcaseDealItem[] | null {
  try {
    const filePath = getLocalStoreFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(sanitizeShowcaseDeal);
      }
    }
  } catch (err) {
    // Fallback secundário para /tmp em ambientes Serverless
    try {
      const tmpPath = path.join('/tmp', 'showcase_store.json');
      if (fs.existsSync(tmpPath)) {
        const raw = fs.readFileSync(tmpPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map(sanitizeShowcaseDeal);
        }
      }
    } catch {}
  }
  return null;
}

/**
 * Salva produtos no arquivo de persistência em disco local
 */
export function writeLocalStoreFile(deals: ShowcaseDealItem[]) {
  try {
    const filePath = getLocalStoreFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(deals, null, 2), 'utf-8');
  } catch (err) {
    // Tenta em /tmp em Serverless
    try {
      const tmpPath = path.join('/tmp', 'showcase_store.json');
      fs.writeFileSync(tmpPath, JSON.stringify(deals, null, 2), 'utf-8');
    } catch {}
  }
}

/**
 * Invalida imediatamente todo o cache da vitrine e força o Next.js ISR a re-renderizar
 */
export function invalidateShowcaseCache() {
  global.__DH_SHOWCASE_CACHE__ = undefined;
  global.__DH_SHOWCASE_CACHE_TIME__ = undefined;
  try {
    revalidatePath('/ofertas');
    revalidatePath('/vitrine');
    revalidatePath('/api/showcase/deals');
    revalidatePath('/api/showcase/sync');
  } catch {}
}

/**
 * Normaliza uma oferta para a estrutura padronizada da Vitrine
 */
export function sanitizeShowcaseDeal(d: any): ShowcaseDealItem {
  const price = Number(d.price || d.source_price || 0);
  const originalPrice = d.original_price || d.source_original_price ? Number(d.original_price || d.source_original_price) : null;
  const cleanProductUrl = tagAmazonUrl(d.product_url || d.productUrl || '');

  let discountPercent = d.discount_percent || d.source_discount_percent ? Number(d.discount_percent || d.source_discount_percent) : null;
  if (!discountPercent && originalPrice && price && originalPrice > price) {
    discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);
  }

  return {
    id: String(d.id || `showcase-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`),
    title: d.title || d.source_title || 'Produto Oferta',
    description: d.description || (d.verdict ? `Veredito: ${d.verdict}` : 'Oferta verificada pela curadoria Deal Hunter Pro.'),
    price,
    original_price: originalPrice,
    discount_percent: discountPercent,
    image_url: d.image_url || d.imageUrl || d.thumbnail || d.source_image_url || null,
    product_url: cleanProductUrl,
    store: d.store || d.site_name || 'Amazon Brasil',
    category: d.category || 'Geral',
    is_featured: true,
    created_at: d.created_at || new Date().toISOString(),
  };
}

/**
 * Obtém todas as ofertas ativas na Vitrine com fallback inteligente em cascata
 */
export async function getShowcaseDeals(): Promise<ShowcaseDealItem[]> {
  // 1. Cache em memória recente (3 segundos para atualização instantânea após sync do admin)
  if (global.__DH_SHOWCASE_CACHE__ && global.__DH_SHOWCASE_CACHE__.length > 0) {
    const age = Date.now() - (global.__DH_SHOWCASE_CACHE_TIME__ || 0);
    if (age < 3000) {
      return global.__DH_SHOWCASE_CACHE__;
    }
  }

  // 2. Consulta Primária ao Supabase (Tabela ml_radar_deals onde is_featured = true)
  let supaDeals: ShowcaseDealItem[] = [];
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('ml_radar_deals')
      .select('*')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && Array.isArray(data) && data.length > 0) {
      supaDeals = data.map(sanitizeShowcaseDeal);
      // Mantém o arquivo local em disco sempre sincronizado com o Supabase
      writeLocalStoreFile(supaDeals);
    }
  } catch (err: any) {
    console.warn('[Showcase Store] Aviso ao consultar Supabase:', err.message);
  }

  if (supaDeals.length > 0) {
    global.__DH_SHOWCASE_CACHE__ = supaDeals;
    global.__DH_SHOWCASE_CACHE_TIME__ = Date.now();
    return supaDeals;
  }

  // 3. Fallback de Persistência em Disco (Arquivo JSON local — garante sobrevivência se Supabase falhar)
  const localDeals = readLocalStoreFile();
  if (localDeals !== null) {
    global.__DH_SHOWCASE_CACHE__ = localDeals;
    global.__DH_SHOWCASE_CACHE_TIME__ = Date.now();
    return localDeals;
  }

  // 4. Fallback de Memória Global da Sessão
  if (global.__DH_SHOWCASE_CUSTOM_DEALS__ !== undefined) {
    global.__DH_SHOWCASE_CACHE__ = global.__DH_SHOWCASE_CUSTOM_DEALS__;
    global.__DH_SHOWCASE_CACHE_TIME__ = Date.now();
    return global.__DH_SHOWCASE_CUSTOM_DEALS__;
  }

  // 5. Fallback Final inicial apenas caso nunca tenha sido criado o arquivo local
  return CURATED_DEFAULT_DEALS;
}

/**
 * Salva e sincroniza a lista completa de ofertas ativas na vitrine (acionado exclusivamente pelo Admin)
 */
export async function syncShowcaseDeals(deals: any[], currentUserId?: string | null): Promise<ShowcaseDealItem[]> {
  const sanitizedDeals = deals.map(sanitizeShowcaseDeal);

  // 1. Gravação Imediata em Disco Local (Garantia de que os produtos nunca sumam para o público externo)
  writeLocalStoreFile(sanitizedDeals);

  // 2. Atualiza Cache em Memória Global Imediatamente
  global.__DH_SHOWCASE_CACHE__ = sanitizedDeals;
  global.__DH_SHOWCASE_CACHE_TIME__ = Date.now();
  global.__DH_SHOWCASE_CUSTOM_DEALS__ = sanitizedDeals;

  // 3. Persistência no Supabase
  try {
    const supabase = createAdminClient();

    // Descobre um user_id válido para atender à constraint de integridade relacional
    let validUserId: string | null = isValidUUID(currentUserId) ? currentUserId! : null;

    if (!validUserId) {
      try {
        const { data: usersData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
        if (usersData?.users?.[0]?.id) {
          validUserId = usersData.users[0].id;
        }
      } catch {}
    }

    if (!validUserId) {
      try {
        const { data: profile } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
        if (profile?.id && isValidUUID(profile.id)) {
          validUserId = profile.id;
        }
      } catch {}
    }

    if (!validUserId) {
      try {
        const { data: existingDeal } = await supabase.from('ml_radar_deals').select('user_id').limit(1).maybeSingle();
        if (existingDeal?.user_id && isValidUUID(existingDeal.user_id)) {
          validUserId = existingDeal.user_id;
        }
      } catch {}
    }

    // Lista de URLs dos produtos atualmente ativos na vitrine
    const activeUrls = new Set(sanitizedDeals.map((d) => tagAmazonUrl(d.product_url)).filter(Boolean));
    const activeIds = new Set(sanitizedDeals.map((d) => d.id).filter(isValidUUID));

    // A. Desmarca ofertas que foram removidas da vitrine pelo admin
    try {
      const { data: currentFeatured } = await supabase
        .from('ml_radar_deals')
        .select('id, product_url')
        .eq('is_featured', true);

      if (Array.isArray(currentFeatured)) {
        for (const item of currentFeatured) {
          const normUrl = tagAmazonUrl(item.product_url);
          const isStillActive = activeIds.has(item.id) || (normUrl && activeUrls.has(normUrl));
          if (!isStillActive) {
            await supabase
              .from('ml_radar_deals')
              .update({ is_featured: false })
              .eq('id', item.id);
          }
        }
      }
    } catch {}

    // B. Atualiza ou insere cada oferta da vitrine
    for (const deal of sanitizedDeals) {
      const isUuid = isValidUUID(deal.id);
      const cleanUrl = tagAmazonUrl(deal.product_url);

      if (isUuid) {
        await supabase
          .from('ml_radar_deals')
          .update({
            is_featured: true,
            title: deal.title,
            price: deal.price,
            original_price: deal.original_price,
            image_url: deal.image_url,
            product_url: cleanUrl,
            store: deal.store,
            description: deal.description,
            category: deal.category,
            gemini_analysis: {
              is_featured: true,
            },
          })
          .eq('id', deal.id);
      } else {
        // Verifica se já existe pela URL do anúncio
        let existingId: string | null = null;
        if (cleanUrl) {
          const { data: found } = await supabase
            .from('ml_radar_deals')
            .select('id')
            .eq('product_url', cleanUrl)
            .maybeSingle();

          if (found?.id) {
            existingId = found.id;
          }
        }

        if (existingId) {
          await supabase
            .from('ml_radar_deals')
            .update({
              is_featured: true,
              title: deal.title,
              price: deal.price,
              original_price: deal.original_price,
              image_url: deal.image_url,
              description: deal.description,
              category: deal.category,
              gemini_analysis: {
                is_featured: true,
              },
            })
            .eq('id', existingId);
        } else if (validUserId) {
          // Insere nova oferta garantindo is_featured = true
          await supabase.from('ml_radar_deals').insert({
            user_id: validUserId,
            title: deal.title,
            price: deal.price,
            original_price: deal.original_price,
            image_url: deal.image_url,
            product_url: cleanUrl,
            store: deal.store,
            is_featured: true,
            description: deal.description,
            category: deal.category,
            status: 'completed',
            verdict: 'Viável',
            gemini_analysis: {
              is_featured: true,
            },
          });
        }
      }
    }
  } catch (syncErr: any) {
    console.error('[Showcase Store] Aviso ao persistir no Supabase (backup em disco preservado):', syncErr.message);
  }

  // 4. Invalidação imediata de cache ISR em todas as rotas de vitrine
  invalidateShowcaseCache();

  return sanitizedDeals;
}

/**
 * Adiciona ou atualiza uma oferta diretamente no store e memória da vitrine
 */
export function addDealToShowcaseMemory(deal: any) {
  const sanitized = sanitizeShowcaseDeal(deal);
  const currentDeals = readLocalStoreFile() || global.__DH_SHOWCASE_CUSTOM_DEALS__ || [...CURATED_DEFAULT_DEALS];
  const cleanUrl = tagAmazonUrl(sanitized.product_url);

  const existingIdx = currentDeals.findIndex(
    (d) => (d.id && d.id === sanitized.id) || (cleanUrl && tagAmazonUrl(d.product_url) === cleanUrl)
  );

  if (existingIdx >= 0) {
    currentDeals[existingIdx] = { ...currentDeals[existingIdx], ...sanitized };
  } else {
    currentDeals.unshift(sanitized);
  }

  writeLocalStoreFile(currentDeals);
  global.__DH_SHOWCASE_CACHE__ = currentDeals;
  global.__DH_SHOWCASE_CACHE_TIME__ = Date.now();
  global.__DH_SHOWCASE_CUSTOM_DEALS__ = currentDeals;
  invalidateShowcaseCache();
}

/**
 * Remove uma oferta da vitrine por ID ou URL
 */
export function removeDealFromShowcaseMemory(rawId?: string, rawUrl?: string) {
  const currentDeals = readLocalStoreFile() || global.__DH_SHOWCASE_CUSTOM_DEALS__ || [...CURATED_DEFAULT_DEALS];
  const cleanUrl = rawUrl ? tagAmazonUrl(rawUrl) : null;

  const filtered = currentDeals.filter((d) => {
    if (rawId && d.id === rawId) return false;
    if (cleanUrl && tagAmazonUrl(d.product_url) === cleanUrl) return false;
    return true;
  });

  writeLocalStoreFile(filtered);
  global.__DH_SHOWCASE_CACHE__ = filtered;
  global.__DH_SHOWCASE_CACHE_TIME__ = Date.now();
  global.__DH_SHOWCASE_CUSTOM_DEALS__ = filtered;
  invalidateShowcaseCache();
}
