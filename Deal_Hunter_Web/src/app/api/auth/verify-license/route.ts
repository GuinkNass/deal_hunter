import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'guilherme.r.nascimento@live.com';

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
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, subscription_status, stripe_customer_id, stripe_subscription_id, expires_at')
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    // Se falhar apenas por coluna inexistente, tenta sem expires_at
    if (profileError.message?.toLowerCase().includes('expires_at')) {
      const retry = await supabase
        .from('profiles')
        .select('role, subscription_status, stripe_customer_id, stripe_subscription_id')
        .eq('id', user.id)
        .single();
      if (retry.data) {
        profile = retry.data;
      }
    } else {
      console.error('Erro ao consultar profile:', profileError);
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seu-dominio.vercel.app';
  const checkoutUrl = `${siteUrl}/login?checkout=required`;

  // 3. REGRA DE OURO: Conta Administrador Master (guilherme.r.nascimento@live.com)
  // Possui acesso permanente e ilimitado, independente de ter assinatura no Stripe
  if (userEmail === ADMIN_EMAIL || profile?.role === 'admin') {
    return NextResponse.json(
      {
        authorized: true,
        plan: 'admin_unlimited',
        email: userEmail,
        role: 'admin',
        message: 'Acesso Vitalício de Administrador concedido com sucesso.',
      },
      {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  }

  // 4. Verificação de Usuário: Status da Assinatura e Data de Expiração
  const status = profile?.subscription_status || 'inactive';
  const isExpired = profile?.expires_at ? new Date(profile.expires_at).getTime() < Date.now() : false;
  const isAuthorized = (status === 'active' || status === 'trialing') && !isExpired;

  if (isAuthorized) {
    return NextResponse.json(
      {
        authorized: true,
        plan: 'pro_monthly',
        email: userEmail,
        role: 'user',
        status,
        expires_at: profile?.expires_at || null,
        message: 'Assinatura ativa. Acesso liberado.',
      },
      {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  }

  // Usuário autenticado mas sem assinatura ativa
  return NextResponse.json(
    {
      authorized: false,
      plan: 'none',
      email: userEmail,
      role: 'user',
      status,
      checkout_url: checkoutUrl,
      message: 'Assinatura inativa ou cancelada. Assine o plano para continuar.',
    },
    {
      status: 403,
      headers: { 'Access-Control-Allow-Origin': '*' },
    }
  );
}
