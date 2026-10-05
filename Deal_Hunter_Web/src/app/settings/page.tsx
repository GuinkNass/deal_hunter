'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Key,
  Bot,
  Send,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [mlApiKey, setMlApiKey] = useState('');
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');

  const [showGemini, setShowGemini] = useState(false);
  const [showTelegram, setShowTelegram] = useState(false);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
        return;
      }
      setSessionUser(session.user);
      setAuthToken(session.access_token);
      loadSettings(session.access_token);
    });
  }, [supabase, router]);

  async function loadSettings(token: string) {
    try {
      setLoading(true);
      const res = await fetch('/api/user/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setGeminiApiKey(data.data.gemini_api_key || '');
        setMlApiKey(data.data.ml_api_key || '');
        setTelegramBotToken(data.data.telegram_bot_token || '');
        setTelegramChatId(data.data.telegram_chat_id || '');
      }
    } catch (err: any) {
      console.error('Erro ao carregar configurações:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!authToken) return;

    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          gemini_api_key: geminiApiKey,
          ml_api_key: mlApiKey,
          telegram_bot_token: telegramBotToken,
          telegram_chat_id: telegramChatId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao salvar configurações.');
      }

      setSuccessMessage('Configurações e credenciais salvas com sucesso!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado.');
    } finally {
      setSaving(false);
    }
  }

  async function handleTestTelegram() {
    if (!telegramBotToken || !telegramChatId) {
      setErrorMessage('Informe o Telegram Bot Token e o Chat ID para testar o envio.');
      return;
    }

    setTestSending(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`https://api.telegram.org/bot${telegramBotToken.trim()}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId.trim(),
          text: `🔔 <b>Deal Hunter Pro • Teste de Integração</b>\n\nSeu bot do Telegram foi conectado com sucesso ao Deal Hunter Pro!\nVocê receberá alertas automáticos de ótimas oportunidades aqui.`,
          parse_mode: 'HTML',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.description || 'Erro ao enviar mensagem de teste pelo Telegram.');
      }

      setSuccessMessage('✅ Notificação de teste enviada com sucesso no seu Telegram!');
      setTimeout(() => setSuccessMessage(null), 6000);
    } catch (err: any) {
      setErrorMessage(`Falha no teste do Telegram: ${err.message}`);
    } finally {
      setTestSending(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        <p className="text-sm text-gray-400 font-medium">Carregando suas integrações...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight sm:text-3xl">
              Configurações & Integrações
            </h1>
            <p className="text-xs sm:text-sm text-gray-400">
              Gerencie suas chaves de API individuais, inteligência artificial e alertas privados
            </p>
          </div>
        </div>
      </div>

      {/* Alertas de Sucesso / Erro */}
      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl flex items-center gap-3 text-emerald-300 text-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-950/60 border border-red-500/40 rounded-2xl flex items-center gap-3 text-red-300 text-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Bloco 1: Google Gemini AI */}
        <div className="p-6 bg-[#111622] border border-gray-800 rounded-3xl space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Google Gemini API Key</h2>
                <p className="text-xs text-gray-400">
                  Utilizada para análise sob demanda de demanda de mercado, riscos e viabilidade
                </p>
              </div>
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 font-semibold"
            >
              <span>Obter chave grátis</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="relative">
            <input
              type={showGemini ? 'text' : 'password'}
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              placeholder="Cole sua Gemini API Key (AIzaSy...)"
              className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-900/80 border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowGemini(!showGemini)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showGemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-gray-500">
            A API é chamada estritamente sob demanda para ofertas elegíveis em prompts minificados (Free Tier friendly).
          </p>
        </div>

        {/* Bloco 2: Mercado Livre API */}
        <div className="p-6 bg-[#111622] border border-gray-800 rounded-3xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Mercado Livre API Key / Token</h2>
              <p className="text-xs text-gray-400">
                Opcional. Se não informada, o radar realiza correspondência automática ao vivo
              </p>
            </div>
          </div>

          <div>
            <input
              type="text"
              value={mlApiKey}
              onChange={(e) => setMlApiKey(e.target.value)}
              placeholder="Cole seu Bearer Token do Mercado Livre (opcional)"
              className="w-full px-4 py-3 rounded-xl bg-gray-900/80 border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        {/* Bloco 3: Notificações Telegram Privado */}
        <div className="p-6 bg-[#111622] border border-gray-800 rounded-3xl space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Bot Privado do Telegram</h2>
                <p className="text-xs text-gray-400">
                  Receba disparos instantâneos de ótimas oportunidades diretamente no seu canal/bot
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTestTelegram}
              disabled={testSending || !telegramBotToken || !telegramChatId}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 transition-all"
            >
              {testSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Testar Envio</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Telegram Bot Token</label>
              <div className="relative">
                <input
                  type={showTelegram ? 'text' : 'password'}
                  value={telegramBotToken}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                  placeholder="Ex: 123456789:ABCdefGhI..."
                  className="w-full px-4 py-2.5 pr-10 rounded-xl bg-gray-900/80 border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => setShowTelegram(!showTelegram)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showTelegram ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-gray-500">Crie seu bot falando com @BotFather no Telegram.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Telegram Chat ID</label>
              <input
                type="text"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="Ex: 123456789 ou -100123456789"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-900/80 border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[10px] text-gray-500">Seu ID de usuário obtido com @userinfobot.</p>
            </div>
          </div>
        </div>

        {/* Botão de Salvar */}
        <div className="flex items-center justify-between pt-2">
          <Link
            href="/ml-radar"
            className="text-xs font-semibold text-gray-400 hover:text-white transition-colors"
          >
            ← Voltar ao ML Radar
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30 flex items-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Salvar Configurações</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
