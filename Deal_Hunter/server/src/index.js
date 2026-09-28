const express = require('express');
const cors = require('cors');
const { config } = require('./config');
const { initDatabase } = require('./database/db');
const logger = require('./utils/logger');

// Inicialize o esquema antes de carregar rotas que preparam statements SQL.
initDatabase();
// O middleware também prepara statements no carregamento e depende do schema.
const { authMiddleware, ensureToken, TOKEN_FILE } = require('./middleware/auth');
const { startScheduler } = require('./monitors/scheduler');
const token = ensureToken();
const routes = require('./routes');

const app = express();

// Só aceita chamadas de extensões Chrome/Edge locais e de localhost —
// nunca de sites arbitrários na internet.
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === 'http://localhost' || origin.startsWith('http://localhost:') || origin === 'http://127.0.0.1' || origin.startsWith('http://127.0.0.1:') || origin.startsWith('chrome-extension://')) {
      return callback(null, true);
    }
    callback(new Error('Origem não permitida'));
  },
}));
app.use(express.json({ limit: '12mb' }));
app.use('/api', authMiddleware, routes);

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  logger.error(`Erro não tratado: ${err.message}`);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

app.listen(config.port, config.host, () => {
  logger.info(`Deal Hunter backend rodando em http://${config.host}:${config.port}`);
  logger.info(`Token local salvo em: ${TOKEN_FILE}`);
  console.log('\n========================================');
  console.log(' DEAL HUNTER — backend local ativo');
  console.log(`  URL: http://${config.host}:${config.port}`);
  console.log(`  Token de pareamento da extensão: ${token}`);
  console.log(`  (também salvo em ${TOKEN_FILE})`);
  console.log('========================================\n');
  startScheduler();
});
