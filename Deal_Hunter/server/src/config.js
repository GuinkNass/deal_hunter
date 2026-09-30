require('dotenv').config();
const path = require('node:path');

const config = {
  // Porta dinâmica do ambiente (Render usa process.env.PORT dinâmico)
  port: Number(process.env.PORT) || 3000,
  // 0.0.0.0 é obrigatório para containers e nuvem (Render, Railway, Fly.io, etc.)
  host: process.env.HOST || '0.0.0.0',
  // URL de conexão com o PostgreSQL fornecida pelo Render
  databaseUrl: process.env.DATABASE_URL || null,
  // Fallback para arquivo SQLite local se DATABASE_URL não estiver configurada
  databasePath: process.env.DATABASE_PATH || path.resolve(__dirname, '../data/deal-hunter.db'),
  // Token mestre opcional da API que pode ser definido nas variáveis de ambiente do Render
  apiToken: process.env.API_TOKEN || null,
  // URL do portal web para redirecionamento e validação de licença
  webAuthUrl: process.env.WEB_AUTH_URL || 'https://deal-hunter-guilhermernascimento-9353s-projects.vercel.app',
};

module.exports = { config };
