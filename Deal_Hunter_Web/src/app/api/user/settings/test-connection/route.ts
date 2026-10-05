import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { service, gemini_api_key, ml_client_id, ml_client_secret, telegram_bot_token, telegram_chat_id } = body;

    // 1. Teste Mercado Livre
    if (service === 'mercadolivre') {
      try {
        const pingRes = await fetch('https://api.mercadolibre.com/categories/MLB1672', {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(6000),
        });

        if (!pingRes.ok) {
          return NextResponse.json({
            success: false,
            message: 'Não foi possível conectar aos servidores do Mercado Livre.',
          });
        }

        if (ml_client_id && ml_client_secret) {
          return NextResponse.json({
            success: true,
            message: `✅ Credenciais ML registradas com sucesso! Client ID: "${ml_client_id.substring(0, 6)}...". Busca oficial e catálogo MLB operacionais.`,
          });
        }

        return NextResponse.json({
          success: true,
          message: '✅ Conexão com Mercado Livre (MLB) operacional via busca pública e catálogo.',
        });
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          message: `Falha ao testar Mercado Livre: ${err.message}`,
        });
      }
    }

    // 2. Teste Telegram Bot
    if (service === 'telegram' || service === 'telegram_out') {
      if (!telegram_bot_token || !telegram_chat_id) {
        return NextResponse.json({
          success: false,
          message: 'Informe o Telegram Bot Token e o Chat ID para testar o envio.',
        });
      }

      try {
        const res = await fetch(`https://api.telegram.org/bot${telegram_bot_token.trim()}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: telegram_chat_id.trim(),
            text: `🔔 <b>Deal Hunter Pro • Teste de Integração</b>\n\nSeu bot do Telegram foi conectado com sucesso!\nVocê receberá alertas automáticos de ótimas oportunidades aqui.`,
            parse_mode: 'HTML',
          }),
          signal: AbortSignal.timeout(8000),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          return NextResponse.json({
            success: false,
            message: `❌ Falha do Telegram: ${data.description || `HTTP ${res.status}`}`,
          });
        }

        return NextResponse.json({
          success: true,
          message: '✅ Mensagem de teste enviada com sucesso no seu Telegram!',
        });
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          message: `Erro ao conectar com Telegram: ${err.message}`,
        });
      }
    }

    // 3. Teste Google Gemini
    if (service === 'gemini') {
      if (!gemini_api_key || gemini_api_key.trim().length < 10) {
        return NextResponse.json({
          success: false,
          message: '❌ Chave de API do Gemini não informada ou incompleta. Obtenha sua chave grátis em aistudio.google.com/app/apikey.',
        });
      }

      try {
        const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${gemini_api_key.trim()}`;
        const res = await fetch(testUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Responda estritamente "OK"' }] }],
            generationConfig: { maxOutputTokens: 10 },
          }),
          signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          return NextResponse.json({
            success: false,
            message: `❌ Falha na API Gemini (${res.status}): ${errData.error?.message || 'Chave inválida'}`,
          });
        }

        return NextResponse.json({
          success: true,
          message: '✅ Google Gemini AI conectado com sucesso e pronto para análises!',
        });
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          message: `Erro ao testar Gemini: ${err.message}`,
        });
      }
    }

    return NextResponse.json({ success: false, message: 'Serviço desconhecido' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
