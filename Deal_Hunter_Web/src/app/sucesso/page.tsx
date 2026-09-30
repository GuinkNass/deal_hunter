'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Download,
  Flame,
  Laptop,
  Copy,
  Check,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function PaginaSucesso() {
  const [supabase] = useState(() => createClient());
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    });
  }, [supabase]);

  function copyDownloadLink() {
    navigator.clipboard.writeText(window.location.origin + '/downloads/deal-hunter-pro.zip');
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-[#f1f5f9] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Luzes de fundo / Efeitos visuais */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-emerald-500/10 blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[450px] h-[450px] bg-orange-500/10 blur-[130px] rounded-full pointer-events-none -z-10" />

      <div className="w-full max-w-xl mx-auto relative z-10 space-y-6">
        
        {/* Header / Brand */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#0d131f] border border-cyan-500/30 flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform shadow-lg shadow-cyan-500/10">
              <img src="/images/logo.png" alt="Deal Hunter Pro Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-extrabold text-lg text-white tracking-tight group-hover:text-cyan-300 transition-colors">Deal Hunter Pro</span>
          </Link>
        </div>

        {/* Card Principal de Sucesso */}
        <div className="bg-[#10141f] border-2 border-emerald-500/40 rounded-3xl p-7 sm:p-10 shadow-2xl shadow-emerald-950/40 text-center space-y-6 backdrop-blur-xl">
          
          {/* Ícone Animado de Sucesso */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-xl shadow-emerald-500/25 animate-in zoom-in-75 duration-300">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Pagamento Confirmado com Sucesso!
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Sua Licença Deal Hunter Pro está Ativa
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-md mx-auto">
              Obrigado por confiar no Deal Hunter Pro. Seu acesso aos alertas e varreduras automáticas de preços em tempo real foi liberado!
            </p>
            {userEmail && (
              <p className="text-xs text-emerald-300 font-mono bg-emerald-950/40 py-1.5 px-3 rounded-lg inline-block border border-emerald-500/30">
                Conta vinculada: {userEmail}
              </p>
            )}
          </div>

          {/* Botão de Download Principal em Destaque */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-[#141b2b] to-[#111726] border border-orange-500/30 text-left space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400">
                <Laptop className="w-4 h-4" />
                <span>Arquivo da Extensão (.ZIP)</span>
              </div>
              <span className="text-[10px] font-bold text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">
                Versão 2.9 · Chrome &amp; Edge
              </span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Caso ainda não tenha instalado no seu navegador, baixe o pacote pronto com todas as dependências pré-instaladas:
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <a
                href="/downloads/deal-hunter-pro.zip"
                download="Deal_Hunter_Cliente.zip"
                className="flex-1 inline-flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Descarregar Extensão (.ZIP)</span>
              </a>
              <button
                type="button"
                onClick={copyDownloadLink}
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 text-xs font-medium border border-gray-700 transition-colors"
                title="Copiar link de download"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Link copiado!' : 'Copiar link'}</span>
              </button>
            </div>
          </div>

          {/* Guia Rápido de 3 Passos */}
          <div className="bg-[#0b0e15] border border-gray-800/80 rounded-2xl p-5 text-left space-y-3">
            <h2 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-400" />
              Como começar a caçar ofertas agora:
            </h2>
            <ol className="space-y-3 text-xs text-gray-300">
              <li className="flex items-start gap-2.5">
                <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold text-[11px] border border-orange-500/30">
                  1
                </span>
                <span>
                  <strong>Extraia o arquivo .zip</strong> baixado em uma pasta de sua preferência no computador.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold text-[11px] border border-orange-500/30">
                  2
                </span>
                <span>
                  No Chrome ou Edge, acesse <code>chrome://extensions</code>, ative o <strong>Modo do Desenvolvedor</strong> e clique em <strong>Carregar sem compactação</strong> selecionando a pasta <strong>Extensao</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold text-[11px] border border-orange-500/30">
                  3
                </span>
                <span>
                  Abra a extensão pelo ícone do navegador e clique em <strong>Fazer Login</strong>. A conexão com a nuvem é 100% automática!
                </span>
              </li>
            </ol>
          </div>

          {/* Atalho para o Painel Web / Login */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              href="/login"
              className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs sm:text-sm border border-gray-700 transition-all active:scale-[0.99]"
            >
              <span>Acessar Painel da Conta</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Rodapé Seguro */}
        <div className="text-center text-xs text-gray-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Pagamento Protegido e Conectado via InfinitePay &amp; Stripe</span>
        </div>
      </div>
    </div>
  );
}
