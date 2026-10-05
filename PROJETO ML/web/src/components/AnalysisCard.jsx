import React from 'react';
import { 
  TrendingUp, 
  ExternalLink, 
  Sparkles, 
  Clock, 
  ShoppingBag, 
  Award, 
  Calculator,
  Zap,
  Truck
} from 'lucide-react';
import { getProductFallbackImage } from '../utils/imageFallback';

export default function AnalysisCard({ analysis, onSelect, onOpenCalculator }) {
  const gemini = analysis.gemini_analysis;

  const isViable = analysis.verdict === 'Viável';
  const isAttention = analysis.verdict === 'Atenção';

  const verdictBg = isViable 
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    : isAttention
    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    : 'bg-rose-500/10 text-rose-400 border-rose-500/30';

  const roiColor = (analysis.roi_percent || 0) >= 25 
    ? 'text-emerald-400' 
    : (analysis.roi_percent || 0) > 0 
    ? 'text-amber-400' 
    : 'text-rose-400';

  return (
    <div 
      onClick={() => onSelect(analysis)}
      className="group relative bg-[#12151f] border border-slate-800/90 hover:border-slate-700 hover:shadow-xl hover:shadow-cyan-500/5 rounded-2xl p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {analysis.store_name || 'Loja Online'}
            </span>
            <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-slate-800 text-slate-400">
              {analysis.source_type === 'telegram' ? '📱 Telegram' : analysis.source_type === 'manual' ? '🔍 Manual' : '⚡ Webhook'}
            </span>
            {gemini?.score !== undefined && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
                <Sparkles className="w-3 h-3 text-purple-400" />
                Score {gemini.score}
              </span>
            )}
          </div>

          <span className={`px-3 py-1 text-xs font-bold rounded-full border ${verdictBg}`}>
            {analysis.verdict}
          </span>
        </div>

        {/* Product Comparison Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-800/80">
          {/* Source product */}
          <div className="flex gap-3">
            <div className="w-16 h-16 rounded-xl bg-white p-1 flex-shrink-0 overflow-hidden border border-slate-700/50 flex items-center justify-center">
              <img 
                src={analysis.source_image_url || getProductFallbackImage(analysis.source_title, analysis.store_name)} 
                alt={analysis.source_title} 
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = getProductFallbackImage(analysis.source_title, analysis.store_name);
                }}
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">Compra (Origem)</span>
              <h4 className="text-sm font-semibold text-slate-200 line-clamp-2 leading-snug">
                {analysis.source_title}
              </h4>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-base font-extrabold text-white">
                  R$ {Number(analysis.source_price || 0).toFixed(2)}
                </span>
                {analysis.source_original_price > analysis.source_price && (
                  <span className="text-xs text-slate-500 line-through">
                    R$ {Number(analysis.source_original_price).toFixed(2)}
                  </span>
                )}
                {analysis.source_discount_percent > 0 && (
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    -{analysis.source_discount_percent}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ML product match */}
          <div className="flex gap-3">
            <div className="w-16 h-16 rounded-xl bg-white p-1 flex-shrink-0 overflow-hidden border border-slate-700/50 flex items-center justify-center">
              <img 
                src={analysis.ml_image_url || getProductFallbackImage(analysis.ml_title, analysis.store_name)} 
                alt={analysis.ml_title} 
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = getProductFallbackImage(analysis.ml_title, analysis.store_name);
                }}
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-cyan-400">Venda no ML</span>
                {analysis.ml_is_full === 1 && (
                  <span className="flex items-center text-[10px] font-extrabold text-amber-300 bg-amber-500/20 px-1 rounded">
                    <Zap className="w-2.5 h-2.5 mr-0.5 fill-amber-300" /> FULL
                  </span>
                )}
                {analysis.ml_is_flex === 1 && (
                  <span className="flex items-center text-[10px] font-extrabold text-cyan-300 bg-cyan-500/20 px-1 rounded">
                    <Zap className="w-2.5 h-2.5 mr-0.5 fill-cyan-300" /> FLEX
                  </span>
                )}
                {analysis.ml_free_shipping === 1 && (
                  <span className="flex items-center text-[10px] font-medium text-emerald-300 bg-emerald-500/10 px-1 rounded">
                    <Truck className="w-2.5 h-2.5 mr-0.5" /> Grátis
                  </span>
                )}
              </div>
              <h4 className="text-sm font-semibold text-cyan-200 line-clamp-2 leading-snug">
                {analysis.ml_title || 'Anúncio correspondente'}
              </h4>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-base font-extrabold text-cyan-300">
                  R$ {Number(analysis.ml_price || 0).toFixed(2)}
                </span>
                <span className="text-xs text-slate-400">
                  {analysis.ml_listing_type === 'gold_pro' ? 'Premium (17%)' : 'Clássico (12%)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Market Data Strip */}
        <div className="grid grid-cols-3 gap-2 py-3 text-xs text-slate-400 border-b border-slate-800/80">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Vendas Totais</span>
            <span className="font-medium text-slate-200">
              {analysis.ml_sold_quantity_text || `${analysis.ml_sold_quantity || 0} un`}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Tempo no Ar</span>
            <span className="font-medium text-slate-200 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {analysis.ml_days_active || 1} dias
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Vendedor ML</span>
            <span className="font-medium text-slate-200 truncate block">
              {analysis.ml_seller_name || 'Vendedor'} ({analysis.ml_seller_positive_rate || 98}%)
            </span>
          </div>
        </div>
      </div>

      {/* Financial Summary & Actions */}
      <div className="mt-4 pt-2 flex items-center justify-between">
        <div>
          <span className="text-[11px] text-slate-400 block">Lucro Líquido Estimado</span>
          <div className="flex items-baseline gap-2">
            <span className={`text-xl font-black ${analysis.net_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              R$ {Number(analysis.net_profit || 0).toFixed(2)}
            </span>
            <span className={`text-xs font-bold ${roiColor}`}>
              ROI {Number(analysis.roi_percent || 0).toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400">
              (Margem {Number(analysis.margin_percent || 0).toFixed(1)}%)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenCalculator(analysis);
            }}
            title="Abrir na Calculadora de Margem"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
          >
            <Calculator className="w-4 h-4 text-emerald-400" />
          </button>
          <a
            href={analysis.ml_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Abrir Anúncio no Mercado Livre"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
          >
            <ExternalLink className="w-4 h-4 text-cyan-400" />
          </a>
        </div>
      </div>
    </div>
  );
}
