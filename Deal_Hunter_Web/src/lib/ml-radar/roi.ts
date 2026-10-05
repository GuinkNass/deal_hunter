import { ROIResult } from './types';

/**
 * Calcula a viabilidade financeira e ROI para revenda no Mercado Livre
 */
export function calculateROI(params: {
  salePrice: number;
  productCost: number;
  listingType?: string;
  freeShipping?: boolean;
  desiredMargin?: number;
}): ROIResult {
  const salePrice = Number(params.salePrice || 0);
  const productCost = Number(params.productCost || 0);
  const listingType = params.listingType || 'gold_pro'; // 'gold_special' (12%) | 'gold_pro' (17%)
  const desiredMargin = Number(params.desiredMargin ?? 20);

  // Taxa de comissão ML (12% clássico ou 17% premium)
  const commissionRate = listingType === 'gold_special' ? 0.12 : 0.17;
  const commissionFee = Number((salePrice * commissionRate).toFixed(2));

  // Tarifa fixa ML abaixo de R$ 79,00 (R$ 6,00)
  const fixedFee = salePrice > 0 && salePrice < 79.0 ? 6.0 : 0.0;

  // Custo estimado de frete quando frete grátis oferecido pelo vendedor
  let shippingCost = 0;
  if (params.freeShipping || salePrice >= 79.0) {
    shippingCost = salePrice >= 79.0 ? 24.9 : 0;
  }

  // Custos operacionais aproximados (embalagem R$ 3,50 + impostos 6%)
  const packagingCost = 3.5;
  const taxAmount = Number((salePrice * 0.06).toFixed(2));

  // Deduções e Lucro Líquido
  const totalDeductions = commissionFee + fixedFee + shippingCost + packagingCost + taxAmount + productCost;
  const netProfit = Number((salePrice - totalDeductions).toFixed(2));

  // Margem de Lucro e ROI
  const marginPercent = salePrice > 0 ? Number(((netProfit / salePrice) * 100).toFixed(2)) : 0;
  const roiPercent = productCost > 0 ? Number(((netProfit / productCost) * 100).toFixed(2)) : 0;

  let verdict: 'Viável' | 'Atenção' | 'Evitar' = 'Evitar';
  if (marginPercent >= desiredMargin) {
    verdict = 'Viável';
  } else if (netProfit > 0) {
    verdict = 'Atenção';
  }

  return {
    salePrice,
    productCost,
    commissionFee,
    fixedFee,
    shippingCost,
    netProfit,
    marginPercent,
    roiPercent,
    verdict,
  };
}
