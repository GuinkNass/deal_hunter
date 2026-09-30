// ==============================================================================
// Profit Hunter Pro — Script da Página de Opções
// ==============================================================================

document.addEventListener('DOMContentLoaded', () => {
  initOptions();
});

async function initOptions() {
  bindEvents();
  await loadTelegramSettings();
  await refreshLicenseInfo();
}

function bindEvents() {
  // Login na Web
  document.getElementById('btnLogin')?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'PROFIT_HUNTER_OPEN_LOGIN' });
  });

  // Sincronizar Acesso
  document.getElementById('btnSync')?.addEventListener('click', async () => {
    const feedback = document.getElementById('authFeedback');
    feedback.style.color = '#38bdf8';
    feedback.textContent = 'Sincronizando licença com a nuvem…';

    try {
      await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'PROFIT_HUNTER_REFRESH_LICENSE' }, resolve);
      });
      await refreshLicenseInfo();
      feedback.style.color = '#4ade80';
      feedback.textContent = '✅ Licença sincronizada com sucesso.';
    } catch (e) {
      feedback.style.color = '#f87171';
      feedback.textContent = `Status: ${e.message}`;
    }
    setTimeout(() => { feedback.textContent = ''; }, 3000);
  });

  // Logout
  document.getElementById('btnLogout')?.addEventListener('click', async () => {
    if (confirm('Deseja realmente desconectar sua conta do Profit Hunter?')) {
      chrome.runtime.sendMessage({ type: 'PROFIT_HUNTER_LOGOUT' }, () => {
        refreshLicenseInfo();
      });
    }
  });

  // Salvar Telegram
  document.getElementById('btnSaveTelegram')?.addEventListener('click', saveTelegramSettings);

  // Testar Telegram
  document.getElementById('btnTestTelegram')?.addEventListener('click', testTelegramSettings);

  // Listener para sincronização automática quando a sessão for atualizada no portal
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.auth_token || changes.licenseStatus || changes.auth_user) {
      refreshLicenseInfo();
    }
  });
}

// ---------- Carrega e Atualiza Informações da Licença ----------
async function refreshLicenseInfo() {
  const badge = document.getElementById('licenseBadge');
  const userEmail = document.getElementById('userEmailText');
  const btnLogin = document.getElementById('btnLogin');
  const btnLogout = document.getElementById('btnLogout');

  let license = null;
  try {
    const res = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'PROFIT_HUNTER_GET_LICENSE' }, resolve);
    });
    license = res?.license;
  } catch {}

  if (!license) {
    const { licenseStatus } = await chrome.storage.local.get('licenseStatus');
    license = licenseStatus;
  }

  const isAuth = !!license?.authorized;

  if (isAuth) {
    const email = license?.email || 'Licença Ativa';
    userEmail.textContent = email;

    if (license.is_trial) {
      const days = license.trial_days_left || 7;
      badge.textContent = `${days} DIAS GRÁTIS`;
      badge.className = 'badge badge--warn';
    } else {
      badge.textContent = 'PRO ATIVO';
      badge.className = 'badge badge--success';
    }

    btnLogin?.classList.add('hidden');
    btnLogout?.classList.remove('hidden');
  } else {
    userEmail.textContent = 'Nenhuma sessão conectada';
    badge.textContent = 'LOGIN NECESSÁRIO';
    badge.className = 'badge badge--danger';

    btnLogin?.classList.remove('hidden');
    btnLogout?.classList.add('hidden');
  }
}

// ---------- Carrega Configurações do Telegram ----------
async function loadTelegramSettings() {
  const syncData = await chrome.storage.sync.get(['telegramToken', 'telegramChatId', 'minPercentage']);
  const localData = await chrome.storage.local.get(['telegramToken', 'telegramChatId', 'minPercentage']);

  const token = syncData.telegramToken || localData.telegramToken || '';
  const chatId = syncData.telegramChatId || localData.telegramChatId || '';
  const minPerc = syncData.minPercentage ?? localData.minPercentage ?? '';

  document.getElementById('telegramToken').value = token;
  document.getElementById('telegramChatId').value = chatId;
  document.getElementById('minPercentage').value = minPerc;
}

// ---------- Salva Configurações do Telegram ----------
async function saveTelegramSettings() {
  const token = document.getElementById('telegramToken').value.trim();
  const chatId = document.getElementById('telegramChatId').value.trim();
  const minPercentage = document.getElementById('minPercentage').value.trim();
  const feedback = document.getElementById('telegramFeedback');

  if (!token || !chatId) {
    feedback.style.color = '#f87171';
    feedback.textContent = '⚠️ Preencha o Bot Token e o Chat ID antes de salvar.';
    return;
  }

  const payload = {
    telegramToken: token,
    telegramChatId: chatId,
    minPercentage: minPercentage ? parseFloat(minPercentage) : 0,
  };

  await chrome.storage.sync.set(payload);
  await chrome.storage.local.set(payload);

  feedback.style.color = '#4ade80';
  feedback.textContent = '✅ Configurações salvas com sucesso!';
  setTimeout(() => { feedback.textContent = ''; }, 3500);
}

// ---------- Testa Mensagem no Telegram ----------
async function testTelegramSettings() {
  const token = document.getElementById('telegramToken').value.trim();
  const chatId = document.getElementById('telegramChatId').value.trim();
  const feedback = document.getElementById('telegramFeedback');

  if (!token || !chatId) {
    feedback.style.color = '#f87171';
    feedback.textContent = '⚠️ Preencha o Bot Token e o Chat ID para testar.';
    return;
  }

  feedback.style.color = '#38bdf8';
  feedback.textContent = 'Enviando mensagem de teste para o Telegram…';

  const testMessage = `🎯 *Profit Hunter Pro — Teste de Conexão*\n\n` +
                      `✅ O seu robô do Telegram foi configurado com sucesso!\n` +
                      `Pronto para monitorar e enviar ofertas da sua tela em tempo real.`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: testMessage,
        parse_mode: 'Markdown',
      }),
    });

    const data = await res.json();
    if (data.ok) {
      feedback.style.color = '#4ade80';
      feedback.textContent = '✅ Mensagem de teste enviada com sucesso! Verifique seu Telegram.';
    } else {
      feedback.style.color = '#f87171';
      feedback.textContent = `🔴 Erro do Telegram: ${data.description || 'Verifique o Bot Token e Chat ID.'}`;
    }
  } catch (err) {
    feedback.style.color = '#f87171';
    feedback.textContent = `🔴 Falha na conexão: ${err.message}`;
  }
}