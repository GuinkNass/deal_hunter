import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calculator, 
  Save, 
  Trash2, 
  Truck, 
  DollarSign, 
  Check, 
  ChevronDown,
  TrendingUp,
  Percent,
  AlertCircle
} from 'lucide-react';
import { calculateLiveROI, saveCalculation, fetchCalculationsHistory, deleteCalculation } from '../api';

export default function MarginCalculatorModal({ initialData, onClose, isStandalone = false }) {
  // Input states matching visual reference
  const [calcName, setCalcName] = useState(
    initialData ? (initialData.ml_title || initialData.source_title || 'Câmera Segurança Ip Externa Wifi A28 App Icsee À Prova Dá') : 'Câmera Segurança Ip Externa Wifi A28 App Icsee À Prova Dá'
  );
  const [salePrice, setSalePrice] = useState(initialData?.ml_price ?? 127.99);
  const [listingType, setListingType] = useState(
    initialData?.ml_listing_type === 'gold_pro' ? 'Premium' : 'Clássico'
  );
  const [productCost, setProductCost] = useState(initialData?.source_price ?? 0.00);
  const [taxPercent, setTaxPercent] = useState(0);

  // Toggles matching visual reference
  const [freeShippingAuto, setFreeShippingAuto] = useState(true);
  const [customShippingEnabled, setCustomShippingEnabled] = useState(false);
  const [customShippingCost, setCustomShippingCost] = useState(7.75);

  // Additional fine-tuning
  const [packagingCost, setPackagingCost] = useState(3.50);
  const [adsPercent, setAdsPercent] = useState(0);
  const [returnPercent, setReturnPercent] = useState(2.0);

  // Live calculation result
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // History state
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Recalculate on any change
  useEffect(() => {
    async function runCalc() {
      try {
        const res = await calculateLiveROI({
          salePrice: Number(salePrice || 0),
          productCost: Number(productCost || 0),
          listingType: listingType === 'Premium' ? 'gold_pro' : 'gold_special',
          taxPercent: Number(taxPercent || 0),
          freeShippingAuto,
          customShippingEnabled,
          customShippingCost: Number(customShippingCost || 0),
          packagingCost: Number(packagingCost || 0),
          adsPercent: Number(adsPercent || 0),
          returnPercent: Number(returnPercent || 0)
        });
        if (res.success) {
          setResult(res.data);
        }
      } catch (err) {
        console.error('Erro ao calcular ROI:', err);
      }
    }
    runCalc();
  }, [
    salePrice, productCost, listingType, taxPercent,
    freeShippingAuto, customShippingEnabled, customShippingCost,
    packagingCost, adsPercent, returnPercent
  ]);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setLoadingHistory(true);
    try {
      const res = await fetchCalculationsHistory();
      if (res.success) setHistoryList(res.data || []);
    } finally {
      setLoadingHistory(false);
    }
  }

  // Ctrl+S / Cmd+S shortcut to save
  useEffect(() => {
    const handleKeyDown = (e) => {
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
      await saveCalculation({
        name: calcName || 'Simulação sem nome',
        analysis_id: initialData?.id,
        salePrice: Number(salePrice || 0),
        productCost: Number(productCost || 0),
        listingType: listingType === 'Premium' ? 'gold_pro' : 'gold_special',
        taxPercent: Number(taxPercent || 0),
        freeShippingAuto,
        customShippingEnabled,
        shippingCost: customShippingEnabled ? Number(customShippingCost) : (result?.shippingCost || 0),
        packagingCost: Number(packagingCost),
        adsPercent: Number(adsPercent),
        returnPercent: Number(returnPercent)
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      loadHistory();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteHistory(id, e) {
    e.stopPropagation();
    await deleteCalculation(id);
    setHistoryList(prev => prev.filter(item => item.id !== id));
  }

  function handleSelectHistoryItem(item) {
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
    <div className={`bg-[#12141a] border border-slate-800/90 rounded-2xl w-full ${isStandalone ? 'max-w-6xl mx-auto my-6' : 'max-w-5xl max-h-[92vh]'} flex flex-col shadow-2xl text-slate-100 overflow-hidden font-sans`}>
      {/* Top Title Bar - Identical to Reference */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800/60 bg-[#12141a]">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-slate-200" />
            <h2 className="text-base font-bold text-white tracking-tight">Calculadora de Margem</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
            <span>Os cálculos são atualizados em tempo real</span>
            <span>•</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
              Ctrl+S
            </kbd>
            <span>para salvar</span>
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

      {/* Main Grid: Dados do Produto (Left) vs Histórico (Right) */}
      <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#0e1015]">
        {/* Left Column: Dados do Produto */}
        <div className="lg:col-span-7 bg-[#141720] border border-slate-800/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-wide">Dados do Produto</h3>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1e2a] hover:bg-[#222838] border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Salvo!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-slate-300" />
                  <span>Salvar</span>
                </>
              )}
            </button>
          </div>

          {/* Nome do cálculo */}
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Nome do cálculo (opcional)</label>
            <input
              type="text"
              value={calcName}
              onChange={(e) => setCalcName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0e1015] border border-slate-800 text-sm font-semibold text-slate-100 focus:outline-none focus:border-slate-600 transition-colors"
              placeholder="Ex: Câmera Segurança Ip Externa Wifi A28"
            />
          </div>

          {/* Preço e Tipo de anúncio */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Preço</label>
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
                  <option value="Clássico">Clássico</option>
                  <option value="Premium">Premium</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Custo do produto e Imposto (%) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Custo do produto</label>
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
              <label className="text-xs text-slate-400 block mb-1.5">Imposto (%)</label>
              <input
                type="number"
                step="0.5"
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0e1015] border border-slate-800 text-sm font-bold text-white focus:outline-none focus:border-slate-600 transition-colors"
              />
            </div>
          </div>

          {/* Frete Grátis AUTO Card (Styled with green border matching reference) */}
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
                <p className="text-[11px] text-slate-400">Obrigatório acima de R$ 79,00</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <button
                type="button"
                onClick={() => setFreeShippingAuto(!freeShippingAuto)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  freeShippingAuto ? 'bg-amber-700' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${
                    freeShippingAuto ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
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
                  {customShippingEnabled ? `Valor: R$ ${Number(customShippingCost).toFixed(2)}` : 'Usando valor padrão'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCustomShippingEnabled(!customShippingEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                customShippingEnabled ? 'bg-blue-600' : 'bg-slate-800'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-slate-300 transition-transform ${
                  customShippingEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* If custom freight active, input field */}
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

          {/* Real-time Math Summary Strip */}
          {result && (
            <div className="pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#0e1015] p-2.5 rounded-lg border border-slate-800/60">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Lucro Líquido</span>
                <span className={`text-base font-extrabold ${result.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  R$ {result.netProfit.toFixed(2)}
                </span>
              </div>
              <div className="bg-[#0e1015] p-2.5 rounded-lg border border-slate-800/60">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Margem / ROI</span>
                <span className="text-base font-extrabold text-slate-200">
                  {result.marginPercent.toFixed(1)}% <span className="text-xs text-emerald-400 font-bold">({result.roiPercent.toFixed(1)}%)</span>
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

        {/* Right Column: Histórico (Matching visual reference exactly) */}
        <div className="lg:col-span-5 space-y-3 flex flex-col">
          <h3 className="text-sm font-bold text-white tracking-wide">
            Histórico ({historyList.length})
          </h3>

          <div className="flex-1 bg-[#141720] border border-slate-800/80 rounded-xl p-4 min-h-[300px] flex flex-col justify-start overflow-y-auto">
            {loadingHistory ? (
              <div className="m-auto text-center text-xs text-slate-500">Carregando histórico...</div>
            ) : historyList.length === 0 ? (
              <div className="m-auto text-center p-6 text-xs text-slate-500 max-w-xs leading-relaxed">
                Nenhum cálculo salvo ainda. Clique em "Salvar" para adicionar ao histórico.
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
                        <span>Preço: R$ {item.ml_price.toFixed(2)}</span>
                        <span>•</span>
                        <span className="font-semibold text-emerald-400">+ R$ {item.net_profit.toFixed(2)}</span>
                        <span>•</span>
                        <span>ROI {item.roi_percent.toFixed(0)}%</span>
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      {containerContent}
    </div>
  );
}
