import { createAdminClient } from '@/lib/supabase/admin';
import { tagAmazonUrl } from '@/lib/ml-radar/affiliate';
import { revalidatePath } from 'next/cache';

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

// Fallback de ofertas curadas oficiais caso o banco esteja completamente zerado
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
}

const isValidUUID = (str?: any): boolean =>
  Boolean(typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim()));

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
 * Obtém todas as ofertas ativas na Vitrine com fallback inteligente
 */
export async function getShowcaseDeals(): Promise<ShowcaseDealItem[]> {
  // 1. Cache em memória recente (10 segundos)
  if (global.__DH_SHOWCASE_CACHE__ && global.__DH_SHOWCASE_CACHE__.length > 0) {
    const age = Date.now() - (global.__DH_SHOWCASE_CACHE_TIME__ || 0);
    if (age < 15000) {
      return global.__DH_SHOWCASE_CACHE__;
    }
  }

  try {
    const supabase = createAdminClient();

    // 2. Tenta buscar no Supabase as ofertas com is_featured = true
    let fetchedDeals: any[] = [];
    try {
      const { data, error } = await supabase
        .from('ml_radar_deals')
        .select('*')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && Array.isArray(data) && data.length > 0) {
        fetchedDeals = data;
      } else {
        // Fallback para gemini_analysis.is_featured
        const { data: allDeals } = await supabase
          .from('ml_radar_deals')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (Array.isArray(allDeals)) {
          fetchedDeals = allDeals.filter(
            (d: any) => d.is_featured === true || d.gemini_analysis?.is_featured === true
          );
        }
      }
    } catch (queryErr: any) {
      console.warn('[Showcase Store] Aviso ao consultar Supabase:', queryErr.message);
    }

    if (fetchedDeals.length > 0) {
      const sanitized = fetchedDeals.map(sanitizeShowcaseDeal);
      global.__DH_SHOWCASE_CACHE__ = sanitized;
      global.__DH_SHOWCASE_CACHE_TIME__ = Date.now();
      return sanitized;
    }

    // Se temos cache anterior em memória, usa ele antes de cair no mock padrão
    if (global.__DH_SHOWCASE_CACHE__ && global.__DH_SHOWCASE_CACHE__.length > 0) {
      return global.__DH_SHOWCASE_CACHE__;
    }

    // 3. Fallback inicial padrão apenas se não houver nenhuma oferta cadastrada
    return CURATED_DEFAULT_DEALS;
  } catch (err: any) {
    console.error('[Showcase Store] Erro ao carregar ofertas:', err);
    return global.__DH_SHOWCASE_CACHE__ || CURATED_DEFAULT_DEALS;
  }
}

/**
 * Salva e sincroniza a lista completa de ofertas ativas na vitrine
 */
export async function syncShowcaseDeals(deals: any[], currentUserId?: string | null): Promise<ShowcaseDealItem[]> {
  const sanitizedDeals = deals.map(sanitizeShowcaseDeal);

  // 1. Atualiza cache em memória imediatamente
  global.__DH_SHOWCASE_CACHE__ = sanitizedDeals;
  global.__DH_SHOWCASE_CACHE_TIME__ = Date.now();

  try {
    const supabase = createAdminClient();

    // Descobre um user_id válido para atender à foreign key de auth.users
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

    // 2. Persiste individualmente cada produto no Supabase
    for (const deal of sanitizedDeals) {
      const isUuid = isValidUUID(deal.id);
      const cleanUrl = tagAmazonUrl(deal.product_url);

      if (isUuid) {
        // Atualiza oferta existente por ID
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
        // Verifica se já existe pela URL do produto
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
          // Insere como novo registro no banco
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

    // 3. Força a revalidação imediata do Next.js ISR
    try {
      revalidatePath('/ofertas');
      revalidatePath('/vitrine');
      revalidatePath('/api/showcase/deals');
    } catch {}
  } catch (syncErr: any) {
    console.error('[Showcase Store] Aviso ao persistir no Supabase:', syncErr.message);
  }

  return sanitizedDeals;
}
