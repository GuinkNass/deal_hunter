function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 2500);
}

function setDot(id, ok) {
  const el = document.getElementById(id);
  el.classList.remove('dot--green', 'dot--red', 'dot--gray');
  el.classList.add(ok ? 'dot--green' : 'dot--red');
}

function setUnknownDot(id) {
  const el = document.getElementById(id);
  el.classList.remove('dot--green', 'dot--red');
  el.classList.add('dot--gray');
}

async function loadDashboard() {
  try {
    const status = await api.getStatus();
    document.getElementById('offline-banner').classList.add('hidden');
    setDot('status-dot', true);
    document.getElementById('status-text').textContent = 'Sistema ativo';
    setDot('telegram-dot', status.telegramConnected);
    document.getElementById('telegram-text').textContent = status.telegramConnected
      ? 'Telegram conectado'
      : 'Telegram não configurado';
    document.getElementById('stat-products').textContent = status.productsTracked;
    document.getElementById('stat-opps').textContent = status.opportunitiesFound;
    document.getElementById('last-check').textContent = status.lastScan?.finishedAt
      ? new Date(status.lastScan.finishedAt + 'Z').toLocaleTimeString('pt-BR')
      : 'ainda não verificado';

    const summary = document.getElementById('scan-summary');
    const noConfig = document.getElementById('no-config');
    if (status.scanConfigured) {
      summary.textContent = `${status.selectedCategories} categoria(s) selecionada(s)`;
      summary.classList.remove('hidden');
      noConfig.classList.add('hidden');
    } else {
      summary.classList.add('hidden');
      noConfig.classList.remove('hidden');
    }
  } catch (err) {
    const banner = document.getElementById('offline-banner');
    try {
      await api.ping();
      banner.textContent = '🟡 Backend encontrado. Abra Configurações > Pareamento e salve o token exibido na janela do backend.';
      setUnknownDot('status-dot');
      document.getElementById('status-text').textContent = 'Backend encontrado — pareamento necessário';
      setUnknownDot('telegram-dot');
      document.getElementById('telegram-text').textContent = 'Telegram: verifique após parear';
    } catch {
      banner.textContent = '🔴 Backend local não encontrado. Execute 2-Ativar-Backend.bat na pasta do projeto.';
      setDot('status-dot', false);
      document.getElementById('status-text').textContent = 'Backend offline';
      setUnknownDot('telegram-dot');
      document.getElementById('telegram-text').textContent = 'Telegram: aguardando backend';
    }
    banner.classList.remove('hidden');
  }
}

document.getElementById('btn-settings').addEventListener('click', () => chrome.runtime.openOptionsPage());
document.getElementById('btn-history').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html#history') });
});
document.getElementById('btn-scan-now').addEventListener('click', async (e) => {
  e.target.disabled = true;
  e.target.textContent = 'Verificando…';
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
      showToast(`Varredura ${result.status === 'partial' ? 'parcial' : 'falhou'}: ${result.errors?.[0] || result.message || 'verifique os logs.'}`);
    } else {
      showToast(`Verificação concluída: ${result.alertsSent || 0} alerta(s) enviado(s).`);
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

loadDashboard();
