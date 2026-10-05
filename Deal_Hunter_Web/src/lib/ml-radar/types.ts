export interface IngestPayload {
  title: string;
  price: number;
  originalPrice?: number | null;
  imageUrl?: string | null;
  productUrl: string;
  userId: string;
  store: string;
}

export interface MLMatchItem {
  id: string;
  title: string;
  permalink: string;
  price: number;
  original_price?: number;
  thumbnail: string;
  condition?: string;
  listing_type_id: string;
  free_shipping: boolean;
  is_full: boolean;
  sold_quantity?: number;
  seller_nickname?: string;
  seller_reputation_level?: string;
}

export interface ROIResult {
  salePrice: number;
  productCost: number;
  commissionFee: number;
  fixedFee: number;
  shippingCost: number;
  netProfit: number;
  marginPercent: number;
  roiPercent: number;
  verdict: 'Viável' | 'Atenção' | 'Evitar';
}

export interface GeminiAnalysis {
  score: number;
  demandTrend: string;
  bestSeason: string;
  riskLevel: 'Baixo' | 'Médio' | 'Alto' | 'Medio';
  verdict: string;
  justification: string;
}

export interface UserCredentials {
  gemini_api_key?: string | null;
  ml_api_key?: string | null;
  telegram_bot_token?: string | null;
  telegram_chat_id?: string | null;
}
