import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const params = await req.json();

    const salePrice = Number(params.salePrice || 0);
    const productCost = Number(params.productCost || 0);
    const buyShipping = Number(params.buyShipping || 0);
    const totalCost = productCost + buyShipping;

    const listingType = params.listingType || 'gold_pro'; // 'gold_special' (Clássico) | 'gold_pro' (Premium)

    const desiredMargin = Number(params.desiredMargin ?? 20);
    const taxPercent = Number(params.taxPercent ?? 6);
    const packagingCost = Number(params.packagingCost ?? 3.50);
    const adsPercent = Number(params.adsPercent ?? 0);
    const returnPercent = Number(params.returnPercent ?? 2);
    const freeShippingThreshold = Number(params.freeShippingThreshold ?? 79.00);
    const fixedFeeUnderThreshold = Number(params.fixedFeeUnderThreshold ?? 6.00);
    const defaultShippingCost = Number(params.defaultShippingCost ?? 24.90);

    // Commission rates
    const feeClassico = Number(params.feeClassicoPercent ?? 12.0);
    const feePremium = Number(params.feePremiumPercent ?? 17.0);
    const commissionRate = listingType === 'gold_special' ? (feeClassico / 100) : (feePremium / 100);

    // 1. Commission Fee
    const commissionFee = Number((salePrice * commissionRate).toFixed(2));

    // 2. Fixed Fee
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

    // 4. Taxes & Marketing ML Investment
    const taxAmount = Number(((salePrice * taxPercent) / 100).toFixed(2));
    const adsFixedAmount = Number(params.adsFixedAmount || 0);
    const adsPercentCost = Number(((salePrice * adsPercent) / 100).toFixed(2));
    const marketingCost = Number((adsPercentCost + adsFixedAmount).toFixed(2));

    // 5. Total deductions & Net Profit (sem margem de devolução)
    const totalDeductions = commissionFee + fixedFee + shippingCost + packagingCost + taxAmount + marketingCost + totalCost;
    const trueNetProfit = Number((salePrice - totalDeductions).toFixed(2));

    // 6. Margin & ROI
    const marginPercent = salePrice > 0 ? Number(((trueNetProfit / salePrice) * 100).toFixed(2)) : 0;
    const roiPercent = totalCost > 0 ? Number(((trueNetProfit / totalCost) * 100).toFixed(2)) : 0;

    // 7. Break-even Price
    const variableRateSum = commissionRate + (taxPercent / 100) + (adsPercent / 100);
    const fixedCosts = fixedFee + shippingCost + packagingCost + adsFixedAmount + totalCost;
    let breakEvenPrice = 0;
    if (variableRateSum < 1) {
      breakEvenPrice = Number((fixedCosts / (1 - variableRateSum)).toFixed(2));
    }

    // 8. Min Price for Desired Margin
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

    return NextResponse.json({
      success: true,
      data: {
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
        adsFixedAmount,
        marketingCost,
        netProfit: trueNetProfit,
        marginPercent,
        roiPercent,
        breakEvenPrice,
        minPriceForTarget,
        verdict,
        desiredMargin,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
