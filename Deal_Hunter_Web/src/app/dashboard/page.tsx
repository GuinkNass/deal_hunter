'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Radar,
  Sparkles,
  TrendingUp,
  Settings,
  RefreshCw,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Send,
  Loader2,
  Layers,
  Calculator,
  Activity,
  PlusCircle,
  Eye,
  LogOut,
  User as UserIcon,
  Zap,
  Trash2,
  CheckSquare,
  Square,
} from 'lucide-react';
import AnalysisDetailModal, { DealAnalysis } from '@/components/ml-radar/AnalysisDetailModal';
import ManualSearchModal from '@/components/ml-radar/ManualSearchModal';
import MarginCalculatorView from '@/components/ml-radar/MarginCalculatorView';
import RobustSettingsView from '@/components/ml-radar/RobustSettingsView';
import StatusView from '@/components/ml-radar/StatusView';
import DealProductCard from '@/components/ml-radar/DealProductCard';
import { getProductFallbackImage } from '@/lib/ml-radar/imageFallback';

export default function DashboardPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Active view tab: 'radar' | 'manual' | 'calculator' | 'settings' | 'status'
  const [activeTab, setActiveTab] = useState<'radar' | 'manual' | 'calculator' | 'settings' | 'status'>('radar');

  // Deals state
  const [deals, setDeals] = useState<DealAnalysis[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStore, setFilterStore] = useState('ALL');
  const [filterVerdict, setFilterVerdict] = useState('ALL');
  const [selectedDealIds, setSelectedDealIds] = useState<string[]>([]);

  // Modals & Interactivity
  const [selectedDealForDetail, setSelectedDealForDetail] = useState<DealAnalysis | null>(null);
  const [calculatorPrefill, setCalculatorPrefill] = useState<any>(null);
  const [manualModalOpen, setManualModalOpen] = useState(false);

  // Simulation & notification
  const [simulating, setSimulating] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'calculator' || tab === 'manual' || tab === 'settings' || tab === 'status' || tab === 'radar') {
        setActiveTab(tab as any);
      }
      if (params.get('ml_connected') === 'true') {
        setNotification('✅ Mercado Livre conectado com sucesso! Token oficial ativo para busca de concorrentes líderes.');
      } else if (params.get('ml_error')) {
        setNotification(`⚠️ Erro ao conectar Mercado Livre: ${params.get('ml_error')}`);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
        return;
      }
      setSessionUser(session.user);
      setAuthToken(session.access_token);
      loadDeals(session.access_token);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/login');
      } else {
        setSessionUser(session.user);
        setAuthToken(session.access_token);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  // Polling automático a cada 30 segundos mantendo o painel sempre atualizado
  useEffect(() => {
    if (!authToken) return;
    const interval = setInterval(() => {
      loadDeals(authToken, false);
    }, 30000);
    return () => clearInterval(interval);
  }, [authToken]);

  async function loadDeals(token: string, showIndicator = true) {
    try {
      if (showIndicator) setRefreshing(true);
      const res = await fetch('/api/ml-radar/deals', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.data)) {
        let items: DealAnalysis[] = data.data;
        if (typeof window !== 'undefined') {
          try {
            const dismissed: string[] = JSON.parse(
              localStorage.getItem('dealhunter_dismissed_deals') || '[]'
            );
            if (dismissed.length > 0) {
              const dismissedSet = new Set(dismissed);
              items = items.filter(
                (d) => !dismissedSet.has(d.id || '') && !dismissedSet.has(d.product_url || '')
              );
            }
          } catch {}
        }
        setDeals(items);
      }
    } catch (err: any) {
      console.error('Erro ao carregar ofertas:', err);
    } finally {
      setLoading(false);
      if (showIndicator) setRefreshing(false);
    }
  }

  function recordDismissed(ids: string[], urls: string[] = []) {
    if (typeof window === 'undefined') return;
    try {
      const dismissed: string[] = JSON.parse(
        localStorage.getItem('dealhunter_dismissed_deals') || '[]'
      );
      for (const id of ids) {
        if (id && !dismissed.includes(id)) dismissed.push(id);
      }
      for (const u of urls) {
        if (u && !dismissed.includes(u)) dismissed.push(u);
      }
      localStorage.setItem('dealhunter_dismissed_deals', JSON.stringify(dismissed));
    } catch {}
  }

  async function handleDeleteSingleDeal(deal: DealAnalysis, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    const dealId = deal.id;
    if (!dealId) return;

    setDeals((prev) => prev.filter((d) => d.id !== dealId));
    setSelectedDealIds((prev) => prev.filter((id) => id !== dealId));
    recordDismissed([dealId], deal.product_url ? [deal.product_url] : []);

    if (authToken) {
      fetch('/api/ml-radar/deals', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ id: dealId }),
      }).catch(() => {});
    }

    setNotification('🗑️ Anúncio excluído do Radar!');
    setTimeout(() => setNotification(null), 3000);
  }

  async function handleDeleteSelectedDeals() {
    if (selectedDealIds.length === 0) return;
    const count = selectedDealIds.length;
    const idsToDelete = [...selectedDealIds];
    const urlsToDelete = deals
      .filter((d) => d.id && idsToDelete.includes(d.id))
      .map((d) => d.product_url)
      .filter(Boolean) as string[];

    setDeals((prev) => prev.filter((d) => !d.id || !idsToDelete.includes(d.id)));
    setSelectedDealIds([]);
    recordDismissed(idsToDelete, urlsToDelete);

    if (authToken) {
      fetch('/api/ml-radar/deals', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ ids: idsToDelete }),
      }).catch(() => {});
    }

    setNotification(`🗑️ ${count} anúncio(s) selecionado(s) excluído(s)!`);
    setTimeout(() => setNotification(null), 3500);
  }

  async function handleDeleteFilteredDeals() {
    if (filteredDeals.length === 0) return;
    const isFiltered = filterStore !== 'ALL' || filterVerdict !== 'ALL' || searchTerm.trim().length > 0;
    const confirmMessage = isFiltered
      ? `Confirma a exclusão de todos os ${filteredDeals.length} anúncios filtrados no radar?`
      : `Confirma a limpeza de todos os ${deals.length} anúncios do radar?`;

    if (!window.confirm(confirmMessage)) return;

    const idsToDelete = filteredDeals.map((d) => d.id).filter(Boolean) as string[];
    const urlsToDelete = filteredDeals.map((d) => d.product_url).filter(Boolean) as string[];

    setDeals((prev) => prev.filter((d) => !d.id || !idsToDelete.includes(d.id)));
    setSelectedDealIds((prev) => prev.filter((id) => !idsToDelete.includes(id)));
    recordDismissed(idsToDelete, urlsToDelete);

    if (authToken) {
      fetch('/api/ml-radar/deals', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ ids: idsToDelete, deleteAll: !isFiltered }),
      }).catch(() => {});
    }

    setNotification(`🗑️ Limpeza em escala concluída: ${idsToDelete.length} anúncio(s) removido(s)!`);
    setTimeout(() => setNotification(null), 3500);
  }

  function handleToggleSelectDeal(dealId: string, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    if (!dealId) return;
    setSelectedDealIds((prev) =>
      prev.includes(dealId) ? prev.filter((id) => id !== dealId) : [...prev, dealId]
    );
  }

  function handleToggleSelectAllFiltered() {
    const allFilteredSelected =
      filteredDeals.length > 0 &&
      filteredDeals.every((d) => d.id && selectedDealIds.includes(d.id));

    if (allFilteredSelected) {
      const filteredIds = new Set(filteredDeals.map((d) => d.id).filter(Boolean) as string[]);
      setSelectedDealIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      const validFilteredIds = filteredDeals.map((d) => d.id).filter(Boolean) as string[];
      const combined = Array.from(new Set([...selectedDealIds, ...validFilteredIds]));
      setSelectedDealIds(combined);
    }
  }

  function handleUpdateDeal(updated: DealAnalysis) {
    setDeals((prev) =>
      prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d))
    );
    setSelectedDealForDetail(updated);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  // Quick Ingest simulation
  async function handleSimulateIngest() {
    if (!sessionUser) return;
    setSimulating(true);
    setNotification(null);

    const sampleDeals = [
      {
        title: 'Echo Dot 5ª Geração Smart Speaker com Alexa Cor Preta',
        price: 249.9,
        originalPrice: 429.0,
        imageUrl: 'https://m.media-amazon.com/images/I/71C8zGss8pL._AC_SL1000_.jpg',
        productUrl: 'https://www.amazon.com.br/dp/B09B8V1LZ3?ref=dh_test',
        store: 'Amazon',
        userId: sessionUser.id,
      },
      {
        title: 'SSD Kingston A400 480GB SATA 3 Leitura 500MBs',
        price: 139.9,
        originalPrice: 219.9,
        imageUrl: 'https://m.media-amazon.com/images/I/51r26zY3nEL._AC_SL1000_.jpg',
        productUrl: 'https://www.amazon.com.br/dp/B079XC5PVV?tag=promos-20',
        store: 'Amazon',
        userId: sessionUser.id,
      },
      {
        title: 'Fritadeira Elétrica Air Fryer Mondial Grand Family 5L Inox',
        price: 269.9,
        originalPrice: 449.9,
        imageUrl: 'https://m.media-amazon.com/images/I/61K-KzP6b2L._AC_SL1000_.jpg',
        productUrl: 'https://www.amazon.com.br/dp/B08HRYF9R8',
        store: 'Amazon',
        userId: sessionUser.id,
      },
    ];

    const pick = sampleDeals[Math.floor(Math.random() * sampleDeals.length)];

    try {
      const res = await fetch('/api/ml-radar/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pick),
      });

      const data = await res.json();
      if (res.ok) {
        setNotification('✅ Nova oportunidade processada e adicionada ao Radar ML!');
        if (authToken) loadDeals(authToken);
      } else {
        setNotification(`Erro na ingestão: ${data.error}`);
      }
    } catch (err: any) {
      setNotification(`Falha: ${err.message}`);
    } finally {
      setSimulating(false);
      setTimeout(() => setNotification(null), 5000);
    }
  }

  function handleOpenCalculatorForDeal(deal: DealAnalysis) {
    setCalculatorPrefill(deal);
    setSelectedDealForDetail(null);
    setActiveTab('calculator');
  }

  function handleManualSearchSuccess(newDeal: any) {
    setNotification('✅ Análise manual concluída e salva no seu histórico do Radar ML!');
    if (newDeal) {
      setDeals((prev) => [newDeal, ...prev.filter((d) => d.id !== newDeal.id)]);
      setSelectedDealForDetail(newDeal);
    }
    setActiveTab('radar');
    if (authToken) loadDeals(authToken);
    setTimeout(() => setNotification(null), 5000);
  }

  const filteredDeals = deals.filter((deal) => {
    const searchLow = searchTerm.toLowerCase();
    const matchesSearch =
      (deal.title && deal.title.toLowerCase().includes(searchLow)) ||
      (deal.ml_title && deal.ml_title.toLowerCase().includes(searchLow)) ||
      (deal.store && deal.store.toLowerCase().includes(searchLow));

    const matchesStore = filterStore === 'ALL' || (deal.store && deal.store.toLowerCase() === filterStore.toLowerCase());
    const matchesVerdict = filterVerdict === 'ALL' || deal.verdict === filterVerdict;

    return matchesSearch && matchesStore && matchesVerdict;
  });

  const viableCount = deals.filter((d) => d.verdict === 'Viável').length;
  const avgRoi =
    deals.length > 0
      ? (deals.reduce((acc, d) => acc + (d.roi_percent || 0), 0) / deals.length).toFixed(1)
      : '0';

  const displayName =
    sessionUser?.user_metadata?.full_name ||
    sessionUser?.user_metadata?.name ||
    sessionUser?.email?.split('@')[0] ||
    sessionUser?.email;

  const avatarUrl =
    sessionUser?.user_metadata?.avatar_url || sessionUser?.user_metadata?.picture;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a12] text-white flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
        <p className="text-sm text-gray-400 font-medium">Carregando Dashboard Deal Hunter Pro...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070a12] text-[#f1f5f9] selection:bg-cyan-500/30 font-sans antialiased">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#080b14]/80 border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Marca Deal Hunter Pro */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-all flex items-center justify-center bg-[#0e1322] p-1 border border-indigo-500/30">
              <img
                src="/images/logo.png"
                alt="Deal Hunter Pro Logo"
                width={40}
                height={40}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg sm:text-xl tracking-tight text-white group-hover:text-cyan-300 transition-colors uppercase">
                Deal Hunter
              </span>
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white rounded-full shadow-sm border border-cyan-400/30">
                Dashboard
              </span>
            </div>
          </Link>

          {/* User actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setManualModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-600/25 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nova Análise</span>
            </button>

            <button
              onClick={handleSimulateIngest}
              disabled={simulating}
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all disabled:opacity-50"
              title="Dispara teste de ingestão"
            >
              {simulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-cyan-400" />}
              <span>Testar Ingestão</span>
            </button>

            <div
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-bold text-emerald-400 select-none"
              title="Sincronização contínua a cada 30 segundos"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Auto-sync 30s</span>
            </div>

            <button
              onClick={() => authToken && loadDeals(authToken, true)}
              disabled={refreshing}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
              title="Atualizar lista agora"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            {/* Profile badge */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-6 h-6 rounded-full object-cover border border-cyan-400" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center border border-cyan-500/40">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                )}
                <span className="text-xs font-bold text-white max-w-[120px] truncate hidden sm:inline">
                  {displayName}
                </span>
              </div>

              <button
                onClick={handleSignOut}
                className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 transition-all"
                title="Encerrar sessão"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/80">
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2.5 no-scrollbar">
            <button
              onClick={() => setActiveTab('radar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === 'radar'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Radar className="w-4 h-4" />
              <span>Radar ML</span>
              <span className="px-1.5 py-0.2 rounded-full bg-cyan-400/20 text-[10px] text-cyan-300">
                {deals.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('manual')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === 'manual'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Análise Manual</span>
            </button>

            <button
              onClick={() => setActiveTab('calculator')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === 'calculator'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Calculadora de Margem</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Configurações & APIs</span>
            </button>

            <button
              onClick={() => setActiveTab('status')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === 'status'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Diagnóstico</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {notification && (
          <div className="p-4 bg-emerald-950/70 border border-emerald-500/40 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs font-medium animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: RADAR DE OFERTAS                                                   */}
        {/* ========================================================================= */}
        {activeTab === 'radar' && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-[#111726] border border-gray-800 space-y-1">
                <p className="text-xs font-semibold text-gray-400">Total de Ofertas no Radar</p>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-black text-white">{deals.length}</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase px-2 py-0.5 rounded bg-gray-800">
                    FIFO 100 itens
                  </span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#111726] border border-emerald-900/40 space-y-1">
                <p className="text-xs font-semibold text-emerald-400">Oportunidades Viáveis</p>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-black text-emerald-300">{viableCount}</span>
                  <span className="text-xs text-emerald-400 font-semibold">
                    {deals.length > 0 ? Math.round((viableCount / deals.length) * 100) : 0}% viabilidade
                  </span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#111726] border border-indigo-900/40 space-y-1">
                <p className="text-xs font-semibold text-indigo-400">ROI Médio Estimado</p>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-black text-indigo-300">{avgRoi}%</span>
                  <TrendingUp className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
            </div>

            {/* Filtros e Busca */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por produto, marca, loja ou palavra-chave..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900/80 border border-gray-800 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <select
                value={filterStore}
                onChange={(e) => setFilterStore(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-gray-900/80 border border-gray-800 text-xs text-gray-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">Todas as Lojas</option>
                <option value="Amazon">Amazon</option>
                <option value="KaBuM!">KaBuM!</option>
                <option value="Magalu">Magalu</option>
                <option value="Shopee">Shopee</option>
                <option value="Shein">Shein</option>
                <option value="Pichau">Pichau</option>
                <option value="Eletroclub">Eletroclub</option>
              </select>

              <select
                value={filterVerdict}
                onChange={(e) => setFilterVerdict(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-gray-900/80 border border-gray-800 text-xs text-gray-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">Todos os Vereditos</option>
                <option value="Viável">Viável</option>
                <option value="Atenção">Atenção</option>
                <option value="Evitar">Evitar</option>
              </select>

              {filteredDeals.length > 0 && (
                <button
                  onClick={handleDeleteFilteredDeals}
                  className="px-3.5 py-2.5 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  title="Excluir todos os anúncios correspondentes ao filtro atual"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Limpar Filtrados ({filteredDeals.length})</span>
                </button>
              )}

              <button
                onClick={() => setManualModalOpen(true)}
                className="sm:hidden w-full py-2.5 rounded-xl bg-cyan-600 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" /> Nova Análise Manual
              </button>
            </div>

            {/* Barra de Seleção e Ações em Lote */}
            {filteredDeals.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0f1422] border border-gray-800/80 text-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleToggleSelectAllFiltered}
                    className="flex items-center gap-2 text-gray-300 hover:text-white font-semibold transition-colors"
                  >
                    {filteredDeals.length > 0 && filteredDeals.every((d) => d.id && selectedDealIds.includes(d.id)) ? (
                      <CheckSquare className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-500" />
                    )}
                    <span>Selecionar Todos ({filteredDeals.length})</span>
                  </button>

                  {selectedDealIds.length > 0 && (
                    <span className="text-cyan-400 font-extrabold px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/40 text-[11px]">
                      {selectedDealIds.length} marcado(s)
                    </span>
                  )}
                </div>

                {selectedDealIds.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDeleteSelectedDeals}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-rose-950/50 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir Selecionados ({selectedDealIds.length})</span>
                    </button>
                    <button
                      onClick={() => setSelectedDealIds([])}
                      className="px-3 py-1.5 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 font-semibold text-xs transition-colors"
                    >
                      Desmarcar
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] text-gray-500 hidden md:inline">
                    Marque cards para exclusão em lote ou use a lixeira individual em cada anúncio
                  </span>
                )}
              </div>
            )}

            {/* Grid de Ofertas */}
            {filteredDeals.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-gray-800 rounded-3xl p-8 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto text-gray-500">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="text-base font-bold text-white">Nenhuma oferta registrada ainda</h3>
                  <p className="text-xs text-gray-400">
                    O Radar ML recebe produtos automaticamente quando promoções atingem seus filtros de ROI,
                    ou você pode realizar uma busca manual clicando em <strong>Nova Análise</strong>.
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-3">
                    <button
                      onClick={() => setManualModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all"
                    >
                      Nova Análise Manual
                    </button>
                    <button
                      onClick={handleSimulateIngest}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
                    >
                      Testar Ingestão de Exemplo
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {filteredDeals.map((deal) => (
                  <DealProductCard
                    key={deal.id || `deal-${deal.product_url}`}
                    deal={deal}
                    isSelected={Boolean(deal.id && selectedDealIds.includes(deal.id))}
                    onToggleSelect={handleToggleSelectDeal}
                    onDelete={handleDeleteSingleDeal}
                    onEvaluate={setSelectedDealForDetail}
                    onOpenCalculator={handleOpenCalculatorForDeal}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ANÁLISE MANUAL                                                     */}
        {/* ========================================================================= */}
        {activeTab === 'manual' && (
          <div className="max-w-2xl mx-auto py-4">
            <div className="p-6 bg-[#111726] border border-gray-800 rounded-3xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight">
                    Análise Manual de Oportunidades
                  </h2>
                  <p className="text-xs text-gray-400">
                    Cole uma URL de produto ou insira nome e custo para rodar o pipeline completo
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setManualModalOpen(true)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-cyan-600/25 transition-all flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>Abrir Painel de Análise Manual</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CALCULADORA DE MARGEM & ROI                                        */}
        {/* ========================================================================= */}
        {activeTab === 'calculator' && (
          <MarginCalculatorView
            initialData={calculatorPrefill}
            isStandalone={true}
            authToken={authToken}
            userId={sessionUser?.id}
          />
        )}

        {/* ========================================================================= */}
        {/* TAB 4: CONFIGURAÇÕES & APIS                                               */}
        {/* ========================================================================= */}
        {activeTab === 'settings' && (
          <RobustSettingsView authToken={authToken} userId={sessionUser?.id} />
        )}

        {/* ========================================================================= */}
        {/* TAB 5: DIAGNÓSTICO & STATUS                                               */}
        {/* ========================================================================= */}
        {activeTab === 'status' && (
          <StatusView dealsCount={deals.length} authToken={authToken} />
        )}
      </main>

      {/* MODAL: Avaliação Clínica ML */}
      {selectedDealForDetail && (
        <AnalysisDetailModal
          analysis={selectedDealForDetail}
          onClose={() => setSelectedDealForDetail(null)}
          onOpenCalculator={handleOpenCalculatorForDeal}
          onUpdateDeal={handleUpdateDeal}
          autoEvaluate={true}
          authToken={authToken}
        />
      )}

      {/* MODAL: Análise Manual */}
      {manualModalOpen && (
        <ManualSearchModal
          onClose={() => setManualModalOpen(false)}
          onSuccess={handleManualSearchSuccess}
          authToken={authToken}
          userId={sessionUser?.id}
        />
      )}
    </div>
  );
}
