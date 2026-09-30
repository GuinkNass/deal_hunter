'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/supabase/client';
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
  Globe,
  Wifi,
  ChevronDown,
  ChevronUp,
  Lock,
  Gift,
  Star,
  Flame,
  Check,
  X,
  MessageCircle,
  Smartphone,
  Clock,
  Compass,
} from 'lucide-react';

export default function LandingPage() {
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [downloadToast, setDownloadToast] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Links de pagamento e download
  const downloadZipUrl = '/downloads/deal-hunter-pro.zip';
  const infinitePayPixUrl = 'https://checkout.infinitepay.io/deal-hunter-pro-br/AoJYT9KaSj';
  const stripeCardUrl = '/login';
  const checkoutUrl = '/login';
  // Vídeo de tutorial e demonstração oficial
  const demoVideoEmbedUrl = 'https://www.youtube.com/embed/52BbMllmT18?autoplay=1';

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
        'A instalação leva menos de 1 minuto: 1) Baixe o arquivo .ZIP clicando no botão de download; 2) Descompacte a pasta no seu computador; 3) No Chrome ou Edge, acesse chrome://extensions e ative o "Modo do Desenvolvedor" no canto superior direito; 4) Clique em "Carregar compactada" (ou sem compactação) e selecione a pasta da extensão; 5) Faça login direto com sua conta da nuvem na extensão. Pronto!',
    },
    {
      question: 'Quais são os requisitos mínimos e compatibilidade do Deal Hunter Pro?',
      answer:
        'O Deal Hunter Pro é compatível com qualquer computador com Windows, macOS ou Linux que possua o Google Chrome ou navegadores Chromium (Microsoft Edge, Brave, Opera, etc.) com conexão à internet. Como o processamento pesado de busca e monitoramento roda 100% na nuvem, ele não sobrecarrega a memória nem o processador do seu computador.',
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
        'Não! O motor de busca e análise do Deal Hunter Pro roda 100% na nuvem. Você não precisa executar scripts nem deixar o computador sobrecarregado. Basta ter a extensão instalada no navegador e conectada à sua conta para receber alertas instantâneos no Telegram.',
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
      question: 'Como falar com o suporte em caso de dúvidas?',
      answer:
        'Nosso time de suporte está disponível para tirar qualquer dúvida técnica ou comercial. Basta enviar um e-mail diretamente para: guilherme.r.nascimentoml@gmail.com.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#070a12] text-[#f1f5f9] selection:bg-violet-500/30 selection:text-violet-200 antialiased overflow-x-hidden">
      {/* Toast de Download Iniciado */}
      {downloadToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 p-4 bg-[#0c101d]/95 border border-emerald-500/60 rounded-2xl shadow-2xl shadow-emerald-950/60 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300">
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

      {/* Glows Decorativos de Fundo Inspirados no Design System */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-violet-600/15 via-indigo-600/10 to-transparent blur-[160px] pointer-events-none -z-10" />
      <div className="fixed top-1/3 -left-40 w-[600px] h-[600px] bg-indigo-500/10 blur-[170px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 -right-40 w-[600px] h-[600px] bg-purple-600/10 blur-[170px] pointer-events-none -z-10" />

      {/* ========================================================================= */}
      {/* 1. NAVBAR                                                                 */}
      {/* ========================================================================= */}
      <Navbar />

      {/* ========================================================================= */}
      {/* 2. HERO SECTION                                                           */}
      {/* ========================================================================= */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          
          {/* Badge de Destaque Superior */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-violet-950/50 border border-violet-500/30 text-violet-300 text-xs font-bold tracking-widest uppercase backdrop-blur-md animate-in fade-in duration-700 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#d4ff32] animate-pulse" />
            Extensão Inteligente · Versão 2.9
          </div>

          {/* Headline Principal */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white leading-[1.08]">
            Encontre Superdescontos e <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
              Bugs de Preço em Tempo Real
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            O <strong className="text-white">Deal Hunter Pro</strong> monitora continuamente <strong className="text-white">Amazon Brasil, Magazine Luiza e Eletroclub</strong> diretamente no seu navegador, alertando seu Telegram no segundo exato em que o preço despenca.
          </p>

          {/* CTAs Principais da Hero */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            {/* Botão Primário: Download Direto do ZIP (Lime Accent) */}
            <a
              href={downloadZipUrl}
              download="Deal_Hunter_Cliente.zip"
              onClick={triggerDownload}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-[#d4ff32] hover:bg-[#c3f01c] text-black font-black text-sm sm:text-base uppercase tracking-wider shadow-xl shadow-[#d4ff32]/20 hover:shadow-[#d4ff32]/35 hover:-translate-y-0.5 transition-all active:scale-[0.98]"
            >
              <Download className="w-5 h-5 stroke-[2.5]" />
              <span>Baixar Extensão (.ZIP)</span>
            </a>

            {/* Botão Secundário: Teste 7 Dias (White Pill) */}
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-white hover:bg-slate-100 text-black font-extrabold text-sm sm:text-base uppercase tracking-wider shadow-lg transition-all active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-violet-600" />
              <span>Testar 7 Dias Grátis</span>
            </Link>

            {/* Botão Secundário: Conhecer como funciona */}
            <a
              href="#como-funciona"
              className="inline-flex items-center gap-3 text-xs sm:text-sm font-bold text-slate-300 hover:text-white transition-colors group px-2 py-1"
            >
              <span className="w-10 h-10 rounded-full bg-violet-600/30 border border-violet-500/40 text-violet-400 group-hover:bg-violet-600/50 flex items-center justify-center transition-transform group-hover:scale-110">
                <Zap className="w-4 h-4 text-violet-400" />
              </span>
              <span className="uppercase tracking-wider">Como Funciona</span>
            </a>
          </div>

          {/* Badges de Confiança */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-y-2.5 gap-x-6 text-xs text-slate-400">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06]">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span><strong className="text-white">7 dias grátis:</strong> sem cartão e sem Pix</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06]">
              <Zap className="w-4 h-4 text-[#d4ff32]" />
              <span>Ativação imediata no 1º login</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06]">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>Após os 7 dias: R$ 29,90 no Pix ou Cartão</span>
            </div>
          </div>

          {/* Avaliação Social Proof */}
          <div className="pt-1 flex items-center justify-center gap-2 text-xs text-slate-400">
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
      {/* 3. SHOWCASE MONUMENTAL (PROPAGANDA2.JPG + 3 CARDS MODULARES)               */}
      {/* ========================================================================= */}
      <section className="py-6 sm:py-12 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="relative rounded-[2.5rem] bg-[#0c101d] border border-white/[0.08] p-4 sm:p-8 shadow-2xl shadow-black/80 overflow-hidden">
            {/* Glow de ambientação no topo do container */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-violet-600/20 blur-[100px] pointer-events-none" />

            {/* Imagem Principal de Showcase com Card Holográfico */}
            <div className="relative rounded-[2rem] overflow-hidden border border-white/[0.1] bg-[#070a12] aspect-[16/9] sm:aspect-[21/9] max-h-[520px]">
              <img
                src="/images/propaganda2.jpg"
                alt="Deal Hunter Pro - Monitoramento 24h com Descontos e Alertas Holográficos"
                className="w-full h-full object-cover object-center"
              />
              {/* Overlay suave com gradiente inferior para legibilidade */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c101d] via-transparent to-black/30 pointer-events-none" />

              {/* Tag Flutuante Superior */}
              <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 border border-white/20 backdrop-blur-md text-[11px] font-black uppercase tracking-wider text-white">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Radar Inteligente Ativo 24h</span>
              </div>

              {/* Badge Informativo Inferior */}
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-md p-4 rounded-2xl bg-[#090d18]/85 border border-white/15 backdrop-blur-md shadow-2xl">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#d4ff32] mb-1">
                  Piloto Automático em Ação
                </p>
                <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                  Relaxe enquanto o Deal Hunter monitora centenas de categorias na Amazon e Magalu, disparando os maiores bugs com até 80% OFF.
                </p>
              </div>
            </div>

            {/* 3 Cards Modulares de Destaque no Padrão do Design System */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
              
              {/* Card 1 */}
              <div className="p-6 rounded-[2rem] bg-[#111728]/80 border border-white/[0.08] hover:border-violet-500/40 transition-all flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-[10px] font-black uppercase tracking-wider">
                      Automação Pura
                    </span>
                    <span className="text-slate-500 group-hover:text-violet-400 transition-colors">01</span>
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">
                    Varredura 24h na Nuvem
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Zero proxies caros e zero scripts locais. A inteligência na nuvem monitora ofertas 24h com total discrição e velocidade, sem sobrecarregar seu computador.
                  </p>
                </div>
                <div className="pt-6">
                  <a
                    href="#como-funciona"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-bold text-white transition-all"
                  >
                    <span>Como Funciona</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#d4ff32]" />
                  </a>
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-6 rounded-[2rem] bg-[#111728]/80 border border-white/[0.08] hover:border-violet-500/40 transition-all flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-[#d4ff32]/15 border border-[#d4ff32]/30 text-[#d4ff32] text-[10px] font-black uppercase tracking-wider">
                      Alerta Imediato
                    </span>
                    <span className="text-slate-500 group-hover:text-[#d4ff32] transition-colors">02</span>
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">
                    Disparo no Telegram em &lt; 3 Segundos
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Notificações completas com foto do produto, valor antigo riscado, desconto em destaque e link direto para fechar a compra antes de acabar.
                  </p>
                </div>
                <div className="pt-6">
                  <a
                    href="#como-funciona"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-bold text-white transition-all"
                  >
                    <span>Conhecer o Motor</span>
                    <ArrowRight className="w-3.5 h-3.5 text-violet-400" />
                  </a>
                </div>
              </div>

              {/* Card 3 */}
              <div className="p-6 rounded-[2rem] bg-[#111728]/80 border border-white/[0.08] hover:border-violet-500/40 transition-all flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-black uppercase tracking-wider">
                      Multilojas VIP
                    </span>
                    <span className="text-slate-500 group-hover:text-cyan-400 transition-colors">03</span>
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">
                    Amazon, Magalu &amp; Eletroclub
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Suporte simultâneo às 3 maiores plataformas do Brasil com login automático para preços VIP de funcionários na Eletroclub.
                  </p>
                </div>
                <div className="pt-6">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-bold text-white transition-all shadow-md"
                  >
                    <span>Ativar 7 Dias Grátis</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SEÇÃO DE VÍDEO / DEMONSTRAÇÃO PRÁTICA (DESABILITADA TEMPORARIAMENTE)     */}
      {/* ========================================================================= */}
      {false && (
        <section id="demonstracao" className="py-16 sm:py-24 relative">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-3 mb-10">
              <h2 className="text-xs font-black text-[#d4ff32] uppercase tracking-widest">
                Demonstração ao Vivo
              </h2>
              <p className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
                Veja o Deal Hunter Pro em Ação
              </p>
              <p className="text-sm text-slate-300 max-w-xl mx-auto">
                Assista como a extensão varre dezenas de categorias por minuto e despacha alertas com link direto para o Telegram.
              </p>
            </div>

            <div className="relative rounded-[2.5rem] bg-[#0c101d] border border-white/[0.08] shadow-2xl shadow-black/80 overflow-hidden group">
              <div className="px-5 py-3.5 bg-[#090d18] border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                </div>
                <div className="flex-1 max-w-md mx-auto hidden sm:flex items-center justify-center gap-2 px-4 py-1 rounded-full bg-[#111728] border border-white/[0.06] text-[11px] text-slate-400 font-mono">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>dealhunterpro.com.br/scan-engine</span>
                </div>
                <div className="text-[11px] text-violet-400 font-bold uppercase tracking-wider">Extensão Ativa</div>
              </div>

              <div className="relative aspect-video w-full bg-[#070a12] flex items-center justify-center overflow-hidden">
                {videoPlaying ? (
                  <iframe
                    src={demoVideoEmbedUrl}
                    title="Tutorial Deal Hunter Pro"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#0c101d] via-[#090d18] to-[#070a12]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.18)_0,transparent_70%)] pointer-events-none" />
                    <button
                      onClick={() => setVideoPlaying(true)}
                      className="relative z-10 w-20 h-20 rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white flex items-center justify-center shadow-2xl shadow-orange-500/40 hover:scale-105 active:scale-95 transition-all group-hover:shadow-orange-500/60"
                      aria-label="Assistir vídeo de demonstração"
                    >
                      <Play className="w-8 h-8 fill-white translate-x-0.5" />
                    </button>
                    <div className="relative z-10 mt-6 space-y-1">
                      <p className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                        Clique para assistir ao tutorial completo (2 min)
                      </p>
                      <p className="text-xs text-slate-400">
                        Veja a instalação, configuração do Telegram e a captura de ofertas ao vivo
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-5 bg-[#090d18] border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Varreduras automáticas em segundo plano com notificações em &lt; 3 segundos.</span>
                </div>
                <a
                  href={downloadZipUrl}
                  download="Deal_Hunter_Cliente.zip"
                  onClick={triggerDownload}
                  className="text-[#d4ff32] hover:underline font-bold flex items-center gap-1.5 transition-colors uppercase tracking-wider text-[11px]"
                >
                  <span>Baixar para testar agora</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. SPOTLIGHT MOBILIDADE & TELEGRAM (PROPAGANDA1.JPG)                       */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="relative rounded-[2.5rem] bg-gradient-to-br from-[#0c101d] via-[#0f1526] to-[#080c16] border border-white/[0.08] p-6 sm:p-12 shadow-2xl overflow-hidden">
            {/* Ambient Backlight */}
            <div className="absolute top-1/2 -left-20 -translate-y-1/2 w-80 h-80 bg-violet-600/15 blur-[120px] pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Coluna Visual: Imagem propaganda1.jpg */}
              <div className="lg:col-span-6 relative">
                <div className="relative rounded-[2rem] overflow-hidden border border-white/[0.12] shadow-2xl aspect-[4/3] bg-[#070a12]">
                  <img
                    src="/images/propaganda1.jpg"
                    alt="Alertas de desconto no celular enquanto viaja de metrô"
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay gradiente */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c101d]/90 via-transparent to-transparent pointer-events-none" />

                  {/* Badge Holográfica de Alerta Telegram simulada */}
                  <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-2xl bg-[#0c101d]/90 border border-violet-500/40 backdrop-blur-md shadow-2xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-600/30 text-violet-300 flex items-center justify-center flex-shrink-0">
                      <BellRing className="w-5 h-5 text-[#d4ff32]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-wider text-[#d4ff32]">
                        ⚡ Alerta Telegram · Há 15 segundos
                      </p>
                      <p className="text-xs font-bold text-white truncate">
                        Smartphone 5G · 30% OFF na Amazon
                      </p>
                      <p className="text-[11px] text-slate-300">
                        De <span className="line-through text-slate-500">R$ 2.499</span> por <strong className="text-emerald-400">R$ 1.749</strong>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coluna Texto & Benefícios */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-bold uppercase tracking-wider">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Liberdade Total Onde Estiver</span>
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white leading-tight">
                  Alertas em Tempo Real <br />
                  <span className="bg-gradient-to-r from-[#d4ff32] to-emerald-400 bg-clip-text text-transparent">
                    Direto no Seu Celular
                  </span>
                </h2>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Você não precisa ficar preso na frente do computador. Configure seus filtros uma única vez e deixe o robô fazer a varredura contínua. Seja no metrô, no trabalho ou descansando, a oportunidade chega pronta no seu Telegram.
                </p>

                <div className="space-y-3 pt-1">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200">
                      <strong>Notificações instantâneas:</strong> receba com foto, valor com desconto e link de compra rápida.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200">
                      <strong>Chegue antes do estoque acabar:</strong> compre antes que os bugs sejam corrigidos ou que outros grupos vejam.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200">
                      <strong>Filtros por porcentagem:</strong> defina para receber apenas produtos acima de 40%, 60% ou 80% OFF.
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex flex-wrap items-center gap-4">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[#d4ff32] hover:bg-[#c3f01c] text-black font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-[#d4ff32]/20 transition-all active:scale-[0.98]"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Começar Meus 7 Dias Grátis</span>
                  </Link>

                  <a
                    href={downloadZipUrl}
                    download="Deal_Hunter_Cliente.zip"
                    onClick={triggerDownload}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs sm:text-sm font-bold text-white transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar Extensão</span>
                  </a>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. GUIA PASSO A PASSO ("COMO USAR EM 3 PASSOS SIMPLES")                   */}
      {/* ========================================================================= */}
      <section id="como-funciona" className="py-16 sm:py-24 bg-[#0a0d15]/60 border-y border-white/[0.06] relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-xs font-black text-violet-400 uppercase tracking-widest">
              Passo a Passo Simples
            </h2>
            <p className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
              Como Começar em Menos de 1 Minuto
            </p>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              100% na nuvem: sem scripts ou terminais complexos. Tudo pronto para rodar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            
            {/* Passo 1 */}
            <div className="relative p-7 sm:p-8 rounded-[2rem] bg-[#0c101d] border border-white/[0.08] shadow-xl hover:border-violet-500/40 transition-all group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-violet-600/15 border border-violet-500/30 text-violet-400 flex items-center justify-center font-black text-lg mb-6 group-hover:bg-violet-600 group-hover:text-white transition-all shadow-md">
                  1
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight text-white mb-2">
                  Baixe e Extraia a Pasta
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                  Baixe o arquivo <strong>.ZIP</strong> da extensão atualizada diretamente aqui na landing page e extraia a pasta em qualquer local no seu computador.
                </p>
              </div>
              <div className="pt-2">
                <a
                  href={downloadZipUrl}
                  download="Deal_Hunter_Cliente.zip"
                  onClick={triggerDownload}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-bold text-[#d4ff32] transition-colors uppercase tracking-wider"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar .ZIP agora</span>
                </a>
              </div>
            </div>

            {/* Passo 2 */}
            <div className="relative p-7 sm:p-8 rounded-[2rem] bg-[#0c101d] border border-white/[0.08] shadow-xl hover:border-violet-500/40 transition-all group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#d4ff32]/15 border border-[#d4ff32]/30 text-[#d4ff32] flex items-center justify-center font-black text-lg mb-6 group-hover:bg-[#d4ff32] group-hover:text-black transition-all shadow-md">
                  2
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight text-white mb-2">
                  Carregue no Chrome
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                  Acesse <code>chrome://extensions/</code>, ative a opção <strong>Modo do desenvolvedor</strong> no canto superior e clique em <strong>Carregar compactada</strong> selecionando a pasta da extensão.
                </p>
              </div>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d4ff32]/10 border border-[#d4ff32]/20 text-[11px] font-bold text-[#d4ff32] uppercase tracking-wider">
                  <Check className="w-3.5 h-3.5" />
                  <span>Sem instalação complexa</span>
                </span>
              </div>
            </div>

            {/* Passo 3 */}
            <div className="relative p-7 sm:p-8 rounded-[2rem] bg-[#0c101d] border border-white/[0.08] shadow-xl hover:border-violet-500/40 transition-all group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-black text-lg mb-6 group-hover:bg-cyan-500 group-hover:text-white transition-all shadow-md">
                  3
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight text-white mb-2">
                  Faça Login na Nuvem
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                  Abra a extensão, faça login direto com a sua conta da nuvem e pronto: os alertas de bugs e superdescontos já começam a cair em tempo real no seu Telegram.
                </p>
              </div>
              <div className="pt-2">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <Check className="w-3.5 h-3.5" />
                  <span>Alertas no Automático</span>
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6.1 REQUISITOS MÍNIMOS & COMPATIBILIDADE                                  */}
      {/* ========================================================================= */}
      <section id="requisitos" className="py-16 sm:py-20 relative bg-[#070a12] border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-xs font-black text-cyan-400 uppercase tracking-widest">
              Leve, Rápido &amp; Universal
            </h2>
            <p className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
              Requisitos Mínimos e Compatibilidade
            </p>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Como o processamento pesado roda 100% na nuvem, o Deal Hunter Pro não consome os recursos da sua máquina.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Navegador */}
            <div className="p-7 rounded-[2rem] bg-[#0c101d] border border-white/[0.08] hover:border-cyan-500/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight text-white mb-2">
                  Navegadores Compatíveis
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Compatível com <strong>Google Chrome</strong> e qualquer navegador baseado em <strong>Chromium</strong> (Microsoft Edge, Brave, Opera, Vivaldi, etc.).
                </p>
              </div>
              <div className="pt-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[11px] font-bold text-cyan-300 uppercase tracking-wider">
                  <Check className="w-3.5 h-3.5" />
                  <span>Base Chromium</span>
                </span>
              </div>
            </div>

            {/* Sistema Operacional */}
            <div className="p-7 rounded-[2rem] bg-[#0c101d] border border-white/[0.08] hover:border-violet-500/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-violet-600/15 border border-violet-500/30 text-violet-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Laptop className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight text-white mb-2">
                  Sistemas Operacionais
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Funciona perfeitamente em <strong>Windows</strong>, <strong>macOS</strong> e <strong>Linux</strong>. Sem exigência de processamento local pesado, pois o motor roda na nuvem.
                </p>
              </div>
              <div className="pt-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-[11px] font-bold text-violet-300 uppercase tracking-wider">
                  <Check className="w-3.5 h-3.5" />
                  <span>Processamento na Nuvem</span>
                </span>
              </div>
            </div>

            {/* Conexão */}
            <div className="p-7 rounded-[2rem] bg-[#0c101d] border border-white/[0.08] hover:border-[#d4ff32]/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#d4ff32]/15 border border-[#d4ff32]/30 text-[#d4ff32] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Wifi className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight text-white mb-2">
                  Conexão com a Internet
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Requer apenas <strong>internet ativa</strong> para sincronização de alertas e envio de notificações em tempo real diretamente para o seu Telegram.
                </p>
              </div>
              <div className="pt-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d4ff32]/10 border border-[#d4ff32]/20 text-[11px] font-bold text-[#d4ff32] uppercase tracking-wider">
                  <Check className="w-3.5 h-3.5" />
                  <span>Alertas em Tempo Real</span>
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. RECURSOS & BENEFÍCIOS (FEATURES GRID)                                  */}
      {/* ========================================================================= */}
      <section id="recursos" className="py-16 sm:py-24 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-xs font-black text-[#d4ff32] uppercase tracking-widest">
              Poder e Inteligência
            </h2>
            <p className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
              Recursos Criados para Quem Leva Economia a Sério
            </p>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Desenvolvido tanto para compradores inteligentes quanto para afiliados e gestores de grupos de ofertas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="p-7 rounded-[2rem] bg-[#0c101d] border border-white/[0.08] hover:border-violet-500/40 transition-all space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-violet-600/15 text-violet-400 flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#d4ff32]" />
              </div>
              <h3 className="text-base font-bold text-white">Detecção Imediata de Preços</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Varredura contínua de páginas oficiais de ofertas. Identifica bugs de desconto e quedas abruptas de preço antes dos grupos convencionais.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-7 rounded-[2rem] bg-[#0c101d] border border-white/[0.08] hover:border-violet-500/40 transition-all space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600/15 text-indigo-400 flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Integração com 3 Grandes Lojas</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Suporte nativo e simultâneo para <strong>Amazon Brasil</strong>, <strong>Magazine Luiza</strong> e <strong>Eletroclub</strong> (com login automático corporativo).
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-7 rounded-[2rem] bg-[#0c101d] border border-white/[0.08] hover:border-violet-500/40 transition-all space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600/15 text-emerald-400 flex items-center justify-center">
                <BellRing className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Alertas Ricos no Telegram</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Receba mensagens formatadas com foto em alta qualidade, valor antigo, preço promocional, porcentagem de desconto e link de compra rápida.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-7 rounded-[2rem] bg-[#0c101d] border border-white/[0.08] hover:border-violet-500/40 transition-all space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-cyan-600/15 text-cyan-400 flex items-center justify-center">
                <Laptop className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Motor Local Anti-Bloqueio</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                A extensão navega usando a sua própria conexão residencial. Sem proxies caros, sem capchas irritantes e com total discrição perante as lojas.
              </p>
            </div>

            {/* Card 5 */}
            <div className="p-7 rounded-[2rem] bg-[#0c101d] border border-white/[0.08] hover:border-violet-500/40 transition-all space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-purple-600/15 text-purple-400 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Filtros Finos e Personalizados</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Configure % mínimo de desconto (ex: somente acima de 40% OFF), faixa de preço máxima e categorias específicas como Eletrônicos, Gamer e Eletro.
              </p>
            </div>

            {/* Card 6 */}
            <div className="p-7 rounded-[2rem] bg-[#0c101d] border border-white/[0.08] hover:border-violet-500/40 transition-all space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600/15 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Privacidade e Segurança</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Seus dados de navegação, bots do Telegram e tokens de autenticação ficam armazenados de forma criptografada apenas na sua máquina.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. TABELA DE PREÇOS & PLANOS (PRICING)                                     */}
      {/* ========================================================================= */}
      <section id="planos" className="py-16 sm:py-24 bg-[#0a0d15]/80 border-y border-white/[0.06] relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-3 mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-bold uppercase tracking-wider">
              <Gift className="w-3.5 h-3.5 text-[#d4ff32]" />
              Teste 100% Gratuito sem Compromisso
            </div>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
              7 Dias de Teste Grátis Para Todos
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Não precisa cadastrar cartão e nem pagar Pix para começar a testar. 
              <br className="hidden sm:inline" />
              Basta fazer login para ter <strong className="text-white">acesso total liberado por 7 dias</strong>. Após o teste, você escolhe como prefere continuar por apenas <strong className="text-white">R$ 29,90</strong>:
            </p>

            {/* Banner de Destaque do Teste */}
            <div className="pt-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#d4ff32] hover:bg-[#c3f01c] text-black font-black text-sm sm:text-base uppercase tracking-wider shadow-xl shadow-[#d4ff32]/25 hover:shadow-[#d4ff32]/40 hover:-translate-y-0.5 transition-all active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4" />
                <span>Começar Meus 7 Dias Grátis (Sem Cartão)</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
            </div>
          </div>

          {/* Grid de Planos Pós-Teste: Pix Instantâneo vs. Cartão de Crédito */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch pt-2">
            
            {/* CARD 1: PIX INSTANTÂNEO (INFINITEPAY) */}
            <div className="relative rounded-[2.5rem] bg-gradient-to-b from-[#0f1f1a] via-[#0d1715] to-[#0a100f] border-2 border-emerald-500/70 p-7 sm:p-9 shadow-2xl shadow-emerald-950/40 flex flex-col justify-between overflow-hidden group hover:border-emerald-400 transition-all">
              
              {/* Badge Topo */}
              <div className="absolute top-0 right-0">
                <div className="bg-gradient-to-l from-emerald-500 to-teal-500 text-white text-[11px] font-black uppercase tracking-wider py-1.5 px-5 rounded-bl-2xl shadow-md flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  <span>Pagamento Manual</span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Opção 1 · Pix (InfinitePay)</span>
                </div>
                <h3 className="text-2xl font-black text-white">
                  30 Dias de Acesso via Pix
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed mt-1">
                  Ideal para quem deseja pagar mês a mês no Pix com controle total e sem renovações automáticas no cartão.
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
                    Pagamento avulso à vista · Você só renova quando quiser
                  </p>
                </div>

                {/* Checklist de Benefícios */}
                <div className="pt-6 border-t border-emerald-500/20 my-6">
                  <p className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-3">
                    Vantagens completas inclusas:
                  </p>
                  <ul className="space-y-2.5 text-xs text-gray-200">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span><strong>Mesmas funções completas</strong> do plano Pro</span>
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
                      <span>Sem necessidade de cadastrar cartão de crédito</span>
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
                  className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all active:scale-[0.98]"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Pagar R$ 29,90 via Pix</span>
                </a>
                <p className="text-center text-[11px] text-emerald-400 font-medium mt-2.5">
                  ⚡ Liberação automática instantânea por 30 dias
                </p>
              </div>

            </div>

            {/* CARD 2: CARTÃO DE CRÉDITO (STRIPE) */}
            <div className="relative rounded-[2.5rem] bg-gradient-to-b from-[#131128] via-[#0d0d1e] to-[#070712] border-2 border-violet-500/60 p-7 sm:p-9 shadow-2xl shadow-violet-500/10 flex flex-col justify-between overflow-hidden group hover:border-violet-400 transition-all">
              
              {/* Badge Topo */}
              <div className="absolute top-0 right-0">
                <div className="bg-gradient-to-l from-violet-600 to-indigo-600 text-white text-[11px] font-black uppercase tracking-wider py-1.5 px-5 rounded-bl-2xl shadow-md flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#d4ff32]" />
                  <span>Renovação Automática</span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-violet-400 font-bold text-xs uppercase tracking-wider mb-2">
                  <Flame className="w-3.5 h-3.5 fill-violet-400" />
                  <span>Opção 2 · Cartão de Crédito (Stripe)</span>
                </div>
                <h3 className="text-2xl font-black text-white">
                  Assinatura Contínua
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed mt-1">
                  Mesmas vantagens com a conveniência de não precisar pagar manualmente todo mês para continuar com o serviço ativo.
                </p>

                {/* Preço Cartão Stripe */}
                <div className="mt-6 mb-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-white">
                      R$ 29,90
                    </span>
                    <span className="text-xs text-violet-400 font-bold uppercase tracking-wider">
                      / mês
                    </span>
                  </div>
                  <p className="text-[11px] text-[#d4ff32] font-semibold mt-1">
                    🔄 Renovação automática · Cancele com 1 clique a qualquer momento
                  </p>
                </div>

                {/* Checklist de Benefícios */}
                <div className="pt-6 border-t border-violet-500/20 my-6">
                  <p className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-3">
                    Vantagens completas inclusas:
                  </p>
                  <ul className="space-y-2.5 text-xs text-gray-200">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span><strong>Mesmas funções completas</strong> do plano Pro</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Varredura simultânea de Amazon, Magalu e Eletroclub</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Alertas instantâneos em canais/grupos do Telegram</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#d4ff32] flex-shrink-0" />
                      <span><strong>Vantagem exclusiva:</strong> renovação automática mensal sem preocupação</span>
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
                  className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5 transition-all active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Assinar R$ 29,90 no Cartão</span>
                </Link>
                <p className="text-center text-[11px] text-gray-400 mt-2.5">
                  🛡️ Pagamento seguro via Stripe · Gerencie ou cancele quando quiser
                </p>
              </div>

            </div>

          </div>

          {/* Rodapé da Seção com Garantia */}
          <div className="mt-12 p-6 rounded-[2rem] bg-[#0c101d] border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-300">
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
              <span className="text-violet-400 font-bold">💳 Cartão de Crédito</span>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. FAQ (PERGUNTAS FREQUENTES)                                              */}
      {/* ========================================================================= */}
      <section id="faq" className="py-16 sm:py-24 relative">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-xs font-black text-violet-400 uppercase tracking-widest">
              Tire Suas Dúvidas
            </h2>
            <p className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
              Perguntas Frequentes
            </p>
            <p className="text-sm text-slate-400">
              Tudo o que você precisa saber antes de começar seu teste gratuito.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-[1.5rem] bg-[#0c101d] border border-white/[0.08] overflow-hidden transition-all hover:border-white/[0.16]"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full py-4 sm:py-5 px-6 sm:px-7 text-left flex items-center justify-between gap-4 focus:outline-none"
                  >
                    <span className="text-sm sm:text-base font-bold text-white">
                      {faq.question}
                    </span>
                    <span className="text-[#d4ff32] flex-shrink-0">
                      {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 sm:px-7 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/[0.06]">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Caixa de Suporte Direto */}
          <div className="mt-12 text-center p-6 sm:p-8 rounded-[2rem] bg-gradient-to-r from-violet-950/30 via-[#0c101d] to-indigo-950/30 border border-white/[0.08]">
            <p className="text-white font-black text-base uppercase tracking-tight mb-1">
              Ainda tem dúvidas ou precisa de ajuda técnica?
            </p>
            <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto mb-5">
              Nosso time responde rapidamente. Fale com a gente direto por e-mail:
            </p>
            <a
              href="mailto:guilherme.r.nascimentoml@gmail.com?subject=Suporte%20Deal%20Hunter%20Pro"
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-violet-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Falar com o Suporte (guilherme.r.nascimentoml@gmail.com)</span>
            </a>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. FOOTER / RODAPÉ                                                       */}
      {/* ========================================================================= */}
      <footer className="border-t border-white/[0.08] bg-[#05070d] py-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-white/[0.06]">
            
            {/* Logo Footer */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl overflow-hidden bg-[#0c101d] border border-white/10 flex items-center justify-center p-1">
                <img src="/images/logo.png" alt="Deal Hunter Pro" className="w-full h-full object-contain" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base uppercase tracking-tight text-white">Deal Hunter</span>
                <span className="px-1.5 py-0.5 rounded-full bg-violet-600/30 border border-violet-500/40 text-violet-300 text-[9px] font-black tracking-wider uppercase">PRO</span>
              </div>
            </div>

            {/* Links Rápidos */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <a href="#como-funciona" className="hover:text-white transition-colors">
                Como Funciona
              </a>
              <a href="#requisitos" className="hover:text-white transition-colors">
                Requisitos
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
                href="mailto:guilherme.r.nascimentoml@gmail.com?subject=Suporte%20Deal%20Hunter%20Pro"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-slate-300 text-xs transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Falar com o Suporte</span>
              </a>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>
              &copy; {new Date().getFullYear()} Deal Hunter Pro (dealhunterpro.com.br) — Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/login" className="hover:text-slate-300 transition-colors">
                Termos de Uso
              </Link>
              <span>·</span>
              <Link href="/login" className="hover:text-slate-300 transition-colors">
                Política de Privacidade
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 11. MODAL DE SELEÇÃO DE CHECKOUT (PIX vs. CARTÃO)                         */}
      {/* ========================================================================= */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#0c101d] border border-white/[0.12] rounded-[2.5rem] p-6 sm:p-8 shadow-2xl shadow-black/90 space-y-6 animate-in zoom-in-95 duration-200">
            {/* Botão Fechar */}
            <button
              onClick={() => setCheckoutModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-white/[0.06] hover:bg-white/[0.12] transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#111728] border border-white/10 shadow-lg mb-1 p-1">
                <img src="/images/logo.png" alt="Deal Hunter Pro" className="w-full h-full object-contain" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                Como Deseja Começar?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                Você pode <strong>testar 7 dias grátis sem cartão</strong> ou assinar por R$ 29,90:
              </p>
            </div>

            {/* Destaque 1: Iniciar Teste Grátis de 7 Dias com o Google */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-violet-500/15 via-indigo-500/10 to-emerald-500/15 border border-violet-500/40 text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 text-[#d4ff32] font-black text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span>🎉 7 Dias Grátis (Sem Cartão e Sem Pix)</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                Entre com sua conta Google e tenha <strong>acesso total liberado</strong> na extensão imediatamente. Sem cobrança e sem pegadinhas.
              </p>
              <button
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-full bg-white hover:bg-slate-100 text-gray-900 font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{googleLoading ? 'Conectando...' : 'Iniciar Teste de 7 Dias com o Google'}</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center my-1">
              <div className="border-t border-white/[0.08] w-full" />
              <span className="bg-[#0c101d] px-3 text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                ou assinar diretamente por R$ 29,90
              </span>
            </div>

            <div className="space-y-3">
              {/* Opção 1: Pix InfinitePay */}
              <div className="relative p-4 rounded-2xl bg-gradient-to-b from-[#11241f] to-[#0d1715] border border-emerald-500/60 hover:border-emerald-400 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                    ⚡ Pix Instantâneo
                  </span>
                  <span className="text-base font-black text-white">R$ 29,90 <span className="text-[10px] text-gray-400 font-normal">/ 30 dias</span></span>
                </div>
                <p className="text-xs text-gray-300">
                  Pagamento manual mês a mês · Sem renovação automática no cartão
                </p>
                <a
                  href={infinitePayPixUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs shadow-md transition-all active:scale-[0.98]"
                >
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  <span>Pagar R$ 29,90 via Pix</span>
                </a>
              </div>

              {/* Opção 2: Cartão de Crédito Stripe */}
              <div className="relative p-4 rounded-2xl bg-gradient-to-b from-[#16142c] to-[#0f0e20] border border-violet-500/50 hover:border-violet-400 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-black uppercase tracking-wider">
                    🔄 Renovação Automática
                  </span>
                  <span className="text-base font-black text-white">R$ 29,90 <span className="text-[10px] text-gray-400 font-normal">/ mês</span></span>
                </div>
                <p className="text-xs text-gray-300">
                  Mesmas vantagens com a comodidade de não precisar pagar manualmente todo mês
                </p>
                <Link
                  href={stripeCardUrl}
                  onClick={() => setCheckoutModalOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs transition-all active:scale-[0.98] shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#d4ff32]" />
                  <span>Assinar R$ 29,90 no Cartão</span>
                </Link>
              </div>
            </div>

            <p className="text-center text-[11px] text-slate-400">
              🔒 Pagamentos e autenticação processados com segurança de ponta a ponta.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
