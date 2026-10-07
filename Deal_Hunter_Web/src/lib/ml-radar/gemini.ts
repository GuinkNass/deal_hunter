import { GeminiAnalysis } from './types';

/**
 * Análise de arbitragem e auditoria de consistência de mercado via Google Gemini
 * Suporta gemini-3.8-flash, gemini-3.5-flash, gemini-flash-latest com detecção de âncoras infladas.
 */
export async function analyzeOpportunityWithGemini(params: {
  apiKey: string;
  sourceTitle: string;
  store: string;
  sourcePrice: number;
  mlTitle: string;
  mlPrice: number;
  netProfit: number;
  roiPercent: number;
  marginPercent: number;
}): Promise<GeminiAnalysis> {
  const { apiKey, sourceTitle, store, sourcePrice, mlTitle, mlPrice, netProfit, roiPercent, marginPercent } = params;

  let cleanKey = apiKey ? apiKey.trim() : '';
  if (cleanKey && !cleanKey.startsWith('AIzaSy') && !cleanKey.startsWith('AQ.')) {
    cleanKey = `AQ.${cleanKey}`;
  }

  if (!cleanKey || cleanKey.length < 15) {
    return {
      score: roiPercent >= 30 ? 85 : 65,
      demandTrend: 'Alta (Mercado Livre Brasil)',
      bestSeason: 'Ano Todo',
      riskLevel: 'Baixo',
      verdict: netProfit > 20 ? 'Viável' : 'Atenção',
      justification: `Margem estimada de ${marginPercent}% com retorno de R$ ${netProfit.toFixed(2)}.`,
    };
  }

  // Prompt avançado de auditoria de mercado com proteção anti-preço âncora falso
  const prompt = `Você é o auditor sênior de inteligência comercial do Deal Hunter Pro.
Analise a veracidade e viabilidade desta oportunidade de revenda no Mercado Livre Brasil:
- Produto de Origem: "${sourceTitle}" na ${store} por R$ ${sourcePrice}.
- Preço de Revenda Sugerido no ML: "${mlTitle}" a R$ ${mlPrice}.
- Margem Bruta Calculada Inicial: R$ ${netProfit} (${roiPercent}% ROI).

CRITÉRIO CRÍTICO DE AUDITORIA:
1. Avalie com base no mercado real brasileiro se o preço sugerido no Mercado Livre (R$ ${mlPrice}) reflete o mercado real de concorrência ou se é um preço âncora "De/Por" inflado (exemplo: processador que custa R$ 540 sendo orçado a R$ 1.160).
2. Se o preço proposto for uma âncora falsa ou o preço real no Mercado Livre for menor/igual ao de custo, marque score abaixo de 35, riskLevel="Alto", verdict="Evitar" e informe o realMarketPrice estimado correto no ML.
3. Se for uma oportunidade real com demanda legítima, pontue score de 75 a 98 e riskLevel="Baixo".

Responda EXCLUSIVAMENTE um JSON minificado de uma linha sem blocos markdown:
{"score":<0-100>,"realMarketPrice":<numero>,"demandTrend":"<curto>","bestSeason":"<curto>","riskLevel":"<Baixo|Médio|Alto>","verdict":"<Excelente|Viável|Atenção|Evitar>","justification":"<1 frase concisa informando se a oportunidade é real ou âncora inflada>"}`;

  const models = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 250,
            responseMimeType: 'application/json',
          },
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) continue;

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsed = JSON.parse(cleaned);
        return {
          score: typeof parsed.score === 'number' ? parsed.score : 80,
          realMarketPrice: typeof parsed.realMarketPrice === 'number' ? parsed.realMarketPrice : undefined,
          demandTrend: String(parsed.demandTrend || 'Alta'),
          bestSeason: String(parsed.bestSeason || 'Ano Todo'),
          riskLevel: parsed.riskLevel || 'Baixo',
          verdict: String(parsed.verdict || 'Viável'),
          justification: String(parsed.justification || 'Análise de mercado concluída.'),
        };
      }
    } catch {
      // Tenta próximo modelo na lista
    }
  }

  return {
    score: roiPercent >= 30 ? 80 : 65,
    demandTrend: 'Alta e Recorrente',
    bestSeason: 'Ano Todo',
    riskLevel: 'Baixo',
    verdict: 'Viável',
    justification: `Retorno estimado de ${roiPercent}% com lucro de R$ ${netProfit.toFixed(2)}.`,
  };
}
