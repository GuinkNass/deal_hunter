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
  const origPrice = r.site_original_price
    ? Number(r.site_original_price)
    : Number((currentPrice * 1.4).toFixed(2));
  const diff = origPrice - currentPrice;
  const roi = r.discount_percent
    ? Number(r.discount_percent)
    : Math.max(0, Math.round((diff / (currentPrice || 1)) * 100));
  const margin = Math.round((diff / (origPrice || 1)) * 100);
  const netProfit = Number((diff * 0.7).toFixed(2));
  const productUrl = tagAmazonUrl(r.product_url || '');

  return {
    id: `render-${r.id}`,
    title: r.product_title || 'Produto Oferta',
    price: currentPrice,
    original_price: origPrice,
    image_url: r.thumbnail || null,
    product_url: productUrl,
    store: r.site_name || 'Amazon Brasil',
    ml_title: r.product_title,
    ml_price: origPrice,
    ml_url: productUrl,
    ml_image_url: r.thumbnail || null,
    net_profit: netProfit,
    roi_percent: roi,
    margin_percent: margin,
    verdict: roi >= 20 ? 'Viável' : 'Atenção',
    gemini_analysis: null,
    status: 'completed',
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
        if (user) userId = user.id;
      } catch (authErr) {
        // Ignora erro de token expirado ou malformado
      }
    }

    if (!userId) {
      const url = new URL(req.url);
      userId = url.searchParams.get('userId');
    }

    // 1. Busca ofertas persistidas no Supabase
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

    // Prioriza ofertas já processadas e detalhadas do Supabase
    for (const d of supabaseDeals) {
      const normUrl = (d.product_url || '').trim().toLowerCase();
      const normTitle = (d.title || '').trim().toLowerCase();
      if (normUrl) seenUrls.add(normUrl);
      if (normTitle) seenTitles.add(normTitle);
      combinedDeals.push(d);
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

    // Limitação de histórico para até 100 itens (FIFO)
    const finalDeals = combinedDeals.slice(0, 100);

    return NextResponse.json({ success: true, data: finalDeals });
  } catch (err: any) {
    console.error('[API ML Radar Deals] Erro geral:', err);
    return NextResponse.json({ success: true, data: [] });
  }
}
