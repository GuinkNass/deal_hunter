const test = require('node:test');
const assert = require('node:assert');
const { parseTelegramMessage, parseCurrency } = require('../services/telegramListenerService');

test('parseCurrency converts Brazilian format correctly', () => {
  assert.strictEqual(parseCurrency('R$ 1.299,90'), 1299.90);
  assert.strictEqual(parseCurrency('239,00'), 239.00);
  assert.strictEqual(parseCurrency('R$ 79'), 79.00);
  assert.strictEqual(parseCurrency('15.50'), 15.50);
});

test('parseTelegramMessage parses standard "De / Por" deal with discount', () => {
  const message = `
🔥 SUPER PROMOÇÃO! 🔥
SSD Kingston A400 480GB SATA III 2.5
De R$ 219,90 por R$ 139,90
36% OFF com frete prime!
https://www.amazon.com.br/dp/B079XC5PVV?tag=promos-20
Aproveite enquanto durar o estoque!
  `;

  const parsed = parseTelegramMessage(message);
  assert.ok(parsed, 'Deveria parsear a mensagem');
  assert.strictEqual(parsed.loja, 'Amazon');
  assert.strictEqual(parsed.preco, 139.90);
  assert.strictEqual(parsed.preco_anterior, 219.90);
  assert.strictEqual(parsed.desconto, 36);
  assert.ok(parsed.nome.toLowerCase().includes('kingston'), 'Nome deveria conter kingston');
  assert.ok(parsed.url.includes('amazon.com.br'), 'URL deveria ser da Amazon');
});

test('parseTelegramMessage parses KaBuM deal message', () => {
  const message = `
Headset Gamer Redragon Zeus X RGB 7.1
Apenas R$ 199,90 no PIX!
https://kabum.com.br/produto/158930/headset-zeus-x
  `;

  const parsed = parseTelegramMessage(message);
  assert.ok(parsed);
  assert.strictEqual(parsed.loja, 'KaBuM!');
  assert.strictEqual(parsed.preco, 199.90);
  assert.ok(parsed.nome.toLowerCase().includes('headset'), 'Nome deveria conter headset');
});

test('parseTelegramMessage returns null for non-deal chat messages without links', () => {
  const parsed = parseTelegramMessage('Olá pessoal, bom dia a todos! Alguém viu se tem promoção boa hoje?');
  assert.strictEqual(parsed, null);
});
