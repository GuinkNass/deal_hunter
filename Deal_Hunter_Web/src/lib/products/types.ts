export interface Product {
  id: string;
  title: string;
  slug: string;
  price: number;
  promotional_price: number | null;
  stock: number;
  image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CreateProductInput {
  title: string;
  slug?: string;
  price: number;
  promotional_price?: number | null;
  stock?: number;
  image_url: string;
  is_active?: boolean;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: string;
}

export interface ProductsResponse {
  success: boolean;
  data: Product[];
  total: number;
  cachedAt?: string;
}

export interface SingleProductResponse {
  success: boolean;
  data?: Product;
  error?: string;
}
