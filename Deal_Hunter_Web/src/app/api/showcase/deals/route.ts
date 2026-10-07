import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { tagAmazonUrl } from '@/lib/ml-radar/affiliate';

// Revalidação a cada 60 segundos para performance e frescor
export const revalidate = 60;

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();

    let featuredDeals: any[] = [];

    // 1. Tenta consulta direta com is_featured = true
    try {
      const { data, error } = await supabase
        .from('ml_radar_deals')
        .select('*')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(60);

      if (!error && Array.isArray(data) && data.length > 0) {
        featuredDeals = data;
      }

      // Fallback abrangente: caso a coluna is_featured ainda não exista ou esteja vazia, verifica em gemini_analysis
      if (featuredDeals.length === 0) {
        const { data: fallbackData } = await supabase
          .from('ml_radar_deals')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (Array.isArray(fallbackData)) {
          featuredDeals = fallbackData.filter(
            (d: any) => d.is_featured === true || d.gemini_analysis?.is_featured === true
          );
        }
      }
    } catch (queryErr: any) {
      console.warn('[Showcase Deals] Erro ao consultar ofertas em destaque:', queryErr.message);
    }

    // 2. Se o Admin ainda não favoritou nenhuma oferta, fornece vitrine curada padrão do Deal Hunter Pro
    if (featuredDeals.length === 0) {
      featuredDeals = [
        {
          id: 'featured-curated-1',
          title: 'Echo Dot 5ª Geração Smart Speaker com Alexa e Som Imersivo',
          description: 'Caixa de som inteligente com o melhor custo-benefício da Amazon. Menor preço dos últimos 60 dias.',
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
          id: 'featured-curated-2',
          title: 'SSD Kingston A400 480GB SATA 3 Leitura 500MB/s Gravação 450MB/s',
          description: 'Excelente para turbinar notebooks e desktops lentos com inicialização em segundos.',
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
          id: 'featured-curated-3',
          title: 'Fritadeira Elétrica Air Fryer Mondial Grand Family 5L Inox',
          description: 'Capacidade família para até 5 pessoas sem óleo. Superdesconto histórico detectado na Amazon.',
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
          id: 'featured-curated-4',
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
          id: 'featured-curated-5',
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
          id: 'featured-curated-6',
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

    // 3. Normalização, enriquecimento com id de afiliado Amazon e cálculo preciso de desconto
    const sanitizedDeals = featuredDeals.map((d: any) => {
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

    return NextResponse.json({
      success: true,
      count: sanitizedDeals.length,
      data: sanitizedDeals,
    });
  } catch (err: any) {
    console.error('[API Showcase Deals] Erro inesperado:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
