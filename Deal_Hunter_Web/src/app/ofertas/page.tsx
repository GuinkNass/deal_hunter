import React from 'react';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import VitrineClient from '@/components/showcase/VitrineClient';
import { createAdminClient } from '@/lib/supabase/admin';
import { tagAmazonUrl } from '@/lib/ml-radar/affiliate';
import { ShowcaseDeal } from '@/components/showcase/ShowcaseCard';

export const metadata: Metadata = {
  title: 'Vitrine de Ofertas & Superdescontos Verificados — Deal Hunter Pro',
  description:
    'Confira as ofertas e bugs de preço selecionados e verificados pelo robô Deal Hunter Pro. Descontos reais de até 80% na Amazon, KaBuM!, Shopee, Magalu e mais.',
  openGraph: {
    title: 'Vitrine de Ofertas Verificadas — Deal Hunter Pro',
    description:
      'Ofertas selecionadas com superdescontos reais nos maiores e-commerces do Brasil.',
    url: 'https://www.dealhunterpro.com.br/ofertas',
    siteName: 'Deal Hunter Pro',
    locale: 'pt_BR',
    type: 'website',
  },
};

// Revalidação a cada 60 segundos
export const revalidate = 60;

async function getFeaturedDeals(): Promise<ShowcaseDeal[]> {
  try {
    const supabase = createAdminClient();

    let rawDeals: any[] = [];
    try {
      const { data, error } = await supabase
        .from('ml_radar_deals')
        .select('*')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(60);

      if (!error && Array.isArray(data) && data.length > 0) {
        rawDeals = data;
      } else if (error) {
        // Fallback defensivo para instâncias onde a migração ainda não rodou
        const { data: allData } = await supabase
          .from('ml_radar_deals')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(60);

        if (Array.isArray(allData)) {
          rawDeals = allData.filter(
            (d: any) => d.is_featured === true || d.gemini_analysis?.is_featured === true
          );
        }
      }
    } catch (queryErr) {
      console.warn('[Vitrine RSC] Erro na consulta Supabase:', queryErr);
    }

    if (rawDeals.length === 0) {
      // Ofertas curadas padrão iniciais
      rawDeals = [
        {
          id: 'curated-1',
          title: 'Echo Dot 5ª Geração Smart Speaker com Alexa e Som Imersivo',
          description: 'Caixa de som inteligente líder de vendas da Amazon. Menor preço verificado dos últimos 60 dias.',
          price: 249.9,
          original_price: 429.0,
          image_url: 'https://m.media-amazon.com/images/I/71C8zGss8pL._AC_SL1000_.jpg',
          product_url: 'https://www.amazon.com.br/dp/B09B8V1LZ3',
          store: 'Amazon Brasil',
          category: 'Eletrônicos & Smart Home',
          is_featured: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 'curated-2',
          title: 'SSD Kingston A400 480GB SATA 3 Leitura 500MB/s Gravação 450MB/s',
          description: 'Acelera a inicialização e o desempenho de computadores e notebooks.',
          price: 139.9,
          original_price: 219.9,
          image_url: 'https://m.media-amazon.com/images/I/51r26zY3nEL._AC_SL1000_.jpg',
          product_url: 'https://www.amazon.com.br/dp/B079XC5PVV',
          store: 'Amazon Brasil',
          category: 'Informática & Hardware',
          is_featured: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 'curated-3',
          title: 'Fritadeira Elétrica Air Fryer Mondial Grand Family 5L Inox',
          description: 'Capacidade família para até 5 pessoas sem óleo. Superdesconto histórico detectado.',
          price: 269.9,
          original_price: 449.9,
          image_url: 'https://m.media-amazon.com/images/I/61K-KzP6b2L._AC_SL1000_.jpg',
          product_url: 'https://www.amazon.com.br/dp/B08HRYF9R8',
          store: 'Amazon Brasil',
          category: 'Casa & Eletrodomésticos',
          is_featured: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 'curated-4',
          title: 'Monitor Gamer LG UltraGear 24" IPS Full HD 144Hz 1ms AMD FreeSync',
          description: 'Painel IPS veloz com taxas de atualização de 144Hz para máxima fluidez em games competitivos.',
          price: 749.9,
          original_price: 1199.0,
          image_url: 'https://images.kabum.com.br/produtos/fotos/473063/monitor-gamer-lg-ultragear-24-full-hd-144hz-1ms-ips-displayport-e-hdmi-freesync-premium-hdr10-24gn60r-b_1688583489_gg.jpg',
          product_url: 'https://www.kabum.com.br/produto/473063/monitor-gamer-lg-ultragear-24-full-hd-144hz-1ms-ips-displayport-e-hdmi-freesync-premium-hdr10-24gn60r-b',
          store: 'KaBuM!',
          category: 'Games & Monitores',
          is_featured: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 'curated-5',
          title: 'Smart TV 50" 4K UHD Samsung Crystal 50DU7700 Gaming Hub',
          description: 'Processador Crystal 4K com Gaming Hub integrado e bordas ultrafinas.',
          price: 1999.0,
          original_price: 2799.0,
          image_url: 'https://m.media-amazon.com/images/I/71Y8KzNf3ZL._AC_SL1000_.jpg',
          product_url: 'https://www.amazon.com.br/dp/B0CX237K2V',
          store: 'Amazon Brasil',
          category: 'Eletrônicos & Smart Home',
          is_featured: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 'curated-6',
          title: 'Cadeira Gamer ThunderX3 TGC12 Reclinável e Giratória Preta',
          description: 'Espuma de alta densidade com encosto reclinável até 180° e almofadas lombar e cervical.',
          price: 899.9,
          original_price: 1399.0,
          image_url: 'https://images.kabum.com.br/produtos/fotos/79435/79435_1509374026_gg.jpg',
          product_url: 'https://www.kabum.com.br/produto/79435/cadeira-gamer-thunderx3-tgc12-preta',
          store: 'KaBuM!',
          category: 'Informática & Hardware',
          is_featured: true,
          created_at: new Date().toISOString(),
        },
      ];
    }

    return rawDeals.map((d: any) => {
      const price = Number(d.price || d.source_price || 0);
      const originalPrice = d.original_price || d.source_original_price ? Number(d.original_price || d.source_original_price) : null;
      const cleanProductUrl = tagAmazonUrl(d.product_url || d.productUrl || '');

      let discountPercent = d.source_discount_percent ? Number(d.source_discount_percent) : null;
      if (!discountPercent && originalPrice && price && originalPrice > price) {
        discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);
      }

      return {
        id: String(d.id),
        title: d.title || 'Produto Oferta',
        description: d.description || (d.verdict ? `Veredito: ${d.verdict}` : 'Oferta verificada pela curadoria Deal Hunter Pro.'),
        price,
        original_price: originalPrice,
        discount_percent: discountPercent,
        image_url: d.image_url || d.imageUrl || null,
        product_url: cleanProductUrl,
        store: d.store || 'Amazon Brasil',
        category: d.category || 'Geral',
        is_featured: true,
        created_at: d.created_at || new Date().toISOString(),
      };
    });
  } catch (err) {
    console.error('[Vitrine RSC] Erro fatal:', err);
    return [];
  }
}

export default async function OfertasPage() {
  const initialDeals = await getFeaturedDeals();

  return (
    <div className="min-h-screen bg-[#070a12] text-[#f1f5f9] selection:bg-violet-500/30 selection:text-violet-200 antialiased flex flex-col justify-between">
      {/* Luzes de fundo atmosféricas */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-violet-600/10 blur-[150px] rounded-full pointer-events-none -z-10" />
      <div className="fixed top-1/3 -right-20 w-[500px] h-[500px] bg-cyan-600/10 blur-[160px] rounded-full pointer-events-none -z-10" />

      {/* Navbar do Deal Hunter Pro */}
      <Navbar />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        <VitrineClient initialDeals={initialDeals} />
      </main>

      {/* Rodapé Harmônico */}
      <footer className="mt-16 border-t border-white/[0.08] bg-[#05070c] py-10 px-4 text-center text-xs text-slate-500 space-y-3">
        <div className="flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400 font-semibold">
            Preços e estoques sujeitos a alterações dinâmicas nas lojas de origem.
          </span>
        </div>
        <p>
          © {new Date().getFullYear()} Deal Hunter Pro. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
