const express = require('express');
const router = express.Router();
const { db, getSetting } = require('../db/db');
const { getQueueStatus } = require('../services/queueService');
const { getListenerStatus } = require('../services/telegramListenerService');

router.get('/', async (req, res) => {
  try {
    const mlClientId = String(getSetting('ml_client_id', '') || '').trim();
    const mlToken = String(getSetting('ml_access_token', '') || '').trim();
    const mlExpiresAt = Number(getSetting('ml_token_expires_at', 0));
    const isTokenValid = Boolean(mlToken && mlExpiresAt > Date.now());

    // Check if public MLB API is reachable
    let mlPublicReachable = true;
    try {
      const mlPing = await fetch('https://api.mercadolibre.com/categories/MLB1672');
      mlPublicReachable = mlPing.ok;
    } catch {
      mlPublicReachable = false;
    }

    const tgBotToken = String(getSetting('telegram_bot_token', '') || '').trim();
    const tgChatId = String(getSetting('telegram_out_chat_id', '') || '').trim();

    const geminiKey = String(getSetting('gemini_api_key', '') || '').trim();
    const geminiModel = getSetting('gemini_model', 'gemini-1.5-flash');
    const geminiEnabled = Number(getSetting('gemini_enabled', 1)) === 1;

    const queue = getQueueStatus();
    const telegramInStatus = getListenerStatus();

    // Stats from DB
    const totalAnalyses = db.prepare('SELECT count(*) as cnt FROM analyses').get().cnt;
    const viableAnalyses = db.prepare("SELECT count(*) as cnt FROM analyses WHERE verdict = 'Viável'").get().cnt;
    const attentionAnalyses = db.prepare("SELECT count(*) as cnt FROM analyses WHERE verdict = 'Atenção'").get().cnt;
    const avoidAnalyses = db.prepare("SELECT count(*) as cnt FROM analyses WHERE verdict = 'Evitar'").get().cnt;
    const webhookCount = db.prepare("SELECT count(*) as cnt FROM analyses WHERE source_type = 'webhook'").get().cnt;
    const lastAnalysis = db.prepare('SELECT created_at FROM analyses ORDER BY created_at DESC LIMIT 1').get();

    const isDemo = Number(getSetting('demo_mode', 1)) === 1;

    // Determine honest ML Status
    let mlStatus = 'demo_operational';
    let mlStatusLabel = 'Operacional (Busca MLB Ativa)';
    if (isTokenValid) {
      mlStatus = 'connected_oauth';
      mlStatusLabel = 'Conectado via OAuth2 (Token Ativo)';
    } else if (mlClientId) {
      mlStatus = 'configured_public';
      mlStatusLabel = 'Client ID Salvo • Busca Pública MLB Ativa';
    } else if (isDemo) {
      mlStatus = 'demo_operational';
      mlStatusLabel = 'Operacional (Modo Demonstração & Busca MLB)';
    }

    res.json({
      success: true,
      data: {
        integrations: {
          mercadolivre: {
            status: mlStatus,
            statusLabel: mlStatusLabel,
            configured: Boolean(mlClientId),
            connected: isTokenValid,
            tokenExpiresAt: mlExpiresAt,
            publicReachable: mlPublicReachable,
            demoMode: isDemo
          },
          telegram_out: {
            configured: Boolean(tgBotToken && tgBotToken.length > 15),
            chatIdConfigured: Boolean(tgChatId),
            status: Boolean(tgBotToken && tgChatId) ? 'ready' : 'pending'
          },
          telegram_in: {
            ...telegramInStatus,
            webhookAlertsReceived: webhookCount,
            status: webhookCount > 0 ? 'receiving' : 'waiting'
          },
          gemini: {
            hasKey: Boolean(geminiKey && geminiKey.length > 10 && !geminiKey.includes('****')),
            enabled: geminiEnabled,
            model: geminiModel,
            status: Boolean(geminiKey && geminiKey.length > 10) ? 'key_configured' : 'no_key'
          }
        },
        queue,
        stats: {
          totalAnalyses,
          viableAnalyses,
          attentionAnalyses,
          avoidAnalyses,
          webhookCount,
          lastAnalysisAt: lastAnalysis ? lastAnalysis.created_at : null
        },
        demoMode: isDemo
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
