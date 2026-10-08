import React from 'react';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import VitrineClient from '@/components/showcase/VitrineClient';
import { getShowcaseDeals } from '@/lib/showcase/store';

export const metadata: Metadata = {
  title: 'Vitrine de Ofertas & Superdescontos Verificados — Deal Hunter Pro',
  description:
    'Confira as ofertas e bugs de preço selecionados e verificados pelo robô Deal Hunter Pro. Descontos reais de até 80% na Amazon, KaBuM!, Shopee, Magalu e mais.',
  openGraph: {
    title: 'Vitrine de Ofertas Verificadas — Deal Hunter Pro',
    description:
      'Ofertas selecionadas com superdescontos reais nos maiores e-commerces do Brasil.',
    url: 'https://www.dealhunterpro.com.br/ofertas',
    siteName: 'Deal Hunter Pro',
    locale: 'pt_BR',
    type: 'website',
  },
};

// Sempre renderiza com dados frescos e imediatos
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function OfertasPage() {
  const initialDeals = await getShowcaseDeals();

  return (
    <div className="min-h-screen bg-[#070a12] text-[#f1f5f9] selection:bg-violet-500/30 selection:text-violet-200 antialiased flex flex-col justify-between">
      {/* Luzes de fundo atmosféricas leves e otimizadas sem blur excessivo */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-violet-600/10 rounded-full pointer-events-none -z-10 blur-3xl opacity-70" />
      <div className="fixed top-1/3 -right-20 w-[450px] h-[450px] bg-cyan-600/10 rounded-full pointer-events-none -z-10 blur-3xl opacity-70" />

      {/* Navbar do Deal Hunter Pro */}
      <Navbar />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        <VitrineClient initialDeals={initialDeals} />
      </main>

      {/* Rodapé */}
      <footer className="mt-16 border-t border-white/[0.08] bg-[#05070c] py-10 px-4 text-center text-xs text-slate-500 space-y-3">
        <div className="flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-slate-400 font-semibold">
            Preços e estoques sujeitos a alterações dinâmicas nas lojas de origem.
          </span>
        </div>
        <p>
          © {new Date().getFullYear()} Deal Hunter Pro. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
