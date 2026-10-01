import type { MetadataRoute } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';

const BASE_URL = 'https://www.dealhunterpro.com.br';

/**
 * Sitemap dinâmico para o Deal Hunter Pro.
 * Configurado de acordo com as especificações do Google Search Console e Next.js App Router.
 * - Rota Home com prioridade máxima (1.0) e frequência 'hourly' (monitor 24/7).
 * - Estrutura dinâmica para integração com ofertas/produtos do Supabase com fallback seguro.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date();

  // Rotas estáticas principais
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: currentDate,
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/termos`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Mapeamento dinâmico de ofertas e categorias via Supabase
  let dynamicRoutes: MetadataRoute.Sitemap = [];

  try {
    const supabase = createAdminClient();
    
    // Tenta carregar ofertas/deals publicados recentemente no Supabase (se a tabela existir)
    const { data: deals, error } = await supabase
      .from('deals')
      .select('slug, updated_at')
      .limit(100);

    if (!error && deals && Array.isArray(deals)) {
      dynamicRoutes = deals.map((deal) => ({
        url: `${BASE_URL}/ofertas/${deal.slug}`,
        lastModified: deal.updated_at ? new Date(deal.updated_at) : currentDate,
        changeFrequency: 'hourly' as const,
        priority: 0.8,
      }));
    }
  } catch {
    // Tratamento resiliente de erro: se as credenciais do Supabase não tiverem a tabela deals,
    // o sitemap é gerado normalmente com as rotas principais sem quebrar a compilação do Next.js
    dynamicRoutes = [];
  }

  return [...staticRoutes, ...dynamicRoutes];
}
