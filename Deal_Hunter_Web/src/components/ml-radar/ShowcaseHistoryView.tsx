'use client';

import React, { useState } from 'react';
import {
  Star,
  RefreshCw,
  ExternalLink,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Sparkles,
  Store,
  Tag,
  ShieldCheck,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { DealAnalysis } from './AnalysisDetailModal';

interface ShowcaseHistoryViewProps {
  deals: DealAnalysis[];
  onToggleFeatured: (deal: DealAnalysis) => void;
  onUpdateDeal: (deal: DealAnalysis) => void;
  onSyncShowcase: () => Promise<void>;
  isSyncing: boolean;
}

export default function ShowcaseHistoryView({
  deals,
  onToggleFeatured,
  onUpdateDeal,
  onSyncShowcase,
  isSyncing,
}: ShowcaseHistoryViewProps) {
  // Filtra apenas produtos que estão marcados para a vitrine
  const featuredDeals = deals.filter((d) => Boolean(d.is_featured));

  const [editingDescriptions, setEditingDescriptions] = useState<{ [id: string]: string }>({});
  const [editingCategories, setEditingCategories] = useState<{ [id: string]: string }>({});
  const [editingTitles, setEditingTitles] = useState<{ [id: string]: string }>({});
  const [editingPrices, setEditingPrices] = useState<{ [id: string]: string }>({});
  const [newModalOpen, setNewModalOpen] = useState(false);

  // Form para adicionar novo produto direto na vitrine
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newOriginalPrice, setNewOriginalPrice] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newStore, setNewStore] = useState('Amazon Brasil');
  const [newCategory, setNewCategory] = useState('Geral');
  const [newDescription, setNewDescription] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  const formatBRL = (val: any) => {
    const num = Number(val || 0);
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleDescriptionChange = (id: string, text: string) => {
    setEditingDescriptions((prev) => ({ ...prev, [id]: text }));
  };

  const handleCategoryChange = (id: string, cat: string) => {
    setEditingCategories((prev) => ({ ...prev, [id]: cat }));
  };

  const handleTitleChange = (id: string, title: string) => {
    setEditingTitles((prev) => ({ ...prev, [id]: title }));
  };

  const handlePriceChange = (id: string, price: string) => {
    setEditingPrices((prev) => ({ ...prev, [id]: price }));
  };

  const handleSaveDeal = (deal: DealAnalysis) => {
    const updatedDesc = editingDescriptions[deal.id || ''] !== undefined
      ? editingDescriptions[deal.id || '']
      : deal.description;

    const updatedCat = editingCategories[deal.id || ''] !== undefined
      ? editingCategories[deal.id || '']
      : deal.category;

    const updatedTitle = editingTitles[deal.id || ''] !== undefined
      ? editingTitles[deal.id || '']
      : deal.title;

    const priceRaw = editingPrices[deal.id || ''];
    const updatedPrice = priceRaw !== undefined
      ? parseFloat(priceRaw.replace(',', '.')) || deal.price
      : deal.price;

    onUpdateDeal({
      ...deal,
      title: updatedTitle,
      price: updatedPrice,
      description: updatedDesc,
      category: updatedCat,
    });
  };

  const handleCreateManualShowcaseItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrice.trim()) return;

    const currentPrice = parseFloat(newPrice.replace(',', '.')) || 0;
    const origPrice = newOriginalPrice ? parseFloat(newOriginalPrice.replace(',', '.')) : null;

    const newDeal: DealAnalysis = {
      id: `manual-vitrine-${Date.now()}`,
      title: newTitle.trim(),
      price: currentPrice,
      original_price: origPrice,
      product_url: newUrl.trim() || '#',
      image_url: newImageUrl.trim() || null,
      store: newStore,
      category: newCategory,
      description: newDescription.trim() || 'Oferta selecionada pela curadoria Deal Hunter Pro.',
      is_featured: true,
      verdict: 'Viável',
      status: 'completed',
      created_at: new Date().toISOString(),
    };

    onUpdateDeal(newDeal);
    setNewModalOpen(false);

    // Reseta form
    setNewTitle('');
    setNewPrice('');
    setNewOriginalPrice('');
    setNewUrl('');
    setNewDescription('');
    setNewImageUrl('');
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. CABEÇALHO DO SEGUNDO HISTÓRICO                                         */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-3xl bg-[#0e1322] border border-white/[0.08] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-black uppercase tracking-wider">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>Gestor da Vitrine Externa • Histórico Leve de Descrições</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            Produtos Configurados para a Vitrine Externa
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Neste histórico leve (sem fotos pesadas), você configura rapidamente os textos, categorias e descrições personalizadas que os clientes verão em{' '}
            <strong className="text-cyan-300">dealhunterpro.com.br/ofertas</strong>.
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {featuredDeals.some((d) => String(d.id || '').startsWith('curated-default-') || String(d.id || '').startsWith('showcase-seed-')) && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Deseja remover todos os produtos de teste da vitrine?')) {
                  featuredDeals
                    .filter((d) => String(d.id || '').startsWith('curated-default-') || String(d.id || '').startsWith('showcase-seed-'))
                    .forEach((d) => onToggleFeatured(d));
                }
              }}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-3 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
              title="Remover produtos de teste padrão da vitrine oficial"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Limpar Testes</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setNewModalOpen(true)}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/10 text-xs font-bold transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>Adicionar Produto</span>
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              onSyncShowcase();
            }}
            disabled={isSyncing}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-amber-500/30 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-black ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Atualizando Vitrine...' : 'Atualizar Vitrine'}</span>
            <span className="px-2 py-0.5 rounded-full bg-black/20 text-black font-black text-xs">
              {featuredDeals.length}
            </span>
          </button>
        </div>
      </div>

      {/* Banner de Garantia Histórica */}
      <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
        <ShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-400" />
        <span>
          <strong>Histórico Seguro:</strong> Os produtos deste painel nunca são excluídos quando você limpa o Radar ML. Eles permanecem salvos e ativos para sua vitrine externa.
        </span>
      </div>

      {/* ========================================================================= */}
      {/* 2. LISTA ULTRA-RESPONSIVA SEM FOTOS (MODO LEVE)                           */}
      {/* ========================================================================= */}
      {featuredDeals.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#0c101d] border border-white/[0.08] space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
            <Star className="w-8 h-8 fill-amber-400" />
          </div>
          <h3 className="text-lg font-black text-white uppercase">Nenhum produto na Vitrine ainda</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Volte para a aba <strong className="text-cyan-400">Radar ML</strong> e clique no botão de estrela (★) de qualquer produto para adicioná-lo aqui, ou use o botão <strong>&quot;Adicionar Produto&quot;</strong> acima.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {featuredDeals.map((deal, idx) => {
            const currentDesc = editingDescriptions[deal.id || ''] !== undefined
              ? editingDescriptions[deal.id || '']
              : deal.description || '';

            const currentCat = editingCategories[deal.id || ''] !== undefined
              ? editingCategories[deal.id || '']
              : deal.category || 'Geral';

            const priceNum = Number(deal.price || deal.source_price || 0);
            const origNum = deal.original_price ? Number(deal.original_price) : null;
            const discount = origNum && origNum > priceNum ? Math.round(((origNum - priceNum) / origNum) * 100) : null;

            return (
              <div
                key={deal.id || `feat-${idx}`}
                className="p-4 sm:p-5 rounded-2xl bg-[#0c101d] border border-white/[0.08] hover:border-amber-500/40 transition-colors shadow-md space-y-3"
              >
                {/* Linha Superior: Info Básica, Loja, Preço e Ações */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => onToggleFeatured(deal)}
                      className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/50 flex-shrink-0 hover:bg-amber-500/30 transition-colors"
                      title="Clique para desmarcar da vitrine"
                    >
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-[10px] font-bold uppercase tracking-wider border border-zinc-700/60 inline-flex items-center gap-1">
                          <Store className="w-2.5 h-2.5 text-zinc-400" />
                          {deal.store || 'Amazon Brasil'}
                        </span>

                        {discount && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-600/90 text-white text-[10px] font-black">
                            -{discount}% OFF
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-white truncate" title={deal.title}>
                        {deal.title}
                      </h4>
                    </div>
                  </div>

                  {/* Bloco de Preços e Link */}
                  <div className="flex items-center gap-4 flex-shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-white/[0.06]">
                    <div className="text-right">
                      <div className="text-base font-black text-cyan-400">
                        {formatBRL(priceNum)}
                      </div>
                      {origNum && origNum > priceNum && (
                        <div className="text-[11px] text-zinc-500 line-through">
                          {formatBRL(origNum)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {deal.product_url && (
                        <a
                          href={deal.product_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white transition-colors"
                          title="Abrir página oficial do produto"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => onToggleFeatured(deal)}
                        className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                        title="Remover da Vitrine"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Linha Inferior: Edição de Descrição e Categoria sem fotos */}
                <div className="pt-2 border-t border-white/[0.06] grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {/* Categoria */}
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Categoria na Vitrine:
                    </label>
                    <select
                      value={currentCat}
                      onChange={(e) => {
                        handleCategoryChange(deal.id || '', e.target.value);
                        onUpdateDeal({ ...deal, category: e.target.value });
                      }}
                      className="w-full py-1.5 px-3 bg-[#080b14] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
                    >
                      <option value="Pet & Saúde Animal">🐶 Pet & Veterinária</option>
                      <option value="Eletrônicos & Smart Home">📱 Eletrônicos & Smart Home</option>
                      <option value="Informática & Hardware">💻 Informática & Hardware</option>
                      <option value="Casa & Eletrodomésticos">🍳 Casa & Eletrodomésticos</option>
                      <option value="Games & Monitores">🎮 Games & Monitores</option>
                      <option value="Geral">📦 Geral / Outros</option>
                    </select>
                  </div>

                  {/* Descrição Personalizada */}
                  <div className="md:col-span-8">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                      <span>Descrição / Frase de Destaque:</span>
                      <span className="text-[9px] text-slate-500 lowercase">exibida no card público</span>
                    </label>
                    <input
                      type="text"
                      value={currentDesc}
                      onChange={(e) => handleDescriptionChange(deal.id || '', e.target.value)}
                      onBlur={() => handleSaveDeal(deal)}
                      placeholder="Ex: Menor preço histórico verificado na Amazon com frete grátis Prime..."
                      className="w-full py-1.5 px-3 bg-[#080b14] border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Botão de Salvar Alteração */}
                  <div className="md:col-span-1 flex items-end justify-end">
                    <button
                      type="button"
                      onClick={() => handleSaveDeal(deal)}
                      className="w-full py-1.5 px-2 rounded-xl bg-white/[0.06] hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 border border-white/10 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                      title="Salvar alterações"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODAL DE ADICIONAR PRODUTO MANUAL NA VITRINE                           */}
      {/* ========================================================================= */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[#0c101d] border border-white/[0.12] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <h3 className="text-base font-black text-white uppercase">Adicionar Produto à Vitrine</h3>
              </div>
              <button
                type="button"
                onClick={() => setNewModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualShowcaseItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Título do Produto *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Bravecto 250mg para Cães..."
                  className="w-full p-2.5 bg-[#080b14] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Preço Promocional (R$) *</label>
                  <input
                    type="text"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="Ex: 117.99"
                    className="w-full p-2.5 bg-[#080b14] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Preço Original (R$)</label>
                  <input
                    type="text"
                    value={newOriginalPrice}
                    onChange={(e) => setNewOriginalPrice(e.target.value)}
                    placeholder="Ex: 230.50"
                    className="w-full p-2.5 bg-[#080b14] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Loja</label>
                  <select
                    value={newStore}
                    onChange={(e) => setNewStore(e.target.value)}
                    className="w-full p-2.5 bg-[#080b14] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Amazon Brasil">Amazon Brasil</option>
                    <option value="KaBuM!">KaBuM!</option>
                    <option value="Shopee">Shopee</option>
                    <option value="Magalu">Magalu</option>
                    <option value="Mercado Livre">Mercado Livre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Categoria</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2.5 bg-[#080b14] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Pet & Saúde Animal">Pet & Veterinária</option>
                    <option value="Eletrônicos & Smart Home">Eletrônicos & Smart Home</option>
                    <option value="Informática & Hardware">Informática & Hardware</option>
                    <option value="Casa & Eletrodomésticos">Casa & Eletrodomésticos</option>
                    <option value="Games & Monitores">Games & Monitores</option>
                    <option value="Geral">Geral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Link do Produto (URL)</label>
                <input
                  type="text"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://www.amazon.com.br/dp/..."
                  className="w-full p-2.5 bg-[#080b14] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">URL da Imagem (Opcional)</label>
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://m.media-amazon.com/..."
                  className="w-full p-2.5 bg-[#080b14] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Descrição Comercial</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Ex: Menor preço verificado dos últimos 60 dias..."
                  className="w-full p-2.5 bg-[#080b14] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setNewModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25"
                >
                  Adicionar à Vitrine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
