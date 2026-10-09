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
  getFaqs: () => Array<{ question: string; answer: string }>;
}

const DEFAULT_RATES: ExchangeRates = {
  USD: 5.65,
  EUR: 6.15,
  updatedAt: '',
};

// Dicionário de traduções global completo para toda a plataforma
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
    'hero.version_badge': 'Extensão Oficial Chrome Web Store · Versão 2.9',
    'hero.badge': 'Radar de Arbitragem & Monitor de Bugs em Tempo Real',
    'hero.h1_line1': 'Monitore os maiores e-commerces.',
    'hero.h1_line2': 'Compre no menor preço do mercado.',
    'hero.subtitle': 'O Deal Hunter Pro monitora continuamente Amazon Brasil, KaBuM!, Pichau, Shopee, Magalu, Renner, Shein e Eletroclub diretamente no seu navegador, alertando seu Telegram no segundo exato em que o preço despenca.',
    'hero.cta_chrome': 'Usar no Chrome (Oficial)',
    'hero.cta_docs': 'Documentação Oficial',
    'hero.cta_try': 'Testar 7 Dias Grátis',
    'hero.how_it_works': 'Como Funciona',
    'hero.trust_free': '7 dias grátis: sem cartão e sem Pix',
    'hero.trust_instant': 'Ativação imediata no 1º login',
    'hero.trust_price_prefix': 'Após os 7 dias:',
    'hero.trust_price_suffix': 'no Pix ou Cartão',
    'hero.social_proof': 'por mais de 500+ caçadores de ofertas e revendedores',

    // Lojas Carrossel
    'stores.badge': 'Lojas e Marketplaces Integrados em Tempo Real',

    // Showcase
    'showcase.badge': 'Radar Inteligente Ativo 24h',
    'showcase.autopilot_title': 'Piloto Automático em Ação',
    'showcase.autopilot_desc': 'Relaxe enquanto o Deal Hunter monitora centenas de categorias na Amazon e Magalu, disparando os maiores bugs com até 80% OFF.',
    'showcase.card1_badge': 'Automação Pura',
    'showcase.card1_title': 'Varredura 24h na Nuvem',
    'showcase.card1_desc': 'Zero proxies caros e zero scripts locais. A inteligência na nuvem monitora ofertas 24h com total discrição e velocidade, sem sobrecarregar seu computador.',
    'showcase.card2_badge': 'Velocidade Extrema',
    'showcase.card2_title': 'Telegram em Menos de 3s',
    'showcase.card2_desc': 'Preço caiu? Notificação imediata no celular com foto, histórico de queda e link seguro direto para a melhor oferta.',
    'showcase.card3_badge': 'Multilojas VIP',
    'showcase.card3_title': 'Amazon, Magalu & Eletroclub',
    'showcase.card3_desc': 'Suporte simultâneo às maiores plataformas do Brasil com login automático para preços VIP de funcionários na Eletroclub.',

    // Seção de Documentação na Home
    'docs_banner.badge': 'Guia Passo a Passo Oficial',
    'docs_banner.title': 'Documentação Completa para o Usuário',
    'docs_banner.desc': 'Aprenda do zero como conectar sua conta, instalar a extensão oficial do Chrome, configurar o bot do Telegram e realizar arbitragens seguras.',
    'docs_banner.btn': 'Acessar Central de Documentação',
    'docs_banner.free_badge': 'Acesso Livre e Gratuito — Sem necessidade de login',
    'docs_banner.step1_title': '1. Primeiros Passos',
    'docs_banner.step1_desc': 'Instalação oficial na Chrome Web Store com 1 clique e ativação imediata do período de 7 dias grátis.',
    'docs_banner.step2_title': '2. Chaves & Tokens',
    'docs_banner.step2_desc': 'Como obter seu Bot Token e Chat ID no Telegram em menos de 2 minutos para receber alertas no celular.',
    'docs_banner.step3_title': '3. Radar de Arbitragem',
    'docs_banner.step3_desc': 'Entenda o cálculo de margem líquida, comissões de marketplaces, verificação de concorrência e volume.',
    'docs_banner.step4_title': '4. Vitrine & Calculadora',
    'docs_banner.step4_desc': 'Como simular taxas de envio personalizadas e destacar ofertas na vitrine pública com estrela.',

    // Tutorial em Vídeo
    'video.badge': 'Instrução Rápida em Vídeo',
    'video.title': 'Como Instalar e Ativar a Extensão',
    'video.subtitle': 'Assista ao passo a passo de instalação no Google Chrome ou Edge e veja como ativar o robô em menos de 2 minutos.',
    'video.play_btn': 'Assistir Tutorial (2 min)',
    'video.verified': 'Extensão oficial verificada pelo Google. Instalação instantânea em 1 clique.',
    'video.add_chrome': 'Adicionar ao Chrome (Web Store)',

    // Bônus Profit Hunter
    'bonus.badge': 'Bônus Exclusivo Incluso Grátis',
    'bonus.unlocked': 'Liberado com o Deal Hunter Pro',
    'bonus.title': 'Profit Hunter Pro',
    'bonus.desc': 'Uma segunda extensão completa para você caçar ofertas de forma cirúrgica. Enquanto o Deal Hunter monitora centenas de categorias em massa na nuvem, o Profit Hunter injeta um botão flutuante inteligente em qualquer loja para capturar produtos direto da tela com 1 clique.',
    'bonus.btn_download': 'Baixar Bônus: Profit Hunter (.ZIP)',
    'bonus.btn_activate': 'Ativar 7 Dias Grátis com Bônus',

    // Planos
    'pricing.badge': 'Teste 100% Gratuito sem Compromisso',
    'pricing.title': '7 Dias de Teste Grátis Para Todos',
    'pricing.desc': 'Não precisa cadastrar cartão e nem pagar Pix para começar a testar. Basta fazer login para ter acesso total liberado por 7 dias. Após o teste, você escolhe como prefere continuar por apenas:',
    'pricing.cta_trial': 'Começar Meus 7 Dias Grátis (Sem Cartão)',
    'pricing.opt1_badge': 'Pagamento Manual',
    'pricing.opt1_tag': 'Opção 1 · Pix Instantâneo',
    'pricing.opt1_title': '30 Dias de Acesso via Pix',
    'pricing.opt1_desc': 'Ideal para quem deseja pagar mês a mês no Pix com controle total e sem renovações automáticas no cartão.',
    'pricing.opt1_period': '/ 30 dias de acesso',
    'pricing.opt1_sub': 'Pagamento avulso à vista · Você só renova quando quiser',
    'pricing.opt1_btn': 'Pagar via Pix',
    'pricing.opt1_note': 'Liberação automática instantânea por 30 dias',
    'pricing.opt2_badge': 'Renovação Automática',
    'pricing.opt2_tag': 'Opção 2 · Cartão de Crédito',
    'pricing.opt2_title': 'Assinatura Contínua',
    'pricing.opt2_desc': 'Mesmas vantagens com a conveniência de não precisar pagar manualmente todo mês para continuar com o serviço ativo.',
    'pricing.opt2_period': '/ mês',
    'pricing.opt2_sub': 'Renovação automática · Cancele com 1 clique a qualquer momento',
    'pricing.monthly': 'Mensal',
    'pricing.annual': 'Anual',
    'pricing.month_suffix': '/mês',

    // FAQ
    'faq.badge': 'Dúvidas Frequentes',
    'faq.title': 'Perguntas e Respostas Frequentes',
    'faq.subtitle': 'Tire suas dúvidas sobre o funcionamento, instalação, garantias e suporte.',
    'faq.contact': 'Falar com o Suporte',

    // Footer
    'footer.rights': 'Todos os direitos reservados.',
    'footer.terms': 'Termos de Uso',
    'footer.privacy': 'Política de Privacidade',

    // Dashboard
    'dash.title': 'Painel de Arbitragem & Radar',
    'dash.docs_btn': 'Documentação',
    'dash.new_analysis': 'Nova Análise',
    'dash.update_showcase': 'Atualizar Vitrine',
    'dash.view_showcase': 'Ver Vitrine',
    'dash.refresh': 'Atualizar',
    'dash.tab_radar': 'Radar ML',
    'dash.tab_calculator': 'Calculadora de Margem',
    'dash.tab_manual': 'Análise Manual',
    'dash.tab_settings': 'Configurações & APIs',
    'dash.tab_status': 'Diagnóstico',

    // Cards Métricas Dashboard
    'metric.total_deals': 'Total de Ofertas no Radar',
    'metric.viable_deals': 'Oportunidades Viáveis',
    'metric.avg_roi': 'ROI Médio Estimado',

    // Radar Colunas e Filtros
    'radar.search_placeholder': 'Buscar por produto, marca, loja ou palavra-chave...',
    'radar.filter_all': 'Todas as Lojas',
    'radar.col_product': 'Produto & Oferta',
    'radar.col_buy_price': 'Preço de Compra',
    'radar.col_ml_price': 'Preço Vencedor ML',
    'radar.col_net_profit': 'Lucro Líquido',
    'radar.col_margin': 'Margem',
    'radar.col_actions': 'Ações',
    'radar.buy_now': 'Comprar na Origem',
    'radar.view_ml': 'Ver no Mercado Livre',
    'radar.feature_in_showcase': 'Destacar na Vitrine',
    'radar.delete': 'Excluir Análise',

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
    'hero.version_badge': 'Official Chrome Web Store Extension · Version 2.9',
    'hero.badge': 'Real-Time Arbitrage Radar & Price Bug Monitor',
    'hero.h1_line1': 'Monitor top e-commerce stores.',
    'hero.h1_line2': 'Buy at the lowest market price.',
    'hero.subtitle': 'Deal Hunter Pro continuously scans Amazon, KaBuM!, Pichau, Shopee, Magalu, Renner, Shein, and Eletroclub right from your browser, alerting Telegram the instant prices drop.',
    'hero.cta_chrome': 'Add to Chrome (Official)',
    'hero.cta_docs': 'Official Documentation',
    'hero.cta_try': 'Start 7-Day Free Trial',
    'hero.how_it_works': 'How it Works',
    'hero.trust_free': '7-day free trial: no credit card needed',
    'hero.trust_instant': 'Instant activation on sign in',
    'hero.trust_price_prefix': 'After 7 days:',
    'hero.trust_price_suffix': 'with Card or Instant Pay',
    'hero.social_proof': 'rated 4.9/5 by 500+ deal hunters & sellers',

    // Lojas Carrossel
    'stores.badge': 'Real-Time Integrated Stores & Marketplaces',

    // Showcase
    'showcase.badge': '24/7 Smart Radar Active',
    'showcase.autopilot_title': 'Autopilot in Action',
    'showcase.autopilot_desc': 'Relax while Deal Hunter monitors hundreds of categories on Amazon and Magalu, discovering glitches with up to 80% OFF.',
    'showcase.card1_badge': 'Pure Automation',
    'showcase.card1_title': '24/7 Cloud Scanning',
    'showcase.card1_desc': 'Zero expensive proxies or local scripts. Cloud intelligence monitors deals 24/7 with total speed and discretion without burdening your PC.',
    'showcase.card2_badge': 'Extreme Speed',
    'showcase.card2_title': 'Telegram in Under 3s',
    'showcase.card2_desc': 'Price dropped? Instant smartphone notification with photo, price history, and direct verified deal links.',
    'showcase.card3_badge': 'VIP Multi-Stores',
    'showcase.card3_title': 'Amazon, Magalu & Eletroclub',
    'showcase.card3_desc': 'Simultaneous support for Brazil’s largest retail platforms with automated VIP employee discounts on Eletroclub.',

    // Seção de Documentação na Home
    'docs_banner.badge': 'Official Step-by-Step Guide',
    'docs_banner.title': 'Complete User Documentation',
    'docs_banner.desc': 'Learn from scratch how to connect your account, install the official Chrome extension, configure Telegram alerts, and execute profitable arbitrages.',
    'docs_banner.btn': 'Open Documentation Hub',
    'docs_banner.free_badge': 'Free Public Access — No login required',
    'docs_banner.step1_title': '1. Getting Started',
    'docs_banner.step1_desc': '1-click official installation on the Chrome Web Store and instant activation of your 7-day free trial.',
    'docs_banner.step2_title': '2. Keys & Tokens',
    'docs_banner.step2_desc': 'How to get your Telegram Bot Token and Chat ID in under 2 minutes to receive phone alerts.',
    'docs_banner.step3_title': '3. Arbitrage Radar',
    'docs_banner.step3_desc': 'Understand net profit calculations, marketplace fees, competitor benchmarks, and sales velocity.',
    'docs_banner.step4_title': '4. Showcase & Calculator',
    'docs_banner.step4_desc': 'How to simulate custom shipping rates and star featured deals on the public showcase.',

    // Tutorial em Vídeo
    'video.badge': 'Quick Video Tutorial',
    'video.title': 'How to Install and Activate the Extension',
    'video.subtitle': 'Watch the step-by-step setup on Google Chrome or Edge and activate the scanner in under 2 minutes.',
    'video.play_btn': 'Watch Tutorial (2 min)',
    'video.verified': 'Official verified Google extension. 1-click instant installation.',
    'video.add_chrome': 'Add to Chrome (Web Store)',

    // Bônus Profit Hunter
    'bonus.badge': 'Exclusive Bonus Included Free',
    'bonus.unlocked': 'Unlocked with Deal Hunter Pro',
    'bonus.title': 'Profit Hunter Pro',
    'bonus.desc': 'A second complete extension to hunt deals surgically. While Deal Hunter monitors hundreds of categories in bulk, Profit Hunter injects a smart floating button on any store to capture products from your screen in 1 click.',
    'bonus.btn_download': 'Download Bonus: Profit Hunter (.ZIP)',
    'bonus.btn_activate': 'Activate 7-Day Free Trial with Bonus',

    // Planos
    'pricing.badge': '100% Free Trial With No Commitment',
    'pricing.title': '7-Day Free Trial For Everyone',
    'pricing.desc': 'No credit card or prepayment required to start testing. Simply sign in to get full 7-day access. After the trial, choose how to continue for just:',
    'pricing.cta_trial': 'Start My 7 Days Free (No Card)',
    'pricing.opt1_badge': 'Manual Payment',
    'pricing.opt1_tag': 'Option 1 · Instant Pay',
    'pricing.opt1_title': '30 Days Access (One-time)',
    'pricing.opt1_desc': 'Ideal for paying month-to-month with total control and no automatic recurring charges.',
    'pricing.opt1_period': '/ 30 days access',
    'pricing.opt1_sub': 'One-time payment · Renew only when you wish',
    'pricing.opt1_btn': 'Pay with Instant Pay',
    'pricing.opt1_note': 'Instant automated activation for 30 days',
    'pricing.opt2_badge': 'Auto-Renewal',
    'pricing.opt2_tag': 'Option 2 · Credit Card',
    'pricing.opt2_title': 'Continuous Subscription',
    'pricing.opt2_desc': 'Same advantages with the peace of mind of not having to pay manually every month.',
    'pricing.opt2_period': '/ month',
    'pricing.opt2_sub': 'Auto-renewal · Cancel in 1 click anytime',
    'pricing.monthly': 'Monthly',
    'pricing.annual': 'Annual',
    'pricing.month_suffix': '/mo',

    // FAQ
    'faq.badge': 'Frequently Asked Questions',
    'faq.title': 'Frequently Asked Questions',
    'faq.subtitle': 'Clear your doubts about setup, features, security, and customer support.',
    'faq.contact': 'Contact Support',

    // Footer
    'footer.rights': 'All rights reserved.',
    'footer.terms': 'Terms of Service',
    'footer.privacy': 'Privacy Policy',

    // Dashboard
    'dash.title': 'Arbitrage Radar & Dashboard',
    'dash.docs_btn': 'Documentation',
    'dash.new_analysis': 'New Analysis',
    'dash.update_showcase': 'Update Showcase',
    'dash.view_showcase': 'View Showcase',
    'dash.refresh': 'Refresh',
    'dash.tab_radar': 'ML Radar',
    'dash.tab_calculator': 'Margin Calculator',
    'dash.tab_manual': 'Manual Analysis',
    'dash.tab_settings': 'Settings & APIs',
    'dash.tab_status': 'Diagnostics',

    // Cards Métricas Dashboard
    'metric.total_deals': 'Total Deals on Radar',
    'metric.viable_deals': 'Viable Opportunities',
    'metric.avg_roi': 'Estimated Average ROI',

    // Radar Colunas e Filtros
    'radar.search_placeholder': 'Search by product, brand, store, or keyword...',
    'radar.filter_all': 'All Stores',
    'radar.col_product': 'Product & Offer',
    'radar.col_buy_price': 'Purchase Price',
    'radar.col_ml_price': 'ML Winning Price',
    'radar.col_net_profit': 'Net Profit',
    'radar.col_margin': 'Margin',
    'radar.col_actions': 'Actions',
    'radar.buy_now': 'Buy at Source',
    'radar.view_ml': 'View on Mercado Libre',
    'radar.feature_in_showcase': 'Feature in Showcase',
    'radar.delete': 'Delete Deal',

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
    'hero.version_badge': 'Extensión Oficial Chrome Web Store · Versión 2.9',
    'hero.badge': 'Radar de Arbitraje & Monitor de Errores de Precio en Tiempo Real',
    'hero.h1_line1': 'Monitorea las mayores tiendas online.',
    'hero.h1_line2': 'Compra al precio más bajo del mercado.',
    'hero.subtitle': 'Deal Hunter Pro monitorea continuamente Amazon, KaBuM!, Pichau, Shopee, Magalu, Renner, Shein y Eletroclub directamente en tu navegador, alertando a Telegram en el segundo exacto en que el precio cae.',
    'hero.cta_chrome': 'Usar en Chrome (Oficial)',
    'hero.cta_docs': 'Documentación Oficial',
    'hero.cta_try': 'Probar 7 Días Gratis',
    'hero.how_it_works': 'Cómo Funciona',
    'hero.trust_free': '7 días gratis: sin tarjeta de crédito',
    'hero.trust_instant': 'Activación inmediata al iniciar sesión',
    'hero.trust_price_prefix': 'Tras los 7 días:',
    'hero.trust_price_suffix': 'con Tarjeta o Pago Rápido',
    'hero.social_proof': 'calificado 4.9/5 por más de 500+ cazadores de ofertas',

    // Lojas Carrossel
    'stores.badge': 'Tiendas y Marketplaces Integrados en Tiempo Real',

    // Showcase
    'showcase.badge': 'Radar Inteligente Activo 24h',
    'showcase.autopilot_title': 'Piloto Automático en Acción',
    'showcase.autopilot_desc': 'Relájate mientras Deal Hunter monitorea cientos de categorías en Amazon y Magalu, descubriendo errores con hasta 80% OFF.',
    'showcase.card1_badge': 'Automatización Pura',
    'showcase.card1_title': 'Rastreo 24h en la Nube',
    'showcase.card1_desc': 'Cero proxies costosos y sin scripts locales. La nube monitorea ofertas 24h con total velocidad y discreción sin sobrecargar tu PC.',
    'showcase.card2_badge': 'Velocidad Extrema',
    'showcase.card2_title': 'Telegram en Menos de 3s',
    'showcase.card2_desc': '¿Bajó el precio? Notificación instantánea al móvil con foto, historial y enlaces directos verificados a la mejor oferta.',
    'showcase.card3_badge': 'Multitiendas VIP',
    'showcase.card3_title': 'Amazon, Magalu & Eletroclub',
    'showcase.card3_desc': 'Soporte simultáneo a las mayores plataformas comerciales con inicio automático para precios VIP de empleados en Eletroclub.',

    // Seção de Documentação na Home
    'docs_banner.badge': 'Guía Paso a Paso Oficial',
    'docs_banner.title': 'Documentación Completa para el Usuario',
    'docs_banner.desc': 'Aprende desde cero a conectar tu cuenta, instalar la extensión oficial de Chrome, configurar el bot de Telegram y ejecutar arbitrajes seguros.',
    'docs_banner.btn': 'Acceder a la Central de Documentación',
    'docs_banner.free_badge': 'Acceso Libre y Gratuito — Sin necesidad de iniciar sesión',
    'docs_banner.step1_title': '1. Primeros Pasos',
    'docs_banner.step1_desc': 'Instalación oficial en Chrome Web Store con 1 clic y activación inmediata de tu prueba gratis de 7 días.',
    'docs_banner.step2_title': '2. Claves y Tokens',
    'docs_banner.step2_desc': 'Cómo obtener tu Bot Token y Chat ID en Telegram en menos de 2 minutos para recibir alertas en tu móvil.',
    'docs_banner.step3_title': '3. Radar de Arbitraje',
    'docs_banner.step3_desc': 'Comprende el cálculo de margen neto, comisiones de marketplace, competencia líder y volumen.',
    'docs_banner.step4_title': '4. Vitrina y Calculadora',
    'docs_banner.step4_desc': 'Cómo simular tarifas de envío personalizadas y destacar ofertas en la vitrina pública con estrella.',

    // Tutorial em Vídeo
    'video.badge': 'Instrucción Rápida en Video',
    'video.title': 'Cómo Instalar y Activar la Extensión',
    'video.subtitle': 'Mira el paso a paso de instalación en Google Chrome o Edge y activa el rastreador en menos de 2 minutos.',
    'video.play_btn': 'Ver Tutorial (2 min)',
    'video.verified': 'Extensión oficial verificada por Google. Instalación instantánea en 1 clic.',
    'video.add_chrome': 'Añadir a Chrome (Web Store)',

    // Bônus Profit Hunter
    'bonus.badge': 'Bono Exclusivo Incluido Gratis',
    'bonus.unlocked': 'Desbloqueado con Deal Hunter Pro',
    'bonus.title': 'Profit Hunter Pro',
    'bonus.desc': 'Una segunda extensión completa para cazar ofertas quirúrgicamente. Mientras Deal Hunter monitorea cientos de categorías, Profit Hunter inyecta un botón flotante inteligente en cualquier tienda para capturar productos desde tu pantalla en 1 clic.',
    'bonus.btn_download': 'Descargar Bono: Profit Hunter (.ZIP)',
    'bonus.btn_activate': 'Activar 7 Días Gratis con Bono',

    // Planos
    'pricing.badge': 'Prueba 100% Gratis sin Compromiso',
    'pricing.title': '7 Días de Prueba Gratis Para Todos',
    'pricing.desc': 'No necesitas registrar tarjeta ni pagar por adelantado para comenzar a probar. Solo inicia sesión para acceso completo por 7 días. Tras la prueba, continúa por tan solo:',
    'pricing.cta_trial': 'Comenzar Mis 7 Días Gratis (Sin Tarjeta)',
    'pricing.opt1_badge': 'Pago Manual',
    'pricing.opt1_tag': 'Opción 1 · Pago Rápido',
    'pricing.opt1_title': '30 Días de Acceso (Pago Único)',
    'pricing.opt1_desc': 'Ideal para pagar mes a mes con control total y sin renovaciones automáticas en tu tarjeta.',
    'pricing.opt1_period': '/ 30 días de acceso',
    'pricing.opt1_sub': 'Pago único · Solo renuevas cuando tú quieras',
    'pricing.opt1_btn': 'Pagar vía Pago Rápido',
    'pricing.opt1_note': 'Activación automática instantánea por 30 días',
    'pricing.opt2_badge': 'Renovación Automática',
    'pricing.opt2_tag': 'Opción 2 · Tarjeta de Crédito',
    'pricing.opt2_title': 'Suscripción Continua',
    'pricing.opt2_desc': 'Las mismas ventajas con la comodidad de no tener que pagar manualmente cada mes para seguir activo.',
    'pricing.opt2_period': '/ mes',
    'pricing.opt2_sub': 'Renovación automática · Cancela con 1 clic en cualquier momento',
    'pricing.monthly': 'Mensual',
    'pricing.annual': 'Anual',
    'pricing.month_suffix': '/mes',

    // FAQ
    'faq.badge': 'Preguntas Frecuentes',
    'faq.title': 'Preguntas y Respuestas Frecuentes',
    'faq.subtitle': 'Resuelve tus dudas sobre funcionamiento, instalación, garantías y soporte.',
    'faq.contact': 'Contactar a Soporte',

    // Footer
    'footer.rights': 'Todos los derechos reservados.',
    'footer.terms': 'Términos de Uso',
    'footer.privacy': 'Política de Privacidad',

    // Dashboard
    'dash.title': 'Panel de Arbitraje & Radar',
    'dash.docs_btn': 'Documentación',
    'dash.new_analysis': 'Nuevo Análisis',
    'dash.update_showcase': 'Actualizar Vitrina',
    'dash.view_showcase': 'Ver Vitrina',
    'dash.refresh': 'Actualizar',
    'dash.tab_radar': 'Radar ML',
    'dash.tab_calculator': 'Calculadora de Margen',
    'dash.tab_manual': 'Análisis Manual',
    'dash.tab_settings': 'Configuración & APIs',
    'dash.tab_status': 'Diagnóstico',

    // Cards Métricas Dashboard
    'metric.total_deals': 'Total de Ofertas en el Radar',
    'metric.viable_deals': 'Oportunidades Viables',
    'metric.avg_roi': 'ROI Promedio Estimado',

    // Radar Colunas e Filtros
    'radar.search_placeholder': 'Buscar por producto, marca, tienda o palabra clave...',
    'radar.filter_all': 'Todas las Tiendas',
    'radar.col_product': 'Producto & Oferta',
    'radar.col_buy_price': 'Precio de Compra',
    'radar.col_ml_price': 'Precio Ganador ML',
    'radar.col_net_profit': 'Ganancia Neta',
    'radar.col_margin': 'Margen',
    'radar.col_actions': 'Acciones',
    'radar.buy_now': 'Comprar en Origen',
    'radar.view_ml': 'Ver en Mercado Libre',
    'radar.feature_in_showcase': 'Destacar en Vitrina',
    'radar.delete': 'Eliminar Análisis',

    // Cotação
    'currency.rate_info': 'Tasas en tiempo real vía AwesomeAPI',
  },
};

// Dicionário de FAQ multilíngue
const faqsByLang: Record<Language, Array<{ question: string; answer: string }>> = {
  pt: [
    {
      question: 'Como instalar o Deal Hunter Pro pela Chrome Web Store oficial?',
      answer: 'A instalação é 100% oficial, segura e leva apenas 1 clique: 1) Clique no botão "Usar no Chrome" aqui na página; 2) Na Chrome Web Store oficial do Google, clique em "Usar no Chrome"; 3) O Chrome baixa e instala automaticamente a versão oficial verificada; 4) Abra a extensão e faça login direto com sua conta. Não é necessário descompactar pastas nem ativar o Modo do Desenvolvedor!',
    },
    {
      question: 'Quais são os requisitos mínimos e compatibilidade do Deal Hunter Pro?',
      answer: 'O Deal Hunter Pro é compatível com qualquer computador com Windows, macOS ou Linux que possua o Google Chrome ou navegadores Chromium (Microsoft Edge, Brave, Opera). Como o processamento pesado roda na nuvem, ele não sobrecarrega a memória nem o processador do seu computador.',
    },
    {
      question: 'Como funciona o período de teste grátis de 7 dias?',
      answer: 'Você pode testar todos os recursos ilimitados do Deal Hunter Pro por 7 dias inteiros. Se achar que a ferramenta não atendeu suas expectativas, cancele a qualquer momento com 1 clique diretamente na sua conta, sem perguntas ou burocracia.',
    },
    {
      question: 'Como os alertas chegam no meu Telegram?',
      answer: 'A extensão se conecta diretamente a um Bot e Chat do Telegram que você mesmo cria gratuitamente em 2 minutos. Toda vez que um preço cair ou um bug for encontrado, você recebe uma notificação no celular com foto, preço original, valor com desconto e link direto.',
    },
    {
      question: 'Preciso deixar o computador ligado para o Deal Hunter monitorar?',
      answer: 'Não! O motor de busca e análise do Deal Hunter Pro roda 100% na nuvem. Você não precisa executar scripts nem deixar o computador sobrecarregado.',
    },
    {
      question: 'Quais lojas são monitoradas atualmente?',
      answer: 'O Deal Hunter Pro monitora ativamente Amazon Brasil, Magazine Luiza, KaBuM!, Shopee, Pichau, Shein, Renner e Eletroclub (com login automático para preços VIP de funcionários). Novas lojas são adicionadas com frequência.',
    },
  ],
  en: [
    {
      question: 'How do I install Deal Hunter Pro from the official Chrome Web Store?',
      answer: 'Installation is 100% official, secure, and takes just 1 click: 1) Click "Add to Chrome" here; 2) On Google Chrome Web Store, click "Add to Chrome"; 3) Chrome automatically downloads and installs the verified version; 4) Open the extension and sign in with your account. No developer mode or manual unpacking required!',
    },
    {
      question: 'What are the minimum system requirements and compatibility?',
      answer: 'Deal Hunter Pro is compatible with Windows, macOS, and Linux computers running Google Chrome or Chromium browsers (Edge, Brave, Opera). Since heavy scans run in the cloud, it does not burden your PC memory or processor.',
    },
    {
      question: 'How does the 7-day free trial work?',
      answer: 'You can test all unlimited features of Deal Hunter Pro for 7 full days. No credit card or upfront payment required to get started. Cancel anytime with 1 click directly from your account with zero hassle.',
    },
    {
      question: 'How do alerts arrive in my Telegram?',
      answer: 'The extension connects directly to your free Telegram Bot and Chat created in under 2 minutes. Whenever a price drops or a glitch is found, you receive an instant phone notification with image, discount, and direct link.',
    },
    {
      question: 'Do I need to leave my computer on for Deal Hunter to monitor?',
      answer: 'No! The Deal Hunter Pro engine runs 100% in the cloud. You do not need to run local background scripts or leave your PC turned on.',
    },
    {
      question: 'Which stores are currently monitored?',
      answer: 'Deal Hunter Pro actively scans Amazon, Magazine Luiza, KaBuM!, Shopee, Pichau, Shein, Renner, and Eletroclub (with automated VIP employee discounts). New marketplaces are added continuously.',
    },
  ],
  es: [
    {
      question: '¿Cómo instalo Deal Hunter Pro desde la Chrome Web Store oficial?',
      answer: 'La instalación es 100% oficial, segura y toma 1 clic: 1) Haz clic en "Añadir a Chrome" aquí; 2) En la tienda oficial de Google, haz clic en "Añadir a Chrome"; 3) Chrome descarga e instala la versión verificada; 4) Abre la extensión e inicia sesión. ¡Sin necesidad de descomprimir archivos ni activar modo desarrollador!',
    },
    {
      question: '¿Cuáles son los requisitos mínimos y compatibilidad?',
      answer: 'Deal Hunter Pro es compatible con Windows, macOS y Linux en Google Chrome o navegadores Chromium (Edge, Brave, Opera). Dado que el procesamiento se ejecuta en la nube, no sobrecarga tu memoria ni procesador.',
    },
    {
      question: '¿Cómo funciona la prueba gratuita de 7 días?',
      answer: 'Puedes probar todas las funciones ilimitadas durante 7 días completos sin necesidad de registrar tarjeta de crédito. Cancela en cualquier momento con 1 clic sin preguntas ni trabas.',
    },
    {
      question: '¿Cómo llegan las alertas a mi Telegram?',
      answer: 'La extensión se conecta directamente a un Bot y Chat de Telegram gratuito configurado en 2 minutos. Cada vez que baja un precio, recibes una notificación en tu móvil con foto, descuento y enlace directo.',
    },
    {
      question: '¿Necesito dejar el ordenador encendido para monitorizar?',
      answer: '¡No! El motor de búsqueda de Deal Hunter Pro funciona 100% en la nube. No necesitas dejar scripts locales corriendo ni tu PC encendido.',
    },
    {
      question: '¿Qué tiendas están monitorizadas actualmente?',
      answer: 'Deal Hunter Pro monitoriza activamente Amazon, Magazine Luiza, KaBuM!, Shopee, Pichau, Shein, Renner y Eletroclub (con descuentos VIP). Nuevas tiendas se integran con regularidad.',
    },
  ],
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

  const getFaqs = () => {
    return faqsByLang[lang] || faqsByLang.pt;
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
      getFaqs,
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
