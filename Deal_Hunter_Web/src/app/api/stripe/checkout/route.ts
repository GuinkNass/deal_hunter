import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    if (!token) {
      return NextResponse.json(
        { error: 'Autenticação necessária para iniciar checkout.' },
        { status: 401, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const supabase = createAdminClient();
    const { data: userData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !userData?.user) {
      return NextResponse.json(
        { error: 'Sessão inválida ou expirada.' },
        { status: 401, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const user = userData.user;
    const userEmail = (user.email || '').toLowerCase().trim();

    // Administrador permanente não precisa assinar
    if (userEmail === 'guilherme.r.nascimento@live.com') {
      return NextResponse.json(
        {
          message: 'Sua conta é Administrador Master com acesso vitalício gratuito.',
          is_admin: true,
        },
        { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const priceId = (process.env.STRIPE_PRICE_ID || process.env.STRIPE_PRICE_ID_PRO || '').trim();
    if (!priceId) {
      console.error('STRIPE_PRICE_ID não configurado no ambiente.');
      return NextResponse.json(
        { error: 'Preço de assinatura não configurado no servidor.' },
        { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Consulta se o usuário já possui um Stripe Customer ID no perfil
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    // Se não tiver, busca ou cria no Stripe
    if (!customerId) {
      const existingCustomers = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
      } else {
        const newCustomer = await stripe.customers.create({
          email: userEmail,
          metadata: {
            supabase_user_id: user.id,
          },
        });
        customerId = newCustomer.id;
      }

      // Salva no perfil para reaproveitar
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seu-dominio.vercel.app';

    // Criação da Sessão do Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      client_reference_id: user.id,
      customer_email: customerId ? undefined : userEmail,
      metadata: {
        userId: user.id,
        userEmail: userEmail,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          userEmail: userEmail,
        },
      },
      success_url: `${siteUrl}/login?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/login?checkout=cancelled`,
      allow_promotion_codes: true,
    });

    return NextResponse.json(
      { url: session.url },
      { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno ao processar checkout.';
    console.error('Erro na criação de checkout Stripe:', err);
    return NextResponse.json(
      { error: message },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
