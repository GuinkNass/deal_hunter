const { getSetting } = require('../db/db');

/**
 * Send deal notification card to Telegram bot
 */
async function sendDealAlert(analysis) {
  const botToken = getSetting('telegram_bot_token', '');
  const chatId = getSetting('telegram_out_chat_id', '');
  const minROI = Number(getSetting('telegram_notify_min_roi', 25));

  if (!botToken || !chatId) {
    console.log('[Telegram Bot] Bot token ou Chat ID não configurados. Notificação ignorada.');
    return { sent: false, reason: 'unconfigured' };
  }

  // Check ROI threshold
  if (analysis.roi_percent < minROI) {
    console.log(`[Telegram Bot] Alerta ignorado: ROI ${analysis.roi_percent}% < Mínimo configurado (${minROI}%)`);
    return { sent: false, reason: 'roi_below_threshold' };
  }

  const verdictEmoji = analysis.verdict === 'Viável' ? '🟢 VIÁVEL' :
                       analysis.verdict === 'Atenção' ? '🟡 ATENÇÃO' : '🔴 EVITAR';

  // Parse Gemini analysis if available
  let geminiData = {};
  if (analysis.gemini_analysis_json) {
    try {
      geminiData = typeof analysis.gemini_analysis_json === 'string'
        ? JSON.parse(analysis.gemini_analysis_json)
        : analysis.gemini_analysis_json;
    } catch {}
  }

  const caption = `
🚀 *ML RADAR • NOVA OPORTUNIDADE DETECTADA*
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏷️ *Produto (Origem - ${analysis.store_name || 'Loja Online'}):*
[${escapeMarkdown(analysis.source_title)}](${analysis.source_url})
💰 *Preço Promoção:* R$ ${Number(analysis.source_price).toFixed(2)} ${analysis.source_discount_percent ? `(-${analysis.source_discount_percent}%)` : ''}

🛒 *Melhor Anúncio no Mercado Livre:*
[${escapeMarkdown(analysis.ml_title || 'Anúncio ML')}](${analysis.ml_url})
💵 *Preço Venda ML:* R$ ${Number(analysis.ml_price || 0).toFixed(2)}
📦 *Modalidade:* ${analysis.ml_listing_type === 'gold_pro' ? 'Premium (17%)' : 'Clássico (12%)'} ${analysis.ml_is_full ? '⚡ FULL' : ''} ${analysis.ml_free_shipping ? '🚚 Frete Grátis' : ''}

📊 *MÉTRICAS DE MERCADO:*
• Vendas Totais: *${analysis.ml_sold_quantity_text || analysis.ml_sold_quantity}*
• Tempo no Ar: *${analysis.ml_days_active || 0} dias*
• Vendedor: *${escapeMarkdown(analysis.ml_seller_name || '')}* (${analysis.ml_seller_positive_rate || 98}% positivas)
• Avaliação: ⭐ ${analysis.ml_product_rating_avg || 4.7}/5 (${analysis.ml_product_reviews_count || 0} avaliações)

📈 *ANÁLISE FINANCEIRA:*
• Lucro Líquido: *R$ ${Number(analysis.net_profit || 0).toFixed(2)}*
• ROI: *${Number(analysis.roi_percent || 0).toFixed(1)}%* | Margem: *${Number(analysis.margin_percent || 0).toFixed(1)}%*
• Custos (Comissão R$ ${Number(analysis.commission_fee || 0).toFixed(2)} + Frete R$ ${Number(analysis.shipping_cost || 0).toFixed(2)})
• Veredito: *${verdictEmoji}*

🧠 *INSIGHT GOOGLE GEMINI (Nota ${geminiData.score || 80}/100):*
• *Demanda:* ${escapeMarkdown(geminiData.demandTrend || 'Alta')}
• *Risco:* ${geminiData.riskLevel || 'Baixo'}
• *Resumo:* ${escapeMarkdown(geminiData.justification || 'Excelente oportunidade de arbitragem.')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();

  const dashboardUrl = `http://localhost:5173/?analysis=${analysis.id}`;

  const replyMarkup = {
    inline_keyboard: [
      [
        { text: '🛒 Ver Anúncio ML', url: analysis.ml_url || 'https://mercadolivre.com.br' },
        { text: '🏷️ Ver na Loja Origem', url: analysis.source_url }
      ],
      [
        { text: '📊 Abrir no Dashboard Web', url: dashboardUrl }
      ]
    ]
  };

  try {
    let telegramRes;
    const photoUrl = analysis.source_image_url || analysis.ml_image_url;

    if (photoUrl && photoUrl.startsWith('http')) {
      // Send Photo with caption
      telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          photo: photoUrl,
          caption: caption.substring(0, 1024), // Telegram caption limit is 1024 chars
          parse_mode: 'Markdown',
          reply_markup: replyMarkup
        })
      });
    } else {
      // Send standard text message
      telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: caption,
          parse_mode: 'Markdown',
          reply_markup: replyMarkup
        })
      });
    }

    const data = await telegramRes.json();
    if (!telegramRes.ok) {
      console.error('[Telegram Bot] Erro ao enviar mensagem:', data.description);
      return { sent: false, error: data.description };
    }

    return { sent: true, messageId: data.result?.message_id };
  } catch (err) {
    console.error('[Telegram Bot] Exceção ao enviar:', err.message);
    return { sent: false, error: err.message };
  }
}

/**
 * Escape markdown characters for Telegram
 */
function escapeMarkdown(text) {
  if (!text) return '';
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

/**
 * Test Telegram bot connection and send test ping
 */
async function testBotConnection(token, chatId) {
  try {
    const getMeRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const meData = await getMeRes.json();
    if (!getMeRes.ok) {
      return { success: false, message: meData.description || 'Token inválido' };
    }

    if (chatId) {
      const sendRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `🔔 *ML Radar - Teste de Conexão*\n\nConexão com o bot @${meData.result.username} realizada com sucesso!`,
          parse_mode: 'Markdown'
        })
      });
      const sendData = await sendRes.json();
      if (!sendRes.ok) {
        return { success: false, message: `Bot OK (@${meData.result.username}), mas falhou ao enviar para Chat ID: ${sendData.description}` };
      }
    }

    return { success: true, botUsername: meData.result.username };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

module.exports = {
  sendDealAlert,
  testBotConnection
};
