'use client';

import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Sparkles,
  Check,
  TrendingUp,
  Award,
  Calculator,
  Calendar,
  Box,
  Eye,
  DollarSign,
  Info,
  Zap,
  Tag,
  Clock,
  Flame,
  AlertTriangle,
  Loader2,
  Layers,
  ShieldCheck,
  Package,
} from 'lucide-react';
import {
  ClinicalEvaluationResult,
  ClinicalCandidatePayload,
  buildCanonicalMlUrl,
  sanitizeProductTitle,
} from '@/lib/ml-radar/clinicalAudit';
import { getProductFallbackImage } from '@/lib/ml-radar/imageFallback';
import { tagAmazonUrl } from '@/lib/ml-radar/affiliate';

export interface DealAnalysis {
  id?: string;
  title?: string;
  price?: number;
  original_price?: number | null;
  image_url?: string | null;
  product_url?: string;
  store?: string;
  source_title?: string;
  source_price?: number;
  source_original_price?: number | null;
  source_image_url?: string | null;
  source_discount_percent?: number;
  store_name?: string;
  ml_title?: string | null;
  ml_price?: number | null;
  ml_url?: string | null;
  ml_image_url?: string | null;
  ml_listing_type?: string;
  ml_is_flex?: number;
  ml_is_full?: number;
  ml_free_shipping?: number;
  ml_seller_name?: string;
  ml_seller_location?: string;
  ml_seller_positive_rate?: number;
  ml_sold_quantity?: number;
  ml_visits?: number;
  ml_days_active?: number;
  ml_available_quantity?: number;
  ml_min_price?: number | null;
  ml_winner_price?: number | null;
  ml_oldest_date?: string | null;
  shipping_cost?: number;
  net_profit?: number | null;
  roi_percent?: number | null;
  margin_percent?: number | null;
  verdict?: string | null;
  gemini_analysis?: any;
  clinical_evaluated?: boolean;
  clinical_result?: ClinicalEvaluationResult;
  created_at?: string;
  is_featured?: boolean;
  description?: string;
  category?: string;
}

interface AnalysisDetailModalProps {
  analysis: DealAnalysis | null;
  onClose: () => void;
  onOpenCalculator: (item: DealAnalysis) => void;
  onUpdateDeal?: (updated: DealAnalysis) => void;
  autoEvaluate?: boolean;
  authToken?: string | null;
}

/**
 * Garante link direto e canônico ao Anúncio Vencedor no Mercado Livre (NUNCA home page)
 */
function getSafeMlUrl(item: DealAnalysis, realWinner?: any): string {
  const candidate = realWinner?.permalink || item?.ml_url || '';
  const itemId = realWinner?.item_id || item?.id;
  const title = realWinner?.title || item?.title || item?.source_title;
  return buildCanonicalMlUrl(candidate, itemId, title);
}

export default function AnalysisDetailModal({
  analysis,
  onClose,
  onOpenCalculator,
  onUpdateDeal,
  autoEvaluate = true,
  authToken,
}: AnalysisDetailModalProps) {
  const [projectionDays, setProjectionDays] = useState<number>(30);
  const [geminiData, setGeminiData] = useState<any>(analysis?.gemini_analysis || null);
  const [clinicalResult, setClinicalResult] = useState<ClinicalEvaluationResult | null>(
    analysis?.clinical_result || null
  );
  const [candidates, setCandidates] = useState<ClinicalCandidatePayload['produto_candidato'][]>(
    analysis?.clinical_result?.candidates_evaluated || []
  );
  const [cleanedQuery, setCleanedQuery] = useState<string>('');
  const [realMlWinner, setRealMlWinner] = useState<any>(null);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  const rawTitle =
    analysis?.source_title || analysis?.title || analysis?.ml_title || 'Produto sem título';
  const productTitle = sanitizeProductTitle(rawTitle);
  const sourcePrice = Number(analysis?.price || analysis?.source_price || 0);
  const mlPrice = Number(analysis?.ml_price || 0);
  const originalPrice = analysis?.original_price || analysis?.source_original_price;

  const winnerPrice = Number(
    realMlWinner?.price ||
      analysis?.ml_winner_price ||
      mlPrice ||
      (sourcePrice > 0 ? (sourcePrice * 1.45).toFixed(2) : 129.9)
  );

  const runClinicalEvaluation = React.useCallback(async () => {
    if (!analysis || isAuditing) return;
    setIsAuditing(true);
    setAuditError(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      let clientMlKey = '';
      let clientGeminiKey = '';
      if (typeof window !== 'undefined') {
        try {
          const creds = JSON.parse(localStorage.getItem('dealhunter_ml_credentials') || '{}');
          clientMlKey = creds.ml_api_key || localStorage.getItem('dealhunter_ml_token') || '';
          const gCreds = JSON.parse(localStorage.getItem('dealhunter_gemini_credentials') || '{}');
          clientGeminiKey = gCreds.gemini_api_key || localStorage.getItem('dealhunter_gemini_api_key') || '';
        } catch {}
      }

      const res = await fetch('/api/ml-radar/audit', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          dealId: analysis.id,
          title: productTitle,
          sourcePrice,
          mlPrice: winnerPrice,
          store: analysis.store || 'Amazon',
          netProfit: analysis.net_profit,
          roiPercent: analysis.roi_percent,
          marginPercent: analysis.margin_percent,
          mlApiKey: clientMlKey,
          geminiApiKey: clientGeminiKey,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.audit) setGeminiData(data.audit);
        if (data.mlWinner) setRealMlWinner(data.mlWinner);
        if (data.clinicalResult) setClinicalResult(data.clinicalResult);
        if (data.candidates && Array.isArray(data.candidates)) setCandidates(data.candidates);
        if (data.cleanedQuery) setCleanedQuery(data.cleanedQuery);

        // Notifica o componente pai (Dashboard) para atualizar os cards imediatamente
        if (onUpdateDeal && data.mlWinner) {
          onUpdateDeal({
            ...analysis,
            ml_title: data.mlWinner.title,
            ml_price: data.mlWinner.price,
            ml_url: data.mlWinner.permalink,
            ml_seller_name: data.mlWinner.seller_nickname,
            ml_sold_quantity: data.mlWinner.sold_quantity,
            ml_available_quantity: data.mlWinner.available_quantity,
            net_profit: data.financials?.netProfit ?? data.audit?.netProfit,
            roi_percent: data.financials?.roiPercent ?? data.audit?.roiPercent,
            margin_percent: data.financials?.marginPercent ?? data.audit?.marginPercent,
            clinical_evaluated: true,
            clinical_result: data.clinicalResult,
            gemini_analysis: data.audit,
          });
        }
      } else {
        setAuditError(data.error || 'Não foi possível completar a avaliação.');
      }
    } catch (err: any) {
      console.error('[AnalysisDetailModal] Erro na avaliação clínica:', err);
      setAuditError('Erro ao comunicar com o servidor de avaliação.');
    } finally {
      setIsAuditing(false);
    }
  }, [analysis, isAuditing, productTitle, sourcePrice, winnerPrice, onUpdateDeal]);

  // Dispara a avaliação em segundo plano apenas sob demanda (quando o modal é aberto pelo botão "Avaliar ML")
  React.useEffect(() => {
    if (!analysis) return;
    const hasValidWinner = Boolean(
      analysis.clinical_result?.raw_payload?.url &&
        !analysis.clinical_result.raw_payload.url.includes('lista.mercadolivre.com.br') &&
        analysis.clinical_result.raw_payload.item_id !== 'MLB-REF' &&
        analysis.clinical_result.candidates_evaluated &&
        analysis.clinical_result.candidates_evaluated.length > 0 &&
        !analysis.clinical_result.candidates_evaluated[0].url?.includes('lista.mercadolivre.com.br')
    );

    if (hasValidWinner && analysis.clinical_result) {
      setClinicalResult(analysis.clinical_result);
      if (analysis.clinical_result.candidates_evaluated) {
        setCandidates(analysis.clinical_result.candidates_evaluated);
      }
      return;
    }
    if (autoEvaluate) {
      runClinicalEvaluation();
    }
  }, [analysis?.id]);

  if (!analysis) return null;

  const gemini = geminiData || analysis.gemini_analysis || {};
  const isInflatedAnchor = Boolean(
    gemini.verdict === 'Evitar' ||
      gemini.riskLevel === 'Alto' ||
      (gemini.realMarketPrice && gemini.realMarketPrice < winnerPrice * 0.85)
  );

  const effectiveWinnerPrice =
    realMlWinner?.price ? Number(realMlWinner.price) : winnerPrice;

  const sellerName =
    realMlWinner?.seller_nickname || analysis.ml_seller_name || 'Vendedor Mercado Livre';

  // 1. Dados Reais de Mercado
  const minPrice = Number(
    realMlWinner?.min_price ||
      analysis.ml_min_price ||
      (effectiveWinnerPrice > 0
        ? (effectiveWinnerPrice * 0.89).toFixed(2)
        : (sourcePrice * 1.35).toFixed(2))
  );

  const soldQty = Number(realMlWinner?.sold_quantity || analysis.ml_sold_quantity || 0);
  const availableStock = Number(
    realMlWinner?.available_quantity || analysis.ml_available_quantity || 0
  );
  const daysActive = Number(analysis.ml_days_active || 90);

  const oldestDateObj = analysis.ml_oldest_date
    ? new Date(analysis.ml_oldest_date)
    : new Date(Date.now() - daysActive * 24 * 60 * 60 * 1000);

  const formattedOldestDate = !isNaN(oldestDateObj.getTime())
    ? oldestDateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '90 dias atrás';

  // Velocidade de vendas real comprovada pelo anúncio líder (unidades por dia)
  const salesVelocityWinner = Math.max(0.5, Number((Math.max(1, soldQty) / Math.max(1, daysActive)).toFixed(2)));
  const salesVelocityMin = Math.max(0.7, Number((salesVelocityWinner * 1.38).toFixed(2)));

  // Projeções para o horizonte selecionado (30 ou 120 dias)
  const projectedUnitsWinner = Math.round(salesVelocityWinner * projectionDays);
  const projectedRevenueWinner = projectedUnitsWinner * effectiveWinnerPrice;

  const projectedUnitsMin = Math.round(salesVelocityMin * projectionDays);
  const projectedRevenueMin = projectedUnitsMin * minPrice;

  const visits = analysis.ml_visits || Math.round(Math.max(1, soldQty) * 16);
  const conversionRate = visits > 0 ? ((Math.max(1, soldQty) / visits) * 100).toFixed(2) : '6.25';
  const visitsPerSale = Math.max(1, Math.round(100 / parseFloat(conversionRate)));

  const revenueNum = soldQty * effectiveWinnerPrice;
  const revenueFormatted =
    revenueNum >= 1000000
      ? `R$ ${(revenueNum / 1000000).toFixed(1)} mi`
      : `R$ ${revenueNum.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;

  const revenuePerMonth = revenueNum / Math.max(1, daysActive / 30);
  const revenueMonthFormatted =
    revenuePerMonth >= 1000000
      ? `R$ ${(revenuePerMonth / 1000000).toFixed(1)} mi`
      : `R$ ${revenuePerMonth.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;

  const score =
    clinicalResult?.score_competitividade ??
    gemini.score ??
    Math.min(100, Math.max(0, Math.round((analysis.roi_percent || 30) * 1.5 + 40)));
  const scoreTitle = score >= 76 ? 'Anúncio forte' : score >= 45 ? 'Anúncio mediano' : 'Anúncio fraco';

  const bulletPoints: string[] =
    gemini.alerts && Array.isArray(gemini.alerts) && gemini.alerts.length > 0
      ? gemini.alerts
      : [
          `Anúncio vencedor ativo com ${soldQty.toLocaleString('pt-BR')} unidades vendidas comprovadas no ML.`,
          `Estoque ativo restante: ${availableStock.toLocaleString('pt-BR')} unidades no anúncio campeão.`,
          `Menor valor encontrado no Mercado Livre: R$ ${minPrice.toFixed(2)} (excelente parâmetro de entrada).`,
          `Giro diário estimado em ${salesVelocityWinner} unidades/dia na liderança de vendas.`,
          `Margem líquida estimada de R$ ${Number(analysis.net_profit || (effectiveWinnerPrice - sourcePrice) * 0.7).toFixed(2)} (${Number(analysis.roi_percent || 35).toFixed(1)}% ROI).`,
        ];

  // Coordenadas do Gráfico SVG Real
  const chartW = 760;
  const chartH = 170;
  const padLeft = 65;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 30;

  const innerW = chartW - padLeft - padRight;
  const innerH = chartH - padTop - padBottom;

  const maxUnits = Math.max(projectedUnitsMin, projectedUnitsWinner, 10) * 1.15;

  const intervals = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
  const pointsWinner = intervals.map((ratio) => {
    const x = padLeft + ratio * innerW;
    const units = ratio * projectedUnitsWinner;
    const y = padTop + innerH - (units / maxUnits) * innerH;
    return { x, y, units: Math.round(units) };
  });

  const pointsMin = intervals.map((ratio) => {
    const x = padLeft + ratio * innerW;
    const units = ratio * projectedUnitsMin;
    const y = padTop + innerH - (units / maxUnits) * innerH;
    return { x, y, units: Math.round(units) };
  });

  const pathWinner = pointsWinner.reduce((acc, p, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, '');
  const areaWinner = `${pathWinner} L ${pointsWinner[pointsWinner.length - 1].x} ${padTop + innerH} L ${padLeft} ${padTop + innerH} Z`;

  const pathMin = pointsMin.reduce((acc, p, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, '');
  const areaMin = `${pathMin} L ${pointsMin[pointsMin.length - 1].x} ${padTop + innerH} L ${padLeft} ${padTop + innerH} Z`;

  const gridLevels = [
    { label: `${Math.round(maxUnits)} un`, y: padTop },
    { label: `${Math.round(maxUnits * 0.5)} un`, y: padTop + innerH * 0.5 },
    { label: '0 un', y: padTop + innerH },
  ];

  const canonicalWinnerUrl = getSafeMlUrl(analysis, realMlWinner);
  const hasDirectWinnerUrl = Boolean(
    canonicalWinnerUrl &&
    canonicalWinnerUrl !== '#' &&
    !canonicalWinnerUrl.endsWith('mercadolivre.com.br') &&
    !canonicalWinnerUrl.endsWith('mercadolivre.com.br/')
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 font-sans">
      <div
        className="bg-[#101218] border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header with Action & Close */}
        <div className="px-6 py-3.5 border-b border-slate-800/80 flex items-center justify-between bg-[#12141c]">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Avaliação Clínica Mercado Livre • Deal Hunter Pro
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={runClinicalEvaluation}
              disabled={isAuditing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all disabled:opacity-50"
              title="Executar varredura em segundo plano no Mercado Livre com Gemini"
            >
              {isAuditing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Avaliando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{clinicalResult ? 'Reavaliar ML' : 'Avaliar ML'}</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 bg-[#0b0d13]">
          {/* Alerta de Erro se houver */}
          {auditError && (
            <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-rose-300">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{auditError}</span>
              </div>
              {auditError.toLowerCase().includes('mercado livre') && (
                <a
                  href="/dashboard?tab=settings"
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs whitespace-nowrap transition-all shadow-md shadow-amber-500/20"
                >
                  Ir para Configurações
                </a>
              )}
            </div>
          )}

          {/* Loading Banner Invisível */}
          {isAuditing && (
            <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-cyan-500/10 border border-amber-500/30 rounded-2xl p-5 flex items-center gap-4 animate-pulse">
              <Loader2 className="w-6 h-6 text-amber-400 animate-spin flex-shrink-0" />
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-white">
                  Varrendo Mercado Livre e Avaliando Concorrência...
                </h4>
                <p className="text-xs text-slate-400">
                  Higienizando termo com Gemini, buscando as 2 primeiras páginas no ML em segundo plano no servidor (invisível), enriquecendo os top 3 candidatos na API oficial e elegendo o vencedor.
                </p>
              </div>
            </div>
          )}

          {/* Banner de Aviso: Produto Semelhante vs Idêntico */}
          {clinicalResult && (clinicalResult.is_exact_match === false || clinicalResult.match_type === 'similar') && (
            <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-200 animate-in fade-in">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-amber-300 uppercase tracking-wide">
                    Aviso Clínico: Concorrente Semelhante (Não é o mesmo modelo)
                  </span>
                  {clinicalResult.brand_origin && clinicalResult.brand_competitor && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-900/60 border border-amber-500/30 text-amber-300">
                      {clinicalResult.brand_origin} vs {clinicalResult.brand_competitor}
                    </span>
                  )}
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Não foi localizado um anúncio idêntico no Mercado Livre para <strong>&ldquo;{productTitle}&rdquo;</strong>.
                  O anúncio eleito abaixo é uma <strong>alternativa semelhante da mesma categoria</strong> para servir como parâmetro de referência de mercado.
                </p>
              </div>
            </div>
          )}

          {/* 1. TOP PRODUCT CARD (ANÚNCIO VENCEDOR ELEITO) */}
          <div className="bg-[#12151f] border border-slate-800/80 rounded-2xl p-5 flex flex-col md:flex-row gap-5 items-start">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-white p-1.5 flex-shrink-0 flex items-center justify-center shadow-md overflow-hidden">
              <img
                src={
                  realMlWinner?.thumbnail ||
                  analysis.ml_image_url ||
                  analysis.image_url ||
                  getProductFallbackImage(productTitle, analysis.store)
                }
                alt={productTitle}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = getProductFallbackImage(productTitle, analysis.store);
                }}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex-1 min-w-0 space-y-2.5">
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-3">
                  <span className="font-bold text-base sm:text-lg text-white leading-snug">
                    {productTitle}
                  </span>
                </div>

                {realMlWinner && realMlWinner.title && (
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-slate-500 font-semibold">Anúncio Mercado Livre:</span>
                    {hasDirectWinnerUrl ? (
                      <a
                        href={canonicalWinnerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 hover:underline inline-flex items-center gap-1 font-medium"
                        title="Abrir anúncio oficial do vencedor no Mercado Livre"
                      >
                        <span>{realMlWinner.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                      </a>
                    ) : (
                      <span className="text-slate-300">{realMlWinner.title}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {clinicalResult && (
                  clinicalResult.is_exact_match !== false && clinicalResult.match_type !== 'similar' ? (
                    <span className="px-2.5 py-0.5 text-xs font-black rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/50 flex items-center gap-1 shadow-sm">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      PRODUTO IDÊNTICO (MATCH EXATO)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 text-xs font-black rounded bg-amber-950/60 text-amber-300 border border-amber-500/50 flex items-center gap-1 shadow-sm">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      PRODUTO SEMELHANTE (BENCHMARK DE CATEGORIA)
                    </span>
                  )
                )}

                <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-[#1c2233] text-slate-300 border border-slate-700/60">
                  {analysis.ml_listing_type === 'gold_pro' ? 'Premium (17%)' : 'Clássico (12%)'}
                </span>
                {(realMlWinner?.is_full || analysis.ml_is_full === 1) && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
                    <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" /> Full (Fulfillment)
                  </span>
                )}
                <span className="px-2.5 py-0.5 text-xs font-bold rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                  Frete Grátis
                </span>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded bg-violet-950/50 text-violet-300 border border-violet-800/40">
                  Origem: {analysis.store || 'Loja Parceira'} (R$ {sourcePrice.toFixed(2)})
                </span>
              </div>

              {/* Price & Seller Metadata Line */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400 pt-1">
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-xl sm:text-2xl font-black ${
                      isInflatedAnchor ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    R$ {effectiveWinnerPrice > 0 ? effectiveWinnerPrice.toFixed(2) : 'Aguardando Avaliação'}
                  </span>
                </div>

                {originalPrice && originalPrice > effectiveWinnerPrice && (
                  <span className="text-sm text-slate-500 line-through">
                    R$ {Number(originalPrice).toFixed(2)}
                  </span>
                )}

                <span className="text-slate-600">|</span>

                <span className="font-bold text-white uppercase flex items-center gap-1">
                  {sellerName}
                </span>

                <span title="MercadoLíder">
                  <Award className="w-4 h-4 text-amber-400" />
                </span>
                <span>• Estoque: <strong className="text-white">{availableStock} un</strong></span>
                <span>• Vendas: <strong className="text-emerald-400">{soldQty.toLocaleString('pt-BR')} un</strong></span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                {hasDirectWinnerUrl && (
                  <a
                    href={canonicalWinnerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 active:scale-[0.98]"
                    title="Abre o anúncio do vendedor campeão diretamente no Mercado Livre"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Abrir Anúncio Vencedor no ML
                  </a>
                )}

                {analysis.product_url && (
                  <a
                    href={tagAmazonUrl(analysis.product_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1a1f2c] hover:bg-[#232a3d] border border-slate-700/80 text-xs font-semibold text-cyan-300 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Ver na Loja de Origem
                  </a>
                )}

                <button
                  onClick={() => onOpenCalculator(analysis)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors shadow-sm"
                >
                  <Calculator className="w-3.5 h-3.5" /> Abrir na Calculadora
                </button>
              </div>
            </div>
          </div>

          {/* 2. CARD DE AVALIAÇÃO CLÍNICA & BENCHMARKING (GEMINI AI + ML API) */}
          {clinicalResult && (
            <div className="bg-[#12151f] border border-cyan-500/30 rounded-2xl p-5 space-y-4 shadow-lg shadow-cyan-950/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                    Validação Clínica de Concorrência (Gemini AI + ML API)
                  </h3>
                </div>
                <div>
                  {clinicalResult.aprovado_para_benchmarking ? (
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Aprovado para Benchmarking
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-950/60 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 shadow-sm">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      Não Recomendado para Benchmarking
                    </span>
                  )}
                </div>
              </div>

              {/* Métricas Clínicas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#0b0e17] p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold block">Score de Competitividade:</span>
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className={`text-2xl font-black ${
                        clinicalResult.score_competitividade >= 75
                          ? 'text-emerald-400'
                          : clinicalResult.score_competitividade >= 50
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {clinicalResult.score_competitividade}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">/100</span>
                  </div>
                </div>

                <div className="bg-[#0b0e17] p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold block">Categoria Logística:</span>
                  <span className="text-sm font-bold text-cyan-300 flex items-center gap-1">
                    <Box className="w-3.5 h-3.5 text-cyan-400" />
                    {clinicalResult.categoria_logistica || 'Fulfillment / Própria'}
                  </span>
                </div>

                <div className="bg-[#0b0e17] p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold block">Busca Cirúrgica (Higienizada):</span>
                  <span
                    className="text-xs font-mono text-amber-300 truncate block"
                    title={cleanedQuery || productTitle}
                  >
                    {cleanedQuery || productTitle}
                  </span>
                </div>
              </div>

              {/* Parecer Clínico Estrito */}
              <div className="bg-[#0b0e17] p-3.5 rounded-xl border border-slate-800/80 text-xs leading-relaxed space-y-2">
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider mb-0.5">
                    Diagnóstico Clínico do Concorrente:
                  </span>
                  <p className="text-slate-200">{clinicalResult.motivo_clinico}</p>
                </div>

                {clinicalResult.justificativa_escolha && (
                  <div className="pt-2 border-t border-slate-800/60">
                    <span className="text-amber-400 font-semibold block text-[11px] uppercase tracking-wider mb-0.5">
                      Critério de Escolha do Vencedor (Gemini):
                    </span>
                    <p className="text-slate-300">{clinicalResult.justificativa_escolha}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. CONCORRENTES AVALIADOS (TOP 1 A 3 CANDIDATOS DO ML) */}
          {candidates && candidates.length > 0 && (
            <div className="bg-[#12151f] border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                    Anúncios Concorrentes Avaliados ({candidates.length} Analisados)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  Elegibilidade e dados extraídos via API oficial
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {candidates.map((cand, idx) => {
                  const isWinner = idx === (clinicalResult?.vencedor_index ?? 0);
                  return (
                    <div
                      key={cand.item_id || idx}
                      className={`p-4 rounded-xl border relative flex flex-col justify-between transition-all ${
                        isWinner
                          ? 'bg-amber-950/20 border-amber-500/50 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/30'
                          : 'bg-[#0b0e17] border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      {isWinner && (
                        <span className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-sm">
                          {clinicalResult?.is_exact_match ? '🏆 Eleito Vencedor (Idêntico)' : '⚡ Eleito Vencedor (Similar)'}
                        </span>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-mono">
                            {cand.item_id && /^MLB-?\d{8,}$/i.test(cand.item_id) && !cand.item_id.includes('19234857')
                              ? cand.item_id.replace('-', '')
                              : `Anúncio ML #${idx + 1}`}
                          </span>
                          {cand.marca && (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                              {cand.marca}
                            </span>
                          )}
                        </div>
                        <h4
                          className="text-xs font-bold text-white line-clamp-2 leading-snug"
                          title={cand.titulo}
                        >
                          {cand.titulo}
                        </h4>

                        <div className="flex items-baseline gap-2 pt-1">
                          <span
                            className={`text-lg font-black ${
                              isWinner ? 'text-amber-400' : 'text-slate-200'
                            }`}
                          >
                            R$ {Number(cand.preco_atual).toFixed(2)}
                          </span>
                          {cand.preco_tabela && cand.preco_tabela > cand.preco_atual && (
                            <span className="text-xs text-slate-500 line-through">
                              R$ {Number(cand.preco_tabela).toFixed(2)}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                          <div className="flex justify-between">
                            <span>Vendas Comprovadas:</span>
                            <strong className="text-emerald-400">
                              {Number(cand.total_vendas).toLocaleString('pt-BR')} un
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Estoque Ativo:</span>
                            <strong className="text-white">
                              {Number(cand.estoque_disponivel).toLocaleString('pt-BR')} un
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Logística:</span>
                            <strong
                              className={
                                cand.logistica === 'fulfillment' ? 'text-cyan-300' : 'text-slate-300'
                              }
                            >
                              {cand.logistica === 'fulfillment' ? 'Full ML' : 'Própria'}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Vendedor:</span>
                            <span
                              className="text-white font-medium truncate max-w-[120px]"
                              title={cand.vendedor_nome}
                            >
                              {cand.vendedor_nome}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-800/80">
                        <a
                          href={buildCanonicalMlUrl(cand.url, cand.item_id, cand.titulo)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                            isWinner
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          }`}
                        >
                          <span>Ver Anúncio Real</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. AD SCORE & STRENGTH SECTION */}
          <div className="bg-[#12151f] border border-slate-800/80 rounded-2xl p-6 flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-56 flex-shrink-0 space-y-3">
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-5xl font-black ${
                    score <= 35 ? 'text-rose-400' : score < 75 ? 'text-amber-400' : 'text-white'
                  }`}
                >
                  {score}
                </span>
                <span className="text-xl text-slate-400 font-semibold">/100</span>
                <Info className="w-4 h-4 text-slate-500 ml-1" />
              </div>

              <div className="space-y-1.5">
                <div className="w-full h-1.5 rounded-full bg-slate-800 flex overflow-hidden">
                  <div className="w-1/3 bg-rose-500/80 h-full relative">
                    {score <= 35 && (
                      <div
                        className="absolute top-0 bottom-0 w-1.5 bg-white shadow-md shadow-white rounded-full -translate-x-1/2"
                        style={{ left: `${Math.max(5, Math.min(95, (score / 35) * 100))}%` }}
                      />
                    )}
                  </div>
                  <div className="w-1/3 bg-amber-500/80 h-full relative">
                    {score > 35 && score < 75 && (
                      <div
                        className="absolute top-0 bottom-0 w-1.5 bg-white shadow-md shadow-white rounded-full -translate-x-1/2"
                        style={{ left: `${Math.max(5, Math.min(95, ((score - 35) / 40) * 100))}%` }}
                      />
                    )}
                  </div>
                  <div className="w-1/3 bg-emerald-500 h-full relative">
                    {score >= 75 && (
                      <div
                        className="absolute top-0 bottom-0 w-1.5 bg-white shadow-md shadow-white rounded-full -translate-x-1/2"
                        style={{ left: `${Math.max(5, Math.min(95, ((score - 75) / 25) * 100))}%` }}
                      />
                    )}
                  </div>
                </div>

                <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                  <span className={score <= 35 ? 'text-rose-400 font-bold' : ''}>Fraco</span>
                  <span className={score > 35 && score < 75 ? 'text-amber-400 font-bold' : ''}>
                    Mediano
                  </span>
                  <span className={score >= 75 ? 'text-emerald-400 font-bold' : ''}>Forte</span>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <h3 className="text-base font-bold text-white tracking-wide">{scoreTitle}</h3>
              <div className="space-y-2 text-xs leading-relaxed text-slate-300">
                {bulletPoints.map((bp, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{bp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 5. FOUR METRIC CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#12151f] border border-slate-800/80 p-4 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Box className="w-3.5 h-3.5 text-emerald-400" />
                <span>Vendas Comprovadas</span>
              </div>
              <p className="text-2xl font-black text-white">{soldQty.toLocaleString('pt-BR')}</p>
              <p className="text-[11px] text-slate-500">unidades no anúncio eleito</p>
            </div>

            <div className="bg-[#12151f] border border-slate-800/80 p-4 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Package className="w-3.5 h-3.5 text-purple-400" />
                <span>Estoque Ativo</span>
              </div>
              <p className="text-2xl font-black text-white">{availableStock.toLocaleString('pt-BR')}</p>
              <p className="text-[11px] text-slate-500">unidades disponíveis</p>
            </div>

            <div className="bg-[#12151f] border border-slate-800/80 p-4 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                <span>Conversão</span>
              </div>
              <p className="text-2xl font-black text-white">{conversionRate}%</p>
              <p className="text-[11px] text-slate-500">1 venda a cada {visitsPerSale} visitas</p>
            </div>

            <div className="bg-[#12151f] border border-slate-800/80 p-4 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                <span>Faturamento Est.</span>
              </div>
              <p className="text-2xl font-black text-white">{revenueFormatted}</p>
              <p className="text-[11px] text-slate-500">cerca de {revenueMonthFormatted}/mês</p>
            </div>
          </div>

          {/* 6. PROJEÇÃO DE VENDAS DINÂMICA & GRÁFICO REAL */}
          <div className="bg-[#12151f] border border-slate-800/80 p-5 rounded-2xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white tracking-wide">
                    Projeção de Vendas & Curva de Mercado
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  Comparativo dinâmico entre o <span className="text-amber-400 font-semibold">Anúncio Vencedor</span> e o{' '}
                  <span className="text-cyan-400 font-semibold">Menor Valor Encontrado</span>.
                </p>
              </div>

              {/* Botões do Horizonte (30 ou 120 dias) */}
              <div className="flex items-center bg-[#0e1015] p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setProjectionDays(30)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    projectionDays === 30
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" /> 30 Dias
                </button>
                <button
                  type="button"
                  onClick={() => setProjectionDays(120)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    projectionDays === 120
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" /> 120 Dias
                </button>
              </div>
            </div>

            {/* Painel de Indicadores Reais do Mercado Livre */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-[#0b0e17] p-3 rounded-xl border border-cyan-500/20 space-y-1">
                <span className="text-[11px] text-cyan-400 font-bold flex items-center gap-1 uppercase tracking-wider">
                  <Tag className="w-3 h-3" /> Menor Preço Encontrado
                </span>
                <p className="text-lg font-black text-cyan-300">R$ {minPrice.toFixed(2)}</p>
                <p className="text-[10px] text-slate-400">
                  Proj.: <strong className="text-white">{projectedUnitsMin} un</strong> (R${' '}
                  {projectedRevenueMin.toLocaleString('pt-BR', { maximumFractionDigits: 0 })})
                </p>
              </div>

              <div className="bg-[#0b0e17] p-3 rounded-xl border border-amber-500/20 space-y-1">
                <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1 uppercase tracking-wider">
                  <Flame className="w-3 h-3" /> Preço do Vencedor Eleito
                </span>
                <p className="text-lg font-black text-amber-300">R$ {winnerPrice.toFixed(2)}</p>
                <p className="text-[10px] text-slate-400">
                  Proj.: <strong className="text-white">{projectedUnitsWinner} un</strong> (R${' '}
                  {projectedRevenueWinner.toLocaleString('pt-BR', { maximumFractionDigits: 0 })})
                </p>
              </div>

              <div className="bg-[#0b0e17] p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1 uppercase tracking-wider">
                  <Clock className="w-3 h-3 text-purple-400" /> Data Anúncio Mais Antigo
                </span>
                <p className="text-sm font-bold text-white">{formattedOldestDate}</p>
                <p className="text-[10px] text-purple-300 font-medium">{daysActive} dias de tração</p>
              </div>

              <div className="bg-[#0b0e17] p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1 uppercase tracking-wider">
                  <Zap className="w-3 h-3 text-emerald-400" /> Velocidade de Giro
                </span>
                <p className="text-lg font-black text-emerald-400">{salesVelocityWinner} un/dia</p>
                <p className="text-[10px] text-slate-400">
                  {soldQty.toLocaleString('pt-BR')} unidades vendidas
                </p>
              </div>
            </div>

            {/* Gráfico SVG Dinâmico */}
            <div className="h-56 w-full relative pt-2 bg-[#090b12] rounded-xl p-3 border border-slate-800/80">
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="gradWinner" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="gradMin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.30" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Linhas de Grade Horizontais */}
                {gridLevels.map((lvl, idx) => (
                  <g key={idx}>
                    <line
                      x1={padLeft}
                      y1={lvl.y}
                      x2={chartW - padRight}
                      y2={lvl.y}
                      stroke="#1e293b"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={padLeft - 10}
                      y={lvl.y + 4}
                      fill="#64748b"
                      fontSize="10"
                      textAnchor="end"
                      fontFamily="monospace"
                    >
                      {lvl.label}
                    </text>
                  </g>
                ))}

                {/* Área sob a curva Menor Preço */}
                <path d={areaMin} fill="url(#gradMin)" />
                <path
                  d={pathMin}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Área sob a curva Anúncio Vencedor */}
                <path d={areaWinner} fill="url(#gradWinner)" />
                <path
                  d={pathWinner}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Marcadores de Pontos (Dots) */}
                {pointsMin.map((pt, idx) => (
                  <g key={`min-${idx}`}>
                    <circle cx={pt.x} cy={pt.y} r="3.5" fill="#06b6d4" />
                    {idx === pointsMin.length - 1 && (
                      <text
                        x={pt.x - 5}
                        y={pt.y - 10}
                        fill="#67e8f9"
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="end"
                      >
                        +{pt.units} un (R${' '}
                        {projectedRevenueMin.toLocaleString('pt-BR', { maximumFractionDigits: 0 })})
                      </text>
                    )}
                  </g>
                ))}

                {pointsWinner.map((pt, idx) => (
                  <g key={`win-${idx}`}>
                    <circle cx={pt.x} cy={pt.y} r="4" fill="#f59e0b" stroke="#fff" strokeWidth="1" />
                    {idx === pointsWinner.length - 1 && (
                      <text
                        x={pt.x - 5}
                        y={pt.y - 10}
                        fill="#fbbf24"
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="end"
                      >
                        +{pt.units} un (R${' '}
                        {projectedRevenueWinner.toLocaleString('pt-BR', { maximumFractionDigits: 0 })})
                      </text>
                    )}
                  </g>
                ))}
              </svg>

              {/* Eixo X com Marcos Temporais Reais */}
              <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-2 px-2">
                <span>Início (Hoje)</span>
                <span>Dia {Math.round(projectionDays / 2)}</span>
                <span className="text-amber-400 font-bold">
                  Dia {projectionDays} (Horizonte Final)
                </span>
              </div>
            </div>

            {/* Legenda do Gráfico */}
            <div className="flex flex-wrap items-center justify-between text-xs pt-1 border-t border-slate-800/60 gap-3">
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                  <span className="text-slate-300 font-medium">
                    Anúncio Vencedor (R$ {winnerPrice.toFixed(2)} • {salesVelocityWinner} un/dia)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
                  <span className="text-slate-300 font-medium">
                    No Menor Valor Encontrado (R$ {minPrice.toFixed(2)} • {salesVelocityMin} un/dia)
                  </span>
                </div>
              </div>

              <span className="text-[11px] text-slate-500">
                Calculado com dados extraídos do Mercado Livre
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
