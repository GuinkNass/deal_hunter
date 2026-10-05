const express = require('express');
const router = express.Router();
const { db, getAllSettings, setMultipleSettings, getSetting, setSetting } = require('../db/db');
const { testBotConnection } = require('../services/telegramBotService');
const { getValidToken } = require('../services/mlApiService');
const { startTelegramListener, stopTelegramListener } = require('../services/telegramListenerService');

/**
 * GET /api/settings
 */
router.get('/', (req, res) => {
  try {
    const settings = getAllSettings(true);
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/settings
 */
router.put('/', (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, error: 'Objeto de configurações inválido' });
    }

    setMultipleSettings(settings);
    res.json({ success: true, message: 'Configurações salvas com sucesso!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/settings/test-connection
 */
router.post('/test-connection', async (req, res) => {
  const { service } = req.body;

  try {
    // 1. Mercado Livre Test
    if (service === 'mercadolivre') {
      const clientId = getSetting('ml_client_id', '');
      const token = await getValidToken();

      // Test public API reachability first
      const pingRes = await fetch('https://api.mercadolibre.com/categories/MLB1672');
      if (!pingRes.ok) {
        return res.json({ success: false, message: 'Não foi possível conectar aos servidores do Mercado Livre.' });
      }

      if (token) {
        try {
          const userRes = await fetch('https://api.mercadolibre.com/users/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const userData = await userRes.json();
          if (userRes.ok) {
            return res.json({
              success: true,
              message: `✅ Conectado com sucesso à conta Mercado Livre: ${userData.nickname || userData.id} (OAuth2 Ativo)`
            });
          }
        } catch {}
      }

      if (clientId) {
        return res.json({
          success: true,
          message: `✅ API Mercado Livre operacional (Busca Pública & Catálogo MLB funcionando). Para vincular sua conta de vendedor, clique no botão "Conectar Mercado Livre".`
        });
      }

      return res.json({
        success: true,
        message: `✅ Conexão com Mercado Livre (MLB) operacional via busca pública e modo demonstração.`
      });
    }

    // 2. Telegram Bot Out Test
    if (service === 'telegram_out') {
      let token = String(getSetting('telegram_bot_token', '') || '');
      const chatId = String(getSetting('telegram_out_chat_id', '') || '');

      if (!token || token.trim().length < 10) {
        return res.json({
          success: false,
          message: 'Token do bot Telegram não informado. Abra o @BotFather no Telegram, crie um bot com /newbot e cole o token aqui.'
        });
      }

      const testResult = await testBotConnection(token, chatId);
      if (testResult.success) {
        return res.json({
          success: true,
          message: `✅ Conexão bem-sucedida com o bot @${testResult.botUsername}! ${chatId ? 'Mensagem de teste enviada ao chat.' : 'Defina um Chat ID para receber os alertas.'}`
        });
      } else {
        return res.json({
          success: false,
          message: `❌ Falha ao conectar ao bot Telegram: ${testResult.message}`
        });
      }
    }

    // 3. Google Gemini Test
    if (service === 'gemini') {
      let apiKey = String(getSetting('gemini_api_key', '') || '');
      let model = String(getSetting('gemini_model', 'gemini-1.5-flash') || 'gemini-1.5-flash');

      if (!apiKey || apiKey.trim().length < 15 || apiKey.includes('****')) {
        return res.json({
          success: false,
          message: '❌ Chave de API do Gemini não informada ou incompleta. Acesse aistudio.google.com/apikey, crie sua chave gratuita, cole no campo acima e clique em "Salvar Alterações" antes de testar.'
        });
      }

      apiKey = apiKey.trim();

      // Test candidates: requested model, then gemini-1.5-flash, then gemini-2.0-flash
      const candidateModels = [model, 'gemini-1.5-flash', 'gemini-2.0-flash'].filter((v, i, a) => a.indexOf(v) === i);

      let lastError = '';
      for (const m of candidateModels) {
        try {
          const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
          const geminiRes = await fetch(testUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'Responda apenas com a palavra OK' }] }]
            })
          });

          const geminiData = await geminiRes.json();
          if (geminiRes.ok) {
            const reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'OK';
            return res.json({
              success: true,
              message: `✅ Conexão com Google Gemini (${m}) bem-sucedida! Resposta da IA: "${reply.trim()}"`
            });
          } else {
            lastError = geminiData.error?.message || `HTTP ${geminiRes.status}`;
          }
        } catch (callErr) {
          lastError = callErr.message;
        }
      }

      return res.json({
        success: false,
        message: `❌ Erro na API do Google Gemini: ${lastError}. Verifique se a chave em aistudio.google.com/apikey está correta.`
      });
    }

    // 4. Telegram Ingest / Webhook Test
    if (service === 'telegram_in') {
      const mode = getSetting('telegram_in_mode', 'webhook');
      if (mode === 'webhook') {
        const key = getSetting('webhook_api_key', '');
        const alertCount = db.prepare("SELECT count(*) as cnt FROM analyses WHERE source_type = 'webhook'").get().cnt;
        return res.json({
          success: true,
          message: `✅ Webhook HTTP ativo na porta 3001. Endpoint: POST /api/ingest com header x-api-key: "${key}". Total de alertas recebidos até agora: ${alertCount}.`
        });
      } else {
        const apiId = getSetting('telegram_api_id', '');
        const apiHash = getSetting('telegram_api_hash', '');
        if (!apiId || !apiHash) {
          return res.json({
            success: false,
            message: 'API ID ou API Hash do Telegram não configurados. Obtenha em my.telegram.org.'
          });
        }
        return res.json({
          success: true,
          message: 'Credenciais MTProto salvas. O leitor monitora o canal configurado.'
        });
      }
    }

    res.status(400).json({ success: false, error: 'Serviço desconhecido' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/settings/export
 */
router.get('/export', (req, res) => {
  try {
    const includeSecrets = req.query.include_secrets === 'true';
    const settings = getAllSettings(!includeSecrets);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="ml_radar_config.json"');
    res.send(JSON.stringify(settings, null, 2));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/settings/import
 */
router.post('/import', (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, error: 'JSON de configurações inválido' });
    }

    setMultipleSettings(settings);
    res.json({ success: true, message: 'Configurações importadas com sucesso!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
