'use client';

import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Save,
  Trash2,
  Truck,
  DollarSign,
  Check,
  ChevronDown,
  Loader2,
  X,
} from 'lucide-react';

interface MarginCalculatorViewProps {
  initialData?: any;
  onClose?: () => void;
  isStandalone?: boolean;
  authToken?: string | null;
  userId?: string | null;
}

export default function MarginCalculatorView({
  initialData,
  onClose,
  isStandalone = true,
  authToken,
  userId,
}: MarginCalculatorViewProps) {
  const [calcName, setCalcName] = useState(
    initialData
      ? initialData.ml_title || initialData.title || initialData.source_title || 'Simulação de Margem'
      : 'Simulação de Margem'
  );
  const [salePrice, setSalePrice] = useState<string | number>(initialData?.ml_price ?? 129.9);
  const [listingType, setListingType] = useState(
    initialData?.ml_listing_type === 'gold_special' ? 'Clássico' : 'Premium'
  );
  const [productCost, setProductCost] = useState<string | number>(
    initialData?.price ?? initialData?.source_price ?? 59.9
  );
  const [taxPercent, setTaxPercent] = useState<string | number>(6);

  const [freeShippingAuto, setFreeShippingAuto] = useState(true);
  const [customShippingEnabled, setCustomShippingEnabled] = useState(false);
  const [customShippingCost, setCustomShippingCost] = useState<string | number>(19.9);

  const [packagingCost, setPackagingCost] = useState<string | number>(3.5);
  const [adsPercent, setAdsPercent] = useState<string | number>(0);
  const [returnPercent, setReturnPercent] = useState<string | number>(2.0);

  const [result, setResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    async function runCalc() {
      try {
        const res = await fetch('/api/calculator/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            salePrice: Number(salePrice || 0),
            productCost: Number(productCost || 0),
            listingType: listingType === 'Premium' ? 'gold_pro' : 'gold_special',
            taxPercent: Number(taxPercent || 0),
            freeShippingAuto,
            customShippingEnabled,
            customShippingCost: Number(customShippingCost || 0),
            packagingCost: Number(packagingCost || 0),
            adsPercent: Number(adsPercent || 0),
            returnPercent: Number(returnPercent || 0),
          }),
        });
        const json = await res.json();
        if (json.success && json.data) {
          setResult(json.data);
        }
      } catch (err) {
        console.error('Erro ao calcular ROI:', err);
      }
    }
    runCalc();
  }, [
    salePrice,
    productCost,
    listingType,
    taxPercent,
    freeShippingAuto,
    customShippingEnabled,
    customShippingCost,
    packagingCost,
    adsPercent,
    returnPercent,
  ]);

  useEffect(() => {
    loadHistory();
  }, [authToken, userId]);

  async function loadHistory() {
    setLoadingHistory(true);
    try {
      const headers: Record<string, string> = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const url = userId ? `/api/calculator/history?userId=${userId}` : '/api/calculator/history';
      const res = await fetch(url, { headers });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setHistoryList(json.data);
      }
    } catch {
      // ignore history error
    } finally {
      setLoadingHistory(false);
    }
  }

  // Ctrl+S / Cmd+S shortcut to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [calcName, salePrice, productCost, listingType, taxPercent, result]);

  async function handleSave() {
    setSaving(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      await fetch('/api/calculator/history', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: calcName || 'Simulação sem nome',
          analysis_id: initialData?.id,
          salePrice: Number(salePrice || 0),
          productCost: Number(productCost || 0),
          listingType: listingType === 'Premium' ? 'gold_pro' : 'gold_special',
          taxPercent: Number(taxPercent || 0),
          freeShippingAuto,
          customShippingEnabled,
          shippingCost: customShippingEnabled
            ? Number(customShippingCost)
            : result?.shippingCost || 0,
          packagingCost: Number(packagingCost),
          adsPercent: Number(adsPercent),
          returnPercent: Number(returnPercent),
          commissionFee: result?.commissionFee || 0,
          fixedFee: result?.fixedFee || 0,
          netProfit: result?.netProfit || 0,
          marginPercent: result?.marginPercent || 0,
          roiPercent: result?.roiPercent || 0,
          breakEvenPrice: result?.breakEvenPrice || 0,
          userId,
        }),
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      loadHistory();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteHistory(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const headers: Record<string, string> = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      await fetch(`/api/calculator/history?id=${id}`, {
        method: 'DELETE',
        headers,
      });
      setHistoryList((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  function handleSelectHistoryItem(item: any) {
    setCalcName(item.name);
    setSalePrice(item.ml_price);
    setProductCost(item.product_cost);
    setListingType(item.listing_type === 'gold_pro' ? 'Premium' : 'Clássico');
    setTaxPercent(item.tax_percent);
    setFreeShippingAuto(Boolean(item.free_shipping_auto));
    setCustomShippingEnabled(Boolean(item.custom_shipping_enabled));
    if (item.shipping_cost) setCustomShippingCost(item.shipping_cost);
  }

  const containerContent = (
    <div
      className={`bg-[#12141a] border border-slate-800/90 rounded-2xl w-full ${
        isStandalone ? 'max-w-6xl mx-auto' : 'max-w-5xl max-h-[92vh]'
      } flex flex-col shadow-2xl text-slate-100 overflow-hidden font-sans`}
    >
      {/* Top Title Bar */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800/60 bg-[#12141a]">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-slate-200" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Calculadora de Margem & ROI Oficial
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
            <span>Os cálculos são atualizados em tempo real</span>
            <span>•</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
              Ctrl+S
            </kbd>
            <span>para salvar simulação</span>
          </p>
        </div>

        {!isStandalone && onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Grid: Inputs vs Histórico */}
      <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#0e1015]">
        {/* Left Column: Dados do Produto */}
        <div className="lg:col-span-7 bg-[#141720] border border-slate-800/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-wide">Dados da Simulação</h3>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1a1e2a] hover:bg-[#222838] border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Salvo!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-slate-300" />
                  <span>{saving ? 'Salvando...' : 'Salvar'}</span>
                </>
              )}
            </button>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Nome do cálculo (opcional)</label>
            <input
              type="text"
              value={calcName}
              onChange={(e) => setCalcName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0e1015] border border-slate-800 text-sm font-semibold text-slate-100 focus:outline-none focus:border-slate-600 transition-colors"
              placeholder="Ex: Câmera Segurança Wifi Externa A28"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Preço de Venda no ML</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-sm font-bold text-slate-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-[#0e1015] border border-slate-800 text-sm font-extrabold text-white focus:outline-none focus:border-slate-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Tipo de anúncio</label>
              <div className="relative">
                <select
                  value={listingType}
                  onChange={(e) => setListingType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0e1015] border border-slate-800 text-sm font-semibold text-slate-200 focus:outline-none focus:border-slate-600 appearance-none transition-colors cursor-pointer"
                >
                  <option value="Clássico">Clássico (12%)</option>
                  <option value="Premium">Premium (17%)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Custo do produto (compra)</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-sm font-bold text-slate-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  value={productCost}
                  onChange={(e) => setProductCost(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-[#0e1015] border border-slate-800 text-sm font-bold text-white focus:outline-none focus:border-slate-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Imposto s/ Faturamento (%)</label>
              <input
                type="number"
                step="0.5"
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0e1015] border border-slate-800 text-sm font-bold text-white focus:outline-none focus:border-slate-600 transition-colors"
              />
            </div>
          </div>

          {/* Frete Grátis AUTO Card */}
          <div className="bg-[#101918] border border-emerald-900/60 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#142321] border border-emerald-900/50 flex items-center justify-center text-emerald-400">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-200">Frete Grátis</span>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
                    AUTO
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Obrigatório pelo ML acima de R$ 79,00</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setFreeShippingAuto(!freeShippingAuto)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                freeShippingAuto ? 'bg-emerald-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  freeShippingAuto ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Frete Customizado Card */}
          <div className="bg-[#141720] border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#1a1e2a] border border-slate-700/60 flex items-center justify-center text-slate-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">Frete Customizado</span>
                <p className="text-[11px] text-slate-400">
                  {customShippingEnabled
                    ? `Valor: R$ ${Number(customShippingCost).toFixed(2)}`
                    : 'Usando tabela oficial padrão'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCustomShippingEnabled(!customShippingEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                customShippingEnabled ? 'bg-cyan-600' : 'bg-slate-800'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-slate-300 transition-transform ${
                  customShippingEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {customShippingEnabled && (
            <div className="p-3 bg-[#0e1015] rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">Custo de frete por unidade:</span>
              <div className="flex items-center gap-1">
                <span className="text-slate-400 font-bold">R$</span>
                <input
                  type="number"
                  step="0.05"
                  value={customShippingCost}
                  onChange={(e) => setCustomShippingCost(e.target.value)}
                  className="w-24 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-right font-bold text-white"
                />
              </div>
            </div>
          )}

          {/* Embalagem & Devolução */}
          <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Custo Embalagem (R$)</label>
              <input
                type="number"
                step="0.5"
                value={packagingCost}
                onChange={(e) => setPackagingCost(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0e1015] border border-slate-800 font-semibold text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Margem Devolução (%)</label>
              <input
                type="number"
                step="0.5"
                value={returnPercent}
                onChange={(e) => setReturnPercent(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0e1015] border border-slate-800 font-semibold text-white"
              />
            </div>
          </div>

          {/* Real-time Math Summary Strip */}
          {result && (
            <div className="pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#0e1015] p-2.5 rounded-lg border border-slate-800/60">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Lucro Líquido</span>
                <span
                  className={`text-base font-extrabold ${
                    result.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  R$ {result.netProfit.toFixed(2)}
                </span>
              </div>
              <div className="bg-[#0e1015] p-2.5 rounded-lg border border-slate-800/60">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Margem / ROI</span>
                <span className="text-base font-extrabold text-slate-200">
                  {result.marginPercent.toFixed(1)}%{' '}
                  <span className="text-xs text-emerald-400 font-bold">
                    ({result.roiPercent.toFixed(1)}%)
                  </span>
                </span>
              </div>
              <div className="bg-[#0e1015] p-2.5 rounded-lg border border-slate-800/60">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Break-even</span>
                <span className="text-base font-extrabold text-cyan-300">
                  R$ {result.breakEvenPrice.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Histórico */}
        <div className="lg:col-span-5 space-y-3 flex flex-col">
          <h3 className="text-sm font-bold text-white tracking-wide">
            Histórico de Cálculos ({historyList.length})
          </h3>

          <div className="flex-1 bg-[#141720] border border-slate-800/80 rounded-xl p-4 min-h-[300px] flex flex-col justify-start overflow-y-auto">
            {loadingHistory ? (
              <div className="m-auto text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> Carregando histórico...
              </div>
            ) : historyList.length === 0 ? (
              <div className="m-auto text-center p-6 text-xs text-slate-500 max-w-xs leading-relaxed">
                Nenhum cálculo salvo ainda. Clique em &ldquo;Salvar&rdquo; ou pressione Ctrl+S para salvar no seu perfil.
              </div>
            ) : (
              <div className="space-y-2.5 w-full">
                {historyList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectHistoryItem(item)}
                    className="p-3 bg-[#0e1015] hover:bg-[#181c26] border border-slate-800/80 rounded-lg cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-200 truncate group-hover:text-cyan-300 transition-colors">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <span>Preço: R$ {Number(item.ml_price).toFixed(2)}</span>
                        <span>•</span>
                        <span className="font-semibold text-emerald-400">
                          + R$ {Number(item.net_profit).toFixed(2)}
                        </span>
                        <span>•</span>
                        <span>ROI {Number(item.roi_percent).toFixed(0)}%</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDeleteHistory(item.id, e)}
                      className="p-1 rounded text-slate-600 hover:text-rose-400 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (isStandalone) {
    return containerContent;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      {containerContent}
    </div>
  );
}
