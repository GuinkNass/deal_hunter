'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Download,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Play,
  Zap,
  BellRing,
  Store,
  Sliders,
  Laptop,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MessageCircle,
  Menu,
  X,
  Lock,
  Gift,
  Star,
  Flame,
  Check,
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [downloadToast, setDownloadToast] = useState(false);

  // Links de pagamento e download
  const downloadZipUrl = '/downloads/deal-hunter-pro.zip';
  const infinitePayPixUrl = 'https://checkout.infinitepay.io/guilherme-rodrigues-u8i/AoJYT9KaSj';
  const stripeCardUrl = '/login';
  const checkoutUrl = '/login';
  // Placeholder para o vídeo de tutorial/demonstração
  const demoVideoEmbedUrl = 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1';

  function triggerDownload() {
    setDownloadToast(true);
    setTimeout(() => setDownloadToast(false), 5000);
  }

  function toggleFaq(index: number) {
    setActiveFaq(activeFaq === index ? null : index);
  }

  const faqs = [
    {
      question: 'Como instalar a extensão a partir do arquivo .ZIP no Chrome ou Edge?',
      answer:
        'A instalação leva menos de 1 minuto: 1) Baixe o arquivo .ZIP clicando no botão de download; 2) Descompacte o arquivo no seu computador; 3) No Chrome ou Edge, acesse chrome://extensions e ative o "Modo do Desenvolvedor" no canto superior direito; 4) Clique em "Carregar sem compactação" e selecione a pasta "Extensao". Pronto!',
    },
    {
      question: 'Como funciona o período de teste grátis de 7 dias?',
      answer:
        'Você pode testar todos os recursos ilimitados do Deal Hunter Pro por 7 dias inteiros. Se por qualquer motivo você achar que a ferramenta não se pagou logo nos primeiros descontos encontrados, basta cancelar com 1 clique diretamente na sua conta, sem perguntas ou burocracia.',
    },
    {
      question: 'Como os alertas chegam no meu Telegram?',
      answer:
        'A extensão se conecta diretamente a um Bot e Chat do Telegram que você mesmo cria gratuitamente em 2 minutos. Toda vez que um preço cair ou um bug promocional for encontrado, você recebe uma notificação no celular com foto, preço original, valor com desconto e link direto do produto.',
    },
    {
      question: 'Preciso deixar o computador ligado para o Deal Hunter monitorar?',
      answer:
        'Sim! Diferente de serviços compartilhados na nuvem que sofrem com bloqueios de IP constantes, o Deal Hunter roda como um motor local e extensão no seu navegador. Isso garante velocidade máxima, privacidade absoluta e zero risco de ser bloqueado pelas lojas.',
    },
    {
      question: 'Quais lojas são monitoradas atualmente?',
      answer:
        'O Deal Hunter Pro monitora ativamente a Amazon Brasil, Magazine Luiza (Magalu) e Eletroclub (com login automático para preços VIP de funcionários). Novas lojas e marketplaces são adicionados com frequência através das atualizações automáticas.',
    },
    {
      question: 'Posso cancelar a qualquer momento?',
      answer:
        'Com certeza! Não há período de fidelidade ou contrato de permanência. Você gerencia sua assinatura de forma 100% autônoma pelo portal de clientes Stripe com cancelamento instantâneo a qualquer momento.',
    },
    {
      question: 'Como recebo as atualizações da extensão?',
      answer:
        'Todas as atualizações de catálogo de categorias, novas regras de desconto e correções de layout das lojas são disponibilizadas diretamente no portal de membros e sincronizadas com a sua extensão.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#07090e] text-[#f1f5f9] selection:bg-orange-500/30 selection:text-orange-200 antialiased overflow-x-hidden">
      {/* Toast de Download Iniciado */}
      {downloadToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 p-4 bg-gray-900/95 border border-emerald-500/60 rounded-2xl shadow-2xl shadow-emerald-950/60 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Download Iniciado!</p>
            <p className="text-[11px] text-gray-300">
              Extraia o arquivo .zip e siga o guia de instalação em 1 minuto.
            </p>
          </div>
        </div>
      )}

      {/* Glows Decorativos de Fundo */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-orange-500/15 via-amber-500/5 to-transparent blur-[140px] pointer-events-none -z-10" />
      <div className="fixed top-1/3 -left-40 w-[500px] h-[500px] bg-emerald-500/10 blur-[150px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 -right-40 w-[600px] h-[600px] bg-orange-600/10 blur-[160px] pointer-events-none -z-10" />

      {/* ========================================================================= */}
      {/* 1. HEADER / NAVBAR                                                        */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#07090e]/80 border-b border-gray-800/60 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Marca */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 p-[1px] shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-all">
              <div className="w-full h-full bg-[#0d111a] rounded-[11px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-400 fill-orange-400/20" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                Deal Hunter
              </span>
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-md shadow-sm">
                Pro
              </span>
            </div>
          </Link>

          {/* Links de Navegação Desktop */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            <a href="#como-funciona" className="hover:text-white transition-colors">
              Como Funciona
            </a>
            <a href="#demonstracao" className="hover:text-white transition-colors">
              Demonstração
            </a>
            <a href="#recursos" className="hover:text-white transition-colors">
              Recursos
            </a>
            <a href="#planos" className="hover:text-white transition-colors">
              Planos
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          {/* CTAs Header Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs font-semibold text-gray-300 hover:text-white px-3 py-2 transition-colors"
            >
              Área de Membros
            </Link>
            <a
              href="#planos"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 transition-all active:scale-[0.98]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Testar 7 Dias Grátis</span>
            </a>
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
            <div className="flex flex-col space-y-3 text-sm font-medium text-gray-300">
              <a
                href="#como-funciona"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-white"
              >
                Como Funciona
              </a>
              <a
                href="#demonstracao"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-white"
              >
                Demonstração
              </a>
              <a
                href="#recursos"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-white"
              >
                Recursos
              </a>
              <a
                href="#planos"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-white"
              >
                Planos
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-white"
              >
                FAQ
              </a>
            </div>
            <div className="pt-3 border-t border-gray-800/80 flex flex-col gap-2.5">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl border border-gray-700 text-xs font-semibold text-gray-200"
              >
                Área de Membros / Login
              </Link>
              <a
                href="#planos"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-500/20"
              >
                Testar 7 Dias Grátis
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION (PRIMEIRA DOBRA)                                          */}
      {/* ========================================================================= */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          
          {/* Badge de Destaque Superior */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold uppercase tracking-wider backdrop-blur-md animate-in fade-in duration-700">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            Extensão para Navegador · Versão 2.9
          </div>

          {/* Headline Principal */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
            Encontre Superdescontos e <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
              Bugs de Preço em Tempo Real
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-gray-300 leading-relaxed font-normal">
            O <strong>Deal Hunter Pro</strong> é a extensão inteligente que monitora <strong>Amazon Brasil, Magazine Luiza e Eletroclub</strong> diretamente no seu navegador, alertando seu Telegram no segundo exato em que o preço despenca.
          </p>

          {/* CTAs Principais da Hero */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            {/* Botão Primário: Download Direto do ZIP */}
            <a
              href={downloadZipUrl}
              download="Deal_Hunter_Cliente.zip"
              onClick={triggerDownload}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm sm:text-base shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all active:scale-[0.98]"
            >
              <Download className="w-5 h-5" />
              <span>Baixar Extensão (.ZIP)</span>
            </a>

            {/* Botão Secundário: Teste 7 Dias */}
            <a
              href="#planos"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-[#121622] hover:bg-[#181e2e] border border-gray-700/80 hover:border-gray-600 text-white font-bold text-sm sm:text-base shadow-lg transition-all active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Testar 7 Dias Grátis</span>
            </a>
          </div>

          {/* Badges de Confiança */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>7 dias de garantia incondicional</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Instalação em 1 minuto</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Sem fidelidade: cancele quando quiser</span>
            </div>
          </div>

          {/* Avaliação Social Proof */}
          <div className="pt-2 flex items-center justify-center gap-2 text-xs text-gray-400">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
              ))}
            </div>
            <span>
              <strong className="text-white">4.9/5</strong> por mais de 500+ caçadores de ofertas e afiliados
            </span>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SEÇÃO DE VÍDEO / DEMONSTRAÇÃO PRÁTICA                                   */}
      {/* ========================================================================= */}
      <section id="demonstracao" className="py-16 sm:py-24 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-3 mb-10">
            <h2 className="text-xs font-bold text-orange-400 uppercase tracking-widest">
              Demonstração ao Vivo
            </h2>
            <p className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Veja o Deal Hunter Pro em Ação
            </p>
            <p className="text-sm text-gray-400 max-w-xl mx-auto">
              Assista como o robô varre dezenas de categorias por minuto e despacha alertas com link direto para o Telegram.
            </p>
          </div>

          {/* Mockup de Janela do Navegador / Player */}
          <div className="relative rounded-3xl bg-[#111622] border border-[#232b3e] shadow-2xl shadow-black/80 overflow-hidden group">
            {/* Barra Superior estilo Chrome/MacOS */}
            <div className="px-4 py-3 bg-[#0c1018] border-b border-[#202738] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
              </div>
              <div className="flex-1 max-w-md mx-auto hidden sm:flex items-center justify-center gap-2 px-3 py-1 rounded-lg bg-[#141a27] border border-gray-800 text-[11px] text-gray-400 font-mono">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>dealhunterpro.com.br/scan-engine</span>
              </div>
              <div className="text-[11px] text-gray-500 font-medium">Extensão Ativa</div>
            </div>

            {/* Conteúdo do Player / Vídeo */}
            <div className="relative aspect-video w-full bg-[#0a0d14] flex items-center justify-center overflow-hidden">
              {videoPlaying ? (
                <iframe
                  src={demoVideoEmbedUrl}
                  title="Tutorial Deal Hunter Pro"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#121724] to-[#0a0d14]">
                  {/* Gradiente decorativo dentro do player */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.12)_0,transparent_70%)] pointer-events-none" />

                  {/* Botão de Play Chamativo */}
                  <button
                    onClick={() => setVideoPlaying(true)}
                    className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 text-white flex items-center justify-center shadow-2xl shadow-orange-500/40 hover:scale-105 active:scale-95 transition-all group-hover:shadow-orange-500/60"
                    aria-label="Assistir vídeo de demonstração"
                  >
                    <Play className="w-8 h-8 fill-white translate-x-0.5" />
                  </button>

                  <div className="relative z-10 mt-6 space-y-1">
                    <p className="text-sm sm:text-base font-bold text-white">
                      Clique para assistir ao tutorial completo (2 min)
                    </p>
                    <p className="text-xs text-gray-400">
                      Veja a instalação, configuração do Telegram e a captura de ofertas ao vivo
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Legenda inferior do card */}
            <div className="p-4 sm:p-5 bg-[#0f1420] border-t border-[#202738] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Varreduras automáticas em segundo plano com notificações em &lt; 3 segundos.</span>
              </div>
              <a
                href={downloadZipUrl}
                download="Deal_Hunter_Cliente.zip"
                onClick={triggerDownload}
                className="text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <span>Baixar para testar agora</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. GUIA PASSO A PASSO ("COMO USAR EM 3 PASSOS")                           */}
      {/* ========================================================================= */}
      <section id="como-funciona" className="py-16 sm:py-24 bg-[#0a0d15]/60 border-y border-gray-800/60 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-xs font-bold text-orange-400 uppercase tracking-widest">
              Passo a Passo Simples
            </h2>
            <p className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Como Começar em Menos de 1 Minuto
            </p>
            <p className="text-sm text-gray-400 max-w-xl mx-auto">
              Sem configurações complexas ou necessidade de programar. Tudo vem pronto para rodar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            
            {/* Passo 1 */}
            <div className="relative p-6 sm:p-8 rounded-3xl bg-[#111624] border border-[#222b3e] shadow-xl hover:border-orange-500/40 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center font-black text-lg mb-6 group-hover:bg-orange-500 group-hover:text-white transition-all shadow-md">
                1
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Baixe e Extraia o Pacote
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-4">
                Clique no botão de download para baixar o arquivo <strong>.ZIP</strong> com a extensão e o motor local pré-configurados. Basta descompactar em qualquer pasta.
              </p>
              <div className="pt-2">
                <a
                  href={downloadZipUrl}
                  download="Deal_Hunter_Cliente.zip"
                  onClick={triggerDownload}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar .ZIP agora</span>
                </a>
              </div>
            </div>

            {/* Passo 2 */}
            <div className="relative p-6 sm:p-8 rounded-3xl bg-[#111624] border border-[#222b3e] shadow-xl hover:border-amber-500/40 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black text-lg mb-6 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-md">
                2
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Ative com 7 Dias Grátis
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-4">
                Inicie o arquivo <strong>2-Ativar-Backend.bat</strong> e ative sua conta pelo painel web. Você ganha 7 dias de acesso completo sem compromisso.
              </p>
              <div className="pt-2">
                <a
                  href="#planos"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ativar teste de 7 dias</span>
                </a>
              </div>
            </div>

            {/* Passo 3 */}
            <div className="relative p-6 sm:p-8 rounded-3xl bg-[#111624] border border-[#222b3e] shadow-xl hover:border-emerald-500/40 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black text-lg mb-6 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-md">
                3
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Fixe no Chrome &amp; Lucre
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-4">
                Abra a extensão no Chrome, selecione as lojas e categorias de interesse e receba as oportunidades mais quentes direto no Telegram.
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  <span>Alertas 100% no automático</span>
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. RECURSOS & BENEFÍCIOS (FEATURES GRID)                                  */}
      {/* ========================================================================= */}
      <section id="recursos" className="py-16 sm:py-24 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-xs font-bold text-orange-400 uppercase tracking-widest">
              Poder e Inteligência
            </h2>
            <p className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Recursos Criados para Quem Leva Economia a Sério
            </p>
            <p className="text-sm text-gray-400 max-w-xl mx-auto">
              Desenvolvido tanto para compradores inteligentes quanto para afiliados e gestores de grupos de ofertas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="p-6 rounded-3xl bg-[#10141f] border border-[#202738] hover:border-orange-500/30 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Detecção Imediata de Preços</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Varredura contínua de páginas oficiais de ofertas. Identifica bugs de desconto e quedas abruptas de preço antes dos grupos convencionais.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-3xl bg-[#10141f] border border-[#202738] hover:border-amber-500/30 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Integração com 3 Grandes Lojas</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Suporte nativo e simultâneo para <strong>Amazon Brasil</strong>, <strong>Magazine Luiza</strong> e <strong>Eletroclub</strong> (com login automático corporativo).
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-3xl bg-[#10141f] border border-[#202738] hover:border-emerald-500/30 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <BellRing className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Alertas Ricos no Telegram</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Receba mensagens formatadas com foto em alta qualidade, valor antigo, preço promocional, porcentagem de desconto e link de compra rápida.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-6 rounded-3xl bg-[#10141f] border border-[#202738] hover:border-blue-500/30 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Laptop className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Motor Local Anti-Bloqueio</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                A extensão navega usando a sua própria conexão residencial. Sem proxies caros, sem capchas irritantes e com total discrição perante as lojas.
              </p>
            </div>

            {/* Card 5 */}
            <div className="p-6 rounded-3xl bg-[#10141f] border border-[#202738] hover:border-purple-500/30 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Filtros Finos e Personalizados</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Configure % mínimo de desconto (ex: somente acima de 40% OFF), faixa de preço máxima e categorias específicas como Eletrônicos, Gamer e Eletro.
              </p>
            </div>

            {/* Card 6 */}
            <div className="p-6 rounded-3xl bg-[#10141f] border border-[#202738] hover:border-emerald-500/30 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Privacidade e Segurança</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Seus dados de navegação, bots do Telegram e tokens de autenticação ficam armazenados de forma criptografada apenas na sua máquina.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. TABELA DE PREÇOS & PLANOS (PRICING)                                     */}
      {/* ========================================================================= */}
      <section id="planos" className="py-16 sm:py-24 bg-[#0a0d15]/80 border-y border-gray-800/60 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-3 mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold uppercase tracking-wider">
              <Gift className="w-3.5 h-3.5" />
              Escolha a Melhor Opção Para Você
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Planos Flexíveis e Sem Pegadinhas
            </h2>
            <p className="text-sm text-gray-300 max-w-xl mx-auto">
              Pague menos no Pix com liberação imediata ou experimente grátis por 7 dias no cartão de crédito.
            </p>
          </div>

          {/* Grid de Planos: Pix Instantâneo vs. Cartão de Crédito */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            
            {/* CARD 1: PIX INSTANTÂNEO (INFINITEPAY) - DESTAQUE ECONÔMICO */}
            <div className="relative rounded-3xl bg-gradient-to-b from-[#0f1f1a] via-[#0d1715] to-[#0a100f] border-2 border-emerald-500/70 p-7 sm:p-9 shadow-2xl shadow-emerald-950/40 flex flex-col justify-between overflow-hidden group hover:border-emerald-400 transition-all">
              
              {/* Badge Topo */}
              <div className="absolute top-0 right-0">
                <div className="bg-gradient-to-l from-emerald-500 to-teal-500 text-white text-[11px] font-black uppercase tracking-wider py-1.5 px-5 rounded-bl-2xl shadow-md flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  <span>Mais Econômico</span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Pix Instantâneo (InfinitePay)</span>
                </div>
                <h3 className="text-2xl font-black text-white">
                  Acesso Mensal via Pix
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed mt-1">
                  Ideal para quem deseja ativar na hora pagando menos, sem necessidade de cartão de crédito.
                </p>

                {/* Preço */}
                <div className="mt-6 mb-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-white">
                      R$ 29,90
                    </span>
                    <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
                      / 30 dias de acesso
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Pagamento único à vista · Sem renovações automáticas inesperadas
                  </p>
                </div>

                {/* Checklist de Benefícios */}
                <div className="pt-6 border-t border-emerald-500/20 my-6">
                  <p className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-3">
                    O que está liberado no Pix:
                  </p>
                  <ul className="space-y-2.5 text-xs text-gray-200">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span><strong>Ativação imediata:</strong> licença liberada em segundos</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>30 dias completos de monitoramento ilimitado</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Varredura simultânea de Amazon, Magalu e Eletroclub</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Alertas de bugs e quedas direto no Telegram em &lt; 3s</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Download imediato da extensão (.zip) pré-configurada</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Suporte técnico prioritário via WhatsApp</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Botão de Ação Pix */}
              <div className="pt-2">
                <a
                  href={infinitePayPixUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all active:scale-[0.98]"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Pagar R$ 29,90 via Pix</span>
                </a>
                <p className="text-center text-[11px] text-emerald-400 font-medium mt-2.5">
                  ⚡ Checkout oficial seguro InfinitePay com liberação automática
                </p>
              </div>

            </div>

            {/* CARD 2: CARTÃO DE CRÉDITO (STRIPE) - 7 DIAS GRÁTIS */}
            <div className="relative rounded-3xl bg-gradient-to-b from-[#141a29] via-[#0f1422] to-[#0a0d15] border-2 border-orange-500/60 p-7 sm:p-9 shadow-2xl shadow-orange-500/10 flex flex-col justify-between overflow-hidden group hover:border-orange-400 transition-all">
              
              {/* Badge Topo */}
              <div className="absolute top-0 right-0">
                <div className="bg-gradient-to-l from-orange-500 to-amber-500 text-white text-[11px] font-black uppercase tracking-wider py-1.5 px-5 rounded-bl-2xl shadow-md flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span>7 Dias Sem Custo</span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-wider mb-2">
                  <Flame className="w-3.5 h-3.5 fill-orange-400" />
                  <span>Cartão de Crédito (Stripe)</span>
                </div>
                <h3 className="text-2xl font-black text-white">
                  Assinatura com Teste Grátis
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed mt-1">
                  Teste todos os recursos sem pagar nada hoje. Cancele quando quiser antes do 7º dia.
                </p>

                {/* Preço com Toggle Mensal / Anual */}
                <div className="mt-5 mb-2">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-xs font-semibold ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-400'}`}>
                      Mensal
                    </span>
                    <button
                      type="button"
                      onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                      className="relative w-11 h-5 bg-gray-800 rounded-full p-0.5 transition-colors focus:outline-none"
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-orange-500 transition-transform ${
                          billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-semibold ${billingCycle === 'annual' ? 'text-white' : 'text-gray-400'}`}>
                        Anual (-20%)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-white">
                      {billingCycle === 'monthly' ? 'R$ 49,90' : 'R$ 39,90'}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">/ mês</span>
                  </div>
                  <p className="text-[11px] text-amber-400 font-semibold mt-1">
                    🛡️ Primeiros 7 dias grátis · Renovação automática após o período
                  </p>
                </div>

                {/* Checklist de Benefícios */}
                <div className="pt-6 border-t border-orange-500/20 my-6">
                  <p className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-3">
                    Incluso no teste de 7 dias:
                  </p>
                  <ul className="space-y-2.5 text-xs text-gray-200">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span><strong>7 dias inteiros</strong> sem cobrança inicial no cartão</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Varreduras ilimitadas 24h por dia</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Monitoramento de Amazon, Magalu e Eletroclub</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Alertas instantâneos em canais/grupos do Telegram</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Extensão oficial compatível com Google Chrome e Edge</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Cancelamento com 1 clique a qualquer momento no portal</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Botão de Ação Cartão */}
              <div className="pt-2">
                <Link
                  href={stripeCardUrl}
                  className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5 transition-all active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Testar 7 Dias Grátis no Cartão</span>
                </Link>
                <p className="text-center text-[11px] text-gray-400 mt-2.5">
                  🛡️ Pagamento seguro via Stripe · Cancele antes de 7 dias sem custos
                </p>
              </div>

            </div>

          </div>

          {/* Rodapé da Seção com Garantia */}
          <div className="mt-12 p-5 rounded-2xl bg-[#0d121c] border border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-300">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <span>
                <strong>Garantia de Satisfação:</strong> Se o Deal Hunter Pro não te fizer economizar ou lucrar mais do que a mensalidade, nós devolvemos o seu dinheiro.
              </span>
            </div>
            <div className="flex items-center gap-3 text-gray-400 font-medium">
              <span className="text-white font-semibold">Métodos Aceitos:</span>
              <span className="text-emerald-400 font-bold">⚡ Pix Instantâneo</span>
              <span>·</span>
              <span className="text-orange-400 font-bold">💳 Cartão de Crédito</span>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FAQ (PERGUNTAS FREQUENTES)                                              */}
      {/* ========================================================================= */}
      <section id="faq" className="py-16 sm:py-24 relative">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-xs font-bold text-orange-400 uppercase tracking-widest">
              Tire Suas Dúvidas
            </h2>
            <p className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Perguntas Frequentes
            </p>
            <p className="text-sm text-gray-400">
              Tudo o que você precisa saber antes de começar seu teste gratuito.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-[#0f131d] border border-[#1f2638] overflow-hidden transition-all"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full py-4 px-6 text-left flex items-center justify-between gap-4 focus:outline-none"
                  >
                    <span className="text-sm sm:text-base font-bold text-white">
                      {faq.question}
                    </span>
                    <span className="text-orange-400 flex-shrink-0">
                      {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-gray-300 leading-relaxed border-t border-[#1a2130]">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FOOTER / RODAPÉ                                                        */}
      {/* ========================================================================= */}
      <footer className="border-t border-gray-800/80 bg-[#06080d] py-12 text-xs text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-gray-800/60">
            
            {/* Logo Footer */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white">
                <Flame className="w-4 h-4 fill-white" />
              </div>
              <span className="font-extrabold text-base text-white">Deal Hunter Pro</span>
            </div>

            {/* Links Rápidos */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400">
              <a href="#como-funciona" className="hover:text-white transition-colors">
                Como Funciona
              </a>
              <a href="#demonstracao" className="hover:text-white transition-colors">
                Demonstração
              </a>
              <a href="#recursos" className="hover:text-white transition-colors">
                Recursos
              </a>
              <a href="#planos" className="hover:text-white transition-colors">
                Planos
              </a>
              <Link href="/login" className="hover:text-white transition-colors">
                Área de Membros
              </Link>
            </div>

            {/* Botão de Suporte */}
            <div>
              <a
                href="mailto:suporte@dealhunterpro.com.br"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 text-xs transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Falar com o Suporte</span>
              </a>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-500">
            <p>
              &copy; {new Date().getFullYear()} Deal Hunter Pro (dealhunterpro.com.br) — Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/login" className="hover:text-gray-400 transition-colors">
                Termos de Uso
              </Link>
              <span>·</span>
              <Link href="/login" className="hover:text-gray-400 transition-colors">
                Política de Privacidade
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 9. MODAL DE SELEÇÃO DE CHECKOUT (PIX vs. CARTÃO)                          */}
      {/* ========================================================================= */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#0e131f] border-2 border-gray-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6 animate-in zoom-in-95 duration-200">
            {/* Botão Fechar */}
            <button
              onClick={() => setCheckoutModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-lg shadow-orange-500/20 mb-1">
                <Flame className="w-6 h-6 fill-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Escolha Como Deseja Começar
              </h3>
              <p className="text-xs sm:text-sm text-gray-300">
                Selecione a opção de contratação ideal para o seu perfil:
              </p>
            </div>

            <div className="space-y-4">
              {/* Opção 1: Pix InfinitePay */}
              <div className="relative p-5 rounded-2xl bg-gradient-to-b from-[#11241f] to-[#0d1715] border-2 border-emerald-500/70 hover:border-emerald-400 transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                    ⚡ Mais Econômico · Imediato
                  </span>
                  <span className="text-lg font-black text-white">R$ 29,90</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Pix Instantâneo (InfinitePay)</h4>
                  <p className="text-xs text-gray-300 mt-0.5">
                    Liberação automática em segundos com 30 dias de acesso sem renovação surpresa.
                  </p>
                </div>
                <a
                  href={infinitePayPixUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98]"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Pagar R$ 29,90 via Pix</span>
                </a>
              </div>

              {/* Opção 2: Cartão de Crédito Stripe */}
              <div className="relative p-5 rounded-2xl bg-gradient-to-b from-[#161c2b] to-[#101420] border border-gray-700 hover:border-orange-500/60 transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-wider">
                    🛡️ 7 Dias Grátis
                  </span>
                  <span className="text-sm font-semibold text-gray-400">R$ 49,90 / mês após teste</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Cartão de Crédito (Stripe)</h4>
                  <p className="text-xs text-gray-300 mt-0.5">
                    Comece sem pagar nada hoje. Cancele com 1 clique antes dos 7 dias sem custos.
                  </p>
                </div>
                <Link
                  href={stripeCardUrl}
                  onClick={() => setCheckoutModalOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1d2537] hover:bg-[#253047] border border-gray-700 text-white font-bold text-sm transition-all active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Testar 7 Dias Grátis no Cartão</span>
                </Link>
              </div>
            </div>

            <p className="text-center text-[11px] text-gray-400">
              🔒 Pagamentos processados com criptografia de ponta a ponta.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
