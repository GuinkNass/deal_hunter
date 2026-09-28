require('dotenv').config();
const path = require('node:path');

const config = {
  port: Number(process.env.PORT) || 3000,
  host: process.env.HOST || '127.0.0.1',
  databasePath: process.env.DATABASE_PATH || path.resolve(__dirname, '../data/deal-hunter.db'),
};

module.exports = { config };
