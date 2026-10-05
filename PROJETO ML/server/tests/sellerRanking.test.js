const test = require('node:test');
const assert = require('node:assert');
const { rankSellers } = require('../services/sellerRankingService');

test('rankSellers prioritizes catalog winner when present', () => {
  const items = [
    {
      id: 'item-1',
      title: 'SSD 480GB Barato',
      price: 180.00,
      condition: 'new',
      sold_quantity: 50,
      is_catalog_winner: false
    },
    {
      id: 'item-2',
      title: 'SSD 480GB Catálogo Vencedor',
      price: 210.00,
      condition: 'new',
      sold_quantity: 3000,
      is_catalog_winner: true
    }
  ];

  const chosen = rankSellers(items, { minSoldQuantity: 10 });
  assert.strictEqual(chosen.itemId, 'item-2');
  assert.strictEqual(chosen.selectionMethod, 'catalog_winner');
});

test('rankSellers filters out used items when ignoreUsed is true', () => {
  const items = [
    {
      id: 'item-used',
      title: 'SSD 480GB Usado',
      price: 120.00,
      condition: 'used',
      sold_quantity: 25,
      seller: { seller_reputation: { level_id: '5_green' } }
    },
    {
      id: 'item-new',
      title: 'SSD 480GB Novo',
      price: 220.00,
      condition: 'new',
      sold_quantity: 40,
      seller: { seller_reputation: { level_id: '5_green' } }
    }
  ];

  const chosen = rankSellers(items, { ignoreUsed: true, minSoldQuantity: 10 });
  assert.strictEqual(chosen.itemId, 'item-new');
});

test('rankSellers filters items with sales below minimum configured', () => {
  const items = [
    {
      id: 'item-low-sales',
      title: 'SSD 480GB 2 vendas',
      price: 150.00,
      condition: 'new',
      sold_quantity: 2,
      seller: { seller_reputation: { level_id: '5_green' } }
    },
    {
      id: 'item-good-sales',
      title: 'SSD 480GB 20 vendas',
      price: 190.00,
      condition: 'new',
      sold_quantity: 20,
      seller: { seller_reputation: { level_id: '5_green' } }
    }
  ];

  const chosen = rankSellers(items, { minSoldQuantity: 10 });
  assert.strictEqual(chosen.itemId, 'item-good-sales');
});

test('rankSellers selects lowest price among qualified candidates', () => {
  const items = [
    {
      id: 'item-higher-price',
      title: 'SSD 480GB',
      price: 240.00,
      condition: 'new',
      sold_quantity: 50,
      seller: { seller_reputation: { level_id: '5_green' } }
    },
    {
      id: 'item-lower-price',
      title: 'SSD 480GB Menor Preço',
      price: 199.90,
      condition: 'new',
      sold_quantity: 80,
      seller: { seller_reputation: { level_id: '5_green' } }
    }
  ];

  const chosen = rankSellers(items, { minSoldQuantity: 10 });
  assert.strictEqual(chosen.itemId, 'item-lower-price');
  assert.strictEqual(chosen.price, 199.90);
});
