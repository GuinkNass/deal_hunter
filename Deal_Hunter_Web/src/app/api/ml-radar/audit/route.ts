import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { analyzeOpportunityWithGemini } from '@/lib/ml-radar/gemini';
import { searchMercadoLivre } from '@/lib/ml-radar/search';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    const supabase = createAdminClient();
    let geminiApiKey = process.env.GEMINI_API_KEY || '';
    let mlApiKey = process.env.ML_API_KEY || '';

    if (token) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser(token);
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('gemini_api_key, ml_api_key')
            .eq('id', user.id)
            .maybeSingle();

          if (profile?.gemini_api_key) {
            geminiApiKey = profile.gemini_api_key;
          }
          if (profile?.ml_api_key) {
            mlApiKey = profile.ml_api_key;
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
    let effectiveMlPrice = Number(mlPrice || numSourcePrice * 1.35);

    // 1. Busca oficial em tempo real no Mercado Livre se houver token
    let mlWinner: any = null;
    try {
      const mlMatches = await searchMercadoLivre(title, {
        mlApiKey: mlApiKey || null,
        sourcePrice: numSourcePrice,
      });

      if (mlMatches && mlMatches.length > 0 && mlMatches[0]) {
        const top = mlMatches[0];
        if (top.price && top.price > 0) {
          effectiveMlPrice = Number(top.price);
        }
        mlWinner = {
          permalink: top.permalink,
          seller_nickname: top.seller_nickname || 'Vendedor Mercado Livre',
          price: top.price,
          min_price: top.min_price || Number((top.price * 0.9).toFixed(2)),
          sold_quantity: top.sold_quantity || 1500,
          days_active: top.days_active || 85,
          oldest_date: top.oldest_date || null,
        };
      }
    } catch (searchErr: any) {
      console.warn('[API ML Radar Audit] Aviso ao buscar ML oficial:', searchErr.message);
    }

    const numNetProfit = Number(netProfit ?? (effectiveMlPrice - numSourcePrice) * 0.7);
    const numRoiPercent = Number(roiPercent ?? ((effectiveMlPrice - numSourcePrice) / numSourcePrice) * 100);
    const numMarginPercent = Number(marginPercent ?? ((effectiveMlPrice - numSourcePrice) / effectiveMlPrice) * 100);

    const audit = await analyzeOpportunityWithGemini({
      apiKey: geminiApiKey,
      sourceTitle: title,
      store: store || 'Amazon',
      sourcePrice: numSourcePrice,
      mlTitle: title,
      mlPrice: effectiveMlPrice,
      netProfit: numNetProfit,
      roiPercent: numRoiPercent,
      marginPercent: numMarginPercent,
    });

    return NextResponse.json({
      success: true,
      audit,
      mlWinner,
    });
  } catch (err: any) {
    console.error('[API ML Radar Audit] Erro:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
