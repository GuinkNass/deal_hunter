const fs = require('node:fs');
const path = require('node:path');

const logDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'deal-hunter.log');

// Guarda as últimas N linhas em memória para expor via GET /api/status ou logs futuros
const MAX_MEMORY_LINES = 300;
const memoryLog = [];

function write(level, message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level}] ${message}`;
  // eslint-disable-next-line no-console
  console.log(line);
  memoryLog.push({ timestamp, level, message });
  if (memoryLog.length > MAX_MEMORY_LINES) memoryLog.shift();
  try {
    fs.appendFileSync(logFile, line + '\n');
  } catch {
    // não deixar falha de log derrubar a aplicação
  }
}

module.exports = {
  info: (msg) => write('INFO', msg),
  warn: (msg) => write('WARNING', msg),
  error: (msg) => write('ERROR', msg),
  getRecent: (limit = 100) => memoryLog.slice(-limit),
};
