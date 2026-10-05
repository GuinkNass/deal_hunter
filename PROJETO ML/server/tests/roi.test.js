const test = require('node:test');
const assert = require('node:assert');
const { calculateROI } = require('../services/roiService');

test('calculateROI applies fixed fee under R$ 79 and no free shipping', () => {
  const result = calculateROI({
    salePrice: 50.00,
    productCost: 20.00,
    listingType: 'gold_special',
    freeShippingThreshold: 79.00,
    fixedFeeUnderThreshold: 6.00,
    feeClassicoPercent: 12.0,
    taxPercent: 6.0,
    packagingCost: 2.00,
    adsPercent: 0,
    returnPercent: 2.0,
    desiredMargin: 20
  });

  // Commission: 12% of 50 = 6.00
  assert.strictEqual(result.commissionFee, 6.00);
  // Fixed fee: 6.00 (since 50 < 79)
  assert.strictEqual(result.fixedFee, 6.00);
  // Shipping cost: 0 (under threshold, buyer pays)
  assert.strictEqual(result.shippingCost, 0);
  // Tax: 6% of 50 = 3.00
  assert.strictEqual(result.taxAmount, 3.00);
  // Packaging: 2.00
  assert.strictEqual(result.packagingCost, 2.00);
  // Extra (return 2%): 1.00
  assert.strictEqual(result.extraCosts, 1.00);

  // Total deductions: 6 + 6 + 0 + 3 + 2 + 1 + 20 (productCost) = 38.00
  // Net profit: 50 - 38 = 12.00
  assert.strictEqual(result.netProfit, 12.00);
  // Margin: (12 / 50) * 100 = 24%
  assert.strictEqual(result.marginPercent, 24.0);
  // ROI: (12 / 20) * 100 = 60%
  assert.strictEqual(result.roiPercent, 60.0);
  // Verdict should be Viável (margin 24% >= 20%)
  assert.strictEqual(result.verdict, 'Viável');
});

test('calculateROI applies free shipping above R$ 79 and 0 fixed fee', () => {
  const result = calculateROI({
    salePrice: 200.00,
    productCost: 100.00,
    listingType: 'gold_pro', // 17%
    freeShippingThreshold: 79.00,
    fixedFeeUnderThreshold: 6.00,
    feePremiumPercent: 17.0,
    taxPercent: 6.0,
    packagingCost: 3.50,
    defaultShippingCost: 25.00,
    adsPercent: 0,
    returnPercent: 2.0,
    desiredMargin: 20
  });

  // Commission: 17% of 200 = 34.00
  assert.strictEqual(result.commissionFee, 34.00);
  // Fixed fee: 0 (since 200 >= 79)
  assert.strictEqual(result.fixedFee, 0);
  // Shipping: 25.00
  assert.strictEqual(result.shippingCost, 25.00);
  // Net profit: 200 - (34 + 25 + 3.50 + 12 + 4 + 100) = 200 - 178.50 = 21.50
  assert.strictEqual(result.netProfit, 21.50);
  // Margin: (21.50 / 200) * 100 = 10.75%
  assert.strictEqual(result.marginPercent, 10.75);
  // Verdict should be Atenção (profit > 0, but margin < 20%)
  assert.strictEqual(result.verdict, 'Atenção');
  // Break even price must be calculated correctly
  assert.ok(result.breakEvenPrice > 0);
  assert.ok(result.minPriceForTarget > 200);
});

test('calculateROI flags negative profit as Evitar', () => {
  const result = calculateROI({
    salePrice: 100.00,
    productCost: 95.00,
    listingType: 'gold_pro',
    defaultShippingCost: 25.00
  });

  assert.ok(result.netProfit < 0);
  assert.strictEqual(result.verdict, 'Evitar');
});
