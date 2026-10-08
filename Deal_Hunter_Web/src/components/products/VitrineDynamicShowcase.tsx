'use client';

import React, { useState } from 'react';
import { Product } from '@/lib/products/types';
import { ProductGrid } from './ProductGrid';
import { AdminProductForm } from './AdminProductForm';
import { Sparkles, SlidersHorizontal, RefreshCw, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface VitrineDynamicShowcaseProps {
  initialProducts: Product[];
}

export const VitrineDynamicShowcase: React.FC<VitrineDynamicShowcaseProps> = ({
  initialProducts,
}) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [showAdminForm, setShowAdminForm] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const router = useRouter();

  const handleProductCreated = (newProduct: Product) => {
    // Adiciona o novo produto ao topo da lista instantaneamente
    setProducts((prev) => [newProduct, ...prev.filter((p) => p.id !== newProduct.id)]);
    // Sincroniza a árvore do Server Component via router.refresh()
    router.refresh();
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/products?t=' + Date.now(), { cache: 'no-store' });
      const json = await res.json();
      if (json.success && json.data) {
        setProducts(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Barra de Controles Superiores */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0c101c] border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              Vitrine de Produtos em Produção
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                0 Deploy / 0 Build
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Atualização sob demanda via Next.js ISR & Revalidation Tags.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-xs font-semibold flex items-center gap-2 transition-colors"
            title="Verificar dados frescos do servidor"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Sincronizar</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAdminForm(!showAdminForm)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md ${
              showAdminForm
                ? 'bg-cyan-500 text-slate-950 shadow-cyan-500/20 font-black'
                : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showAdminForm ? 'Ocultar Painel Admin' : 'Abrir Painel Admin'}</span>
          </button>
        </div>
      </div>

      {/* Painel Administrativo de Teste (Colapsável) */}
      {showAdminForm && (
        <div className="transition-all duration-300">
          <AdminProductForm onProductCreated={handleProductCreated} />
        </div>
      )}

      {/* Grid de Produtos Responsivo */}
      <div className="pt-2">
        <ProductGrid
          products={products}
          onOpenCreate={() => setShowAdminForm(true)}
        />
      </div>
    </div>
  );
};
