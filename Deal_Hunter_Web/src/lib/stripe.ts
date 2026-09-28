import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  // Não lançamos erro no build estático caso ainda não configurado, mas sim na execução
  console.warn('Aviso: STRIPE_SECRET_KEY não foi encontrada nas variáveis de ambiente.');
}

export const stripe = new Stripe(stripeSecretKey || '', {
  apiVersion: '2025-01-27.acacia',
  appInfo: {
    name: 'Deal Hunter License Engine',
    version: '2.0.0',
  },
});
