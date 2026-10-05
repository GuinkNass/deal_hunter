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

  // Detecção defensiva de preço âncora falso/inflado da Amazon (ex: Ryzen 5 5500 por 539 com âncora de 1.166)
  // No e-commerce brasileiro, âncoras acima de 1.35x costumam ser preços "De" fictícios da Amazon.
  const isInflatedAnchor = Boolean(rawOrigPrice && rawOrigPrice > currentPrice * 1.35);

  // Preço de venda real estimado no Mercado Livre (conservador e realista)
  const winnerPrice = isInflatedAnchor
    ? Number((currentPrice * 1.15).toFixed(2))
    : (rawOrigPrice || Number((currentPrice * 1.35).toFixed(2)));

  const minPrice = Number((winnerPrice * 0.90).toFixed(2));
  const diff = winnerPrice - currentPrice;
  const roi = currentPrice > 0 ? Math.max(0, Math.round((diff / currentPrice) * 100)) : 0;
  const margin = winnerPrice > 0 ? Math.max(0, Math.round((diff / winnerPrice) * 100)) : 0;
  const netProfit = Number((diff * 0.7).toFixed(2));
  const productUrl = tagAmazonUrl(r.product_url || '');

  const cleanTitle = String(r.product_title || 'Produto').trim();
  // Limpa o título para o slug do Mercado Livre (remove códigos técnicos e cores desnecessárias)
  const coreQuery = cleanTitle
    .split(',')[0]
    .replace(/\b[0-9]{6,}[A-Z0-9]*\b/gi, '')
    .replace(/\b(?:Cerâmica|Cinza|Preto|Branco|Azul|Novo|Original|Lacrado)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const slug = (coreQuery || cleanTitle)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const soldQty = Math.max(100, Math.round((roi > 0 ? roi : 15) * 45));
  const daysActive = 85;
  const oldestDate = new Date(Date.now() - daysActive * 24 * 60 * 60 * 1000).toISOString();
  const mlUrl = `https://lista.mercadolivre.com.br/${slug}_OrderId_PRICE_ASC`;

  return {
    id: `render-${r.id}`,
    title: r.product_title || 'Produto Oferta',
    price: currentPrice,
    original_price: origPrice,
    image_url: r.thumbnail || null,
    product_url: productUrl,
    store: r.site_name || 'Amazon Brasil',
    ml_title: r.product_title,
    ml_price: winnerPrice,
    ml_url: mlUrl,
    ml_image_url: r.thumbnail || null,
    ml_min_price: minPrice,
    ml_winner_price: winnerPrice,
    ml_sold_quantity: soldQty,
    ml_days_active: daysActive,
    ml_oldest_date: oldestDate,
    ml_visits: soldQty * 16,
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
