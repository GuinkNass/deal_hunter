'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  SlidersHorizontal,
  Flame,
  ArrowUpDown,
  Tag,
  Store,
  Sparkles,
  ExternalLink,
  RotateCcw,
  Chrome,
  ShieldCheck,
} from 'lucide-react';
import ShowcaseCard, { ShowcaseDeal } from './ShowcaseCard';
import { MONITORED_STORES } from '@/lib/ml-radar/stores';

interface VitrineClientProps {
  initialDeals: ShowcaseDeal[];
}

export default function VitrineClient({ initialDeals }: VitrineClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'discount' | 'price_asc' | 'price_desc' | 'recent'>('discount');

  // Categorias disponíveis extraídas das ofertas
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const d of initialDeals) {
      if (d.category) set.add(d.category);
    }
    return ['all', ...Array.from(set)];
  }, [initialDeals]);

  // Lojas presentes nas ofertas
  const stores = useMemo(() => {
    const list = [
      { key: 'all', name: 'Todas as Lojas', logo: null },
      { key: 'amazon', name: 'Amazon', logo: MONITORED_STORES.amazon.logo },
      { key: 'kabum', name: 'KaBuM!', logo: MONITORED_STORES.kabum.logo },
      { key: 'magalu', name: 'Magalu', logo: MONITORED_STORES.magalu.logo },
      { key: 'shopee', name: 'Shopee', logo: MONITORED_STORES.shopee.logo },
      { key: 'pichau', name: 'Pichau', logo: MONITORED_STORES.pichau.logo },
      { key: 'eletroclub', name: 'Eletroclub', logo: MONITORED_STORES.eletroclub.logo },
    ];
    return list;
  }, []);

  // Filtragem e ordenação
  const filteredDeals = useMemo(() => {
    let result = [...initialDeals];

    // Busca textual
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d.description && d.description.toLowerCase().includes(q)) ||
          d.store.toLowerCase().includes(q)
      );
    }

    // Filtro por Loja
    if (selectedStore !== 'all') {
      result = result.filter((d) =>
        d.store.toLowerCase().includes(selectedStore.toLowerCase())
      );
    }

    // Filtro por Categoria
    if (selectedCategory !== 'all') {
      result = result.filter((d) => d.category === selectedCategory);
    }

    // Ordenação
    result.sort((a, b) => {
      if (sortBy === 'discount') {
        const discA = a.discount_percent || 0;
        const discB = b.discount_percent || 0;
        return discB - discA;
      }
      if (sortBy === 'price_asc') {
        return a.price - b.price;
      }
      if (sortBy === 'price_desc') {
        return b.price - a.price;
      }
      if (sortBy === 'recent') {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return timeB - timeA;
      }
      return 0;
    });

    return result;
  }, [initialDeals, searchQuery, selectedStore, selectedCategory, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== '' || selectedStore !== 'all' || selectedCategory !== 'all' || sortBy !== 'discount';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedStore('all');
    setSelectedCategory('all');
    setSortBy('discount');
  };

  return (
    <div className="space-y-10">
      {/* ========================================================================= */}
      {/* 1. HERO BANNER / APRESENTAÇÃO DA VITRINE                                   */}
      {/* ========================================================================= */}
      <section className="relative pt-6 pb-4 text-center space-y-4">
        {/* Badge topo */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-950/60 border border-violet-500/30 text-violet-300 text-xs font-bold tracking-widest uppercase backdrop-blur-md shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#d4ff32]" />
          <span>Vitrine Oficial de Ofertas • Curadoria Ativa</span>
        </div>

        {/* Título Principal */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white leading-[1.1] max-w-4xl mx-auto">
          Superdescontos Selecionados <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
            Nos Maiores E-Commerces
          </span>
        </h1>

        {/* Subtítulo */}
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
          Todas as ofertas abaixo foram verificadas e aprovadas pelo algoritmo e curadoria do{' '}
          <strong className="text-white">Deal Hunter Pro</strong>. Clique para acessar o link oficial do produto com o preço promocional ativo.
        </p>
      </section>

      {/* ========================================================================= */}
      {/* 2. BARRA DE PESQUISA, FILTROS E ORDENAÇÃO                                 */}
      {/* ========================================================================= */}
      <section className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#0c101d] border border-white/[0.08] shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Campo de Busca */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por produto, marca ou loja..."
              className="w-full pl-10 pr-4 py-3 bg-[#080b14] border border-slate-800 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/80 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Ordenação */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative w-full md:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full md:w-auto appearance-none pl-3.5 pr-8 py-3 bg-[#080b14] border border-slate-800 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-violet-500/80 transition-colors font-semibold"
              >
                <option value="discount">🔥 Maior Desconto (% OFF)</option>
                <option value="price_asc">💰 Menor Preço (R$)</option>
                <option value="price_desc">💎 Maior Preço (R$)</option>
                <option value="recent">⚡ Mais Recentes</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="p-3 rounded-xl sm:rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white border border-white/10 transition-colors flex items-center justify-center flex-shrink-0"
                title="Limpar todos os filtros"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Pills de Lojas Monitoradas */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Store className="w-3.5 h-3.5 text-violet-400" />
            <span>Filtrar por Loja:</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {stores.map((s) => {
              const active = selectedStore === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setSelectedStore(s.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    active
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                      : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]'
                  }`}
                >
                  {s.logo && (
                    <img src={s.logo} alt="" className="w-3.5 h-3.5 object-contain" />
                  )}
                  <span>{s.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pills de Categorias (se houver mais de uma) */}
        {categories.length > 2 && (
          <div className="space-y-2 pt-1 border-t border-white/[0.05]">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Tag className="w-3.5 h-3.5 text-cyan-400" />
              <span>Categorias:</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => {
                const active = selectedCategory === cat;
                const label = cat === 'all' ? 'Todas as Categorias' : cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                      active
                        ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-bold'
                        : 'bg-white/[0.02] text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Contador de Ofertas Encontradas */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/[0.05]">
          <span className="font-medium">
            Exibindo <strong className="text-white">{filteredDeals.length}</strong> de{' '}
            <strong className="text-white">{initialDeals.length}</strong> ofertas selecionadas
          </span>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-violet-400 hover:underline font-semibold"
            >
              Restaurar filtros
            </button>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. GRID DE OFERTAS DA VITRINE                                             */}
      {/* ========================================================================= */}
      <section>
        {filteredDeals.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#0c101d] border border-white/[0.08] space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-violet-600/10 text-violet-400 mx-auto flex items-center justify-center">
              <Search className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">Nenhuma oferta encontrada</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Não encontramos nenhum produto que coincida com os filtros selecionados no momento.
            </p>
            <button
              onClick={resetFilters}
              className="px-5 py-2.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {filteredDeals.map((deal) => (
              <ShowcaseCard key={deal.id} deal={deal} />
            ))}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 4. BANNER RODAPÉ DE ALERTA TELEGRAM & EXTENSÃO CHROME                    */}
      {/* ========================================================================= */}
      <section className="relative p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-violet-950/80 via-[#0d1222] to-cyan-950/80 border border-violet-500/30 shadow-2xl text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#d4ff32]">
            <Flame className="w-4 h-4 fill-[#d4ff32]" />
            <span>Alertas em Tempo Real no Telegram</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight">
            Não perca nenhum bug de preço antes de esgotar
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            Instale a extensão oficial do <strong className="text-white">Deal Hunter Pro</strong> no seu Google Chrome para monitorar seus produtos favoritos e receber alertas no segundo exato em que o desconto acontecer.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0 w-full sm:w-auto">
          <a
            href="https://chromewebstore.google.com/detail/gdnmfnoccdcbpcnaafjcoapgmihmgbdo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-[#d4ff32] hover:bg-[#c3f01c] text-black font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl shadow-[#d4ff32]/25 hover:-translate-y-0.5 active:scale-[0.98] transition-all"
          >
            <Chrome className="w-4 h-4" />
            <span>Usar no Chrome</span>
          </a>
          <Link
            href="/#planos"
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-white font-bold text-xs sm:text-sm uppercase tracking-wider transition-all"
          >
            <span>Ver Planos</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
