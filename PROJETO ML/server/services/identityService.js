const { getSetting } = require('../db/db');

// List of promo noise words in PT-BR
const NOISE_WORDS = new Set([
  'promocao', 'promocao!', 'oferta', 'imperdivel', 'frete', 'gratis', 'cupom', 'desconto',
  'original', 'novo', 'lacrado', 'envio', 'rapido', 'imediato', 'melhor', 'preco',
  'top', 'oficial', 'garantia', 'nf', 'nota', 'fiscal', 'barato', 'queima', 'estoque',
  'relampago', 'super', 'mega', 'pronta', 'entrega', 'kit', 'combo',
  'geracao', 'recente', 'mais', 'lancamento', 'versao', 'modelo', 'com', 'para', 'de', 'em', 'do', 'da', 'e', 'ou', 'ao', 'na', 'no'
]);

/**
 * Normalizes product title, stripping noise and accents
 */
function normalizeTitle(rawTitle) {
  if (!rawTitle) return '';

  let title = rawTitle
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .toLowerCase();

  // Remove common emojis and symbols
  title = title.replace(/[^\w\s\d.-]/g, ' ');

  // Extract specs before removing noise
  const specs = extractSpecs(title);

  // Clean tokens
  const tokens = title
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 1 && !NOISE_WORDS.has(t));

  return {
    cleanTitle: tokens.join(' '),
    tokens: new Set(tokens),
    specs
  };
}

/**
 * Extract critical specs like storage capacity, model number, voltage, color
 */
function extractSpecs(text) {
  const specs = {
    capacity: null,
    voltage: null,
    model: null
  };

  // Capacity (e.g. 128gb, 256gb, 512gb, 480gb, 1tb, 2tb, 16gb)
  const capMatch = text.match(/\b(\d+)\s*(gb|tb|mb)\b/i);
  if (capMatch) {
    specs.capacity = capMatch[1] + capMatch[2].toLowerCase();
  }

  // Voltage (110v, 127v, 220v, bivolt)
  const voltMatch = text.match(/\b(110v|127v|220v|bivolt)\b/i);
  if (voltMatch) {
    specs.voltage = voltMatch[1].toLowerCase();
  }

  // Model codes e.g. A400, H510, AFN-40, RTX 4060
  const modelMatch = text.match(/\b([a-z]{1,4}[-_]?\d{2,5}[a-z]{0,4})\b/i);
  if (modelMatch) {
    specs.model = modelMatch[1].toLowerCase().replace(/[-_]/g, '');
  }

  return specs;
}

/**
 * Calculates Jaccard + Overlap similarity index between two token sets
 */
function calculateJaccard(tokensA, tokensB) {
  if (!tokensA.size || !tokensB.size) return 0;
  
  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      intersection++;
    }
  }

  const union = new Set([...tokensA, ...tokensB]).size;
  const jaccard = union === 0 ? 0 : intersection / union;
  const minSize = Math.min(tokensA.size, tokensB.size);
  const overlap = minSize === 0 ? 0 : intersection / minSize;

  // Weight Jaccard (40%) and Overlap (60%) so longer retailer titles aren't penalized
  return (jaccard * 0.4) + (overlap * 0.6);
}

/**
 * Simple perceptual image hash (dHash 8x8) simulator for images
 * In Node without canvas binary dependency, calculates hash from image content or fallback
 */
function simplePerceptualHash(buffer) {
  if (!buffer || buffer.length === 0) return '0000000000000000';
  let hash = 0;
  for (let i = 0; i < Math.min(buffer.length, 1024); i++) {
    hash = ((hash << 5) - hash + buffer[i]) | 0;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Calculates identity match score (0 to 100) between alert product and ML product
 */
async function compareIdentity(sourceItem, mlItem, options = {}) {
  const normSource = normalizeTitle(sourceItem.title || sourceItem.nome || '');
  const normML = normalizeTitle(mlItem.title || '');

  // 1. Spec check (Capacity mismatch = instant penalty)
  if (normSource.specs.capacity && normML.specs.capacity) {
    if (normSource.specs.capacity !== normML.specs.capacity) {
      return {
        score: 15,
        method: 'spec_mismatch',
        confidence: 'rejected',
        reason: `Capacidade divergente: ${normSource.specs.capacity} vs ${normML.specs.capacity}`
      };
    }
  }

  // 2. Voltage check (if explicit mismatch)
  if (normSource.specs.voltage && normML.specs.voltage) {
    if (normSource.specs.voltage !== normML.specs.voltage && 
        normSource.specs.voltage !== 'bivolt' && normML.specs.voltage !== 'bivolt') {
      return {
        score: 25,
        method: 'voltage_mismatch',
        confidence: 'rejected',
        reason: `Voltagem divergente: ${normSource.specs.voltage} vs ${normML.specs.voltage}`
      };
    }
  }

  // 3. Jaccard token similarity
  const jaccard = calculateJaccard(normSource.tokens, normML.tokens);
  let baseScore = Math.min(100, Math.round(jaccard * 100 * 1.3)); // scale to 0-100

  // 4. Model code bonus
  if (normSource.specs.model && normML.specs.model) {
    if (normSource.specs.model === normML.specs.model) {
      baseScore = Math.min(100, baseScore + 20);
    }
  }

  // 5. Catalog match bonus
  if (mlItem.catalog_product_id) {
    baseScore = Math.max(baseScore, 95);
  }

  // 6. Ambiguity check - if between 55 and 75, can trigger Gemini vision tie-breaker if requested
  let method = mlItem.catalog_product_id ? 'catalog_exact' : 'title_similarity';
  
  if (baseScore >= 55 && baseScore <= 75 && options.useGeminiVision && options.geminiService) {
    try {
      const visionResult = await options.geminiService.compareImagesWithVision(
        sourceItem.foto_url || sourceItem.image_url,
        mlItem.thumbnail || mlItem.image_url,
        sourceItem.title,
        mlItem.title
      );
      if (visionResult && typeof visionResult.score === 'number') {
        baseScore = visionResult.score;
        method = 'gemini_vision';
      }
    } catch {
      // fallback to computed baseScore
    }
  }

  return {
    score: Math.min(100, Math.max(0, baseScore)),
    method,
    normSourceClean: normSource.cleanTitle,
    normMLClean: normML.cleanTitle
  };
}

module.exports = {
  normalizeTitle,
  extractSpecs,
  calculateJaccard,
  simplePerceptualHash,
  compareIdentity
};
