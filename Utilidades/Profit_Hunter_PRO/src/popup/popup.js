// ==============================================================================
// Profit Hunter Pro — Script do Popup
// ==============================================================================

document.addEventListener('DOMContentLoaded', () => {
  initPopup();
});

async function initPopup() {
  bindEvents();
  await refreshAuthAndStatus();
  await loadOfferHistory();
}

function bindEvents() {
  // Botão de abrir configurações
  document.getElementById('btn-settings')?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Botão de login na web
  document.getElementById('btn-open-login')?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'PROFIT_HUNTER_OPEN_LOGIN' });
  });

  // Botão de logout
  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    if (confirm('Deseja realmente desconectar sua conta?')) {
      chrome.runtime.sendMessage({ type: 'PROFIT_HUNTER_LOGOUT' }, () => {
        refreshAuthAndStatus();
      });
    }
  });

  // Botão de limpar histórico
  document.getElementById('clearHistoryBtn')?.addEventListener('click', async () => {
    if (confirm('Deseja limpar todo o histórico de ofertas capturadas?')) {
      await chrome.storage.local.set({ offerHistory: [] });
      loadOfferHistory();
    }
  });

  // Botão de Captura de Produto na Tela
  document.getElementById('captureBtn')?.addEventListener('click', handleCapture);
}

// ---------- Verificação de Autenticação e Licença ----------
async function refreshAuthAndStatus() {
  const authBar = document.getElementById('auth-status-bar');
  const loginBar = document.getElementById('login-prompt-bar');
  const authBadge = document.getElementById('auth-badge');
  const authEmail = document.getElementById('auth-email');
  const captureBtn = document.getElementById('captureBtn');
  const telegramIndicator = document.getElementById('telegram-indicator');

  // 1. Verifica licença no background / storage local
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
    authBar?.classList.remove('hidden');
    loginBar?.classList.add('hidden');

    const email = license?.email || 'Licença Ativa';
    if (authEmail) authEmail.textContent = email;

    if (authBadge) {
      if (license.is_trial) {
        const days = license.trial_days_left || 7;
        authBadge.textContent = `${days}D GRÁTIS`;
        authBadge.className = 'badge badge--warn';
      } else {
        authBadge.textContent = 'PRO ATIVO';
        authBadge.className = 'badge badge--success';
      }
    }

    if (captureBtn) {
      captureBtn.disabled = false;
      captureBtn.style.opacity = '1';
    }
  } else {
    authBar?.classList.add('hidden');
    loginBar?.classList.remove('hidden');

    if (captureBtn) {
      captureBtn.disabled = true;
      captureBtn.style.opacity = '0.5';
    }
  }

  // 2. Verifica configuração do Telegram
  const syncData = await chrome.storage.sync.get(['telegramToken', 'telegramChatId']);
  const localData = await chrome.storage.local.get(['telegramToken', 'telegramChatId']);
  const hasTelegram = Boolean((syncData.telegramToken || localData.telegramToken) && (syncData.telegramChatId || localData.telegramChatId));

  if (telegramIndicator) {
    if (hasTelegram) {
      telegramIndicator.textContent = '🟢 Telegram Conectado';
      telegramIndicator.className = 'status-indicator online';
    } else {
      telegramIndicator.textContent = '⚠️ Configurar Telegram';
      telegramIndicator.className = 'status-indicator warning';
    }
  }
}

// ---------- Captura de Produto na Aba Ativa ----------
async function handleCapture() {
  const btn = document.getElementById('captureBtn');
  const btnText = document.getElementById('captureBtnText');

  btn.disabled = true;
  btnText.textContent = 'Capturando...';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      throw new Error('Nenhuma aba ativa encontrada.');
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const titleEl = document.querySelector('h1.ui-pdp-title') ||
                        document.querySelector('#productTitle') ||
                        document.querySelector('h1.header-product__title') ||
                        document.querySelector('span.B_NuCI') ||
                        document.querySelector('h1');

        const priceFraction = document.querySelector('.andes-money-amount__fraction') ||
                              document.querySelector('.price-tag-fraction') ||
                              document.querySelector('.a-price-whole') ||
                              document.querySelector('[data-testid="price-value"]') ||
                              document.querySelector('.price-template__current-price');

        const title = titleEl ? titleEl.innerText.trim() : document.title;
        let price = priceFraction ? 'R$ ' + priceFraction.innerText.trim() : '';

        if (!price) {
          const elements = document.querySelectorAll('span, div, h2, h3, p');
          for (let el of elements) {
            const text = el.innerText ? el.innerText.trim() : '';
            if ((text.startsWith('R$') || /^\d{1,3}(\.\d{3})*,\d{2}$/.test(text)) && text.length < 15) {
              price = text.startsWith('R$') ? text : 'R$ ' + text;
              break;
            }
          }
        }

        if (!price) {
          price = 'Preço sob consulta';
        }

        return {
          title,
          price,
          url: window.location.href,
        };
      },
    });

    if (results && results[0] && results[0].result) {
      const offerData = results[0].result;

      chrome.runtime.sendMessage({ action: 'sendOffer', data: offerData }, (res) => {
        if (res && res.success) {
          btnText.textContent = '✅ Oferta Enviada ao Telegram!';
          setTimeout(() => {
            btnText.textContent = 'Capturar Produto da Tela';
            btn.disabled = false;
            loadOfferHistory();
          }, 2000);
        } else {
          alert(`Profit Hunter: ${res?.error || 'Erro ao enviar para o Telegram.'}`);
          btnText.textContent = 'Capturar Produto da Tela';
          btn.disabled = false;
        }
      });
    } else {
      throw new Error('Não foi possível ler os dados do produto.');
    }
  } catch (err) {
    alert(`Erro na captura: ${err.message}`);
    btnText.textContent = 'Capturar Produto da Tela';
    btn.disabled = false;
  }
}

// ---------- Carrega Histórico Recente ----------
async function loadOfferHistory() {
  const container = document.getElementById('historyList');
  if (!container) return;

  const data = await chrome.storage.local.get(['offerHistory']);
  const history = data.offerHistory || [];

  if (history.length === 0) {
    container.innerHTML = '<div class="empty-state">Nenhuma oferta capturada ainda.</div>';
    return;
  }

  container.innerHTML = history.slice(0, 15).map((item) => {
    const title = escapeHtml(item.title || 'Produto');
    const price = escapeHtml(item.price || 'Consulte');
    const url = safeUrl(item.url || '#');
    const date = escapeHtml(item.date || '');

    return `
      <div class="history-item">
        <div class="history-item__title" title="${title}">${title}</div>
        <div class="history-item__footer">
          <span class="history-item__price">${price}</span>
          ${date ? `<span style="color: #64748b; font-size: 10px;">${date}</span>` : ''}
          <a href="${url}" target="_blank" class="history-item__link">Ver Produto ↗</a>
        </div>
      </div>
    `;
  }).join('');
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

function safeUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : '#';
  } catch {
    return '#';
  }
}
