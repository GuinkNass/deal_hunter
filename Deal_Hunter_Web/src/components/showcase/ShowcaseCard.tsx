'use client';

import React, { useState } from 'react';
import { ExternalLink, Sparkles, TrendingDown, ShieldCheck, Flame } from 'lucide-react';
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

  const savingsAmount =
    deal.original_price && deal.original_price > deal.price
      ? deal.original_price - deal.price
      : null;

  const discountPercent =
    deal.discount_percent ||
    (deal.original_price && deal.original_price > deal.price
      ? Math.round(((deal.original_price - deal.price) / deal.original_price) * 100)
      : null);

  const displayImage = !imgError && deal.image_url ? deal.image_url : getProductFallbackImage(deal.title, deal.store);

  return (
    <article className="group relative flex flex-col justify-between rounded-2xl sm:rounded-3xl bg-[#0c101d] border border-white/[0.08] hover:border-violet-500/40 shadow-xl transition-colors duration-200 overflow-hidden">
      {/* Top Banner / Image Container */}
      <div className="relative w-full aspect-square bg-[#070a13] flex items-center justify-center p-5 overflow-hidden border-b border-white/[0.05]">
        {/* Imagem do Produto com no-referrer para contornar bloqueios das lojas */}
        <img
          src={displayImage}
          alt={deal.title}
          onError={() => setImgError(true)}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain"
        />

        {/* Badges Flutuantes Superiores */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 pointer-events-none">
          {/* Loja de Origem com Logo 3D */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${storeMeta.badgeBg} border ${storeMeta.badgeBorder} ${storeMeta.badgeText} text-[11px] font-bold tracking-wide backdrop-blur-md shadow-sm`}
          >
            {storeMeta.logo && (
              <img
                src={storeMeta.logo}
                alt={storeMeta.name}
                className="w-3.5 h-3.5 object-contain"
              />
            )}
            <span className="truncate max-w-[100px]">{storeMeta.name}</span>
          </div>

          {/* Badge de Desconto em Destaque */}
          {discountPercent != null && discountPercent > 0 && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#d4ff32] text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-[#d4ff32]/20">
              <Flame className="w-3 h-3 fill-black text-black" />
              <span>-{discountPercent}% OFF</span>
            </div>
          )}
        </div>

        {/* Selo Curadoria / Verificado */}
        <div className="absolute bottom-2.5 left-3.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-full backdrop-blur-sm">
          <ShieldCheck className="w-3 h-3" />
          <span>Curadoria Deal Hunter</span>
        </div>
      </div>

      {/* Conteúdo / Detalhes da Oferta */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Categoria */}
          {deal.category && (
            <span className="text-[11px] font-bold uppercase tracking-wider text-violet-400">
              {deal.category}
            </span>
          )}

          {/* Título do Produto */}
          <h3
            className="text-sm sm:text-base font-bold text-white leading-snug line-clamp-2 group-hover:text-violet-300 transition-colors"
            title={deal.title}
          >
            {deal.title}
          </h3>

          {/* Descrição resumida */}
          {deal.description && (
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
              {deal.description}
            </p>
          )}
        </div>

        {/* Bloco de Preços e Economia */}
        <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
          {deal.original_price && deal.original_price > deal.price ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 line-through">
                {formatBRL(deal.original_price)}
              </span>
              {savingsAmount && (
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-0.5">
                  <TrendingDown className="w-3 h-3" />
                  Econ. de {formatBRL(savingsAmount)}
                </span>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 font-medium">
              Superpreço Verificado
            </div>
          )}

          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatBRL(deal.price)}
            </span>
            <span className="text-[11px] text-slate-400 font-semibold uppercase">
              à vista
            </span>
          </div>
        </div>

        {/* CTA Principal de Redirecionamento (Nova Aba) */}
        <div className="pt-2">
          <a
            href={cleanDestinationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-violet-600/25 hover:shadow-cyan-500/30 hover:-translate-y-0.5 active:scale-[0.98] transition-all group/btn"
          >
            <span>Acessar Oferta</span>
            <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </article>
  );
}
