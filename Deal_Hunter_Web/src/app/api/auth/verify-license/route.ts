import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const ADMIN_EMAILS = [
  'guilherme.r.nascimento@live.com',
  'guilherme.r.nascimentoml@gmail.com',
];

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(req: NextRequest) {
  return handleVerification(req);
}

export async function POST(req: NextRequest) {
  return handleVerification(req);
}

async function handleVerification(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    return NextResponse.json(
      {
        authorized: false,
        error: 'Token de autenticação não fornecido no cabeçalho Authorization.',
      },
      {
        status: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  }

  const supabase = createAdminClient();

  // 1. Validação do JWT fornecido contra o serviço de Auth do Supabase
  const { data: userData, error: authError } = await supabase.auth.getUser(token);

  if (authError || !userData?.user) {
    return NextResponse.json(
      {
        authorized: false,
        error: 'Sessão expirada ou token de acesso inválido.',
      },
      {
        status: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  }

  const user = userData.user;
  const userEmail = (user.email || '').toLowerCase().trim();

  // 2. Busca do perfil no banco de dados
  let { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, subscription_status, stripe_customer_id, stripe_subscription_id, expires_at, created_at')
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    // Se falhar apenas por coluna inexistente, tenta sem expires_at
    if (profileError.message?.toLowerCase().includes('expires_at')) {
      const retry = await supabase
        .from('profiles')
        .select('role, subscription_status, stripe_customer_id, stripe_subscription_id, created_at')
        .eq('id', user.id)
        .single();
      if (retry.data) {
        profile = retry.data;
      }
    } else {
      console.error('Erro ao consultar profile:', profileError);
    }
  }

  // Se o perfil ainda não existe, tenta criar para persistir a data de primeiro acesso
  if (!profile) {
    try {
      const isAdmin = ADMIN_EMAILS.includes(userEmail);
      const initialRole = isAdmin ? 'admin' : 'user';
      const initialStatus = isAdmin ? 'active' : 'inactive';
      const nowIso = new Date().toISOString();
      const { data: newProfile } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: userEmail,
          role: initialRole,
          subscription_status: initialStatus,
          created_at: user.created_at || nowIso,
          updated_at: nowIso,
        })
        .select()
        .single();
      if (newProfile) profile = newProfile;
    } catch (insertErr) {
      console.warn('Auto-criação de perfil no verify-license:', insertErr);
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dealhunterpro.com.br';
  const checkoutUrl = `${siteUrl}/login?checkout=required`;

  // 3. REGRA DE OURO: Contas Administrador Master
  // Possuem acesso permanente e ilimitado, independente de pagamentos
  if (ADMIN_EMAILS.includes(userEmail) || profile?.role === 'admin') {
    return NextResponse.json(
      {
        authorized: true,
        plan: 'admin_unlimited',
        email: userEmail,
        role: 'admin',
        is_trial: false,
        message: 'Acesso Vitalício de Administrador concedido com sucesso.',
      },
      {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  }

  // 4. Verificação de Assinatura Paga Ativa (Stripe ou InfinitePay Pix)
  const status = profile?.subscription_status || 'inactive';
  const hasExpiresAt = !!profile?.expires_at;
  const isPaidActive = status === 'active' && (!hasExpiresAt || new Date(profile.expires_at).getTime() > Date.now());

  if (isPaidActive) {
    return NextResponse.json(
      {
        authorized: true,
        plan: 'pro_monthly',
        email: userEmail,
        role: 'user',
        status: 'active',
        is_trial: false,
        expires_at: profile?.expires_at || null,
        message: 'Assinatura Pro ativa. Acesso liberado.',
      },
      {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  }

  // 5. REGRA DE OURO: Modo de Teste Grátis de 7 Dias para Todo Usuário Cadastrado
  // Não requer cartão de crédito nem Pix. Começa no momento do primeiro login/cadastro.
  const userRegistrationTime = new Date(profile?.created_at || user.created_at || Date.now()).getTime();
  const trialDurationMs = 7 * 24 * 60 * 60 * 1000; // 7 dias
  const trialEndsAt = userRegistrationTime + trialDurationMs;
  const now = Date.now();

  const isTrialActive = now < trialEndsAt;
  const trialDaysLeft = Math.max(1, Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24)));

  if (isTrialActive) {
    return NextResponse.json(
      {
        authorized: true,
        plan: 'trial_7_days',
        email: userEmail,
        role: 'user',
        status: 'trialing',
        is_trial: true,
        trial_days_left: trialDaysLeft,
        trial_ends_at: new Date(trialEndsAt).toISOString(),
        message: `Modo de teste gratuito ativo. Você tem ${trialDaysLeft} dia(s) restante(s) de acesso total sem custos.`,
      },
      {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  }

  // 6. Teste de 7 dias encerrado e sem assinatura ativa
  return NextResponse.json(
    {
      authorized: false,
      plan: 'none',
      email: userEmail,
      role: 'user',
      status: 'trial_expired',
      is_trial: false,
      trial_expired: true,
      trial_ends_at: new Date(trialEndsAt).toISOString(),
      checkout_url: checkoutUrl,
      message: 'Seu período de teste gratuito de 7 dias encerrou. Escolha pagar via Pix ou Cartão por R$ 29,90 para continuar.',
    },
    {
      status: 403,
      headers: { 'Access-Control-Allow-Origin': '*' },
    }
  );
}
