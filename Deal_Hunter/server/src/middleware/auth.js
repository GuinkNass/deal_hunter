const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { config } = require('../config');
const settingsStore = require('../database/settingsStore');
const logger = require('../utils/logger');

const TOKEN_KEY = 'local_api_token';
const TOKEN_FILE = path.join(path.dirname(path.resolve(config.databasePath)), 'extension-token.txt');

// Rotas públicas que não necessitam de cabeçalho de autenticação
const PUBLIC_PATHS = new Set([
  '/status/ping',
  '/auth/login',
  '/health',
]);

function ensureToken() {
  if (config.apiToken) {
    return config.apiToken;
  }
  let token = settingsStore.get(TOKEN_KEY);
  if (!token) {
    token = crypto.randomBytes(32).toString('hex');
    settingsStore.set(TOKEN_KEY, token);
    logger.info('Token de autenticação gerado e armazenado.');
  }
  try {
    fs.writeFileSync(TOKEN_FILE, token, 'utf-8');
  } catch {
    // Não crítico (pode ser sistema de arquivos somente-leitura em container)
  }
  return token;
}

function getActiveToken() {
  return config.apiToken || ensureToken();
}

function authMiddleware(req, res, next) {
  // Preflight CORS OPTIONS deve passar sem autenticação
  if (req.method === 'OPTIONS') {
    return next();
  }

  // Rotas públicas
  if (PUBLIC_PATHS.has(req.path)) {
    return next();
  }

  const token = getActiveToken();
  const header = req.headers.authorization || '';
  const rawProvided = header.startsWith('Bearer ') ? header.slice(7) : req.headers['x-deal-hunter-token'];
  const provided = typeof rawProvided === 'string' ? rawProvided.trim() : '';

  // Se o servidor tiver bypass ativo (apenas dev) ou token bater
  if (provided && (provided === token || provided === config.apiToken)) {
    return next();
  }

  return res.status(401).json({
    error: 'Token inválido ou ausente. Conecte sua extensão através do popup ou nas configurações.',
  });
}

module.exports = { authMiddleware, ensureToken, getActiveToken, TOKEN_FILE };
