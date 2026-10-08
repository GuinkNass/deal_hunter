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

  // 3. Ponte bidirecional para Varredura do Mercado Livre no navegador (Anti-Bloqueio)
  window.addEventListener('message', (event) => {
    if (event.data?.source === 'DEAL_HUNTER_WEB' && event.data?.type === 'DEAL_HUNTER_SCRAPE_ML') {
      const { requestId, query, title } = event.data;
      const searchTerm = (query || title || '').trim();

      console.log('[Deal Hunter Extension] Solicitando varredura no Mercado Livre para:', searchTerm);

      chrome.runtime.sendMessage(
        {
          type: 'DEAL_HUNTER_SCRAPE_MERCADO_LIVRE',
          query: searchTerm,
          requestId,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.warn('[Deal Hunter Extension] Erro ao comunicar com background:', chrome.runtime.lastError.message);
            window.postMessage(
              {
                source: 'DEAL_HUNTER_EXTENSION',
                type: 'DEAL_HUNTER_SCRAPE_ML_RESULT',
                requestId,
                success: false,
                error: chrome.runtime.lastError.message,
                products: [],
              },
              '*'
            );
            return;
          }

          console.log('[Deal Hunter Extension] Varredura ML concluída:', response?.products?.length || 0, 'produtos encontrados');
          window.postMessage(
            {
              source: 'DEAL_HUNTER_EXTENSION',
              type: 'DEAL_HUNTER_SCRAPE_ML_RESULT',
              requestId,
              success: response?.success ?? true,
              products: response?.products || [],
              productsFound: response?.productsFound || response?.products?.length || 0,
              query: response?.query || searchTerm,
            },
            '*'
          );
        }
      );
    }
  });

  // Avisa a página web que a extensão está ativa e pronta para varredura no navegador
  function notifyExtensionReady() {
    window.postMessage(
      {
        source: 'DEAL_HUNTER_EXTENSION',
        type: 'EXTENSION_READY',
        version: '1.2.0',
        capabilities: ['ML_SCRAPE', 'AUTH_SYNC', 'BROWSER_SCAN'],
      },
      '*'
    );
  }

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
    notifyExtensionReady();
  }

  // Executa imediatamente e a cada 1.5s enquanto o usuário estiver na página
  inspectDOMBridge();
  setInterval(inspectDOMBridge, 1500);
})();
