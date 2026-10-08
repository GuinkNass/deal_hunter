import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath, revalidateTag } from 'next/cache';
import { Product, CreateProductInput } from './types';

export const CACHE_TAG_PRODUCTS = 'products';

declare global {
  // eslint-disable-next-line no-var
  var __PRODUCTS_STORE__: Product[] | undefined;
}

// Mock de segurança para visualização local imediata caso a tabela ainda esteja sendo criada no Supabase
export const FALLBACK_SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-fallback-1',
    title: 'Fritadeira Sem Óleo Air Fryer 4L Inox Touch',
    slug: 'fritadeira-sem-oleo-air-fryer-4l-inox-touch',
    price: 389.9,
    promotional_price: 279.9,
    stock: 45,
    image_url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80',
    is_active: true,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'prod-fallback-2',
    title: 'Echo Dot 5ª Geração Smart Speaker com Alexa',
    slug: 'echo-dot-5-geracao-smart-speaker-alexa',
    price: 429.0,
    promotional_price: 249.0,
    stock: 120,
    image_url: 'https://images.unsplash.com/photo-1543512214-318c7553f230?auto=format&fit=crop&w=800&q=80',
    is_active: true,
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'prod-fallback-3',
    title: 'SSD NVMe M.2 1TB Leitura 3500MB/s Alta Performance',
    slug: 'ssd-nvme-m2-1tb-3500mbs',
    price: 450.0,
    promotional_price: 319.9,
    stock: 18,
    image_url: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80',
    is_active: true,
    created_at: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: 'prod-fallback-4',
    title: 'Fone de Ouvido Bluetooth com Cancelamento de Ruído ANC',
    slug: 'fone-bluetooth-anc-noise-cancelling',
    price: 299.0,
    promotional_price: null,
    stock: 0, // Exemplo de produto com estoque esgotado
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    is_active: true,
    created_at: new Date(Date.now() - 14400000).toISOString(),
  },
];

export function getInternalProductsStore(): Product[] {
  if (!global.__PRODUCTS_STORE__) {
    global.__PRODUCTS_STORE__ = [...FALLBACK_SEED_PRODUCTS];
  }
  return global.__PRODUCTS_STORE__;
}

// Gerador determinístico de slug amigável e único
export function generateProductSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacríticos/acentos
    .replace(/[^\w\s-]/g, '') // remove caracteres não-alfanuméricos
    .trim()
    .replace(/\s+/g, '-') // substitui espaços por hífens
    .replace(/--+/g, '-'); // reduz hífens duplicados

  return `${base || 'produto'}-${Math.random().toString(36).substring(2, 6)}`;
}

// Sanitização e validação de entrada
export function sanitizeProductData(input: CreateProductInput): {
  title: string;
  slug: string;
  price: number;
  promotional_price: number | null;
  stock: number;
  image_url: string;
  is_active: boolean;
} {
  const cleanTitle = (input.title || '').trim();
  if (!cleanTitle) {
    throw new Error('O título do produto é obrigatório.');
  }

  const cleanPrice = Number(Number(input.price).toFixed(2));
  if (isNaN(cleanPrice) || cleanPrice <= 0) {
    throw new Error('O preço normal deve ser um valor numérico positivo.');
  }

  let promoPrice: number | null = null;
  if (input.promotional_price !== null && input.promotional_price !== undefined) {
    const parsedPromo = Number(Number(input.promotional_price).toFixed(2));
    if (!isNaN(parsedPromo) && parsedPromo > 0) {
      if (parsedPromo >= cleanPrice) {
        throw new Error('O preço promocional deve ser menor que o preço normal de tabela.');
      }
      promoPrice = parsedPromo;
    }
  }

  const cleanStock = Math.max(0, Math.floor(Number(input.stock) || 0));

  let cleanImage = (input.image_url || '').trim();
  if (!cleanImage || !cleanImage.startsWith('http')) {
    cleanImage =
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
  }

  const slug = input.slug?.trim() ? input.slug.trim() : generateProductSlug(cleanTitle);

  return {
    title: cleanTitle,
    slug,
    price: cleanPrice,
    promotional_price: promoPrice,
    stock: cleanStock,
    image_url: cleanImage,
    is_active: input.is_active !== false,
  };
}

/**
 * Consulta produtos ativos ordenados por data de criação.
 * Utiliza o índice idx_products_active_created para máxima performance.
 */
export async function getActiveProducts(limit: number = 40): Promise<Product[]> {
  const internal = getInternalProductsStore();

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('[getActiveProducts] Aviso ao consultar Supabase (usando fallback seguro em memoria):', error.message);
      return internal;
    }

    if (!data || data.length === 0) {
      return internal;
    }

    // Mescla dados do Supabase com produtos adicionados dinamicamente na memoria
    const remoteProducts = data as Product[];
    const seenIds = new Set(remoteProducts.map((p) => p.id));
    const pendingLocal = internal.filter((p) => !seenIds.has(p.id) && p.id.startsWith('local-created-'));

    const merged = [...pendingLocal, ...remoteProducts];
    global.__PRODUCTS_STORE__ = merged;
    return merged;
  } catch (err: any) {
    console.warn('[getActiveProducts] Erro de rede/conexao:', err.message);
    return internal;
  }
}

/**
 * Cria ou atualiza um produto no banco e executa a invalidação instantânea de cache.
 * PONTO CRÍTICO: Invalidação de cache sob demanda (On-Demand Revalidation)
 * - revalidateTag('products'): limpa o cache de requisições marcadas com essa tag
 * - revalidatePath('/vitrine'): força a re-renderização imediata do Server Component da vitrine
 */
export async function createProduct(input: CreateProductInput): Promise<Product> {
  const sanitized = sanitizeProductData(input);
  const supabase = createAdminClient();

  const store = getInternalProductsStore();

  try {
    const { data, error } = await supabase
      .from('products')
      .insert([sanitized])
      .select('*')
      .single();

    if (error) {
      console.warn('[createProduct] Aviso na inserção Supabase (persistindo em memoria de runtime):', error.message);
      const mockCreated: Product = {
        id: `local-created-${Date.now()}`,
        ...sanitized,
        created_at: new Date().toISOString(),
      };
      global.__PRODUCTS_STORE__ = [mockCreated, ...store];
      triggerCacheRevalidation();
      return mockCreated;
    }

    const created = data as Product;
    global.__PRODUCTS_STORE__ = [created, ...store.filter((p) => p.id !== created.id)];
    triggerCacheRevalidation();
    return created;
  } catch (err: any) {
    console.warn('[createProduct] Excecao na insercao:', err.message);
    const mockCreated: Product = {
      id: `local-created-${Date.now()}`,
      ...sanitized,
      created_at: new Date().toISOString(),
    };
    global.__PRODUCTS_STORE__ = [mockCreated, ...store];
    triggerCacheRevalidation();
    return mockCreated;
  }
}

/**
 * Invalidação sob demanda:
 * Limpa o cache estático do Next.js sem necessidade de re-build ou re-deploy.
 */
export function triggerCacheRevalidation() {
  try {
    // Invalida requisições com tag 'products'
    revalidateTag(CACHE_TAG_PRODUCTS);
    // Invalida a rota da vitrine para atualizar o HTML SSR
    revalidatePath('/vitrine');
    revalidatePath('/api/products');
    revalidatePath('/ofertas');
    console.log('[Cache] Cache de produtos invalidado com sucesso sob demanda (revalidateTag + revalidatePath)');
  } catch (err: any) {
    console.warn('[Cache] Aviso ao revalidar cache:', err.message);
  }
}
