'use client';

import React from 'react';
import { Product } from '@/lib/products/types';
import { ProductCard } from './ProductCard';
import { PackageOpen, Sparkles } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  onOpenCreate?: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading = false,
  onOpenCreate,
}) => {
  // Estado 1: Skeleton Loading
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className="bg-[#111625] border border-slate-800/80 rounded-2xl p-4 space-y-4 animate-pulse"
          >
            <div className="aspect-square w-full rounded-xl bg-slate-800/60" />
            <div className="space-y-2">
              <div className="h-3 w-1/3 bg-slate-800 rounded" />
              <div className="h-4 w-full bg-slate-800 rounded" />
              <div className="h-4 w-2/3 bg-slate-800 rounded" />
            </div>
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="h-6 w-1/2 bg-slate-800 rounded" />
              <div className="h-8 w-full bg-slate-800 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Estado 2: Lista Vazia
  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-[#0d111d] border border-slate-800 rounded-3xl space-y-4 max-w-xl mx-auto shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
          <PackageOpen className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">Nenhum produto cadastrado na vitrine</h3>
          <p className="text-sm text-slate-400 max-w-sm">
            Cadastre o primeiro item através do painel de teste administrativo para vê-lo aparecer instantaneamente.
          </p>
        </div>
        {onOpenCreate && (
          <button
            onClick={onOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-cyan-500/10"
          >
            <Sparkles className="w-4 h-4" />
            Cadastrar Primeiro Produto
          </button>
        )}
      </div>
    );
  }

  // Estado 3: Grid de Produtos Responsivo (1 a 4 colunas)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>Exibindo <strong>{products.length}</strong> produtos ativos</span>
        <span className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Vitrine em Tempo Real
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};
