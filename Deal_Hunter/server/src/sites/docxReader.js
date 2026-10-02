const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

/**
 * Localiza dinamicamente a pasta "sites/" ou "SITES/" no projeto.
 */
function findSitesDir() {
  const candidates = [
    path.resolve(process.cwd(), 'SITES'),
    path.resolve(process.cwd(), 'sites'),
    path.resolve(__dirname, '../../../../SITES'),
    path.resolve(__dirname, '../../../../sites'),
    path.resolve(__dirname, '../../../SITES'),
    path.resolve(__dirname, '../../../sites'),
    path.resolve(__dirname, '../../SITES'),
    path.resolve(__dirname, '../../sites'),
    path.resolve(process.cwd(), '../SITES'),
    path.resolve(process.cwd(), '../sites'),
    path.resolve(process.cwd(), '../../SITES'),
    path.resolve(process.cwd(), '../../sites'),
  ];

  for (const dir of candidates) {
    try {
      if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
        const files = fs.readdirSync(dir);
        if (files.some((f) => f.toLowerCase().endsWith('.docx'))) {
          return dir;
        }
      }
    } catch {
      // Ignora erro de permissão ou caminho inexistente
    }
  }
  return null;
}

/**
 * Lê os arquivos contidos em um buffer ZIP (formato docx/xlsx).
 */
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

/**
 * Decodifica entidades XML comuns.
 */
function decodeXml(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * Extrai todos os parágrafos de texto preservando a ordem original do arquivo .docx.
 */
function getDocxParagraphs(docxPath) {
  const buf = fs.readFileSync(docxPath);
  const entries = readZipEntries(buf);
  const xml = entries['word/document.xml'] || '';
  if (!xml) return [];

  const pMatches = xml.match(/<w:p\b[^>]*>.*?<\/w:p>/gs) || [];
  const paragraphs = [];

  for (const p of pMatches) {
    const tMatches = [...p.matchAll(/<w:t\b[^>]*>(.*?)<\/w:t>/gs)].map((m) => decodeXml(m[1]));
    const text = tMatches.join('').trim();
    if (text) {
      paragraphs.push(text);
    }
  }

  return paragraphs;
}

/**
 * Lê dinamicamente todos os manuais .docx da pasta sites.
 */
function readAllDocxFiles(targetDir) {
  const sitesDir = targetDir || findSitesDir();
  if (!sitesDir) {
    return { sitesDir: null, files: [] };
  }

  const entries = fs.readdirSync(sitesDir);
  const docxFiles = entries
    .filter((file) => file.toLowerCase().endsWith('.docx') && !file.startsWith('~$'))
    .sort();

  const results = [];
  for (const filename of docxFiles) {
    const fullPath = path.join(sitesDir, filename);
    const storeKey = path.basename(filename, path.extname(filename)).toUpperCase();
    const paragraphs = getDocxParagraphs(fullPath);
    results.push({
      filename,
      storeKey,
      fullPath,
      paragraphs,
    });
  }

  return { sitesDir, files: results };
}

module.exports = {
  findSitesDir,
  readZipEntries,
  decodeXml,
  getDocxParagraphs,
  readAllDocxFiles,
};
