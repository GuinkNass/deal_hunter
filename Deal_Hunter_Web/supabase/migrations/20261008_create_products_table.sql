-- ==============================================================================
-- SCHEMA & TABELA: products (Deal Hunter Pro Showcase)
-- Objetivo: Armazenamento e indexação otimizada de produtos para vitrine dinâmica
-- ==============================================================================

-- 1. Habilita extensão para geração de UUID se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Criação da Tabela products
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    promotional_price NUMERIC(10, 2) CHECK (promotional_price IS NULL OR promotional_price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    image_url TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Índices Estratégicos de Performance
-- Índice de unicidade no slug (busca direta de PDP e SEO)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);

-- Índice de filtragem de status ativo
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

-- Índice de ordenação por data de criação (para vitrines 'Mais Recentes')
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- Índice composto otimizado: busca produtos ativos ordenados por data (Zero table-scan na vitrine)
CREATE INDEX IF NOT EXISTS idx_products_active_created ON public.products(is_active, created_at DESC)
WHERE is_active = true;

-- 4. Trigger para atualização automática da coluna updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_products_updated_at ON public.products;
CREATE TRIGGER trigger_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. Segurança: Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Política 1: Leitura pública para todos os visitantes apenas em produtos ativos
CREATE POLICY "Permitir leitura pública de produtos ativos"
    ON public.products
    FOR SELECT
    USING (is_active = true);

-- Política 2: Inserção e atualização liberadas para o serviço backend (Service Role)
CREATE POLICY "Permitir gerenciamento total via service_role"
    ON public.products
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 6. Carga Inicial de Teste (Seed de Demonstração)
INSERT INTO public.products (title, slug, price, promotional_price, stock, image_url, is_active)
VALUES
(
    'Fritadeira Sem Óleo Air Fryer 4L Inox Touch',
    'fritadeira-sem-oleo-air-fryer-4l-inox-touch',
    389.90,
    279.90,
    45,
    'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80',
    true
),
(
    'Echo Dot 5ª Geração Smart Speaker com Alexa',
    'echo-dot-5-geracao-smart-speaker-alexa',
    429.00,
    249.00,
    120,
    'https://images.unsplash.com/photo-1543512214-318c7553f230?auto=format&fit=crop&w=800&q=80',
    true
),
(
    'SSD NVMe M.2 1TB Leitura 3500MB/s Alta Performance',
    'ssd-nvme-m2-1tb-3500mbs',
    450.00,
    319.90,
    18,
    'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80',
    true
),
(
    'Fone de Ouvido Bluetooth com Cancelamento de Ruído ANC',
    'fone-bluetooth-anc-noise-cancelling',
    299.00,
    NULL,
    0, -- Teste de estoque esgotado
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    true
)
ON CONFLICT (slug) DO NOTHING;
