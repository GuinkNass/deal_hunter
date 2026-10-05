import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('gemini_api_key, ml_api_key, telegram_bot_token, telegram_chat_id')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: {
        gemini_api_key: profile?.gemini_api_key || '',
        ml_api_key: profile?.ml_api_key || '',
        telegram_bot_token: profile?.telegram_bot_token || '',
        telegram_chat_id: profile?.telegram_chat_id || '',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Erro ao carregar configurações' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });
    }

    const body = await req.json();
    const { gemini_api_key, ml_api_key, telegram_bot_token, telegram_chat_id } = body;

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (gemini_api_key !== undefined) updates.gemini_api_key = gemini_api_key ? String(gemini_api_key).trim() : null;
    if (ml_api_key !== undefined) updates.ml_api_key = ml_api_key ? String(ml_api_key).trim() : null;
    if (telegram_bot_token !== undefined) updates.telegram_bot_token = telegram_bot_token ? String(telegram_bot_token).trim() : null;
    if (telegram_chat_id !== undefined) updates.telegram_chat_id = telegram_chat_id ? String(telegram_chat_id).trim() : null;

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: 'Configurações atualizadas com sucesso!',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Erro ao salvar configurações' },
      { status: 500 }
    );
  }
}
