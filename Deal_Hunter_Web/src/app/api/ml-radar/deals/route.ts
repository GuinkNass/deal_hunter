import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const AMAZON_AFFILIATE_TAG = 'dealhunterp07-20';

function tagAmazonUrl(urlStr: string): string {
  if (!urlStr || typeof urlStr !== 'string') return urlStr;
  try {
    const trimmed = urlStr.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return urlStr;
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.toLowerCase();
    const isAmazon =
      /(?:^|\.)amazon\.(?:[a-z]{2,3}(?:\.[a-z]{2})?)$/i.test(hostname) ||
      /(?:^|\.)amazon\.[a-z.]+$/i.test(hostname) ||
      /(?:^|\.)amzn\.(?:to|com)$/i.test(hostname);

    if (isAmazon) {
      parsed.searchParams.set('tag', AMAZON_AFFILIATE_TAG);
      return parsed.toString();
    }
    return urlStr;
  } catch {
    return urlStr;
  }
}

function mapRenderAlertToDeal(r: any) {
  const currentPrice = Number(r.current_price) || 0;
  const rawOrigPrice = r.site_original_price ? Number(r.site_original_price) : null;
  const productUrl = tagAmazonUrl(r.product_url || '');

  // Anúncio bruto recém-chegado da varredura/extensão:
  // NÃO inventa preço de ML fictício nem url de busca.
  // Fica pendente de avaliação até o usuário acionar "Avaliar ML".
  return {
    id: `render-${r.id}`,
    title: r.product_title || 'Produto Oferta',
    price: currentPrice,
    original_price: rawOrigPrice,
    image_url: r.thumbnail || null,
    product_url: productUrl,
    store: r.site_name || 'Amazon Brasil',
    ml_title: null,
    ml_price: null,
    ml_url: null,
    ml_image_url: null,
    ml_min_price: null,
    ml_winner_price: null,
    ml_sold_quantity: null,
    ml_available_quantity: null,
    ml_days_active: null,
    ml_oldest_date: null,
    ml_visits: null,
    net_profit: null,
    roi_percent: null,
    margin_percent: null,
    verdict: 'Aguardando Avaliação',
    gemini_analysis: null,
    clinical_evaluated: false,
    status: 'pending_evaluation',
    created_at: r.sent_at || r.created_at || new Date().toISOString(),
  };
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    const supabase = createAdminClient();

    let userId: string | null = null;

    if (token) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser(token);
        if (user) {
          userId = user.id;
        }
      } catch (authErr: any) {
        console.warn('[ML Radar Deals] Token inválido ou expirado:', authErr.message);
      }
    }

    // 1. Busca ofertas persistidas no banco de dados (Supabase)
    let supabaseDeals: any[] = [];
    try {
      if (!userId) {
        const { data, error } = await supabase
          .from('ml_radar_deals')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (!error && Array.isArray(data)) {
          supabaseDeals = data;
        }
      } else {
        const { data, error } = await supabase
          .from('ml_radar_deals')
          .select('*')
          .or(`user_id.eq.${userId},user_id.is.null`)
          .order('created_at', { ascending: false })
          .limit(100);

        if (!error && Array.isArray(data)) {
          supabaseDeals = data;
        }
      }
    } catch (dbErr: any) {
      console.warn('[ML Radar Deals] Aviso ao consultar Supabase:', dbErr.message);
    }

    // 2. Busca histórico em tempo real do backend Deal Hunter (Render)
    let renderDeals: any[] = [];
    const serverUrl =
      process.env.DEAL_HUNTER_SERVER_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'https://deal-hunter-server.onrender.com';

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${serverUrl.replace(/\/$/, '')}/api/history?limit=100`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      }).finally(() => clearTimeout(timeout));

      if (res.ok) {
        const historyData = await res.json();
        if (Array.isArray(historyData)) {
          renderDeals = historyData.map(mapRenderAlertToDeal);
        }
      }
    } catch (renderErr: any) {
      console.warn('[ML Radar Deals] Aviso ao buscar histórico do Render:', renderErr.message);
    }

    // 3. Combinação e desduplicação dos dados (Supabase + Render backend)
    const seenUrls = new Set<string>();
    const seenTitles = new Set<string>();
    const combinedDeals: any[] = [];

    // Prioriza ofertas do Supabase
    for (const d of supabaseDeals) {
      const normUrl = (d.product_url || '').trim().toLowerCase();
      const normTitle = (d.title || '').trim().toLowerCase();
      if (normUrl) seenUrls.add(normUrl);
      if (normTitle) seenTitles.add(normTitle);

      // Validação se já foi avaliado clinicamente com anúncio real
      const hasRealMlAd = Boolean(
        d.clinical_evaluated ||
        (d.ml_url &&
          (d.ml_url.includes('produto.mercadolivre.com.br') ||
            d.ml_url.includes('/p/MLB') ||
            d.ml_url.includes('/MLB-')))
      );

      combinedDeals.push({
        ...d,
        clinical_evaluated: hasRealMlAd,
        // Limpa URLs de busca genérica para que apenas links diretos reais sejam acessados
        ml_url: hasRealMlAd ? d.ml_url : null,
        ml_price: hasRealMlAd ? d.ml_price : null,
        net_profit: hasRealMlAd ? d.net_profit : null,
        roi_percent: hasRealMlAd ? d.roi_percent : null,
      });
    }

    // Adiciona ofertas identificadas pela extensão e registradas no backend
    for (const rd of renderDeals) {
      const normUrl = (rd.product_url || '').trim().toLowerCase();
      const normTitle = (rd.title || '').trim().toLowerCase();

      const alreadyExists =
        (normUrl && seenUrls.has(normUrl)) ||
        (normTitle && seenTitles.has(normTitle));

      if (!alreadyExists) {
        if (normUrl) seenUrls.add(normUrl);
        if (normTitle) seenTitles.add(normTitle);
        combinedDeals.push(rd);
      }
    }

    // Ordena por data decrescente (mais recente no topo)
    combinedDeals.sort((a, b) => {
      const timeA = new Date(a.created_at || 0).getTime();
      const timeB = new Date(b.created_at || 0).getTime();
      return timeB - timeA;
    });

    // Limitação de histórico para até 100 itens
    const finalDeals = combinedDeals.slice(0, 100);

    return NextResponse.json({ success: true, data: finalDeals });
  } catch (err: any) {
    console.error('[API ML Radar Deals] Erro geral:', err);
    return NextResponse.json({ success: true, data: [] });
  }
}
