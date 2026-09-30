function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 2500);
}

function setDot(id, ok) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('dot--green', 'dot--red', 'dot--gray');
  el.classList.add(ok ? 'dot--green' : 'dot--red');
}

function setUnknownDot(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('dot--green', 'dot--red');
  el.classList.add('dot--gray');
}

async function updateAuthUI() {
  const authBar = document.getElementById('auth-status-bar');
  const loginBar = document.getElementById('login-prompt-bar');
  const emailEl = document.getElementById('auth-email');
  const badgeEl = document.getElementById('auth-badge');

  try {
    const { auth_token, auth_user, licenseStatus } = await chrome.storage.local.get([
      'auth_token',
      'auth_user',
      'licenseStatus',
    ]);

    const isAuth = Boolean(auth_token && (licenseStatus?.authorized || auth_user));
    if (isAuth) {
      const email = licenseStatus?.email || auth_user?.email || 'Usuário Pro';
      const plan = (licenseStatus?.plan || auth_user?.plan || 'pro').toUpperCase();
      emailEl.textContent = email;
      badgeEl.textContent = `${plan} ATIVO`;
      authBar.classList.remove('hidden');
      loginBar.classList.add('hidden');
    } else {
      authBar.classList.add('hidden');
      loginBar.classList.remove('hidden');
    }
  } catch {
    authBar.classList.add('hidden');
    loginBar.classList.remove('hidden');
  }
}

async function loadDashboard() {
  await updateAuthUI();

  try {
    const status = await api.getStatus();
    document.getElementById('offline-banner').classList.add('hidden');
    setDot('status-dot', true);
    document.getElementById('status-text').textContent = 'Nuvem Conectada';
    setDot('telegram-dot', status.telegramConnected);
    document.getElementById('telegram-text').textContent = status.telegramConnected
      ? 'Telegram conectado'
      : 'Telegram não configurado';
    document.getElementById('stat-products').textContent = status.productsTracked;
    document.getElementById('stat-opps').textContent = status.opportunitiesFound;
    document.getElementById('last-check').textContent = status.lastScan?.finishedAt
      ? new Date(status.lastScan.finishedAt + (status.lastScan.finishedAt.endsWith('Z') ? '' : 'Z')).toLocaleTimeString('pt-BR')
      : 'ainda não verificado';

    const summary = document.getElementById('scan-summary');
    const noConfig = document.getElementById('no-config');
    if (status.scanConfigured) {
      summary.textContent = `${status.selectedCategories} categoria(s) monitorada(s)`;
      summary.classList.remove('hidden');
      noConfig.classList.add('hidden');
    } else {
      summary.classList.add('hidden');
      noConfig.classList.remove('hidden');
    }
  } catch (err) {
    const banner = document.getElementById('offline-banner');
    if (err.message && err.message.includes('não autenticado')) {
      banner.textContent = '🔒 Sessão não autorizada ou token inválido. Faça login para conectar à nuvem.';
      setUnknownDot('status-dot');
      document.getElementById('status-text').textContent = 'Aguardando Login';
      setUnknownDot('telegram-dot');
      document.getElementById('telegram-text').textContent = 'Telegram: conecte sua conta';
    } else {
      banner.textContent = '🟡 Conectando à nuvem (Render)... Os servidores em nuvem podem levar alguns instantes para responder na primeira chamada.';
      setDot('status-dot', false);
      document.getElementById('status-text').textContent = 'Conectando ao servidor…';
      setUnknownDot('telegram-dot');
      document.getElementById('telegram-text').textContent = 'Telegram: aguardando nuvem';
    }
    banner.classList.remove('hidden');
  }
}

document.getElementById('btn-settings').addEventListener('click', () => chrome.runtime.openOptionsPage());

document.getElementById('btn-history').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html#history') });
});

document.getElementById('btn-open-login').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'DEAL_HUNTER_OPEN_LOGIN' });
});

document.getElementById('btn-logout').addEventListener('click', async () => {
  if (confirm('Deseja realmente sair da sua conta?')) {
    chrome.runtime.sendMessage({ type: 'DEAL_HUNTER_LOGOUT' }, () => {
      showToast('Sessão encerrada.');
      loadDashboard();
    });
  }
});

document.getElementById('btn-scan-now').addEventListener('click', async (e) => {
  e.target.disabled = true;
  e.target.textContent = 'Verificando ofertas…';
  try {
    const result = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'DEAL_HUNTER_RUN_BROWSER_SCAN' }, (response) => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else if (!response) reject(new Error('A extensão não respondeu. Recarregue-a em chrome://extensions.'));
        else resolve(response);
      });
    });
    if (result.status === 'skipped') {
      showToast('Selecione lojas e categorias nas Configurações.');
    } else if (result.status === 'error' || result.status === 'partial') {
      showToast(`Varredura ${result.status === 'partial' ? 'parcial' : 'falhou'}: ${result.errors?.[0] || result.message || 'verifique a conexão.'}`);
    } else {
      showToast(`Concluído: ${result.alertsSent || 0} alerta(s) enviado(s) ao Telegram.`);
    }
    chrome.runtime.sendMessage({ type: 'DEAL_HUNTER_REFRESH_BADGE' });
    await loadDashboard();
  } catch (err) {
    showToast(err.message);
  } finally {
    e.target.disabled = false;
    e.target.textContent = 'Verificar agora no Chrome';
  }
});

// Atualiza a interface instantaneamente assim que a sessão for salva na nuvem
chrome.storage.onChanged.addListener((changes) => {
  if (changes.auth_token || changes.licenseStatus || changes.baseUrl) {
    loadDashboard();
  }
});

loadDashboard();
