/**
 * Gera um SVG elegante e limpo de fallback quando uma imagem de produto não carrega ou é bloqueada
 */
export function getProductFallbackImage(title: string = '', store: string = ''): string {
  const t = (title || '').toLowerCase();

  let categoryName = store ? store.toUpperCase() : 'OFERTA VERIFICADA';
  let accentColor = '#38bdf8'; // Cyan padrão

  if (t.includes('nexgard') || t.includes('bravecto') || t.includes('scalibor') || t.includes('antipulgas') || t.includes('cães') || t.includes('pet')) {
    categoryName = 'PET & SAÚDE ANIMAL';
    accentColor = '#10b981'; // Emerald
  } else if (t.includes('monitor') || t.includes('tv') || t.includes('display') || t.includes('tela') || t.includes('samsung') || t.includes('lg')) {
    categoryName = 'MONITORES & SMART TV';
    accentColor = '#818cf8'; // Indigo
  } else if (t.includes('ssd') || t.includes('kingston') || t.includes('nvme') || t.includes('memória') || t.includes('armazenamento')) {
    categoryName = 'HARDWARE & SSD';
    accentColor = '#f59e0b'; // Amber
  } else if (t.includes('air fryer') || t.includes('fritadeira') || t.includes('mondial') || t.includes('eletro')) {
    categoryName = 'ELETRODOMÉSTICOS';
    accentColor = '#f97316'; // Orange
  } else if (t.includes('headset') || t.includes('fone') || t.includes('earphone')) {
    categoryName = 'ÁUDIO & HEADSETS';
    accentColor = '#ec4899'; // Pink
  } else if (t.includes('cadeira') || t.includes('mesa') || t.includes('escritório')) {
    categoryName = 'MÓVEIS & ERGONOMIA';
    accentColor = '#06b6d4'; // Cyan
  } else if (store) {
    categoryName = store.toUpperCase();
    accentColor = '#38bdf8';
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#090d16"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${accentColor}"/>
        <stop offset="100%" stop-color="#6366f1"/>
      </linearGradient>
    </defs>
    <rect width="400" height="400" fill="url(#bg)" rx="24"/>
    
    <!-- Moldura interior sutil -->
    <rect x="20" y="20" width="360" height="360" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2" rx="18"/>
    
    <!-- Ícone de Pacote / Tag de Oferta Sofisticado -->
    <g transform="translate(150, 130)">
      <rect x="0" y="15" width="100" height="85" rx="14" fill="rgba(255,255,255,0.03)" stroke="${accentColor}" stroke-width="3"/>
      <path d="M0 45 L100 45" stroke="${accentColor}" stroke-width="2" stroke-opacity="0.4"/>
      <path d="M50 15 L50 100" stroke="${accentColor}" stroke-width="2" stroke-opacity="0.4"/>
      <!-- Alça da Caixa / Laço -->
      <path d="M35 15 C35 -5, 65 -5, 65 15" fill="none" stroke="${accentColor}" stroke-width="3" stroke-linecap="round"/>
    </g>

    <!-- Badge Curadoria -->
    <g transform="translate(200, 260)">
      <rect x="-85" y="-14" width="170" height="28" rx="14" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
      <text x="0" y="5" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="11" font-weight="800" fill="${accentColor}" text-anchor="middle" letter-spacing="1.2">DEAL HUNTER PRO</text>
    </g>

    <!-- Nome da Categoria -->
    <text x="200" y="315" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="13" font-weight="700" fill="#94a3b8" text-anchor="middle" letter-spacing="0.8">${categoryName}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
