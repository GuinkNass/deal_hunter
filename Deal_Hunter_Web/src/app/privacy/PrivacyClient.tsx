'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  Database,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  FileText,
  Scale,
  Key,
  Cpu,
  Layers,
  Mail,
  Globe,
  RefreshCw,
  FileCheck,
  Bell,
  Sliders,
  Send,
  HelpCircle,
} from 'lucide-react';

type TabType = 'privacidade' | 'chrome' | 'termos';

export default function PrivacyClient() {
  const [activeTab, setActiveTab] = useState<TabType>('privacidade');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('termo')) {
        setActiveTab('termos');
      } else if (hash.includes('chrome') || hash.includes('permiss')) {
        setActiveTab('chrome');
      } else {
        setActiveTab('privacidade');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const changeTab = (tab: TabType) => {
    setActiveTab(tab);
    window.history.replaceState(null, '', `#${tab}`);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-200 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background Glow Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-indigo-600/15 via-violet-600/5 to-transparent blur-3xl opacity-60" />
        <div className="absolute top-[35%] -right-40 w-[600px] h-[600px] bg-emerald-600/10 blur-[140px] opacity-40" />
      </div>

      {/* Header Minimalista de Navegação */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#07090e]/80 border-b border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors group"
          >
            <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center group-hover:border-white/20 transition-all">
              <ArrowLeft className="w-4 h-4 text-slate-300 group-hover:-translate-x-0.5 transition-transform" />
            </div>
            <span>Voltar ao Site Principal</span>
          </Link>

          {/* Logo Central */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-2xl overflow-hidden bg-[#0c101d] border border-indigo-500/30 flex items-center justify-center p-1 shadow-md shadow-indigo-500/10">
              <img
                src="/images/logo.png"
                alt="Deal Hunter Pro Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm tracking-tight text-white uppercase">
                Deal Hunter
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-md border border-indigo-400/30">
                Pro
              </span>
            </div>
          </Link>

          {/* Suporte Direto */}
          <a
            href="mailto:guilherme.r.nascimentoml@gmail.com?subject=Privacidade%20Deal%20Hunter%20Pro"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs text-slate-300 hover:text-white transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-emerald-400" />
            <span>Falar com DPO / Suporte</span>
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-14 pb-8 text-center max-w-4xl mx-auto px-4 sm:px-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-5">
          <ShieldCheck className="w-4 h-4" />
          <span>Conformidade com LGPD & Google Chrome Web Store Policy</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
          Central de Privacidade e{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-emerald-400 bg-clip-text text-transparent">
            Termos de Uso
          </span>
        </h1>

        <p className="mt-4 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Transparência absoluta sobre os dados operados pela extensão <strong>Deal Hunter Pro</strong> e pela plataforma web. Seus dados nunca são vendidos nem utilizados para publicidade direcionada.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
          <span>Última atualização: <strong>01 de Outubro de 2026</strong></span>
          <span>•</span>
          <span>Versão da Extensão: <strong>3.0.0 (Manifest V3)</strong></span>
          <span>•</span>
          <span>Jurisdição: <strong>Brasil (LGPD)</strong></span>
        </div>

        {/* Tab Navigation */}
        <div className="mt-10 flex items-center justify-center">
          <div className="p-1.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md flex flex-wrap items-center justify-center gap-2 max-w-2xl w-full">
            <button
              onClick={() => changeTab('privacidade')}
              className={`flex-1 min-w-[150px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'privacidade'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Política de Privacidade</span>
            </button>

            <button
              onClick={() => changeTab('chrome')}
              className={`flex-1 min-w-[150px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'chrome'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <Globe className="w-4 h-4 text-amber-300" />
              <span>Diretrizes Chrome Store</span>
            </button>

            <button
              onClick={() => changeTab('termos')}
              className={`flex-1 min-w-[150px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'termos'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Termos de Uso</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-4">

        {/* ========================================================================= */}
        {/* ABA 1: POLÍTICA DE PRIVACIDADE                                            */}
        {/* ========================================================================= */}
        {activeTab === 'privacidade' && (
          <div className="space-y-10 animate-in fade-in duration-300">
            
            {/* Box Resumo Rápido */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/[0.1] backdrop-blur-xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2.5 mb-4">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Resumo da nossa Política de Privacidade</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#0c101d] border border-white/5 space-y-1.5">
                  <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Sem Venda de Dados</span>
                  </div>
                  <p className="text-slate-400">
                    Nunca vendemos, alugamos ou comercializamos dados de usuários para corretores ou terceiros.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#0c101d] border border-white/5 space-y-1.5">
                  <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <Lock className="w-4 h-4" />
                    <span>Armazenamento Local</span>
                  </div>
                  <p className="text-slate-400">
                    Tokens do Telegram e preferências de busca são gravados localmente em sua máquina (<code className="text-indigo-300">chrome.storage.local</code>).
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#0c101d] border border-white/5 space-y-1.5">
                  <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <EyeOff className="w-4 h-4" />
                    <span>Zero Monitoramento Externo</span>
                  </div>
                  <p className="text-slate-400">
                    A extensão não lê senhas, números de cartão nem seu histórico de navegação geral fora das lojas suportadas.
                  </p>
                </div>
              </div>
            </div>

            {/* Seção 1: Identificação do Controlador */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/[0.08] pb-3">
                <span className="text-indigo-400">1.</span> Identificação do Controlador e Contato do DPO
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Esta Política de Privacidade aplica-se à plataforma web <strong>Deal Hunter Pro</strong> (disponível em <a href="https://www.dealhunterpro.com.br" className="text-indigo-400 hover:underline">https://www.dealhunterpro.com.br</a>) e à extensão para o navegador Google Chrome <strong>Deal Hunter Pro — Monitor de Ofertas</strong>.
              </p>
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-xs text-slate-300 space-y-2">
                <div><strong>Nome do Produto / Serviço:</strong> Deal Hunter Pro — Monitor de Ofertas</div>
                <div><strong>Encarregado pelo Tratamento de Dados (DPO):</strong> Guilherme R. Nascimento</div>
                <div><strong>Canal Exclusivo para Direitos e Privacidade:</strong> <a href="mailto:guilherme.r.nascimentoml@gmail.com" className="text-indigo-400 hover:underline">guilherme.r.nascimentoml@gmail.com</a></div>
                <div><strong>Endereço de Operação:</strong> São Paulo/SP — Brasil</div>
              </div>
            </section>

            {/* Seção 2: Dados Coletados */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/[0.08] pb-3">
                <span className="text-indigo-400">2.</span> Quais Dados Coletamos e Como Utilizamos
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Seguimos rigorosamente o princípio da necessidade e minimização de dados da LGPD (Art. 6º, III). Coletamos apenas o estritamente necessário para prestar o serviço de alertas e monitoramento:
              </p>

              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                  <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-400" />
                    a) Dados na Plataforma Web (dealhunterpro.com.br)
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    Quando você cria uma conta ou assina um plano, armazenamos seu e-mail cadastrado e nome via autenticação segura (Supabase / Google OAuth). Esses dados são utilizados exclusivamente para gerenciar sua licença de uso, controlar acesso e emitir faturas de pagamento.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                  <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                    <Key className="w-4 h-4 text-emerald-400" />
                    b) Dados na Extensão do Chrome (Deal Hunter Pro Extension)
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    A extensão funciona primariamente no lado do cliente (Client-Side). As configurações inseridas por você — tais como porcentagem mínima de desconto para disparo de alertas, categorias de interesse, token do Bot do Telegram, ID do Chat do Telegram e chave de ativação da licença — são armazenadas estritamente no armazenamento local do seu navegador através da API <code className="text-emerald-300 bg-emerald-950/40 px-1 py-0.5 rounded">chrome.storage.local</code>. Esses dados não são transferidos nem vendidos a terceiros.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                  <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-violet-400" />
                    c) Dados de Pagamento e Faturamento
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    Todas as transações de pagamento (cartão de crédito e PIX) são processadas diretamente por intermediadores de pagamento certificados internacionalmente no padrão PCI-DSS (Stripe e InfinitePay). <strong>A plataforma Deal Hunter Pro e a extensão nunca têm acesso nem armazenam dados sensíveis de pagamento</strong>, tais como número completo de cartão de crédito, validade ou código de segurança (CVV).
                  </p>
                </div>
              </div>
            </section>

            {/* Seção 3: Como os Dados são Compartilhados */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/[0.08] pb-3">
                <span className="text-indigo-400">3.</span> Compartilhamento de Dados com Terceiros
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                O Deal Hunter Pro não comercializa dados sob hipótese alguma. O compartilhamento ocorre única e exclusivamente com provedores essenciais para a execução do serviço contratado:
              </p>
              <ul className="space-y-2 text-xs text-slate-400 list-disc list-inside">
                <li><strong className="text-white">Telegram Bot API (api.telegram.org):</strong> Quando configurado pelo usuário, os alertas de promoções são enviados diretamente do cliente para a API oficial do Telegram utilizando o token e chat ID fornecidos por você.</li>
                <li><strong className="text-white">Processadores de Pagamento (Stripe / InfinitePay):</strong> Para confirmação e liquidação das assinaturas.</li>
                <li><strong className="text-white">Infraestrutura em Nuvem (Supabase & Vercel):</strong> Hospedagem segura de autenticação e verificação de licenças ativas, protegidas por criptografia em trânsito (TLS 1.3).</li>
              </ul>
            </section>

            {/* Seção 4: Direitos do Titular sob a LGPD */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/[0.08] pb-3">
                <span className="text-indigo-400">4.</span> Direitos do Usuário (Artigo 18 da LGPD)
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Você tem o controle total sobre seus dados pessoais. A qualquer momento, mediante requisição simples, você pode exercer os seguintes direitos:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Confirmação e Acesso:</strong> Saber se tratamos dados seus e solicitar cópia integral.
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Correção:</strong> Solicitar retificação imediata de dados incompletos ou desatualizados.
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Eliminação e Exclusão:</strong> Solicitar o apagamento total de seus dados cadastrais.
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Revogação do Consentimento:</strong> Desinstalar a extensão e revogar permissões concedidas.
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Para solicitar a exclusão de sua conta ou exercer qualquer dos direitos acima, basta enviar um e-mail para <a href="mailto:guilherme.r.nascimentoml@gmail.com" className="text-indigo-400 font-semibold hover:underline">guilherme.r.nascimentoml@gmail.com</a> com o assunto &quot;Direitos LGPD - Exclusão de Dados&quot;. Sua solicitação será processada em até 15 dias corridos.
              </p>
            </section>

            {/* Seção 5: Retenção e Desinstalação */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/[0.08] pb-3">
                <span className="text-indigo-400">5.</span> Retenção de Dados e Como Excluir a Extensão
              </h2>
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-300 space-y-2">
                <p>
                  <strong>Exclusão Automática Local:</strong> Ao desinstalar ou remover a extensão Deal Hunter Pro do Google Chrome (via <code className="text-indigo-300">chrome://extensions</code>), todo e qualquer dado armazenado em <code className="text-indigo-300">chrome.storage.local</code> (preferências, tokens e histórico de preços) é <strong>permanentemente e instantaneamente excluído do seu disco rígido</strong> pelo próprio navegador Chrome, sem deixar resíduos.
                </p>
                <p>
                  <strong>Dados em Nuvem:</strong> Dados de assinatura e conta web são mantidos enquanto sua conta estiver ativa ou pelo período necessário para cumprimento de obrigações tributárias e fiscais brasileiras (Lei 12.965/2014 - Marco Civil da Internet).
                </p>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 2: DIRETRIZES DA GOOGLE CHROME WEB STORE                             */}
        {/* ========================================================================= */}
        {activeTab === 'chrome' && (
          <div className="space-y-10 animate-in fade-in duration-300">
            
            {/* Box Destaque de Conformidade da Chrome Store */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-indigo-950/40 via-violet-950/20 to-white/[0.02] border border-indigo-500/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Globe className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white">
                    Declaração de Conformidade com o Google Chrome Web Store
                  </h2>
                  <p className="text-xs text-indigo-300">
                    Developer Program Policies & Limited Use Disclosure
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                A extensão <strong>Deal Hunter Pro — Monitor de Ofertas</strong> adere com rigor às políticas de privacidade, segurança e integridade de dados estipuladas pelo Google Chrome Web Store Developer Program Policies, incluindo a <strong>Política de Finalidade Única (Single Purpose)</strong> e a <strong>Política de Requisitos de Uso Limitado (Limited Use Policy)</strong>.
              </p>
            </div>

            {/* Finalidade Única */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/[0.08] pb-3">
                <span className="text-indigo-400">1.</span> Política de Finalidade Única (Single Purpose)
              </h2>
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-300 space-y-2">
                <p>
                  A extensão <strong>Deal Hunter Pro — Monitor de Ofertas</strong> possui uma finalidade única, clara e não divergente:
                </p>
                <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-indigo-200 font-medium leading-relaxed">
                  &ldquo;Permitir ao usuário monitorar preços, erros de precificação (bugs) e variações promocionais em marketplaces e lojas virtuais brasileiras selecionadas em tempo real, disparando alertas informativos ao usuário através do Side Panel do Chrome ou notificações em canais privados do Telegram.&rdquo;
                </div>
                <p className="text-slate-400">
                  A extensão não desempenha nenhuma função oculta, não executa códigos não declarados, não injeta propagandas não solicitadas, não faz mineramento de criptomoedas e não desvia o tráfego do usuário.
                </p>
              </div>
            </section>

            {/* Tabela de Permissões Justificadas */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/[0.08] pb-3">
                <span className="text-indigo-400">2.</span> Justificativa de Cada Permissão Solicitada no Manifest V3
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Todas as permissões declaradas no arquivo <code className="text-indigo-300">manifest.json</code> obedecem estritamente ao princípio do menor privilégio necessário:
              </p>

              <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-white/[0.05] text-white font-bold border-b border-white/[0.08]">
                    <tr>
                      <th className="py-3 px-4">Permissão</th>
                      <th className="py-3 px-4">Finalidade Técnica Exclusiva</th>
                      <th className="py-3 px-4">Coleta Dados Pessoais?</th>
                      <th className="py-3 px-4">Onde é Armazenado?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    <tr className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-400">storage</td>
                      <td className="py-3 px-4 text-slate-300">
                        Salva configurações do usuário (percentual mínimo de desconto, filtros, bot token do Telegram e status da licença).
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold">Não</td>
                      <td className="py-3 px-4 text-slate-400">Localmente na máquina (<code className="text-slate-300">chrome.storage.local</code>)</td>
                    </tr>
                    <tr className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-400">alarms</td>
                      <td className="py-3 px-4 text-slate-300">
                        Agenda rotinas de checagem periódica em segundo plano sem manter processos ativos em tempo integral, poupando CPU e bateria.
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold">Não</td>
                      <td className="py-3 px-4 text-slate-400">Memória temporária do Chrome</td>
                    </tr>
                    <tr className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-400">sidePanel</td>
                      <td className="py-3 px-4 text-slate-300">
                        Renderiza a interface do monitor diretamente no painel lateral nativo do Chrome, proporcionando uso ergonômico sem sobrepor a tela.
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold">Não</td>
                      <td className="py-3 px-4 text-slate-400">Não aplicável (Interface nativa)</td>
                    </tr>
                    <tr className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-400">tabs & scripting</td>
                      <td className="py-3 px-4 text-slate-300">
                        Injeta o analisador de preços (<code className="text-slate-300">content.js</code>) estritamente nas abas das lojas autorizadas para ler valores promocionais públicos da página.
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold">Não</td>
                      <td className="py-3 px-4 text-slate-400">Não armazena histórico de navegação</td>
                    </tr>
                    <tr className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-400">host_permissions</td>
                      <td className="py-3 px-4 text-slate-300">
                        Restrito exclusivamente aos marketplaces parceiros (Amazon Brasil, Magalu, Eletroclub, KaBuM!, Pichau, Lojas Renner, Shein, Shopee) e ao domínio de verificação de licença (<code className="text-slate-300">dealhunterpro.com.br</code>).
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold">Não</td>
                      <td className="py-3 px-4 text-slate-400">Apenas lê dados públicos de produtos da página</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Declaração de Uso Limitado (Limited Use Requirements) */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/[0.08] pb-3">
                <span className="text-indigo-400">3.</span> Declaração de Uso Limitado (Limited Use Disclosure)
              </h2>
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3 text-xs text-slate-300">
                <p>
                  O Deal Hunter Pro declara solenemente que o tratamento de dados de navegação e extensão está em total conformidade com a <strong>Política de Dados do Usuário do Google Chrome</strong>:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>NÃO vendemos ou transferimos dados para terceiros ou corretores de dados.</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>NÃO utilizamos dados para servir anúncios personalizados ou retargeting.</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>NÃO utilizamos dados para avaliar perfil de crédito ou capacidade de pagamento.</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>NÃO lemos senhas, campos de formulários pessoais, CPFs ou cartões de crédito.</span>
                  </div>
                </div>
              </div>
            </section>

            {/* English Section for Chrome Store Reviewers */}
            <section className="p-6 rounded-3xl bg-[#0c101d] border border-indigo-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Chrome Web Store Reviewers Note (English)</span>
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-300 font-mono">
                  Reviewer Reference
                </span>
              </div>
              <div className="text-xs text-slate-300 leading-relaxed space-y-2 border-t border-white/5 pt-3">
                <p>
                  <strong>Extension Name:</strong> Deal Hunter Pro — Monitor de Ofertas<br />
                  <strong>Publisher / Developer:</strong> Guilherme R. Nascimento / Deal Hunter Pro<br />
                  <strong>Single Purpose:</strong> Real-time monitoring of deals, promotional discounts, and pricing errors on verified Brazilian e-commerce marketplaces with instant user alerts via browser Side Panel or private user Telegram channels.<br />
                  <strong>Permissions:</strong> All declared permissions (<code className="text-indigo-300">storage</code>, <code className="text-indigo-300">alarms</code>, <code className="text-indigo-300">sidePanel</code>, <code className="text-indigo-300">scripting</code>, <code className="text-indigo-300">tabs</code>, and specific <code className="text-indigo-300">host_permissions</code>) are strictly used to parse publicly available product price tags and render the Side Panel UI. No PII, cookies, login passwords, or credit card information are collected or stored.<br />
                  <strong>Telegram Integration:</strong> Bot tokens and Chat IDs are kept exclusively on the client machine in <code className="text-indigo-300">chrome.storage.local</code> and transmitted directly to official Telegram APIs (<code className="text-indigo-300">api.telegram.org</code>).<br />
                  <strong>Data Safety Compliance:</strong> The developer strictly complies with the Chrome Web Store Limited Use requirements. User data is never sold, transferred for advertising, or used for credit scoring.
                </p>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 3: TERMOS DE USO                                                      */}
        {/* ========================================================================= */}
        {activeTab === 'termos' && (
          <div className="space-y-10 animate-in fade-in duration-300">
            
            {/* Box Resumo dos Termos */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/[0.1] backdrop-blur-xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2.5 mb-2">
                <Scale className="w-5 h-5 text-indigo-400" />
                <span>Termos e Condições de Serviço do Deal Hunter Pro</span>
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Ao utilizar a plataforma <strong>Deal Hunter Pro</strong> e/ou instalar nossa extensão no Google Chrome, você declara que leu, compreendeu e concorda expressamente com todos os termos e condições abaixo.
              </p>
            </div>

            {/* Seção 1: Objeto e Licença */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/[0.08] pb-3">
                <span className="text-indigo-400">1.</span> Objeto e Concessão de Licença de Uso
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                O <strong>Deal Hunter Pro</strong> concede a você uma licença pessoal, revogável, não exclusiva, intransferível e limitada para utilizar nosso software e extensão durante a vigência do seu plano ou período de teste contratado.
              </p>
              <ul className="space-y-2 text-xs text-slate-400 list-disc list-inside">
                <li>O serviço destina-se ao uso pessoal e profissional do assinante para busca e curadoria de ofertas.</li>
                <li>É vedado o compartilhamento, sublicenciamento, venda ou engenharia reversa do código-fonte da extensão ou de nossas APIs.</li>
                <li>Cada licença autoriza o uso concomitante nos dispositivos permitidos de acordo com o plano contratado.</li>
              </ul>
            </section>

            {/* Seção 2: Natureza Informativa e Isenção sobre Varejistas */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/[0.08] pb-3">
                <span className="text-indigo-400">2.</span> Natureza Informativa das Ofertas e Isenção de Responsabilidade
              </h2>
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-amber-300 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>Aviso Importante sobre Preços e Estoques</span>
                </div>
                <p className="leading-relaxed">
                  O Deal Hunter Pro é uma ferramenta estritamente informativa de curadoria e monitoramento de preços públicos. <strong>Não vendemos produtos diretamente nem mantemos estoques.</strong>
                </p>
                <p className="leading-relaxed text-slate-300">
                  Preços, estoques, condições de entrega, concessão de cupons e eventuais cancelamentos de pedidos decorrentes de erros sistêmicos ou esgotamento em lojas terceiras (como Amazon, Magalu, Eletroclub, KaBuM!, Shopee, etc.) são de responsabilidade exclusiva e autônoma das respectivas lojas varejistas onde as compras são concretizadas.
                </p>
              </div>
            </section>

            {/* Seção 3: Planos, Pagamentos e Garantia de 7 Dias */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/[0.08] pb-3">
                <span className="text-indigo-400">3.</span> Assinaturas, Pagamento e Garantia Incondicional
              </h2>
              <div className="space-y-3 text-xs text-slate-300">
                <p className="leading-relaxed">
                  <strong>Planos e Cobrança:</strong> O acesso aos recursos PRO ocorre mediante pagamento de assinatura periódica (mensal, semestral ou anual) ou aquisição de licença vitalícia, conforme ofertado no momento da contratação.
                </p>
                <p className="leading-relaxed">
                  <strong>Garantia Legal de 7 Dias (Art. 49 do CDC):</strong> Todo novo assinante tem direito à garantia de satisfação de 7 (sete) dias corridos a partir da data de compra. Se por qualquer motivo desejar o cancelamento durante esse prazo, o reembolso integral será processado sem qualquer burocracia ou taxa através do e-mail de suporte.
                </p>
                <p className="leading-relaxed">
                  <strong>Cancelamento de Assinatura:</strong> Você pode cancelar a renovação automática da sua assinatura a qualquer momento através do painel de usuário ou solicitando diretamente à nossa equipe de atendimento antes da data de renovação.
                </p>
              </div>
            </section>

            {/* Seção 4: Regras de Conduta */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/[0.08] pb-3">
                <span className="text-indigo-400">4.</span> Conduta do Usuário e Restrições de Uso
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Ao utilizar nossos serviços, você se compromete a:
              </p>
              <ul className="space-y-2 text-xs text-slate-400 list-disc list-inside">
                <li>Não realizar ataques de negação de serviço (DoS/DDoS) contra nossa infraestrutura ou contra os servidores das lojas parceiras.</li>
                <li>Não tentar burlar o mecanismo de autenticação ou quebrar a criptografia das chaves de licença.</li>
                <li>Não utilizar os alertas para envio massivo não solicitado (Spam) a usuários que não concordaram em receber notificações.</li>
              </ul>
            </section>

            {/* Seção 5: Legislação e Foro */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/[0.08] pb-3">
                <span className="text-indigo-400">5.</span> Legislação Aplicável e Foro de Eleição
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Estes Termos de Uso e a Política de Privacidade são regidos exclusivamente pelas leis vigentes na República Federativa do Brasil, em especial pelo Marco Civil da Internet (Lei nº 12.965/2014), Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018) e Código de Defesa do Consumidor (Lei nº 8.078/1990).
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Fica eleito o Foro da Comarca de São Paulo/SP, ou o foro do domicílio do consumidor quando exigido por lei consumerista, para dirimir eventuais controvérsias decorrentes deste contrato.
              </p>
            </section>
          </div>
        )}

        {/* Card de Contato e Dúvidas Final */}
        <div className="mt-14 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-violet-950/30 via-[#0c101d] to-indigo-950/30 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <h3 className="text-base font-bold text-white flex items-center justify-center sm:justify-start gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span>Dúvidas sobre Privacidade ou Suporte à Extensão?</span>
            </h3>
            <p className="text-xs text-slate-400 max-w-lg">
              Nosso Encarregado de Proteção de Dados (DPO) e equipe técnica estão à disposição para responder qualquer questão sobre privacidade e direitos do titular.
            </p>
          </div>
          <a
            href="mailto:guilherme.r.nascimentoml@gmail.com?subject=Contato%20Privacidade%20Deal%20Hunter%20Pro"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98] shrink-0"
          >
            <Mail className="w-4 h-4" />
            <span>Falar com o DPO</span>
          </a>
        </div>
      </main>

      {/* Footer Minimalista */}
      <footer className="border-t border-white/[0.08] bg-[#05070d] py-8 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/images/logo.png" alt="Deal Hunter Pro" className="w-5 h-5 object-contain" />
            <span>&copy; {new Date().getFullYear()} Deal Hunter Pro — dealhunterpro.com.br</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button onClick={() => changeTab('privacidade')} className="hover:text-slate-300 transition-colors">
              Política de Privacidade
            </button>
            <span>•</span>
            <button onClick={() => changeTab('chrome')} className="hover:text-slate-300 transition-colors">
              Chrome Web Store
            </button>
            <span>•</span>
            <button onClick={() => changeTab('termos')} className="hover:text-slate-300 transition-colors">
              Termos de Uso
            </button>
            <span>•</span>
            <Link href="/" className="hover:text-slate-300 transition-colors">
              Início
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
