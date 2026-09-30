// Sincronizador de Autenticação Profit Hunter Pro
// Conecta a sessão ativa do portal Deal Hunter Pro com a extensão de forma 100% automática

(function () {
  let lastSyncedToken = null;

  function sendAuthToExtension(token, user, license) {
    if (!token || token === lastSyncedToken) return;
    lastSyncedToken = token;

    chrome.runtime.sendMessage(
      {
        type: 'PROFIT_HUNTER_SAVE_AUTH',
        token,
        user,
        license,
      },
      (response) => {
        if (!chrome.runtime.lastError && response?.success) {
          console.log('[Profit Hunter] Licença unificada sincronizada com sucesso!');
        }
      }
    );
  }

  // 1. Escuta eventos disparados pelo Next.js / React
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
