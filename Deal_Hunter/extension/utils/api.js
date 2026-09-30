// Cliente de comunicação com a API remota do Deal Hunter Pro na nuvem (Render)
// Centraliza requisições autenticadas, tokens de sessão e status do monitoramento.

const DEFAULT_CLOUD_URL = typeof CONFIG !== 'undefined'
  ? CONFIG.getDefaultApiUrl()
  : 'https://deal-hunter-server.onrender.com';

const DEV_ADMIN_EMAIL = 'guilherme.r.nascimentoml@gmail.com';

async function getConfig() {
  const { baseUrl, apiToken, auth_token, auth_user, licenseStatus } = await chrome.storage.local.get([
    'baseUrl',
    'apiToken',
    'auth_token',
    'auth_user',
    'licenseStatus',
  ]);

  const userEmail = (licenseStatus?.email || auth_user?.email || '').trim().toLowerCase();
  const isDevAdmin = userEmail === DEV_ADMIN_EMAIL;

  let cleanUrl = String(baseUrl || DEFAULT_CLOUD_URL).trim().replace(/\/+$/, '');

  // Para qualquer outro usuário que não seja o desenvolvedor (ou deslogado),
  // a extensão conecta nativamente e exclusivamente à URL de produção da nuvem.
  if (!isDevAdmin) {
    cleanUrl = typeof CONFIG !== 'undefined'
      ? CONFIG.PRODUCTION_API_URL
      : 'https://deal-hunter-server.onrender.com';
  } else {
    // Para o dev admin, se colou link da Vercel no campo de API do backend, normaliza
    if (cleanUrl.includes('vercel.app')) {
      cleanUrl = DEFAULT_CLOUD_URL;
    }
  }

  // Normaliza localhost para 127.0.0.1 se estiver usando dev local
  if (cleanUrl.includes('://localhost')) {
    cleanUrl = cleanUrl.replace('://localhost', '://127.0.0.1');
  }

  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`;
  }

  // O token pode vir do login web na nuvem (auth_token JWT) ou de configuração manual (apiToken)
  const token = (typeof auth_token === 'string' && auth_token.trim())
    || (typeof apiToken === 'string' && apiToken.trim())
    || null;

  return { baseUrl: cleanUrl, apiToken: token };
}

async function setApiToken(token) {
  await chrome.storage.local.set({ apiToken: token ? String(token).trim() : null });
}

async function setBaseUrl(url) {
  await chrome.storage.local.set({ baseUrl: url ? String(url).trim() : null });
}

async function ping() {
  const { baseUrl } = await getConfig();
  try {
    const response = await fetch(`${baseUrl}/api/status/ping`, {
      signal: AbortSignal.timeout(35000),
    });
    if (!response.ok) throw new Error(`API na nuvem respondeu com HTTP ${response.status}`);
    return response.json();
  } catch (err) {
    if (err.name === 'TimeoutError' || (err.message && err.message.includes('fetch'))) {
      throw new Error('Servidor na nuvem iniciando ou indisponível. Aguarde alguns instantes...');
    }
    throw err;
  }
}

async function checkHealth() {
  const { baseUrl } = await getConfig();
  try {
    const response = await fetch(`${baseUrl}/health`, {
      signal: AbortSignal.timeout(35000),
    });
    if (!response.ok) throw new Error(`Health check falhou: HTTP ${response.status}`);
    return response.json();
  } catch (err) {
    if (err.name === 'TimeoutError' || (err.message && err.message.includes('fetch'))) {
      throw new Error('Servidor na nuvem iniciando ou indisponível.');
    }
    throw err;
  }
}

async function request(path, { method = 'GET', body, timeoutMs = 60000 } = {}) {
  const { baseUrl, apiToken } = await getConfig();
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
        ...(apiToken ? { 'x-deal-hunter-token': apiToken } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    if (err.name === 'TimeoutError' || (err.message && err.message.includes('fetch'))) {
      throw new Error('Não foi possível conectar ao servidor na nuvem. Aguarde alguns instantes enquanto o serviço desperta.');
    }
    throw err;
  }

  if (response.status === 401) {
    throw new Error('Sessão expirada ou não autenticado. Faça login no popup da extensão.');
  }

  if (!response.ok) {
    let message = `Erro HTTP ${response.status}`;
    try {
      const data = await response.json();
      message = data.error || message;
    } catch {
      // resposta sem JSON
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

const api = {
  getConfig,
  setApiToken,
  setBaseUrl,
  ping,
  checkHealth,
  login: (credentials) => request('/api/auth/login', { method: 'POST', body: credentials }),
  verifyAuth: () => request('/api/auth/verify'),
  getStatus: () => request('/api/status'),
  getCategories: () => request('/api/catalog/categories'),
  saveCategories: (selectedIds) => request('/api/catalog/categories', { method: 'PUT', body: { selectedIds } }),
  getScanConfig: () => request('/api/scan/config'),
  runScanNow: () => request('/api/scan/run', { method: 'POST', timeoutMs: 120000 }),
  submitBrowserPages: (pages, scanId, complete = true) => request('/api/scan/browser-pages', {
    method: 'POST',
    body: { pages, ...(scanId ? { scanId } : {}), complete },
    timeoutMs: 180000,
  }),
  cancelBrowserScan: (scanId) => request('/api/scan/browser-pages/cancel', { method: 'POST', body: { scanId }, timeoutMs: 3000 }),
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
