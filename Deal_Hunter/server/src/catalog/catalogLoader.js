const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

// Mapeamento oficial dos códigos de categoria do Magazine Luiza para nomes legíveis
const MAGALU_CODE_NAMES = {
  te: 'Celulares e Smartphones',
  et: 'TV e Vídeo',
  ed: 'Eletrodomésticos',
  mo: 'Móveis',
  in: 'Informática',
  md: 'Moda e Acessórios',
  ar: 'Ar e Ventilação',
  af: 'Artigos para Festa',
  am: 'Artesanato',
  ea: 'Áudio',
  au: 'Automotivo',
  bb: 'Bebê',
  pf: 'Beleza e Perfumaria',
  bs: 'Bem-Estar Sexual',
  br: 'Brinquedos',
  cm: 'Cama, Mesa e Banho',
  cf: 'Câmeras e Drones',
  cj: 'Casa e Construção',
  ci: 'Casa Inteligente',
  co: 'Colchões',
  pi: 'Comércio e Indústria',
  de: 'Decoração',
  ep: 'Eletroportáteis',
  es: 'Esporte e Lazer',
  fs: 'Ferramentas',
  fm: 'Filmes e Séries',
  fj: 'Flores e Jardim',
  ga: 'Games',
  im: 'Instrumentos Musicais',
  li: 'Livros',
  me: 'Mercado',
  ms: 'Música e Shows',
  na: 'Natal',
  pa: 'Papelaria',
  pe: 'Pet Shop',
  rg: 'Religião e Espiritualidade',
  re: 'Relógios',
  cp: 'Saúde e Cuidados Pessoais',
  se: 'Serviços',
  sa: 'Suplementos Alimentares',
  tb: 'Tablets, iPads e E-readers',
  tf: 'Telefonia Fixa',
  ud: 'Utilidades Domésticas',
};

// URL padrão da página de ofertas do dia com 54% ou mais de desconto
const AMAZON_DEALS_URL = 'https://www.amazon.com.br/deals?ref_=nav_cs_gb&discounts-widget=%2522%257B%255C%2522state%255C%2522%253A%257B%255C%2522rangeRefinementFilters%255C%2522%253A%257B%255C%2522percentOff%255C%2522%253A%257B%255C%2522min%255C%2522%253A54%252C%255C%2522max%255C%2522%253A100%257D%257D%257D%252C%255C%2522version%255C%2522%253A1%257D%2522&promotionsSearchLastSeenAsin=B0F4RQJXXB&promotionsSearchStartIndex=0&promotionsSearchPageSize=60';

function findUtilidadesDir() {
  const candidates = [
    path.resolve(__dirname, '../../../../Utilidades'),
    path.resolve(__dirname, '../../../Utilidades'),
    path.resolve(__dirname, '../../Utilidades'),
    path.resolve(process.cwd(), '../Utilidades'),
    path.resolve(process.cwd(), '../../Utilidades'),
    path.resolve(process.cwd(), 'Utilidades'),
    path.resolve(__dirname, '../../../../utilidades'),
    path.resolve(__dirname, '../../../utilidades'),
    path.resolve(__dirname, '../../utilidades'),
    path.resolve(process.cwd(), '../utilidades'),
    path.resolve(process.cwd(), 'utilidades'),
  ];
  for (const dir of candidates) {
    try {
      if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
        return dir;
      }
    } catch {
      // Ignora erros de permissão ou caminho inexistente
    }
  }
  return null;
}

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const rows = [];
  for (let l = 0; l < lines.length; l += 1) {
    const line = lines[l];
    const cells = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += c;
      }
    }
    cells.push(current.trim());
    const nonEmp = cells.filter((c) => c.length > 0);
    if (nonEmp.length) rows.push(nonEmp);
  }
  return rows;
}

function readZipEntries(buffer) {
  const entries = {};
  let offset = 0;
  while (offset < buffer.length - 4) {
    if (buffer.readUInt32LE(offset) !== 0x04034b50) break;
    const method = buffer.readUInt16LE(offset + 8);
    const compSize = buffer.readUInt32LE(offset + 18);
    const nameLen = buffer.readUInt16LE(offset + 26);
    const extraLen = buffer.readUInt16LE(offset + 28);
    const name = buffer.toString('utf8', offset + 30, offset + 30 + nameLen);
    const dataOffset = offset + 30 + nameLen + extraLen;
    const compData = buffer.subarray(dataOffset, dataOffset + compSize);
    let data;
    try {
      if (method === 0) data = compData;
      else if (method === 8) data = zlib.inflateRawSync(compData);
    } catch {
      data = null;
    }
    entries[name] = data ? data.toString('utf8') : '';
    offset = dataOffset + compSize;
  }
  return entries;
}

function decodeXml(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

const OFFICIAL_AMAZON_BR_CATEGORIES = [
  ['amazon-bebidas-alcolicas', 'Bebidas Alcoólicas', 'https://www.amazon.com.br/s?i=wine&rh=n%3A19778003011&s=popularity-rank&fs=true&ref=lp_19778003011_sar'],
  ['amazon-cafe-da-manha', 'Café da Manhã', 'https://www.amazon.com.br/s?i=wine&rh=n%3A19778001011&s=popularity-rank&fs=true&ref=lp_19778001011_sar'],
  ['amazon-cereais-e-granalo', 'Cereais e Granola', 'https://www.amazon.com.br/s?i=wine&rh=n%3A118520415011&s=popularity-rank&fs=true&ref=lp_118520415011_sar'],
  ['amazon-oleos-e-azeites', 'Óleos e Azeites', 'https://www.amazon.com.br/s?i=wine&rh=n%3A19778017011&s=popularity-rank&fs=true&ref=lp_19778017011_sar'],
  ['amazon-automotivo', 'Automotivo', 'https://www.amazon.com.br/s?i=automotive&rh=n%3A18914209011&s=popularity-rank&fs=true&ref=lp_18914209011_sar'],
  ['amazon-para-bebes', 'Para Bebês', 'https://www.amazon.com.br/s?i=baby&rh=n%3A17242603011&s=popularity-rank&fs=true&ref=lp_17242603011_sar'],
  ['amazon-cuidados-corpo', 'Cuidados Corpo', 'https://www.amazon.com.br/s?i=beauty&rh=n%3A16194414011&s=popularity-rank&fs=true&ref=lp_16194414011_sar'],
  ['amazon-bolsas-malas-e-mochilas', 'Bolsas, Malas e Mochilas', 'https://www.amazon.com.br/b?node=17934495011&discounts-widget=%2522%257B%255C%2522state%255C%2522%253A%257B%255C%2522refinementFilters%255C%2522%253A%257B%255C%2522departments%255C%2522%253A%255B%255C%252217365811011%252F17681967011%255C%2522%255D%257D%257D%252C%255C%2522version%255C%2522%253A1%257D%2522'],
  ['amazon-brinquedos', 'Brinquedos', 'https://www.amazon.com.br/s?i=toys&rh=n%3A16194299011&s=popularity-rank&fs=true&ref=lp_16194299011_sar'],
  ['amazon-casa', 'Casa', 'https://www.amazon.com.br/s?i=home&rh=n%3A16191000011&s=popularity-rank&fs=true&ref=lp_16191000011_sar'],
  ['amazon-celulares-e-comunicacao', 'Celulares e Comunicação', 'https://www.amazon.com.br/s?i=electronics&rh=n%3A16243803011&s=popularity-rank&fs=true&ref=lp_16243803011_sar'],
  ['amazon-informatica', 'Informática', 'https://www.amazon.com.br/s?i=computers&rh=n%3A16339926011&s=popularity-rank&fs=true&ref=lp_16339926011_sar'],
  ['amazon-cozinha', 'Cozinha', 'https://www.amazon.com.br/s?i=kitchen&rh=n%3A16957125011&s=popularity-rank&fs=true&ref=lp_16957125011_sar'],
  ['amazon-eletronicos', 'Eletrônicos', 'https://www.amazon.com.br/s?i=electronics&rh=n%3A16209062011&s=popularity-rank&fs=true&ref=lp_16209062011_sar'],
  ['amazon-esporte', 'Esporte', 'https://www.amazon.com.br/s?i=sporting&rh=n%3A17349396011&s=popularity-rank&fs=true&ref=lp_17349396011_sar'],
  ['amazon-ferramentas-e-contrucao', 'Ferramentas e Construção', 'https://www.amazon.com.br/s?i=hi&rh=n%3A16957182011&s=popularity-rank&fs=true&ref=lp_16957182011_sar'],
  ['amazon-games-e-console', 'Games e Console', 'https://www.amazon.com.br/s?i=videogames&rh=n%3A7791985011&s=popularity-rank&fs=true&ref=lp_7791985011_sar'],
  ['amazon-papelaria', 'Papelaria', 'https://www.amazon.com.br/s?i=office-products&rh=n%3A16957239011&s=popularity-rank&fs=true&ref=lp_16957239011_sar'],
  ['amazon-petshop', 'Pet Shop', 'https://www.amazon.com.br/s?i=pets&rh=n%3A18991136011&s=popularity-rank&fs=true&ref=lp_18991136011_sar'],
  ['amazon-roupas', 'Roupas', 'https://amazon.com.br/gp/browse.html?node=17365811011&ref_=nav_em__fashion_all_0_2_27_2&promotionsSearchLastSeenAsin=B0GV964JLF&promotionsSearchStartIndex=120&promotionsSearchPageSize=60'],
];

function loadAmazonCategories(utilidadesDir) {
  let categories = [...OFFICIAL_AMAZON_BR_CATEGORIES];
  let loadedFrom = null;

  if (utilidadesDir) {
    try {
      const files = fs.readdirSync(utilidadesDir);

      // Prioridade 1: Arquivo Excel de categorias da Amazon (.xlsx) se fornecido pelo usuário
      const amazonXlsxName = files.find((f) => f.endsWith('.xlsx') && /amazon/i.test(f));
      if (amazonXlsxName) {
        const xlsxPath = path.join(utilidadesDir, amazonXlsxName);
        const buf = fs.readFileSync(xlsxPath);
        const entries = readZipEntries(buf);
        const sharedXml = entries['xl/sharedStrings.xml'] || '';
        const siMatches = sharedXml.match(/<si\b[^>]*>.*?<\/si>/gs) || [];
        const sharedStrings = [];
        for (const si of siMatches) {
          const tParts = [...si.matchAll(/<t\b[^>]*>(.*?)<\/t>/gs)].map((m) => m[1]);
          sharedStrings.push(decodeXml(tParts.join('')));
        }

        const sheetXml = entries['xl/worksheets/sheet1.xml'] || '';
        const rowMatches = sheetXml.match(/<row\b[^>]*>.*?<\/row>/gs) || [];
        const parsedCats = [];
        const seenUrls = new Set();

        for (const r of rowMatches) {
          const cMatches = r.match(/<c\b[^>]*>.*?<\/c>/gs) || [];
          const cells = {};
          for (const c of cMatches) {
            const rAttr = c.match(/r="([A-Z]+)(\d+)"/);
            const tAttr = c.match(/t="([^"]+)"/);
            const vMatch = c.match(/<v>(.*?)<\/v>/);
            if (!rAttr) continue;
            const col = rAttr[1];
            let val = vMatch ? vMatch[1] : '';
            if (tAttr && tAttr[1] === 's' && /^\d+$/.test(val)) {
              val = sharedStrings[parseInt(val, 10)] || '';
            }
            cells[col] = decodeXml(val.trim());
          }

          let name = (cells['A'] || '').replace(/[:\s]+$/, '').trim();
          let rawUrl = (cells['B'] || cells['A'] || '').trim();
          if (!/(?:https?:\/\/)?(?:www\.)?amazon\.com\.br\//i.test(rawUrl)) {
            if (/(?:https?:\/\/)?(?:www\.)?amazon\.com\.br\//i.test(name)) {
              rawUrl = name;
              name = '';
            } else {
              continue;
            }
          }
          let url = rawUrl;
          if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url.replace(/^\/+/, '');
          }
          if (seenUrls.has(url)) continue;
          seenUrls.add(url);
          if (!name) {
            name = url.replace(/^https?:\/\/[^/]+\/?/i, '').split(/[?#/]/)[0].replace(/[-_+]/g, ' ') || 'Categoria Amazon';
          }
          const slug = name.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 50);
          parsedCats.push([`amazon-${slug}`, name, url]);
        }

        if (parsedCats.length > 0) {
          categories = [...parsedCats];
          loadedFrom = xlsxPath;
        }
      }

      // Prioridade 2: CSV de categorias da Amazon
      if (!loadedFrom) {
        const csvName = files.find((f) => /amazon.*categories.*\.csv$/i.test(f) || (f.endsWith('.csv') && /amazon/i.test(f)))
          || files.find((f) => f.endsWith('.csv'));
        if (csvName) {
          const csvPath = path.join(utilidadesDir, csvName);
          const content = fs.readFileSync(csvPath, 'utf8');
          const rows = parseCsv(content);
          const seenIds = new Set();

          const startIdx = rows.length > 0 && /department/i.test(rows[0][0]) ? 1 : 0;
          for (let i = startIdx; i < rows.length; i += 1) {
            const row = rows[i];
            const parsed = row.map((cell) => {
              const m = cell.match(/^(.*?)\s*\(([^)]+)\)$/);
              if (m) return { name: m[1].trim(), id: m[2].trim() };
              return { name: cell.trim(), id: '' };
            });
            const leaf = parsed[parsed.length - 1];
            const nodeId = leaf?.id;
            if (!nodeId || seenIds.has(nodeId)) continue;
            seenIds.add(nodeId);

            const fullPath = parsed.map((p) => p.name).join(' > ');
            const catId = `amazon-${nodeId}`;
            const url = `https://www.amazon.com.br/s?rh=n%3A${nodeId}`;
            categories.push([catId, fullPath, url]);
          }
          loadedFrom = csvPath;
        }
      }
    } catch (err) {
      console.warn(`[Catalog] Não foi possível ler as categorias da Amazon em ${utilidadesDir}: ${err.message}`);
    }
  }

  // Se não encontrou o arquivo, usa as categorias principais padrão
  if (categories.length <= 1) {
    const fallbacks = [
      ['amazon-livros', 'Livros', 'https://www.amazon.com.br/s?rh=n%3A6740748011'],
      ['amazon-eletronicos', 'Eletrônicos', 'https://www.amazon.com.br/s?rh=n%3A16209062011'],
      ['amazon-casa-cozinha', 'Casa e Cozinha', 'https://www.amazon.com.br/s?rh=n%3A16209095011'],
      ['amazon-beleza', 'Beleza', 'https://www.amazon.com.br/s?rh=n%3A16209071011'],
      ['amazon-games', 'Games e Consoles', 'https://www.amazon.com.br/s?rh=n%3A7739577011'],
      ['amazon-brinquedos', 'Brinquedos e Jogos', 'https://www.amazon.com.br/s?rh=n%3A2090888011'],
      ['amazon-informatica', 'Informática', 'https://www.amazon.com.br/s?rh=n%3A16364756011'],
      ['amazon-esportes', 'Esportes e Fitness', 'https://www.amazon.com.br/s?rh=n%3A1976690011'],
    ];
    categories.push(...fallbacks);
  }

  return { categories, loadedFrom };
}

function loadMagaluCategories(utilidadesDir) {
  let categories = [];
  let loadedFrom = null;

  if (utilidadesDir) {
    try {
      const files = fs.readdirSync(utilidadesDir);
      const xlsxName = files.find((f) => /magazineluiza.*\.xlsx$/i.test(f) || (f.endsWith('.xlsx') && /magalu|magazineluiza/i.test(f)))
        || files.find((f) => f.endsWith('.xlsx'));
      if (xlsxName) {
        const xlsxPath = path.join(utilidadesDir, xlsxName);
        const buf = fs.readFileSync(xlsxPath);
        const entries = readZipEntries(buf);
        const sharedXml = entries['xl/sharedStrings.xml'] || '';
        const siMatches = sharedXml.match(/<si\b[^>]*>.*?<\/si>/gs) || [];
        const urls = [];
        for (const si of siMatches) {
          const tParts = [...si.matchAll(/<t\b[^>]*>(.*?)<\/t>/gs)].map((m) => m[1]);
          const str = tParts.join('').trim();
          if (str.includes('magazineluiza.com.br/') && str.includes('/l/')) {
            urls.push(str);
          }
        }
        const uniqueUrls = [...new Set(urls)];
        const parsedCats = [];
        for (const u of uniqueUrls) {
          const m = u.match(/magazineluiza\.com\.br\/([^/]+)\/l\/([^/]+)\/?/);
          if (m) {
            const slug = m[1];
            const code = m[2];
            const name = MAGALU_CODE_NAMES[code] || slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
            parsedCats.push([`magalu-${code}`, name, u]);
          }
        }
        if (parsedCats.length > 0) {
          categories = parsedCats;
          loadedFrom = xlsxPath;
        }
      }
    } catch (err) {
      console.warn(`[Catalog] Não foi possível ler o Excel do Magazine Luiza em ${utilidadesDir}: ${err.message}`);
    }
  }

  // Se não encontrou o arquivo, usa as categorias mapeadas canônicas do Magalu
  if (categories.length === 0) {
    const fallbacks = [
      ['magalu-te', 'Celulares e Smartphones', 'https://www.magazineluiza.com.br/celulares-e-smartphones/l/te/'],
      ['magalu-et', 'TV e Vídeo', 'https://www.magazineluiza.com.br/tv-e-video/l/et/'],
      ['magalu-ed', 'Eletrodomésticos', 'https://www.magazineluiza.com.br/eletrodomesticos/l/ed/'],
      ['magalu-mo', 'Móveis', 'https://www.magazineluiza.com.br/moveis/l/mo/'],
      ['magalu-in', 'Informática', 'https://www.magazineluiza.com.br/informatica/l/in/'],
      ['magalu-md', 'Moda e Acessórios', 'https://www.magazineluiza.com.br/moda-e-acessorios/l/md/'],
      ['magalu-ar', 'Ar e Ventilação', 'https://www.magazineluiza.com.br/ar-e-ventilacao/l/ar/'],
      ['magalu-ea', 'Áudio', 'https://www.magazineluiza.com.br/audio/l/ea/'],
      ['magalu-ep', 'Eletroportáteis', 'https://www.magazineluiza.com.br/eletroportateis/l/ep/'],
      ['magalu-ga', 'Games', 'https://www.magazineluiza.com.br/games/l/ga/'],
      ['magalu-li', 'Livros', 'https://www.magazineluiza.com.br/livros/l/li/'],
      ['magalu-ud', 'Utilidades Domésticas', 'https://www.magazineluiza.com.br/utilidades-domesticas/l/ud/'],
    ];
    categories.push(...fallbacks);
  }

  return { categories, loadedFrom };
}

function getCatalog() {
  const utilidadesDir = findUtilidadesDir();
  const amazonResult = loadAmazonCategories(utilidadesDir);
  const magaluResult = loadMagaluCategories(utilidadesDir);

  const STORES = [
    {
      id: 'amazon-br',
      domain: 'amazon.com.br',
      name: 'Amazon Brasil',
      url: 'https://www.amazon.com.br/',
      categories: amazonResult.categories,
      loadedFrom: amazonResult.loadedFrom,
    },
    {
      id: 'magalu',
      domain: 'magazineluiza.com.br',
      name: 'Magazine Luiza',
      url: 'https://www.magazineluiza.com.br/',
      categories: magaluResult.categories,
      loadedFrom: magaluResult.loadedFrom,
    },
    {
      id: 'eletroclub',
      domain: 'eletroclub.com.br',
      name: 'Eletroclub',
      url: 'https://www.eletroclub.com.br/',
      categories: [
        ['eletroclub-home', 'Página inicial / vitrines', 'https://www.eletroclub.com.br/'],
        ['eletroclub-cozinha', 'Cozinha', 'https://www.eletroclub.com.br/cozinha'],
        ['eletroclub-climatizacao', 'Climatização', 'https://www.eletroclub.com.br/climatizacao'],
        ['eletroclub-casa', 'Casa', 'https://www.eletroclub.com.br/casa'],
        ['eletroclub-cuidados-pessoais', 'Cuidados Pessoais', 'https://www.eletroclub.com.br/cuidados-pessoais'],
        ['eletroclub-audio-video', 'Áudio e Vídeo', 'https://www.eletroclub.com.br/audio-e-video'],
        ['eletroclub-outlet', 'Outlet / Ofertas', 'https://www.eletroclub.com.br/outlet'],
      ],
      loadedFrom: 'builtin',
    },
  ];

  try {
    const { getDynamicCatalogStores } = require('../sites');
    const dynamicStores = getDynamicCatalogStores();
    for (const ds of dynamicStores) {
      const idx = STORES.findIndex((s) => s.domain === ds.domain || s.id === ds.id);
      if (idx !== -1) {
        STORES[idx] = { ...STORES[idx], ...ds };
      } else {
        STORES.push(ds);
      }
    }
  } catch (err) {
    console.warn(`[Catalog] Aviso ao carregar lojas dinâmicas da pasta sites/: ${err.message}`);
  }

  // Fallback seguro via defaultCatalog.json caso alguma loja não tenha sido localizada
  try {
    const fallbackPath = path.join(__dirname, 'defaultCatalog.json');
    if (fs.existsSync(fallbackPath)) {
      const fallbackStores = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
      for (const fsStore of fallbackStores) {
        const idx = STORES.findIndex((s) => s.domain === fsStore.domain || s.id === fsStore.id);
        if (idx === -1) {
          STORES.push({
            id: fsStore.id,
            domain: fsStore.domain,
            name: fsStore.name,
            url: fsStore.url,
            requiresLogin: fsStore.requiresLogin,
            loginUrl: fsStore.loginUrl,
            categories: (fsStore.categories || []).map((c) => [c.id, c.name, c.url]),
            loadedFrom: 'defaultCatalog.json',
          });
        }
      }
    }
  } catch (err) {
    console.warn(`[Catalog] Aviso ao carregar defaultCatalog.json: ${err.message}`);
  }

  return { STORES, utilidadesDir };
}

module.exports = {
  findUtilidadesDir,
  parseCsv,
  readZipEntries,
  loadAmazonCategories,
  loadMagaluCategories,
  getCatalog,
};
