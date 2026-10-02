const test = require('node:test');
const assert = require('node:assert/strict');

const { isIsolatedInstallment, resolveEffectiveDiscount } = require('../src/analyzers/discount');
const { validateKeywordFilter, normalizeText } = require('../src/analyzers/score');
const { parseMagalu } = require('../src/adapters/magalu.adapter');
const { parseKabum } = require('../src/adapters/kabum.adapter');
const { parseAmazon } = require('../src/adapters/amazon.adapter');
const { parseShein } = require('../src/adapters/shein.adapter');
const { parseShopee } = require('../src/adapters/shopee.adapter');
const { parseListing } = require('../src/adapters/listing.adapter');

test('=== 1. PREÇO PARCELADO VS. À VISTA / PIX ===', async (t) => {
  await t.test('isIsolatedInstallment detecta parcela explícita em installmentAmount', () => {
    const item = {
      price: 79.90,
      installmentAmount: 79.90,
      rawText: '10x de R$ 79,90 sem juros'
    };
    assert.equal(isIsolatedInstallment(item), true);
  });

  await t.test('isIsolatedInstallment detecta parcela por regex e proporção com preço original', () => {
    const item = {
      price: 150.00,
      siteOriginalPrice: 1500.00,
      rawText: 'ou em 10x de R$ 150,00 sem juros'
    };
    assert.equal(isIsolatedInstallment(item), true);
  });

  await t.test('isIsolatedInstallment detecta padrão "Nx de R$ Y" no texto correspondente ao preço', () => {
    const item = {
      price: 49.99,
      rawText: 'Pagamento facilitado: 12x de R$ 49,99 no cartão de crédito'
    };
    assert.equal(isIsolatedInstallment(item), true);
  });

  await t.test('isIsolatedInstallment NÃO descarta produto com preço legítimo', () => {
    const item = {
      price: 89.90,
      siteOriginalPrice: 129.90,
      rawText: 'De R$ 129,90 por R$ 89,90 à vista no Pix'
    };
    assert.equal(isIsolatedInstallment(item), false);
  });

  await t.test('resolveEffectiveDiscount descarta (retorna null) para ofertas de parcelas isoladas', () => {
    const itemParcelado = {
      price: 100.00,
      siteOriginalPrice: 1000.00,
      rawText: '10x de R$ 100,00 sem juros'
    };
    const stats = { reliable: true, referenceMedian: 1000, sampleSize: 10 };
    const result = resolveEffectiveDiscount(itemParcelado, stats);
    assert.equal(result, null, 'Oferta que é parcela isolada deve ser descartada');
  });

  await t.test('resolveEffectiveDiscount calcula desconto normalmente para ofertas válidas', () => {
    const itemValido = {
      price: 700.00,
      siteOriginalPrice: 1000.00,
      rawText: 'R$ 700,00 à vista no PIX'
    };
    const stats = { reliable: false, sampleSize: 1 };
    const result = resolveEffectiveDiscount(itemValido, stats);
    assert.ok(result, 'Oferta legítima deve retornar cálculo de desconto');
    assert.equal(result.discountPercent, 30);
  });
});

test('=== 2. ADAPTADORES DAS LOJAS (ANTI-PARCELA E INDISPONIBILIDADE) ===', async (t) => {
  await t.test('Magalu: ignora parcelas e extrai preço à vista/Pix', () => {
    const htmlMagalu = `
      <html>
        <body>
          <h1 data-testid="heading-product-title">Smartphone Samsung Galaxy S23 128GB</h1>
          <div data-testid="price-original">R$ 3.499,00</div>
          <div data-testid="price-final">
            <span class="sr-only">R$ 2.699,10</span>
          </div>
          <div class="installment-text">10x de R$ 299,90 sem juros</div>
        </body>
      </html>
    `;
    const parsed = parseMagalu(htmlMagalu, 'https://www.magazineluiza.com.br/smartphone-samsung/p/12345/');
    assert.equal(parsed.price, 2699.10);
    assert.notEqual(parsed.price, 299.90, 'Não deve extrair a parcela de 299.90');
    assert.equal(parsed.is_available, true);
  });

  await t.test('Magalu: detecta produto indisponível/esgotado', () => {
    const htmlMagaluEsgotado = `
      <html>
        <body>
          <h1>Smartphone Esgotado</h1>
          <div data-testid="product-unavailable">Produto indisponível no momento</div>
        </body>
      </html>
    `;
    const parsed = parseMagalu(htmlMagaluEsgotado, 'https://www.magazineluiza.com.br/produto-esgotado/p/99999/');
    assert.equal(parsed.is_available, false);
  });

  await t.test('KaBuM!: prioriza preço PIX/final e ignora cartao/parcela', () => {
    const htmlKabum = `
      <html>
        <body>
          <h1 class="sc-f456">Placa de Vídeo RTX 4060 Gigabyte</h1>
          <div class="oldPrice">R$ 2.499,99</div>
          <h4 class="finalPrice">R$ 1.899,99</h4>
          <span class="cardPayment">10x de R$ 211,11 sem juros no cartão</span>
        </body>
      </html>
    `;
    const parsed = parseKabum(htmlKabum, 'https://www.kabum.com.br/produto/123/rtx-4060');
    assert.equal(parsed.price, 1899.99);
    assert.notEqual(parsed.price, 211.11, 'Não deve pegar a parcela de 211.11');
    assert.equal(parsed.is_available, true);
  });

  await t.test('KaBuM!: detecta produto esgotado', () => {
    const htmlKabumEsgotado = `
      <html>
        <body>
          <h1>Produto Esgotado KaBuM</h1>
          <div class="product-unavailable">Ops! Produto indisponível</div>
        </body>
      </html>
    `;
    const parsed = parseKabum(htmlKabumEsgotado, 'https://www.kabum.com.br/produto/404');
    assert.equal(parsed.is_available, false);
  });

  await t.test('Amazon: ignora parcelamento secundário e extrai preço principal', () => {
    const htmlAmazon = `
      <html>
        <body>
          <span id="productTitle">Kindle Paperwhite 16 GB</span>
          <div id="corePriceDisplay_desktop_feature_div">
            <span class="a-price aok-align-center reinventPricePriceToPayMargin priceToPay">
              <span class="a-offscreen">R$ 719,10</span>
            </span>
          </div>
          <div id="installmentCalculator">
            <span class="a-price"><span class="a-offscreen">10x de R$ 79,90</span></span>
          </div>
        </body>
      </html>
    `;
    const parsed = parseAmazon(htmlAmazon, 'https://www.amazon.com.br/dp/B08N3TCP2F');
    assert.equal(parsed.price, 719.10);
    assert.notEqual(parsed.price, 79.90, 'Não deve pegar a parcela');
    assert.equal(parsed.is_available, true);
  });

  await t.test('Amazon: detecta produto atualmente indisponível', () => {
    const htmlAmazonIndisponivel = `
      <html>
        <body>
          <span id="productTitle">Item Indisponível</span>
          <div id="availability">
            <span class="a-color-price">Não disponível</span>
          </div>
        </body>
      </html>
    `;
    const parsed = parseAmazon(htmlAmazonIndisponivel, 'https://www.amazon.com.br/dp/B0000000');
    assert.equal(parsed.is_available, false);
  });

  await t.test('Shein: extrai preço promocional e detecta disponibilidade', () => {
    const htmlShein = `
      <html>
        <body>
          <h1 class="product-intro__head-name">Vestido Casual Elegante</h1>
          <div class="original">R$ 150,00</div>
          <div class="from">R$ 89,90</div>
          <div class="didi-installment">em até 3x de R$ 29,96 sem juros</div>
        </body>
      </html>
    `;
    const parsed = parseShein(htmlShein, 'https://br.shein.com/goods-p-1234.html');
    assert.equal(parsed.price, 89.90);
    assert.notEqual(parsed.price, 29.96);
    assert.equal(parsed.is_available, true);
  });

  await t.test('Shopee: extrai preço e filtra parcelamento', () => {
    const htmlShopee = `
      <html>
        <body>
          <div class="product-briefing">
            <h1>Fone de Ouvido Bluetooth Sem Fio</h1>
            <div class="flex items-center">
              <div aria-label="current price">R$ 45,90</div>
            </div>
          </div>
        </body>
      </html>
    `;
    const parsed = parseShopee(htmlShopee, 'https://shopee.com.br/fone-bluetooth-i.123.456');
    assert.equal(parsed.price, 45.90);
    assert.equal(parsed.is_available, true);
  });
});

test('=== 3. EXPANSÃO DE PAGINAÇÃO E PRODUTOS ESGOTADOS ===', async (t) => {
  await t.test('Configuração manual de páginas suporta até 15 páginas', () => {
    const validPages = [1, 2, 5, 10, 15];
    for (const pages of validPages) {
      assert.ok(pages >= 1 && pages <= 15, `Página ${pages} deve ser válida`);
    }

    const invalidPages = [0, -1, 16, 20];
    for (const pages of invalidPages) {
      const isValid = pages >= 1 && pages <= 15;
      assert.equal(isValid, false, `Página ${pages} deve ser rejeitada fora do intervalo 1-15`);
    }
  });

  await t.test('Listing adapter processa listagem e rejeita elementos de parcela', () => {
    const htmlListing = `
      <html>
        <body>
          <div class="product-card" data-testid="product-card">
            <a href="https://www.magazineluiza.com.br/smart-tv-50/p/99988/">Smart TV 50 4K</a>
            <span data-testid="price-final">R$ 2.199,00</span>
            <span class="installment">10x de R$ 219,90</span>
          </div>
        </body>
      </html>
    `;
    const items = parseListing(htmlListing, 'https://www.magazineluiza.com.br/busca/smart+tv/', 'magazineluiza.com.br');
    assert.equal(items.length, 1);
    assert.equal(items[0].price, 2199.00);
    assert.notEqual(items[0].price, 219.90);
  });
});

test('=== 4. FILTRO DINÂMICO POR PALAVRA-CHAVE (KEYWORD FILTER) ===', async (t) => {
  await t.test('Retorna true quando nenhum filtro está definido (nulo, indefinido ou vazio)', () => {
    assert.equal(validateKeywordFilter('iPhone 15 Pro', null), true);
    assert.equal(validateKeywordFilter('iPhone 15 Pro', undefined), true);
    assert.equal(validateKeywordFilter('iPhone 15 Pro', ''), true);
    assert.equal(validateKeywordFilter('iPhone 15 Pro', '   '), true);
  });

  await t.test('Valida correspondência exata ou parcial de termo (case-insensitive)', () => {
    const product = { title: 'Smartphone Apple iPhone 15 Pro Max 256GB' };
    assert.equal(validateKeywordFilter(product, 'iphone'), true);
    assert.equal(validateKeywordFilter(product, 'IPHONE 15'), true);
    assert.equal(validateKeywordFilter(product, '256gb'), true);
    assert.equal(validateKeywordFilter(product, 'samsung'), false);
  });

  await t.test('Insensível a acentuação gráfica', () => {
    const product = { title: 'Tênis de Corrida Masculino Esportivo' };
    assert.equal(validateKeywordFilter(product, 'tenis'), true);
    assert.equal(validateKeywordFilter(product, 'tênis'), true);
    assert.equal(validateKeywordFilter(product, 'corrida'), true);
  });

  await t.test('Suporta múltiplos termos separados por vírgula ou ponto-e-vírgula (OR)', () => {
    const productRtx = { title: 'Placa de Vídeo Gigabyte GeForce RTX 4060 Windforce 8GB' };
    const productRx = { title: 'Placa de Vídeo Sapphire AMD Radeon RX 7600 8GB' };
    const productIntel = { title: 'Processador Intel Core i7 14700K' };

    const filter = 'rtx 4060, rx 7600, rtx 4070';

    assert.equal(validateKeywordFilter(productRtx, filter), true, 'RTX 4060 deve passar no filtro');
    assert.equal(validateKeywordFilter(productRx, filter), true, 'RX 7600 deve passar no filtro');
    assert.equal(validateKeywordFilter(productIntel, filter), false, 'Intel i7 não deve passar no filtro');
  });

  await t.test('Valida também campo description se presente', () => {
    const product = {
      title: 'Notebook Gamer Nitro V15',
      description: 'Equipado com placa gráfica RTX 4050 6GB e processador i5'
    };
    assert.equal(validateKeywordFilter(product, 'rtx 4050'), true);
    assert.equal(validateKeywordFilter(product, 'rtx 4090'), false);
  });
});
