// ==============================================================================
// Profit Hunter Pro — Script de Conteúdo & Botão Flutuante de Captura
// ==============================================================================

// Verifica se o botão flutuante já foi injetado para evitar duplicidade
if (!document.getElementById('profit-hunter-float-btn')) {
  const floatBtn = document.createElement('div');
  floatBtn.id = 'profit-hunter-float-btn';
  floatBtn.innerHTML = `
    <span style="display: inline-flex; align-items: center; gap: 8px;">
      <span style="font-size: 16px;">🎯</span>
      <span>Enviar Oferta</span>
    </span>
  `;
  floatBtn.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999999;
    background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%);
    color: #ffffff;
    padding: 11px 18px;
    border-radius: 9999px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-weight: 800;
    font-size: 13px;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(79, 70, 229, 0.4), 0 2px 6px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(8px);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    user-select: none;
  `;

  floatBtn.onmouseover = () => {
    floatBtn.style.transform = 'translateY(-2px) scale(1.03)';
    floatBtn.style.boxShadow = '0 12px 28px rgba(79, 70, 229, 0.55), 0 4px 10px rgba(0, 0, 0, 0.4)';
    floatBtn.style.borderColor = 'rgba(255, 255, 255, 0.35)';
  };
  floatBtn.onmouseout = () => {
    floatBtn.style.transform = 'translateY(0) scale(1)';
    floatBtn.style.boxShadow = '0 8px 24px rgba(79, 70, 229, 0.4), 0 2px 6px rgba(0, 0, 0, 0.3)';
    floatBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
  };
  floatBtn.onmousedown = () => {
    floatBtn.style.transform = 'scale(0.97)';
  };

  let isSending = false;

  floatBtn.onclick = () => {
    if (isSending) return;
    isSending = true;

    floatBtn.innerHTML = `
      <span style="display: inline-flex; align-items: center; gap: 8px;">
        <span style="font-size: 15px;">⏳</span>
        <span>Capturando...</span>
      </span>
    `;

    // Extrai os dados do produto com base em seletores comuns (Mercado Livre / Amazon / Magalu / Shopee / E-commerce geral)
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

    const url = window.location.href;

    // Envia os dados para o background service worker disparar no Telegram
    chrome.runtime.sendMessage(
      {
        action: 'sendOffer',
        data: { title, price, url },
      },
      (response) => {
        isSending = false;
        if (response && response.success) {
          floatBtn.innerHTML = `
            <span style="display: inline-flex; align-items: center; gap: 8px;">
              <span style="font-size: 15px;">✅</span>
              <span>Oferta Enviada!</span>
            </span>
          `;
          floatBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
          floatBtn.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.45)';
          setTimeout(() => {
            floatBtn.innerHTML = `
              <span style="display: inline-flex; align-items: center; gap: 8px;">
                <span style="font-size: 16px;">🎯</span>
                <span>Enviar Oferta</span>
              </span>
            `;
            floatBtn.style.background = 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)';
            floatBtn.style.boxShadow = '0 8px 24px rgba(79, 70, 229, 0.4), 0 2px 6px rgba(0, 0, 0, 0.3)';
          }, 3000);
        } else {
          const errMsg = response?.error || 'Verifique as configurações do Telegram na extensão.';
          floatBtn.innerHTML = `
            <span style="display: inline-flex; align-items: center; gap: 8px;">
              <span style="font-size: 15px;">⚠️</span>
              <span>Erro ao Enviar</span>
            </span>
          `;
          floatBtn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
          alert(`Profit Hunter Pro: ${errMsg}`);
          setTimeout(() => {
            floatBtn.innerHTML = `
              <span style="display: inline-flex; align-items: center; gap: 8px;">
                <span style="font-size: 16px;">🎯</span>
                <span>Enviar Oferta</span>
              </span>
            `;
            floatBtn.style.background = 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)';
          }, 3000);
        }
      }
    );
  };

  document.body.appendChild(floatBtn);
}