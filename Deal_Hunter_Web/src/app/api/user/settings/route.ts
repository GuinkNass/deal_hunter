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
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.warn('[Settings GET] Aviso ao carregar perfil:', error.message);
    }

    let activeMlToken = profile?.ml_api_key || profile?.ml_access_token || '';
    if (!activeMlToken) {
      const { data: latestProf } = await supabase
        .from('profiles')
        .select('ml_api_key, ml_access_token')
        .not('ml_api_key', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latestProf?.ml_api_key) activeMlToken = latestProf.ml_api_key;
      else if (latestProf?.ml_access_token) activeMlToken = latestProf.ml_access_token;
    }

    return NextResponse.json({
      success: true,
      data: {
        gemini_api_key: profile?.gemini_api_key || '',
        gemini_model: (profile?.gemini_model && !profile.gemini_model.includes('1.5') && !profile.gemini_model.includes('2.5')) ? profile.gemini_model : 'gemini-3.8-flash',
        ml_api_key: activeMlToken,
        ml_client_id: profile?.ml_client_id || '226238620730357',
        ml_client_secret: profile?.ml_client_secret || 'dsjLowWybTxjm2I3EKo6PThe3X4oCEMO',
        telegram_bot_token: profile?.telegram_bot_token || '',
        telegram_chat_id: profile?.telegram_chat_id || '',
        desired_margin: profile?.desired_margin ?? 20,
        min_roi_alert: profile?.min_roi_alert ?? 25,
        tax_percent: profile?.tax_percent ?? 6,
        fee_classico_percent: profile?.fee_classico_percent ?? 12,
        fee_premium_percent: profile?.fee_premium_percent ?? 17,
        fixed_fee_under_79: profile?.fixed_fee_under_79 ?? 6,
        packaging_cost: profile?.packaging_cost ?? 3.5,
        min_price_filter: profile?.min_price_filter ?? 15,
        max_price_filter: profile?.max_price_filter ?? 50000,
        excluded_keywords: profile?.excluded_keywords || '',
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
    const {
      gemini_api_key,
      gemini_model,
      ml_api_key,
      ml_client_id,
      ml_client_secret,
      telegram_bot_token,
      telegram_chat_id,
      desired_margin,
      min_roi_alert,
      tax_percent,
      fee_classico_percent,
      fee_premium_percent,
      fixed_fee_under_79,
      packaging_cost,
      min_price_filter,
      max_price_filter,
      excluded_keywords,
    } = body;

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (gemini_api_key !== undefined) {
      let k = gemini_api_key ? String(gemini_api_key).trim() : null;
      if (k && !k.startsWith('AIzaSy') && !k.startsWith('AQ.')) {
        k = `AQ.${k}`;
      }
      updates.gemini_api_key = k;
    }
    if (gemini_model !== undefined) {
      const m = gemini_model ? String(gemini_model).trim() : '';
      updates.gemini_model = (!m.includes('1.5') && !m.includes('2.0') && !m.includes('2.5') && m.length > 0) ? m : 'gemini-3.8-flash';
    }
    if (ml_api_key !== undefined) updates.ml_api_key = ml_api_key ? String(ml_api_key).trim() : null;
    if (ml_client_id !== undefined) {
      let cid = ml_client_id ? String(ml_client_id).trim() : null;
      if (cid === '26238620730357') cid = '226238620730357';
      updates.ml_client_id = cid;
    }
    if (ml_client_secret !== undefined) updates.ml_client_secret = ml_client_secret ? String(ml_client_secret).trim() : null;
    if (telegram_bot_token !== undefined) updates.telegram_bot_token = telegram_bot_token ? String(telegram_bot_token).trim() : null;
    if (telegram_chat_id !== undefined) updates.telegram_chat_id = telegram_chat_id ? String(telegram_chat_id).trim() : null;
    if (desired_margin !== undefined) updates.desired_margin = Number(desired_margin);
    if (min_roi_alert !== undefined) updates.min_roi_alert = Number(min_roi_alert);
    if (tax_percent !== undefined) updates.tax_percent = Number(tax_percent);
    if (fee_classico_percent !== undefined) updates.fee_classico_percent = Number(fee_classico_percent);
    if (fee_premium_percent !== undefined) updates.fee_premium_percent = Number(fee_premium_percent);
    if (fixed_fee_under_79 !== undefined) updates.fixed_fee_under_79 = Number(fixed_fee_under_79);
    if (packaging_cost !== undefined) updates.packaging_cost = Number(packaging_cost);
    if (min_price_filter !== undefined) updates.min_price_filter = Number(min_price_filter);
    if (max_price_filter !== undefined) updates.max_price_filter = Number(max_price_filter);
    if (excluded_keywords !== undefined) updates.excluded_keywords = excluded_keywords ? String(excluded_keywords).trim() : null;

    let currentUpdates = { ...updates };
    let success = false;
    let attempts = 0;

    while (!success && attempts < 15) {
      attempts++;
      const { error: updateError } = await supabase
        .from('profiles')
        .update(currentUpdates)
        .eq('id', user.id);

      if (!updateError) {
        success = true;
        break;
      }

      // Detecta coluna ausente no schema do Supabase e remove defensivamente
      const match = updateError.message?.match(/Could not find the '([^']+)' column of 'profiles'/i);
      if (match && match[1]) {
        const missingCol = match[1];
        console.warn(`[Settings API] Coluna '${missingCol}' ausente em profiles. Removendo do update.`);
        delete currentUpdates[missingCol];
      } else {
        throw updateError;
      }
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
