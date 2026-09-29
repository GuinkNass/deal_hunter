import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'online',
    endpoint: 'InfinitePay Webhook',
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      const text = await req.text();
      console.warn('[InfinitePay Webhook] Erro ao fazer parse de JSON. Raw text:', text);
      return NextResponse.json({ error: 'Payload JSON inválido.' }, { status: 400 });
    }

    console.log('[InfinitePay Webhook] Evento recebido:', JSON.stringify(body, null, 2));

    // 1. Extração do Status / Tipo do Evento
    const rawStatus = (
      body.status ||
      body.transaction_status ||
      body.payment_status ||
      body.data?.status ||
      body.data?.transaction?.status ||
      body.data?.transaction_status ||
      ''
    ).toString().toLowerCase().trim();

    const rawEvent = (
      body.event ||
      body.data?.event ||
      body.type ||
      ''
    ).toString().toLowerCase().trim();

    // Verificação de aprovação (InfinitePay/CloudWalk aceita: paid, approved, settled, completed, success)
    const isApproved =
      ['paid', 'approved', 'settled', 'completed', 'success', 'authorized'].includes(rawStatus) ||
      rawEvent.includes('approved') ||
      rawEvent.includes('paid') ||
      rawEvent.includes('settled') ||
      rawEvent.includes('received') ||
      rawEvent.includes('successful');

    if (!isApproved && rawStatus !== '' && rawEvent !== '') {
      console.log(`[InfinitePay Webhook] Evento ignorado (status não liquidado): status="${rawStatus}", event="${rawEvent}"`);
      return NextResponse.json({ message: 'Evento recebido, mas status não é de aprovação.' }, { status: 200 });
    }

    // 2. Extração dos Identificadores do Pagador e Transação
    const payerEmail = (
      body.data?.customer?.email ||
      body.data?.payer?.email ||
      body.data?.client?.email ||
      body.customer?.email ||
      body.payer?.email ||
      body.client?.email ||
      body.metadata?.email ||
      body.metadata?.userEmail ||
      body.data?.metadata?.email ||
      body.email ||
      ''
    ).toString().toLowerCase().trim();

    const userId = (
      body.metadata?.userId ||
      body.metadata?.user_id ||
      body.data?.metadata?.userId ||
      body.data?.metadata?.user_id ||
      body.order_nsu ||
      body.data?.order_nsu ||
      ''
    ).toString().trim();

    const transactionId = (
      body.id ||
      body.transaction_id ||
      body.data?.id ||
      body.data?.transaction_id ||
      body.nsu ||
      body.data?.nsu ||
      'infinitepay_' + Date.now()
    ).toString().trim();

    console.log(`[InfinitePay Webhook] Processando aprovação: email="${payerEmail}", userId="${userId}", txId="${transactionId}"`);

    if (!payerEmail && !userId) {
      console.warn('[InfinitePay Webhook] Aviso: Nenhum e-mail ou userId foi encontrado no payload.');
      return NextResponse.json({
        message: 'Webhook recebido, porém dados do pagador estão incompletos.',
        received: true,
      }, { status: 200 });
    }

    const supabase = createAdminClient();

    // 3. Busca do perfil no Supabase
    let matchedProfile: any = null;

    if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      const { data: profileById } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (profileById) matchedProfile = profileById;
    }

    if (!matchedProfile && payerEmail) {
      const { data: profileByEmail } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', payerEmail)
        .single();
      if (profileByEmail) matchedProfile = profileByEmail;
    }

    // 4. Data de validade: 30 dias a partir de agora
    const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const nowIso = new Date().toISOString();

    if (matchedProfile) {
      // Atualiza o perfil existente
      const updatePayload: Record<string, any> = {
        subscription_status: 'active',
        updated_at: nowIso,
      };

      // Tenta atualizar com expires_at; se a coluna não existir, faz fallback
      let { error: updateError } = await supabase
        .from('profiles')
        .update({
          ...updatePayload,
          expires_at: newExpiresAt,
        })
        .eq('id', matchedProfile.id);

      if (updateError && updateError.message?.toLowerCase().includes('expires_at')) {
        const fallback = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('id', matchedProfile.id);
        updateError = fallback.error;
      }

      if (updateError) {
        console.error('[InfinitePay Webhook] Erro ao atualizar perfil:', updateError);
        return NextResponse.json({ error: 'Erro ao persistir status no banco de dados.' }, { status: 500 });
      }

      console.log(`[InfinitePay Webhook] ✅ Licença Pro ativada com sucesso por 30 dias para o perfil: ${matchedProfile.email}`);
    } else if (payerEmail) {
      // Caso o usuário ainda não tenha feito login, tenta localizar no auth.users
      console.log(`[InfinitePay Webhook] Perfil não encontrado previamente. Buscando em auth.users para ${payerEmail}...`);
      
      try {
        const { data: listData } = await supabase.auth.admin.listUsers();
        const foundUser = listData?.users?.find(
          (u) => (u.email || '').toLowerCase().trim() === payerEmail
        );

        if (foundUser) {
          const upsertPayload: Record<string, any> = {
            id: foundUser.id,
            email: payerEmail,
            role: 'user',
            subscription_status: 'active',
            updated_at: nowIso,
            created_at: nowIso,
          };

          let { error: upsertErr } = await supabase
            .from('profiles')
            .upsert({ ...upsertPayload, expires_at: newExpiresAt });

          if (upsertErr && upsertErr.message?.toLowerCase().includes('expires_at')) {
            const fallback = await supabase.from('profiles').upsert(upsertPayload);
            upsertErr = fallback.error;
          }

          if (upsertErr) {
            console.error('[InfinitePay Webhook] Erro no upsert do perfil:', upsertErr);
          } else {
            console.log(`[InfinitePay Webhook] ✅ Perfil provisionado e licença ativada para ${payerEmail}`);
          }
        } else {
          console.warn(`[InfinitePay Webhook] Usuário ${payerEmail} ainda não possui conta no Supabase. A liberação será concluída assim que criar conta.`);
        }
      } catch (authErr) {
        console.error('[InfinitePay Webhook] Erro ao verificar auth.users:', authErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Webhook InfinitePay processado com sucesso. Licença ativada.',
        transactionId,
        expires_at: newExpiresAt,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erro interno';
    console.error('[InfinitePay Webhook] Erro não tratado:', err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
