'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Calculator,
  ExternalLink,
  ArrowUpRight,
  Trash2,
  CheckSquare,
  Square,
  Store,
  Star,
  MoreVertical,
  Layers,
} from 'lucide-react';
import { DealAnalysis } from './AnalysisDetailModal';
import { getProductFallbackImage } from '@/lib/ml-radar/imageFallback';
import { buildCanonicalMlUrl } from '@/lib/ml-radar/clinicalAudit';
import { tagAmazonUrl } from '@/lib/ml-radar/affiliate';
import { useLanguageCurrency } from '@/contexts/LanguageCurrencyContext';

interface DealProductCardProps {
  deal: DealAnalysis;
  isSelected: boolean;
  isAdmin?: boolean;
  onToggleSelect: (dealId: string, e?: React.MouseEvent) => void;
  onDelete: (deal: DealAnalysis, e?: React.MouseEvent) => void;
  onEvaluate: (deal: DealAnalysis) => void;
  onOpenCalculator: (deal: DealAnalysis) => void;
  onToggleFeatured?: (deal: DealAnalysis, e?: React.MouseEvent) => void;
}

function DealProductCardComponent({
  deal,
  isSelected,
  isAdmin = false,
  onToggleSelect,
  onDelete,
  onEvaluate,
  onOpenCalculator,
  onToggleFeatured,
}: DealProductCardProps) {
  const { formatMoney, t } = useLanguageCurrency();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const itemTitle = deal.title || deal.source_title || 'Produto sem título';
  const itemPrice = Number(deal.price || deal.source_price || 0);
  const originalPrice = deal.original_price ? Number(deal.original_price) : null;
  const dealId = deal.id || '';

  const isViable = deal.verdict === 'Viável';
  const isAttention = deal.verdict === 'Atenção';
  const isAvoid = deal.verdict === 'Evitar';

  const isEvaluated = Boolean(
    deal.clinical_evaluated ||
    (deal.ml_url &&
      (deal.ml_url.includes('produto.mercadolivre.com.br') ||
        deal.ml_url.includes('/p/MLB') ||
        deal.ml_url.includes('/MLB-')))
  );

  const canonicalMlUrl = deal.ml_url
    ? buildCanonicalMlUrl(deal.ml_url, dealId, itemTitle)
    : null;
  const hasValidMlUrl = Boolean(
    canonicalMlUrl &&
      canonicalMlUrl !== '#' &&
      !canonicalMlUrl.endsWith('mercadolivre.com.br') &&
      !canonicalMlUrl.endsWith('mercadolivre.com.br/')
  );

  const discountPercent =
    originalPrice && originalPrice > itemPrice
      ? Math.round(((originalPrice - itemPrice) / originalPrice) * 100)
      : null;

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <div
      onClick={() => onEvaluate(deal)}
      className={`group relative flex flex-col justify-between h-full bg-zinc-950 hover:bg-zinc-900/70 border rounded-2xl p-4 transition-all duration-150 cursor-pointer shadow-sm ${
        isSelected
          ? 'border-zinc-500 bg-zinc-900/90 ring-1 ring-zinc-500'
          : 'border-zinc-800/80 hover:border-zinc-700'
      }`}
    >
      {/* ===================================================================== */}
      {/* 1. CABEÇALHO DO CARD (Seleção, Loja de Origem, Status & Menu ...)    */}
      {/* ===================================================================== */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={(e) => onToggleSelect(dealId, e)}
            className="p-0.5 rounded text-zinc-500 hover:text-zinc-200 transition-colors flex-shrink-0"
            title={isSelected ? 'Desmarcar produto' : 'Marcar para seleção em lote'}
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-emerald-400" />
            ) : (
              <Square className="w-4 h-4 text-zinc-600 hover:text-zinc-400" />
            )}
          </button>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] font-medium uppercase tracking-wider truncate">
            <Store className="w-2.5 h-2.5 text-zinc-400" />
            {deal.store || 'Origem'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Status Semântico Limpo */}
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${
              isViable
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : isAttention
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : isAvoid
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800'
            }`}
          >
            {deal.verdict || (isEvaluated ? 'Avaliado' : 'Radar')}
          </span>

          {/* Menu Dropdown de Ações Secundárias ("...") */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
              title="Mais ações"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl py-1 z-30 text-xs text-zinc-200 divide-y divide-zinc-800/60 animate-in fade-in-50 zoom-in-95 duration-100">
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenCalculator(deal);
                    }}
                    className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-zinc-800 text-left transition-colors"
                  >
                    <Calculator className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Calcular Margem</span>
                  </button>

                  {deal.product_url && (
                    <a
                      href={tagAmazonUrl(deal.product_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMenuOpen(false)}
                      className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-zinc-800 text-left transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Abrir na Loja</span>
                    </a>
                  )}

                  {hasValidMlUrl && (
                    <a
                      href={canonicalMlUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMenuOpen(false)}
                      className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-zinc-800 text-left transition-colors text-amber-300"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Anúncio Líder ML</span>
                    </a>
                  )}
                </div>

                {isAdmin && onToggleFeatured && (
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        setMenuOpen(false);
                        onToggleFeatured(deal, e);
                      }}
                      className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-zinc-800 text-left transition-colors text-amber-300"
                    >
                      <Star className={`w-3.5 h-3.5 ${deal.is_featured ? 'fill-amber-400' : ''}`} />
                      <span>{deal.is_featured ? 'Remover da Vitrine' : 'Destacar na Vitrine'}</span>
                    </button>
                  </div>
                )}

                <div className="py-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      setMenuOpen(false);
                      onDelete(deal, e);
                    }}
                    className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-rose-950/40 text-rose-400 text-left transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir do Radar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. ÁREA DA IMAGEM                                                    */}
      {/* ===================================================================== */}
      <div className="relative w-full aspect-square bg-white rounded-xl p-4 mb-3 flex items-center justify-center overflow-hidden">
        {discountPercent !== null && discountPercent > 0 && (
          <span className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded bg-zinc-900/90 text-zinc-100 text-[10px] font-bold border border-zinc-700/60 shadow-sm">
            -{discountPercent}%
          </span>
        )}

        {deal.gemini_analysis?.score && (
          <span className="absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded bg-zinc-900/90 text-zinc-200 text-[10px] font-semibold border border-zinc-700/60 flex items-center gap-1 shadow-sm">
            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
            {deal.gemini_analysis.score} pts
          </span>
        )}

        {deal.is_featured && isAdmin && (
          <span className="absolute bottom-2 left-2 z-10 px-1.5 py-0.5 rounded bg-zinc-900/95 text-amber-300 text-[10px] font-bold border border-amber-500/40 flex items-center gap-1 shadow-sm">
            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
            Vitrine
          </span>
        )}

        <img
          src={
            deal.image_url ||
            deal.source_image_url ||
            getProductFallbackImage(itemTitle, deal.store)
          }
          alt={itemTitle}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = getProductFallbackImage(itemTitle, deal.store);
          }}
        />
      </div>

      {/* ===================================================================== */}
      {/* 3. TIPOGRAFIA & PREÇOS                                                */}
      {/* ===================================================================== */}
      <div className="flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h4
            className="text-xs sm:text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors line-clamp-2 leading-snug h-10"
            title={itemTitle}
          >
            {itemTitle}
          </h4>

          {/* Preço Limpo */}
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-lg font-bold text-white tracking-tight">
              {formatMoney(itemPrice)}
            </span>
            {originalPrice && originalPrice > itemPrice && (
              <span className="text-xs text-zinc-500 line-through font-medium">
                {formatMoney(originalPrice)}
              </span>
            )}
          </div>
        </div>

        {/* =================================================================== */}
        {/* 4. PAINEL DE BENCHMARKING MERCADO LIVRE (Minimalista)               */}
        {/* =================================================================== */}
        <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1 text-xs">
          {isEvaluated ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">Preço Líder ML:</span>
                <span className="font-semibold text-zinc-100">
                  {formatMoney(Number(deal.ml_price || 0))}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-zinc-800/60">
                <span className="text-zinc-400">Lucro Estimado:</span>
                <span className="font-bold text-emerald-400">
                  {formatMoney(Number(deal.net_profit || 0))} ({Number(deal.roi_percent || 0).toFixed(0)}% ROI)
                </span>
              </div>
            </div>
          ) : (
            <div className="py-1 text-center">
              <span className="text-[11px] text-zinc-400 font-medium flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-zinc-500" /> Clique em Avaliar para ler o ML
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 5. AÇÃO PRIMÁRIA ÚNICA NA BASE                                       */}
      {/* ===================================================================== */}
      <div className="pt-3 mt-1" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onEvaluate(deal)}
          className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
            isEvaluated
              ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800'
              : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 font-bold'
          }`}
          title={isEvaluated ? 'Ver detalhes da auditoria do anúncio' : 'Avaliar concorrência e líderes no Mercado Livre'}
        >
          {isEvaluated ? (
            <>
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              <span>Ver Análise ML</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Avaliar ML</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

const DealProductCard = React.memo(DealProductCardComponent);
export default DealProductCard;
