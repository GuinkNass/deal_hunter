'use client';

import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Cpu,
  Key,
  Send,
  Database,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

interface StatusViewProps {
  dealsCount: number;
  authToken?: string | null;
}

export default function StatusView({ dealsCount, authToken }: StatusViewProps) {
  const [testingService, setTestingService] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ service: string; success: boolean; message: string } | null>(null);

  async function handleTest(service: 'mercadolivre' | 'telegram' | 'gemini') {
    setTestingService(service);
    setTestResult(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch('/api/user/settings/test-connection', {
        method: 'POST',
        headers,
        body: JSON.stringify({ service }),
      });
      const json = await res.json();
      setTestResult({
        service,
        success: Boolean(json.success),
        message: json.message || (json.success ? 'Conexão validada!' : 'Falha na conexão.'),
      });
    } catch (err: any) {
      setTestResult({
        service,
        success: false,
        message: err.message || 'Erro de rede.',
      });
    } finally {
      setTestingService(null);
    }
  }

  const fifoPercent = Math.min(100, Math.round((dealsCount / 100) * 100));

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      <div className="flex items-center justify-between bg-[#12151f] border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-tight">
              Status das Integrações & Diagnóstico
            </h1>
            <p className="text-xs text-slate-400">
              Verifique em tempo real a comunicação das APIs conectadas à sua conta
            </p>
          </div>
        </div>
      </div>

      {testResult && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 leading-relaxed animate-in fade-in ${
            testResult.success
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          ) : (
            <XCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ML */}
        <div className="bg-[#12151f] border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <Key className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-white">Mercado Livre</span>
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Ativo
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Catálogo MLB e matching de produtos operacionais para buscas em tempo real.
          </p>

          <button
            onClick={() => handleTest('mercadolivre')}
            disabled={testingService === 'mercadolivre'}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-2"
          >
            {testingService === 'mercadolivre' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>Testar Mercado Livre</span>
          </button>
        </div>

        {/* Telegram */}
        <div className="bg-[#12151f] border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Send className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-white">Telegram Bot</span>
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Saída
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Disparo de oportunidades lucrativas para seu chat ou canal particular.
          </p>

          <button
            onClick={() => handleTest('telegram')}
            disabled={testingService === 'telegram'}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-2"
          >
            {testingService === 'telegram' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>Enviar Teste no Telegram</span>
          </button>
        </div>

        {/* Gemini */}
        <div className="bg-[#12151f] border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Cpu className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-white">Google Gemini</span>
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
              AI Studio
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Inteligência de mercado e scoring de oportunidade executados sob demanda.
          </p>

          <button
            onClick={() => handleTest('gemini')}
            disabled={testingService === 'gemini'}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-2"
          >
            {testingService === 'gemini' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>Testar Gemini AI</span>
          </button>
        </div>
      </div>

      {/* FIFO Storage Meter */}
      <div className="bg-[#12151f] border border-slate-800 p-6 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Armazenamento FIFO de Ofertas (Free Tier)</h3>
              <p className="text-xs text-slate-400">Limite de segurança de 100 ofertas ativas por usuário</p>
            </div>
          </div>

          <span className="text-xs font-bold text-indigo-300">
            {dealsCount} / 100 ({fifoPercent}%)
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${fifoPercent}%` }}
          />
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            Ao ultrapassar 100 itens, o sistema substitui automaticamente as ofertas mais antigas (FIFO)
            para manter o banco leve e 100% gratuito.
          </span>
        </div>
      </div>
    </div>
  );
}
