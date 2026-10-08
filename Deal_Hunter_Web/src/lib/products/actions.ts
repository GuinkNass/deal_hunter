'use server';

import { createProduct, getActiveProducts } from './service';
import { CreateProductInput, Product } from './types';

export interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action para criar produto a partir do Admin Form
 * Atualiza o banco e dispara revalidação instantânea no servidor
 */
export async function createProductAction(input: CreateProductInput): Promise<ActionResponse<Product>> {
  try {
    const product = await createProduct(input);
    return {
      success: true,
      data: product,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Falha ao salvar produto.',
    };
  }
}

/**
 * Server Action para buscar produtos frescos sob demanda
 */
export async function fetchProductsAction(): Promise<ActionResponse<Product[]>> {
  try {
    const products = await getActiveProducts(50);
    return {
      success: true,
      data: products,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Falha ao listar produtos.',
    };
  }
}
