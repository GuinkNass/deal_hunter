import Stripe from 'stripe';

const rawKey = process.env.STRIPE_SECRET_KEY || '';
const stripeSecretKey = rawKey.trim().replace(/^["']|["']$/g, '');

if (!stripeSecretKey) {
  console.warn('Aviso: STRIPE_SECRET_KEY não foi encontrada nas variáveis de ambiente.');
}

export const stripe = new Stripe(stripeSecretKey || 'sk_test_placeholder', {
  apiVersion: '2025-01-27.acacia' as any,
  httpClient: Stripe.createFetchHttpClient(),
  appInfo: {
    name: 'Deal Hunter License Engine',
    version: '2.0.0',
  },
});
