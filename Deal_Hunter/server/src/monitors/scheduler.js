const settingsStore = require('../database/settingsStore');
const { runScan } = require('./scanner');
const logger = require('../utils/logger');

const DEFAULT_INTERVAL_MINUTES = 30;

function getIntervalMinutes() {
  const value = Number(settingsStore.get('scan_interval_minutes', DEFAULT_INTERVAL_MINUTES));
  return value >= 15 ? value : DEFAULT_INTERVAL_MINUTES;
}

// A extensão faz a leitura dentro do Chrome para aproveitar páginas renderizadas
// e a sessão que o próprio usuário abriu. O backend não usa nem copia cookies.
function scheduleFromSettings() {
  logger.info(`Agendamento da varredura delegado à extensão Chrome (intervalo configurado: ${getIntervalMinutes()} minuto(s)).`);
}

function startScheduler() {
  scheduleFromSettings();
}

async function runCycle() {
  return runScan();
}

module.exports = { startScheduler, scheduleFromSettings, runCycle };
