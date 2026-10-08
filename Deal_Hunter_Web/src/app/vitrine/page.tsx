import React from 'react';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import { getActiveProducts } from '@/lib/products/service';
import { VitrineDynamicShowcase } from '@/components/products/VitrineDynamicShowcase';

export const metadata: Metadata = {
  title: 'Vitrine Dinâmica de Produtos — Atualização em Tempo Real',
  description:
    'Vitrine de produtos com revalidação de cache sob demanda no Next.js App Router e Supabase. Novos produtos aparecem instantaneamente sem necessidade de rebuild ou deploy.',
};

// Renderização dinâmica sob demanda com dados frescos instantâneos
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function VitrinePage() {
  // Busca inicial no servidor (Server Component)
  const products = await getActiveProducts(50);

  return (
    <div className="min-h-screen bg-[#070a12] text-[#f1f5f9] selection:bg-cyan-500/30 selection:text-cyan-200 antialiased flex flex-col justify-between">
      {/* Luzes decorativas de fundo em baixa opacidade */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[750px] h-[350px] bg-cyan-600/10 rounded-full pointer-events-none -z-10 blur-3xl opacity-60" />
      <div className="fixed top-1/3 -right-20 w-[450px] h-[450px] bg-emerald-600/10 rounded-full pointer-events-none -z-10 blur-3xl opacity-60" />

      {/* Navbar Padrão */}
      <Navbar />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Cabeçalho da Página */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            Arquitetura de E-commerce Server-Driven
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Vitrine Dinâmica de Produtos
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Cadastre novos produtos no painel administrativo de testes abaixo e observe a vitrine
            refletir as alterações instantaneamente, utilizando <strong>On-Demand Revalidation</strong>{' '}
            (Next.js App Router + Supabase) sem necessidade de novo deploy.
          </p>
        </div>

        {/* Orquestrador da Vitrine com Admin Form e ProductGrid */}
        <VitrineDynamicShowcase initialProducts={products} />
      </main>

      {/* Rodapé Simples */}
      <footer className="border-t border-slate-800/80 bg-[#06080e] py-6 text-center text-xs text-slate-500">
        <p>Deal Hunter Pro • Vitrine Dinâmica com On-Demand Cache Invalidation</p>
      </footer>
    </div>
  );
}
