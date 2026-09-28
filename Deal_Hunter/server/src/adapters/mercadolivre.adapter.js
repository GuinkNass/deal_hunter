const cheerio = require('cheerio');
const { parseGeneric } = require('./generic.adapter');

/**
 * Mercado Livre geralmente expõe JSON-LD válido, então o parser genérico
 * já cobre a maioria dos casos. Este adaptador existe como ponto de
 * extensão: se no futuro for necessário um seletor específico (ex. para
 * evitar pegar o preço riscado/antigo), adicione aqui em vez de mexer no
 * genérico.
 */
function parseMercadoLivre(html, pageUrl) {
  const base = parseGeneric(html, pageUrl);
  if (base.priceFound) return base;

  // Fallback específico: tenta o preço "fracionado" que o ML usa quando
  // não há JSON-LD (ex.: páginas de categoria/promoção). Seletor conhecido
  // no momento da criação deste adaptador — pode mudar sem aviso do site.
  const $ = cheerio.load(html);
  const fraction = $('.andes-money-amount__fraction').first().text().replace(/\D/g, '');
  const cents = $('.andes-money-amount__cents').first().text().replace(/\D/g, '') || '00';
  if (fraction) {
    return {
      ...base,
      priceFound: true,
      price: Number(`${fraction}.${cents}`),
      currency: 'BRL',
    };
  }
  return base;
}

module.exports = { parseMercadoLivre };
