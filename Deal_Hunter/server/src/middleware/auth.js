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
  '/status',
  '/auth/login',
  '/health',
  '/catalog/categories',
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
    // Não crítico
  }
  return token;
}

function getActiveToken() {
  return config.apiToken || ensureToken();
}

/**
 * Valida se a string fornecida é um token JWT bem-formado (ex: Supabase Auth da Vercel).
 */
function parseAndValidateJWT(tokenStr) {
  if (!tokenStr || typeof tokenStr !== 'string') return null;
  const parts = tokenStr.split('.');
  if (parts.length !== 3) return null;

  try {
    const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadJson);

    // Valida expiração se existir o campo 'exp'
    if (payload.exp && typeof payload.exp === 'number') {
      const nowSec = Math.floor(Date.now() / 1000);
      if (nowSec > payload.exp) {
        logger.warn('Token JWT recebido está expirado.');
        return null;
      }
    }

    return payload;
  } catch {
    return null;
  }
}

function authMiddleware(req, res, next) {
  // Preflight CORS OPTIONS sempre passa imediatamente
  if (req.method === 'OPTIONS') {
    return next();
  }

  const serverToken = getActiveToken();
  const header = req.headers.authorization || '';
  const rawProvided = header.startsWith('Bearer ') ? header.slice(7) : req.headers['x-deal-hunter-token'];
  const provided = typeof rawProvided === 'string' ? rawProvided.trim() : '';

  // 1. Se for um JWT do Supabase/Vercel da extensão do usuário, extrai req.user
  if (provided) {
    const jwtPayload = parseAndValidateJWT(provided);
    if (jwtPayload) {
      req.user = jwtPayload;
      isAuthorized = true;
    }
  }

  // 2. Verifica token de API configurado (estilo mestre/ambiente)
  if (!isAuthorized) {
    isAuthorized = Boolean(provided && (provided === serverToken || (config.apiToken && provided === config.apiToken)));
  }

  req.isAuthenticated = isAuthorized;

  // Se a rota for pública, permite a passagem mesmo sem token
  if (PUBLIC_PATHS.has(req.path)) {
    return next();
  }

  if (isAuthorized) {
    return next();
  }

  return res.status(401).json({
    error: 'Token inválido ou ausente. Faça login na extensão para conectar à nuvem.',
    authenticated: false,
  });
}

module.exports = { authMiddleware, ensureToken, getActiveToken, parseAndValidateJWT, TOKEN_FILE };
