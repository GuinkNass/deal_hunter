importScripts('../config.js', '../utils/api.js');

const SYNC_ALARM = 'deal-hunter-status-badge';
const LICENSE_ALARM = 'deal-hunter-license-alarm';
const DEFAULT_WEB_URL = typeof CONFIG !== 'undefined'
  ? CONFIG.WEB_AUTH_URL
  : 'https://deal-hunter-guilhermernascimento-9353s-projects.vercel.app';
const MAX_BROWSER_PAGES_PER_SCAN = 300;
const BROWSER_PAGE_TIMEOUT_MS = 30000;
let currentBrowserScan = null;
let currentBrowserScanControl = null;
let scanProgressContext = null;

async function getWebAuthUrl() {
  const { webAuthUrl } = await chrome.storage.local.get('webAuthUrl');
  return webAuthUrl || (typeof CONFIG !== 'undefined' ? CONFIG.WEB_AUTH_URL : DEFAULT_WEB_URL);
}

async function verifyLicenseStatus() {
  try {
    const { auth_token } = await chrome.storage.local.get('auth_token');
    if (!auth_token) {
      const unauth = { authorized: false, reason: 'missing_token', checkedAt: Date.now() };
      await chrome.storage.local.set({ licenseStatus: unauth });
      return unauth;
    }

    const baseUrl = await getWebAuthUrl();
    const response = await fetch(`${baseUrl}/api/auth/verify-license`, {
      headers: {
        Authorization: `Bearer ${auth_token}`,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const failed = {
        authorized: false,
        reason: err.error || `HTTP ${response.status}`,
        checkedAt: Date.now(),
      };
      await chrome.storage.local.set({ licenseStatus: failed });
      return failed;
    }

    const data = await response.json();
    const license = {
      authorized: !!data.authorized,
      role: data.role || 'user',
      plan: data.plan || 'none',
      subscription_status: data.subscription_status || 'inactive',
      email: data.email || null,
      current_period_end: data.current_period_end || null,
      checkedAt: Date.now(),
    };
    await chrome.storage.local.set({ licenseStatus: license });
    return license;
  } catch (error) {
    console.warn('Deal Hunter: falha ao verificar licença:', error.message);
    const { licenseStatus } = await chrome.storage.local.get('licenseStatus');
    return licenseStatus || { authorized: false, reason: error.message, checkedAt: Date.now() };
  }
}

async function checkAuthorization() {
  const { licenseStatus } = await chrome.storage.local.get('licenseStatus');
  if (!licenseStatus || (Date.now() - (licenseStatus.checkedAt || 0) > 30 * 60 * 1000)) {
    return await verifyLicenseStatus();
  }
  return licenseStatus;
}

chrome.runtime.onMessageExternal.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'AUTH_SUCCESS') {
    const { token, user, license } = message;
    (async () => {
      try {
        const isAuth = !!(license?.authorized || user?.authorized);
        await chrome.storage.local.set({
          auth_token: token,
          apiToken: token,
          auth_user: user,
          licenseStatus: {
            authorized: isAuth,
            role: license?.role || user?.role || 'user',
            plan: license?.plan || user?.plan || 'pro',
            subscription_status: license?.subscription_status || user?.subscription_status || 'active',
            email: license?.email || user?.email || '',
            checkedAt: Date.now(),
          },
        });
        const fresh = await verifyLicenseStatus();
        sendResponse({ success: true, licenseStatus: fresh });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message?.type === 'SCAN_ML_PRODUCTS') {
    const { query, maxPages = 2, sourcePrice = 0 } = message;
    scanMercadoLivreSecondaryTab(query, maxPages, sourcePrice)
      .then((items) => sendResponse({ success: true, items }))
      .catch((err) => sendResponse({ success: false, error: err.message, items: [] }));
    return true;
  }

  return false;
});

/**
 * Varredura cirúrgica do Mercado Livre em aba secundária em segundo plano.
 * Abre a aba de busca invisível/inativa, extrai os cards reais e fecha a aba imediatamente.
 */
async function scanMercadoLivreSecondaryTab(query, maxPages = 2, sourcePrice = 0) {
  if (!query) return [];

  const cleanSlug = query
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const targetPages = Math.min(Math.max(1, maxPages), 2);
  const allResults = [];
  const seenIds = new Set();

  for (let page = 1; page <= targetPages; page++) {
    const offset = (page - 1) * 50 + 1;
    const url =
      page === 1
        ? `https://lista.mercadolivre.com.br/${encodeURIComponent(cleanSlug)}`
        : `https://lista.mercadolivre.com.br/${encodeURIComponent(cleanSlug)}_Desde_${offset}`;

    let tab = null;
    try {
      tab = await chrome.tabs.create({ url, active: false });

      // Sondagem ativa: verifica o DOM periodicamente até os cards estarem renderizados
      const startTime = Date.now();
      const maxWaitMs = 15000;
      let pageExtracted = [];

      while (Date.now() - startTime < maxWaitMs) {
        try {
          const currentTab = await chrome.tabs.get(tab.id);
          if (!currentTab) break;

          // Se estiver em tela intermediária ou redirecionamento de verificação, concede tempo para hidratar
          if (currentTab.url && currentTab.url.includes('account-verification')) {
            await new Promise((r) => setTimeout(r, 600));
            continue;
          }

          const execResult = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              const bodyText = document.body ? document.body.innerText : '';
              const isNoResult =
                bodyText.includes('Não há anúncios que coincidam') ||
                Boolean(document.querySelector('.ui-search-rescue'));

              const cards = Array.from(
                document.querySelectorAll(
                  'li.ui-search-layout__item, div.ui-search-result__wrapper, div[class*="poly-card"]'
                )
              );

              // Se ainda não há cards no DOM e a página não deu mensagem definitiva de vazio, aguarda mais um pouco
              if (cards.length === 0) {
                return isNoResult ? { noResults: true, items: [] } : null;
              }

              const extracted = [];
              const seen = new Set();

              for (const card of cards) {
                const titleEl =
                  card.querySelector('a.poly-component__title') ||
                  card.querySelector('a[href*="/p/MLB"]') ||
                  card.querySelector('a[href*="produto.mercadolivre"]') ||
                  card.querySelector('.ui-search-item__title');
                if (!titleEl) continue;

                const rawHref = titleEl.getAttribute('href') || '';
                if (!rawHref) continue;

                const fullUrl = rawHref.startsWith('http')
                  ? rawHref
                  : `https://www.mercadolivre.com.br${rawHref}`;
                const cleanUrl = fullUrl.split('#')[0].split('?')[0];

                const widMatch = fullUrl.match(/[?&#]wid=(MLB\d+)/i);
                const pMatch = fullUrl.match(/\/p\/(MLB\d+)/i);
                const directMatch = fullUrl.match(/(MLB-?\d+)/i);
                const mlbId = widMatch
                  ? widMatch[1]
                  : pMatch
                  ? pMatch[1]
                  : directMatch
                  ? directMatch[1].replace('-', '')
                  : '';

                if (!mlbId || seen.has(mlbId)) continue;
                seen.add(mlbId);

                const title = (titleEl.textContent || titleEl.getAttribute('title') || '').trim();

                let price = 0;
                const fracEl = card.querySelector('.andes-money-amount__fraction');
                const centsEl = card.querySelector('.andes-money-amount__cents');
                if (fracEl) {
                  price = parseFloat(
                    `${fracEl.textContent.replace(/\./g, '')}.${centsEl ? centsEl.textContent : '00'}`
                  );
                } else {
                  const priceAria = card.querySelector('[aria-label*="reais"]');
                  if (priceAria) {
                    const pText = priceAria.getAttribute('aria-label') || '';
                    const numMatch = pText.match(/(\d+)\s*reais(?:.*?(\d+)\s*centavos)?/i);
                    if (numMatch) price = parseFloat(`${numMatch[1]}.${numMatch[2] || '00'}`);
                  }
                }

                const sellerEl =
                  card.querySelector('.poly-component__seller') ||
                  card.querySelector('[class*="seller"]') ||
                  card.querySelector('.ui-search-item__group__element--seller');
                const sellerNickname = sellerEl
                  ? sellerEl.textContent.replace(/por\s+/i, '').trim()
                  : 'Vendedor Mercado Livre';

                const salesEl =
                  card.querySelector('.poly-component__review-compacted') ||
                  card.querySelector('.andes-visually-hidden');
                let salesRaw = salesEl ? salesEl.textContent.trim() : '';
                if (!salesRaw || !salesRaw.includes('vendido')) {
                  const anySales = card.innerText.match(/(\+?\d+[\d.]*(?:\s*mil)?\s*vendidos?)/i);
                  if (anySales) salesRaw = anySales[1];
                }

                let salesCount = 0;
                if (salesRaw) {
                  const mil = salesRaw.match(/(\d+(?:[.,]\d+)?)\s*(?:mil|k)\b/i);
                  if (mil) {
                    salesCount = Math.round(parseFloat(mil[1].replace(',', '.')) * 1000);
                  } else {
                    const direct = salesRaw.match(/(\d[\d.]*)\s*(?:produtos\s*)?vendidos?/i);
                    if (direct) {
                      salesCount = parseInt(direct[1].replace(/\./g, ''), 10) || 0;
                    } else {
                      const anyNum = salesRaw.match(/\b\d+\b/);
                      salesCount = anyNum ? parseInt(anyNum[0], 10) : 0;
                    }
                  }
                }

                const isFull =
                  card.innerHTML.includes('fulfillment') ||
                  card.innerHTML.includes('FULL') ||
                  card.innerHTML.includes('icon-full');
                const freeShipping = card.innerText.includes('Frete grátis') || price >= 79.0;

                extracted.push({
                  id: mlbId,
                  title,
                  url: cleanUrl,
                  price,
                  salesCount,
                  sellerNickname,
                  isFull,
                  freeShipping,
                });
              }

              return { noResults: false, items: extracted };
            },
          });

          const pollRes = execResult && execResult[0]?.result;
          if (pollRes) {
            if (pollRes.items && pollRes.items.length > 0) {
              pageExtracted = pollRes.items;
              break; // Sucesso! Produtos extraídos com exatidão
            } else if (pollRes.noResults) {
              break; // Busca confirmadamente sem resultados
            }
          }
        } catch (pollErr) {
          // Erros transitórios de injeção enquanto a página navega
        }

        await new Promise((r) => setTimeout(r, 600));
      }

      for (const it of pageExtracted) {
        if (!seenIds.has(it.id)) {
          seenIds.add(it.id);
          allResults.push(it);
        }
      }
    } catch (e) {
      console.warn('Deal Hunter: erro ao varrer aba secundária do Mercado Livre:', e.message);
    } finally {
      if (tab && tab.id) {
        chrome.tabs.remove(tab.id).catch(() => {});
      }
    }

    if (allResults.length >= 10) break;
  }

  return allResults;
}

async function closeExistingScanWindows() {
  try {
    const { activeScanWindowId } = await chrome.storage.local.get('activeScanWindowId');
    if (activeScanWindowId) {
      await chrome.windows.remove(activeScanWindowId).catch(() => {});
      await chrome.storage.local.remove('activeScanWindowId');
    }
  } catch {}
}

chrome.runtime.onInstalled.addListener(() => {
  closeExistingScanWindows();
  chrome.alarms.create(SYNC_ALARM, { periodInMinutes: 5 });
  chrome.alarms.create(LICENSE_ALARM, { periodInMinutes: 30 });
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => {
    console.warn('Deal Hunter: não foi possível configurar a abertura lateral:', error.message);
  });
  updateBadge();
  verifyLicenseStatus();
});

chrome.runtime.onStartup.addListener(() => {
  closeExistingScanWindows();
  chrome.alarms.create(SYNC_ALARM, { periodInMinutes: 5 });
  chrome.alarms.create(LICENSE_ALARM, { periodInMinutes: 30 });
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  updateBadge();
  verifyLicenseStatus();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === LICENSE_ALARM) {
    await verifyLicenseStatus();
  } else if (alarm.name === SYNC_ALARM) {
    await updateBadge();
    await runScheduledBrowserScan();
  }
});

async function updateBadge() {
  try {
    const status = await api.getStatus();
    const count = status.opportunitiesFound || 0;
    chrome.action.setBadgeText({ text: count > 0 ? String(count > 99 ? '99+' : count) : '' });
    chrome.action.setBadgeBackgroundColor({ color: '#0284c7' });
  } catch {
    chrome.action.setBadgeText({ text: '' });
  }
}

async function runScheduledBrowserScan() {
  try {
    const license = await checkAuthorization();
    if (!license?.authorized) return;
    const config = await api.getScanConfig();
    if (!config.selectedCategories) return;
    const { lastBrowserScanAt } = await chrome.storage.local.get('lastBrowserScanAt');
    const intervalMs = Math.max(15, Number(config.scanIntervalMinutes) || 30) * 60_000;
    if (lastBrowserScanAt && Date.now() - lastBrowserScanAt < intervalMs) return;
    await closeExistingScanWindows();
    await runBrowserScan(false);
  } catch (error) {
    console.warn('Deal Hunter: varredura agendada não iniciada:', error.message);
  }
}

function waitForTabComplete(tabId, expectedUrl = null, previousUrl = null) {
  return new Promise((resolve, reject) => {
    let finished = false;
    let pollInterval = null;
    let timeout = null;

    const cleanup = () => {
      finished = true;
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.tabs.onRemoved.removeListener(onRemoved);
    };

    const done = () => {
      if (finished) return;
      cleanup();
      resolve();
    };

    // Timeout de segurança: 25 segundos.
    // Em sites pesados como Amazon e Magalu, conexões lentas ou rastreadores podem segurar a rede.
    // O PING ativo abaixo resolve muito antes assim que houver produtos no DOM.
    timeout = setTimeout(() => {
      chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError || !tab) {
          cleanup();
          reject(new Error('A aba de varredura foi fechada.'));
          return;
        }
        console.warn('Deal Hunter: limite de espera de rede atingido; prosseguindo para captura do DOM.');
        done();
      });
    }, 25000);

    const onUpdated = (updatedTabId, changeInfo) => {
      if (updatedTabId !== tabId) return;
      // Quando a aba completa o carregamento de rede inicial, não forçamos done() imediato
      // em SPAs/lojas dinâmicas para permitir a hidratação e injeção dos produtos via PING.
      if (changeInfo.status === 'complete' && pingCount >= 6) {
        done();
      }
    };

    const onRemoved = (removedTabId) => {
      if (removedTabId !== tabId) return;
      cleanup();
      reject(new Error('Varredura interrompida pelo usuário.'));
    };

    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.onRemoved.addListener(onRemoved);

    // Sondagem ativa via PING: assim que o content script for injetado (document_idle)
    // e o DOM tiver conteúdo/produtos, resolve imediatamente.
    let pingCount = 0;
    pollInterval = setInterval(() => {
      if (finished) return;
      pingCount += 1;
      chrome.tabs.sendMessage(tabId, { type: 'DEAL_HUNTER_PING' }, (response) => {
        if (chrome.runtime.lastError || finished) return;
        if (response?.ready) {
          const isSpa = typeof response.url === 'string' && (
            response.url.includes('magazineluiza.') ||
            response.url.includes('amazon.') ||
            response.url.includes('eletroclub.') ||
            response.url.includes('pichau.') ||
            response.url.includes('shein.') ||
            response.url.includes('shopee.') ||
            response.url.includes('kabum.') ||
            response.url.includes('lojasrenner.') ||
            response.url.includes('renner.')
          );
          const maxPings = isSpa ? 26 : 8; // Concede até 13s para hidratação
          const isReady = Boolean(response.hasPrices) || (response.count > 0 && pingCount >= 4);
          if (isReady || pingCount >= maxPings) {
            done();
          }
        }
      });
    }, 500);
  });
}

async function sendCaptureMessage(tabId, maxRetries = 8) {
  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      const result = await new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, { type: 'DEAL_HUNTER_CAPTURE_CATEGORY' }, (res) => {
          if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
          if (!res) return reject(new Error('A extensão não conseguiu ler esta página. Recarregue a extensão e tente novamente.'));
          resolve(res);
        });
      });
      return result;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      if (chrome.scripting && err.message && (err.message.includes('Receiving end does not exist') || err.message.includes('Could not establish connection'))) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId },
            files: ['content/content.js'],
          });
          await new Promise((resolve) => setTimeout(resolve, 600));
        } catch {}
      }
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }
}

function sendAdvanceMessage(tabId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, { type: 'DEAL_HUNTER_ADVANCE_NEXT_PAGE' }, (result) => {
      if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
      resolve(result || { ok: false, message: 'A página não confirmou a navegação.' });
    });
  });
}

function buildNextPageUrl(currentUrl, targetPageNumber) {
  try {
    const nextUrl = new URL(currentUrl);
    const host = nextUrl.hostname.toLowerCase();
    if (host.includes('amazon.')) {
      if (nextUrl.searchParams.has('promotionsSearchStartIndex')) {
        nextUrl.searchParams.set('promotionsSearchStartIndex', String((targetPageNumber - 1) * 60));
      }
      nextUrl.searchParams.set('page', String(targetPageNumber));
      nextUrl.searchParams.delete('ref');
    } else if (host.includes('magazineluiza.')) {
      nextUrl.searchParams.set('page', String(targetPageNumber));
    } else if (host.includes('eletroclub.')) {
      nextUrl.searchParams.set('page', String(targetPageNumber));
    } else {
      nextUrl.searchParams.set('page', String(targetPageNumber));
    }
    return nextUrl.href;
  } catch {
    return null;
  }
}

function updateTab(tabId, url) {
  return new Promise((resolve, reject) => {
    chrome.tabs.update(tabId, { url }, (tab) => {
      if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
      resolve(tab);
    });
  });
}

let scanKeepAliveInterval = null;
function startScanKeepAlive() {
  stopScanKeepAlive();
  // Mantém o service worker do Chrome MV3 100% acordado mesmo com navegador minimizado ou sem foco
  scanKeepAliveInterval = setInterval(() => {
    chrome.runtime.getPlatformInfo().catch(() => {});
  }, 15000);
}

function stopScanKeepAlive() {
  if (scanKeepAliveInterval) {
    clearInterval(scanKeepAliveInterval);
    scanKeepAliveInterval = null;
  }
}

async function navigateTabAndWait(tabId, url) {
  const previous = await getTab(tabId);
  // Protege a aba contra auto-descarte de memória do Chrome em segundo plano
  try {
    await chrome.tabs.update(tabId, { autoDiscardable: false, active: true });
  } catch {}
  if (previous.url === url && previous.status === 'complete') return;
  const completed = waitForTabComplete(tabId, url, previous.url);
  await updateTab(tabId, url);
  // Give Chrome a chance to emit the loading event after tabs.update resolves.
  await completed;
  const isEletroclub = typeof url === 'string' && url.includes('eletroclub.');
  // No Eletroclub, pausa de 2.5s adicionais após a carga inicial para permitir que o GraphQL de sessão carregue os preços
  await new Promise((resolve) => setTimeout(resolve, isEletroclub ? 2500 : 1000));
}

function getTab(tabId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
      resolve(tab);
    });
  });
}

async function capturePage(category, maxPages, tabId, manual = false) {
  const allowedHost = new URL(category.url).hostname;
  try {
    if (tabId == null) throw new Error('O Chrome não retornou a aba de varredura.');
    await navigateTabAndWait(tabId, category.url);
    const capturedPages = [];
    const visitedTargets = new Set();
    visitedTargets.add((await getTab(tabId)).url);
    for (let pageNumber = 0; pageNumber < maxPages; pageNumber += 1) {
      const current = await getTab(tabId);
      const captured = await sendCaptureMessage(tabId);
      capturedPages.push({
        categoryId: category.id,
        html: captured.html || '',
        products: captured.products || [],
        error: captured.error || null,
        pageTitle: captured.pageTitle || '',
        productsFound: captured.productsFound || 0,
        scrollLimitReached: Boolean(captured.scrollLimitReached),
      });
      const firstProduct = captured.products?.[0];
      const validProducts = (captured.products || [])
        .filter((p) => p && p.name && (p.price || p.imageUrl))
        .slice(0, 25)
        .map((p) => ({
          name: p.name,
          price: p.price,
          originalPrice: p.originalPrice,
          discountPercent: p.advertisedDiscount,
          imageUrl: p.imageUrl,
        }));
      publishScanProgress({
        scanning: true, manual, siteName: category.siteName, categoryName: category.name,
        status: `Página ${pageNumber + 1}: ${captured.productsFound || 0} produto(s) lido(s)`,
        product: firstProduct ? {
          name: firstProduct.name,
          price: firstProduct.price,
          originalPrice: firstProduct.originalPrice,
          discountPercent: firstProduct.advertisedDiscount,
          imageUrl: firstProduct.imageUrl,
        } : null,
        products: validProducts,
        scanSessionId: `${category.id}-${pageNumber}`,
      });

      if (captured.error || pageNumber + 1 >= maxPages) break;

      // Regra de parada: se a página atual retornar produtos esgotados, interrompe imediatamente o loop da categoria atual e passa para a próxima da fila
      if (captured.hasOutOfStock || captured.stopCategory) {
        console.warn(`[Deal Hunter] Categoria "${category.name}" retornou produtos esgotados/indisponíveis na página ${pageNumber + 1}. Interrompendo loop da categoria.`);
        publishScanProgress({
          scanning: true, manual, siteName: category.siteName, categoryName: category.name,
          status: `Página ${pageNumber + 1}: produtos esgotados detectados. Avançando para próxima categoria...`,
          product: null,
        });
        break;
      }
      let navigated = false;

      // Nível 1: Se a página forneceu uma URL explícita de próxima página no DOM
      if (captured.nextPageUrl) {
        try {
          const nextUrl = new URL(captured.nextPageUrl);
          if ((nextUrl.hostname === allowedHost || nextUrl.hostname.endsWith(`.${allowedHost}`) || allowedHost.endsWith(`.${nextUrl.hostname}`))
            && !visitedTargets.has(nextUrl.href)) {
            visitedTargets.add(nextUrl.href);
            await navigateTabAndWait(tabId, nextUrl.href);
            navigated = true;
          }
        } catch {}
      }

      // Nível 2: Se não navegou por URL explícita e há botão no DOM, tenta clicar
      if (!navigated && captured.hasNextButton) {
        try {
          const advanced = await sendAdvanceMessage(tabId);
          if (advanced && advanced.ok) {
            await new Promise((resolve) => setTimeout(resolve, 800));
            const newTab = await getTab(tabId);
            visitedTargets.add(newTab.url);
            navigated = true;
          }
        } catch {}
      }

      // Nível 3: Fallback canônico e infalível por construção de URL (?page=2, ?page=3)
      if (!navigated) {
        const fallbackUrl = buildNextPageUrl(current.url, targetPageNum);
        if (fallbackUrl && !visitedTargets.has(fallbackUrl)) {
          visitedTargets.add(fallbackUrl);
          await navigateTabAndWait(tabId, fallbackUrl);
          navigated = true;
        }
      }

      if (!navigated) {
        break;
      }
    }
    return capturedPages;
  } catch (error) {
    return [{ categoryId: category.id, html: '', products: [], error: error.message, pageTitle: '', productsFound: 0 }];
  }
}

function publishScanProgress(progress) {
  const payload = { ...progress, updatedAt: Date.now() };
  chrome.storage.local.set({ scanProgress: payload });
  chrome.runtime.sendMessage({ type: 'DEAL_HUNTER_SCAN_PROGRESS', progress: payload }, () => void chrome.runtime.lastError);
}

async function runBrowserScan(manual = true) {
  const license = await checkAuthorization();
  if (!license?.authorized) {
    return {
      status: 'error',
      message: 'Acesso restrito. Assine o plano Pro ou faça login para iniciar a varredura.',
    };
  }
  if (currentBrowserScan) return { status: 'running', message: 'Uma varredura já está em andamento.' };
  await closeExistingScanWindows();
  const control = { cancelled: false, manual, scanId: null, windowId: null };
  currentBrowserScanControl = control;
  currentBrowserScan = runBrowserScanCycle(control);
  try {
    return await currentBrowserScan;
  } finally {
    currentBrowserScan = null;
    currentBrowserScanControl = null;
    await closeExistingScanWindows();
  }
}

async function cancelBrowserScan() {
  const control = currentBrowserScanControl;
  if (control) {
    control.cancelled = true;
    if (control.windowId) {
      try {
        await chrome.windows.remove(control.windowId);
      } catch {}
    }
  }
  await closeExistingScanWindows();
  if (control?.scanId) {
    await Promise.race([api.cancelBrowserScan(control.scanId).catch(() => {}), new Promise((resolve) => setTimeout(resolve, 1200))]);
  }
  return { ok: true };
}

async function ensureScanTab(windowId, preferredTabId) {
  if (preferredTabId) {
    try {
      const tab = await getTab(preferredTabId);
      if (tab) {
        await chrome.tabs.update(tab.id, { active: true });
        return tab.id;
      }
    } catch {}
  }
  try {
    const tabs = await chrome.tabs.query({ windowId });
    if (tabs.length > 0) {
      await chrome.tabs.update(tabs[0].id, { active: true });
      return tabs[0].id;
    }
    const newTab = await chrome.tabs.create({ windowId, url: 'about:blank', active: true });
    return newTab.id;
  } catch {
    return null;
  }
}

async function runBrowserScanCycle(control) {
  const [categories, config] = await Promise.all([api.getCategories(), api.getScanConfig()]);
  if (control.cancelled) {
    publishScanProgress({ scanning: false, siteName: '', categoryName: '', status: 'Verificação interrompida', product: null });
    return { status: 'cancelled', itemsScanned: 0, candidatesFound: 0, alertsSent: 0, errors: [] };
  }
  const selected = categories.filter((category) => category.selected);
  if (!selected.length) return { status: 'skipped', message: 'Selecione ao menos uma loja/categoria.' };

  // Garante que qualquer janela residual anterior é fechada antes de abrir uma nova
  await closeExistingScanWindows();

  const scanId = crypto.randomUUID();
  control.scanId = scanId;
  startScanKeepAlive();

  // Cria janela em segundo plano sem roubar o foco ativo do usuário
  const scanWindow = await chrome.windows.create({
    url: 'about:blank',
    type: 'normal',
    focused: false,
    width: 1200,
    height: 800,
    left: 80,
    top: 80,
  });
  control.windowId = scanWindow.id;
  await chrome.storage.local.set({ activeScanWindowId: scanWindow.id });

  const initialTab = scanWindow.tabs?.[0] || (await chrome.tabs.query({ windowId: scanWindow.id }))[0];
  if (!initialTab?.id) {
    await chrome.windows.remove(scanWindow.id).catch(() => {});
    await closeExistingScanWindows();
    throw new Error('Não foi possível iniciar a janela de varredura.');
  }

  try {
    await chrome.tabs.update(initialTab.id, { autoDiscardable: false, active: true });
  } catch {}

  let pageCount = 0;
  let result = { itemsScanned: 0, candidatesFound: 0, alertsSent: 0, errors: [] };
  publishScanProgress({ scanning: true, manual: control.manual, siteName: '', categoryName: '', status: 'Preparando a varredura', product: null });
  let currentTabId = initialTab.id;
  try {
    if (control.cancelled) {
      await api.cancelBrowserScan(scanId).catch(() => {});
      publishScanProgress({ scanning: false, siteName: '', categoryName: '', status: 'Verificação interrompida', product: null });
      return { status: 'cancelled', ...result, browserPages: 0 };
    }
    for (const category of selected) {
      if (control.cancelled) break;
      if (pageCount >= MAX_BROWSER_PAGES_PER_SCAN) {
        console.warn(`Deal Hunter: limite de ${MAX_BROWSER_PAGES_PER_SCAN} páginas por varredura atingido; categorias restantes ficam para o próximo ciclo.`);
        break;
      }
      currentTabId = await ensureScanTab(scanWindow.id, currentTabId);
      if (!currentTabId) {
        console.warn('Deal Hunter: não foi possível recuperar a aba de varredura.');
        break;
      }
      try {
        await chrome.tabs.update(currentTabId, { autoDiscardable: false, active: true });
      } catch {}

      try {
        scanProgressContext = { tabId: currentTabId, siteName: category.siteName, categoryName: category.name, manual: control.manual };
        publishScanProgress({ scanning: true, manual: control.manual, siteName: category.siteName, categoryName: category.name, status: 'Abrindo categoria', product: null });
        const categoryPages = await capturePage(category, Math.max(1, Number(config.pages) || 1), currentTabId, control.manual);
        const chunk = categoryPages.slice(0, MAX_BROWSER_PAGES_PER_SCAN - pageCount);
        pageCount += chunk.length;
        const partial = await api.submitBrowserPages(chunk, scanId, false);
        result = partial.status === 'running' ? partial : { ...result, ...partial };
        if (control.cancelled) break;
        const allProds = chunk.flatMap((page) => page.products || [])
          .filter((p) => p && p.name)
          .slice(0, 25)
          .map((p) => ({
            name: p.name,
            price: p.price,
            originalPrice: p.originalPrice,
            discountPercent: p.advertisedDiscount,
            imageUrl: p.imageUrl,
          }));
        publishScanProgress({
          scanning: true, manual: control.manual, siteName: category.siteName, categoryName: category.name,
          status: `${productCount} produto(s) enviados para análise`,
          product: allProds[0] || null,
          products: allProds,
          scanSessionId: `${category.id}-analysis`,
        });
        for (const offer of partial.offers || []) {
          publishScanProgress({
            scanning: true, manual: control.manual, siteName: offer.siteName, categoryName: offer.categoryName,
            status: 'Oferta encontrada!',
            product: { name: offer.name, price: offer.price, imageUrl: offer.imageUrl, discountPercent: offer.discount },
            products: [{ name: offer.name, price: offer.price, imageUrl: offer.imageUrl, discountPercent: offer.discount }],
            offerAlert: offer,
            scanSessionId: `offer-${offer.id || Date.now()}`,
          });
          chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
            const activeTabId = tabs?.[0]?.id;
            if (activeTabId) chrome.tabs.sendMessage(activeTabId, { type: 'DEAL_HUNTER_SHOW_OFFER_ALERT', offer }, () => void chrome.runtime.lastError);
          });
        }
      } catch (catErr) {
        console.warn(`[Deal Hunter] Erro ao processar categoria ${category.name}, continuando para as demais:`, catErr.message);
      } finally {
        scanProgressContext = null;
      }
      if (control.cancelled) break;
    }
    const finalResult = await api.submitBrowserPages([], scanId, true);
    result = { ...result, ...finalResult, browserPages: pageCount };
    await chrome.storage.local.set({ lastBrowserScanAt: Date.now() });
    const wasCancelled = control.cancelled || finalResult.status === 'cancelled';
    publishScanProgress({ scanning: false, siteName: '', categoryName: '', status: wasCancelled ? 'Verificação interrompida' : 'Verificação concluída', product: null,
      itemsScanned: result.itemsScanned, alertsSent: result.alertsSent });
    if (wasCancelled) return { ...result, status: 'cancelled' };
    return result;
  } catch (error) {
    if (control.cancelled) {
      const finalResult = await api.submitBrowserPages([], scanId, true).catch(() => ({}));
      publishScanProgress({ scanning: false, siteName: '', categoryName: '', status: 'Verificação interrompida', product: null,
        itemsScanned: finalResult.itemsScanned || result.itemsScanned, alertsSent: finalResult.alertsSent || result.alertsSent });
      return { ...result, ...finalResult, status: 'cancelled', browserPages: pageCount };
    }
    publishScanProgress({ scanning: false, siteName: '', categoryName: '', status: `Falha na varredura: ${error.message}`, product: null });
    throw error;
  } finally {
    stopScanKeepAlive();
    scanProgressContext = null;
    if (scanWindow?.id) {
      try {
        await chrome.windows.remove(scanWindow.id);
      } catch {}
    }
    await closeExistingScanWindows();
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'DEAL_HUNTER_PRODUCT_PROGRESS' && scanProgressContext
    && _sender.tab?.id === scanProgressContext.tabId) {
    const countInfo = message.product?.count ? `(${message.product.count}) ` : '';
    publishScanProgress({
      scanning: true,
      manual: scanProgressContext.manual,
      siteName: scanProgressContext.siteName,
      categoryName: scanProgressContext.categoryName,
      status: `Localizando produto ${countInfo}`,
      product: message.product || null,
    });
    return false;
  }
  if (message?.type === 'DEAL_HUNTER_REFRESH_BADGE') {
    updateBadge().then(() => sendResponse({ ok: true }));
    return true;
  }
  if (message?.type === 'DEAL_HUNTER_RUN_BROWSER_SCAN') {
    runBrowserScan(true)
      .then(sendResponse)
      .catch((error) => sendResponse({ status: 'error', message: error.message }));
    return true;
  }
  if (message?.type === 'DEAL_HUNTER_STOP_BROWSER_SCAN') {
    cancelBrowserScan().then(sendResponse).catch((error) => sendResponse({ ok: false, message: error.message }));
    return true;
  }
  if (message?.type === 'DEAL_HUNTER_OPEN_ELECTROCLUB_LOGIN') {
    chrome.tabs.create({ url: 'https://www.eletroclub.com.br/login' }, (tab) => {
      const error = chrome.runtime.lastError;
      sendResponse(error ? { ok: false, message: error.message } : { ok: true, tabId: tab?.id });
    });
    return true;
  }
  if (message?.type === 'DEAL_HUNTER_SAVE_AUTH') {
    const { token, user, license } = message;
    (async () => {
      try {
        const isAuth = !!(license?.authorized || user?.authorized);
        await chrome.storage.local.set({
          auth_token: token,
          apiToken: token,
          auth_user: user,
          licenseStatus: {
            authorized: isAuth,
            role: license?.role || user?.role || 'user',
            plan: license?.plan || user?.plan || 'pro',
            subscription_status: license?.subscription_status || user?.subscription_status || 'active',
            email: license?.email || user?.email || '',
            checkedAt: Date.now(),
          },
        });
        const fresh = await verifyLicenseStatus();
        sendResponse({ success: true, licenseStatus: fresh });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }
  if (message?.type === 'DEAL_HUNTER_GET_LICENSE') {
    checkAuthorization().then((license) => sendResponse({ ok: true, license }));
    return true;
  }
  if (message?.type === 'DEAL_HUNTER_REFRESH_LICENSE') {
    verifyLicenseStatus().then((license) => sendResponse({ ok: true, license }));
    return true;
  }
  if (message?.type === 'DEAL_HUNTER_OPEN_LOGIN') {
    const loginUrl = typeof CONFIG !== 'undefined' ? CONFIG.getLoginUrl() : `${DEFAULT_WEB_URL}/login`;
    chrome.tabs.create({ url: loginUrl }, (tab) => {
      sendResponse({ ok: !chrome.runtime.lastError, tabId: tab?.id });
    });
    return true;
  }
  if (message?.type === 'DEAL_HUNTER_LOGOUT') {
    chrome.storage.local.remove(['auth_token', 'apiToken', 'auth_user', 'licenseStatus']).then(() => {
      sendResponse({ ok: true });
    });
    return true;
  }
  return false;
});
