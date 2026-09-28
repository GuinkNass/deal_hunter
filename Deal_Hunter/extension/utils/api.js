// Cliente simples para falar com o backend local do Deal Hunter.
// Guarda a URL base e o token de pareamento no chrome.storage.local.

const DEFAULT_BASE_URL = 'http://127.0.0.1:3000';

async function getConfig() {
  const { baseUrl, apiToken } = await chrome.storage.local.get(['baseUrl', 'apiToken']);
  let cleanUrl = String(baseUrl || DEFAULT_BASE_URL).trim().replace(/\/+$/, '');

  // Se o usuário acidentalmente colou a URL da Vercel no campo de backend local
  if (cleanUrl.includes('vercel.app')) {
    cleanUrl = DEFAULT_BASE_URL;
  }
  // Normaliza localhost para 127.0.0.1 (evita falha de resolução IPv6 no Windows)
  cleanUrl = cleanUrl.replace('://localhost', '://127.0.0.1');

  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `http://${cleanUrl}`;
  }

  const cleanToken = typeof apiToken === 'string' ? apiToken.trim() : null;
  return { baseUrl: cleanUrl, apiToken: cleanToken || null };
}

async function setApiToken(token) {
  await chrome.storage.local.set({ apiToken: token });
}

async function ping() {
  const { baseUrl } = await getConfig();
  const response = await fetch(`${baseUrl}/api/status/ping`);
  if (!response.ok) throw new Error(`Backend respondeu com HTTP ${response.status}`);
  return response.json();
}

async function request(path, { method = 'GET', body, timeoutMs = 60000 } = {}) {
  const { baseUrl, apiToken } = await getConfig();
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (response.status === 401) {
    throw new Error('Token não configurado ou inválido. Abra as Configurações da extensão.');
  }
  if (!response.ok) {
    let message = `Erro ${response.status}`;
    try {
      const data = await response.json();
      message = data.error || message;
    } catch {
      // resposta sem corpo JSON
    }
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json();
}

const api = {
  getConfig,
  setApiToken,
  ping,
  getStatus: () => request('/api/status'),
  getCategories: () => request('/api/catalog/categories'),
  saveCategories: (selectedIds) => request('/api/catalog/categories', { method: 'PUT', body: { selectedIds } }),
  getScanConfig: () => request('/api/scan/config'),
  runScanNow: () => request('/api/scan/run', { method: 'POST', timeoutMs: 120000 }),
  submitBrowserPages: (pages, scanId, complete = true) => request('/api/scan/browser-pages', {
    method: 'POST', body: { pages, ...(scanId ? { scanId } : {}), complete },
    timeoutMs: 180000,
  }),
  cancelBrowserScan: (scanId) => request('/api/scan/browser-pages/cancel', { method: 'POST', body: { scanId }, timeoutMs: 2000 }),
  getHistory: (q) => request(`/api/history${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  clearHistory: () => request('/api/history', { method: 'DELETE' }),
  getTelegramStatus: () => request('/api/telegram/status'),
  configureTelegram: (botToken, chatId) => request('/api/telegram/configure', { method: 'POST', body: { botToken, chatId } }),
  testTelegram: () => request('/api/telegram/test', { method: 'POST' }),
  removeTelegram: () => request('/api/telegram/configure', { method: 'DELETE' }),
  getSettings: () => request('/api/settings'),
  saveSettings: (payload) => request('/api/settings', { method: 'POST', body: payload }),
};

if (typeof module !== 'undefined') module.exports = api;
