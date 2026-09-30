function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function safeUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}

function money(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0
    ? amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Preço indisponível';
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3200);
}

function setOfflineState(isOffline, message = '') {
  const state = document.getElementById('system-state');
  const sticker = document.getElementById('offline-sticker');
  state.classList.toggle('offline', isOffline);
  state.innerHTML = `<i></i>${isOffline ? 'Offline' : 'Sistema ativo'}`;
  if (isOffline) {
    const offline = document.getElementById('offline');
    offline.textContent = message || 'Backend offline. Inicie o backend para continuar.';
    offline.classList.remove('hidden');
    sticker.src ||= chrome.runtime.getURL('sidepanel/assets/offline.gif');
    sticker.classList.remove('hidden');
  } else {
    document.getElementById('offline').classList.add('hidden');
    sticker.classList.add('hidden');
    sticker.removeAttribute('src');
  }
}

let scanWasActive = false;
let completionTimer = null;
let completionFreezeTimer = null;
let completionAnimationKey = null;
let stopRequested = false;
let offerAlertTimer = null;
let lastOfferAlertKey = null;
let alertAudioContext = null;
let alertAudioBufferPromise = null;

function prepareOfferAudio() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    alertAudioContext ||= new AudioContextClass();
    alertAudioContext.resume().catch(() => {});
    alertAudioBufferPromise ||= fetch(chrome.runtime.getURL('sidepanel/assets/offer-alert.wav'))
      .then((response) => response.arrayBuffer())
      .then((buffer) => alertAudioContext.decodeAudioData(buffer));
  } catch { /* O alerta visual continua disponível sem áudio. */ }
}

async function playOfferAudio() {
  try {
    if (alertAudioContext && alertAudioBufferPromise) {
      const buffer = await alertAudioBufferPromise;
      await alertAudioContext.resume();
      const source = alertAudioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(alertAudioContext.destination);
      source.start();
      return;
    }
    const audio = new Audio(chrome.runtime.getURL('sidepanel/assets/offer-alert.wav'));
    audio.volume = 0.85;
    await audio.play();
  } catch { /* O Chrome pode bloquear áudio se não houve interação recente. */ }
}

function showOfferAlert(offer, key) {
  if (key && key === lastOfferAlertKey) return;
  lastOfferAlertKey = key || `${offer.url}|${offer.price}|${Date.now()}`;
  const overlay = document.getElementById('offer-alert-overlay');
  document.getElementById('offer-alert-gif').src = `${chrome.runtime.getURL('sidepanel/assets/alert.gif')}?alert=${Date.now()}`;
  document.getElementById('offer-alert-store').textContent = [offer.siteName, offer.categoryName].filter(Boolean).join(' · ');
  document.getElementById('offer-alert-name').textContent = offer.name || 'Produto encontrado';
  document.getElementById('offer-alert-price').textContent = `${money(offer.price)} · ${Math.round(Number(offer.discountPercent) || 0)}% OFF`;
  overlay.classList.remove('hidden');
  playOfferAudio();
  clearTimeout(offerAlertTimer);
  offerAlertTimer = setTimeout(() => overlay.classList.add('hidden'), 10000);
}

function stopSticker(id) {
  const image = document.getElementById(id);
  image.classList.add('hidden');
  image.removeAttribute('src');
}

function playSticker(id, assetPath) {
  const image = document.getElementById(id);
  image.src = `${chrome.runtime.getURL(assetPath)}?play=${Date.now()}`;
  image.classList.remove('hidden');
}

function playCompletionSticker(key) {
  if (completionAnimationKey === key) return;
  completionAnimationKey = key;
  clearTimeout(completionTimer);
  clearTimeout(completionFreezeTimer);
  stopSticker('scan-sticker');
  const sticker = document.getElementById('completion-sticker');
  playSticker('completion-sticker', 'sidepanel/assets/sad-coffee.gif');
  completionTimer = setTimeout(() => {
    sticker.src = `${chrome.runtime.getURL('sidepanel/assets/sad-coffee-final.png')}?freeze=${Date.now()}`;
    completionFreezeTimer = setTimeout(() => stopSticker('completion-sticker'), 10000);
  }, 3280);
}

function renderScanProgress(progress) {
  if (!progress) return;
  const video = document.getElementById('fire-video');
  const animateScan = Boolean(progress.scanning && progress.manual);
  document.body.classList.toggle('is-scanning', animateScan);
  document.getElementById('live-status').textContent = progress.scanning
    ? (progress.status || 'Varredura em andamento') : (progress.status || 'Aguardando varredura');
  const location = [progress.siteName, progress.categoryName].filter(Boolean).join(' · ');
  document.getElementById('live-location').textContent = location || (progress.scanning ? 'Preparando as categorias…' : 'O andamento aparecerá aqui.');
  const card = document.getElementById('live-product');
  const product = progress.product;
  const image = safeUrl(product?.imageUrl);
  if (product?.name) {
    card.classList.remove('hidden');
    const img = document.getElementById('live-image');
    img.src = image;
    img.classList.toggle('hidden', !image);
    document.getElementById('live-product-name').textContent = product.name;
    const discountText = product.discountPercent ? ` · ${product.discountPercent}% OFF` : '';
    document.getElementById('live-product-price').textContent = `${money(product.price)}${discountText}`;
  } else {
    card.classList.add('hidden');
  }
  if (progress.offerAlert && progress.updatedAt && Date.now() - progress.updatedAt < 15000) {
    showOfferAlert(progress.offerAlert, `${progress.updatedAt}:${progress.offerAlert.url || ''}`);
    loadPanel();
  }
  if (animateScan) {
    if (!scanWasActive) {
      clearTimeout(completionTimer);
      clearTimeout(completionFreezeTimer);
      stopSticker('completion-sticker');
      playSticker('scan-sticker', 'sidepanel/assets/work.gif');
    }
    video.play().catch(() => {});
  } else {
    video.pause();
    video.currentTime = 0;
    if (scanWasActive) stopSticker('scan-sticker');
    const endedNormally = ['Verificação concluída', 'Verificação interrompida'].includes(progress.status);
    const completedRecently = endedNormally
      && progress.updatedAt && Date.now() - progress.updatedAt < 5000;
    if ((scanWasActive && endedNormally) || completedRecently) {
      playCompletionSticker(progress.updatedAt || progress.status);
    }
  }
  scanWasActive = animateScan;
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'DEAL_HUNTER_SCAN_PROGRESS') renderScanProgress(message.progress);
});
chrome.storage.local.get('scanProgress').then(({ scanProgress }) => renderScanProgress(scanProgress));
setInterval(async () => {
  const { scanProgress } = await chrome.storage.local.get('scanProgress');
  if (scanProgress?.scanning && scanProgress.updatedAt && Date.now() - scanProgress.updatedAt > 120000) {
    renderScanProgress({ ...scanProgress, scanning: false, status: 'Varredura interrompida' });
  }
}, 15000);

function getStoreLogoUrl(siteName) {
  const norm = (siteName || '').toLowerCase().trim();
  let file = null;
  if (norm.includes('amazon')) file = 'amazon.png';
  else if (norm.includes('kabum')) file = 'kabum.png';
  else if (norm.includes('shein')) file = 'shein.png';
  else if (norm.includes('pichau')) file = 'pichau.png';
  else if (norm.includes('shopee')) file = 'shopee.png';
  else if (norm.includes('renner')) file = 'renner.png';
  else if (norm.includes('magalu') || norm.includes('magazine')) file = 'magalu.png';
  else if (norm.includes('eletroclub')) file = 'eletroclub.png';
  return file ? chrome.runtime.getURL(`icons/stores/${file}`) : null;
}

function renderOffers(rows) {
  const target = document.getElementById('offer-list');
  if (!rows.length) {
    target.innerHTML = '<div class="empty">Ainda não há ofertas registradas.<br>Selecione lojas e categorias e inicie uma verificação.</div>';
    return;
  }
  target.innerHTML = rows.map((row) => {
    const href = safeUrl(row.product_url);
    const image = safeUrl(row.thumbnail);
    const title = escapeHtml(row.product_title || 'Produto sem nome');
    const discount = Number(row.discount_percent);
    const currentAmount = Number(row.current_price);
    const originalAmount = Number(row.site_original_price);
    const suspiciousReference = currentAmount > 0 && originalAmount > currentAmount * 10;
    const badge = suspiciousReference ? 'REVISAR'
      : row.discount_percent != null && Number.isFinite(discount) ? `${Math.round(discount)}% OFF` : 'Oferta';
    const imgHtml = image
      ? `<img src="${escapeHtml(image)}" alt="" loading="lazy" />`
      : '<span class="image-placeholder">◇</span>';
    const price = money(row.current_price);
    const reference = money(row.site_original_price);
    const date = row.sent_at ? new Date(`${row.sent_at.replace(' ', 'T')}Z`).toLocaleDateString('pt-BR') : '';
    const storeLogo = getStoreLogoUrl(row.site_name);
    const storeLogoHtml = storeLogo
      ? `<img src="${storeLogo}" class="offer-store-logo" alt="" />`
      : '';
    return `<article class="offer-card"><a class="offer-link" href="${escapeHtml(href || '#')}" ${href ? 'target="_blank" rel="noopener noreferrer"' : ''}>
      <div class="offer-image">${imgHtml}</div><div class="offer-info"><div class="offer-store"><span style="display:inline-flex;align-items:center;gap:5px;">${storeLogoHtml}${escapeHtml(row.site_name || 'Loja')}</span><span class="discount">${badge}</span></div>
      <div class="offer-title">${title}</div><div class="offer-price">${price}</div>
      <div class="offer-reference">${suspiciousReference ? 'Preço de referência descartado por inconsistência' : row.site_original_price ? `De ${reference}` : 'Referência calculada pelo histórico'}</div>
      <div class="offer-meta"><span>${row.sent ? 'Enviado ao Telegram' : 'Não enviado'}</span><span>${escapeHtml(date)}</span></div></div></a></article>`;
  }).join('');
}

async function loadPanel() {
  try {
    const [status, offers, categories] = await Promise.all([
      api.getStatus(), api.getHistory(), api.getCategories(),
    ]);
    setOfflineState(false);
    document.getElementById('products-count').textContent = status.productsTracked ?? 0;
    document.getElementById('offers-count').textContent = status.opportunitiesFound ?? 0;
    document.getElementById('last-scan').textContent = status.lastScan?.finishedAt
      ? new Date(`${status.lastScan.finishedAt.replace(' ', 'T')}Z`).toLocaleString('pt-BR')
      : 'ainda não executada';
    const selected = categories.filter((category) => category.selected).length;
    document.getElementById('category-label').textContent = `${selected} categoria(s) monitorada(s)`;
    document.getElementById('telegram-label').textContent = status.telegramConnected ? 'Telegram conectado' : 'Telegram não configurado';
    renderOffers(offers);
  } catch (error) {
    setOfflineState(true, `Backend indisponível: ${error.message}. Inicie o backend e confira o pareamento nas configurações.`);
    document.getElementById('offer-list').innerHTML = '<div class="empty">Conecte o backend local para ver as ofertas.</div>';
  }
}

async function refreshBackendConnection() {
  try { await api.getStatus(); setOfflineState(false); }
  catch (error) { setOfflineState(true, `Backend offline: ${error.message}`); }
}

document.getElementById('settings').addEventListener('click', () => chrome.runtime.openOptionsPage());
document.getElementById('offer-alert-close').addEventListener('click', () => {
  clearTimeout(offerAlertTimer);
  document.getElementById('offer-alert-overlay').classList.add('hidden');
});
document.getElementById('catalog').addEventListener('click', () => chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html#catalog') }));
document.getElementById('refresh').addEventListener('click', loadPanel);
document.querySelectorAll('.nav-button').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.nav-button').forEach((item) => item.classList.toggle('active', item === button));
  if (button.dataset.view === 'stores') {
    chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html#catalog') });
  } else if (button.dataset.view === 'offers') {
    document.getElementById('list-title').textContent = 'Todas as ofertas';
    api.getHistory().then(renderOffers).catch((error) => showToast(error.message));
  } else {
    document.getElementById('list-title').textContent = 'Ofertas encontradas';
    loadPanel();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}));

let currentLicense = null;

async function getWebAuthUrl() {
  const { webAuthUrl } = await chrome.storage.local.get('webAuthUrl');
  return webAuthUrl || 'https://deal-hunter-guilhermernascimento-9353s-projects.vercel.app';
}

function updateLicenseUI(license) {
  currentLicense = license;
  const badge = document.getElementById('license-badge');
  const gateBanner = document.getElementById('license-gate-banner');
  const scanButton = document.getElementById('scan');

  if (!badge) return;

  badge.className = 'license-badge';

  if (license?.role === 'admin') {
    badge.classList.add('license-admin');
    badge.innerHTML = '👑 Admin';
    badge.title = 'Acesso Administrativo Vitalício';
    gateBanner?.classList.add('hidden');
    if (scanButton && !document.body.classList.contains('is-scanning')) {
      scanButton.disabled = false;
    }
  } else if (license?.authorized) {
    badge.classList.add('license-active');
    badge.innerHTML = '✅ Pro Ativo';
    badge.title = `Plano Pro Ativo (${license.email || ''})`;
    gateBanner?.classList.add('hidden');
    if (scanButton && !document.body.classList.contains('is-scanning')) {
      scanButton.disabled = false;
    }
  } else {
    badge.classList.add('license-restricted');
    badge.innerHTML = '🔒 Restrito';
    badge.title = 'Acesso restrito. Faça login ou assine o plano Pro.';
    gateBanner?.classList.remove('hidden');
    if (scanButton && !document.body.classList.contains('is-scanning')) {
      scanButton.disabled = true;
    }
  }
}

async function loadLicense() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'DEAL_HUNTER_GET_LICENSE' }, (response) => {
      if (!chrome.runtime.lastError && response?.license) {
        updateLicenseUI(response.license);
        resolve(response.license);
      } else {
        chrome.storage.local.get('licenseStatus', ({ licenseStatus }) => {
          updateLicenseUI(licenseStatus);
          resolve(licenseStatus);
        });
      }
    });
  });
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && (changes.licenseStatus || changes.auth_token)) {
    chrome.storage.local.get('licenseStatus', ({ licenseStatus }) => {
      updateLicenseUI(licenseStatus);
    });
  }
});

document.getElementById('gate-login-btn')?.addEventListener('click', async () => {
  const url = await getWebAuthUrl();
  chrome.tabs.create({ url: `${url}/login?extensionId=${chrome.runtime.id}` });
  // Agenda verificações pós-login
  setTimeout(() => loadLicense(), 3000);
  setTimeout(() => loadLicense(), 8000);
});

document.getElementById('gate-subscribe-btn')?.addEventListener('click', async () => {
  const url = await getWebAuthUrl();
  chrome.tabs.create({ url: `${url}/login?extensionId=${chrome.runtime.id}` });
});

document.getElementById('scan').addEventListener('click', async (event) => {
  if (!currentLicense?.authorized) {
    showToast('Acesso restrito: faça login ou ative sua assinatura Pro.');
    return;
  }
  const button = event.currentTarget;
  const stopButton = document.getElementById('scan-stop');
  prepareOfferAudio();
  stopRequested = false;
  button.disabled = true;
  button.textContent = 'Verificando categorias…';
  stopButton.classList.remove('hidden');
  try {
    const result = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'DEAL_HUNTER_RUN_BROWSER_SCAN' }, (response) => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else if (!response) reject(new Error('A extensão não respondeu. Recarregue-a em chrome://extensions.'));
        else resolve(response);
      });
    });
    if (result.status === 'cancelled') showToast('Varredura interrompida.');
    else if (result.status === 'skipped') showToast('Selecione lojas e categorias nas configurações.');
    else if (result.status === 'running') showToast(result.message);
    else if (result.status === 'error' || result.status === 'partial') showToast(`Varredura parcial: ${result.errors?.[0] || result.message || 'verifique o backend.'}`);
    else showToast(`Varredura concluída: ${result.itemsScanned || 0} produtos e ${result.alertsSent || 0} alertas.`);
    await loadPanel();
    chrome.runtime.sendMessage({ type: 'DEAL_HUNTER_REFRESH_BADGE' });
  } catch (error) {
    showToast(error.message);
  } finally {
    button.disabled = !currentLicense?.authorized;
    button.innerHTML = '<span>⌕</span> Verificar agora no Chrome';
    stopButton.classList.add('hidden');
    stopRequested = false;
  }
});

document.getElementById('scan-stop').addEventListener('click', (event) => {
  const stopButton = event.currentTarget;
  if (stopRequested) return;
  stopRequested = true;
  stopButton.disabled = true;
  stopButton.textContent = 'Parando…';
  chrome.runtime.sendMessage({ type: 'DEAL_HUNTER_STOP_BROWSER_SCAN' }, (result) => {
    if (chrome.runtime.lastError || result?.ok === false) {
      showToast(result?.message || chrome.runtime.lastError?.message || 'Não foi possível parar a varredura.');
      stopRequested = false;
      stopButton.disabled = false;
      stopButton.textContent = '■ Parar varredura';
    }
  });
});

loadPanel();
loadLicense();
setInterval(refreshBackendConnection, 10000);
