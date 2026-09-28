const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { config } = require('../config');
const settingsStore = require('../database/settingsStore');
const logger = require('../utils/logger');

const TOKEN_KEY = 'local_api_token';
const TOKEN_FILE = path.join(path.dirname(path.resolve(config.databasePath)), 'extension-token.txt');

// Rotas que não exigem token (apenas leitura de status básico, sem dados sensíveis)
const PUBLIC_PATHS = new Set(['/status/ping']);

function ensureToken() {
  let token = settingsStore.get(TOKEN_KEY);
  if (!token) {
    token = crypto.randomBytes(32).toString('hex');
    settingsStore.set(TOKEN_KEY, token);
    logger.info('Token local de autenticação gerado.');
  }
  try {
    fs.writeFileSync(TOKEN_FILE, token, 'utf-8');
  } catch {
    // não crítico
  }
  return token;
}

function authMiddleware(req, res, next) {
  if (PUBLIC_PATHS.has(req.path)) return next();

  const token = ensureToken();
  const header = req.headers.authorization || '';
  const rawProvided = header.startsWith('Bearer ') ? header.slice(7) : req.headers['x-deal-hunter-token'];
  const provided = typeof rawProvided === 'string' ? rawProvided.trim() : '';

  if (!provided || provided !== token) {
    return res.status(401).json({ error: 'Token inválido ou ausente. Configure o token na extensão.' });
  }
  next();
}

module.exports = { authMiddleware, ensureToken, TOKEN_FILE };
