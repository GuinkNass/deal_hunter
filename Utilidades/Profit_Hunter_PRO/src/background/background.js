// ==============================================================================
// Profit Hunter Pro — Service Worker em Segundo Plano
// ==============================================================================
// Gerencia autenticação unificada, verificação de licença e despacho para o Telegram.

try {
  importScripts('../config.js');
} catch (e) {
  console.warn('Config não importado via importScripts:', e);
}

const DEFAULT_WEB_URL = typeof CONFIG !== 'undefined'
  ? CONFIG.WEB_AUTH_URL
  : 'https://deal-hunter-guilhermernascimento-9353s-projects.vercel.app';

const LICENSE_ALARM = 'profit-hunter-license-alarm';

// ---------- Verificação de Licença Unificada ----------
async function verifyLicenseStatus() {
  try {
    const { auth_token } = await chrome.storage.local.get('auth_token');
    if (!auth_token) {
      const unauth = { authorized: false, reason: 'missing_token', checkedAt: Date.now() };
      await chrome.storage.local.set({ licenseStatus: unauth, isLicensed: false });
      await chrome.storage.sync.set({ isLicensed: false });
      return unauth;
    }

    const baseUrl = typeof CONFIG !== 'undefined' ? CONFIG.WEB_AUTH_URL : DEFAULT_WEB_URL;
    const response = await fetch(`${baseUrl}/api/auth/verify-license`, {
      headers: {
        Authorization: `Bearer ${auth_token}`,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const failed = {
        authorized: false,
        reason: err.error || `HTTP ${response.status}`,
        checkedAt: Date.now(),
      };
      await chrome.storage.local.set({ licenseStatus: failed, isLicensed: false });
      await chrome.storage.sync.set({ isLicensed: false });
      return failed;
    }

    const data = await response.json();
    const license = {
      authorized: !!data.authorized,
      role: data.role || 'user',
      plan: data.plan || 'pro',
      status: data.status || 'active',
      is_trial: !!data.is_trial,
      trial_days_left: data.trial_days_left || null,
      email: data.email || null,
      checkedAt: Date.now(),
    };

    await chrome.storage.local.set({
      licenseStatus: license,
      isLicensed: license.authorized,
      userEmail: license.email,
    });
    await chrome.storage.sync.set({
      isLicensed: license.authorized,
      userEmail: license.email,
    });

    return license;
  } catch (error) {
    console.warn('Profit Hunter: falha ao verificar licença:', error.message);
    const { licenseStatus } = await chrome.storage.local.get('licenseStatus');
    return licenseStatus || { authorized: false, reason: error.message, checkedAt: Date.now() };
  }
}

async function checkAuthorization() {
  const { licenseStatus } = await chrome.storage.local.get('licenseStatus');
  if (!licenseStatus || (Date.now() - (licenseStatus.checkedAt || 0) > 30 * 60 * 1000)) {
    return await verifyLicenseStatus();
  }
  return licenseStatus;
}

// Inicialização e agendamento de verificação periódica
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(LICENSE_ALARM, { periodInMinutes: 30 });
  verifyLicenseStatus();
});

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create(LICENSE_ALARM, { periodInMinutes: 30 });
  verifyLicenseStatus();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === LICENSE_ALARM) {
    await verifyLicenseStatus();
  }
});

// ---------- Listener Central de Mensagens ----------
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Sincronização automática da sessão da web
  if (request.type === 'PROFIT_HUNTER_SAVE_AUTH') {
    const { token, user, license } = request;
    (async () => {
      try {
        const isAuth = !!(license?.authorized || user?.authorized);
        await chrome.storage.local.set({
          auth_token: token,
          auth_user: user,
          isLicensed: isAuth,
          userEmail: license?.email || user?.email || '',
          licenseStatus: {
            authorized: isAuth,
            role: license?.role || user?.role || 'user',
            plan: license?.plan || user?.plan || 'pro',
            status: license?.status || user?.status || 'active',
            is_trial: !!license?.is_trial,
            trial_days_left: license?.trial_days_left || null,
            email: license?.email || user?.email || '',
            checkedAt: Date.now(),
          },
        });
        await chrome.storage.sync.set({
          isLicensed: isAuth,
          userEmail: license?.email || user?.email || '',
        });
        const fresh = await verifyLicenseStatus();
        sendResponse({ success: true, licenseStatus: fresh });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (request.type === 'PROFIT_HUNTER_GET_LICENSE') {
    checkAuthorization().then((license) => sendResponse({ ok: true, license }));
    return true;
  }

  if (request.type === 'PROFIT_HUNTER_REFRESH_LICENSE') {
    verifyLicenseStatus().then((license) => sendResponse({ ok: true, license }));
    return true;
  }

  if (request.type === 'PROFIT_HUNTER_OPEN_LOGIN') {
    const loginUrl = typeof CONFIG !== 'undefined'
      ? CONFIG.getLoginUrl()
      : `${DEFAULT_WEB_URL}/login?from=profit_hunter`;
    chrome.tabs.create({ url: loginUrl }, (tab) => {
      sendResponse({ ok: !chrome.runtime.lastError, tabId: tab?.id });
    });
    return true;
  }

  if (request.type === 'PROFIT_HUNTER_LOGOUT') {
    chrome.storage.local.remove(['auth_token', 'auth_user', 'licenseStatus', 'isLicensed']).then(() => {
      chrome.storage.sync.set({ isLicensed: false }, () => {
        sendResponse({ ok: true });
      });
    });
    return true;
  }

  // Compatibilidade com verificações legadas
  if (request.action === 'checkLicense' || request.action === 'login') {
    checkAuthorization().then((lic) => {
      sendResponse({ success: !!lic?.authorized, message: lic?.authorized ? 'Licença ativa!' : 'Login necessário' });
    });
    return true;
  }

  // Disparo manual ou via botão flutuante de oferta para o Telegram
  if (request.action === 'sendOffer') {
    (async () => {
      const auth = await checkAuthorization();
      if (!auth?.authorized) {
        sendResponse({
          success: false,
          error: 'Licença necessária. Faça login na extensão para ativar seu acesso.',
        });
        return;
      }

      const res = await enviarParaTelegram(request.data);
      sendResponse(res);
    })();
    return true;
  }

  return false;
});

// ---------- Função de Envio ao Telegram ----------
async function enviarParaTelegram(offerData) {
  const syncData = await chrome.storage.sync.get(['telegramToken', 'telegramChatId', 'minPercentage']);
  const localData = await chrome.storage.local.get(['telegramToken', 'telegramChatId']);

  const token = syncData.telegramToken || localData.telegramToken;
  const chatId = syncData.telegramChatId || localData.telegramChatId;

  if (!token || !chatId) {
    console.warn('Profit Hunter: Token ou Chat ID do Telegram não configurados.');
    return { success: false, error: 'Telegram não configurado. Abra as opções da extensão para configurar Bot Token e Chat ID.' };
  }

  // Salva no histórico local de ofertas (mantém até 50 ofertas)
  const result = await chrome.storage.local.get(['offerHistory']);
  let history = result.offerHistory || [];
  const now = new Date();
  history.unshift({
    title: offerData.title || 'Produto sem título',
    price: offerData.price || 'Consulte',
    url: offerData.url || '#',
    date: now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  });
  if (history.length > 50) history.pop();
  await chrome.storage.local.set({ offerHistory: history });

  const mensagem = `🎯 *Profit Hunter Pro — Nova Oferta!*\n\n` +
                   `📦 *Produto:* ${offerData.title || 'Não informado'}\n` +
                   `💰 *Preço:* ${offerData.price || 'Consulte'}\n` +
                   `🔗 [Ver Oferta no Site](${offerData.url || '#'})`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: mensagem,
        parse_mode: 'Markdown',
        disable_web_page_preview: false,
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      return { success: false, error: data.description || 'Erro na API do Telegram.' };
    }
    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar oferta para o Telegram:', error);
    return { success: false, error: error.message };
  }
}