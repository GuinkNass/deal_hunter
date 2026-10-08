'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguageCurrency, Language, Currency } from '@/contexts/LanguageCurrencyContext';
import { Globe, Coins, ChevronDown, Check } from 'lucide-react';

interface Props {
  className?: string;
  variant?: 'compact' | 'full';
}

export default function LanguageCurrencySelector({ className = '', variant = 'compact' }: Props) {
  const { lang, setLang, currency, setCurrency, rates } = useLanguageCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const langLabels: Record<Language, { label: string; flag: string }> = {
    pt: { label: 'PT', flag: '🇧🇷' },
    en: { label: 'EN', flag: '🇺🇸' },
    es: { label: 'ES', flag: '🇪🇸' },
  };

  const currencyLabels: Record<Currency, { label: string; symbol: string }> = {
    BRL: { label: 'BRL', symbol: 'R$' },
    USD: { label: 'USD', symbol: '$' },
    EUR: { label: 'EUR', symbol: '€' },
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      {/* Botão de Trigger em Texto Limpo Sem Bordas Arredondadas Comprimidas */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 py-1 px-1 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer group select-none"
        title="Alterar idioma e moeda de exibição"
      >
        <span className="text-sm leading-none">{langLabels[lang].flag}</span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200 group-hover:text-cyan-300 transition-colors">
          {langLabels[lang].label}
        </span>
        <span className="text-slate-500 font-normal text-[10px]">·</span>
        <span className="text-[11px] font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors">
          {currencyLabels[currency].symbol} {currency}
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-400 group-hover:text-slate-200 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0f1424] border border-slate-700/80 shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Seção de Idioma */}
          <div className="mb-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <Globe className="w-3 h-3 text-cyan-400" />
              <span>Idioma / Language</span>
            </div>
            <div className="grid grid-cols-3 gap-1 mt-1">
              {(['pt', 'en', 'es'] as Language[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => {
                    setLang(l);
                  }}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-xs font-bold transition-all ${
                    lang === l
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'hover:bg-white/[0.05] text-slate-300'
                  }`}
                >
                  <span className="text-base">{langLabels[l].flag}</span>
                  <span className="text-[10px] uppercase font-black">{langLabels[l].label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Seção de Moeda */}
          <div>
            <div className="flex items-center justify-between px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <div className="flex items-center gap-1.5">
                <Coins className="w-3 h-3 text-emerald-400" />
                <span>Moeda / Currency</span>
              </div>
              <span className="text-[9px] text-slate-500 lowercase">ao vivo</span>
            </div>
            <div className="space-y-1 mt-1">
              {(['BRL', 'USD', 'EUR'] as Currency[]).map((c) => {
                const isSelected = currency === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCurrency(c);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'hover:bg-white/[0.05] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-emerald-400">{currencyLabels[c].symbol}</span>
                      <span>{c}</span>
                    </div>
                    {c !== 'BRL' && rates[c] > 0 && (
                      <span className="text-[10px] text-slate-400 font-normal">
                        1 {c} = R$ {rates[c].toFixed(2)}
                      </span>
                    )}
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
