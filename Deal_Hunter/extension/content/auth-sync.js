// Sincronizador de Autenticação Deal Hunter
// Conecta a sessão ativa do site (Vercel) com a extensão local de forma 100% automática

(function () {
  let lastSyncedToken = null;

  function sendAuthToExtension(token, user, license) {
    if (!token || token === lastSyncedToken) return;
    lastSyncedToken = token;

    chrome.runtime.sendMessage(
      {
        type: 'DEAL_HUNTER_SAVE_AUTH',
        token,
        user,
        license,
      },
      (response) => {
        if (!chrome.runtime.lastError && response?.success) {
          console.log('[Deal Hunter] Licença Pro sincronizada com sucesso com a extensão!');
          // Dispara confirmação visual no DOM do site se o elemento existir
          window.postMessage({ source: 'DEAL_HUNTER_EXTENSION', type: 'SYNC_CONFIRMED' }, '*');
        }
      }
    );
  }

  // 1. Escuta eventos disparados pelo React / Next.js
  window.addEventListener('message', (event) => {
    if (event.data?.source === 'DEAL_HUNTER_WEB' && event.data?.type === 'AUTH_SYNC') {
      const { token, user, license } = event.data;
      sendAuthToExtension(token, user, license);
    }
  });

  // 2. Inspeciona o elemento ponte no DOM periodicamente
  function inspectDOMBridge() {
    const bridge = document.getElementById('deal-hunter-auth-payload');
    if (bridge) {
      try {
        const token = bridge.getAttribute('data-token');
        const user = JSON.parse(bridge.getAttribute('data-user') || '{}');
        const license = JSON.parse(bridge.getAttribute('data-license') || '{}');
        if (token) {
          sendAuthToExtension(token, user, license);
        }
      } catch (_) {}
    }
  }

  // Executa imediatamente e a cada 1.5s enquanto o usuário estiver na página
  inspectDOMBridge();
  setInterval(inspectDOMBridge, 1500);
})();
