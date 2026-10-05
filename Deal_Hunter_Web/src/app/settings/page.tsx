'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ArrowLeft, Radar } from 'lucide-react';
import RobustSettingsView from '@/components/ml-radar/RobustSettingsView';

export default function SettingsPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
        return;
      }
      setSessionUser(session.user);
      setAuthToken(session.access_token);
      setLoading(false);
    });
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a12] text-white flex flex-col items-center justify-center space-y-4 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <p className="text-xs text-slate-400">Carregando painel de configurações...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070a12] text-[#f1f5f9] selection:bg-cyan-500/30 font-sans antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#080b14]/80 border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Dashboard</span>
            </Link>

            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-2xl overflow-hidden shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-all flex items-center justify-center bg-[#0e1322] p-1 border border-indigo-500/30">
                <img
                  src="/images/logo.png"
                  alt="Deal Hunter Pro Logo"
                  width={36}
                  height={36}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-black text-base uppercase tracking-tight text-white">
                Deal Hunter Pro
              </span>
            </Link>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-cyan-500/25 transition-all"
          >
            <Radar className="w-3.5 h-3.5 animate-pulse" />
            <span>Ir para o Dashboard</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RobustSettingsView authToken={authToken} userId={sessionUser?.id} />
      </main>
    </div>
  );
}
