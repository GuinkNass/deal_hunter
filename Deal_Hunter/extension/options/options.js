// ---------- Navegação por abas ----------
const tabs = document.querySelectorAll('.tab');
const navItems = document.querySelectorAll('.nav-item');

function showTab(name) {
  tabs.forEach((t) => t.classList.toggle('hidden', t.id !== `tab-${name}`));
  navItems.forEach((n) => n.classList.toggle('active', n.dataset.tab === name));
  if (name === 'onboarding') loadOnboardingTab();
  if (name === 'history') loadHistory();
  if (name === 'telegram') loadTelegramTab();
  if (name === 'catalog') loadCatalogTab();
  if (name === 'scan') loadScanTab();
  if (name === 'filters') loadFiltersTab();
  if (name === 'pairing') loadPairingTab();
}

navItems.forEach((btn) => {
  btn.addEventListener('click', () => {
    location.hash = btn.dataset.tab;
    showTab(btn.dataset.tab);
  });
});

const initialTab = location.hash.replace('#', '') || 'onboarding';
showTab(initialTab);
if (initialTab === 'onboarding') loadOnboardingTab();

// ---------- Onboarding / Autenticação Automática na Nuvem ----------
async function loadOnboardingTab() {
  const serverBadge = document.getElementById('cloud-server-status');
  const licenseBadge = document.getElementById('cloud-license-status');
  const userDetails = document.getElementById('cloud-user-details');
  const loginBtn = document.getElementById('ob-login-btn');
  const logoutBtn = document.getElementById('ob-logout-btn');

  // 1. Testa conectividade com a API na nuvem (Render)
  serverBadge.textContent = 'Testando…';
  serverBadge.className = 'badge badge--warn';

  try {
    const health = await api.checkHealth().catch(() => api.ping());
    if (health) {
      serverBadge.textContent = 'ONLINE (NUVEM)';
      serverBadge.className = 'badge badge--success';
    }
  } catch (err) {
    serverBadge.textContent = 'CONECTANDO / HIBERNADO';
    serverBadge.className = 'badge badge--warn';
  }

  // 2. Verifica a sessão local salva no chrome.storage
  try {
    const { auth_token, auth_user, licenseStatus } = await chrome.storage.local.get([
      'auth_token',
      'auth_user',
      'licenseStatus',
    ]);

    const isAuth = Boolean(auth_token && (licenseStatus?.authorized || auth_user));
    if (isAuth) {
      const email = licenseStatus?.email || auth_user?.email || 'Licença Ativa';
      const plan = (licenseStatus?.plan || auth_user?.plan || 'pro').toUpperCase();
      licenseBadge.textContent = `${plan} ATIVO`;
      licenseBadge.className = 'badge badge--success';
      userDetails.textContent = `Logado como: ${email}`;
      loginBtn.classList.add('hidden');
      logoutBtn.classList.remove('hidden');
    } else {
      licenseBadge.textContent = 'LOGIN NECESSÁRIO';
      licenseBadge.className = 'badge badge--warn';
      userDetails.textContent = 'Nenhuma sessão conectada. Clique abaixo para fazer login.';
      loginBtn.classList.remove('hidden');
      logoutBtn.classList.add('hidden');
    }
  } catch {
    licenseBadge.textContent = 'DESCONECTADO';
    licenseBadge.className = 'badge badge--danger';
  }
}

document.getElementById('ob-login-btn')?.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'DEAL_HUNTER_OPEN_LOGIN' });
});

document.getElementById('ob-sync-btn')?.addEventListener('click', async () => {
  const feedback = document.getElementById('ob-auth-feedback');
  feedback.textContent = 'Sincronizando com a nuvem…';
  try {
    await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'DEAL_HUNTER_REFRESH_LICENSE' }, resolve);
    });
    await loadOnboardingTab();
    feedback.textContent = '✅ Status atualizado.';
  } catch (e) {
    feedback.textContent = `Status: ${e.message}`;
  }
  setTimeout(() => { feedback.textContent = ''; }, 3000);
});

document.getElementById('ob-logout-btn')?.addEventListener('click', async () => {
  if (confirm('Deseja realmente desconectar sua conta?')) {
    chrome.runtime.sendMessage({ type: 'DEAL_HUNTER_LOGOUT' }, () => {
      loadOnboardingTab();
    });
  }
});

// Atualiza a tela de opções instantaneamente se o usuário fizer login na aba web
chrome.storage.onChanged.addListener((changes) => {
  if (changes.auth_token || changes.licenseStatus) {
    loadOnboardingTab();
  }
});

document.getElementById('ob-test-telegram').addEventListener('click', async () => {
  const botToken = document.getElementById('ob-bot-token').value.trim();
  const chatId = document.getElementById('ob-chat-id').value.trim();
  const status = document.getElementById('ob-telegram-status');
  if (!botToken || !chatId) { status.textContent = 'Preencha Bot Token e Chat ID.'; return; }
  status.textContent = 'Testando…';
  try {
    await api.configureTelegram(botToken, chatId);
    await api.testTelegram();
    status.textContent = '✅ Telegram configurado com sucesso.';
  } catch (err) {
    status.textContent = `🔴 ${err.message || 'Não foi possível enviar a mensagem. Verifique o Bot Token e Chat ID.'}`;
  }
});

document.getElementById('ob-open-catalog').addEventListener('click', () => {
  location.hash = 'catalog';
  showTab('catalog');
});

document.getElementById('eletroclub-login').addEventListener('click', () => {
  const feedback = document.getElementById('eletroclub-login-feedback');
  feedback.textContent = 'Abrindo o login oficial…';
  chrome.runtime.sendMessage({ type: 'DEAL_HUNTER_OPEN_ELECTROCLUB_LOGIN' }, (result) => {
    if (chrome.runtime.lastError) {
      feedback.textContent = `Não foi possível abrir o login: ${chrome.runtime.lastError.message}`;
      return;
    }
    feedback.textContent = result?.ok
      ? 'Faça login na aba aberta. A senha fica somente no site.'
      : result?.message || 'Não foi possível abrir o login.';
  });
});

// ---------- Telegram ----------
async function loadTelegramTab() {
  const dot = document.getElementById('tg-dot');
  const text = document.getElementById('tg-status-text');
  try {
    const status = await api.getTelegramStatus();
    dot.className = `dot ${status.configured ? 'dot--green' : 'dot--red'}`;
    text.textContent = status.configured
      ? `🟢 Telegram conectado (${status.maskedToken})`
      : '🔴 Telegram não configurado';
  } catch {
    dot.className = 'dot dot--gray';
    text.textContent = 'Backend offline';
  }
}

document.getElementById('tg-test').addEventListener('click', async () => {
  const botToken = document.getElementById('tg-bot-token').value.trim();
  const chatId = document.getElementById('tg-chat-id').value.trim();
  const fb = document.getElementById('tg-feedback');
  if (!botToken || !chatId) { fb.textContent = 'Preencha Bot Token e Chat ID.'; return; }
  try {
    await api.configureTelegram(botToken, chatId);
    await api.testTelegram();
    fb.textContent = 'Telegram configurado com sucesso.';
    loadTelegramTab();
  } catch (err) {
    fb.textContent = err.message || 'Não foi possível enviar a mensagem. Verifique o Bot Token e Chat ID.';
  }
});

document.getElementById('tg-send-test').addEventListener('click', async () => {
  const fb = document.getElementById('tg-feedback');
  try {
    await api.testTelegram();
    fb.textContent = 'Mensagem de teste enviada.';
  } catch (err) {
    fb.textContent = err.message || 'Falha ao enviar mensagem de teste.';
  }
});

document.getElementById('tg-remove').addEventListener('click', async () => {
  await api.removeTelegram();
  document.getElementById('tg-bot-token').value = '';
  document.getElementById('tg-chat-id').value = '';
  loadTelegramTab();
});

// ---------- Catálogo de lojas e categorias ----------
async function loadCatalogTab() {
  const list = document.getElementById('catalog-list');
  list.textContent = 'Carregando categorias…';
  try {
    const categories = await api.getCategories();
    const groups = new Map();
    for (const category of categories) {
      if (!groups.has(category.siteName)) groups.set(category.siteName, []);
      groups.get(category.siteName).push(category);
    }
    list.innerHTML = [...groups.entries()].map(([siteName, rows]) => {
      const storeSlug = siteName.toLowerCase().replace(/[^\w]+/g, '-');
      return `
      <section class="catalog-store" data-store="${escapeHtml(storeSlug)}">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
          <h2 style="margin:0;">${escapeHtml(siteName)} <small style="color:#94a3b8; font-size:12px; font-weight:normal;">(${rows.length} categorias)</small></h2>
          <div style="display:flex; gap:6px;">
            <button type="button" class="btn btn--sm select-all-store" data-store="${escapeHtml(storeSlug)}" style="padding:3px 8px; font-size:11px;">Marcar todas</button>
            <button type="button" class="btn btn--sm unselect-all-store" data-store="${escapeHtml(storeSlug)}" style="padding:3px 8px; font-size:11px;">Desmarcar todas</button>
          </div>
        </div>
        <div class="store-categories">
          ${rows.map((category) => `
            <label class="catalog-category" data-cat-name="${escapeHtml(category.name.toLowerCase())}">
              <input type="checkbox" data-category-id="${escapeHtml(category.id)}" ${category.selected ? 'checked' : ''} />
              <span>${escapeHtml(category.name)}</span>
              <a href="${escapeHtml(safeHttpUrl(category.url))}" target="_blank" rel="noopener noreferrer">Abrir categoria</a>
            </label>
          `).join('')}
        </div>
      </section>
    `;
    }).join('');

    // Event listeners para Marcar todas / Desmarcar todas por loja
    list.querySelectorAll('.select-all-store').forEach((btn) => {
      btn.addEventListener('click', () => {
        const storeEl = btn.closest('.catalog-store');
        storeEl.querySelectorAll('input[data-category-id]').forEach((cb) => {
          if (cb.closest('.catalog-category').style.display !== 'none') cb.checked = true;
        });
      });
    });
    list.querySelectorAll('.unselect-all-store').forEach((btn) => {
      btn.addEventListener('click', () => {
        const storeEl = btn.closest('.catalog-store');
        storeEl.querySelectorAll('input[data-category-id]').forEach((cb) => {
          if (cb.closest('.catalog-category').style.display !== 'none') cb.checked = false;
        });
      });
    });

    // Filtro de busca em tempo real
    const searchInput = document.getElementById('catalog-search');
    if (searchInput) {
      searchInput.oninput = () => {
        const term = searchInput.value.trim().toLowerCase();
        list.querySelectorAll('.catalog-store').forEach((storeEl) => {
          let visibleInStore = 0;
          storeEl.querySelectorAll('.catalog-category').forEach((catEl) => {
            const matches = !term || catEl.dataset.catName.includes(term) || storeEl.dataset.store.includes(term);
            catEl.style.display = matches ? 'grid' : 'none';
            if (matches) visibleInStore += 1;
          });
          storeEl.style.display = visibleInStore > 0 ? 'block' : 'none';
        });
      };
    }
  } catch (err) {
    list.textContent = `Não foi possível carregar as categorias: ${err.message}`;
  }
}

document.getElementById('catalog-save').addEventListener('click', async () => {
  const saveBtn = document.getElementById('catalog-save');
  const feedback = document.getElementById('catalog-feedback');
  const selectedInputs = document.querySelectorAll('#catalog-list input[data-category-id]:checked');
  const selectedIds = [...selectedInputs].map((input) => input.dataset.categoryId);

  if (selectedIds.length === 0) {
    feedback.textContent = '⚠️ Selecione pelo menos uma categoria antes de salvar.';
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'Salvando…';
  feedback.textContent = '⏳ Gravando seleção no backend…';

  try {
    const saved = await api.saveCategories(selectedIds);
    const verified = await api.getCategories();
    const confirmedIds = verified.filter((category) => category.selected).map((category) => category.id).sort();
    const expectedIds = [...(saved?.selectedIds || selectedIds)].sort();
    if (confirmedIds.length !== expectedIds.length || confirmedIds.some((id, index) => id !== expectedIds[index])) {
      throw new Error('A seleção foi enviada, mas não foi confirmada pelo backend. Tente salvar novamente.');
    }
    feedback.textContent = `✅ ${confirmedIds.length} categoria(s) salva(s) com sucesso! A varredura agora está liberada para rodar.`;
  } catch (err) {
    feedback.textContent = `🔴 ${err.message || 'Falha ao salvar categorias. Verifique a conexão com o backend local.'}`;
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Salvar seleção';
  }
});

// ---------- Agendamento da varredura ----------
const PAGES_OPTIONS = [1, 2, 3, 5];
const INTERVAL_OPTIONS = [
  { v: 15, label: '15 minutos' },
  { v: 30, label: '30 minutos' },
  { v: 60, label: '1 hora' },
  { v: 120, label: '2 horas' },
];

async function loadScanTab() {
  const pagesSel = document.getElementById('scan-pages');
  pagesSel.innerHTML = PAGES_OPTIONS.map((v) => `<option value="${v}">${v} página(s) por categoria</option>`).join('');
  const intervalSel = document.getElementById('scan-interval');
  intervalSel.innerHTML = INTERVAL_OPTIONS.map((o) => `<option value="${o.v}">${o.label}</option>`).join('');

  try {
    const cfg = await api.getScanConfig();
    pagesSel.value = cfg.pages || 2;
    intervalSel.value = String(cfg.scanIntervalMinutes || 30);
  } catch {
    // backend offline — mantém defaults
  }
}

document.getElementById('scan-save').addEventListener('click', async () => {
  const fb = document.getElementById('scan-feedback');
  const payload = {
    scan_pages: document.getElementById('scan-pages').value,
    scan_interval_minutes: document.getElementById('scan-interval').value,
  };
  try {
    await api.saveSettings(payload);
    fb.textContent = '✅ Agendamento salvo.';
  } catch (err) {
    fb.textContent = err.message;
  }
});

document.getElementById('scan-run-now').addEventListener('click', async (e) => {
  const fb = document.getElementById('scan-feedback');
  const stop = document.getElementById('scan-stop-now');
  e.target.disabled = true;
  e.target.textContent = 'Verificando…';
  stop.classList.remove('hidden');
  try {
    const result = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'DEAL_HUNTER_RUN_BROWSER_SCAN' }, (response) => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else if (!response) reject(new Error('A extensão não respondeu. Recarregue-a em chrome://extensions.'));
        else resolve(response);
      });
    });
    fb.textContent = result.status === 'cancelled'
      ? 'Varredura interrompida.'
      : result.status === 'skipped'
      ? 'Selecione pelo menos uma loja/categoria antes de verificar.'
        : result.status === 'running'
          ? result.message
        : result.status === 'error'
          ? `Falha na varredura: ${result.errors?.join(' | ') || result.message || 'verifique os logs do backend.'}`
          : result.status === 'partial'
            ? `Varredura parcial: ${result.itemsScanned || 0} produto(s). ${result.errors?.join(' | ') || ''}`
          : result.status === 'success'
            ? `Verificação concluída no Chrome: ${result.itemsScanned || 0} itens, ${result.candidatesFound || 0} oportunidade(s), ${result.alertsSent || 0} alerta(s) enviado(s).`
          : `Verificação concluída: ${result.itemsScanned || 0} itens, ${result.candidatesFound || 0} oportunidade(s), ${result.alertsSent || 0} alerta(s) enviado(s).`;
  } catch (err) {
    fb.textContent = err.message;
  } finally {
    e.target.disabled = false;
    e.target.textContent = 'Verificar agora no Chrome';
    stop.classList.add('hidden');
  }
});

document.getElementById('scan-stop-now').addEventListener('click', (e) => {
  const stopButton = e.currentTarget;
  stopButton.disabled = true;
  stopButton.textContent = 'Parando…';
  chrome.runtime.sendMessage({ type: 'DEAL_HUNTER_STOP_BROWSER_SCAN' }, (result) => {
    if (chrome.runtime.lastError || result?.ok === false) {
      document.getElementById('scan-feedback').textContent = result?.message || chrome.runtime.lastError?.message || 'Não foi possível parar a varredura.';
      stopButton.disabled = false;
      stopButton.textContent = '■ Parar varredura';
    }
  });
});

// ---------- Filtros de alerta ----------
const DISCOUNT_OPTIONS = [10, 20, 30, 40, 50, 60, 70, 80, 90];

async function loadFiltersTab() {
  const select = document.getElementById('set-min-discount');
  select.innerHTML = DISCOUNT_OPTIONS.map((v) => `<option value="${v}">${v}%</option>`).join('');
  try {
    const s = await api.getSettings();
    select.value = s.alert_min_discount_percent || 70;
    document.getElementById('set-max-price').value = s.alert_max_price || '';
    document.getElementById('set-repeat-hours').value = s.alert_repeat_interval_hours || 24;
  } catch {
    // backend offline — mantém defaults do form
  }
}

document.getElementById('set-save').addEventListener('click', async () => {
  const fb = document.getElementById('set-feedback');
  try {
    await api.saveSettings({
      alert_min_discount_percent: document.getElementById('set-min-discount').value,
      alert_max_price: document.getElementById('set-max-price').value,
      alert_repeat_interval_hours: document.getElementById('set-repeat-hours').value,
    });
    fb.textContent = '✅ Filtros salvos.';
  } catch (err) {
    fb.textContent = err.message;
  }
});

// ---------- Histórico ----------
async function loadHistory(q) {
  const body = document.getElementById('history-body');
  body.innerHTML = '<tr><td colspan="6" class="muted">Carregando…</td></tr>';
  try {
    const rows = await api.getHistory(q);
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="6" class="muted">Nenhum registro ainda.</td></tr>';
      return;
    }
    body.innerHTML = rows.map((r) => `
      <tr>
        <td>${new Date(r.sent_at + 'Z').toLocaleString('pt-BR')}</td>
        <td><small>${escapeHtml(r.site_name || '')}</small><br /><a href="${escapeHtml(safeHttpUrl(r.product_url))}" target="_blank" rel="noopener noreferrer">${escapeHtml(r.product_title)}</a></td>
        <td>${r.current_price ? formatBRL(r.current_price) : '—'}</td>
        <td>${r.discount_percent != null ? r.discount_percent + '%' : '—'}</td>
        <td>${r.score ?? '—'}</td>
        <td>${r.sent ? 'Enviado' : 'Pendente de envio'}</td>
      </tr>
    `).join('');
  } catch {
    body.innerHTML = '<tr><td colspan="6" class="muted">Backend offline.</td></tr>';
  }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function safeHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '#';
  } catch {
    return '#';
  }
}

function formatBRL(v) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

let historyDebounce;
document.getElementById('history-search').addEventListener('input', (e) => {
  clearTimeout(historyDebounce);
  historyDebounce = setTimeout(() => loadHistory(e.target.value), 300);
});

document.getElementById('history-clear').addEventListener('click', async () => {
  if (!confirm('Excluir todo o histórico de oportunidades?')) return;
  await api.clearHistory();
  loadHistory();
});

// ---------- Pareamento / Conexão Nuvem ----------
async function loadPairingTab() {
  const { baseUrl, apiToken } = await api.getConfig();
  const { webAuthUrl } = await chrome.storage.local.get('webAuthUrl');
  document.getElementById('pair-base-url').value = baseUrl;
  document.getElementById('pair-token').value = apiToken || '';
  document.getElementById('web-auth-url').value = webAuthUrl || (typeof CONFIG !== 'undefined' ? CONFIG.WEB_AUTH_URL : 'https://deal-hunter-guilhermernascimento-9353s-projects.vercel.app');
}

document.getElementById('pair-save').addEventListener('click', async () => {
  const baseUrl = document.getElementById('pair-base-url').value.trim();
  const token = document.getElementById('pair-token').value.trim();
  const webAuthUrl = document.getElementById('web-auth-url').value.trim();
  await chrome.storage.local.set({
    baseUrl: baseUrl || undefined,
    webAuthUrl: webAuthUrl || undefined,
  });
  await api.setApiToken(token);
  document.getElementById('pair-feedback').textContent = '✅ Conexão salva com sucesso.';
  setTimeout(() => { document.getElementById('pair-feedback').textContent = ''; }, 3000);
});

document.getElementById('pair-reset-cloud').addEventListener('click', async () => {
  const cloudUrl = typeof CONFIG !== 'undefined' ? CONFIG.PRODUCTION_API_URL : 'https://deal-hunter-server.onrender.com';
  document.getElementById('pair-base-url').value = cloudUrl;
  await chrome.storage.local.set({ baseUrl: cloudUrl });
  document.getElementById('pair-feedback').textContent = '✅ URL padrão da nuvem restaurada.';
  setTimeout(() => { document.getElementById('pair-feedback').textContent = ''; }, 3000);
});

document.getElementById('pair-reset-local').addEventListener('click', async () => {
  const localUrl = typeof CONFIG !== 'undefined' ? CONFIG.LOCAL_API_URL : 'http://127.0.0.1:3000';
  document.getElementById('pair-base-url').value = localUrl;
  await chrome.storage.local.set({ baseUrl: localUrl });
  document.getElementById('pair-feedback').textContent = '✅ Modo local (127.0.0.1:3000) ativado.';
  setTimeout(() => { document.getElementById('pair-feedback').textContent = ''; }, 3000);
});
