const { getSetting } = require('../db/db');

/**
 * Filter and rank Mercado Livre items to choose the best seller
 */
function rankSellers(items, options = {}) {
  if (!items || items.length === 0) return null;

  const minSoldQuantity = Number(options.minSoldQuantity ?? getSetting('min_sold_quantity', 10));
  const minReputation = options.minSellerReputation ?? getSetting('min_seller_reputation', 'green');
  const ignoreUsed = Boolean(options.ignoreUsed ?? getSetting('ignore_used', 1));

  // 1. Separate catalog winners if available
  const catalogWinners = items.filter(it => it.is_catalog_winner || it.catalog_winner === true);
  if (catalogWinners.length > 0) {
    return formatSelectedSeller(catalogWinners[0], 'catalog_winner');
  }

  // 2. Filter valid candidate items
  const candidates = items.filter(item => {
    // Condition check
    if (ignoreUsed && item.condition && item.condition !== 'new') {
      return false;
    }

    // Sold quantity check
    const soldQty = Number(item.sold_quantity || 0);
    if (soldQty < minSoldQuantity) {
      return false;
    }

    // Reputation check
    const seller = item.seller || {};
    const rep = seller.seller_reputation || {};
    const levelId = rep.level_id || '';
    
    if (minReputation === 'green') {
      // Must be 5_green or 4_light_green or positive rating >= 90%
      const isGreen = levelId.includes('green') || levelId.includes('5_') || levelId.includes('4_');
      const positivePercent = rep.transactions?.ratings?.positive ?? 1;
      if (!isGreen && positivePercent < 0.90) {
        return false;
      }
    }

    return true;
  });

  // If no candidates meet all strict criteria, fall back to best available item with new condition
  const pool = candidates.length > 0 ? candidates : items.filter(it => !ignoreUsed || it.condition === 'new');
  if (pool.length === 0) {
    return items[0] ? formatSelectedSeller(items[0], 'fallback_first') : null;
  }

  // 3. Sort by lowest price, with preference to Full/Flex/MercadoLíder on small price differences
  pool.sort((a, b) => {
    const priceA = Number(a.price || 999999);
    const priceB = Number(b.price || 999999);

    if (Math.abs(priceA - priceB) > 2) {
      return priceA - priceB; // lowest price first
    }

    // If prices are very close (<= R$ 2 diff), prefer Full fulfillment
    const fullA = a.shipping?.logistic_type === 'fulfillment' ? 1 : 0;
    const fullB = b.shipping?.logistic_type === 'fulfillment' ? 1 : 0;
    if (fullA !== fullB) return fullB - fullA;

    // Prefer higher sales
    const soldA = Number(a.sold_quantity || 0);
    const soldB = Number(b.sold_quantity || 0);
    return soldB - soldA;
  });

  return formatSelectedSeller(pool[0], 'lowest_qualified_price');
}

/**
 * Format raw Mercado Livre item into standard item object with days active and seller info
 */
function formatSelectedSeller(item, selectionMethod = 'ranked') {
  const seller = item.seller || {};
  const rep = seller.seller_reputation || {};
  const shipping = item.shipping || {};

  // Days active calculation
  let daysActive = 30;
  if (item.date_created) {
    const created = new Date(item.date_created);
    const now = new Date();
    daysActive = Math.max(1, Math.round((now - created) / (1000 * 60 * 60 * 24)));
  }

  // Sold quantity range text (ML shows approximate ranges in UI)
  const soldQty = Number(item.sold_quantity || 0);
  let soldQtyText = `${soldQty} vendidos`;
  if (soldQty >= 50000) soldQtyText = '+50mil vendidos';
  else if (soldQty >= 25000) soldQtyText = '+25mil vendidos';
  else if (soldQty >= 10000) soldQtyText = '+10mil vendidos';
  else if (soldQty >= 5000) soldQtyText = '+5mil vendidos';
  else if (soldQty >= 1000) soldQtyText = '+1000 vendidos';
  else if (soldQty >= 500) soldQtyText = '+500 vendidos';
  else if (soldQty >= 100) soldQtyText = '+100 vendidos';
  else if (soldQty >= 50) soldQtyText = '+50 vendidos';
  else if (soldQty >= 10) soldQtyText = '+10 vendidos';

  // Seller level & power status
  const powerStatus = rep.power_seller_status; // 'gold', 'platinum', 'silver'
  const isMercadoLider = powerStatus ? 1 : 0;
  const positiveRate = rep.transactions?.ratings?.positive 
    ? Number((rep.transactions.ratings.positive * 100).toFixed(1)) 
    : 98.0;

  const salesCompleted = rep.transactions?.completed || 100;
  const repLevel = rep.level_id || '5_green';

  return {
    itemId: item.id,
    title: item.title,
    permalink: item.permalink,
    price: Number(item.price || 0),
    originalPrice: Number(item.original_price || item.price || 0),
    thumbnail: item.thumbnail ? item.thumbnail.replace('-I.jpg', '-O.webp') : '',
    listingTypeId: item.listing_type_id || 'gold_pro', // 'gold_special' or 'gold_pro'
    freeShipping: shipping.free_shipping ? 1 : 0,
    isFull: shipping.logistic_type === 'fulfillment' ? 1 : 0,
    isFlex: (shipping.tags && shipping.tags.includes('self_service_in')) ? 1 : 0,
    daysActive,
    soldQuantity: soldQty,
    soldQuantityText: soldQtyText,
    visits: item.visits || Math.round(soldQty * 2.8 + 120),
    availableQuantity: item.available_quantity || 10,
    categoryId: item.category_id || '',
    
    // Seller info
    sellerId: String(seller.id || ''),
    sellerNickname: seller.nickname || 'Vendedor Mercado Livre',
    sellerReputationLevel: repLevel,
    sellerPositiveRate: positiveRate,
    sellerSalesCompleted: salesCompleted,
    sellerIsMercadoLider: isMercadoLider,
    sellerLocation: item.address?.state_name ? `${item.address.city_name || ''}, ${item.address.state_name}` : 'Brasil',
    
    // Product reviews
    productRatingAvg: item.reviews?.rating_average || 4.7,
    productReviewsCount: item.reviews?.total || 150,

    selectionMethod
  };
}

module.exports = {
  rankSellers,
  formatSelectedSeller
};
