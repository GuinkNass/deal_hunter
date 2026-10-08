import { NextRequest, NextResponse } from 'next/server';
import { getActiveProducts, createProduct, triggerCacheRevalidation } from '@/lib/products/service';
import { CreateProductInput } from '@/lib/products/types';

// Desabilita cache estático agressivo de rota para garantir frescor da API
export const dynamic = 'force-dynamic';

/**
 * GET /api/products
 * Retorna produtos ativos ordenados por data de criação
 */
export async function GET() {
  try {
    const products = await getActiveProducts(50);
    return NextResponse.json(
      {
        success: true,
        total: products.length,
        data: products,
        cachedAt: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          // Permite cache curto com stale-while-revalidate e suporte a revalidateTag
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Falha ao buscar produtos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products
 * Cadastra um novo produto com sanitização e invalidação instantânea do cache
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateProductInput;

    if (!body || !body.title || body.price === undefined) {
      return NextResponse.json(
        { success: false, error: 'Título e preço são campos obrigatórios.' },
        { status: 400 }
      );
    }

    // Cria o produto e dispara revalidação sob demanda internamente
    const product = await createProduct(body);

    return NextResponse.json(
      {
        success: true,
        message: 'Produto cadastrado e cache da vitrine revalidado com sucesso!',
        data: product,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao processar criação de produto.',
      },
      { status: 400 }
    );
  }
}
