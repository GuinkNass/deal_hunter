import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'guilherme.r.nascimento@live.com';

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET ausente nas variáveis de ambiente.');
    return NextResponse.json({ error: 'Configuração do Webhook ausente.' }, { status: 500 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Assinatura stripe-signature ausente.' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    // Leitura crua do corpo para validação criptográfica HMAC
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha na validação criptográfica do webhook.';
    console.error(`⚠️ Webhook signature verification failed: ${message}`);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      // ----------------------------------------------------------------------
      // 1. CHECKOUT COMPLETED (Primeira ativação da assinatura)
      // ----------------------------------------------------------------------
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id || session.metadata?.userId;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!userId && !session.customer_email) {
          console.warn('Checkout concluído sem userId nem customer_email associados.');
          break;
        }

        // Recupera status real da assinatura no Stripe
        let subscriptionStatus = 'active';
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          subscriptionStatus = sub.status;
        }

        // Query de busca do usuário (por ID ou por E-mail)
        let query = supabase.from('profiles').update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_status: subscriptionStatus,
          updated_at: new Date().toISOString(),
        });

        if (userId) {
          query = query.eq('id', userId);
        } else if (session.customer_email) {
          query = query.eq('email', session.customer_email.toLowerCase().trim());
        }

        const { error } = await query;
        if (error) {
          console.error('Erro ao atualizar perfil no checkout.session.completed:', error);
        } else {
          console.log(`✅ Assinatura ativada com sucesso para o usuário ${userId || session.customer_email}`);
        }
        break;
      }

      // ----------------------------------------------------------------------
      // 2. SUBSCRIPTION UPDATED (Renovação, troca de cartão, inadimplência)
      // ----------------------------------------------------------------------
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const subscriptionStatus = subscription.status; // 'active', 'past_due', 'unpaid', etc.

        // Busca o perfil pelo customer_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, role')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          // SALVAGUARDA CRÍTICA: O Administrador Master NUNCA é rebaixado
          if (profile.email.toLowerCase().trim() === ADMIN_EMAIL || profile.role === 'admin') {
            console.log(`ℹ️ Evento de assinatura ignorado para conta de Administrador Master: ${profile.email}`);
            break;
          }

          const { error } = await supabase
            .from('profiles')
            .update({
              stripe_subscription_id: subscription.id,
              subscription_status: subscriptionStatus,
              updated_at: new Date().toISOString(),
            })
            .eq('id', profile.id);

          if (error) console.error('Erro ao atualizar status da assinatura:', error);
        }
        break;
      }

      // ----------------------------------------------------------------------
      // 3. SUBSCRIPTION DELETED (Cancelamento de assinatura)
      // ----------------------------------------------------------------------
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, role')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          // SALVAGUARDA CRÍTICA: Administrador Master NUNCA perde o status ativo
          if (profile.email.toLowerCase().trim() === ADMIN_EMAIL || profile.role === 'admin') {
            console.log(`ℹ️ Tentativa de cancelamento bloqueada para conta de Administrador Master: ${profile.email}`);
            break;
          }

          const { error } = await supabase
            .from('profiles')
            .update({
              subscription_status: 'canceled',
              updated_at: new Date().toISOString(),
            })
            .eq('id', profile.id);

          if (error) console.error('Erro ao registrar cancelamento de assinatura:', error);
          else console.log(`🚫 Assinatura cancelada registrada para ${profile.email}`);
        }
        break;
      }

      default:
        // Outros eventos silenciosamente ignorados
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao processar evento do webhook.';
    console.error('Erro no processamento do webhook:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
