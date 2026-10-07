'use client';

import React from 'react';
import {
  Sparkles,
  Calculator,
  ExternalLink,
  ArrowUpRight,
  Trash2,
  CheckSquare,
  Square,
  Store,
} from 'lucide-react';
import { DealAnalysis } from './AnalysisDetailModal';
import { getProductFallbackImage } from '@/lib/ml-radar/imageFallback';
import { buildCanonicalMlUrl } from '@/lib/ml-radar/clinicalAudit';
import { tagAmazonUrl } from '@/lib/ml-radar/affiliate';

interface DealProductCardProps {
  deal: DealAnalysis;
  isSelected: boolean;
  onToggleSelect: (dealId: string, e?: React.MouseEvent) => void;
  onDelete: (deal: DealAnalysis, e?: React.MouseEvent) => void;
  onEvaluate: (deal: DealAnalysis) => void;
  onOpenCalculator: (deal: DealAnalysis) => void;
}

export default function DealProductCard({
  deal,
  isSelected,
  onToggleSelect,
  onDelete,
  onEvaluate,
  onOpenCalculator,
}: DealProductCardProps) {
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

  return (
    <div
      onClick={() => onEvaluate(deal)}
      className={`group relative flex flex-col justify-between h-full bg-[#111726]/90 hover:bg-[#141d30] border rounded-2xl p-4 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-cyan-500/10 ${
        isSelected
          ? 'border-cyan-400 bg-cyan-950/20 ring-1 ring-cyan-400/50'
          : 'border-zinc-800/80 hover:border-cyan-500/50'
      }`}
    >
      {/* ===================================================================== */}
      {/* CABEÇALHO DO CARD (Seleção, Loja de Origem, Status & Lixeira)        */}
      {/* ===================================================================== */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={(e) => onToggleSelect(dealId, e)}
            className="p-0.5 rounded text-zinc-500 hover:text-cyan-400 transition-colors flex-shrink-0"
            title={isSelected ? 'Desmarcar produto' : 'Marcar para seleção em lote'}
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-cyan-400" />
            ) : (
              <Square className="w-4 h-4 text-zinc-600 hover:text-zinc-400" />
            )}
          </button>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800/90 text-zinc-300 text-[10px] font-bold border border-zinc-700/60 uppercase tracking-wider truncate">
            <Store className="w-2.5 h-2.5 text-zinc-400" />
            {deal.store || 'Origem'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <span
            className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
              isViable
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : isAttention
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : isAvoid
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/40'
            }`}
          >
            {deal.verdict || (isEvaluated ? 'Avaliado' : 'Radar')}
          </span>

          <button
            type="button"
            onClick={(e) => onDelete(deal, e)}
            className="p-1 rounded-md text-zinc-600 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
            title="Excluir este anúncio do Radar"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* ÁREA VISUAL DO PRODUTO (Estilo Vitrine Electro com Badge de Desconto) */}
      {/* ===================================================================== */}
      <div className="relative w-full aspect-square bg-[#0b0f19] rounded-xl border border-zinc-800/80 p-3 sm:p-4 mb-3 flex items-center justify-center overflow-hidden group/img">
        {discountPercent !== null && discountPercent > 0 && (
          <span className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded bg-rose-600/90 text-white text-[10px] font-black tracking-tight border border-rose-500/40 shadow-sm backdrop-blur-sm">
            -{discountPercent}%
          </span>
        )}

        {deal.gemini_analysis?.score && (
          <span className="absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 text-[10px] font-extrabold border border-purple-500/30 flex items-center gap-1 shadow-sm backdrop-blur-sm">
            <Sparkles className="w-2.5 h-2.5 text-purple-400" />
            {deal.gemini_analysis.score} pts
          </span>
        )}

        <img
          src={
            deal.image_url ||
            deal.source_image_url ||
            getProductFallbackImage(itemTitle, deal.store)
          }
          alt={itemTitle}
          className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-300 ease-out"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = getProductFallbackImage(itemTitle, deal.store);
          }}
        />
      </div>

      {/* ===================================================================== */}
      {/* TIPOGRAFIA & PREÇO (Ritmo Visual e Hierarquia Inspirados no Electro)  */}
      {/* ===================================================================== */}
      <div className="flex-1 flex flex-col justify-between space-y-2">
        <div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-0.5 truncate">
            {deal.store ? `${deal.store} Brasil` : 'Produto Monitorado'}
          </div>

          <h4
            className="text-xs sm:text-sm font-semibold text-zinc-100 group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug min-h-[2.5rem]"
            title={itemTitle}
          >
            {itemTitle}
          </h4>
        </div>

        {/* Bloco de Preço */}
        <div className="pt-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-lg sm:text-xl font-black text-cyan-400 tracking-tight">
              R$ {itemPrice.toFixed(2)}
            </span>
            {originalPrice && originalPrice > itemPrice && (
              <span className="text-xs text-zinc-500 line-through font-medium">
                R$ {originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* =================================================================== */}
        {/* PAINEL DE BENCHMARKING MERCADO LIVRE (Alta Densidade)               */}
        {/* =================================================================== */}
        <div className="p-2.5 rounded-xl bg-[#090d16] border border-zinc-800/80 space-y-1.5 text-xs">
          {isEvaluated ? (
            <>
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-zinc-400">Preço Vencedor ML:</span>
                <span className="font-black text-emerald-400">
                  R$ {Number(deal.ml_price || 0).toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800/60 text-[11px]">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 block font-semibold">
                    Lucro Líquido
                  </span>
                  <span className="font-bold text-zinc-100">
                    R$ {Number(deal.net_profit || 0).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 block font-semibold">
                    ROI Estimado
                  </span>
                  <span className="font-extrabold text-indigo-400">
                    {Number(deal.roi_percent || 0).toFixed(1)}%
                  </span>
                </div>
              </div>

              {deal.ml_seller_name && (
                <div className="pt-1 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-400">
                  <span>Vendedor ML:</span>
                  <span
                    className="font-bold text-zinc-200 uppercase truncate max-w-[120px]"
                    title={deal.ml_seller_name}
                  >
                    {deal.ml_seller_name}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="py-1.5 text-center space-y-0.5">
              <span className="text-[11px] text-amber-400 font-bold flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Aguardando Avaliação ML
              </span>
              <span className="text-[10px] text-zinc-500 block">
                Clique para comparar com líderes do ML
              </span>
            </div>
          )}

          {deal.gemini_analysis?.justification && (
            <div className="pt-1.5 border-t border-zinc-800/60 text-[10px] text-violet-300/90 line-clamp-1">
              ✨ {deal.gemini_analysis.justification}
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* RODAPÉ DO CARD (Ações Alinhadas e Padronizadas)                       */}
      {/* ===================================================================== */}
      <div
        className="flex items-center gap-1.5 pt-3 mt-1 border-t border-zinc-800/60"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onEvaluate(deal)}
          className="flex-1 py-2 px-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
          title="Avaliar concorrência e líderes no Mercado Livre"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="truncate">Avaliar ML</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenCalculator(deal)}
          className="py-2 px-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
          title="Simular na calculadora de margens"
        >
          <Calculator className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Calcular</span>
        </button>

        {deal.product_url && (
          <a
            href={tagAmazonUrl(deal.product_url)}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white border border-white/10 text-[11px] font-bold flex items-center justify-center transition-colors flex-shrink-0"
            title="Abrir página do produto na loja de origem"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}

        {hasValidMlUrl && (
          <a
            href={canonicalMlUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center justify-center transition-colors flex-shrink-0"
            title="Abrir anúncio vencedor no Mercado Livre"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
