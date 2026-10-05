import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Image as ImageIcon,
  Link as LinkIcon,
  Check
} from 'lucide-react';
import { runManualAnalysis, previewUrl } from '../api';

export default function ManualSearchModal({ onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [price, setPrice] = useState('');
  const [store, setStore] = useState('Eletroclub');

  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState(null);
  const previewTimeoutRef = useRef(null);

  const steps = [
    'Consultando catálogo e busca do Mercado Livre...',
    'Comparando identidade de título e especificações...',
    'Identificando melhor vendedor e menor preço elegível...',
    'Calculando taxas, frete obrigatório e margem líquida...',
    'Enriquecendo dados com Inteligência Google Gemini...',
    'Concluído!'
  ];

  function handleUrlChange(val) {
    setUrl(val);
    const lower = val.toLowerCase();
    if (lower.includes('eletroclub')) setStore('Eletroclub');
    else if (lower.includes('amazon')) setStore('Amazon');
    else if (lower.includes('kabum')) setStore('KaBuM!');
    else if (lower.includes('magazineluiza') || lower.includes('magalu')) setStore('Magalu');
    else if (lower.includes('shopee')) setStore('Shopee');
    else if (lower.includes('shein')) setStore('Shein');
    else if (lower.includes('pichau')) setStore('Pichau');

    // Auto-fetch metadata if valid URL pasted
    if (val.startsWith('http://') || val.startsWith('https://')) {
      if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = setTimeout(async () => {
        setPreviewLoading(true);
        try {
          const res = await previewUrl(val);
          if (res.success && res.data) {
            if (res.data.title && !title) setTitle(res.data.title);
            if (res.data.price && !price) setPrice(String(res.data.price));
            if (res.data.imageUrl) setImageUrl(res.data.imageUrl);
            if (res.data.store && res.data.store !== 'Online') setStore(res.data.store);
          }
        } catch (e) {
          // ignore silent preview error
        } finally {
          setPreviewLoading(false);
        }
      }, 500);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title || !price) {
      setError('Informe ao menos o nome do produto e o preço de compra.');
      return;
    }

    setError(null);
    setLoading(true);
    setCurrentStep(0);

    const interval = setInterval(() => {
      setCurrentStep(prev => (prev < steps.length - 2 ? prev + 1 : prev));
    }, 600);

    try {
      const res = await runManualAnalysis({
        title,
        url: url || undefined,
        foto_url: imageUrl || undefined,
        price: Number(price),
        store
      });

      clearInterval(interval);

      if (res.success && res.data) {
        setCurrentStep(steps.length - 1);
        setTimeout(() => {
          onSuccess(res.data);
          onClose();
        }, 500);
      } else {
        setError(res.error || 'Nenhum anúncio correspondente encontrado.');
      }
    } catch (err) {
      clearInterval(interval);
      setError(err.message || 'Erro ao processar análise manual.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn font-sans">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Busca Manual de Oportunidade</h2>
              <p className="text-xs text-slate-400">Cole a URL ou nome para rodar o pipeline completo</p>
            </div>
          </div>

          {!loading && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* URL Input First with Auto-detect */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-cyan-400" />
                URL da Oferta (Eletroclub, Amazon, Magalu, etc.)
              </span>
              {previewLoading && (
                <span className="text-[11px] text-cyan-400 flex items-center gap-1 animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" /> Extraindo foto e dados...
                </span>
              )}
            </label>
            <input
              type="url"
              placeholder="https://www.eletroclub.com.br/multi-cook-philco.../p"
              value={url}
              disabled={loading}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-sm text-white focus:outline-none placeholder:text-slate-600"
            />
          </div>

          {/* Image & Title Preview Badge */}
          {imageUrl && (
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-white p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                <img 
                  src={imageUrl} 
                  alt="Prévia" 
                  className="w-full h-full object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">Foto Detectada com Sucesso</span>
                <span className="text-xs text-slate-300 truncate block font-medium">{title || 'Produto extraído da loja'}</span>
              </div>
              <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Nome do Produto ou Modelo *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Multi Cook Philco 850W Sem Óleo Maxx Clean"
              value={title}
              disabled={loading}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-sm text-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Preço de Compra (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="199.90"
                value={price}
                disabled={loading}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-sm font-bold text-cyan-300 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Loja de Origem
              </label>
              <select
                value={store}
                disabled={loading}
                onChange={(e) => setStore(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-sm text-white focus:outline-none"
              >
                <option value="Eletroclub">Eletroclub</option>
                <option value="Amazon">Amazon</option>
                <option value="KaBuM!">KaBuM!</option>
                <option value="Magalu">Magalu</option>
                <option value="Shopee">Shopee</option>
                <option value="Shein">Shein</option>
                <option value="Pichau">Pichau</option>
                <option value="Outra Loja">Outra Loja</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center justify-between">
              <span>URL Direta da Imagem (Opcional)</span>
              <span className="text-[10px] text-slate-500 font-normal">Preenchida automaticamente</span>
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={imageUrl}
              disabled={loading}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-sm text-white focus:outline-none placeholder:text-slate-600"
            />
          </div>

          {/* Stepper Progress when loading */}
          {loading && (
            <div className="py-4 space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-slate-400 block mb-2">Executando Pipeline:</span>
              {steps.map((st, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  {idx < currentStep ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : idx === currentStep ? (
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-700 flex-shrink-0" />
                  )}
                  <span className={idx === currentStep ? 'font-bold text-cyan-300' : idx < currentStep ? 'text-slate-300' : 'text-slate-600'}>
                    {st}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Analisar Oportunidade
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
