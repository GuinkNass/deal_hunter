'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  Target,
  Radar,
  BookOpen,
} from 'lucide-react';
import { useLanguageCurrency } from '@/contexts/LanguageCurrencyContext';

function ChromeIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        fill="#EA4335"
        d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0z"
      />
      <path
        fill="#34A853"
        d="M1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29z"
      />
      <path
        fill="#FBBC05"
        d="M15.273 7.478a5.449 5.449 0 0 1 2.182 6.865l-5.345 9.258C12.115 23.805 12.058 24 12 24c6.627 0 12-5.373 12-12 0-1.54-.29-3.011-.818-4.364z"
      />
      <circle cx="12" cy="12" r="5.455" fill="#FFFFFF" />
      <circle cx="12" cy="12" r="4.364" fill="#1A73E8" />
    </svg>
  );
}

export default function LandingPage() {
  const { t, formatMoney, getFaqs } = useLanguageCurrency();
  const [user, setUser] = useState<any>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [chromeToast, setChromeToast] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }

    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Links oficiais, Chrome Web Store e pagamentos
  const chromeWebStoreUrl =
    'https://chromewebstore.google.com/detail/gdnmfnoccdcbpcnaafjcoapgmihmgbdo';
  const downloadProfitHunterZipUrl = '/downloads/profit-hunter-pro.zip';
  const infinitePayPixUrl = 'https://checkout.infinitepay.io/deal-hunter-pro-br/AoJYT9KaSj';
  const stripeCardUrl = '/login';
  const checkoutUrl = '/login';
  // Vídeo de tutorial de instalação e demonstração oficial
  const demoVideoEmbedUrl = 'https://www.youtube.com/embed/xGPWD7slMN0';

  // Lojas monitoradas oficialmente com os novos logos 3D transparentes
  const monitoredStores = [
    { name: 'Amazon Brasil', slug: 'amazon', logo: '/images/novo-logos/amazon.png' },
    { name: 'KaBuM!', slug: 'kabum', logo: '/images/novo-logos/kabum.png' },
    { name: 'Shopee Brasil', slug: 'shopee', logo: '/images/novo-logos/shopee.png' },
    { name: 'Magazine Luiza', slug: 'magalu', logo: '/images/novo-logos/magalu.png' },
    { name: 'Pichau', slug: 'pichau', logo: '/images/novo-logos/pichau.png' },
    { name: 'Lojas Renner', slug: 'renner', logo: '/images/novo-logos/renner.png' },
    { name: 'Shein Brasil', slug: 'shein', logo: '/images/novo-logos/shein.png' },
    { name: 'Eletroclub', slug: 'eletroclub', logo: '/images/novo-logos/eletroclub.png' },
  ];

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

  function triggerOpenChromeStore() {
    setChromeToast(true);
    setTimeout(() => setChromeToast(false), 5000);

    // Disparar tag de conversão do Google Ads (AW-18485467530/VsKeCObcyZQdEIqzx-5E)
    if (typeof window !== 'undefined') {
      if (typeof (window as any).gtag_report_conversion === 'function') {
        (window as any).gtag_report_conversion();
      } else if (typeof (window as any).gtag === 'function') {
        (window as any).gtag('event', 'conversion', {
          send_to: 'AW-18485467530/VsKeCObcyZQdEIqzx-5E',
        });
      }
    }
  }

  function toggleFaq(index: number) {
    setActiveFaq(activeFaq === index ? null : index);
  }

  const faqs = getFaqs();

  return (
    <main className="min-h-screen bg-[#070a12] text-[#f1f5f9] selection:bg-violet-500/30 selection:text-violet-200 antialiased overflow-x-hidden">
      {/* Toast de Acesso Chrome Web Store */}
      {chromeToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 p-4 bg-[#0c101d]/95 border border-cyan-500/60 rounded-2xl shadow-2xl shadow-cyan-950/60 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
            <ChromeIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Abrindo Chrome Web Store Oficial...</p>
            <p className="text-[11px] text-gray-300">
              Clique em &ldquo;Usar no Chrome&rdquo; para instalar a extensão verificada em 1 clique.
            </p>
          </div>
        </div>
      )}

      {/* Glows Decorativos de Fundo Otimizados com Gradiente Radial Leve (Zero lag e máxima fluidez) */}
      <div
        className="fixed inset-0 pointer-events-none -z-10 opacity-70"
        style={{
          background: 'radial-gradient(circle at 50% 10%, rgba(139, 92, 246, 0.12) 0%, transparent 55%), radial-gradient(circle at 5% 45%, rgba(99, 102, 241, 0.08) 0%, transparent 50%), radial-gradient(circle at 95% 85%, rgba(168, 85, 247, 0.08) 0%, transparent 50%)',
        }}
      />

      {/* ========================================================================= */}
      {/* 1 & 2. TOPO COMPLETO (NAVBAR + HERO COM VÍDEO FULL SCREEN DE FUNDO)       */}
      {/* ========================================================================= */}
      <div className="relative min-h-screen flex flex-col justify-between overflow-hidden isolate">
        {/* Vídeo WebM de Fundo Dinâmico Cobrindo Toda a Altura e Largura da Tela Superior */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
            src="/video/fundo-07-10-2026.webm"
            className="w-full h-full object-cover object-center scale-100"
          >
            <source src="/video/fundo-07-10-2026.webm" type="video/webm" />
            <source src="/video/novo.webm" type="video/webm" />
          </video>
          {/* Overlay suave para excelente legibilidade mantendo o vídeo bem nítido e visível */}
          <div className="absolute inset-0 bg-black/35 z-[1]" />
          {/* Transição em degradê suave no rodapé para fundir perfeitamente com a próxima seção */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#070a12] via-[#070a12]/80 to-transparent z-[2]" />
        </div>

        {/* 1. NAVBAR */}
        <Navbar />

        {/* 2. HERO SECTION */}
        <section className="relative z-10 flex-1 flex flex-col justify-center items-center py-10 sm:py-16 px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Overlay de Contraste Sutil atrás do Conteúdo Central para 100% de Legibilidade */}
          <div className="relative max-w-4xl mx-auto w-full rounded-[2rem] bg-[#070a12]/70 sm:bg-[#070a12]/60 backdrop-blur-md border border-white/[0.08] p-6 sm:p-10 lg:p-12 shadow-2xl shadow-black/80 space-y-6 sm:space-y-7">
            
            {/* Badge de Destaque Superior Neutro */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-slate-300 text-xs font-medium tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{t('hero.version_badge')}</span>
            </div>

            {/* Headline Principal Otimizado (Sem Quebras Órfãs ou Hífens, Tamanho Balanceado) */}
            <h1 className="max-w-3xl mx-auto text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white leading-[1.12] hyphens-none">
              {t('hero.h1_line1')} <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent">
                {t('hero.h1_line2')}
              </span>
            </h1>

            {/* Sub-headline com Contraste Suave */}
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              {t('hero.subtitle')}
            </p>

            {/* Ações (CTAs): 1 Botão Primário Sólido Moderno + Links Secundários Ghost Sutis */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {/* Botão Primário Único de Alto Destaque */}
              <a
                href={chromeWebStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={triggerOpenChromeStore}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-[#d4ff32] hover:bg-[#c3f01c] text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-[#d4ff32]/20 hover:shadow-[#d4ff32]/30 hover:-translate-y-0.5 transition-all active:scale-[0.98]"
              >
                <ChromeIcon className="w-4 h-4 flex-shrink-0" />
                <span>{t('hero.cta_chrome')}</span>
              </a>

              {/* Link Secundário Sutil: Documentação Oficial (Ghost) */}
              <Link
                href="/docs"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-4 rounded-xl text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-all hover:bg-white/[0.06] border border-transparent hover:border-white/10"
              >
                <BookOpen className="w-4 h-4 text-slate-400" />
                <span>{t('hero.cta_docs')}</span>
              </Link>

              {/* Link Secundário Sutil: Como Funciona */}
              <a
                href="#como-funciona"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-4 text-xs sm:text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
              >
                <span>{t('hero.how_it_works')}</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
              </a>
            </div>

            {/* Badges de Garantia e Social Proof com Espaçamento Consistente e Tipografia Neutra */}
            <div className="pt-6 border-t border-white/[0.06] flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-slate-400 font-normal">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{t('hero.trust_free')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>{t('hero.trust_instant')}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-300 flex-shrink-0" />
                <span>{t('hero.trust_price_prefix')} {formatMoney(29.90)} {t('hero.trust_price_suffix')}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <span><strong className="text-white">4.9/5</strong> {t('hero.social_proof')}</span>
              </div>
            </div>

          </div>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* 2.5 CARROSSEL DE LOGOS EM LOOP INFINITO (GRANDES LOJAS MONITORADAS)        */}
      {/* ========================================================================= */}
      <section className="relative py-8 sm:py-10 border-y border-white/[0.06] bg-[#090d18]/70 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-5 text-center">
          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-violet-400 flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4ff32]" />
            {t('stores.badge')}
          </p>
        </div>

        {/* Efeito de fade nas bordas esquerda e direita para transição suave */}
        <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-44 bg-gradient-to-r from-[#070a12] via-[#070a12]/90 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-44 bg-gradient-to-l from-[#070a12] via-[#070a12]/90 to-transparent z-10 pointer-events-none" />

        {/* Trilho de animação contínua com logos sem moldura */}
        <div className="flex animate-marquee gap-10 sm:gap-14 md:gap-16 items-center py-2">
          {[...monitoredStores, ...monitoredStores].map((store, idx) => (
            <div
              key={`${store.slug}-${idx}`}
              className="flex-shrink-0 flex items-center justify-center transition-transform duration-300 hover:scale-110 cursor-default px-2"
              title={store.name}
            >
              <img
                src={store.logo}
                alt={`Logo ${store.name}`}
                width={140}
                height={56}
                className="h-10 sm:h-12 md:h-14 w-auto max-w-[140px] sm:max-w-[170px] md:max-w-[200px] object-contain select-none pointer-events-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SHOWCASE MONUMENTAL (PROPAGANDA2.JPG + 3 CARDS MODULARES)               */}
      {/* ========================================================================= */}
      <section className="py-6 sm:py-12 relative">
        <h2 className="sr-only">Monitoramento e Automação de Ofertas em Tempo Real</h2>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="relative rounded-[2.5rem] bg-[#0c101d] border border-white/[0.08] p-4 sm:p-8 shadow-2xl shadow-black/80 overflow-hidden">
            {/* Ambientação leve no topo do container */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-violet-600/10 blur-xl pointer-events-none" />

            {/* Imagem Principal de Showcase com Card Holográfico */}
            <div className="relative rounded-[2rem] overflow-hidden border border-white/[0.1] bg-[#070a12] aspect-[16/9] sm:aspect-[21/9] max-h-[520px]">
              <img
                src="/images/propaganda2.jpg"
                alt="Deal Hunter Pro - Monitoramento 24h com Descontos e Alertas Holográficos"
                width={1200}
                height={670}
                className="w-full h-full object-cover object-center"
                loading="lazy"
                decoding="async"
              />
              {/* Overlay suave com gradiente inferior para legibilidade */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c101d] via-transparent to-black/30 pointer-events-none" />

              {/* Tag Flutuante Superior */}
              <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/75 border border-white/20 text-[11px] font-black uppercase tracking-wider text-white">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{t('showcase.badge')}</span>
              </div>

              {/* Badge Informativo Inferior */}
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-md p-4 rounded-2xl bg-[#090d18]/85 border border-white/15 backdrop-blur-md shadow-2xl">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#d4ff32] mb-1">
                  {t('showcase.autopilot_title')}
                </p>
                <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                  {t('showcase.autopilot_desc')}
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
                      {t('showcase.card1_badge')}
                    </span>
                    <span className="text-slate-400 group-hover:text-violet-400 transition-colors">01</span>
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">
                    {t('showcase.card1_title')}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {t('showcase.card1_desc')}
                  </p>
                </div>
                <div className="pt-6">
                  <a
                    href="#como-funciona"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-bold text-white transition-all"
                  >
                    <span>{t('hero.how_it_works')}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#d4ff32]" />
                  </a>
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-6 rounded-[2rem] bg-[#111728]/80 border border-white/[0.08] hover:border-violet-500/40 transition-all flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-[#d4ff32]/15 border border-[#d4ff32]/30 text-[#d4ff32] text-[10px] font-black uppercase tracking-wider">
                      {t('showcase.card2_badge')}
                    </span>
                    <span className="text-slate-400 group-hover:text-[#d4ff32] transition-colors">02</span>
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">
                    {t('showcase.card2_title')}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {t('showcase.card2_desc')}
                  </p>
                </div>
                <div className="pt-6">
                  <a
                    href="#como-funciona"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-bold text-white transition-all"
                  >
                    <span>{t('hero.how_it_works')}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-violet-400" />
                  </a>
                </div>
              </div>

              {/* Card 3 */}
              <div className="p-6 rounded-[2rem] bg-[#111728]/80 border border-white/[0.08] hover:border-violet-500/40 transition-all flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-black uppercase tracking-wider">
                      {t('showcase.card3_badge')}
                    </span>
                    <span className="text-slate-400 group-hover:text-cyan-400 transition-colors">03</span>
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">
                    {t('showcase.card3_title')}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {t('showcase.card3_desc')}
                  </p>
                </div>
                <div className="pt-6">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-bold text-white transition-all shadow-md"
                  >
                    <span>{t('nav.try_free')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3.8 CENTRAL DE DOCUMENTAÇÃO & MANUAL DO USUÁRIO NA PRIMEIRA PÁGINA        */}
      {/* ========================================================================= */}
      <section id="documentacao" className="py-16 sm:py-20 relative bg-gradient-to-b from-[#0a0e1c] via-[#0d1326] to-[#070a12] border-y border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Card Principal em Visual Branco & Transparência Profissional */}
          <div className="relative rounded-[2.5rem] bg-white text-slate-900 p-8 sm:p-14 shadow-2xl shadow-indigo-500/10 border border-slate-200 overflow-hidden">
            {/* Decorações sutis de background */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-100/60 to-cyan-100/40 rounded-full blur-3xl -z-0 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-amber-100/50 to-emerald-100/40 rounded-full blur-3xl -z-0 pointer-events-none" />

            <div className="relative z-10">
              {/* Header da Seção de Documentação */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-200/80">
                <div className="space-y-3 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-black uppercase tracking-wider">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span>{t('docs_banner.badge')}</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-slate-900 leading-tight">
                    {t('docs_banner.title')}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
                    {t('docs_banner.desc')}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Link
                    href="/docs"
                    className="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-indigo-600/25 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>{t('docs_banner.btn')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* 4 Cards das Funções de Usuário Normal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-8">
                
                {/* 1. Primeiros Passos */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 hover:border-indigo-400 hover:shadow-md transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1.5">
                    1. Primeiros Passos
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Instalação oficial na Chrome Web Store com 1 clique e ativação imediata do período de 7 dias grátis.
                  </p>
                </div>

                {/* 2. Tokens & Chaves Telegram */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 hover:border-indigo-400 hover:shadow-md transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-cyan-600/10 text-cyan-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1.5">
                    2. Chaves &amp; Tokens
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Como obter seu Bot Token e Chat ID no Telegram em menos de 2 minutos para receber alertas no celular.
                  </p>
                </div>

                {/* 3. Radar de Arbitragem */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 hover:border-indigo-400 hover:shadow-md transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Radar className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1.5">
                    3. Radar de Arbitragem
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Entenda o cálculo de margem líquida, comissões de marketplaces, verificação de concorrência e volume.
                  </p>
                </div>

                {/* 4. Calculadora & Vitrine */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 hover:border-indigo-400 hover:shadow-md transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-amber-600/10 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Star className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1.5">
                    4. Vitrine &amp; Calculadora
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Como simular taxas de envio personalizadas e destacar ofertas na vitrine pública com estrela.
                  </p>
                </div>

              </div>

              {/* Barra inferior com selo de transparência e suporte multilíngue */}
              <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-700">{t('docs_banner.free_badge')}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium text-slate-600">Disponível em: 🇧🇷 Português · 🇺🇸 English · 🇪🇸 Español</span>
                  <Link href="/docs" className="font-bold text-indigo-600 hover:text-indigo-800 underline">
                    Abrir Manual &rarr;
                  </Link>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SEÇÃO DE VÍDEO / INSTRUÇÕES DE INSTALAÇÃO PASSO A PASSO                */}
      {/* ========================================================================= */}
      <section id="tutorial-instalacao" className="py-16 sm:py-24 relative scroll-mt-20">
        <span id="demonstracao" className="sr-only" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-950/60 border border-violet-500/30 text-violet-300 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
              <Play className="w-3.5 h-3.5 text-[#d4ff32] fill-[#d4ff32]" />
              <span>{t('video.badge')}</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
              {t('video.title')}
            </h2>
            <p className="text-sm text-slate-300 max-w-xl mx-auto">
              {t('video.subtitle')}
            </p>
          </div>

          <div className="relative rounded-[2.5rem] bg-[#0c101d] border border-white/[0.08] shadow-2xl shadow-black/80 overflow-hidden group">
            {/* Topbar simulando janela do navegador */}
            <div className="px-5 py-3.5 bg-[#090d18] border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <div className="flex-1 max-w-md mx-auto hidden sm:flex items-center justify-center gap-2 px-4 py-1 rounded-full bg-[#111728] border border-white/[0.06] text-[11px] text-slate-400 font-mono">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>dealhunterpro.com.br/tutorial-instalacao</span>
              </div>
              <div className="text-[11px] text-violet-400 font-bold uppercase tracking-wider">Tutorial Oficial</div>
            </div>

            {/* Container do Vídeo: Mostra a capa do vídeo com Facade de alto desempenho */}
            <div
              className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden group cursor-pointer"
              style={{
                backgroundImage: 'url(https://img.youtube.com/vi/xGPWD7slMN0/hqdefault.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
              onClick={() => setIsPlayingVideo(true)}
            >
              {isPlayingVideo ? (
                <iframe
                  src="https://www.youtube-nocookie.com/embed/xGPWD7slMN0?autoplay=1&rel=0"
                  title="Vídeo Tutorial de Instalação - Deal Hunter Pro"
                  className="w-full h-full border-0 relative z-10"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 bg-black/40 hover:bg-black/25 transition-colors flex flex-col items-center justify-center gap-3 z-10">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPlayingVideo(true);
                    }}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-600/50 hover:scale-110 active:scale-95 transition-all duration-300 border border-white/20"
                    aria-label="Assistir ao vídeo tutorial"
                  >
                    <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white ml-1 text-white" />
                  </button>
                  <span className="px-3.5 py-1 rounded-full bg-black/70 border border-white/20 backdrop-blur-md text-[11px] sm:text-xs font-bold text-white uppercase tracking-wider">
                    {t('video.play_btn')}
                  </span>
                </div>
              )}
            </div>

            {/* Rodapé do player */}
            <div className="p-4 sm:p-5 bg-[#090d18] border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{t('video.verified')}</span>
              </div>
              <a
                href={chromeWebStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={triggerOpenChromeStore}
                className="text-[#d4ff32] hover:underline font-bold flex items-center gap-2 transition-colors uppercase tracking-wider text-[11px]"
              >
                <ChromeIcon className="w-3.5 h-3.5" />
                <span>{t('video.add_chrome')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

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
                    width={800}
                    height={600}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
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
                        De <span className="line-through text-slate-400">R$ 2.499</span> por <strong className="text-emerald-400">R$ 1.749</strong>
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
                    href={chromeWebStoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={triggerOpenChromeStore}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.15] text-xs sm:text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                  >
                    <ChromeIcon className="w-4 h-4" />
                    <span>Instalar na Chrome Web Store</span>
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
              100% na nuvem e verificado pelo Google: instale em 1 clique e comece imediatamente.
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
                  Instale na Web Store
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                  Acesse a <strong>Chrome Web Store oficial</strong> e clique em <strong>&ldquo;Usar no Chrome&rdquo;</strong>. A extensão é baixada e verificada pelo Google em 1 segundo.
                </p>
              </div>
              <div className="pt-2">
                <a
                  href={chromeWebStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={triggerOpenChromeStore}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-bold text-[#d4ff32] transition-colors uppercase tracking-wider"
                >
                  <ChromeIcon className="w-3.5 h-3.5" />
                  <span>Abrir Web Store</span>
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
                  Conecte sua Conta
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                  Abra a extensão pelo ícone do navegador e faça login com sua conta Google ou e-mail. Seu período de teste de 7 dias ou licença Pro é sincronizado automaticamente.
                </p>
              </div>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d4ff32]/10 border border-[#d4ff32]/20 text-[11px] font-bold text-[#d4ff32] uppercase tracking-wider">
                  <Check className="w-3.5 h-3.5" />
                  <span>Login 100% Automático</span>
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
                  Receba Alertas no Telegram
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                  Conecte seu canal, grupo ou chat privado. O robô em nuvem começa a monitorar Amazon, Magalu e Eletroclub e avisa você no segundo em que o preço despencar.
                </p>
              </div>
              <div className="pt-2">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <Check className="w-3.5 h-3.5" />
                  <span>Alertas em Tempo Real</span>
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
              Desenvolvido tanto para compradores inteligentes quanto para vendedores e revendedores de e-commerce.
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
      {/* 7.1 BÔNUS EXCLUSIVO: PROFIT HUNTER PRO (CAPTURA NA TELA)                  */}
      {/* ========================================================================= */}
      <section id="bonus" className="py-16 sm:py-24 relative overflow-hidden bg-gradient-to-b from-[#070a12] via-[#0e1220] to-[#0a0d15] border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          
          {/* Ambient Glow leve */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-600/10 blur-xl pointer-events-none" />

          <div className="relative rounded-[2.5rem] bg-gradient-to-br from-[#0e1322] via-[#0b0f1a] to-[#070a12] border-2 border-violet-500/30 p-6 sm:p-12 shadow-2xl shadow-violet-950/40">
            
            {/* Top Badges */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-300 text-xs font-black uppercase tracking-wider">
                <Gift className="w-4 h-4 text-[#d4ff32]" />
                <span>{t('bonus.badge')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">{t('bonus.unlocked')}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Coluna Texto */}
              <div className="lg:col-span-7 space-y-5">
                <div className="flex items-center gap-4 sm:gap-5">
                  <img
                    src="/images/profit-hunter-logo.png"
                    alt="Profit Hunter Pro Logo"
                    width={80}
                    height={80}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_8px_24px_rgba(139,92,246,0.6)] flex-shrink-0"
                    loading="lazy"
                    decoding="async"
                  />
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-violet-300">
                      {t('bonus.badge')}
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight">
                      {t('bonus.title')}
                    </h2>
                  </div>
                </div>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                  {t('bonus.desc')}
                </p>

                {/* Grid de 4 recursos do bônus */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <Target className="w-5 h-5 text-[#d4ff32] flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Botão Flutuante</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Aparece sutilmente na página do produto para disparo imediato.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <Zap className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Captura em 1 Segundo</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Lê título, preço com desconto e link pronto para o Telegram.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <BellRing className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Telegram Imediato</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Envia direto para seu canal, grupo VIP ou chat pessoal.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <Sparkles className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Login 100% Unificado</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">A mesma conta do Deal Hunter ativa ambas as extensões.</p>
                    </div>
                  </div>
                </div>

                {/* CTAs do Bônus */}
                <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-4">
                  <a
                    href={downloadProfitHunterZipUrl}
                    download="Profit_Hunter_Cliente.zip"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-violet-600/30 transition-all hover:-translate-y-0.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t('bonus.btn_download')}</span>
                  </a>
                  <Link
                    href="/login"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.15] text-white font-bold text-xs sm:text-sm uppercase tracking-wider transition-all"
                  >
                    <Sparkles className="w-4 h-4 text-[#d4ff32]" />
                    <span>{t('bonus.btn_activate')}</span>
                  </Link>
                </div>
              </div>

              {/* Coluna Visual do Card / Mockup */}
              <div className="lg:col-span-5">
                <div className="relative rounded-2xl bg-[#070a12] border border-white/10 p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src="/images/profit-hunter-logo.png"
                        alt="Profit Hunter Pro"
                        width={28}
                        height={28}
                        className="w-7 h-7 object-contain drop-shadow-[0_2px_8px_rgba(139,92,246,0.6)]"
                        loading="lazy"
                        decoding="async"
                      />
                      <span className="font-extrabold text-sm text-white uppercase tracking-wider">Profit Hunter Pro</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold text-[10px] uppercase">
                      Incluso Grátis
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2">
                    <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Exemplo de Disparo no Telegram</div>
                    <div className="p-3 rounded-lg bg-[#0b0f19] border border-white/[0.06] text-xs font-mono space-y-1">
                      <div className="text-cyan-300 font-bold">🎯 Profit Hunter Pro — Nova Oferta!</div>
                      <div className="text-slate-300">📦 Produto: Smart TV 55" 4K UHD</div>
                      <div className="text-emerald-400 font-bold">💰 Preço: R$ 1.899,00 (42% OFF)</div>
                      <div className="text-violet-400">🔗 Link: mercadolivre.com.br/sec/...</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-violet-950/20 border border-violet-500/30 text-xs text-slate-300 flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#d4ff32] flex-shrink-0" />
                    <span>Valor avulso: <s className="text-slate-400">R$ 97/ano</s> · <strong>Grátis</strong> para membros Pro.</span>
                  </div>
                </div>
              </div>

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
              {t('pricing.badge')}
            </div>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
              {t('pricing.title')}
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              {t('pricing.desc')} <strong className="text-white">{formatMoney(29.90)}</strong>:
            </p>

            {/* Banner de Destaque do Teste */}
            <div className="pt-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#d4ff32] hover:bg-[#c3f01c] text-black font-black text-sm sm:text-base uppercase tracking-wider shadow-xl shadow-[#d4ff32]/25 hover:shadow-[#d4ff32]/40 hover:-translate-y-0.5 transition-all active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t('pricing.cta_trial')}</span>
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
                  <span>{t('pricing.opt1_badge')}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>{t('pricing.opt1_tag')}</span>
                </div>
                <h3 className="text-2xl font-black text-white">
                  {t('pricing.opt1_title')}
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed mt-1">
                  {t('pricing.opt1_desc')}
                </p>

                {/* Preço */}
                <div className="mt-6 mb-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-white">
                      {formatMoney(29.90)}
                    </span>
                    <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
                      {t('pricing.opt1_period')}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {t('pricing.opt1_sub')}
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
                      <span>Instalação instantânea oficial via Chrome Web Store</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Sem necessidade de cadastrar cartão de crédito</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#d4ff32] flex-shrink-0" />
                      <span><strong>BÔNUS INCLUSO:</strong> Extensão Profit Hunter Pro (Captura na Tela)</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Suporte técnico prioritário via e-mail e WhatsApp</span>
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
                  <span>{t('pricing.opt1_btn')} ({formatMoney(29.90)})</span>
                </a>
                <p className="text-center text-[11px] text-emerald-400 font-medium mt-2.5">
                  ⚡ {t('pricing.opt1_note')}
                </p>
              </div>

            </div>

            {/* CARD 2: CARTÃO DE CRÉDITO (STRIPE) */}
            <div className="relative rounded-[2.5rem] bg-gradient-to-b from-[#131128] via-[#0d0d1e] to-[#070712] border-2 border-violet-500/60 p-7 sm:p-9 shadow-2xl shadow-violet-500/10 flex flex-col justify-between overflow-hidden group hover:border-violet-400 transition-all">
              
              {/* Badge Topo */}
              <div className="absolute top-0 right-0">
                <div className="bg-gradient-to-l from-violet-600 to-indigo-600 text-white text-[11px] font-black uppercase tracking-wider py-1.5 px-5 rounded-bl-2xl shadow-md flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#d4ff32]" />
                  <span>{t('pricing.opt2_badge')}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-violet-400 font-bold text-xs uppercase tracking-wider mb-2">
                  <Flame className="w-3.5 h-3.5 fill-violet-400" />
                  <span>{t('pricing.opt2_tag')}</span>
                </div>
                <h3 className="text-2xl font-black text-white">
                  {t('pricing.opt2_title')}
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed mt-1">
                  {t('pricing.opt2_desc')}
                </p>

                {/* Preço Cartão Stripe */}
                <div className="mt-6 mb-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-white">
                      {formatMoney(29.90)}
                    </span>
                    <span className="text-xs text-violet-400 font-bold uppercase tracking-wider">
                      {t('pricing.opt2_period')}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#d4ff32] font-semibold mt-1">
                    🔄 {t('pricing.opt2_sub')}
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
                      <CheckCircle2 className="w-4 h-4 text-[#d4ff32] flex-shrink-0" />
                      <span><strong>BÔNUS INCLUSO:</strong> Extensão Profit Hunter Pro (Captura na Tela)</span>
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
                  <span>Assinar {formatMoney(29.90)} no Cartão</span>
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
              {t('faq.badge')}
            </h2>
            <p className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
              {t('faq.title')}
            </p>
            <p className="text-sm text-slate-400">
              {t('faq.subtitle')}
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
              {t('faq.contact')}
            </p>
            <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto mb-5">
              guilherme.r.nascimentoml@gmail.com
            </p>
            <a
              href="mailto:guilherme.r.nascimentoml@gmail.com?subject=Suporte%20Deal%20Hunter%20Pro"
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-violet-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>{t('faq.contact')} (guilherme.r.nascimentoml@gmail.com)</span>
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
                <img
                  src="/images/logo.png"
                  alt="Deal Hunter Pro"
                  width={36}
                  height={36}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base uppercase tracking-tight text-white">Deal Hunter</span>
                <span className="px-1.5 py-0.5 rounded-full bg-violet-600/30 border border-violet-500/40 text-violet-300 text-[9px] font-black tracking-wider uppercase">PRO</span>
              </div>
            </div>

            {/* Links Rápidos */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <Link href="/docs" className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{t('nav.docs')} Oficial</span>
              </Link>
              <Link href="/ofertas" className="hover:text-amber-300 text-slate-300 transition-colors">
                {t('nav.showcase')}
              </Link>
              <a href="#como-funciona" className="hover:text-white transition-colors">
                {t('hero.how_it_works')}
              </a>
              <a href="#recursos" className="hover:text-white transition-colors">
                {t('nav.features')}
              </a>
              <a href="#planos" className="hover:text-white transition-colors">
                {t('nav.pricing')}
              </a>
              <Link href="/login" className="hover:text-white transition-colors">
                {t('nav.members')}
              </Link>
            </div>

            {/* Botão de Suporte */}
            <div>
              <a
                href="mailto:guilherme.r.nascimentoml@gmail.com?subject=Suporte%20Deal%20Hunter%20Pro"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-slate-300 text-xs transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t('faq.contact')}</span>
              </a>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <p>
              &copy; {new Date().getFullYear()} Deal Hunter Pro (dealhunterpro.com.br) — {t('footer.rights')}
            </p>
            <div className="flex items-center gap-4">
              <Link href="/privacy#termos" className="hover:text-slate-200 transition-colors">
                {t('footer.terms')}
              </Link>
              <span>·</span>
              <Link href="/privacy#privacidade" className="hover:text-slate-200 transition-colors">
                {t('footer.privacy')}
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
                {t('pricing.title')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                {t('pricing.desc')} <strong className="text-white">{formatMoney(29.90)}</strong>:
              </p>
            </div>

            {/* Destaque 1: Iniciar Teste Grátis de 7 Dias com o Google */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-violet-500/15 via-indigo-500/10 to-emerald-500/15 border border-violet-500/40 text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 text-[#d4ff32] font-black text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span>🎉 {t('hero.trust_free')}</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {t('pricing.cta_trial')}
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
                <span>{googleLoading ? 'Conectando...' : t('pricing.cta_trial')}</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center my-1">
              <div className="border-t border-white/[0.08] w-full" />
              <span className="bg-[#0c101d] px-3 text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                ou {formatMoney(29.90)}
              </span>
            </div>

            <div className="space-y-3">
              {/* Opção 1: Pix InfinitePay */}
              <div className="relative p-4 rounded-2xl bg-gradient-to-b from-[#11241f] to-[#0d1715] border border-emerald-500/60 hover:border-emerald-400 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                    ⚡ {t('pricing.opt1_badge')}
                  </span>
                  <span className="text-base font-black text-white">{formatMoney(29.90)} <span className="text-[10px] text-gray-400 font-normal">{t('pricing.opt1_period')}</span></span>
                </div>
                <p className="text-xs text-gray-300">
                  {t('pricing.opt1_desc')}
                </p>
                <a
                  href={infinitePayPixUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs shadow-md transition-all active:scale-[0.98]"
                >
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  <span>{t('pricing.opt1_btn')} ({formatMoney(29.90)})</span>
                </a>
              </div>

              {/* Opção 2: Cartão de Crédito Stripe */}
              <div className="relative p-4 rounded-2xl bg-gradient-to-b from-[#16142c] to-[#0f0e20] border border-violet-500/50 hover:border-violet-400 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-black uppercase tracking-wider">
                    🔄 {t('pricing.opt2_badge')}
                  </span>
                  <span className="text-base font-black text-white">{formatMoney(29.90)} <span className="text-[10px] text-gray-400 font-normal">{t('pricing.opt2_period')}</span></span>
                </div>
                <p className="text-xs text-gray-300">
                  {t('pricing.opt2_desc')}
                </p>
                <Link
                  href={stripeCardUrl}
                  onClick={() => setCheckoutModalOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs transition-all active:scale-[0.98] shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#d4ff32]" />
                  <span>Assinar {formatMoney(29.90)} no Cartão</span>
                </Link>
              </div>
            </div>

            <p className="text-center text-[11px] text-slate-400">
              🔒 Pagamentos e autenticação processados com segurança de ponta a ponta.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
