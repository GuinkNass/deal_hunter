'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Key,
  Chrome,
  Radar,
  Calculator,
  Star,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Search,
  CheckCircle2,
  Copy,
  Check,
  Globe2,
  Coins,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  Info,
  DollarSign,
  TrendingUp,
  Cpu,
  Layers,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';

type Language = 'pt' | 'en' | 'es';
type Currency = 'BRL' | 'USD' | 'EUR';

interface ExchangeRates {
  USD: number; // 1 USD in BRL
  EUR: number; // 1 EUR in BRL
  updatedAt: string;
}

export default function DocsClient() {
  const [lang, setLang] = useState<Language>('pt');
  const [currency, setCurrency] = useState<Currency>('BRL');
  const [activeSection, setActiveSection] = useState<string>('quickstart');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Cotações em tempo real via API pública da AwesomeAPI (gratuita e sem chave)
  const [rates, setRates] = useState<ExchangeRates>({
    USD: 5.0,
    EUR: 5.5,
    updatedAt: '',
  });
  const [loadingRates, setLoadingRates] = useState<boolean>(true);

  // Exemplo interativo de precificação
  const [calcInputBuyBrl, setCalcInputBuyBrl] = useState<number>(399.9);
  const [calcInputSellBrl, setCalcInputSellBrl] = useState<number>(589.9);

  useEffect(() => {
    async function fetchRates() {
      try {
        setLoadingRates(true);
        const res = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL');
        if (res.ok) {
          const data = await res.json();
          const usdBrl = parseFloat(data?.USDBRL?.bid || '5.0');
          const eurBrl = parseFloat(data?.EURBRL?.bid || '5.5');
          setRates({
            USD: usdBrl,
            EUR: eurBrl,
            updatedAt: new Date().toLocaleTimeString(),
          });
        }
      } catch (e) {
        console.warn('Usando cotação padrão de fallback:', e);
      } finally {
        setLoadingRates(false);
      }
    }
    fetchRates();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopiedKey(id);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  // Conversor monetário em tempo real
  const formatCurrency = (amountInBrl: number): string => {
    if (currency === 'BRL') {
      return new Intl.NumberFormat(lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : 'en-US', {
        style: 'currency',
        currency: 'BRL',
      }).format(amountInBrl);
    }
    if (currency === 'USD') {
      const inUsd = amountInBrl / (rates.USD || 5.0);
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(inUsd);
    }
    if (currency === 'EUR') {
      const inEur = amountInBrl / (rates.EUR || 5.5);
      return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
      }).format(inEur);
    }
    return `R$ ${amountInBrl.toFixed(2)}`;
  };

  // Conteúdo multilíngue da documentação
  const t = useMemo(() => {
    const dict = {
      pt: {
        navTitle: 'Manual do Usuário',
        subtitle: 'Guia oficial e completo de uso e configuração do Deal Hunter Pro',
        searchPlaceholder: 'Pesquisar na documentação (ex: Gemini, Mercado Livre, Extensão, Margem)...',
        backToDashboard: 'Voltar ao Dashboard',
        ratesLabel: 'Câmbio ao vivo:',
        updatedJustNow: 'Mercado aberto',
        sections: {
          quickstart: '1. Início Rápido',
          credentials: '2. Chaves & Conexões (APIs)',
          extension: '3. Extensão do Chrome',
          radar: '4. Radar ML & Avaliação',
          calculator: '5. Calculadora de Lucro & ROI',
          showcase: '6. Vitrine Pública (/ofertas)',
          faq: '7. Dúvidas Frequentes (FAQ)',
        },
        calculatorSimulatorTitle: 'Simulador Financeiro com Conversão de Moeda',
        calculatorSimulatorDesc: 'Teste os valores abaixo e alterne a moeda no topo para ver os resultados convertidos na taxa de câmbio oficial em tempo real.',
        buyPriceLabel: 'Preço de Compra (Custo):',
        sellPriceLabel: 'Preço de Venda no Mercado Livre:',
        netProfitLabel: 'Lucro Líquido Estimado:',
        roiLabel: 'Retorno sobre Investimento (ROI):',
        copySuccess: 'Copiado para a área de transferência!',
      },
      en: {
        navTitle: 'User Manual',
        subtitle: 'Official and comprehensive guide for using and configuring Deal Hunter Pro',
        searchPlaceholder: 'Search documentation (e.g. Gemini, Mercado Libre, Extension, Margin)...',
        backToDashboard: 'Back to Dashboard',
        ratesLabel: 'Live Rates:',
        updatedJustNow: 'Market open',
        sections: {
          quickstart: '1. Quick Start',
          credentials: '2. API Keys & Connections',
          extension: '3. Chrome Extension',
          radar: '4. ML Radar & Clinical Audit',
          calculator: '5. Profit & ROI Calculator',
          showcase: '6. Public Showcase (/ofertas)',
          faq: '7. Frequently Asked Questions (FAQ)',
        },
        calculatorSimulatorTitle: 'Financial Simulator with Live Currency Conversion',
        calculatorSimulatorDesc: 'Enter values below and switch currencies at the top to view converted results based on real-time market rates.',
        buyPriceLabel: 'Purchase Price (Cost):',
        sellPriceLabel: 'Selling Price on Mercado Libre:',
        netProfitLabel: 'Estimated Net Profit:',
        roiLabel: 'Return on Investment (ROI):',
        copySuccess: 'Copied to clipboard!',
      },
      es: {
        navTitle: 'Manual de Usuario',
        subtitle: 'Guía oficial y completa de uso y configuración de Deal Hunter Pro',
        searchPlaceholder: 'Buscar en la documentación (ej: Gemini, Mercado Libre, Extensión, Margen)...',
        backToDashboard: 'Volver al Dashboard',
        ratesLabel: 'Tipo de cambio en vivo:',
        updatedJustNow: 'Mercado abierto',
        sections: {
          quickstart: '1. Inicio Rápido',
          credentials: '2. Claves y Conexiones (APIs)',
          extension: '3. Extensión de Chrome',
          radar: '4. Radar ML y Evaluación',
          calculator: '5. Calculadora de Ganancia y ROI',
          showcase: '6. Vitrina Pública (/ofertas)',
          faq: '7. Preguntas Frecuentes (FAQ)',
        },
        calculatorSimulatorTitle: 'Simulador Financiero con Conversión de Moneda en Vivo',
        calculatorSimulatorDesc: 'Ingrese valores y cambie de moneda en la parte superior para ver los resultados convertidos a la tasa oficial en tiempo real.',
        buyPriceLabel: 'Precio de Compra (Costo):',
        sellPriceLabel: 'Precio de Venda en Mercado Libre:',
        netProfitLabel: 'Ganancia Neta Estimada:',
        roiLabel: 'Retorno de Inversión (ROI):',
        copySuccess: '¡Copiado al portapapeles!',
      },
    };
    return dict[lang];
  }, [lang]);

  // Cálculo do simulador
  const simNetProfitBrl = Math.max(0, (calcInputSellBrl - calcInputBuyBrl) * 0.72);
  const simRoiPercent = calcInputBuyBrl > 0 ? ((simNetProfitBrl / calcInputBuyBrl) * 100).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased selection:bg-indigo-500/20 selection:text-indigo-900">
      {/* Top Header Light / Clean */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/90 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo & Marca */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center p-1.5 shadow-md shadow-slate-900/10 group-hover:bg-indigo-600 transition-colors">
                <img
                  src="/images/logo.png"
                  alt="Deal Hunter Pro"
                  className="w-full h-full object-contain brightness-0 invert"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-lg tracking-tight text-slate-900 uppercase">
                  Deal Hunter <span className="text-indigo-600">Docs</span>
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  {t.navTitle}
                </span>
              </div>
            </Link>
          </div>

          {/* Barra de Ferramentas: Câmbio ao Vivo + Idiomas + Moedas + Botão Dashboard */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap justify-end">
            {/* Cotação ao Vivo */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200 text-xs text-slate-600">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-700">1 USD = R$ {rates.USD.toFixed(2)}</span>
              <span className="text-slate-400">|</span>
              <span className="font-semibold text-slate-700">1 EUR = R$ {rates.EUR.toFixed(2)}</span>
            </div>

            {/* Seletor de Moeda */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setCurrency('BRL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  currency === 'BRL'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Real Brasileiro (BRL)"
              >
                R$ BRL
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  currency === 'USD'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Dólar Americano (USD)"
              >
                $ USD
              </button>
              <button
                type="button"
                onClick={() => setCurrency('EUR')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  currency === 'EUR'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Euro (EUR)"
              >
                € EUR
              </button>
            </div>

            {/* Seletor de Idioma */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setLang('pt')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                  lang === 'pt'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Português do Brasil"
              >
                🇧🇷 PT
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                  lang === 'en'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="English"
              >
                🇺🇸 EN
              </button>
              <button
                type="button"
                onClick={() => setLang('es')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                  lang === 'es'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Español"
              >
                🇪🇸 ES
              </button>
            </div>

            {/* Botão de Retorno ao Dashboard */}
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md shadow-slate-900/15 transition-all"
            >
              <span>{t.backToDashboard}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero da Documentação */}
      <section className="bg-white border-b border-slate-200 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/60 text-xs font-bold text-indigo-700">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Versão Pro 3.2 • Guia 100% Atualizado</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {lang === 'pt' && 'Aprenda a Usar Todas as Funções do Deal Hunter Pro'}
            {lang === 'en' && 'Master Every Feature of Deal Hunter Pro'}
            {lang === 'es' && 'Aprenda a Usar Todas las Funciones de Deal Hunter Pro'}
          </h1>
          <p className="text-base text-slate-600 max-w-2xl mx-auto">
            {t.subtitle}. Configure suas chaves gratuitas, instale a extensão e encontre as melhores oportunidades com inteligência artificial.
          </p>

          {/* Campo de Busca Rápida na Documentação */}
          <div className="max-w-xl mx-auto pt-4">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-inner"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Layout Principal: Sidebar + Conteúdo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar Esquerda Fixa */}
          <aside className="lg:col-span-3 sticky top-28 space-y-2">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <p className="px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-400">
                {lang === 'pt' ? 'Tópicos do Manual' : lang === 'es' ? 'Temas del Manual' : 'Guide Topics'}
              </p>

              {[
                { id: 'quickstart', label: t.sections.quickstart, icon: BookOpen },
                { id: 'credentials', label: t.sections.credentials, icon: Key },
                { id: 'extension', label: t.sections.extension, icon: Chrome },
                { id: 'radar', label: t.sections.radar, icon: Radar },
                { id: 'calculator', label: t.sections.calculator, icon: Calculator },
                { id: 'showcase', label: t.sections.showcase, icon: Star },
                { id: 'faq', label: t.sections.faq, icon: HelpCircle },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveSection(item.id);
                      const el = document.getElementById(item.id);
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
                  </button>
                );
              })}
            </div>

            {/* Card Lateral de Suporte Rápido */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-indigo-950">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>100% Seguro & Gratuito</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Todas as chaves configuradas (Gemini e Mercado Livre) utilizam planos oficiais sem custos. Suas credenciais nunca são compartilhadas.
              </p>
            </div>
          </aside>

          {/* Conteúdo Central Detalhado */}
          <main className="lg:col-span-9 space-y-12">
            {/* SEÇÃO 1: Início Rápido */}
            <section id="quickstart" className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    {t.sections.quickstart}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {lang === 'pt' && 'Como começar a lucrar com o Deal Hunter Pro em 3 passos simples'}
                    {lang === 'en' && 'How to start profiting with Deal Hunter Pro in 3 easy steps'}
                    {lang === 'es' && 'Cómo empezar a ganar con Deal Hunter Pro en 3 simples pasos'}
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed">
                O <strong>Deal Hunter Pro</strong> é uma plataforma avançada de inteligência comercial que monitora preços e promoções em grandes lojas (Amazon, KaBuM!, Magazine Luiza) e localiza automaticamente os concorrentes líderes de venda no <strong>Mercado Livre</strong>. Ele calcula em tempo real seu lucro líquido real, ROI %, margem e potencial de giro.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center">1</span>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {lang === 'pt' ? 'Configurar Chaves' : lang === 'es' ? 'Configurar Claves' : 'Setup API Keys'}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {lang === 'pt' && 'Gere sua chave do Google Gemini (grátis) e conecte o Mercado Livre em 1 clique.'}
                    {lang === 'en' && 'Generate your free Google Gemini key and connect Mercado Libre in 1 click.'}
                    {lang === 'es' && 'Genere su clave gratuita de Google Gemini y conecte Mercado Libre en 1 clic.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center">2</span>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {lang === 'pt' ? 'Instalar a Extensão' : lang === 'es' ? 'Instalar la Extensión' : 'Install Extension'}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {lang === 'pt' && 'A extensão do Chrome varre os anúncios reais do ML no seu navegador sem bloqueios de Cloudflare.'}
                    {lang === 'en' && 'The Chrome extension scans real ML ads in your browser without Cloudflare blocks.'}
                    {lang === 'es' && 'La extensión de Chrome analiza anuncios reales de ML en su navegador sin bloqueos.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center">3</span>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {lang === 'pt' ? 'Avaliar & Lucrar' : lang === 'es' ? 'Evaluar y Ganar' : 'Audit & Profit'}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {lang === 'pt' && 'Abra qualquer produto no Radar ML, veja os 2 anúncios eleitos e decida sua precificação.'}
                    {lang === 'en' && 'Open any item in the ML Radar, view the 2 top chosen ads, and set your pricing.'}
                    {lang === 'es' && 'Abra cualquier artículo en el Radar ML, vea los 2 anuncios elegidos y defina su precio.'}
                  </p>
                </div>
              </div>
            </section>

            {/* SEÇÃO 2: Chaves & Conexões (APIs) */}
            <section id="credentials" className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    {t.sections.credentials}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {lang === 'pt' && 'Onde conseguir cada chave e como configurar tudo passo a passo'}
                    {lang === 'en' && 'Where to get each key and how to set everything up step by step'}
                    {lang === 'es' && 'Dónde conseguir cada clave y cómo configurar todo paso a paso'}
                  </p>
                </div>
              </div>

              {/* Bloco 1: Google Gemini API */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      AI
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">
                        Google Gemini API Key (Inteligência Artificial)
                      </h3>
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        100% Grátis • Até 15 requisições/minuto
                      </span>
                    </div>
                  </div>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm"
                  >
                    <span>Abrir Google AI Studio</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="text-xs text-slate-700 space-y-2 leading-relaxed">
                  <p><strong>Por que é necessária:</strong> O Gemini analisa as especificações técnicas, limpa os títulos (marca, modelo, peso, voltagem) e compara os anúncios do Mercado Livre para eleger o campeão de vendas sem falsos positivos.</p>
                  
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <p className="font-bold text-slate-900">Passo a passo para gerar sua chave:</p>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-600">
                      <li>Acesse o <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold underline">Google AI Studio</a> com sua conta Google comum.</li>
                      <li>Clique no botão azul <strong>&quot;Create API Key&quot;</strong>.</li>
                      <li>Selecione um projeto existente ou clique em <em>&quot;Create API key in new project&quot;</em>.</li>
                      <li>Copie a chave que começa com <code>AIzaSy...</code></li>
                      <li>No Deal Hunter Pro, acesse a aba <strong>Configurações & APIs</strong> e cole no campo <strong>Google Gemini API Key</strong>.</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Bloco 2: Conexão Oficial Mercado Livre */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-yellow-400 text-slate-950 flex items-center justify-center font-bold text-xs">
                      ML
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">
                        Conexão Oficial Mercado Livre (OAuth & API)
                      </h3>
                      <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        Conexão em 1 Clique com sua conta do Mercado Livre
                      </span>
                    </div>
                  </div>
                  <Link
                    href="/dashboard?tab=settings"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 text-xs font-black transition-all shadow-sm"
                  >
                    <span>Ir para Configurações</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="text-xs text-slate-700 space-y-2 leading-relaxed">
                  <p><strong>Por que é necessária:</strong> Permite consultar o histórico de vendas comprovadas (<code>sold_quantity</code>), estoque restante e reputação dos concorrentes oficiais direto dos servidores do Mercado Livre.</p>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <p className="font-bold text-slate-900">Como conectar (Método Mais Fácil):</p>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-600">
                      <li>Acesse o menu <strong>Configurações & APIs</strong> no seu Dashboard.</li>
                      <li>Clique no botão amarelo <strong>&quot;Conectar com Mercado Livre&quot;</strong>.</li>
                      <li>Você será redirecionado para o site oficial do Mercado Livre para autorizar o acesso.</li>
                      <li>Após autorizar, o Deal Hunter renovará seu token de acesso automaticamente em segundo plano.</li>
                    </ol>
                  </div>
                </div>
              </div>
            </section>

            {/* SEÇÃO 3: Extensão do Chrome & Varredura Anti-Bloqueio */}
            <section id="extension" className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
                  <Chrome className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    {t.sections.extension}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {lang === 'pt' && 'Como funciona a varredura no navegador e por que ela é imune a bloqueios'}
                    {lang === 'en' && 'How browser scanning works and why it prevents Cloudflare blocks'}
                    {lang === 'es' && 'Cómo funciona el escaneo del navegador y por qué evita bloqueos'}
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <p>
                  A extensão <strong>Deal Hunter Pro (Manifest V3)</strong> resolve o maior desafio do mercado: os bloqueios de segurança (Cloudflare e Akamai) que barram servidores em nuvem. Ao rodar no seu próprio Chrome, ela consulta os anúncios exatamente como um comprador real.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span>Como Funciona o Clique em &quot;Avaliar ML&quot;:</span>
                    </h3>
                    <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                      <li>O sistema limpa o título do produto para reter apenas marca e modelo.</li>
                      <li>A extensão abre uma aba de busca rápida no Mercado Livre.</li>
                      <li>Ela extrai os <strong>12 a 16 primeiros anúncios</strong> da página em menos de 1,5s.</li>
                      <li>Identifica o código real do vendedor (MLB), preço cheio à vista e link de catálogo.</li>
                      <li>A aba se fecha automaticamente e entrega os dados limpos na tela.</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>Instalação da Extensão no Chrome:</span>
                    </h3>
                    <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                      <li>Abra <code>chrome://extensions</code> no seu navegador Google Chrome.</li>
                      <li>Ative o botão <strong>&quot;Modo do desenvolvedor&quot;</strong> no canto superior direito.</li>
                      <li>Clique em <strong>&quot;Carregar sem compactação&quot;</strong>.</li>
                      <li>Selecione a pasta <code>extension</code> do Deal Hunter.</li>
                      <li>Pronto! A extensão sincronizará sua licença e sessão automaticamente.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* SEÇÃO 4: Radar ML & Avaliação Clínica */}
            <section id="radar" className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Radar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    {t.sections.radar}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {lang === 'pt' && 'Como ler os 2 anúncios eleitos e interpretar a pontuação (Score 0-100)'}
                    {lang === 'en' && 'How to read the 2 chosen ads and interpret the 0-100 Score'}
                    {lang === 'es' && 'Cómo leer los 2 anuncios elegidos e interpretar el Score 0-100'}
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <p>
                  Ao clicar em <strong>Avaliar ML</strong> no modal de qualquer produto, o Deal Hunter analisa todos os concorrentes da primeira página e elege apenas <strong>dois parâmetros oficiais</strong>:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase">
                      1. Anúncio Mais Vendido (Líder)
                    </span>
                    <h3 className="font-bold text-slate-950 text-sm">O Campeão em Volume</h3>
                    <p className="text-xs text-slate-700">
                      É o anúncio com o maior número de unidades vendidas comprovadas (ex: +10.000 un). É seu termômetro de validação de demanda.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 space-y-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-cyan-600 text-white font-black text-[10px] uppercase">
                      2. Menor Preço Válido
                    </span>
                    <h3 className="font-bold text-slate-950 text-sm">A Entrada Mais Agressiva</h3>
                    <p className="text-xs text-slate-700">
                      É a oferta com menor valor entre os concorrentes (com proteção anti-acessórios). Serve de balizador para você precificar com margem.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <p className="font-bold text-slate-900">Como interpretar o Score Clínico (0 a 100):</p>
                  <ul className="space-y-1 text-slate-600">
                    <li>🟢 <strong>Score 75 a 100 (Anúncio Forte)</strong>: Alta margem, concorrente líder com muitas vendas e baixo risco de desova. Excelente oportunidade.</li>
                    <li>🟡 <strong>Score 45 a 74 (Anúncio Mediano)</strong>: Margem moderada ou concorrência acirrada. Vale testar pequenos lotes de estoque.</li>
                    <li>🔴 <strong>Score abaixo de 45 (Anúncio Fraco / Evitar)</strong>: Margem líquida muito apertada ou produto com baixa tração no Mercado Livre.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* SEÇÃO 5: Calculadora de Margem, ROI & Simulador de Moeda */}
            <section id="calculator" className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    {t.sections.calculator}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {lang === 'pt' && 'Estrutura de custos, taxas do Mercado Livre e simulador interativo'}
                    {lang === 'en' && 'Cost breakdown, Mercado Libre fees, and interactive simulator'}
                    {lang === 'es' && 'Estructura de costos, comisiones de Mercado Libre y simulador interactivo'}
                  </p>
                </div>
              </div>

              {/* Simulador Interativo com Cotação de Moeda */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white space-y-4 shadow-lg">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="space-y-1">
                    <h3 className="font-bold text-base flex items-center gap-2">
                      <Coins className="w-5 h-5 text-amber-400" />
                      <span>{t.calculatorSimulatorTitle}</span>
                    </h3>
                    <p className="text-xs text-slate-300">
                      {t.calculatorSimulatorDesc} (Moeda ativa: <strong>{currency}</strong>).
                    </p>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {t.ratesLabel} 1 USD = R$ {rates.USD.toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">{t.buyPriceLabel}</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={calcInputBuyBrl}
                        onChange={(e) => setCalcInputBuyBrl(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">Em {currency}: {formatCurrency(calcInputBuyBrl)}</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">{t.sellPriceLabel}</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={calcInputSellBrl}
                        onChange={(e) => setCalcInputSellBrl(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">Em {currency}: {formatCurrency(calcInputSellBrl)}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                    <span className="text-[11px] text-slate-300 font-medium">{t.netProfitLabel}</span>
                    <p className="text-xl font-black text-emerald-400">
                      {formatCurrency(simNetProfitBrl)}
                    </p>
                    <span className="text-[10px] text-slate-400">Descontando taxas e tributos</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                    <span className="text-[11px] text-slate-300 font-medium">{t.roiLabel}</span>
                    <p className="text-xl font-black text-cyan-400">
                      {simRoiPercent}%
                    </p>
                    <span className="text-[10px] text-slate-400">Retorno sobre o capital investido</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed pt-2">
                <p className="font-bold text-slate-900">Como a Calculadora calcula seu lucro no Deal Hunter:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <p className="font-bold text-slate-900">1. Taxas do ML</p>
                    <p className="text-slate-600">Considera anúncio Clássico (11% a 14%) ou Premium (16% a 19%) com parcelamento sem juros.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <p className="font-bold text-slate-900">2. Frete & Logística</p>
                    <p className="text-slate-600">Calcula taxa fixa por item e subsídio de frete grátis em produtos acima de R$ 79,00.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <p className="font-bold text-slate-900">3. Imposto Real</p>
                    <p className="text-slate-600">Configurável para sua alíquota do Simples Nacional ou MEI na aba Configurações.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* SEÇÃO 6: Vitrine Pública de Ofertas */}
            <section id="showcase" className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center font-bold">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    {t.sections.showcase}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {lang === 'pt' && 'Como publicar e vender suas ofertas na vitrine compartilhável (/ofertas)'}
                    {lang === 'en' && 'How to publish and sell your deals on the public showcase (/ofertas)'}
                    {lang === 'es' && 'Cómo publicar y vender sus ofertas en la vitrina compartible (/ofertas)'}
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <p>
                  A <strong>Vitrine Pública</strong> (disponível em <code>/ofertas</code>) é sua página externa pronta para divulgar para clientes ou afiliados. Os produtos marcados aparecem organizados com cards, fotos e links diretos de compra.
                </p>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <p className="font-bold text-slate-900">Como adicionar um produto na Vitrine:</p>
                  <ol className="list-decimal pl-4 space-y-1.5 text-slate-600">
                    <li>No Radar ML ou dentro do modal de qualquer produto, clique no botão <strong>⭐ Na Vitrine / Destacar na Vitrine</strong>.</li>
                    <li>No menu superior do Dashboard, clique no botão amarelo <strong>&quot;Atualizar Vitrine&quot;</strong> para sincronizar instantaneamente.</li>
                    <li>Clique no botão <strong>&quot;Ver Vitrine&quot;</strong> para abrir a página pública <code>/ofertas</code> e compartilhar seu link!</li>
                  </ol>
                </div>
              </div>
            </section>

            {/* SEÇÃO 7: Dúvidas Frequentes (FAQ) */}
            <section id="faq" className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    {t.sections.faq}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {lang === 'pt' && 'Respostas para as dúvidas mais comuns'}
                    {lang === 'en' && 'Answers to the most frequently asked questions'}
                    {lang === 'es' && 'Respuestas a las preguntas más comunes'}
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <h3 className="font-bold text-slate-900">Preciso pagar alguma mensalidade pelo Google Gemini?</h3>
                  <p className="text-slate-600">
                    Não! A chave do Google Gemini gerada no Google AI Studio possui um limite gratuito generoso de até 15 requisições por minuto, o que é mais do que suficiente para uso diário intenso.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <h3 className="font-bold text-slate-900">Por que a extensão abre e fecha uma aba no Mercado Livre?</h3>
                  <p className="text-slate-600">
                    Isso é a <strong>tecnologia anti-bloqueio</strong> em ação: ao abrir a aba no seu próprio navegador, o Mercado Livre carrega com sua sessão de usuário real, evitando captchas e bloqueios de Cloudflare que barram servidores remotos. A aba fecha automaticamente em 1 segundo assim que os dados são lidos.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <h3 className="font-bold text-slate-900">Como funciona a conversão de moeda da documentação?</h3>
                  <p className="text-slate-600">
                    Nossa documentação consome a API oficial e gratuita da <strong>AwesomeAPI</strong>, trazendo a cotação comercial oficial de USD/BRL e EUR/BRL atualizada ao vivo a cada minuto para ajudar você a calcular importações e vendas internacionais.
                  </p>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Footer Light */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Deal Hunter Pro. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-600 hover:text-indigo-600 font-bold transition-colors">
              Dashboard
            </Link>
            <Link href="/ofertas" className="text-slate-600 hover:text-indigo-600 font-bold transition-colors">
              Vitrine de Ofertas
            </Link>
            <Link href="/privacy" className="text-slate-600 hover:text-indigo-600 font-bold transition-colors">
              Privacidade
            </Link>
            <Link href="/termos" className="text-slate-600 hover:text-indigo-600 font-bold transition-colors">
              Termos de Uso
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
