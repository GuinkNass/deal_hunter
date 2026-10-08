'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Radar,
  Calculator,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import LanguageCurrencySelector from '@/components/LanguageCurrencySelector';
import { useLanguageCurrency } from '@/contexts/LanguageCurrencyContext';

export default function Navbar() {
  const { t } = useLanguageCurrency();
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // 1. Buscar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // 2. Escutar mudanças de autenticação (login/logout/token refresh) em tempo real
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Erro ao conectar com Google:', err);
      setGoogleLoading(false);
    }
  }

  async function handleSignOut() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setUser(null);
    } catch (err: any) {
      console.error('Erro ao encerrar sessão:', err);
    }
  }

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    user?.email;

  const avatarUrl =
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#080b14]/50 border-b border-white/[0.08] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo & Marca */}
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
            <span className="font-black text-lg sm:text-xl tracking-tight text-white group-hover:text-indigo-300 transition-colors uppercase">
              Deal Hunter
            </span>
            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full shadow-sm border border-indigo-400/30">
              Pro
            </span>
          </div>
        </Link>

        {/* Links de Navegação Desktop: Vitrine, Documentação, Recursos, Planos, Suporte */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-7 text-xs font-semibold uppercase tracking-wider text-gray-300">
          <Link
            href="/ofertas"
            className="hover:text-cyan-300 text-cyan-400 font-black transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>{t('nav.showcase')}</span>
          </Link>
          <Link
            href="/docs"
            className="hover:text-white text-slate-200 font-bold transition-colors flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-cyan-400/40"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t('nav.docs')}</span>
          </Link>
          <a href="/#recursos" className="hover:text-white transition-colors">
            {t('nav.features')}
          </a>
          <a href="/#planos" className="hover:text-white transition-colors">
            {t('nav.pricing')}
          </a>
          <a
            href="mailto:guilherme.r.nascimentoml@gmail.com?subject=Suporte%20Deal%20Hunter%20Pro"
            className="hover:text-white text-emerald-400 transition-colors flex items-center gap-1 normal-case"
          >
            {t('nav.support')}
          </a>
        </nav>

        {/* CTAs Header Desktop */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Seletor Global de Idioma e Moeda */}
          <LanguageCurrencySelector />

          {user ? (
            /* ================= USUÁRIO LOGADO ================= */
            <div className="flex items-center gap-2.5">
              {/* Botão DASHBOARD */}
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:-translate-y-0.5 transition-all active:scale-[0.98]"
              >
                <Radar className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
                <span>{t('nav.dashboard')}</span>
              </Link>

              {/* Foto & Nome do Usuário */}
              <Link
                href="/settings"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 hover:border-white/20 transition-all group"
                title={user.email}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-5 h-5 rounded-full object-cover border border-emerald-400"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-500/40">
                    <UserIcon className="w-3 h-3" />
                  </div>
                )}
                <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors max-w-[110px] truncate">
                  {displayName}
                </span>
              </Link>

              {/* Atalho Calculadora */}
              <Link
                href="/dashboard?tab=calculator"
                className="text-xs font-semibold uppercase tracking-wider text-gray-300 hover:text-white px-2.5 py-1.5 rounded-xl hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-colors flex items-center gap-1.5"
              >
                <Calculator className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t('nav.calculator')}</span>
              </Link>

              {/* Sair */}
              <button
                onClick={handleSignOut}
                className="text-xs font-semibold text-gray-400 hover:text-red-400 px-2.5 py-1.5 rounded-xl hover:bg-red-950/20 border border-transparent hover:border-red-900/30 transition-all flex items-center gap-1.5"
                title="Encerrar sessão"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('nav.logout')}</span>
              </button>
            </div>
          ) : (
            /* ================= USUÁRIO NÃO LOGADO ================= */
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-bold text-xs transition-all shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{googleLoading ? '...' : 'Google'}</span>
              </button>

              <Link
                href="/login"
                className="text-xs font-semibold uppercase tracking-wider text-gray-300 hover:text-white px-2 py-2 transition-colors"
              >
                {t('nav.members')}
              </Link>

              <a
                href="/#planos"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-0.5 transition-all active:scale-[0.98]"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{t('nav.try_free')}</span>
              </a>
            </div>
          )}
        </div>

        {/* Botão Mobile */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg focus:outline-none"
          aria-label="Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Menu Mobile Retrátil */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0a0d14] border-b border-gray-800 px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-3 duration-200">
          <div className="pb-2 border-b border-slate-800 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400">Preferências:</span>
            <LanguageCurrencySelector />
          </div>

          <div className="flex flex-col space-y-3 text-sm font-medium text-gray-300">
            <Link
              href="/ofertas"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-cyan-400 font-bold hover:text-white flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>{t('nav.showcase')}</span>
            </Link>
            <Link
              href="/docs"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-white font-bold hover:text-cyan-300 flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>{t('nav.docs')}</span>
            </Link>
            <a
              href="/#recursos"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              {t('nav.features')}
            </a>
            <a
              href="/#planos"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              {t('nav.pricing')}
            </a>
            <a
              href="mailto:guilherme.r.nascimentoml@gmail.com?subject=Suporte%20Deal%20Hunter%20Pro"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-emerald-400 hover:text-white"
            >
              Suporte Técnico
            </a>
          </div>

          <div className="pt-3 border-t border-gray-800/80 flex flex-col gap-2.5">
            {user ? (
              /* Menu Mobile Logado */
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-[#111724] border border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="w-9 h-9 rounded-full object-cover border border-emerald-500/60"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-orange-500/20 text-orange-400 font-bold text-sm flex items-center justify-center border border-orange-500/40">
                        <UserIcon className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-white max-w-[160px] truncate">
                        {displayName}
                      </p>
                      <p className="text-[10px] text-emerald-400 font-medium truncate max-w-[160px]">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="text-xs font-semibold text-red-400 hover:text-red-300 p-2 rounded-xl bg-red-950/20 border border-red-900/30 transition-colors flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sair</span>
                  </button>
                </div>

                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 border border-cyan-400/40 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2"
                >
                  <Radar className="w-4 h-4 text-cyan-200 animate-pulse" />
                  <span>Acessar Dashboard</span>
                </Link>
                <Link
                  href="/dashboard?tab=calculator"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl border border-gray-700 text-xs font-semibold text-gray-200 flex items-center justify-center gap-2"
                >
                  <Calculator className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Calculadora de Margem</span>
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl border border-gray-700 text-xs font-semibold text-gray-200 block"
                >
                  ⚙️ Configurações & APIs
                </Link>
              </div>
            ) : (
              /* Menu Mobile Deslogado */
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleGoogleLogin();
                  }}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-semibold text-xs shadow-md active:scale-[0.98]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{googleLoading ? 'Conectando...' : 'Continuar com o Google'}</span>
                </button>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl border border-gray-700 text-xs font-semibold text-gray-200"
                >
                  Área de Membros / Login
                </Link>
                <a
                  href="/#planos"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-500/20"
                >
                  Testar 7 Dias Grátis
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
