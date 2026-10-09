'use client';

import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { getStoreMeta } from '@/lib/ml-radar/stores';
import { tagAmazonUrl } from '@/lib/ml-radar/affiliate';
import { getProductFallbackImage } from '@/lib/ml-radar/imageFallback';

export interface ShowcaseDeal {
  id: string;
  title: string;
  description?: string;
  price: number;
  original_price?: number | null;
  discount_percent?: number | null;
  image_url?: string | null;
  product_url: string;
  store: string;
  category?: string;
  is_featured?: boolean;
  created_at?: string;
}

interface ShowcaseCardProps {
  deal: ShowcaseDeal;
}

export default function ShowcaseCard({ deal }: ShowcaseCardProps) {
  const [imgError, setImgError] = useState(false);
  const storeMeta = getStoreMeta(deal.store);
  const cleanDestinationUrl = tagAmazonUrl(deal.product_url);

  const formatBRL = (num?: number | null) => {
    if (num == null || isNaN(Number(num))) return '—';
    return Number(num).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const discountPercent =
    deal.discount_percent ||
    (deal.original_price && deal.original_price > deal.price
      ? Math.round(((deal.original_price - deal.price) / deal.original_price) * 100)
      : null);

  const displayImage = !imgError && deal.image_url ? deal.image_url : getProductFallbackImage(deal.title, deal.store);

  return (
    <article className="group relative flex flex-col justify-between rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700/80 shadow-md transition-all duration-200 overflow-hidden">
      {/* 1. Container Fixo de Imagem */}
      <div className="relative w-full aspect-square bg-white flex items-center justify-center p-6 overflow-hidden">
        <img
          src={displayImage}
          alt={deal.title}
          onError={() => setImgError(true)}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
        />

        {/* Badge de Desconto (% OFF) no canto superior esquerdo */}
        {discountPercent != null && discountPercent > 0 && (
          <span className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-md bg-emerald-500 text-zinc-950 font-black text-xs uppercase tracking-tight shadow-sm">
            -{discountPercent}% OFF
          </span>
        )}

        {/* Logo / Nome da Loja no canto superior direito */}
        <div className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900/90 border border-zinc-700/60 text-zinc-200 text-[11px] font-semibold backdrop-blur-md shadow-sm">
          {storeMeta.logo && (
            <img
              src={storeMeta.logo}
              alt={storeMeta.name}
              className="w-3.5 h-3.5 object-contain"
            />
          )}
          <span className="truncate max-w-[90px]">{storeMeta.name}</span>
        </div>
      </div>

      {/* 2. Conteúdo e Tipografia */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1.5">
          {/* Categoria */}
          <span className="text-xs uppercase font-semibold text-zinc-400 tracking-wider truncate block">
            {deal.category || 'Geral'}
          </span>

          {/* Título: Exatamente 2 linhas com h-12 para alinhamento uniforme */}
          <h3
            className="text-sm font-semibold text-zinc-100 leading-snug line-clamp-2 h-12 group-hover:text-emerald-400 transition-colors"
            title={deal.title}
          >
            {deal.title}
          </h3>
        </div>

        {/* 3. Seção de Preços e CTA */}
        <div className="space-y-3 pt-2 border-t border-zinc-800/80">
          <div className="space-y-0.5">
            {deal.original_price && deal.original_price > deal.price ? (
              <div className="flex items-center gap-2">
                <span className="text-xs line-through text-zinc-500 font-medium">
                  {formatBRL(deal.original_price)}
                </span>
                <span className="text-xs font-semibold text-emerald-400">
                  Economia de {formatBRL(deal.original_price - deal.price)}
                </span>
              </div>
            ) : (
              <div className="text-xs text-zinc-500 font-medium">
                Melhor preço verificado
              </div>
            )}

            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-white tracking-tight">
                {formatBRL(deal.price)}
              </span>
              <span className="text-xs text-zinc-400 font-medium">à vista</span>
            </div>
          </div>

          {/* Botão Acessar Oferta (Largura Total, estilo sólido refinado) */}
          <a
            href={cleanDestinationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-[0.98]"
          >
            <span>Acessar Oferta</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-700" />
          </a>
        </div>
      </div>
    </article>
  );
}
