/**
 * Disparo automático de notificação para o Telegram privado do usuário
 * Via API oficial do Telegram (POST https://api.telegram.org/bot<TOKEN>/sendMessage)
 */
export async function sendTelegramNotification(params: {
  botToken: string;
  chatId: string;
  deal: {
    title: string;
    productUrl: string;
    price: number;
    originalPrice?: number | null;
    store: string;
    mlTitle?: string;
    mlPrice?: number;
    mlUrl?: string;
    netProfit?: number;
    roiPercent?: number;
    marginPercent?: number;
    verdict?: string;
  };
}): Promise<{ ok: boolean; error?: string }> {
  const { botToken, chatId, deal } = params;

  if (!botToken || !chatId) {
    return { ok: false, error: 'Credenciais do Telegram incompletas.' };
  }

  const discountPercent =
    deal.originalPrice && deal.originalPrice > deal.price
      ? Math.round(((deal.originalPrice - deal.price) / deal.originalPrice) * 100)
      : null;

  const discountStr = discountPercent ? ` (-${discountPercent}%)` : '';
  const origPriceStr = deal.originalPrice ? `\n🏷️ De: R$ ${deal.originalPrice.toFixed(2)}` : '';
  const mlPriceStr = deal.mlPrice ? `\n🛒 Preço no ML: R$ ${deal.mlPrice.toFixed(2)}` : '';
  const profitStr = deal.netProfit !== undefined ? `\n💰 Lucro Líquido Estimado: R$ ${deal.netProfit.toFixed(2)}` : '';
  const roiStr = deal.roiPercent !== undefined ? ` (ROI: ${deal.roiPercent}%)` : '';

  const messageText = `🎯 <b>DEAL HUNTER PRO • ÓTIMA OPORTUNIDADE!</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📦 <b>${escapeHtml(deal.title)}</b>\n` +
    `🏪 <b>Loja:</b> ${escapeHtml(deal.store || 'Online')}\n` +
    `${origPriceStr}` +
    `🔥 <b>Preço Promo:</b> R$ ${deal.price.toFixed(2)}${discountStr}` +
    `${mlPriceStr}` +
    `${profitStr}${roiStr}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🔗 <b>Link da Oferta:</b> <a href="${deal.productUrl}">Acessar Produto</a>` +
    (deal.mlUrl ? `\n🛒 <b>Anúncio ML:</b> <a href="${deal.mlUrl}">Ver no Mercado Livre</a>` : '');

  try {
    const url = `https://api.telegram.org/bot${botToken.trim()}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        text: messageText,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }),
      signal: AbortSignal.timeout(8000),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.description || `HTTP ${res.status}` };
    }

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Falha de conexão com Telegram' };
  }
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
