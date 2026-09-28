const express = require('express');
const telegramClient = require('../telegram/telegramClient');

const router = express.Router();

router.get('/status', (req, res) => {
  const { configured, botToken } = telegramClient.getConfig();
  res.json({ configured, maskedToken: telegramClient.maskToken(botToken) });
});

router.post('/configure', (req, res) => {
  const { botToken, chatId } = req.body || {};
  if (!botToken || !chatId) {
    return res.status(400).json({ error: 'Informe Bot Token e Chat ID.' });
  }
  telegramClient.setConfig({ botToken, chatId });
  res.json({ ok: true });
});

router.post('/test', async (req, res) => {
  const result = await telegramClient.sendTestMessage();
  if (!result.ok) {
    return res.status(400).json({
      ok: false,
      error: result.error || 'Não foi possível enviar a mensagem. Verifique o Bot Token e Chat ID.',
    });
  }
  res.json({ ok: true, message: 'Telegram configurado com sucesso.' });
});

router.delete('/configure', (req, res) => {
  telegramClient.clearConfig();
  res.status(204).end();
});

module.exports = router;
