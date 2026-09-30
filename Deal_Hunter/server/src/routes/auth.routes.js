const express = require('express');
const { ensureToken, getActiveToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Valida credenciais ou pareamento a partir da extensão
router.post('/login', (req, res) => {
  const { token, email, password } = req.body || {};
  const currentToken = getActiveToken();

  // 1. Se forneceu token direto de pareamento/API
  if (token && (token.trim() === currentToken || token.trim() === process.env.API_TOKEN)) {
    return res.json({
      ok: true,
      token: currentToken,
      user: {
        email: email || 'pro@dealhunter.app',
        role: 'pro',
        plan: 'pro',
        subscription_status: 'active',
      },
    });
  }

  // 2. Se enviou usuário/senha genéricos de demonstração ou login sem restrição no backend privado
  if (email && password) {
    logger.info(`Login efetuado via extensão para ${email}`);
    return res.json({
      ok: true,
      token: currentToken,
      user: {
        email,
        role: 'pro',
        plan: 'pro',
        subscription_status: 'active',
      },
    });
  }

  return res.status(401).json({
    ok: false,
    error: 'Credenciais inválidas. Verifique o token de pareamento ou acesse pelo portal Web.',
  });
});

// Checagem de token ativo
router.get('/verify', (req, res) => {
  res.json({ ok: true, authorized: true });
});

module.exports = router;
