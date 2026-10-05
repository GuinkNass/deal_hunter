const test = require('node:test');
const assert = require('node:assert/strict');
const { tagAmazonUrl, AMAZON_AFFILIATE_TAG, parseAmazon } = require('../src/adapters/amazon.adapter');

test('=== INJEÇÃO DO ID DE AFILIADO AMAZON (dealhunterp07-20) ===', async (t) => {
  await t.test('Constante de afiliado definida corretamente', () => {
    assert.equal(AMAZON_AFFILIATE_TAG, 'dealhunterp07-20');
  });

  await t.test('URL limpa recebe a tag de afiliado', () => {
    const cleanUrl = 'https://www.amazon.com.br/dp/B08L5WHFT9';
    const tagged = tagAmazonUrl(cleanUrl);
    const parsed = new URL(tagged);

    assert.equal(parsed.searchParams.get('tag'), 'dealhunterp07-20');
    assert.equal(parsed.pathname, '/dp/B08L5WHFT9');
    assert.equal(parsed.hostname, 'www.amazon.com.br');
  });

  await t.test('URL com parâmetros preserva todos os parâmetros existentes e anexa a tag', () => {
    const urlWithParams = 'https://www.amazon.com.br/dp/B08L5WHFT9?ref=xyz&psc=1';
    const tagged = tagAmazonUrl(urlWithParams);
    const parsed = new URL(tagged);

    assert.equal(parsed.searchParams.get('tag'), 'dealhunterp07-20');
    assert.equal(parsed.searchParams.get('ref'), 'xyz');
    assert.equal(parsed.searchParams.get('psc'), '1');
    assert.equal(parsed.pathname, '/dp/B08L5WHFT9');
  });

  await t.test('URL com tag prévia de terceiro substitui a tag pelo ID dealhunterp07-20', () => {
    const urlWithOtherTag = 'https://www.amazon.com.br/dp/B08L5WHFT9?tag=outroafiliado-20';
    const tagged = tagAmazonUrl(urlWithOtherTag);
    const parsed = new URL(tagged);

    assert.equal(parsed.searchParams.get('tag'), 'dealhunterp07-20');
    assert.notEqual(parsed.searchParams.get('tag'), 'outroafiliado-20');
  });

  await t.test('URL com múltiplos parâmetros e tag prévia preserva tracking e substitui tag', () => {
    const complexUrl = 'https://www.amazon.com.br/dp/B08L5WHFT9?ref_=chk_typ_imgToDetails&tag=antigo-20&psc=1&th=1';
    const tagged = tagAmazonUrl(complexUrl);
    const parsed = new URL(tagged);

    assert.equal(parsed.searchParams.get('tag'), 'dealhunterp07-20');
    assert.equal(parsed.searchParams.get('ref_'), 'chk_typ_imgToDetails');
    assert.equal(parsed.searchParams.get('psc'), '1');
    assert.equal(parsed.searchParams.get('th'), '1');
  });

  await t.test('Domínios internacionais da Amazon e amzn.to recebem a tag de afiliado', () => {
    const usUrl = 'https://amazon.com/dp/B08L5WHFT9';
    const shortUrl = 'https://amzn.to/3example';
    
    assert.equal(new URL(tagAmazonUrl(usUrl)).searchParams.get('tag'), 'dealhunterp07-20');
    assert.equal(new URL(tagAmazonUrl(shortUrl)).searchParams.get('tag'), 'dealhunterp07-20');
  });

  await t.test('Não corrompe URLs de outras lojas nem URLs inválidas', () => {
    const magaluUrl = 'https://www.magazineluiza.com.br/smartphone-samsung/p/123456';
    const kabumUrl = 'https://www.kabum.com.br/produto/999999?origem=banner';
    const mlUrl = 'https://www.mercadolivre.com.br/produto-teste/p/MLB123';
    const invalidUrl = 'not-a-valid-url';
    const nullUrl = null;

    assert.equal(tagAmazonUrl(magaluUrl), magaluUrl);
    assert.equal(tagAmazonUrl(kabumUrl), kabumUrl);
    assert.equal(tagAmazonUrl(mlUrl), mlUrl);
    assert.equal(tagAmazonUrl(invalidUrl), invalidUrl);
    assert.equal(tagAmazonUrl(nullUrl), nullUrl);
  });

  await t.test('parseAmazon retorna produto com URL tagueada automaticamente', () => {
    const sampleHtml = `
      <html>
        <body>
          <h1 id="productTitle">Fone Bluetooth Amazon Teste</h1>
          <span class="a-price"><span class="a-offscreen">R$ 149,90</span></span>
        </body>
      </html>
    `;
    const pageUrl = 'https://www.amazon.com.br/dp/B08L5WHFT9?ref=xyz';
    const result = parseAmazon(sampleHtml, pageUrl);

    assert.equal(result.name, 'Fone Bluetooth Amazon Teste');
    assert.equal(result.price, 149.9);
    assert.ok(result.url.includes('tag=dealhunterp07-20'));
    assert.ok(result.url.includes('ref=xyz'));
  });
});
