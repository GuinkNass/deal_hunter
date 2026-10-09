'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Radar,
  Sparkles,
  TrendingUp,
  Settings,
  RefreshCw,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Send,
  Loader2,
  Layers,
  Calculator,
  Activity,
  PlusCircle,
  Eye,
  LogOut,
  User as UserIcon,
  Zap,
  Trash2,
  CheckSquare,
  Square,
  Star,
  BookOpen,
  LayoutGrid,
  Table as TableIcon,
} from 'lucide-react';
import AnalysisDetailModal, { DealAnalysis } from '@/components/ml-radar/AnalysisDetailModal';
import ManualSearchModal from '@/components/ml-radar/ManualSearchModal';
import MarginCalculatorView from '@/components/ml-radar/MarginCalculatorView';
import RobustSettingsView from '@/components/ml-radar/RobustSettingsView';
import StatusView from '@/components/ml-radar/StatusView';
import DealProductCard from '@/components/ml-radar/DealProductCard';
import ShowcaseHistoryView from '@/components/ml-radar/ShowcaseHistoryView';
import { getProductFallbackImage } from '@/lib/ml-radar/imageFallback';
import LanguageCurrencySelector from '@/components/LanguageCurrencySelector';
import { useLanguageCurrency } from '@/contexts/LanguageCurrencyContext';
import { isUserAdmin } from '@/lib/auth/admin';

export default function DashboardPage() {
  const router = useRouter();
  const { t, formatMoney, currency, lang } = useLanguageCurrency();
  const [supabase] = useState(() => createClient());

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncingShowcase, setSyncingShowcase] = useState(false);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Active view tab: 'radar' | 'showcase' | 'manual' | 'calculator' | 'settings' | 'status'
  const [activeTab, setActiveTab] = useState<'radar' | 'showcase' | 'manual' | 'calculator' | 'settings' | 'status'>('radar');

  // Deals state
  const [deals, setDeals] = useState<DealAnalysis[]>([]);
  const [visibleCount, setVisibleCount] = useState(24);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStore, setFilterStore] = useState('ALL');
  const [filterVerdict, setFilterVerdict] = useState('ALL');
  const [selectedDealIds, setSelectedDealIds] = useState<string[]>([]);

  // Modals & Interactivity
  const [selectedDealForDetail, setSelectedDealForDetail] = useState<DealAnalysis | null>(null);
  const [calculatorPrefill, setCalculatorPrefill] = useState<any>(null);
  const [manualModalOpen, setManualModalOpen] = useState(false);

  // Simulation & notification
  const [simulating, setSimulating] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Reseta a paginação ao alterar buscas ou filtros
  useEffect(() => {
    setVisibleCount(24);
  }, [searchTerm, filterStore, filterVerdict]);

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const searchLow = searchTerm.toLowerCase();
      const matchesSearch =
        (deal.title && deal.title.toLowerCase().includes(searchLow)) ||
        (deal.ml_title && deal.ml_title.toLowerCase().includes(searchLow)) ||
        (deal.store && deal.store.toLowerCase().includes(searchLow));

      const matchesStore =
        filterStore === 'ALL' ||
        (deal.store && deal.store.toLowerCase() === filterStore.toLowerCase());
      const matchesVerdict =
        filterVerdict === 'ALL'
          ? true
          : filterVerdict === 'FEATURED'
          ? Boolean(deal.is_featured)
          : deal.verdict === filterVerdict;

      return matchesSearch && matchesStore && matchesVerdict;
    });
  }, [deals, searchTerm, filterStore, filterVerdict]);

  const viableCount = useMemo(() => deals.filter((d) => d.verdict === 'Viável').length, [deals]);
  const avgRoi = useMemo(
    () =>
      deals.length > 0
        ? (deals.reduce((acc, d) => acc + (d.roi_percent || 0), 0) / deals.length).toFixed(1)
        : '0',
    [deals]
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'calculator' || tab === 'manual' || tab === 'settings' || tab === 'status' || tab === 'radar') {
        setActiveTab(tab as any);
      }
      if (params.get('ml_connected') === 'true') {
        setNotification('✅ Mercado Livre conectado com sucesso! Token oficial ativo para busca de concorrentes líderes.');
      } else if (params.get('ml_error')) {
        setNotification(`⚠️ Erro ao conectar Mercado Livre: ${params.get('ml_error')}`);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
        return;
      }
      setSessionUser(session.user);
      setAuthToken(session.access_token);
      
      const adminDetected = isUserAdmin(session.user);
      setIsAdmin(adminDetected);

      if (session.user?.id) {
        supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle()
          .then(({ data: profile }) => {
            if (profile?.role === 'admin' || adminDetected) {
              setIsAdmin(true);
            }
          });
      }

      loadDeals(session.access_token);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/login');
      } else {
        setSessionUser(session.user);
        setAuthToken(session.access_token);
        const adminDetected = isUserAdmin(session.user);
        setIsAdmin(adminDetected);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  // Se o usuário não for administrador e tentar acessar a vitrine, redireciona para o radar
  useEffect(() => {
    if (!isAdmin && activeTab === 'showcase') {
      setActiveTab('radar');
    }
  }, [isAdmin, activeTab]);

  // Polling inteligente e leve: apenas na aba radar e quando a aba estiver visível
  useEffect(() => {
    if (!authToken || activeTab !== 'radar') return;
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      loadDeals(authToken, false);
    }, 45000);
    return () => clearInterval(interval);
  }, [authToken, activeTab]);

  async function loadDeals(token: string, showIndicator = true) {
    try {
      if (showIndicator) setRefreshing(true);
      
      // 1. Busca ofertas da varredura/radar
      const res = await fetch('/api/ml-radar/deals', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      let items: DealAnalysis[] = res.ok && Array.isArray(data.data) ? data.data : [];

      // 2. Busca ofertas ativas da vitrine oficial (/api/showcase/deals) para assegurar que NUNCA sumam do painel
      try {
        const showcaseRes = await fetch(`/api/showcase/deals?t=${Date.now()}`, { cache: 'no-store' });
        const showcaseJson = await showcaseRes.json();
        if (showcaseJson.success && Array.isArray(showcaseJson.data) && showcaseJson.data.length > 0) {
          const showcaseItems: DealAnalysis[] = showcaseJson.data.map((s: any) => ({
            id: s.id,
            title: s.title,
            price: Number(s.price) || 0,
            original_price: s.original_price ? Number(s.original_price) : null,
            discount_percent: s.discount_percent || null,
            image_url: s.image_url || null,
            product_url: s.product_url,
            store: s.store || 'Amazon Brasil',
            category: s.category || 'Geral',
            description: s.description || 'Oferta selecionada pela curadoria Deal Hunter Pro.',
            is_featured: true,
            verdict: 'Viável',
            status: 'completed',
            created_at: s.created_at || new Date().toISOString(),
          }));

          const seenUrls = new Set<string>();
          const seenIds = new Set<string>();
          const merged: DealAnalysis[] = [];

          // Adiciona os itens da vitrine com prioridade máxima e is_featured = true
          for (const s of showcaseItems) {
            if (s.product_url) seenUrls.add(s.product_url);
            if (s.id) seenIds.add(s.id);
            merged.push(s);
          }

          // Adiciona os itens do radar que não colidem com os da vitrine
          for (const item of items) {
            const hasUrl = item.product_url && seenUrls.has(item.product_url);
            const hasId = item.id && seenIds.has(item.id);
            if (!hasUrl && !hasId) {
              merged.push(item);
            }
          }
          items = merged;
        }
      } catch (showcaseErr) {
        console.warn('Aviso ao carregar produtos da vitrine:', showcaseErr);
      }

      if (typeof window !== 'undefined') {
        try {
          const dismissed: string[] = JSON.parse(
            localStorage.getItem('dealhunter_dismissed_deals') || '[]'
          );
          if (dismissed.length > 0) {
            const dismissedSet = new Set(dismissed);
            items = items.filter(
              (d) => !dismissedSet.has(d.id || '') && !dismissedSet.has(d.product_url || '')
            );
          }
        } catch {}

        // Recupera produtos destacados na vitrine salvos localmente
        try {
          const featuredList: string[] = JSON.parse(
            localStorage.getItem('dealhunter_featured_deals') || '[]'
          );
          if (featuredList.length > 0) {
            const featuredSet = new Set(featuredList);
            items = items.map((d) => ({
              ...d,
              is_featured: Boolean(
                d.is_featured ||
                featuredSet.has(d.id || '') ||
                featuredSet.has(d.product_url || '')
              ),
            }));
          }
        } catch {}
      }
      setDeals(items);
    } catch (err: any) {
      console.error('Erro ao carregar ofertas:', err);
    } finally {
      setLoading(false);
      if (showIndicator) setRefreshing(false);
    }
  }

  function recordDismissed(ids: string[], urls: string[] = []) {
    if (typeof window === 'undefined') return;
    try {
      const dismissed: string[] = JSON.parse(
        localStorage.getItem('dealhunter_dismissed_deals') || '[]'
      );
      for (const id of ids) {
        if (id && !dismissed.includes(id)) dismissed.push(id);
      }
      for (const u of urls) {
        if (u && !dismissed.includes(u)) dismissed.push(u);
      }
      localStorage.setItem('dealhunter_dismissed_deals', JSON.stringify(dismissed));
    } catch {}
  }

  async function handleDeleteSingleDeal(deal: DealAnalysis, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    const dealId = deal.id;
    if (!dealId) return;

    setDeals((prev) => prev.filter((d) => d.id !== dealId));
    setSelectedDealIds((prev) => prev.filter((id) => id !== dealId));
    recordDismissed([dealId], deal.product_url ? [deal.product_url] : []);

    if (authToken) {
      fetch('/api/ml-radar/deals', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ id: dealId }),
      }).catch(() => {});
    }

    setNotification('🗑️ Anúncio excluído do Radar!');
    setTimeout(() => setNotification(null), 3000);
  }

  async function handleDeleteSelectedDeals() {
    if (selectedDealIds.length === 0) return;
    const count = selectedDealIds.length;
    const idsToDelete = [...selectedDealIds];
    const urlsToDelete = deals
      .filter((d) => d.id && idsToDelete.includes(d.id))
      .map((d) => d.product_url)
      .filter(Boolean) as string[];

    setDeals((prev) => prev.filter((d) => !d.id || !idsToDelete.includes(d.id)));
    setSelectedDealIds([]);
    recordDismissed(idsToDelete, urlsToDelete);

    if (authToken) {
      fetch('/api/ml-radar/deals', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ ids: idsToDelete }),
      }).catch(() => {});
    }

    setNotification(`🗑️ ${count} anúncio(s) selecionado(s) excluído(s)!`);
    setTimeout(() => setNotification(null), 3500);
  }

  async function handleDeleteFilteredDeals() {
    if (filteredDeals.length === 0) return;
    const isFiltered = filterStore !== 'ALL' || filterVerdict !== 'ALL' || searchTerm.trim().length > 0;
    const confirmMessage = isFiltered
      ? `Confirma a exclusão de todos os ${filteredDeals.length} anúncios filtrados no radar?`
      : `Confirma a limpeza de todos os ${deals.length} anúncios do radar?`;

    if (!window.confirm(confirmMessage)) return;

    const idsToDelete = filteredDeals.map((d) => d.id).filter(Boolean) as string[];
    const urlsToDelete = filteredDeals.map((d) => d.product_url).filter(Boolean) as string[];

    setDeals((prev) => prev.filter((d) => !d.id || !idsToDelete.includes(d.id)));
    setSelectedDealIds((prev) => prev.filter((id) => !idsToDelete.includes(id)));
    recordDismissed(idsToDelete, urlsToDelete);

    if (authToken) {
      fetch('/api/ml-radar/deals', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ ids: idsToDelete, deleteAll: !isFiltered }),
      }).catch(() => {});
    }

    setNotification(`🗑️ Limpeza em escala concluída: ${idsToDelete.length} anúncio(s) removido(s)!`);
    setTimeout(() => setNotification(null), 3500);
  }

  const handleToggleSelectDeal = useCallback((dealId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!dealId) return;
    setSelectedDealIds((prev) =>
      prev.includes(dealId) ? prev.filter((id) => id !== dealId) : [...prev, dealId]
    );
  }, []);

  const handleToggleSelectAllFiltered = useCallback(() => {
    const allFilteredSelected =
      filteredDeals.length > 0 &&
      filteredDeals.every((d) => d.id && selectedDealIds.includes(d.id));

    if (allFilteredSelected) {
      const filteredIds = new Set(filteredDeals.map((d) => d.id).filter(Boolean) as string[]);
      setSelectedDealIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      const validFilteredIds = filteredDeals.map((d) => d.id).filter(Boolean) as string[];
      const combined = Array.from(new Set([...selectedDealIds, ...validFilteredIds]));
      setSelectedDealIds(combined);
    }
  }, [filteredDeals, selectedDealIds]);

  const handleUpdateDeal = useCallback((updated: DealAnalysis) => {
    setDeals((prev) => {
      const exists = prev.some((d) => d.id === updated.id);
      if (exists) {
        return prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d));
      } else {
        return [updated, ...prev];
      }
    });
    setSelectedDealForDetail(updated);

    // Se o item estiver marcado como destaque, garante gravação no localStorage
    if (updated.is_featured && typeof window !== 'undefined') {
      try {
        const featuredList: string[] = JSON.parse(
          localStorage.getItem('dealhunter_featured_deals') || '[]'
        );
        const keysToAdd = [updated.id || '', updated.product_url || ''].filter(Boolean);
        const nextList = Array.from(new Set([...featuredList, ...keysToAdd]));
        localStorage.setItem('dealhunter_featured_deals', JSON.stringify(nextList));
      } catch {}
    }
  }, []);

  const handleToggleFeatured = useCallback(
    async (deal: DealAnalysis, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      const nextFeatured = !deal.is_featured;

      // 1. Atualização otimista imediata na UI
      setDeals((prev) =>
        prev.map((d) =>
          d.id === deal.id || (d.product_url && d.product_url === deal.product_url)
            ? { ...d, is_featured: nextFeatured }
            : d
        )
      );
      if (
        selectedDealForDetail &&
        (selectedDealForDetail.id === deal.id ||
          selectedDealForDetail.product_url === deal.product_url)
      ) {
        setSelectedDealForDetail((prev) => (prev ? { ...prev, is_featured: nextFeatured } : null));
      }

      // 2. Persistência local imediata e imune a flicker (nunca apaga sozinha)
      if (typeof window !== 'undefined') {
        try {
          const featuredList: string[] = JSON.parse(
            localStorage.getItem('dealhunter_featured_deals') || '[]'
          );
          let updatedList: string[];
          if (nextFeatured) {
            updatedList = Array.from(
              new Set([...featuredList, deal.id || '', deal.product_url || ''])
            ).filter(Boolean);
          } else {
            const removeSet = new Set([deal.id, deal.product_url].filter(Boolean));
            updatedList = featuredList.filter((x) => !removeSet.has(x));
          }
          localStorage.setItem('dealhunter_featured_deals', JSON.stringify(updatedList));
        } catch {}
      }

      setNotification(
        nextFeatured
          ? `⭐ "${(deal.title || '').slice(0, 32)}..." adicionado à Vitrine Pública!`
          : `☆ Removido da Vitrine Pública.`
      );
      setTimeout(() => setNotification(null), 3000);

      // 3. Sincronização segura com o servidor
      try {
        const res = await fetch('/api/ml-radar/deals/featured', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({
            dealId: deal.id,
            isFeatured: nextFeatured,
            userId: sessionUser?.id,
            dealData: deal,
            dealPayload: deal,
          }),
        });

        const resData = await res.json();
        // Se o backend persistiu um item virtual/Render e retornou o novo UUID do banco
        if (resData?.success && resData.dealId && resData.dealId !== deal.id) {
          setDeals((prev) =>
            prev.map((d) =>
              d.id === deal.id || (d.product_url && d.product_url === deal.product_url)
                ? { ...d, id: resData.dealId, is_featured: nextFeatured }
                : d
            )
          );
          if (
            selectedDealForDetail &&
            (selectedDealForDetail.id === deal.id ||
              selectedDealForDetail.product_url === deal.product_url)
          ) {
            setSelectedDealForDetail((prev) =>
              prev ? { ...prev, id: resData.dealId, is_featured: nextFeatured } : null
            );
          }
        }
      } catch (err: any) {
        console.warn('Aviso de rede na sincronização com a vitrine:', err);
      }
    },
    [authToken, sessionUser, selectedDealForDetail]
  );

  const handleBatchFeatured = useCallback(
    async (targetFeatured: boolean) => {
      if (selectedDealIds.length === 0) return;
      const count = selectedDealIds.length;
      const selectedList = deals.filter((d) => d.id && selectedDealIds.includes(d.id));

      // 1. Atualização otimista
      setDeals((prev) =>
        prev.map((d) => (d.id && selectedDealIds.includes(d.id) ? { ...d, is_featured: targetFeatured } : d))
      );

      // 2. Persistência local no localStorage
      if (typeof window !== 'undefined') {
        try {
          const featuredList: string[] = JSON.parse(
            localStorage.getItem('dealhunter_featured_deals') || '[]'
          );
          let updatedList: string[];
          if (targetFeatured) {
            const newKeys = selectedList.flatMap((d) => [d.id || '', d.product_url || '']).filter(Boolean);
            updatedList = Array.from(new Set([...featuredList, ...newKeys]));
          } else {
            const removeKeys = new Set(selectedList.flatMap((d) => [d.id, d.product_url]).filter(Boolean));
            updatedList = featuredList.filter((k) => !removeKeys.has(k));
          }
          localStorage.setItem('dealhunter_featured_deals', JSON.stringify(updatedList));
        } catch {}
      }

      setNotification(
        targetFeatured
          ? `⭐ ${count} oferta(s) incluída(s) na Vitrine Pública!`
          : `☆ Destaque da Vitrine Pública removido de ${count} oferta(s).`
      );
      setTimeout(() => setNotification(null), 3000);

      try {
        await fetch('/api/ml-radar/deals/featured', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({
            dealIds: selectedDealIds,
            isFeatured: targetFeatured,
            userId: sessionUser?.id,
          }),
        });

        // Também sincroniza os virtuais/Render que precisam ser persistidos
        for (const d of selectedList) {
          if (!d.id || d.id.startsWith('render-') || !d.id.includes('-')) {
            fetch('/api/ml-radar/deals/featured', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
              },
              body: JSON.stringify({
                dealId: d.id,
                isFeatured: targetFeatured,
                userId: sessionUser?.id,
                dealData: d,
              }),
            }).catch(() => {});
          }
        }
      } catch (err: any) {
        console.warn('Erro ao atualizar em lote na vitrine:', err);
      }
    },
    [selectedDealIds, deals, authToken, sessionUser]
  );

  const featuredDealsCount = useMemo(
    () => deals.filter((d) => Boolean(d.is_featured)).length,
    [deals]
  );

  const handleSyncShowcase = useCallback(async () => {
    setSyncingShowcase(true);
    try {
      const activeFeatured = deals.filter((d) => Boolean(d.is_featured));

      if (activeFeatured.length === 0) {
        setNotification('⚠️ Nenhuma oferta com estrela acesa no momento. Marque ao menos um produto no Radar ou no Histórico da Vitrine!');
        setTimeout(() => setNotification(null), 4000);
        return;
      }

      const res = await fetch('/api/showcase/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          deals: activeFeatured,
          userId: sessionUser?.id,
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        setNotification(`⭐ Vitrine atualizada com sucesso! ${activeFeatured.length} produto(s) sincronizados com a vitrine externa (/ofertas).`);
        if (Array.isArray(resData.data) && typeof window !== 'undefined') {
          try {
            const featuredKeys = resData.data.flatMap((d: any) => [d.id, d.product_url]).filter(Boolean);
            localStorage.setItem('dealhunter_featured_deals', JSON.stringify(featuredKeys));
          } catch {}
        }
      } else {
        setNotification(`⚠️ ${resData.error || 'Erro ao sincronizar vitrine externa.'}`);
      }
    } catch (err: any) {
      console.error('Erro ao sincronizar vitrine:', err);
      setNotification('❌ Erro de rede ao sincronizar vitrine externa.');
    } finally {
      setSyncingShowcase(false);
      setTimeout(() => setNotification(null), 4000);
    }
  }, [deals, authToken, sessionUser]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  // Quick Ingest simulation
  async function handleSimulateIngest() {
    if (!sessionUser) return;
    setSimulating(true);
    setNotification(null);

    const sampleDeals = [
      {
        title: 'Echo Dot 5ª Geração Smart Speaker com Alexa Cor Preta',
        price: 249.9,
        originalPrice: 429.0,
        imageUrl: 'https://m.media-amazon.com/images/I/71C8zGss8pL._AC_SL1000_.jpg',
        productUrl: 'https://www.amazon.com.br/dp/B09B8V1LZ3?tag=dealhunterp07-20',
        store: 'Amazon',
        userId: sessionUser.id,
      },
      {
        title: 'SSD Kingston A400 480GB SATA 3 Leitura 500MBs',
        price: 139.9,
        originalPrice: 219.9,
        imageUrl: 'https://m.media-amazon.com/images/I/51r26zY3nEL._AC_SL1000_.jpg',
        productUrl: 'https://www.amazon.com.br/dp/B079XC5PVV?tag=dealhunterp07-20',
        store: 'Amazon',
        userId: sessionUser.id,
      },
      {
        title: 'Fritadeira Elétrica Air Fryer Mondial Grand Family 5L Inox',
        price: 269.9,
        originalPrice: 449.9,
        imageUrl: 'https://m.media-amazon.com/images/I/61K-KzP6b2L._AC_SL1000_.jpg',
        productUrl: 'https://www.amazon.com.br/dp/B08HRYF9R8?tag=dealhunterp07-20',
        store: 'Amazon',
        userId: sessionUser.id,
      },
    ];

    const pick = sampleDeals[Math.floor(Math.random() * sampleDeals.length)];

    try {
      const res = await fetch('/api/ml-radar/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pick),
      });

      const data = await res.json();
      if (res.ok) {
        setNotification('✅ Nova oportunidade processada e adicionada ao Radar ML!');
        if (authToken) loadDeals(authToken);
      } else {
        setNotification(`Erro na ingestão: ${data.error}`);
      }
    } catch (err: any) {
      setNotification(`Falha: ${err.message}`);
    } finally {
      setSimulating(false);
      setTimeout(() => setNotification(null), 5000);
    }
  }

  function handleOpenCalculatorForDeal(deal: DealAnalysis) {
    setCalculatorPrefill(deal);
    setSelectedDealForDetail(null);
    setActiveTab('calculator');
  }

  function handleManualSearchSuccess(newDeal: any) {
    setNotification('✅ Análise manual concluída e salva no seu histórico do Radar ML!');
    if (newDeal) {
      setDeals((prev) => [newDeal, ...prev.filter((d) => d.id !== newDeal.id)]);
      setSelectedDealForDetail(newDeal);
    }
    setActiveTab('radar');
    if (authToken) loadDeals(authToken);
    setTimeout(() => setNotification(null), 5000);
  }

  const displayName =
    sessionUser?.user_metadata?.full_name ||
    sessionUser?.user_metadata?.name ||
    sessionUser?.email?.split('@')[0] ||
    sessionUser?.email;

  const avatarUrl =
    sessionUser?.user_metadata?.avatar_url || sessionUser?.user_metadata?.picture;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a12] text-white flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
        <p className="text-sm text-gray-400 font-medium">Carregando Dashboard Deal Hunter Pro...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070a12] text-[#f1f5f9] selection:bg-cyan-500/30 font-sans antialiased">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#080b14]/80 border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Marca Deal Hunter Pro */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-all flex items-center justify-center bg-[#0e1322] p-1 border border-indigo-500/30">
              <img
                src="/images/logo.png"
                alt="Deal Hunter Pro Logo"
                width={40}
                height={40}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg sm:text-xl tracking-tight text-white group-hover:text-cyan-300 transition-colors uppercase">
                Deal Hunter
              </span>
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white rounded-full shadow-sm border border-cyan-400/30">
                Dashboard
              </span>
            </div>
          </Link>

          {/* User actions em escrita limpa e profissional (sem botões arredondados comprimidos) */}
          <div className="flex items-center gap-4 sm:gap-6 text-xs">
            {/* Seletor Global de Idioma e Moeda em Texto Limpo */}
            <LanguageCurrencySelector />

            <span className="w-px h-4 bg-white/10 hidden sm:inline" />

            {/* Nova Análise Manual (Apenas Escrita Clicável) */}
            <button
              onClick={() => setManualModalOpen(true)}
              className="text-xs font-bold uppercase tracking-wider text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer flex items-center gap-1"
              title="Pesquisar concorrentes líderes para qualquer produto avulso"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{t('dash.new_analysis')}</span>
            </button>

            {/* Sincronizar Vitrine (EXCLUSIVO PARA ADMIN) */}
            {isAdmin && (
              <button
                type="button"
                onClick={handleSyncShowcase}
                disabled={syncingShowcase}
                className="text-xs font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                title="Sincronizar ofertas marcadas com estrela com a vitrine pública externa"
              >
                <Star className={`w-3.5 h-3.5 text-amber-400 ${syncingShowcase ? 'animate-spin' : ''}`} />
                <span>{syncingShowcase ? '...' : t('dash.update_showcase')}</span>
                {featuredDealsCount > 0 && (
                  <span className="text-[10px] text-amber-300/80 font-normal">
                    ({featuredDealsCount})
                  </span>
                )}
              </button>
            )}

            {/* Ver Vitrine Pública (EXCLUSIVO PARA ADMIN) */}
            {isAdmin && (
              <Link
                href="/ofertas"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium uppercase tracking-wider text-slate-300 hover:text-white transition-colors hidden sm:flex items-center gap-1"
                title="Abrir a Vitrine Pública de Ofertas (/ofertas) em nova aba"
              >
                <span>{t('dash.view_showcase')}</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </Link>
            )}

            {/* Botão de Atualizar Lista (Ícone / Texto Sutil) */}
            <button
              onClick={() => authToken && loadDeals(authToken, true)}
              disabled={refreshing}
              className="text-xs font-medium text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer flex items-center gap-1"
              title="Atualizar lista de oportunidades agora"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
              <span className="hidden lg:inline">{t('dash.refresh')}</span>
            </button>

            <span className="w-px h-4 bg-white/10" />

            {/* Profile & Sair (Apenas Escrita Limpa) */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-300 max-w-[110px] truncate hidden md:inline" title={sessionUser?.email}>
                {displayName}
              </span>

              <button
                onClick={handleSignOut}
                className="text-xs font-medium text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                title="Encerrar sessão"
              >
                {t('nav.logout')}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation Strip Padronizada */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/80">
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2.5 no-scrollbar">
            <button
              onClick={() => setActiveTab('radar')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === 'radar'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Radar className="w-4 h-4" />
              <span>{t('dash.tab_radar')}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-cyan-400/20 text-[10px] text-cyan-300">
                {deals.length}
              </span>
            </button>

            {/* Vitrine Oficial (EXCLUSIVO PARA ADMIN) */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('showcase')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeTab === 'showcase'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>Vitrine</span>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400/20 text-[10px] text-amber-300 font-bold">
                  {featuredDealsCount}
                </span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('manual')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === 'manual'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>{t('dash.tab_manual')}</span>
            </button>

            <button
              onClick={() => setActiveTab('calculator')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === 'calculator'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>{t('dash.tab_calculator')}</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>{t('dash.tab_settings')}</span>
            </button>

            <button
              onClick={() => setActiveTab('status')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === 'status'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>{t('dash.tab_status')}</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {notification && (
          <div className="p-4 bg-emerald-950/70 border border-emerald-500/40 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs font-medium animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: RADAR DE OFERTAS                                                   */}
        {/* ========================================================================= */}
        {activeTab === 'radar' && (
          <div className="space-y-8">
            {/* KPI Cards (Linear / Stripe Executive Dark Style) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-zinc-950/70 backdrop-blur-md border border-zinc-800/80 space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                  <span>Total de Ofertas no Radar</span>
                  <span className="text-[10px] uppercase font-semibold text-zinc-500 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                    Cap. 100 itens
                  </span>
                </div>
                <div className="text-3xl font-bold text-white tracking-tight">
                  {deals.length}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-950/70 backdrop-blur-md border border-zinc-800/80 space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                  <span>Oportunidades Viáveis</span>
                  <span className="text-xs text-emerald-400 font-semibold">
                    {deals.length > 0 ? Math.round((viableCount / deals.length) * 100) : 0}% taxa
                  </span>
                </div>
                <div className="text-3xl font-bold text-white tracking-tight">
                  {viableCount}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-950/70 backdrop-blur-md border border-zinc-800/80 space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                  <span>ROI Médio Estimado</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-bold text-white tracking-tight">
                  {avgRoi}%
                </div>
              </div>
            </div>

            {/* Filtros, Busca e Alternância de Visualização */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por produto, marca, loja ou palavra-chave..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
                />
              </div>

              <select
                value={filterStore}
                onChange={(e) => setFilterStore(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600 font-medium"
              >
                <option value="ALL">Todas as Lojas</option>
                <option value="Amazon">Amazon</option>
                <option value="KaBuM!">KaBuM!</option>
                <option value="Magalu">Magalu</option>
                <option value="Shopee">Shopee</option>
                <option value="Shein">Shein</option>
                <option value="Pichau">Pichau</option>
                <option value="Eletroclub">Eletroclub</option>
              </select>

              <select
                value={filterVerdict}
                onChange={(e) => setFilterVerdict(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600 font-semibold"
              >
                <option value="ALL">Todos os Vereditos</option>
                {isAdmin && <option value="FEATURED">⭐ Na Vitrine Pública</option>}
                <option value="Viável">Viável</option>
                <option value="Atenção">Atenção</option>
                <option value="Evitar">Evitar</option>
              </select>

              {/* Controle Sênior de Visualização (Grid vs Table) */}
              <div className="flex items-center bg-zinc-900 border border-zinc-800 p-1 rounded-xl flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    viewMode === 'grid'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Visualização em Grade de Cards"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden md:inline">Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    viewMode === 'table'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Visualização em Tabela Compacta (Data Table)"
                >
                  <TableIcon className="w-4 h-4" />
                  <span className="hidden md:inline">Tabela</span>
                </button>
              </div>

              {filteredDeals.length > 0 && (
                <button
                  onClick={handleDeleteFilteredDeals}
                  className="px-3.5 py-2.5 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  title="Excluir todos os anúncios correspondentes ao filtro atual"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden lg:inline">Limpar ({filteredDeals.length})</span>
                </button>
              )}

              <button
                onClick={() => setManualModalOpen(true)}
                className="sm:hidden w-full py-2.5 rounded-xl bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" /> Nova Análise Manual
              </button>
            </div>

            {/* Barra de Seleção e Ações em Lote */}
            {filteredDeals.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0f1422] border border-gray-800/80 text-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleToggleSelectAllFiltered}
                    className="flex items-center gap-2 text-gray-300 hover:text-white font-semibold transition-colors"
                  >
                    {filteredDeals.length > 0 && filteredDeals.every((d) => d.id && selectedDealIds.includes(d.id)) ? (
                      <CheckSquare className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-500" />
                    )}
                    <span>Selecionar Todos ({filteredDeals.length})</span>
                  </button>

                  {selectedDealIds.length > 0 && (
                    <span className="text-cyan-400 font-extrabold px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/40 text-[11px]">
                      {selectedDealIds.length} marcado(s)
                    </span>
                  )}
                </div>

                {selectedDealIds.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleBatchFeatured(true)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                          title="Destacar os produtos selecionados na Vitrine Pública"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>Destacar na Vitrine ({selectedDealIds.length})</span>
                        </button>

                        <button
                          onClick={() => handleBatchFeatured(false)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all"
                          title="Remover os produtos selecionados da Vitrine Pública"
                        >
                          <Star className="w-3.5 h-3.5 text-slate-400" />
                          <span>Remover da Vitrine</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={handleDeleteSelectedDeals}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-rose-950/50 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir</span>
                    </button>

                    <button
                      onClick={() => setSelectedDealIds([])}
                      className="px-3 py-1.5 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 font-semibold text-xs transition-colors"
                    >
                      Desmarcar
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] text-gray-500 hidden md:inline">
                    Marque cards para ações em lote (vitrine ou exclusão) ou use os botões individuais em cada anúncio
                  </span>
                )}
              </div>
            )}

            {/* Grid de Ofertas */}
            {filteredDeals.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-gray-800 rounded-3xl p-8 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto text-gray-500">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="text-base font-bold text-white">Nenhuma oferta registrada ainda</h3>
                  <p className="text-xs text-gray-400">
                    O Radar ML recebe produtos automaticamente quando promoções atingem seus filtros de ROI,
                    ou você pode realizar uma busca manual clicando em <strong>Nova Análise</strong>.
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-3">
                    <button
                      onClick={() => setManualModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all"
                    >
                      Nova Análise Manual
                    </button>
                    <button
                      onClick={handleSimulateIngest}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
                    >
                      Testar Ingestão de Exemplo
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                    {filteredDeals.slice(0, visibleCount).map((deal) => (
                      <DealProductCard
                        key={deal.id || `deal-${deal.product_url}`}
                        deal={deal}
                        isSelected={Boolean(deal.id && selectedDealIds.includes(deal.id))}
                        isAdmin={isAdmin}
                        onToggleSelect={handleToggleSelectDeal}
                        onDelete={handleDeleteSingleDeal}
                        onEvaluate={setSelectedDealForDetail}
                        onOpenCalculator={handleOpenCalculatorForDeal}
                        onToggleFeatured={isAdmin ? handleToggleFeatured : undefined}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-zinc-800/80 bg-zinc-950 shadow-sm">
                    <table className="w-full text-left text-xs text-zinc-300 divide-y divide-zinc-800/80">
                      <thead className="bg-zinc-900/80 text-[11px] uppercase font-semibold text-zinc-400 tracking-wider">
                        <tr>
                          <th className="py-3 px-3.5 w-10">
                            <span className="sr-only">Seleção</span>
                          </th>
                          <th className="py-3 px-3">Produto</th>
                          <th className="py-3 px-3">Loja</th>
                          <th className="py-3 px-3">Preço Compra</th>
                          <th className="py-3 px-3">Líder ML</th>
                          <th className="py-3 px-3">Lucro Líquido</th>
                          <th className="py-3 px-3">ROI</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 font-medium">
                        {filteredDeals.slice(0, visibleCount).map((deal) => {
                          const itemTitle = deal.title || deal.source_title || 'Produto sem título';
                          const itemPrice = Number(deal.price || deal.source_price || 0);
                          const isSelected = Boolean(deal.id && selectedDealIds.includes(deal.id));
                          const isViable = deal.verdict === 'Viável';
                          const isAttention = deal.verdict === 'Atenção';
                          const isAvoid = deal.verdict === 'Evitar';
                          const isEvaluated = Boolean(deal.clinical_evaluated || deal.ml_url);

                          return (
                            <tr
                              key={deal.id || `deal-${deal.product_url}`}
                              onClick={() => setSelectedDealForDetail(deal)}
                              className={`hover:bg-zinc-900/60 transition-colors cursor-pointer ${
                                isSelected ? 'bg-zinc-900/80' : ''
                              }`}
                            >
                              <td className="py-3 px-3.5" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleSelectDeal(deal.id || '', e)}
                                  className="p-0.5 text-zinc-500 hover:text-zinc-200 transition-colors"
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <Square className="w-4 h-4 text-zinc-600 hover:text-zinc-400" />
                                  )}
                                </button>
                              </td>
                              <td className="py-3 px-3 max-w-[280px]">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-white p-1 flex-shrink-0 border border-zinc-700/50 overflow-hidden flex items-center justify-center">
                                    <img
                                      src={deal.image_url || deal.source_image_url || getProductFallbackImage(itemTitle, deal.store)}
                                      alt=""
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-zinc-100 truncate text-xs" title={itemTitle}>
                                      {itemTitle}
                                    </p>
                                    <span className="text-[10px] text-zinc-500 truncate block">
                                      {deal.category || 'Monitorado'}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] uppercase font-bold text-zinc-300">
                                  {deal.store || 'Origem'}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-semibold text-zinc-100 whitespace-nowrap">
                                {formatMoney(itemPrice)}
                              </td>
                              <td className="py-3 px-3 font-semibold whitespace-nowrap">
                                {deal.ml_price ? (
                                  <span className="text-zinc-200">{formatMoney(Number(deal.ml_price))}</span>
                                ) : (
                                  <span className="text-zinc-500 text-[11px]">—</span>
                                )}
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                {deal.net_profit ? (
                                  <span className="font-bold text-emerald-400">
                                    {formatMoney(Number(deal.net_profit))}
                                  </span>
                                ) : (
                                  <span className="text-zinc-500 text-[11px]">—</span>
                                )}
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                {deal.roi_percent ? (
                                  <span className="font-bold text-zinc-200">
                                    {Number(deal.roi_percent).toFixed(1)}%
                                  </span>
                                ) : (
                                  <span className="text-zinc-500 text-[11px]">—</span>
                                )}
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${
                                    isViable
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                      : isAttention
                                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                      : isAvoid
                                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                      : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                                  }`}
                                >
                                  {deal.verdict || (isEvaluated ? 'Avaliado' : 'Radar')}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedDealForDetail(deal)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    isEvaluated
                                      ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800'
                                      : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 font-bold'
                                  }`}
                                >
                                  {isEvaluated ? 'Análise' : 'Avaliar'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {filteredDeals.length > visibleCount && (
                  <div className="pt-6 pb-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={() => setVisibleCount((prev) => prev + 24)}
                      className="px-6 py-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all shadow-sm"
                    >
                      Carregar Mais Ofertas (+24)
                    </button>
                    <button
                      onClick={() => setVisibleCount(filteredDeals.length)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all"
                    >
                      Exibir Todas ({filteredDeals.length})
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: HISTÓRICO DA VITRINE (EXCLUSIVO PARA ADMIN)                          */}
        {/* ========================================================================= */}
        {activeTab === 'showcase' && isAdmin && (
          <ShowcaseHistoryView
            deals={deals}
            onToggleFeatured={handleToggleFeatured}
            onUpdateDeal={handleUpdateDeal}
            onSyncShowcase={handleSyncShowcase}
            isSyncing={syncingShowcase}
          />
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ANÁLISE MANUAL                                                     */}
        {/* ========================================================================= */}
        {activeTab === 'manual' && (
          <div className="max-w-2xl mx-auto py-4">
            <div className="p-6 bg-[#111726] border border-gray-800 rounded-3xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight">
                    Análise Manual de Oportunidades
                  </h2>
                  <p className="text-xs text-gray-400">
                    Cole uma URL de produto ou insira nome e custo para rodar o pipeline completo
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setManualModalOpen(true)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-cyan-600/25 transition-all flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>Abrir Painel de Análise Manual</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CALCULADORA DE MARGEM & ROI                                        */}
        {/* ========================================================================= */}
        {activeTab === 'calculator' && (
          <MarginCalculatorView
            initialData={calculatorPrefill}
            isStandalone={true}
            authToken={authToken}
            userId={sessionUser?.id}
          />
        )}

        {/* ========================================================================= */}
        {/* TAB 4: CONFIGURAÇÕES & APIS                                               */}
        {/* ========================================================================= */}
        {activeTab === 'settings' && (
          <RobustSettingsView authToken={authToken} userId={sessionUser?.id} />
        )}

        {/* ========================================================================= */}
        {/* TAB 5: DIAGNÓSTICO & STATUS                                               */}
        {/* ========================================================================= */}
        {activeTab === 'status' && (
          <StatusView dealsCount={deals.length} authToken={authToken} />
        )}
      </main>

      {/* MODAL: Avaliação Clínica ML */}
      {selectedDealForDetail && (
        <AnalysisDetailModal
          analysis={selectedDealForDetail}
          onClose={() => setSelectedDealForDetail(null)}
          onOpenCalculator={handleOpenCalculatorForDeal}
          onUpdateDeal={handleUpdateDeal}
          onToggleFeatured={isAdmin ? handleToggleFeatured : undefined}
          autoEvaluate={true}
          authToken={authToken}
        />
      )}

      {/* MODAL: Análise Manual */}
      {manualModalOpen && (
        <ManualSearchModal
          onClose={() => setManualModalOpen(false)}
          onSuccess={handleManualSearchSuccess}
          authToken={authToken}
          userId={sessionUser?.id}
        />
      )}
    </div>
  );
}
