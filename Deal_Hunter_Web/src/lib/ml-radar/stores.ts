export interface StoreMeta {
  name: string;
  slug: string;
  logo: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

export const MONITORED_STORES: Record<string, StoreMeta> = {
  amazon: {
    name: 'Amazon Brasil',
    slug: 'amazon',
    logo: '/images/novo-logos/amazon.png',
    badgeBg: 'bg-amber-500/15',
    badgeBorder: 'border-amber-500/30',
    badgeText: 'text-amber-300',
  },
  kabum: {
    name: 'KaBuM!',
    slug: 'kabum',
    logo: '/images/novo-logos/kabum.png',
    badgeBg: 'bg-orange-500/15',
    badgeBorder: 'border-orange-500/30',
    badgeText: 'text-orange-400',
  },
  shopee: {
    name: 'Shopee Brasil',
    slug: 'shopee',
    logo: '/images/novo-logos/shopee.png',
    badgeBg: 'bg-red-500/15',
    badgeBorder: 'border-red-500/30',
    badgeText: 'text-red-400',
  },
  magalu: {
    name: 'Magazine Luiza',
    slug: 'magalu',
    logo: '/images/novo-logos/magalu.png',
    badgeBg: 'bg-blue-500/15',
    badgeBorder: 'border-blue-500/30',
    badgeText: 'text-blue-400',
  },
  pichau: {
    name: 'Pichau',
    slug: 'pichau',
    logo: '/images/novo-logos/pichau.png',
    badgeBg: 'bg-red-600/15',
    badgeBorder: 'border-red-600/30',
    badgeText: 'text-red-300',
  },
  renner: {
    name: 'Lojas Renner',
    slug: 'renner',
    logo: '/images/novo-logos/renner.png',
    badgeBg: 'bg-rose-500/15',
    badgeBorder: 'border-rose-500/30',
    badgeText: 'text-rose-300',
  },
  shein: {
    name: 'Shein Brasil',
    slug: 'shein',
    logo: '/images/novo-logos/shein.png',
    badgeBg: 'bg-neutral-500/15',
    badgeBorder: 'border-neutral-500/30',
    badgeText: 'text-neutral-300',
  },
  eletroclub: {
    name: 'Eletroclub',
    slug: 'eletroclub',
    logo: '/images/novo-logos/eletroclub.png',
    badgeBg: 'bg-cyan-500/15',
    badgeBorder: 'border-cyan-500/30',
    badgeText: 'text-cyan-400',
  },
  mercadolivre: {
    name: 'Mercado Livre',
    slug: 'mercadolivre',
    logo: '/images/logo.png',
    badgeBg: 'bg-yellow-500/15',
    badgeBorder: 'border-yellow-500/30',
    badgeText: 'text-yellow-400',
  },
};

export function getStoreMeta(storeName?: string | null): StoreMeta {
  if (!storeName) {
    return {
      name: 'Oferta Verificada',
      slug: 'online',
      logo: '/images/logo.png',
      badgeBg: 'bg-violet-500/15',
      badgeBorder: 'border-violet-500/30',
      badgeText: 'text-violet-300',
    };
  }

  const s = storeName.toLowerCase().trim();
  if (s.includes('amazon')) return MONITORED_STORES.amazon;
  if (s.includes('kabum')) return MONITORED_STORES.kabum;
  if (s.includes('shopee')) return MONITORED_STORES.shopee;
  if (s.includes('magazineluiza') || s.includes('magalu')) return MONITORED_STORES.magalu;
  if (s.includes('pichau')) return MONITORED_STORES.pichau;
  if (s.includes('renner')) return MONITORED_STORES.renner;
  if (s.includes('shein')) return MONITORED_STORES.shein;
  if (s.includes('eletroclub')) return MONITORED_STORES.eletroclub;
  if (s.includes('mercadolivre') || s.includes('mercado livre')) return MONITORED_STORES.mercadolivre;

  return {
    name: storeName,
    slug: s.replace(/[^a-z0-9]/g, '-'),
    logo: '/images/logo.png',
    badgeBg: 'bg-indigo-500/15',
    badgeBorder: 'border-indigo-500/30',
    badgeText: 'text-indigo-300',
  };
}
