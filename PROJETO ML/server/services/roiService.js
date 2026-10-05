const { getSetting } = require('../db/db');

/**
 * Calculates complete financial viability, fees and ROI for Mercado Livre resale
 */
function calculateROI(params) {
  const salePrice = Number(params.salePrice || 0);
  const productCost = Number(params.productCost || 0);
  const buyShipping = Number(params.buyShipping || 0);
  const totalCost = productCost + buyShipping;

  const listingType = params.listingType || 'gold_pro'; // 'gold_special' (Clássico) | 'gold_pro' (Premium)

  // Get system configs or use passed overrides
  const desiredMargin = Number(params.desiredMargin ?? getSetting('desired_margin', 20));
  const taxPercent = Number(params.taxPercent ?? getSetting('tax_percent', 6));
  const packagingCost = Number(params.packagingCost ?? getSetting('packaging_cost', 3.50));
  const adsPercent = Number(params.adsPercent ?? getSetting('ads_percent', 0));
  const returnPercent = Number(params.returnPercent ?? getSetting('return_percent', 2));
  const freeShippingThreshold = Number(params.freeShippingThreshold ?? getSetting('free_shipping_threshold', 79.00));
  const fixedFeeUnderThreshold = Number(params.fixedFeeUnderThreshold ?? getSetting('fixed_fee_under_79', 6.00));
  const defaultShippingCost = Number(params.defaultShippingCost ?? getSetting('default_shipping_cost', 24.90));

  // Commission rates
  const feeClassico = Number(params.feeClassicoPercent ?? getSetting('fee_classico_percent', 12.0));
  const feePremium = Number(params.feePremiumPercent ?? getSetting('fee_premium_percent', 17.0));
  const commissionRate = listingType === 'gold_special' ? (feeClassico / 100) : (feePremium / 100);

  // 1. Commission Fee
  const commissionFee = Number((salePrice * commissionRate).toFixed(2));

  // 2. Fixed Fee (applicable under threshold)
  let fixedFee = 0;
  if (salePrice > 0 && salePrice < freeShippingThreshold) {
    fixedFee = fixedFeeUnderThreshold;
  }

  // 3. Shipping cost
  let shippingCost = 0;
  const isAutoFreeShipping = params.freeShippingAuto !== undefined ? Boolean(params.freeShippingAuto) : true;
  const isCustomShipping = Boolean(params.customShippingEnabled);

  if (isCustomShipping) {
    shippingCost = Number(params.customShippingCost || 0);
  } else if (isAutoFreeShipping && salePrice >= freeShippingThreshold) {
    shippingCost = Number(params.shippingCost || defaultShippingCost);
  } else if (params.freeShipping) {
    shippingCost = Number(params.shippingCost || defaultShippingCost);
  }

  // 4. Taxes & Extra Costs
  const taxAmount = Number(((salePrice * taxPercent) / 100).toFixed(2));
  const adsCost = Number(((salePrice * adsPercent) / 100).toFixed(2));
  const returnCost = Number(((salePrice * returnPercent) / 100).toFixed(2));
  const extraCosts = Number((adsCost + returnCost).toFixed(2));

  // 5. Total deductions & Net Profit
  const totalDeductions = commissionFee + fixedFee + shippingCost + packagingCost + taxAmount + extraCosts + totalCost;
  const netProfit = Number((salePrice - totalDeductions + totalCost - totalCost).toFixed(2)); // salePrice - all deductions
  const trueNetProfit = Number((salePrice - (commissionFee + fixedFee + shippingCost + packagingCost + taxAmount + extraCosts + totalCost)).toFixed(2));

  // 6. Margin & ROI
  const marginPercent = salePrice > 0 ? Number(((trueNetProfit / salePrice) * 100).toFixed(2)) : 0;
  const roiPercent = totalCost > 0 ? Number(((trueNetProfit / totalCost) * 100).toFixed(2)) : 0;

  // 7. Break-even Price (Ponto de Equilíbrio: Lucro = 0)
  // P - (comm + tax + ads + ret)*P - (fixedFee + shipping + packaging + totalCost) = 0
  const variableRateSum = commissionRate + (taxPercent / 100) + (adsPercent / 100) + (returnPercent / 100);
  const fixedCosts = fixedFee + shippingCost + packagingCost + totalCost;
  
  let breakEvenPrice = 0;
  if (variableRateSum < 1) {
    breakEvenPrice = Number((fixedCosts / (1 - variableRateSum)).toFixed(2));
  }

  // 8. Min Price for Desired Margin
  // Profit / P = desiredMargin / 100 => P * (1 - (M/100) - variableRateSum) = fixedCosts
  let minPriceForTarget = 0;
  const targetMarginDecimal = desiredMargin / 100;
  if ((1 - targetMarginDecimal - variableRateSum) > 0) {
    minPriceForTarget = Number((fixedCosts / (1 - targetMarginDecimal - variableRateSum)).toFixed(2));
  }

  // 9. Verdict
  let verdict = 'Evitar';
  if (marginPercent >= desiredMargin) {
    verdict = 'Viável';
  } else if (trueNetProfit > 0) {
    verdict = 'Atenção';
  }

  return {
    salePrice,
    productCost,
    buyShipping,
    totalCost,
    listingType,
    commissionRate: commissionRate * 100,
    commissionFee,
    fixedFee,
    shippingCost,
    packagingCost,
    taxPercent,
    taxAmount,
    adsPercent,
    returnPercent,
    extraCosts,
    netProfit: trueNetProfit,
    marginPercent,
    roiPercent,
    breakEvenPrice,
    minPriceForTarget,
    verdict,
    desiredMargin
  };
}

module.exports = {
  calculateROI
};
