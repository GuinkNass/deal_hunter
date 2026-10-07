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

function ChromeIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        fill="#EA4335"
        d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0z"
      />
      <path
        fill="#34A853"
        d="M1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29z"
      />
      <path
        fill="#FBBC05"
        d="M15.273 7.478a5.449 5.449 0 0 1 2.182 6.865l-5.345 9.258C12.115 23.805 12.058 24 12 24c6.627 0 12-5.373 12-12 0-1.54-.29-3.011-.818-4.364z"
      />
      <circle cx="12" cy="12" r="5.455" fill="#FFFFFF" />
      <circle cx="12" cy="12" r="4.364" fill="#1A73E8" />
    </svg>
  );
}

export default function PaginaSucesso() {
  const [supabase] = useState(() => createClient());
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const chromeWebStoreUrl =
    'https://chromewebstore.google.com/detail/gdnmfnoccdcbpcnaafjcoapgmihmgbdo';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    });
  }, [supabase]);

  function copyDownloadLink() {
    navigator.clipboard.writeText(chromeWebStoreUrl);
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

          {/* Downloads das Extensões em Destaque */}
          <div className="space-y-4">
            {/* Extensão 1: Deal Hunter Pro */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-[#141b2b] to-[#111726] border border-cyan-500/40 text-left space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                  <ChromeIcon className="w-4 h-4" />
                  <span>1. Deal Hunter Pro (Chrome Web Store Oficial)</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Verificada pelo Google
                </span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Extensão oficial aprovada pelo Google. Instale com 1 clique direto no seu navegador Chrome, Edge ou Brave:
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <a
                  href={chromeWebStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      if (typeof (window as any).gtag_report_conversion === 'function') {
                        (window as any).gtag_report_conversion();
                      } else if (typeof (window as any).gtag === 'function') {
                        (window as any).gtag('event', 'conversion', {
                          send_to: 'AW-18485467530/VsKeCObcyZQdEIqzx-5E',
                        });
                      }
                    }
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all"
                >
                  <ChromeIcon className="w-4 h-4" />
                  <span>Instalar via Chrome Web Store</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <button
                  onClick={copyDownloadLink}
                  className="px-4 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-gray-300 transition-all flex items-center justify-center gap-2"
                  title="Copiar link da Chrome Web Store"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Link Copiado!' : 'Copiar Link'}</span>
                </button>
              </div>
            </div>

            {/* Extensão 2: Profit Hunter Pro (Bônus) */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-[#18122c] to-[#120f22] border border-violet-500/40 text-left space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-violet-300">
                  <img
                    src="/images/profit-hunter-logo.png"
                    alt="Profit Hunter Pro"
                    className="w-5 h-5 object-contain drop-shadow-[0_1px_4px_rgba(139,92,246,0.6)]"
                  />
                  <span>2. Bônus: Profit Hunter Pro (.ZIP)</span>
                </div>
                <span className="text-[10px] font-bold text-violet-300 bg-violet-950/80 border border-violet-500/30 px-2 py-0.5 rounded-full">
                  Captura na Tela
                </span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Injeta um botão flutuante inteligente em qualquer e-commerce para capturar produtos da tela com 1 clique:
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <a
                  href="/downloads/profit-hunter-pro.zip"
                  download="Profit_Hunter_Cliente.zip"
                  className="flex-1 inline-flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-violet-600/25 active:scale-[0.98] transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Bônus: Profit Hunter (.ZIP)</span>
                </a>
              </div>
            </div>
          </div>

          {/* Guia Rápido de 3 Passos */}
          <div className="bg-[#0b0e15] border border-gray-800/80 rounded-2xl p-5 text-left space-y-3">
            <h2 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              Como começar a caçar ofertas agora:
            </h2>
            <ol className="space-y-3 text-xs text-gray-300">
              <li className="flex items-start gap-2.5">
                <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[11px] border border-emerald-500/30">
                  1
                </span>
                <span>
                  Clique no botão <strong>Instalar via Chrome Web Store</strong> acima e depois em <strong>&ldquo;Usar no Chrome&rdquo;</strong> (ou &ldquo;Adicionar ao Chrome&rdquo;).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[11px] border border-emerald-500/30">
                  2
                </span>
                <span>
                  No Chrome, clique no ícone de <strong>quebra-cabeça (Extensões)</strong> e fixe o <strong>Deal Hunter Pro</strong> na barra de ferramentas para fácil acesso.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[11px] border border-emerald-500/30">
                  3
                </span>
                <span>
                  Abra a extensão e faça login com a conta vinculada ({userEmail || 'seu e-mail'}). A ativação é 100% imediata e os alertas já começam a rodar!
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
