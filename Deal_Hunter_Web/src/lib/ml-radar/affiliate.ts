export const AMAZON_AFFILIATE_TAG = 'dealhunterp07-20';

/**
 * Injeta defensivamente a tag de afiliado Amazon (dealhunterp07-20).
 * - Identifica se o domínio pertence à Amazon (ex: amazon.com.br, amazon.com, amzn.to).
 * - Substitui ou anexa tag=dealhunterp07-20.
 * - Preserva todos os outros parâmetros válidos.
 * - Retorna a URL original se não pertencer à Amazon ou for inválida.
 */
export function tagAmazonUrl(urlStr: string | null | undefined): string {
  if (!urlStr || typeof urlStr !== 'string') return urlStr || '';
  try {
    const trimmed = urlStr.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return urlStr;
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.toLowerCase();
    const isAmazon =
      /(?:^|\.)amazon\.(?:[a-z]{2,3}(?:\.[a-z]{2})?)$/i.test(hostname) ||
      /(?:^|\.)amazon\.[a-z.]+$/i.test(hostname) ||
      /(?:^|\.)amzn\.(?:to|com)$/i.test(hostname);

    if (isAmazon) {
      parsed.searchParams.set('tag', AMAZON_AFFILIATE_TAG);
      return parsed.toString();
    }
    return urlStr;
  } catch {
    return urlStr;
  }
}
