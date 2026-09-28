'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck, ArrowRight, CheckCircle2, Lock, Sparkles, RefreshCw, Mail, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [extensionSynced, setExtensionSynced] = useState(false);
  const [verifyingLicense, setVerifyingLicense] = useState(false);
  const [licenseInfo, setLicenseInfo] = useState<any>(null);
  const [isCheckoutSuccess, setIsCheckoutSuccess] = useState(false);

  const extensionId = process.env.NEXT_PUBLIC_EXTENSION_ID || 'lenaiemkaapkamkpbpdppmfblbpghhnc';

  // 1. Monitora sessão ativa do Supabase e parâmetros da URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('checkout') === 'success') {
        setIsCheckoutSuccess(true);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handlePostAuth(session.access_token, session.user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        handlePostAuth(session.access_token, session.user);
      } else {
        setSessionUser(null);
        setExtensionSynced(false);
        setLicenseInfo(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // 2. Rotina pós-autenticação: Valida licença e comunica com a Extensão do Chrome
  async function handlePostAuth(token: string, user: any) {
    setSessionUser(user);
    setVerifyingLicense(true);
    setErrorMessage(null);

    try {
      // Consulta a API de verificação de licença
      const response = await fetch('/api/auth/verify-license', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setLicenseInfo(data);

      // Comunica com a Extensão do Chrome via runtime.sendMessage externo
      syncWithExtension(token, user, data);
    } catch (err: any) {
      console.error('Erro ao verificar licença:', err);
      setErrorMessage('Não foi possível verificar o status da licença no momento.');
    } finally {
      setVerifyingLicense(false);
    }
  }

  function syncWithExtension(token: string, user: any, license: any) {
    if (typeof window !== 'undefined' && (window as any).chrome?.runtime?.sendMessage && extensionId) {
      try {
        (window as any).chrome.runtime.sendMessage(
          extensionId,
          {
            type: 'AUTH_SUCCESS',
            token,
            user: {
              id: user.id,
              email: user.email,
            },
            license,
          },
          (response: any) => {
            if ((window as any).chrome.runtime.lastError) {
              console.warn('Extensão não alcançada via sendMessage:', (window as any).chrome.runtime.lastError.message);
              setExtensionSynced(false);
            } else if (response?.success) {
              setExtensionSynced(true);
            }
          }
        );
      } catch (err) {
        console.warn('Erro ao chamar chrome.runtime.sendMessage:', err);
      }
    }
  }

  // 3. Login com Google OAuth
  async function handleGoogleLogin() {
    setLoading(true);
    setErrorMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao conectar com Google.');
      setLoading(false);
    }
  }

  // 4. Login / Cadastro com E-mail e Senha
  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const emailRedirectTo = typeof window !== 'undefined'
          ? `${window.location.origin}/login`
          : undefined;

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo,
          },
        });
        if (error) throw error;
        if (data.session) {
          setMessage('Cadastro realizado com sucesso!');
        } else {
          setMessage('Confirmação enviada! Verifique sua caixa de entrada.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro na autenticação.');
    } finally {
      setLoading(false);
    }
  }

  // 5. Iniciar Assinatura no Stripe
  async function handleCheckout() {
    setLoading(true);
    setErrorMessage(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Falha ao gerar link de pagamento.');
      }

      window.location.href = data.url;
    } catch (err: any) {
      setErrorMessage(err.message);
      setLoading(false);
    }
  }

  // 6. Logout
  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8">
      {/* Header com Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 shadow-lg shadow-orange-500/20 mb-4">
          <ShieldCheck className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
          Deal Hunter
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Autenticação e Licença de Monitoramento de Ofertas
        </p>
      </div>

      {/* Banner de Pagamento Concluído com Sucesso */}
      {isCheckoutSuccess && (
        <div className="mb-6 p-5 bg-gradient-to-br from-emerald-950/90 to-teal-950/80 border-2 border-emerald-500/60 rounded-3xl shadow-xl shadow-emerald-950/60 space-y-3 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex items-center gap-3 text-emerald-300 font-bold text-base">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <span>🎉 Pagamento Concluído com Sucesso!</span>
          </div>
          <p className="text-xs text-gray-200 leading-relaxed">
            Sua assinatura do <strong>Deal Hunter Pro</strong> foi confirmada e sua conta já está com acesso total liberado!
          </p>
          <div className="p-3 bg-black/40 rounded-2xl border border-emerald-500/30 text-xs text-emerald-100 space-y-1.5">
            <p className="font-semibold text-emerald-300">👉 Próximos passos para usar:</p>
            <p>1. Volte para a extensão <strong>Deal Hunter</strong> no seu navegador.</p>
            <p>2. Clique em <strong>Conectar / Login</strong> para validar e sincronizar seu acesso Pro.</p>
            <p>3. Pronto! As varreduras automáticas e alertas de desconto em tempo real já estão ativos.</p>
          </div>
        </div>
      )}

      {/* Card Principal */}
      <div className="bg-[#161b26] border border-[#2a3245] rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {sessionUser ? (
          // ================= ESTADO AUTENTICADO =================
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-gray-900/60 border border-gray-800 rounded-2xl">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold">
                {sessionUser.email?.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-400 font-medium">Conectado como</p>
                <p className="text-sm font-semibold text-white truncate">
                  {sessionUser.email}
                </p>
              </div>
            </div>

            {/* Status da Licença */}
            {verifyingLicense ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-400">
                <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />
                Verificando licença e permissões...
              </div>
            ) : licenseInfo?.authorized ? (
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>
                    {licenseInfo.plan === 'admin_unlimited'
                      ? '👑 Acesso Vitalício (Admin Master)'
                      : '✅ Assinatura Pro Ativa'}
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Sua conta está autorizada com sucesso. A extensão Deal Hunter está liberada para varreduras ilimitadas e alertas em tempo real.
                </p>
                {extensionSynced ? (
                  <div className="inline-flex items-center gap-1.5 text-xs text-emerald-300 font-medium pt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Sincronizado diretamente com a extensão do Chrome!
                  </div>
                ) : (
                  <p className="text-xs text-amber-300/80 pt-1">
                    💡 Você já pode fechar esta aba e abrir o painel da extensão no seu navegador.
                  </p>
                )}
              </div>
            ) : (
              <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                  <Lock className="w-5 h-5 flex-shrink-0" />
                  <span>Assinatura Necessária</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Para utilizar a extensão e receber notificações de descontos em tempo real, assine o plano Deal Hunter Pro.
                </p>

                {errorMessage && (
                  <div className="flex items-center gap-2 p-3 bg-red-950/50 border border-red-500/50 rounded-xl text-xs text-red-300">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  {loading ? 'Preparando Checkout...' : 'Assinar Plano Pro via Stripe'}
                </button>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between border-t border-gray-800 text-xs text-gray-400">
              <button
                onClick={() =>
                  supabase.auth.getSession().then(({ data }) => {
                    if (data.session) handlePostAuth(data.session.access_token, data.session.user);
                  })
                }
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Atualizar Status
              </button>
              <button
                onClick={handleLogout}
                className="hover:text-red-400 transition-colors"
              >
                Sair da conta
              </button>
            </div>
          </div>
        ) : (
          // ================= FORMULÁRIO DE LOGIN =================
          <div className="space-y-6">
            {/* Botão Google OAuth */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-semibold text-sm transition-all shadow-md active:scale-[0.99]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              Continuar com Google
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-gray-800 w-full" />
              <span className="bg-[#161b26] px-3 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                ou com e-mail
              </span>
            </div>

            {/* Formulário de E-mail / Senha */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Endereço de E-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full bg-[#0d111a] border border-gray-800 focus:border-orange-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#0d111a] border border-gray-800 focus:border-orange-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition-all"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {message && (
                <div className="flex items-center gap-2 p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-orange-500/20 transition-all active:scale-[0.99]"
              >
                {loading ? 'Aguarde...' : isSignUp ? 'Criar Conta' : 'Entrar na Conta'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMessage(null);
                  setMessage(null);
                }}
                className="text-xs text-gray-400 hover:text-orange-400 transition-colors"
              >
                {isSignUp
                  ? 'Já tem uma conta? Clique para entrar'
                  : 'Ainda não tem conta? Cadastre-se aqui'}
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-8 text-center text-xs text-gray-500">
        Deal Hunter &copy; {new Date().getFullYear()} — Plataforma Segura via Supabase &amp; Stripe
      </footer>
    </div>
  );
}
