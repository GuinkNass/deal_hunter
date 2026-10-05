const test = require('node:test');
const assert = require('node:assert/strict');
const { initDatabase } = require('../src/database/db');

test('=== PIPELINE ML RADAR & INGESTION ===', async (t) => {
  await initDatabase();
  const { sendToMLRadar } = require('../src/utils/mlRadarPipeline');
  const ingestRouter = require('../src/routes/ingest.routes');
  const mlRadarRouter = require('../src/routes/mlRadar.routes');

  await t.test('sendToMLRadar rejeita payloads sem título ou preço', async () => {
    const resNoTitle = await sendToMLRadar({ price: 100 });
    assert.equal(resNoTitle, false);

    const resNoPrice = await sendToMLRadar({ title: 'Produto Teste' });
    assert.equal(resNoPrice, false);
  });

  await t.test('sendToMLRadar higieniza payload e aplica tag Amazon se aplicável', async () => {
    const originalFetch = global.fetch;
    let interceptedBody = null;
    global.fetch = async (url, options) => {
      interceptedBody = JSON.parse(options.body);
      return { ok: true, json: async () => ({ success: true }) };
    };

    try {
      const res = await sendToMLRadar({
        title: ' Smart TV 50 Polegadas 4K ',
        price: 1999.90,
        originalPrice: 2999.00,
        productUrl: 'https://www.amazon.com.br/dp/B08L5WHFT9',
        userId: 'user-uuid-12345',
        store: 'Amazon',
      });
      assert.equal(res, true);
      assert.equal(interceptedBody.title, 'Smart TV 50 Polegadas 4K');
      assert.equal(interceptedBody.price, 1999.90);
      assert.equal(interceptedBody.userId, 'user-uuid-12345');
      assert.ok(interceptedBody.productUrl.includes('tag=dealhunterp07-20'));
    } finally {
      global.fetch = originalFetch;
    }
  });

  await t.test('Rotas de ingest e ponte mlRadar estão definidas e instanciáveis', () => {
    assert.ok(ingestRouter);
    assert.equal(typeof ingestRouter, 'function');
    assert.ok(mlRadarRouter);
    assert.equal(typeof mlRadarRouter, 'function');
  });
});
