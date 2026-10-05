import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { analyzeOpportunityWithGemini } from '@/lib/ml-radar/gemini';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    const supabase = createAdminClient();
    let geminiApiKey = process.env.GEMINI_API_KEY || '';

    if (token) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser(token);
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('gemini_api_key')
            .eq('id', user.id)
            .maybeSingle();

          if (profile?.gemini_api_key) {
            geminiApiKey = profile.gemini_api_key;
          }
        }
      } catch {}
    }

    const body = await req.json();
    const { title, sourcePrice, mlPrice, store, netProfit, roiPercent, marginPercent } = body;

    if (!title || sourcePrice === undefined) {
      return NextResponse.json({ success: false, error: 'Dados insuficientes' }, { status: 400 });
    }

    const numSourcePrice = Number(sourcePrice);
    const numMlPrice = Number(mlPrice || numSourcePrice * 1.35);
    const numNetProfit = Number(netProfit ?? (numMlPrice - numSourcePrice) * 0.7);
    const numRoiPercent = Number(roiPercent ?? ((numMlPrice - numSourcePrice) / numSourcePrice) * 100);
    const numMarginPercent = Number(marginPercent ?? ((numMlPrice - numSourcePrice) / numMlPrice) * 100);

    const audit = await analyzeOpportunityWithGemini({
      apiKey: geminiApiKey,
      sourceTitle: title,
      store: store || 'Amazon',
      sourcePrice: numSourcePrice,
      mlTitle: title,
      mlPrice: numMlPrice,
      netProfit: numNetProfit,
      roiPercent: numRoiPercent,
      marginPercent: numMarginPercent,
    });

    return NextResponse.json({
      success: true,
      audit,
    });
  } catch (err: any) {
    console.error('[API ML Radar Audit] Erro:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
