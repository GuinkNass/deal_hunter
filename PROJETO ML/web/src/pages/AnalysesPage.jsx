import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Search, 
  Filter, 
  Download, 
  LayoutGrid, 
  Table as TableIcon,
  RefreshCw,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Trash2
} from 'lucide-react';
import AnalysisCard from '../components/AnalysisCard';
import { fetchAnalyses, deleteAnalysis } from '../api';

export default function AnalysesPage({ onSelectAnalysis, onOpenManualSearch, onOpenCalculator }) {
  const [analyses, setAnalyses] = useState([]);
  const [total, setTotal] = useState(0);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [store, setStore] = useState('all');
  const [verdict, setVerdict] = useState('all');
  const [sourceType, setSourceType] = useState('all');
  const [sort, setSort] = useState('newest');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

  useEffect(() => {
    loadData();
  }, [store, verdict, sourceType, sort]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetchAnalyses({
        store,
        verdict,
        source_type: sourceType,
        search,
        sort
      });
      if (res.success) {
        setAnalyses(res.data);
        setTotal(res.total);
        if (res.stores) setStores(res.stores);
      }
    } catch (err) {
      console.error('Falha ao carregar análises:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    loadData();
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (!window.confirm('Deseja excluir esta análise?')) return;
    await deleteAnalysis(id);
    setAnalyses(prev => prev.filter(a => a.id !== id));
  }

  // Summary Metrics
  const viableCount = analyses.filter(a => a.verdict === 'Viável').length;
  const attentionCount = analyses.filter(a => a.verdict === 'Atenção').length;
  const avoidCount = analyses.filter(a => a.verdict === 'Evitar').length;
  const avgProfit = analyses.length > 0 
    ? (analyses.reduce((acc, a) => acc + (a.net_profit || 0), 0) / analyses.length).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-6">
      {/* Top Stats Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Oportunidades Viáveis</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">{viableCount}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Margens em Atenção</span>
            <span className="text-2xl font-black text-amber-400 mt-1 block">{attentionCount}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Inviáveis / Evitar</span>
            <span className="text-2xl font-black text-rose-400 mt-1 block">{avoidCount}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Lucro Líquido Médio</span>
            <span className="text-2xl font-black text-cyan-400 mt-1 block">R$ {avgProfit}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por produto ou modelo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 text-xs text-white focus:outline-none"
            />
          </form>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={onOpenManualSearch}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Nova Busca Manual
            </button>

            <a
              href="/api/analyses/export/csv"
              download
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Download className="w-4 h-4" /> Exportar CSV
            </a>

            {/* View switcher */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'
                }`}
                title="Visualização em Cards"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'
                }`}
                title="Visualização em Tabela"
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
              title="Atualizar lista"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 mr-2 font-medium">
            <Filter className="w-3.5 h-3.5" /> Filtros:
          </div>

          <select
            value={store}
            onChange={(e) => setStore(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none"
          >
            <option value="all">Todas as Lojas</option>
            {stores.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={verdict}
            onChange={(e) => setVerdict(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none"
          >
            <option value="all">Todos os Vereditos</option>
            <option value="Viável">Apenas Viáveis</option>
            <option value="Atenção">Apenas Atenção</option>
            <option value="Evitar">Apenas Evitar</option>
          </select>

          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none"
          >
            <option value="all">Todas as Entradas</option>
            <option value="webhook">Webhook (Bots)</option>
            <option value="telegram">Telegram MTProto</option>
            <option value="manual">Busca Manual</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none"
          >
            <option value="newest">Mais Recentes</option>
            <option value="highest_roi">Maior ROI (%)</option>
            <option value="highest_profit">Maior Lucro (R$)</option>
            <option value="oldest">Mais Antigos</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-24 text-center text-slate-500 text-sm">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-400" />
          Carregando oportunidades do ML Radar...
        </div>
      ) : analyses.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 text-cyan-400 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">Nenhuma análise encontrada</h3>
          <p className="text-xs text-slate-400 mt-2 mb-6">
            Não há produtos correspondentes com os filtros atuais. Você pode iniciar uma busca manual agora ou enviar alertas via webhook/Telegram.
          </p>
          <button
            onClick={onOpenManualSearch}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-lg shadow-cyan-600/20"
          >
            Fazer Busca Manual
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {analyses.map(item => (
            <AnalysisCard
              key={item.id}
              analysis={item}
              onSelect={onSelectAnalysis}
              onOpenCalculator={onOpenCalculator}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Produto (Origem)</th>
                  <th className="p-4">Preço Compra</th>
                  <th className="p-4">Preço ML</th>
                  <th className="p-4">Vendas</th>
                  <th className="p-4">Lucro Líquido</th>
                  <th className="p-4">ROI %</th>
                  <th className="p-4">Veredito</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {analyses.map(item => (
                  <tr 
                    key={item.id} 
                    onClick={() => onSelectAnalysis(item)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="p-4 max-w-xs">
                      <div className="font-semibold text-slate-200 truncate">{item.source_title}</div>
                      <span className="text-[10px] text-slate-500">{item.store_name} • {item.source_type}</span>
                    </td>
                    <td className="p-4 font-bold text-white">
                      R$ {Number(item.source_price).toFixed(2)}
                    </td>
                    <td className="p-4 font-bold text-cyan-300">
                      R$ {Number(item.ml_price).toFixed(2)}
                    </td>
                    <td className="p-4 text-slate-300">
                      {item.ml_sold_quantity_text || item.ml_sold_quantity}
                    </td>
                    <td className="p-4 font-black text-emerald-400">
                      R$ {Number(item.net_profit).toFixed(2)}
                    </td>
                    <td className="p-4 font-extrabold text-slate-200">
                      {Number(item.roi_percent).toFixed(1)}%
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        item.verdict === 'Viável' ? 'bg-emerald-500/10 text-emerald-400' :
                        item.verdict === 'Atenção' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-rose-500/10 text-rose-400'
                      }`}>
                        {item.verdict}
                      </span>
                    </td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
