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
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Send,
  Loader2,
  Layers,
} from 'lucide-react';

interface Deal {
  id: string;
  user_id: string;
  title: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  product_url: string;
  store: string;
  ml_title: string | null;
  ml_price: number | null;
  ml_url: string | null;
  ml_image_url: string | null;
  net_profit: number | null;
  roi_percent: number | null;
  margin_percent: number | null;
  verdict: string | null;
  gemini_analysis: any;
  created_at: string;
}

export default function MLRadarPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStore, setFilterStore] = useState('ALL');
  const [filterVerdict, setFilterVerdict] = useState('ALL');
  const [simulating, setSimulating] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
        return;
      }
      setSessionUser(session.user);
      setAuthToken(session.access_token);
      loadDeals(session.access_token);
    });
  }, [supabase, router]);

  async function loadDeals(token: string) {
    try {
      setRefreshing(true);
      const res = await fetch('/api/ml-radar/deals', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.data)) {
        setDeals(data.data);
      }
    } catch (err: any) {
      console.error('Erro ao carregar ofertas:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Simulação rápida para o usuário testar a ingestão sob demanda
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
        setNotification('✅ Nova oportunidade processada e adicionada ao ML Radar!');
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

  const filteredDeals = deals.filter((deal) => {
    const matchesSearch =
      deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (deal.ml_title && deal.ml_title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      deal.store.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStore = filterStore === 'ALL' || deal.store.toLowerCase() === filterStore.toLowerCase();
    const matchesVerdict = filterVerdict === 'ALL' || deal.verdict === filterVerdict;

    return matchesSearch && matchesStore && matchesVerdict;
  });

  const viableCount = deals.filter((d) => d.verdict === 'Viável').length;
  const avgRoi = deals.length > 0 ? (deals.reduce((acc, d) => acc + (d.roi_percent || 0), 0) / deals.length).toFixed(1) : '0';

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <p className="text-sm text-gray-400 font-medium">Carregando painel do ML Radar...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#0c101c] rounded-[14px] flex items-center justify-center text-cyan-400">
              <Radar className="w-6 h-6 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white uppercase tracking-tight">ML Radar</h1>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase border border-cyan-500/30">
                PRO
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Varredura de oportunidades, viabilidade financeira e match inteligente no Mercado Livre
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleSimulateIngest}
            disabled={simulating}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-200 text-xs font-bold border border-gray-700 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
          >
            {simulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-cyan-400" />}
            <span>Testar Ingestão</span>
          </button>

          <button
            onClick={() => authToken && loadDeals(authToken)}
            disabled={refreshing}
            className="p-2 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-200 border border-gray-700 transition-all"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <Link
            href="/settings"
            className="px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configurações</span>
          </Link>
        </div>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-500/40 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs font-medium animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#111726] border border-gray-800 space-y-1">
          <p className="text-xs font-semibold text-gray-400">Total de Ofertas no Radar</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">{deals.length}</span>
            <span className="text-[10px] text-gray-500 font-bold uppercase">FIFO (Máx 100)</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#111726] border border-emerald-900/40 space-y-1">
          <p className="text-xs font-semibold text-emerald-400">Oportunidades Viáveis</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-300">{viableCount}</span>
            <span className="text-xs text-emerald-400 font-semibold">
              {deals.length > 0 ? Math.round((viableCount / deals.length) * 100) : 0}% viabilidade
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#111726] border border-indigo-900/40 space-y-1">
          <p className="text-xs font-semibold text-indigo-400">ROI Médio Estimado</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-indigo-300">{avgRoi}%</span>
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
            placeholder="Buscar por produto, loja ou palavra-chave..."
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
      </div>

      {/* Grid de Ofertas */}
      {filteredDeals.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-gray-800 rounded-3xl p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto text-gray-500">
            <Layers className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-white">Nenhuma oferta registrada ainda</h3>
            <p className="text-xs text-gray-400">
              O ML Radar é alimentado automaticamente pelo backend do Deal Hunter Pro assim que uma promoção atinge seus filtros ou você pode clicar no botão <strong>Testar Ingestão</strong> acima.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredDeals.map((deal) => {
            const isViable = deal.verdict === 'Viável';
            const isAttention = deal.verdict === 'Atenção';

            return (
              <div
                key={deal.id}
                className="bg-[#101420] border border-gray-800/80 hover:border-gray-700 rounded-3xl p-5 shadow-lg flex flex-col justify-between space-y-4 transition-all"
              >
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-white/[0.06] text-gray-300 text-[10px] font-bold border border-white/10 uppercase">
                      {deal.store}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                        isViable
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : isAttention
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-red-500/20 text-red-300 border-red-500/30'
                      }`}
                    >
                      {deal.verdict || 'Análise'}
                    </span>
                  </div>

                  <span className="text-[10px] text-gray-500 font-medium">
                    {new Date(deal.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Conteúdo Principal (Origem vs Mercado Livre) */}
                <div className="flex gap-4">
                  {deal.image_url && (
                    <div className="w-20 h-20 rounded-2xl bg-black/40 border border-gray-800 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      <img src={deal.image_url} alt={deal.title} className="w-full h-full object-contain" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-1">
                    <h4 className="text-xs font-bold text-white line-clamp-2">{deal.title}</h4>
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-black text-cyan-400">
                        R$ {Number(deal.price).toFixed(2)}
                      </span>
                      {deal.original_price && deal.original_price > deal.price && (
                        <span className="text-[11px] text-gray-500 line-through">
                          R$ {Number(deal.original_price).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Match no Mercado Livre */}
                <div className="p-3.5 rounded-2xl bg-[#090d16] border border-gray-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-400">Preço de Venda no ML:</span>
                    <span className="font-black text-emerald-400">
                      R$ {Number(deal.ml_price || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-800/60 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-500 block">Lucro Líquido:</span>
                      <span className="font-bold text-white">R$ {Number(deal.net_profit || 0).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">ROI Projetado:</span>
                      <span className="font-bold text-indigo-400">{Number(deal.roi_percent || 0).toFixed(1)}%</span>
                    </div>
                  </div>

                  {deal.gemini_analysis && (
                    <div className="mt-2 pt-2 border-t border-gray-800/60 flex items-start gap-1.5 text-[11px] text-violet-300">
                      <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-violet-400 mt-0.5" />
                      <p className="line-clamp-2">{deal.gemini_analysis.justification || deal.gemini_analysis.verdict}</p>
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={deal.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Ver na Loja</span>
                    <ExternalLink className="w-3 h-3 text-gray-400" />
                  </a>

                  {deal.ml_url && (
                    <a
                      href={deal.ml_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Ver no ML</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
