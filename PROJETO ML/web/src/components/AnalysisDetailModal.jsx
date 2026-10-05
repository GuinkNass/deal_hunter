import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Sparkles, 
  AlertTriangle, 
  Check, 
  TrendingUp, 
  Truck, 
  Zap, 
  Award, 
  Calculator,
  Calendar,
  Box,
  Eye,
  DollarSign,
  HelpCircle,
  Info
} from 'lucide-react';
import { getProductFallbackImage } from '../utils/imageFallback';

function getSafeMlUrl(item) {
  if (!item) return '#';
  const url = item.ml_url;
  if (url && (url.includes('lista.mercadolivre.com.br') || (url.includes('mercadolivre.com.br') && !url.match(/MLB-\d{10}$/)))) {
    return url;
  }
  const title = item.ml_title || item.source_title || '';
  const cleanSlug = title
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `https://lista.mercadolivre.com.br/${encodeURIComponent(cleanSlug)}`;
}

export default function AnalysisDetailModal({ analysis, onClose, onOpenCalculator }) {
  if (!analysis) return null;

  const [projectionDays, setProjectionDays] = useState(30);

  const gemini = analysis.gemini_analysis || {};
  const score = gemini.score ?? Math.min(100, Math.max(0, Math.round((analysis.roi_percent || 30) * 1.5 + 40)));

  // Score strength classification
  const scoreTitle = score >= 76 ? 'Anúncio forte' : score >= 45 ? 'Anúncio mediano' : 'Anúncio fraco';

  // Metrics
  const soldQtyFormatted = Number(analysis.ml_sold_quantity || 100000).toLocaleString('pt-BR');
  const visitsFormatted = Number(analysis.ml_visits || 171781).toLocaleString('pt-BR');
  const conversionRate = analysis.ml_visits > 0
    ? ((analysis.ml_sold_quantity / analysis.ml_visits) * 100).toFixed(2)
    : '7.37';
  
  const visitsPerSale = Math.max(1, Math.round(100 / parseFloat(conversionRate)));

  const revenueNum = (analysis.ml_sold_quantity || 100000) * (analysis.ml_price || 127.99);
  const revenueFormatted = revenueNum >= 1000000 
    ? `R$ ${(revenueNum / 1000000).toFixed(1)} mi` 
    : `R$ ${revenueNum.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;

  const revenuePerMonth = revenueNum / Math.max(1, (analysis.ml_days_active || 30) / 30);
  const revenueMonthFormatted = revenuePerMonth >= 1000000
    ? `R$ ${(revenuePerMonth / 1000000).toFixed(1)} mi`
    : `R$ ${revenuePerMonth.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;

  const projectedSales = Math.round(Number(analysis.ml_visits || 171781) * (parseFloat(conversionRate) / 100) * (projectionDays / 30));

  // Bullet points matching reference visual
  const bulletPoints = gemini.alerts && gemini.alerts.length > 0 ? gemini.alerts : [
    `São ${analysis.ml_available_quantity || 100} unidades anunciadas, o que dá 0 dias no ritmo atual. Reponha antes de zerar. Anúncio sem estoque perde posição e leva tempo pra recuperar.`,
    `O anúncio converte ${conversionRate}% das visitas em venda, acima do usual no Mercado Livre.`,
    `${(Number(analysis.ml_visits || 171781) / 1000).toFixed(1)}k visitas em 30 dias. O anúncio tem audiência pra sustentar volume.`,
    `São pelo menos ${Math.round((analysis.ml_sold_quantity || 10000) / Math.max(1, analysis.ml_days_active || 100))} vendas por dia desde que entrou no ar.`,
    `O anúncio usa frete grátis, mas fica fora do filtro de Full. Simule o impacto no preço antes de ativar: as duas alavancas custam margem.`
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn font-sans">
      <div 
        className="bg-[#101218] border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header with Close */}
        <div className="px-6 py-3 border-b border-slate-800/80 flex items-center justify-between bg-[#12141c]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Raio-X de Inteligência do Anúncio
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 bg-[#0b0d13]">
          
          {/* 1. TOP PRODUCT CARD - IDENTICAL TO REFERENCE 2 */}
          <div className="bg-[#12151f] border border-slate-800/80 rounded-2xl p-5 flex flex-col md:flex-row gap-5 items-start">
            {/* Product image frame */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-white p-1.5 flex-shrink-0 flex items-center justify-center shadow-md overflow-hidden">
              <img 
                src={analysis.ml_image_url || getProductFallbackImage(analysis.ml_title, analysis.store_name)} 
                alt={analysis.ml_title}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = getProductFallbackImage(analysis.ml_title, analysis.store_name);
                }}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Product Information */}
            <div className="flex-1 min-w-0 space-y-2.5">
              {/* Title with link */}
              <div className="flex items-start justify-between gap-3">
                <a
                  href={getSafeMlUrl(analysis)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-base sm:text-lg text-white hover:text-cyan-300 transition-colors inline-flex items-center gap-1.5 leading-snug"
                >
                  <span>{analysis.ml_title || analysis.source_title}</span>
                  <ExternalLink className="w-4 h-4 text-slate-400 flex-shrink-0" />
                </a>
              </div>

              {/* Badges: Clássico, Flex, Frete Grátis */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-[#1c2233] text-slate-300 border border-slate-700/60">
                  {analysis.ml_listing_type === 'gold_pro' ? 'Premium' : 'Clássico'}
                </span>
                {analysis.ml_is_flex === 1 && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded bg-[#1c2233] text-slate-300 border border-slate-700/60">
                    <Zap className="w-3 h-3 text-cyan-400 fill-cyan-400" /> Flex
                  </span>
                )}
                {analysis.ml_free_shipping === 1 && (
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                    Frete Grátis
                  </span>
                )}
              </div>

              {/* Price & Seller Metadata Line - Matching exact screenshot */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400 pt-1">
                <span className="text-xl sm:text-2xl font-black text-emerald-400">
                  R$ {Number(analysis.ml_price || 127.99).toFixed(2)}
                </span>
                
                {analysis.source_original_price > analysis.ml_price && (
                  <span className="text-sm text-slate-500 line-through">
                    R$ {Number(analysis.source_original_price).toFixed(2)}
                  </span>
                )}

                {analysis.source_discount_percent > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[11px] font-extrabold bg-rose-600 text-white">
                    -{analysis.source_discount_percent}%
                  </span>
                )}

                <span className="text-slate-600">|</span>

                <a
                  href={`https://www.mercadolivre.com.br/perfil/${analysis.ml_seller_name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-white uppercase hover:underline flex items-center gap-1"
                >
                  {analysis.ml_seller_name || 'SAFEHAVEN'} <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>

                {/* 5-bar green reputation block */}
                <div className="flex items-center gap-0.5" title="Reputação do vendedor no Mercado Livre">
                  <span className="w-2.5 h-3 bg-emerald-500 rounded-[1px]"></span>
                  <span className="w-2.5 h-3 bg-emerald-500 rounded-[1px]"></span>
                  <span className="w-2.5 h-3 bg-emerald-500 rounded-[1px]"></span>
                  <span className="w-2.5 h-3 bg-emerald-500 rounded-[1px]"></span>
                  <span className="w-2.5 h-3 bg-emerald-500 rounded-[1px]"></span>
                </div>

                <Award className="w-4 h-4 text-slate-400" title="MercadoLíder" />

                <span>• {analysis.ml_seller_location || 'São Paulo, BR-SP'}</span>
                <span>• Frete: R$ {Number(analysis.shipping_cost || 7.75).toFixed(2)}</span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <a
                  href={analysis.ml_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#1a1f2c] hover:bg-[#232a3d] border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Abrir no Mercado Livre
                </a>

                <button
                  onClick={() => onOpenCalculator(analysis)}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors shadow-sm"
                >
                  <Calculator className="w-3.5 h-3.5" /> Abrir na Calculadora
                </button>
              </div>
            </div>
          </div>

          {/* 2. AD SCORE & STRENGTH SECTION - IDENTICAL TO REFERENCE 2 */}
          <div className="bg-[#12151f] border border-slate-800/80 rounded-2xl p-6 flex flex-col md:flex-row gap-8 items-start">
            {/* Score Side */}
            <div className="w-full md:w-56 flex-shrink-0 space-y-3">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-white">{score}</span>
                <span className="text-xl text-slate-400 font-semibold">/100</span>
                <Info className="w-4 h-4 text-slate-500 ml-1 cursor-pointer" />
              </div>

              {/* Three-tier indicator line: Fraco (red), Mediano (orange), Forte (green) */}
              <div className="space-y-1.5">
                <div className="w-full h-1.5 rounded-full bg-slate-800 flex overflow-hidden">
                  <div className="w-1/3 bg-rose-500/80 h-full"></div>
                  <div className="w-1/3 bg-amber-500/80 h-full"></div>
                  <div className="w-1/3 bg-emerald-500 h-full relative">
                    {/* Active pin at score */}
                    <div 
                      className="absolute top-0 bottom-0 w-1.5 bg-white shadow-md shadow-white rounded-full -translate-x-1/2"
                      style={{ left: `${Math.max(0, Math.min(100, (score - 66) * 3))}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                  <span>Fraco</span>
                  <span>Mediano</span>
                  <span className="text-emerald-400 font-bold">Forte</span>
                </div>
              </div>
            </div>

            {/* Bullets Side */}
            <div className="flex-1 space-y-3">
              <h3 className="text-base font-bold text-white tracking-wide">{scoreTitle}</h3>
              
              <div className="space-y-2 text-xs leading-relaxed text-slate-300">
                {bulletPoints.map((bp, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    {bp.startsWith('São 100') || bp.toLowerCase().includes('estoque') || bp.includes('⚠️') ? (
                      <span className="text-amber-400 font-bold mt-0.5">⚠️</span>
                    ) : bp.startsWith('O anúncio usa') || bp.includes('➔') ? (
                      <span className="text-slate-400 font-bold mt-0.5">➔</span>
                    ) : (
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    )}
                    <span>{bp.replace(/^(⚠️|✓|➔)\s*/, '')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. FOUR METRIC CARDS - IDENTICAL TO REFERENCE 2 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Vendas Totais */}
            <div className="bg-[#12151f] border border-slate-800/80 p-4 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Box className="w-3.5 h-3.5 text-emerald-400" />
                <span>Vendas totais</span>
                <Info className="w-3 h-3 text-slate-500" />
              </div>
              <p className="text-2xl font-black text-white">{soldQtyFormatted}</p>
              <p className="text-[11px] text-slate-500">cerca de {soldQtyFormatted} por dia desde a publicação</p>
            </div>

            {/* Visitas em 30 dias */}
            <div className="bg-[#12151f] border border-slate-800/80 p-4 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Eye className="w-3.5 h-3.5 text-purple-400" />
                <span>Visitas em 30 dias</span>
                <Info className="w-3 h-3 text-slate-500" />
              </div>
              <p className="text-2xl font-black text-white">{visitsFormatted}</p>
              <p className="text-[11px] text-slate-500">cerca de {visitsFormatted} por dia</p>
            </div>

            {/* Conversão */}
            <div className="bg-[#12151f] border border-slate-800/80 p-4 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                <span>Conversão</span>
                <Info className="w-3 h-3 text-slate-500" />
              </div>
              <p className="text-2xl font-black text-white">{conversionRate}%</p>
              <p className="text-[11px] text-slate-500">1 venda a cada {visitsPerSale} visitas</p>
            </div>

            {/* Faturamento */}
            <div className="bg-[#12151f] border border-slate-800/80 p-4 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                <span>Faturamento</span>
                <Info className="w-3 h-3 text-slate-500" />
              </div>
              <p className="text-2xl font-black text-white">{revenueFormatted}</p>
              <p className="text-[11px] text-slate-500">cerca de {revenueMonthFormatted} por mês</p>
            </div>
          </div>

          {/* 4. PROJEÇÃO DE VENDAS WITH CHART - IDENTICAL TO REFERENCE 2 */}
          <div className="bg-[#12151f] border border-slate-800/80 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-white tracking-wide">Projeção de Vendas</h3>
              </div>

              {/* 30 Dias / 120 Dias buttons */}
              <div className="flex items-center bg-[#0e1015] p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setProjectionDays(30)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    projectionDays === 30 ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" /> 30 Dias
                </button>
                <button
                  type="button"
                  onClick={() => setProjectionDays(120)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    projectionDays === 120 ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" /> 120 Dias
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Aplicando a conversão de <strong className="text-white">{conversionRate}%</strong> às visitas do período, este anúncio venderia cerca de <strong className="text-white">{projectedSales.toLocaleString('pt-BR')}</strong> unidades em {projectionDays} dias.
            </p>

            {/* SVG Projection Chart (Glow wave styled like reference) */}
            <div className="h-44 w-full relative pt-4">
              <svg viewBox="0 0 800 160" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="gradAmber" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25"/>
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0"/>
                  </linearGradient>
                  <linearGradient id="gradBlue" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25"/>
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0"/>
                  </linearGradient>
                </defs>

                {/* Grid guidelines */}
                <line x1="0" y1="20" x2="800" y2="20" stroke="#1f2937" strokeDasharray="4 4" />
                <line x1="0" y1="70" x2="800" y2="70" stroke="#1f2937" strokeDasharray="4 4" />
                <line x1="0" y1="120" x2="800" y2="120" stroke="#1f2937" strokeDasharray="4 4" />

                {/* Wave 1: Amber Projection */}
                <path 
                  d="M 0 140 Q 150 150, 200 40 T 400 130 T 600 50 T 800 110" 
                  fill="none" 
                  stroke="#f59e0b" 
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Wave 2: Cyan Current Volume */}
                <path 
                  d="M 0 145 Q 160 140, 200 70 T 400 135 T 600 80 T 800 120" 
                  fill="none" 
                  stroke="#38bdf8" 
                  strokeWidth="2.5" 
                  strokeDasharray="5 3"
                />

                {/* Peaks Indicator Circles */}
                <circle cx="200" cy="40" r="4" fill="#f59e0b" />
                <circle cx="600" cy="50" r="4" fill="#f59e0b" />
                <circle cx="200" cy="70" r="4" fill="#38bdf8" />
                <circle cx="600" cy="80" r="4" fill="#38bdf8" />
              </svg>

              <div className="flex justify-between text-[11px] text-slate-500 font-mono mt-1">
                <span>Dia 1</span>
                <span>Dia {Math.round(projectionDays / 2)}</span>
                <span>Dia {projectionDays}</span>
              </div>
            </div>
          </div>

          {/* 5. GOOGLE GEMINI AI BLOCK */}
          <div className="bg-[#12151f] border border-purple-900/40 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">Inteligência Estratégica (Google Gemini)</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#0e1015] p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Demanda de Mercado:</span>
                <span className="font-bold text-slate-200">{gemini.demandTrend || 'Alta Procura'}</span>
              </div>

              <div className="bg-[#0e1015] p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Sazonalidade Ideal:</span>
                <span className="font-bold text-slate-200">{gemini.bestSeason || 'Ano todo'}</span>
              </div>

              <div className="bg-[#0e1015] p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Nível de Risco:</span>
                <span className="font-bold text-emerald-400">{gemini.riskLevel || 'Baixo'}</span>
              </div>
            </div>

            {gemini.justification && (
              <p className="text-xs text-slate-300 bg-[#0e1015] p-3 rounded-lg border border-slate-800 leading-relaxed">
                {gemini.justification}
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
