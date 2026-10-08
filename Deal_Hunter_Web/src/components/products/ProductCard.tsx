'use client';

import React, { useState } from 'react';
import { Product } from '@/lib/products/types';
import { ShoppingCart, AlertCircle, CheckCircle2, Tag } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [imgError, setImgError] = useState(false);

  const hasDiscount =
    product.promotional_price !== null &&
    product.promotional_price !== undefined &&
    product.promotional_price < product.price;

  const discountPercent = hasDiscount
    ? Math.round(((product.price - Number(product.promotional_price)) / product.price) * 100)
    : 0;

  const currentPrice = hasDiscount ? Number(product.promotional_price) : product.price;
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  // Formatação segura de moeda em Real Brasileiro
  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <div
      className={`group relative flex flex-col justify-between bg-[#111625] border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/5 ${
        isOutOfStock
          ? 'border-slate-800/60 opacity-80'
          : 'border-slate-800 hover:border-slate-700/80 hover:-translate-y-1'
      }`}
    >
      {/* Top Badges */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        {hasDiscount && !isOutOfStock && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20">
            <Tag className="w-3 h-3" />
            {discountPercent}% OFF
          </span>
        )}

        {isOutOfStock && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-500/90 text-white shadow-md shadow-rose-500/20">
            <AlertCircle className="w-3 h-3" />
            ESGOTADO
          </span>
        )}

        {isLowStock && !isOutOfStock && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 ml-auto">
            Últimas {product.stock} un.
          </span>
        )}
      </div>

      {/* Container de Imagem com Aspect Ratio */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-900/60 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            imgError || !product.image_url
              ? 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'
              : product.image_url
          }
          alt={product.title}
          onError={() => setImgError(true)}
          loading="lazy"
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            isOutOfStock ? 'grayscale contrast-75' : ''
          }`}
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px] flex items-center justify-center">
            <span className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider">
              Sem Estoque
            </span>
          </div>
        )}
      </div>

      {/* Detalhes do Produto */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div className="space-y-1">
          <span className="text-[10px] font-mono text-cyan-400/80 uppercase tracking-wider block">
            ID: {product.slug || product.id.slice(0, 8)}
          </span>
          <h3
            className="text-sm font-semibold text-slate-100 line-clamp-2 leading-snug group-hover:text-cyan-300 transition-colors"
            title={product.title}
          >
            {product.title}
          </h3>
        </div>

        {/* Bloco de Preços */}
        <div className="pt-2 border-t border-slate-800/80 space-y-1">
          {hasDiscount && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 line-through">
              <span>De: {formatCurrency(product.price)}</span>
            </div>
          )}

          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-white tracking-tight">
              {formatCurrency(currentPrice)}
            </span>
            {hasDiscount && (
              <span className="text-[11px] font-bold text-emerald-400">à vista</span>
            )}
          </div>

          {/* Status de Estoque */}
          <div className="flex items-center gap-1.5 text-[11px] pt-1">
            {isOutOfStock ? (
              <span className="text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Indisponível no momento
              </span>
            ) : (
              <span className="text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                {product.stock > 10 ? 'Em estoque' : `Restam ${product.stock} unidades`}
              </span>
            )}
          </div>
        </div>

        {/* Botão de Ação */}
        <button
          type="button"
          disabled={isOutOfStock}
          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
            isOutOfStock
              ? 'bg-slate-800/60 text-slate-500 cursor-not-allowed border border-slate-800'
              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black shadow-lg shadow-cyan-500/10 active:scale-[0.98]'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>{isOutOfStock ? 'Esgotado' : 'Comprar Agora'}</span>
        </button>
      </div>
    </div>
  );
};
