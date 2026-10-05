import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Layers, 
  Send, 
  Cpu, 
  Key, 
  ShieldCheck,
  Clock,
  ExternalLink
} from 'lucide-react';
import { fetchStatus, testConnection } from '../api';

export default function StatusPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testingService, setTestingService] = useState(null);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    setLoading(true);
    try {
      const res = await fetchStatus();
      if (res.success) {
        setStatus(res.data);
      }
    } catch (err) {
      console.error('Falha ao carregar status:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleTest(service) {
    setTestingService(service);
    setTestResult(null);
    try {
      const res = await testConnection(service);
      setTestResult({ service, ...res });
      // Reload status to sync
      loadStatus();
    } catch (err) {
      setTestResult({ service, success: false, message: err.message });
    } finally {
      setTestingService(null);
    }
  }

  if (loading && !status) {
    return (
      <div className="py-24 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-400" />
        Consultando integridade do sistema...
      </div>
    );
  }

  const integrations = status?.integrations || {};
  const queue = status?.queue || {};
  const stats = status?.stats || {};

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#12151f] border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Status das Integrações & Sistema</h1>
            <p className="text-xs text-slate-400">Diagnóstico em tempo real das conexões de API e filas</p>
          </div>
        </div>

        <button
          onClick={loadStatus}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Atualizar
        </button>
      </div>

      {testResult && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2.5 leading-relaxed animate-fadeIn ${
          testResult.success 
            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' 
            : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
        }`}>
          {testResult.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" /> : <XCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />}
          <span>{testResult.message || (testResult.success ? 'Conexão validada com sucesso!' : 'Falha na conexão.')}</span>
        </div>
      )}

      {/* Integration Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mercado Livre */}
        <div className="bg-[#12151f] border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Mercado Livre API (MLB)</h3>
              </div>

              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                integrations.mercadolivre?.connected 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                  : integrations.mercadolivre?.publicReachable
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}>
                {integrations.mercadolivre?.statusLabel || 'Operacional (Busca MLB Ativa)'}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {integrations.mercadolivre?.connected 
                ? 'Token OAuth2 ativo com auto-refresh automático.' 
                : 'A API pública e de catálogo do Mercado Livre está operacional. Suas buscas e cálculos funcionam diretamente. Para vincular sua conta de vendedor particular, use o botão "Conectar Mercado Livre" em Configurações.'}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs">
            <span className="text-slate-500">Ping MLB: {integrations.mercadolivre?.publicReachable ? '✅ Respondendo' : '❌ Inacessível'}</span>
            <button
              onClick={() => handleTest('mercadolivre')}
              disabled={testingService === 'mercadolivre'}
              className="font-bold text-cyan-400 hover:text-cyan-300"
            >
              {testingService === 'mercadolivre' ? 'Testando...' : 'Testar Conexão'}
            </button>
          </div>
        </div>

        {/* Telegram Out (Bot de Saída) */}
        <div className="bg-[#12151f] border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">Bot Notificador Telegram (Saída)</h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                integrations.telegram_out?.configured ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
              }`}>
                {integrations.telegram_out?.configured ? 'Token Configurado' : 'Pendente de Configuração'}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {integrations.telegram_out?.configured 
                ? `Bot configurado. Chat ID de destino: ${integrations.telegram_out?.chatIdConfigured ? 'Definido' : 'Pendente de preenchimento'}` 
                : 'Crie um bot no @BotFather no Telegram para receber os cards de oportunidade diretamente no seu chat ou canal.'}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-end">
            <button
              onClick={() => handleTest('telegram_out')}
              disabled={testingService === 'telegram_out'}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300"
            >
              {testingService === 'telegram_out' ? 'Testando...' : 'Enviar Mensagem de Teste'}
            </button>
          </div>
        </div>

        {/* Telegram In / Webhook */}
        <div className="bg-[#12151f] border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Entrada de Alertas (Webhook)</h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                integrations.telegram_in?.webhookAlertsReceived > 0 
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {integrations.telegram_in?.webhookAlertsReceived > 0 
                  ? `Ativo (${integrations.telegram_in?.webhookAlertsReceived} alertas recebidos)` 
                  : 'Aguardando Primeiro Alerta'}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Endpoint: <code className="bg-[#0b0d13] px-1.5 py-0.5 rounded text-cyan-300">POST /api/ingest</code> com header <code className="bg-[#0b0d13] px-1.5 py-0.5 rounded text-slate-300">x-api-key</code>. Envie JSON contendo nome, url e preco.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-end">
            <button
              onClick={() => handleTest('telegram_in')}
              disabled={testingService === 'telegram_in'}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300"
            >
              {testingService === 'telegram_in' ? 'Testando...' : 'Verificar Endpoint'}
            </button>
          </div>
        </div>

        {/* Google Gemini */}
        <div className="bg-[#12151f] border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-sm text-white">Google Gemini (AI Studio)</h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                integrations.gemini?.hasKey 
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : 'bg-amber-500/10 text-amber-400'
              }`}>
                {integrations.gemini?.hasKey ? 'Chave Inserida' : 'Sem Chave (Fallback Padrão Ativo)'}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {integrations.gemini?.hasKey
                ? `Modelo: ${integrations.gemini?.model || 'gemini-1.5-flash'}. Clique abaixo para verificar conexão com os servidores do Google.`
                : 'Você pode usar o sistema normalmente ou adicionar sua chave gratuita em aistudio.google.com/apikey para enriquecer as análises com pareceres de IA.'}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs">
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-slate-300 inline-flex items-center gap-1"
            >
              Gerar Chave Grátis <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={() => handleTest('gemini')}
              disabled={testingService === 'gemini'}
              className="font-bold text-cyan-400 hover:text-cyan-300"
            >
              {testingService === 'gemini' ? 'Testando...' : 'Testar Conexão Gemini'}
            </button>
          </div>
        </div>
      </div>

      {/* Queue & Performance */}
      <div className="bg-[#12151f] border border-slate-800 p-6 rounded-2xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-400" /> Fila de Processamento & Métricas do Banco
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-[#0b0d13] p-4 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 block">Itens na Fila</span>
            <span className="text-2xl font-black text-white mt-1 block">{queue.queueLength || 0}</span>
          </div>

          <div className="bg-[#0b0d13] p-4 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 block">Workers Concorrentes</span>
            <span className="text-2xl font-black text-cyan-400 mt-1 block">{queue.activeWorkers || 0} / {queue.maxConcurrency || 2}</span>
          </div>

          <div className="bg-[#0b0d13] p-4 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 block">Total de Alertas Salvos</span>
            <span className="text-2xl font-black text-white mt-1 block">{stats.totalAnalyses || 0}</span>
          </div>

          <div className="bg-[#0b0d13] p-4 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 block">Último Alerta</span>
            <span className="text-sm font-bold text-slate-300 mt-2 block truncate">
              {stats.lastAnalysisAt ? new Date(stats.lastAnalysisAt).toLocaleTimeString('pt-BR') : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
