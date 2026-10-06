const express = require('express');
const cors = require('cors');
const { config } = require('./config');
const { initDatabase, isPostgres } = require('./database/db');
const { loadSettingsCache } = require('./database/settingsStore');
const logger = require('./utils/logger');

let dbReady = false;
let dbError = null;

async function bootstrap() {
  const app = express();

  // Configuração universal de CORS: aceita extensões do Chrome/Edge/Firefox, localhost e Vercel sem falhas de preflight
  const corsMiddleware = cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-deal-hunter-token', 'Accept'],
  });
  app.use(corsMiddleware);
  app.options('*', corsMiddleware);

  app.use(express.json({ limit: '35mb' }));

  // Endpoint de health-check para monitoramento do Render / uptime monitors (responde 200 imediatamente)
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'deal-hunter-server',
      database: isPostgres ? 'postgresql' : 'sqlite',
      database_ready: dbReady,
      database_error: dbError ? dbError.message : null,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/', (req, res) => {
    res.json({
      service: 'Deal Hunter API',
      status: 'online',
      version: '2.0.0',
      cloud: isPostgres ? 'Render (PostgreSQL)' : 'Local (SQLite)',
      database_ready: dbReady,
    });
  });

  app.get('/login', (req, res) => {
    const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    res.redirect(`${config.webAuthUrl}/login${query}`);
  });

  // Abre a porta do servidor para o Render detectar o health check imediatamente
  const server = app.listen(config.port, config.host, () => {
    logger.info(`Deal Hunter backend rodando na porta ${config.port} (host: ${config.host})`);
  });

  try {
    // 1. Inicializa o banco de dados (PostgreSQL no Render ou SQLite local)
    await initDatabase();
    // 2. Carrega as configurações para o cache em memória
    await loadSettingsCache();
    dbReady = true;
  } catch (err) {
    dbError = err;
    logger.error(`Aviso durante inicialização do banco: ${err.message}`);
  }

  // Middleware de autenticação e scheduler
  const { authMiddleware, ensureToken, TOKEN_FILE } = require('./middleware/auth');
  const { startScheduler } = require('./monitors/scheduler');
  const token = ensureToken();
  const routes = require('./routes');

  // Rotas da API protegidas por token
  app.use('/api', authMiddleware, routes);

  app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    logger.error(`Erro não tratado: ${err.message}`);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  });

  console.log('\n========================================');
  console.log(` DEAL HUNTER — Nuvem Ativa (${isPostgres ? 'PostgreSQL' : 'SQLite'})`);
  console.log(`  Porta: ${config.port} | Host: ${config.host}`);
  console.log(`  Token de autenticação: ${token}`);
  if (!isPostgres) console.log(`  Arquivo de token: ${TOKEN_FILE}`);
  console.log('========================================\n');
  startScheduler();

  return server;
}

bootstrap().catch((err) => {
  logger.error(`Falha fatal na inicialização: ${err.stack || err.message}`);
  console.error('Erro na inicialização:', err);
  process.exit(1);
});
