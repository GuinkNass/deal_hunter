'use client';

import React, { useState, useEffect } from 'react';
import {
  Save,
  HelpCircle,
  Check,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Key,
  Send,
  Cpu,
  Sliders,
  DollarSign,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';

interface RobustSettingsViewProps {
  authToken?: string | null;
  userId?: string | null;
}

export default function RobustSettingsView({ authToken, userId }: RobustSettingsViewProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const [testingService, setTestingService] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string } | null>>({});

  // Sensitive field masks
  const [showMlSecret, setShowMlSecret] = useState(false);
  const [showMlApiKey, setShowMlApiKey] = useState(false);
  const [showTelegramToken, setShowTelegramToken] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);

  // Form states
  const [mlClientId, setMlClientId] = useState('');
  const [mlClientSecret, setMlClientSecret] = useState('');
  const [mlApiKey, setMlApiKey] = useState('');
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-3.8-flash');

  const [desiredMargin, setDesiredMargin] = useState<number>(20);
  const [minRoiAlert, setMinRoiAlert] = useState<number>(25);
  const [taxPercent, setTaxPercent] = useState<number>(6);
  const [packagingCost, setPackagingCost] = useState<number>(3.5);
  const [feeClassicoPercent, setFeeClassicoPercent] = useState<number>(12);
  const [feePremiumPercent, setFeePremiumPercent] = useState<number>(17);
  const [fixedFeeUnder79, setFixedFeeUnder79] = useState<number>(6);

  const [minPriceFilter, setMinPriceFilter] = useState<number>(15);
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(50000);
  const [excludedKeywords, setExcludedKeywords] = useState('');

  useEffect(() => {
    if (authToken) {
      loadSettings();
    }
  }, [authToken]);

  async function loadSettings() {
    setLoading(true);
    try {
      const res = await fetch('/api/user/settings', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        setMlClientId(d.ml_client_id || '');
        setMlClientSecret(d.ml_client_secret || '');
        setMlApiKey(d.ml_api_key || '');
        setTelegramBotToken(d.telegram_bot_token || '');
        setTelegramChatId(d.telegram_chat_id || '');
        setGeminiApiKey(d.gemini_api_key || '');
        setGeminiModel(d.gemini_model || 'gemini-3.8-flash');
        const localSettings = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('dealhunter_custom_settings') || '{}') : {};
        setDesiredMargin(d.desired_margin ?? localSettings.desired_margin ?? 20);
        setMinRoiAlert(d.min_roi_alert ?? localSettings.min_roi_alert ?? 25);
        setTaxPercent(d.tax_percent ?? localSettings.tax_percent ?? 6);
        setPackagingCost(d.packaging_cost ?? localSettings.packaging_cost ?? 3.5);
        setFeeClassicoPercent(d.fee_classico_percent ?? localSettings.fee_classico_percent ?? 12);
        setFeePremiumPercent(d.fee_premium_percent ?? localSettings.fee_premium_percent ?? 17);
        setFixedFeeUnder79(d.fixed_fee_under_79 ?? localSettings.fixed_fee_under_79 ?? 6);
        setMinPriceFilter(d.min_price_filter ?? localSettings.min_price_filter ?? 15);
        setMaxPriceFilter(d.max_price_filter ?? localSettings.max_price_filter ?? 50000);
        setExcludedKeywords(d.excluded_keywords || localSettings.excluded_keywords || '');
      }
    } catch (err: any) {
      console.error('Erro ao buscar configurações:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          ml_client_id: mlClientId,
          ml_client_secret: mlClientSecret,
          ml_api_key: mlApiKey,
          telegram_bot_token: telegramBotToken,
          telegram_chat_id: telegramChatId,
          gemini_api_key: geminiApiKey,
          gemini_model: geminiModel,
          desired_margin: desiredMargin,
          min_roi_alert: minRoiAlert,
          tax_percent: taxPercent,
          packaging_cost: packagingCost,
          fee_classico_percent: feeClassicoPercent,
          fee_premium_percent: feePremiumPercent,
          fixed_fee_under_79: fixedFeeUnder79,
          min_price_filter: minPriceFilter,
          max_price_filter: maxPriceFilter,
          excluded_keywords: excludedKeywords,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'dealhunter_custom_settings',
            JSON.stringify({
              desired_margin: desiredMargin,
              min_roi_alert: minRoiAlert,
              tax_percent: taxPercent,
              packaging_cost: packagingCost,
              fee_classico_percent: feeClassicoPercent,
              fee_premium_percent: feePremiumPercent,
              fixed_fee_under_79: fixedFeeUnder79,
              min_price_filter: minPriceFilter,
              max_price_filter: maxPriceFilter,
              excluded_keywords: excludedKeywords,
            })
          );
        }
        setSaveMessage({ type: 'success', text: 'Configurações salvas com sucesso no seu perfil!' });
        setTimeout(() => setSaveMessage(null), 4000);
      } else {
        throw new Error(json.error || 'Erro ao salvar.');
      }
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err.message || 'Erro ao salvar' });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest(service: 'mercadolivre' | 'telegram' | 'gemini') {
    setTestingService(service);
    setTestResults((prev) => ({ ...prev, [service]: null }));
    try {
      const res = await fetch('/api/user/settings/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service,
          ml_client_id: mlClientId,
          ml_client_secret: mlClientSecret,
          ml_api_key: mlApiKey,
          telegram_bot_token: telegramBotToken,
          telegram_chat_id: telegramChatId,
          gemini_api_key: geminiApiKey,
          gemini_model: geminiModel,
        }),
      });
      const json = await res.json();
      setTestResults((prev) => ({
        ...prev,
        [service]: { success: Boolean(json.success), message: json.message || '' },
      }));
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [service]: { success: false, message: err.message },
      }));
    } finally {
      setTestingService(null);
    }
  }

  async function handleConnectML() {
    try {
      const params = new URLSearchParams();
      if (mlClientId) params.set('clientId', mlClientId.trim());
      if (userId) params.set('userId', userId.trim());
      const res = await fetch(`/api/ml/auth-url?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.url) {
        window.location.href = json.url;
      } else {
        alert(json.error || 'Configure primeiro o ML Client ID antes de conectar.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  }

  const toggleAccordion = (key: string) => {
    setActiveAccordion((prev) => (prev === key ? null : key));
  };

  if (loading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <p className="text-xs text-gray-400">Carregando configurações individuais...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111624] border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-tight">
            Configurações e Integrações Robustas
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Cada usuário possui credenciais e parâmetros financeiros isolados com segurança no Supabase.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98]"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Salvar Alterações</span>
        </button>
      </div>

      {saveMessage && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in duration-200 ${
            saveMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
          }`}
        >
          {saveMessage.type === 'success' ? (
            <Check className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{saveMessage.text}</span>
        </div>
      )}

      {/* 1. MERCADO LIVRE */}
      <section className="bg-[#101422] border border-slate-800 rounded-3xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">1. Mercado Livre (API Oficial & Busca Cirúrgica)</h2>
              <p className="text-xs text-slate-400">Insira seu App ID e Secret para match em tempo real</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTest('mercadolivre')}
              disabled={testingService === 'mercadolivre'}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors border border-slate-700 flex items-center gap-1.5"
            >
              {testingService === 'mercadolivre' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Testando...
                </>
              ) : (
                'Testar Conexão'
              )}
            </button>
            <button
              onClick={handleConnectML}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-amber-500/20"
            >
              Conectar Mercado Livre
            </button>
          </div>
        </div>

        {testResults.mercadolivre && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
              testResults.mercadolivre.success
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
            }`}
          >
            <span>{testResults.mercadolivre.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* App ID */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">App Client ID (App ID)</label>
              <button
                type="button"
                onClick={() => toggleAccordion('ml_client_id')}
                className="text-[11px] font-semibold text-cyan-400 hover:underline flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" /> Como obter?
              </button>
            </div>

            {activeAccordion === 'ml_client_id' && (
              <div className="p-3 bg-slate-900 border border-cyan-500/30 rounded-xl text-xs text-slate-300 space-y-1">
                <p>Acesse o portal de desenvolvedores do Mercado Livre e copie o App ID da sua aplicação.</p>
                <a
                  href="https://developers.mercadolivre.com.br/apps/home"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline inline-flex items-center gap-1 mt-1 font-semibold"
                >
                  Abrir Mercado Livre Developers <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <input
              type="text"
              value={mlClientId}
              onChange={(e) => setMlClientId(e.target.value)}
              placeholder="Ex: 1234567890123456"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Client Secret */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">Client Secret (Chave Secreta)</label>
              <button
                type="button"
                onClick={() => toggleAccordion('ml_client_secret')}
                className="text-[11px] font-semibold text-cyan-400 hover:underline flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" /> Onde ver?
              </button>
            </div>

            {activeAccordion === 'ml_client_secret' && (
              <div className="p-3 bg-slate-900 border border-cyan-500/30 rounded-xl text-xs text-slate-300 space-y-1">
                <p>Na página da sua aplicação em developers.mercadolivre.com.br, clique em &ldquo;Chave Secreta&rdquo; para gerar ou copiar.</p>
              </div>
            )}

            <div className="relative">
              <input
                type={showMlSecret ? 'text' : 'password'}
                value={mlClientSecret}
                onChange={(e) => setMlClientSecret(e.target.value)}
                placeholder="Chave secreta privada..."
                className="w-full pr-10 pl-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={() => setShowMlSecret(!showMlSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                {showMlSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Access Token / Token de Acesso */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">
                Token de Acesso / Access Token (Preenchido via Conexão ou Manual)
              </label>
              <button
                type="button"
                onClick={() => toggleAccordion('ml_access_token')}
                className="text-[11px] font-semibold text-cyan-400 hover:underline flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" /> Como funciona?
              </button>
            </div>

            {activeAccordion === 'ml_access_token' && (
              <div className="p-3 bg-slate-900 border border-cyan-500/30 rounded-xl text-xs text-slate-300 space-y-1">
                <p>
                  O Mercado Livre exige um Bearer Token para permitir buscas cirúrgicas de concorrentes líderes e extrair o link direto do anúncio campeão.
                </p>
                <p>
                  Ao clicar em <strong>&ldquo;CONECTAR MERCADO LIVRE&rdquo;</strong>, este token é gerado e salvo automaticamente. Você também pode colar um token gerado manualmente no painel de desenvolvedores do Mercado Livre (iniciado por <code>APP_USR-</code>).
                </p>
              </div>
            )}

            <div className="relative">
              <input
                type={showMlApiKey ? 'text' : 'password'}
                value={mlApiKey}
                onChange={(e) => setMlApiKey(e.target.value)}
                placeholder="APP_USR-..."
                className="w-full pr-10 pl-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={() => setShowMlApiKey(!showMlApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                {showMlApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TELEGRAM PRIVADO */}
      <section className="bg-[#101422] border border-slate-800 rounded-3xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">2. Telegram Privado (Disparo de Alertas com ROI)</h2>
              <p className="text-xs text-slate-400">Envio automático para o seu celular quando o ROI atinge seu alvo</p>
            </div>
          </div>

          <button
            onClick={() => handleTest('telegram')}
            disabled={testingService === 'telegram'}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors border border-slate-700 flex items-center gap-1.5"
          >
            {testingService === 'telegram' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Testando...
              </>
            ) : (
              'Testar Bot de Saída'
            )}
          </button>
        </div>

        {testResults.telegram && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
              testResults.telegram.success
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
            }`}
          >
            <span>{testResults.telegram.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">Token do Bot (Telegram)</label>
              <button
                type="button"
                onClick={() => toggleAccordion('telegram_bot_token')}
                className="text-[11px] font-semibold text-cyan-400 hover:underline flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" /> Como criar?
              </button>
            </div>

            {activeAccordion === 'telegram_bot_token' && (
              <div className="p-3 bg-slate-900 border border-cyan-500/30 rounded-xl text-xs text-slate-300 space-y-1">
                <p>Abra o Telegram, fale com @BotFather, envie /newbot e cole o token aqui.</p>
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline inline-flex items-center gap-1 mt-1 font-semibold"
                >
                  Abrir @BotFather <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <div className="relative">
              <input
                type={showTelegramToken ? 'text' : 'password'}
                value={telegramBotToken}
                onChange={(e) => setTelegramBotToken(e.target.value)}
                placeholder="Ex: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                className="w-full pr-10 pl-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={() => setShowTelegramToken(!showTelegramToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                {showTelegramToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">Chat ID de Notificações</label>
              <button
                type="button"
                onClick={() => toggleAccordion('telegram_chat_id')}
                className="text-[11px] font-semibold text-cyan-400 hover:underline flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" /> Como achar meu ID?
              </button>
            </div>

            {activeAccordion === 'telegram_chat_id' && (
              <div className="p-3 bg-slate-900 border border-cyan-500/30 rounded-xl text-xs text-slate-300 space-y-1">
                <p>Abra @userinfobot no Telegram para descobrir seu ID numérico e cole aqui.</p>
                <a
                  href="https://t.me/userinfobot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline inline-flex items-center gap-1 mt-1 font-semibold"
                >
                  Abrir @userinfobot <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <input
              type="text"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              placeholder="Ex: 987654321 ou -1001234567890"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </section>

      {/* 3. GOOGLE GEMINI */}
      <section className="bg-[#101422] border border-slate-800 rounded-3xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">3. Google Gemini AI (AI Studio Gratuito)</h2>
              <p className="text-xs text-slate-400">Análise estratégica de risco, demanda e desempate sob demanda</p>
            </div>
          </div>

          <button
            onClick={() => handleTest('gemini')}
            disabled={testingService === 'gemini'}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors border border-slate-700 flex items-center gap-1.5"
          >
            {testingService === 'gemini' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Testando...
              </>
            ) : (
              'Testar Conexão Gemini'
            )}
          </button>
        </div>

        {testResults.gemini && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
              testResults.gemini.success
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
            }`}
          >
            <span>{testResults.gemini.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">API Key do Google AI Studio</label>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-cyan-400 hover:underline flex items-center gap-1"
              >
                Criar Chave Grátis <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <input
                type={showGeminiKey ? 'text' : 'password'}
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="AIzaSyD-xxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full pr-10 pl-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={() => setShowGeminiKey(!showGeminiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <label className="text-xs font-bold text-slate-200 block">Modelo Gemini</label>
            <select
              value={geminiModel}
              onChange={(e) => setGeminiModel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="gemini-3.8-flash">gemini-3.8-flash (Padrão Oficial Google AI Studio 2026 - Recomendado)</option>
              <option value="gemini-3.5-flash">gemini-3.5-flash (Alta Velocidade & Baixo Consumo)</option>
              <option value="gemini-flash-latest">gemini-flash-latest (Versão Mais Recente)</option>
            </select>
          </div>
        </div>
      </section>

      {/* 4. PARÂMETROS FINANCEIROS */}
      <section className="bg-[#101422] border border-slate-800 rounded-3xl p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800/80">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">4. Parâmetros Financeiros & Tarifas do Mercado Livre</h2>
            <p className="text-xs text-slate-400">Taxas personalizadas para o cálculo automático de margem e ROI</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
            <label className="text-xs text-slate-400 block">Margem de Lucro Alvo (%)</label>
            <input
              type="number"
              value={desiredMargin}
              onChange={(e) => setDesiredMargin(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-bold text-white"
            />
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
            <label className="text-xs text-slate-400 block">ROI Mínimo para Alerta Telegram (%)</label>
            <input
              type="number"
              value={minRoiAlert}
              onChange={(e) => setMinRoiAlert(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-bold text-white"
            />
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
            <label className="text-xs text-slate-400 block">Alíquota de Imposto (%)</label>
            <input
              type="number"
              value={taxPercent}
              onChange={(e) => setTaxPercent(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-bold text-white"
            />
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
            <label className="text-xs text-slate-400 block">Comissão ML Clássico (%)</label>
            <input
              type="number"
              value={feeClassicoPercent}
              onChange={(e) => setFeeClassicoPercent(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-bold text-white"
            />
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
            <label className="text-xs text-slate-400 block">Comissão ML Premium (%)</label>
            <input
              type="number"
              value={feePremiumPercent}
              onChange={(e) => setFeePremiumPercent(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-bold text-white"
            />
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
            <label className="text-xs text-slate-400 block">Custo Embalagem Médio (R$)</label>
            <input
              type="number"
              step="0.5"
              value={packagingCost}
              onChange={(e) => setPackagingCost(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-bold text-white"
            />
          </div>
        </div>
      </section>

      {/* 5. FILTROS E REGRAS */}
      <section className="bg-[#101422] border border-slate-800 rounded-3xl p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800/80">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">5. Filtros e Palavras-chave Excluídas</h2>
            <p className="text-xs text-slate-400">Descarte automático de produtos fora dos limites de investimento</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
            <label className="text-xs text-slate-400 block">Preço Mínimo (R$)</label>
            <input
              type="number"
              value={minPriceFilter}
              onChange={(e) => setMinPriceFilter(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-bold text-white"
            />
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
            <label className="text-xs text-slate-400 block">Preço Máximo (R$)</label>
            <input
              type="number"
              value={maxPriceFilter}
              onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-bold text-white"
            />
          </div>
        </div>

        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-1.5">
          <label className="text-xs text-slate-400 block">Palavras-chave Excluídas (separadas por vírgula)</label>
          <input
            type="text"
            value={excludedKeywords}
            onChange={(e) => setExcludedKeywords(e.target.value)}
            placeholder="Ex: seminovo, recondicionado, usado, avaria, capinha"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>
      </section>

      {/* Save Button bottom */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98]"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Salvar Todas as Configurações</span>
        </button>
      </div>
    </div>
  );
}
