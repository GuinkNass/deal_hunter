'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SuccessPage() {
  const [supabase] = useState(() => createClient());
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    });
  }, [supabase]);

  return (
    <div className="min-h-screen bg-[#0a0d14] text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Luzes de fundo / Efeitos visuais */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-orange-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-lg mx-auto relative z-10">
        {/* Card Principal de Sucesso */}
        <div className="bg-[#141923] border border-emerald-500/40 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-emerald-950/40 text-center space-y-6">
          
          {/* Ícone Animado de Sucesso */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-xl shadow-emerald-500/25 animate-in zoom-in-75 duration-300">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Pagamento Confirmado
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Bem-vindo ao Deal Hunter Pro!
            </h1>
            <p className="text-sm text-gray-300 leading-relaxed">
              Sua assinatura foi processada com sucesso. Seu acesso ilimitado para monitorar ofertas e superdescontos em tempo real já está ativo.
            </p>
            {userEmail && (
              <p className="text-xs text-emerald-400/90 font-mono bg-emerald-950/40 py-1.5 px-3 rounded-lg inline-block border border-emerald-500/20">
                Conta: {userEmail}
              </p>
            )}
          </div>

          {/* Guia dos Próximos Passos */}
          <div className="bg-[#0b0e14] border border-gray-800 rounded-2xl p-5 text-left space-y-3">
            <h2 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-400" />
              Como começar a usar agora:
            </h2>
            <ol className="space-y-3 text-xs text-gray-300">
              <li className="flex items-start gap-2.5">
                <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold text-[11px] border border-orange-500/30">
                  1
                </span>
                <span>Abra a extensão <strong>Deal Hunter</strong> no seu navegador Google Chrome.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold text-[11px] border border-orange-500/30">
                  2
                </span>
                <span>
                  No painel da extensão, clique em <strong>Conectar / Login</strong> com o mesmo e-mail utilizado nesta compra para sincronizar o seu plano Pro.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold text-[11px] border border-orange-500/30">
                  3
                </span>
                <span>
                  Pronto! Seu motor de varredura começará a caçar ofertas e enviar notificações no Telegram instantaneamente.
                </span>
              </li>
            </ol>
          </div>

          {/* Botão de Ação */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              href="/login"
              className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all active:scale-[0.99]"
            >
              <span>Ir para o Painel da Conta</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Rodapé Seguro */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Assinatura Gerenciada com Segurança via Stripe</span>
        </div>
      </div>
    </div>
  );
}
