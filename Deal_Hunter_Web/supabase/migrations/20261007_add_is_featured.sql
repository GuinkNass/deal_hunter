-- ==============================================================================
-- MIGRAÇÃO: ADICIONAR SUPORTE A VITRINE PÚBLICA DE OFERTAS (DEAL HUNTER PRO)
-- Data: 2026-10-07
-- ==============================================================================

-- 1. Adicionar colunas necessárias na tabela ml_radar_deals
ALTER TABLE public.ml_radar_deals 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

ALTER TABLE public.ml_radar_deals 
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.ml_radar_deals 
ADD COLUMN IF NOT EXISTS category TEXT;

-- 2. Índice parcial para consultas ultra-rápidas na vitrine pública
CREATE INDEX IF NOT EXISTS idx_ml_radar_deals_featured 
ON public.ml_radar_deals(created_at DESC) 
WHERE is_featured = true;

-- 3. Política de RLS: permite que qualquer visitante (anônimo ou autenticado)
-- visualize publicamente ofertas onde is_featured = true
DROP POLICY IF EXISTS "Qualquer um visualiza ofertas em destaque na vitrine" ON public.ml_radar_deals;
CREATE POLICY "Qualquer um visualiza ofertas em destaque na vitrine"
ON public.ml_radar_deals
FOR SELECT
USING (is_featured = true);
