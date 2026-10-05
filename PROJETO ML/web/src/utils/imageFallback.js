/**
 * Generates an SVG Data URI as a fallback when product images fail to load or are blocked
 */
export function getProductFallbackImage(title = '', store = '') {
  const t = (title || '').toLowerCase();
  
  let iconPath = '';
  let categoryName = 'PRODUTO';
  let bgColor = '#1e293b';
  let accentColor = '#38bdf8';

  if (t.includes('camera') || t.includes('câmera') || t.includes('a28') || t.includes('wifi') || t.includes('segurança')) {
    categoryName = 'CÂMERA DE SEGURANÇA';
    accentColor = '#10b981';
    iconPath = `<circle cx="50" cy="45" r="18" fill="none" stroke="${accentColor}" stroke-width="4"/><circle cx="50" cy="45" r="8" fill="${accentColor}"/><rect x="25" y="25" width="50" height="45" rx="8" fill="none" stroke="${accentColor}" stroke-width="3"/><path d="M40 70 L60 70 L50 85 Z" fill="${accentColor}"/>`;
  } else if (t.includes('ssd') || t.includes('kingston') || t.includes('nvme') || t.includes('sata')) {
    categoryName = 'SSD / ARMAZENAMENTO';
    accentColor = '#f59e0b';
    iconPath = `<rect x="25" y="28" width="50" height="44" rx="6" fill="none" stroke="${accentColor}" stroke-width="4"/><line x1="33" y1="36" x2="48" y2="36" stroke="${accentColor}" stroke-width="3"/><line x1="33" y1="44" x2="42" y2="44" stroke="${accentColor}" stroke-width="3"/><rect x="52" y="56" width="16" height="8" rx="2" fill="${accentColor}"/>`;
  } else if (t.includes('headset') || t.includes('gamer') || t.includes('fone') || t.includes('zeus')) {
    categoryName = 'HEADSET GAMER';
    accentColor = '#ec4899';
    iconPath = `<path d="M30 52 A22 22 0 0 1 70 52" fill="none" stroke="${accentColor}" stroke-width="4"/><rect x="24" y="48" width="12" height="20" rx="4" fill="${accentColor}"/><rect x="64" y="48" width="12" height="20" rx="4" fill="${accentColor}"/><path d="M68 68 Q58 78 48 74" fill="none" stroke="${accentColor}" stroke-width="3"/>`;
  } else if (t.includes('air fryer') || t.includes('fritadeira') || t.includes('mondial') || t.includes('panela')) {
    categoryName = 'AIR FRYER';
    accentColor = '#ef4444';
    iconPath = `<rect x="28" y="28" width="44" height="48" rx="10" fill="none" stroke="${accentColor}" stroke-width="4"/><line x1="34" y1="48" x2="66" y2="48" stroke="${accentColor}" stroke-width="3"/><circle cx="50" cy="38" r="4" fill="${accentColor}"/><rect x="44" y="56" width="12" height="12" rx="3" fill="${accentColor}"/>`;
  } else {
    categoryName = store ? store.toUpperCase() : 'ML RADAR';
    iconPath = `<rect x="25" y="25" width="50" height="50" rx="8" fill="none" stroke="${accentColor}" stroke-width="4"/><path d="M35 45 L65 45 M50 35 L50 65" stroke="${accentColor}" stroke-width="4"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <rect width="100" height="100" fill="${bgColor}" rx="12"/>
    ${iconPath}
    <text x="50" y="92" font-family="system-ui, -apple-system, sans-serif" font-size="6.5" font-weight="bold" fill="#94a3b8" text-anchor="middle" letter-spacing="0.5">${categoryName}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
