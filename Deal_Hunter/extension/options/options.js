// ---------- Controle de Acesso Restrito / Desenvolvedor ----------
const DEV_ADMIN_TARGET_EMAIL = typeof DEV_ADMIN_EMAIL !== 'undefined' ? DEV_ADMIN_EMAIL : 'guilherme.r.nascimentoml@gmail.com';

async function getLoggedUserEmail() {
  try {
    const { auth_user, licenseStatus } = await chrome.storage.local.get([
      'auth_user',
      'licenseStatus',
    ]);
    return (licenseStatus?.email || auth_user?.email || '').trim().toLowerCase();
  } catch {
    return '';
  }
}

async function checkDevAdminAccess() {
  const email = await getLoggedUserEmail();
  const isDevAdmin = email === DEV_ADMIN_TARGET_EMAIL;
  const navPairingBtn = document.getElementById('nav-item-pairing');
  const tabPairing = document.getElementById('tab-pairing');

  if (isDevAdmin) {
    navPairingBtn?.classList.remove('hidden');
  } else {
    navPairingBtn?.classList.add('hidden');
    tabPairing?.classList.add('hidden');

    // Se estiver tentando acessar a aba de infraestrutura, redireciona para o início
    if (location.hash === '#pairing') {
      location.hash = 'onboarding';
      showTab('onboarding');
    }

    // Para usuários não-desenvolvedores, assegura que a base URL seja a oficial de produção
    const cloudUrl = typeof CONFIG !== 'undefined'
      ? CONFIG.PRODUCTION_API_URL
      : 'https://deal-hunter-server.onrender.com';
    const { baseUrl } = await chrome.storage.local.get('baseUrl');
    if (baseUrl && baseUrl !== cloudUrl) {
      await chrome.storage.local.set({ baseUrl: cloudUrl });
    }
  }

  return isDevAdmin;
}

// ---------- Navegação por abas ----------
const tabs = document.querySelectorAll('.tab');
const navItems = document.querySelectorAll('.nav-item');

async function showTab(name) {
  if (name === 'pairing') {
    const isDev = await checkDevAdminAccess();
    if (!isDev) {
      name = 'onboarding';
      location.hash = 'onboarding';
    }
  }

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
    const tabName = btn.dataset.tab;
    location.hash = tabName;
    showTab(tabName);
  });
});

window.addEventListener('hashchange', () => {
  const currentTab = location.hash.replace('#', '') || 'onboarding';
  showTab(currentTab);
});

checkDevAdminAccess().then(() => {
  const initialTab = location.hash.replace('#', '') || 'onboarding';
  showTab(initialTab);
});

// ---------- Onboarding / Autenticação Automática na Nuvem ----------
async function loadOnboardingTab() {
  await checkDevAdminAccess();

  const serverBadge = document.getElementById('cloud-server-status');
  const licenseBadge = document.getElementById('cloud-license-status');
  const userDetails = document.getElementById('cloud-user-details');
  const loginBtn = document.getElementById('ob-login-btn');
  const logoutBtn = document.getElementById('ob-logout-btn');

  // 1. Testa conectividade com a API na nuvem (Render)
  if (serverBadge) {
    serverBadge.textContent = 'Testando…';
    serverBadge.className = 'badge badge--warn';

    try {
      const health = await api.checkHealth().catch(() => api.ping());
      if (health) {
        serverBadge.textContent = 'ONLINE (NUVEM)';
        serverBadge.className = 'badge badge--success';
      } else {
        serverBadge.textContent = 'CONECTANDO / HIBERNADO';
        serverBadge.className = 'badge badge--warn';
      }
    } catch (err) {
      serverBadge.textContent = 'CONECTANDO / HIBERNADO';
      serverBadge.className = 'badge badge--warn';
    }
  }

  // 2. Verifica a sessão local salva e via background service worker
  if (licenseBadge) {
    try {
      let runtimeLicense = null;
      try {
        runtimeLicense = await new Promise((resolve) => {
          chrome.runtime.sendMessage({ type: 'DEAL_HUNTER_GET_LICENSE' }, (resp) => {
            if (chrome.runtime.lastError) resolve(null);
            else resolve(resp?.license || null);
          });
        });
      } catch {
        // Ignora e usa fallback do storage
      }

      const { auth_token, auth_user, licenseStatus } = await chrome.storage.local.get([
        'auth_token',
        'auth_user',
        'licenseStatus',
      ]);

      const activeLic = runtimeLicense || licenseStatus;
      const isAuth = Boolean(activeLic?.authorized || activeLic?.role === 'admin' || auth_token || auth_user);

      if (isAuth) {
        const email = activeLic?.email || auth_user?.email || 'Licença Ativa';
        const role = activeLic?.role === 'admin' ? 'ADMIN' : (activeLic?.plan || auth_user?.plan || 'PRO').toUpperCase();
        licenseBadge.textContent = `${role} ATIVO`;
        licenseBadge.className = 'badge badge--success';
        if (userDetails) userDetails.textContent = `Logado como: ${email}`;
        loginBtn?.classList.add('hidden');
        logoutBtn?.classList.remove('hidden');
      } else {
        licenseBadge.textContent = 'LOGIN NECESSÁRIO';
        licenseBadge.className = 'badge badge--warn';
        if (userDetails) userDetails.textContent = 'Nenhuma sessão conectada. Clique abaixo para fazer login.';
        loginBtn?.classList.remove('hidden');
        logoutBtn?.classList.add('hidden');
      }
    } catch {
      licenseBadge.textContent = 'DESCONECTADO';
      licenseBadge.className = 'badge badge--danger';
    }
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

// Atualiza a tela de opções instantaneamente se o usuário fizer login ou logout na aba web
chrome.storage.onChanged.addListener(async (changes) => {
  if (changes.auth_token || changes.licenseStatus || changes.auth_user) {
    await checkDevAdminAccess();
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
let currentCatalogCategories = [];
let activeStoreFilter = 'all';

function getStoreLogoPath(siteName) {
  const norm = (siteName || '').toLowerCase().trim();
  if (norm.includes('amazon')) return '../icons/stores/amazon.png';
  if (norm.includes('kabum')) return '../icons/stores/kabum.png';
  if (norm.includes('shein')) return '../icons/stores/shein.png';
  if (norm.includes('pichau')) return '../icons/stores/pichau.png';
  if (norm.includes('shopee')) return '../icons/stores/shopee.png';
  if (norm.includes('renner')) return '../icons/stores/renner.png';
  if (norm.includes('magalu') || norm.includes('magazine')) return '../icons/stores/magalu.png';
  if (norm.includes('eletroclub')) return '../icons/stores/eletroclub.png';
  return null;
}

function updateCatalogSummary() {
  const summaryEl = document.getElementById('catalog-summary-count');
  const allCheckboxes = document.querySelectorAll('#catalog-list input[data-category-id]');
  const total = allCheckboxes.length;
  const checked = document.querySelectorAll('#catalog-list input[data-category-id]:checked').length;
  if (summaryEl) summaryEl.textContent = `${checked} selecionada(s) de ${total} categorias`;

  // Atualiza contadores individuais de cada loja
  document.querySelectorAll?.('#catalog-list .catalog-store')?.forEach((storeEl) => {
    const storeSlug = storeEl.dataset.store;
    const storeTotal = storeEl.querySelectorAll('input[data-category-id]').length;
    const storeChecked = storeEl.querySelectorAll('input[data-category-id]:checked').length;
    const counterEl = storeEl.querySelector(`[data-store-counter="${storeSlug}"]`);
    if (counterEl) {
      counterEl.textContent = `${storeChecked} de ${storeTotal} ativas`;
    }
  });
}

function renderCatalogList(categories) {
  const list = document.getElementById('catalog-list');
  const pillsContainer = document.getElementById('catalog-store-pills');
  if (!list) return;

  // Deduplicação defensiva e remoção de categorias obsoletas (ex: Access Point)
  const seenUrls = new Set();
  const cleanCategories = [];
  for (const cat of categories) {
    if (
      (cat.name && cat.name.toLowerCase().includes('access point')) ||
      cat.id === 'pichau-56' ||
      (cat.url && cat.url.toLowerCase().includes('/access-point'))
    ) {
      continue;
    }
    const key = `${cat.siteName || cat.siteId || ''}:${cat.url || cat.id}`;
    if (!seenUrls.has(key)) {
      seenUrls.add(key);
      cleanCategories.push(cat);
    }
  }

  currentCatalogCategories = cleanCategories;

  const groups = new Map();
  for (const category of cleanCategories) {
    const store = category.siteName || 'Outras Lojas';
    if (!groups.has(store)) groups.set(store, []);
    groups.get(store).push(category);
  }

  // Renderiza pills de lojas para filtro rápido
  if (pillsContainer) {
    const storeNames = ['Todas as Lojas', ...groups.keys()];
    pillsContainer.innerHTML = storeNames.map((name) => {
      const slug = name === 'Todas as Lojas' ? 'all' : name.toLowerCase().replace(/[^\w]+/g, '-');
      const isActive = activeStoreFilter === slug;
      const logo = getStoreLogoPath(name);
      const logoHtml = logo ? `<img src="${logo}" class="catalog-pill-logo" alt="" />` : '';
      return `<button type="button" class="catalog-pill ${isActive ? 'active' : ''}" data-filter="${escapeHtml(slug)}">${logoHtml}<span>${escapeHtml(name)}</span></button>`;
    }).join('');

    pillsContainer.querySelectorAll?.('.catalog-pill')?.forEach((btn) => {
      btn.addEventListener('click', () => {
        activeStoreFilter = btn.dataset.filter;
        pillsContainer.querySelectorAll?.('.catalog-pill')?.forEach((p) => p.classList.toggle('active', p === btn));
        applyCatalogFilters();
        if (activeStoreFilter !== 'all') {
          const targetStore = list.querySelector(`.catalog-store[data-store="${activeStoreFilter}"]`);
          if (targetStore) targetStore.classList.remove('collapsed');
        }
      });
    });
  }

  // Renderiza lojas com dropdown/accordion recolhido por padrão e logos maiores
  list.innerHTML = [...groups.entries()].map(([siteName, rows]) => {
    const storeSlug = siteName.toLowerCase().replace(/[^\w]+/g, '-');
    const storeLogo = getStoreLogoPath(siteName);
    const logoHtml = storeLogo
      ? `<img src="${storeLogo}" class="catalog-store-logo" alt="${escapeHtml(siteName)}" onerror="this.style.display='none'" />`
      : '';
    const activeCount = rows.filter((r) => Number(r.selected)).length;

    return `
    <section class="catalog-store collapsed" data-store="${escapeHtml(storeSlug)}">
      <div class="catalog-store-header">
        <h2 class="catalog-store-title">
          <span class="catalog-toggle-arrow">▼</span>
          ${logoHtml}
          <span>${escapeHtml(siteName)}</span>
          <span class="store-badge-count" data-store-counter="${escapeHtml(storeSlug)}">${activeCount} de ${rows.length} ativas</span>
        </h2>
        <div style="display:flex; gap:6px;" onclick="event.stopPropagation();">
          <button type="button" class="btn btn--sm select-all-store" data-store="${escapeHtml(storeSlug)}">Marcar todas</button>
          <button type="button" class="btn btn--sm unselect-all-store" data-store="${escapeHtml(storeSlug)}">Desmarcar todas</button>
        </div>
      </div>
      <div class="store-categories">
        ${rows.map((category) => `
          <div class="catalog-category" data-cat-name="${escapeHtml((category.name || '').toLowerCase())}">
            <input type="checkbox" data-category-id="${escapeHtml(category.id)}" ${Number(category.selected) ? 'checked' : ''} />
            <span style="cursor:pointer;" onclick="this.previousElementSibling.click()">${escapeHtml(category.name)}</span>
            <input type="text" class="catalog-keyword-input" data-keyword-id="${escapeHtml(category.id)}" placeholder="Palavra-chave (ex: RTX 4070)..." value="${escapeHtml(category.keyword_filter || '')}" title="Filtro de palavra-chave: alerta somente se o produto contiver este termo" onclick="event.stopPropagation();" />
            <a href="${escapeHtml(safeHttpUrl(category.url))}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();">Abrir ↗</a>
          </div>
        `).join('')}
      </div>
    </section>
  `;
  }).join('');

  // Evento de clique no cabeçalho da loja para expandir/recolher
  list.querySelectorAll?.('.catalog-store-header')?.forEach((hdr) => {
    hdr.addEventListener('click', () => {
      const storeEl = hdr.closest('.catalog-store');
      storeEl?.classList.toggle('collapsed');
    });
  });

  // Event listeners para Marcar todas / Desmarcar todas por loja
  list.querySelectorAll?.('.select-all-store')?.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const storeEl = btn.closest('.catalog-store');
      storeEl?.querySelectorAll('input[data-category-id]').forEach((cb) => {
        if (cb.closest('.catalog-category').style.display !== 'none') cb.checked = true;
      });
      updateCatalogSummary();
    });
  });

  list.querySelectorAll?.('.unselect-all-store')?.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const storeEl = btn.closest('.catalog-store');
      storeEl?.querySelectorAll('input[data-category-id]').forEach((cb) => {
        if (cb.closest('.catalog-category').style.display !== 'none') cb.checked = false;
      });
      updateCatalogSummary();
    });
  });

  // Listener para atualizar contador ao marcar/desmarcar qualquer checkbox
  list.querySelectorAll?.('input[data-category-id]')?.forEach((cb) => {
    cb.addEventListener('change', updateCatalogSummary);
  });

  updateCatalogSummary();
}

function applyCatalogFilters() {
  const list = document.getElementById('catalog-list');
  if (!list) return;
  const searchInput = document.getElementById('catalog-search');
  const term = (searchInput?.value || '').trim().toLowerCase();

  list.querySelectorAll?.('.catalog-store')?.forEach((storeEl) => {
    const storeSlug = storeEl.dataset.store;
    const storeMatchesPill = activeStoreFilter === 'all' || storeSlug === activeStoreFilter;

    let visibleInStore = 0;
    storeEl.querySelectorAll?.('.catalog-category')?.forEach((catEl) => {
      const catName = catEl.dataset.catName || '';
      const matchesSearch = !term || catName.includes(term) || storeSlug.includes(term);
      const isVisible = storeMatchesPill && matchesSearch;
      catEl.style.display = isVisible ? 'grid' : 'none';
      if (isVisible) visibleInStore += 1;
    });

    storeEl.style.display = (storeMatchesPill && (visibleInStore > 0 || !term)) ? 'block' : 'none';
  });

  updateCatalogSummary();
}

async function loadCatalogTab() {
  const list = document.getElementById('catalog-list');
  try {
    const categories = await api.getCategories();
    renderCatalogList(categories);
  } catch (err) {
    console.warn('[Catalog] Aviso ao carregar:', err);
  }

  // Filtro de busca em tempo real
  const searchInput = document.getElementById('catalog-search');
  if (searchInput) {
    searchInput.oninput = applyCatalogFilters;
  }

  // Controles rápidos do catálogo
  document.getElementById('catalog-expand-all')?.addEventListener('click', () => {
    list?.querySelectorAll?.('.catalog-store')?.forEach((s) => s.classList.remove('collapsed'));
  });
  document.getElementById('catalog-collapse-all')?.addEventListener('click', () => {
    list?.querySelectorAll?.('.catalog-store')?.forEach((s) => s.classList.add('collapsed'));
  });
  document.getElementById('catalog-select-all')?.addEventListener('click', () => {
    list?.querySelectorAll?.('input[data-category-id]')?.forEach((cb) => {
      if (cb.closest('.catalog-category').style.display !== 'none') cb.checked = true;
    });
    updateCatalogSummary();
  });
  document.getElementById('catalog-unselect-all')?.addEventListener('click', () => {
    list?.querySelectorAll?.('input[data-category-id]')?.forEach((cb) => {
      if (cb.closest('.catalog-category').style.display !== 'none') cb.checked = false;
    });
    updateCatalogSummary();
  });
}

document.getElementById('catalog-save').addEventListener('click', async () => {
  const saveBtn = document.getElementById('catalog-save');
  const feedback = document.getElementById('catalog-feedback');
  const selectedInputs = document.querySelectorAll('#catalog-list input[data-category-id]:checked');
  const selectedIds = [...selectedInputs].map((input) => input.dataset.categoryId);

  const keywords = {};
  document.querySelectorAll('#catalog-list input[data-keyword-id]').forEach((input) => {
    const val = input.value.trim();
    keywords[input.dataset.keywordId] = val || '';
  });

  if (selectedIds.length === 0) {
    feedback.textContent = '⚠️ Selecione pelo menos uma categoria antes de salvar.';
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'Salvando…';
  feedback.textContent = '⏳ Gravando seleção e filtros…';

  try {
    await api.saveCategories(selectedIds, keywords);
    feedback.textContent = `✅ ${selectedIds.length} categoria(s) salva(s) com sucesso para monitoramento!`;
    setTimeout(() => { feedback.textContent = ''; }, 4000);
  } catch (err) {
    feedback.textContent = `🔴 ${err.message || 'Falha ao salvar categorias.'}`;
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Salvar seleção';
  }
});

// ---------- Agendamento da varredura ----------
const PAGES_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
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
    body.innerHTML = rows.map((r) => {
      const storeLogo = getStoreLogoPath(r.site_name);
      const storeLogoHtml = storeLogo ? `<img src="${storeLogo}" class="history-store-logo" alt="" /> ` : '';
      return `
      <tr>
        <td>${new Date(r.sent_at + 'Z').toLocaleString('pt-BR')}</td>
        <td><div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;">${storeLogoHtml}<small style="font-weight:600;">${escapeHtml(r.site_name || '')}</small></div><a href="${escapeHtml(safeHttpUrl(r.product_url))}" target="_blank" rel="noopener noreferrer">${escapeHtml(r.product_title)}</a></td>
        <td>${r.current_price ? formatBRL(r.current_price) : '—'}</td>
        <td>${r.discount_percent != null ? r.discount_percent + '%' : '—'}</td>
        <td>${r.score ?? '—'}</td>
        <td>${r.sent ? 'Enviado' : 'Pendente de envio'}</td>
      </tr>
    `;
    }).join('');
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

// ---------- Pareamento / Conexão Nuvem (Restrito Dev) ----------
async function loadPairingTab() {
  const isDev = await checkDevAdminAccess();
  if (!isDev) {
    showTab('onboarding');
    return;
  }
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
