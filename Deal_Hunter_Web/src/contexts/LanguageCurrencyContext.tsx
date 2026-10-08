'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

export type Language = 'pt' | 'en' | 'es';
export type Currency = 'BRL' | 'USD' | 'EUR';

export interface ExchangeRates {
  USD: number; // 1 USD em BRL
  EUR: number; // 1 EUR em BRL
  updatedAt: string;
}

interface LanguageCurrencyContextType {
  lang: Language;
  setLang: (l: Language) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  rates: ExchangeRates;
  loadingRates: boolean;
  formatMoney: (amountInBrl: number) => string;
  convertFromBrl: (amountInBrl: number) => number;
  t: (key: string) => string;
}

const DEFAULT_RATES: ExchangeRates = {
  USD: 5.65,
  EUR: 6.15,
  updatedAt: '',
};

// Dicionário de traduções global
const translations: Record<Language, Record<string, string>> = {
  pt: {
    // Nav & Geral
    'nav.docs': 'Documentação',
    'nav.showcase': 'Vitrine de Ofertas',
    'nav.features': 'Recursos',
    'nav.pricing': 'Planos',
    'nav.support': 'Suporte',
    'nav.dashboard': 'Dashboard',
    'nav.login': 'Entrar',
    'nav.members': 'Membros',
    'nav.try_free': 'Testar 7 Dias Grátis',
    'nav.logout': 'Sair',
    'nav.calculator': 'Calculadora',

    // Landing Page Hero
    'hero.badge': 'Radar de Arbitragem & Monitor de Bugs em Tempo Real',
    'hero.title_pre': 'Monitore Ofertas e Encontre',
    'hero.title_hl': 'Arbitragens Lucrativas',
    'hero.title_post': 'em Poucos Segundos',
    'hero.subtitle': 'Varredura automática na Amazon, Mercado Livre, Kabum e Eletroclub. Identifique produtos com margem líquida real de revenda antes de todo mundo.',
    'hero.cta_start': 'Começar Agora — 7 Dias Grátis',
    'hero.cta_docs': 'Ver Documentação Oficial',
    'hero.cta_showcase': 'Acessar Vitrine de Ofertas',

    // Seção de Documentação na Home
    'docs_banner.badge': 'Guia Passo a Passo Oficial',
    'docs_banner.title': 'Documentação Completa para o Usuário',
    'docs_banner.desc': 'Aprenda do zero como conectar sua conta, instalar a extensão oficial do Chrome, configurar o bot do Telegram e realizar arbitragens seguras.',
    'docs_banner.btn': 'Acessar Central de Documentação',
    'docs_banner.free_badge': 'Acesso Livre e Gratuito — Sem necessidade de login',

    // Planos
    'pricing.monthly': 'Mensal',
    'pricing.annual': 'Anual',
    'pricing.month_suffix': '/mês',
    'pricing.start_trial': 'Começar Teste Grátis',

    // Dashboard
    'dash.title': 'Painel de Arbitragem & Radar',
    'dash.docs_btn': 'Documentação',
    'dash.new_analysis': 'Nova Análise',
    'dash.update_showcase': 'Atualizar Vitrine',
    'dash.view_showcase': 'Ver Vitrine',
    'dash.refresh': 'Atualizar',
    'dash.tab_radar': 'Radar de Ofertas',
    'dash.tab_calculator': 'Calculadora de Lucro',
    'dash.tab_manual': 'Busca Manual ML',
    'dash.tab_settings': 'Configurações',
    'dash.tab_status': 'Status da Conta',

    // Cards Métricas Dashboard
    'metric.total_deals': 'Oportunidades Monitoradas',
    'metric.high_profit': 'Alta Lucratividade (>30%)',
    'metric.avg_margin': 'Margem Média',
    'metric.est_profit': 'Lucro Potencial Total',

    // Radar Colunas e Filtros
    'radar.search_placeholder': 'Buscar por título, categoria ou marca...',
    'radar.filter_all': 'Todas as Lojas',
    'radar.col_product': 'Produto & Oferta',
    'radar.col_buy_price': 'Preço de Compra',
    'radar.col_ml_price': 'Preço Líder ML',
    'radar.col_net_profit': 'Lucro Líquido',
    'radar.col_margin': 'Margem',
    'radar.col_actions': 'Ações',
    'radar.buy_now': 'Comprar na Origem',
    'radar.view_ml': 'Ver no Mercado Livre',
    'radar.feature_in_showcase': 'Destacar na Vitrine',
    'radar.delete': 'Excluir Análise',
    'radar.sales_count': 'vendas',

    // Cotação
    'currency.rate_info': 'Cotação atualizada via AwesomeAPI',
  },
  en: {
    // Nav & Geral
    'nav.docs': 'Documentation',
    'nav.showcase': 'Deals Showcase',
    'nav.features': 'Features',
    'nav.pricing': 'Pricing',
    'nav.support': 'Support',
    'nav.dashboard': 'Dashboard',
    'nav.login': 'Sign In',
    'nav.members': 'Members',
    'nav.try_free': 'Start 7-Day Free Trial',
    'nav.logout': 'Sign Out',
    'nav.calculator': 'Calculator',

    // Landing Page Hero
    'hero.badge': 'Real-Time Arbitrage Radar & Price Bug Monitor',
    'hero.title_pre': 'Monitor Deals and Find',
    'hero.title_hl': 'Profitable Arbitrages',
    'hero.title_post': 'in Seconds',
    'hero.subtitle': 'Automated scanning on Amazon, Mercado Libre, Kabum, and Eletroclub. Identify products with real net resale margins before everyone else.',
    'hero.cta_start': 'Start Now — 7-Day Free Trial',
    'hero.cta_docs': 'View Official Documentation',
    'hero.cta_showcase': 'Explore Deals Showcase',

    // Seção de Documentação na Home
    'docs_banner.badge': 'Official Step-by-Step Guide',
    'docs_banner.title': 'Complete User Documentation',
    'docs_banner.desc': 'Learn from scratch how to connect your account, install the official Chrome extension, configure Telegram alerts, and execute profitable arbitrages.',
    'docs_banner.btn': 'Open Documentation Hub',
    'docs_banner.free_badge': 'Free Public Access — No login required',

    // Planos
    'pricing.monthly': 'Monthly',
    'pricing.annual': 'Annual',
    'pricing.month_suffix': '/mo',
    'pricing.start_trial': 'Start Free Trial',

    // Dashboard
    'dash.title': 'Arbitrage Radar & Dashboard',
    'dash.docs_btn': 'Documentation',
    'dash.new_analysis': 'New Analysis',
    'dash.update_showcase': 'Update Showcase',
    'dash.view_showcase': 'View Showcase',
    'dash.refresh': 'Refresh',
    'dash.tab_radar': 'Deals Radar',
    'dash.tab_calculator': 'Profit Calculator',
    'dash.tab_manual': 'ML Manual Search',
    'dash.tab_settings': 'Settings',
    'dash.tab_status': 'Account Status',

    // Cards Métricas Dashboard
    'metric.total_deals': 'Monitored Opportunities',
    'metric.high_profit': 'High Profit (>30%)',
    'metric.avg_margin': 'Average Margin',
    'metric.est_profit': 'Total Potential Profit',

    // Radar Colunas e Filtros
    'radar.search_placeholder': 'Search by title, category, or brand...',
    'radar.filter_all': 'All Stores',
    'radar.col_product': 'Product & Offer',
    'radar.col_buy_price': 'Purchase Price',
    'radar.col_ml_price': 'ML Leader Price',
    'radar.col_net_profit': 'Net Profit',
    'radar.col_margin': 'Margin',
    'radar.col_actions': 'Actions',
    'radar.buy_now': 'Buy at Source',
    'radar.view_ml': 'View on Mercado Libre',
    'radar.feature_in_showcase': 'Feature in Showcase',
    'radar.delete': 'Delete Deal',
    'radar.sales_count': 'sales',

    // Cotação
    'currency.rate_info': 'Live exchange rates powered by AwesomeAPI',
  },
  es: {
    // Nav & Geral
    'nav.docs': 'Documentación',
    'nav.showcase': 'Vitrina de Ofertas',
    'nav.features': 'Funciones',
    'nav.pricing': 'Planes',
    'nav.support': 'Soporte',
    'nav.dashboard': 'Panel de Control',
    'nav.login': 'Iniciar Sesión',
    'nav.members': 'Miembros',
    'nav.try_free': 'Probar 7 Días Gratis',
    'nav.logout': 'Cerrar Sesión',
    'nav.calculator': 'Calculadora',

    // Landing Page Hero
    'hero.badge': 'Radar de Arbitraje & Monitor de Errores de Precio en Tiempo Real',
    'hero.title_pre': 'Monitorea Ofertas y Encuentra',
    'hero.title_hl': 'Arbitrajes Rentables',
    'hero.title_post': 'en Segundos',
    'hero.subtitle': 'Rastreo automático en Amazon, Mercado Libre, Kabum y Eletroclub. Identifica productos con margen neto real de reventa antes que los demás.',
    'hero.cta_start': 'Comenzar Ahora — 7 Días Gratis',
    'hero.cta_docs': 'Ver Documentación Oficial',
    'hero.cta_showcase': 'Ver Vitrina de Ofertas',

    // Seção de Documentação na Home
    'docs_banner.badge': 'Guía Paso a Paso Oficial',
    'docs_banner.title': 'Documentación Completa para el Usuario',
    'docs_banner.desc': 'Aprende desde cero a conectar tu cuenta, instalar la extensión oficial de Chrome, configurar el bot de Telegram y ejecutar arbitrajes seguros.',
    'docs_banner.btn': 'Acceder a la Central de Documentación',
    'docs_banner.free_badge': 'Acceso Libre y Gratuito — Sin necesidad de iniciar sesión',

    // Planos
    'pricing.monthly': 'Mensual',
    'pricing.annual': 'Anual',
    'pricing.month_suffix': '/mes',
    'pricing.start_trial': 'Comenzar Prueba Gratis',

    // Dashboard
    'dash.title': 'Panel de Arbitraje & Radar',
    'dash.docs_btn': 'Documentación',
    'dash.new_analysis': 'Nuevo Análisis',
    'dash.update_showcase': 'Actualizar Vitrina',
    'dash.view_showcase': 'Ver Vitrina',
    'dash.refresh': 'Actualizar',
    'dash.tab_radar': 'Radar de Ofertas',
    'dash.tab_calculator': 'Calculadora de Ganancias',
    'dash.tab_manual': 'Búsqueda Manual ML',
    'dash.tab_settings': 'Configuración',
    'dash.tab_status': 'Estado de Cuenta',

    // Cards Métricas Dashboard
    'metric.total_deals': 'Oportunidades Monitoreadas',
    'metric.high_profit': 'Alta Rentabilidad (>30%)',
    'metric.avg_margin': 'Margen Promedio',
    'metric.est_profit': 'Ganancia Potencial Total',

    // Radar Colunas e Filtros
    'radar.search_placeholder': 'Buscar por título, categoría o marca...',
    'radar.filter_all': 'Todas las Tiendas',
    'radar.col_product': 'Producto & Oferta',
    'radar.col_buy_price': 'Precio de Compra',
    'radar.col_ml_price': 'Precio Líder ML',
    'radar.col_net_profit': 'Ganancia Neta',
    'radar.col_margin': 'Margen',
    'radar.col_actions': 'Acciones',
    'radar.buy_now': 'Comprar en Origen',
    'radar.view_ml': 'Ver en Mercado Libre',
    'radar.feature_in_showcase': 'Destacar en Vitrina',
    'radar.delete': 'Eliminar Análisis',
    'radar.sales_count': 'ventas',

    // Cotação
    'currency.rate_info': 'Tasas en tiempo real vía AwesomeAPI',
  },
};

const LanguageCurrencyContext = createContext<LanguageCurrencyContextType | undefined>(undefined);

export function LanguageCurrencyProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('pt');
  const [currency, setCurrencyState] = useState<Currency>('BRL');
  const [rates, setRates] = useState<ExchangeRates>(DEFAULT_RATES);
  const [loadingRates, setLoadingRates] = useState<boolean>(true);

  // Inicializa a partir do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('dealhunter_lang') as Language;
      if (savedLang && (savedLang === 'pt' || savedLang === 'en' || savedLang === 'es')) {
        setLangState(savedLang);
      } else {
        // Detecção automática
        const browserLang = navigator.language.slice(0, 2);
        if (browserLang === 'es') setLangState('es');
        else if (browserLang === 'en') setLangState('en');
        else setLangState('pt');
      }

      const savedCurrency = localStorage.getItem('dealhunter_currency') as Currency;
      if (savedCurrency && (savedCurrency === 'BRL' || savedCurrency === 'USD' || savedCurrency === 'EUR')) {
        setCurrencyState(savedCurrency);
      }
    }
  }, []);

  // Busca cotações reais da AwesomeAPI
  useEffect(() => {
    let isMounted = true;
    async function fetchRates() {
      try {
        setLoadingRates(true);
        const res = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL');
        if (res.ok) {
          const data = await res.json();
          const usdBrl = parseFloat(data?.USDBRL?.bid || '5.65');
          const eurBrl = parseFloat(data?.EURBRL?.bid || '6.15');
          if (isMounted) {
            setRates({
              USD: usdBrl,
              EUR: eurBrl,
              updatedAt: new Date().toLocaleTimeString(),
            });
          }
        }
      } catch (e) {
        console.warn('Usando cotações de fallback para USD e EUR:', e);
      } finally {
        if (isMounted) setLoadingRates(false);
      }
    }
    fetchRates();
    return () => {
      isMounted = false;
    };
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dealhunter_lang', l);
    }
  };

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dealhunter_currency', c);
    }
  };

  const convertFromBrl = (amountInBrl: number): number => {
    if (isNaN(amountInBrl)) return 0;
    if (currency === 'BRL') return amountInBrl;
    if (currency === 'USD') return amountInBrl / (rates.USD || 5.65);
    if (currency === 'EUR') return amountInBrl / (rates.EUR || 6.15);
    return amountInBrl;
  };

  const formatMoney = (amountInBrl: number): string => {
    if (isNaN(amountInBrl)) return 'R$ 0,00';
    const locale = lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : 'en-US';

    if (currency === 'BRL') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(amountInBrl);
    }

    if (currency === 'USD') {
      const converted = amountInBrl / (rates.USD || 5.65);
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(converted);
    }

    if (currency === 'EUR') {
      const converted = amountInBrl / (rates.EUR || 6.15);
      return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
      }).format(converted);
    }

    return `R$ ${amountInBrl.toFixed(2)}`;
  };

  const t = (key: string): string => {
    return translations[lang]?.[key] || translations.pt[key] || key;
  };

  const value = useMemo(
    () => ({
      lang,
      setLang,
      currency,
      setCurrency,
      rates,
      loadingRates,
      formatMoney,
      convertFromBrl,
      t,
    }),
    [lang, currency, rates, loadingRates]
  );

  return (
    <LanguageCurrencyContext.Provider value={value}>
      {children}
    </LanguageCurrencyContext.Provider>
  );
}

export function useLanguageCurrency() {
  const context = useContext(LanguageCurrencyContext);
  if (!context) {
    throw new Error('useLanguageCurrency deve ser usado dentro de LanguageCurrencyProvider');
  }
  return context;
}
