-- ==============================================================================
-- DEAL HUNTER — SUPABASE DATABASE MIGRATION SCRIPT
-- Módulo: Perfis de Usuário, RBAC (Role-Based Access Control) e Assinaturas Stripe
-- Conta Master / Admin Permanente: guilherme.r.nascimento@live.com
-- ==============================================================================

-- 1. Criação do tipo enum de status de assinatura (opcional, ou validação via CHECK)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    subscription_status TEXT NOT NULL DEFAULT 'inactive' CHECK (
        subscription_status IN (
            'active',
            'past_due',
            'canceled',
            'incomplete',
            'incomplete_expired',
            'trialing',
            'unpaid',
            'inactive'
        )
    ),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Índices para buscas ultrarrápidas em webhooks e verificações de licença
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON public.profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription ON public.profiles(stripe_subscription_id);

-- 2. Habilitação do Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Segurança RLS Estritas
-- O próprio usuário autenticado pode ler apenas o seu perfil
DROP POLICY IF EXISTS "Usuário pode visualizar seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuário pode visualizar seu próprio perfil"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- O usuário autenticado pode atualizar apenas dados não sensíveis do seu perfil (se necessário)
-- OBS: role, stripe_customer_id, stripe_subscription_id e subscription_status são atualizados via Service Role (Webhook)
DROP POLICY IF EXISTS "Usuário pode atualizar campos básicos do seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuário pode atualizar campos básicos do seu próprio perfil"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Função e Trigger para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 5. Função e Trigger para Auto-Provisionamento de Novos Usuários (auth.users -> public.profiles)
-- Regra Estrita: Se o e-mail for guilherme.r.nascimento@live.com, atribui role = 'admin' e status = 'active'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    is_master_admin BOOLEAN;
BEGIN
    -- Verifica se o novo usuário cadastrado é o Administrador Master
    is_master_admin := (LOWER(TRIM(NEW.email)) = 'guilherme.r.nascimento@live.com');

    INSERT INTO public.profiles (
        id,
        email,
        role,
        stripe_customer_id,
        stripe_subscription_id,
        subscription_status,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        LOWER(TRIM(NEW.email)),
        CASE WHEN is_master_admin THEN 'admin' ELSE 'user' END,
        NULL,
        NULL,
        CASE WHEN is_master_admin THEN 'active' ELSE 'inactive' END,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        role = CASE 
            WHEN LOWER(TRIM(EXCLUDED.email)) = 'guilherme.r.nascimento@live.com' THEN 'admin' 
            ELSE profiles.role 
        END,
        subscription_status = CASE 
            WHEN LOWER(TRIM(EXCLUDED.email)) = 'guilherme.r.nascimento@live.com' THEN 'active' 
            ELSE profiles.subscription_status 
        END,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 6. QUERY DE SEED / UPDATE MANUAL DE SEGURANÇA (Garantia de Acesso Vitalício do Admin)
-- Esta query pode ser executada a qualquer momento no SQL Editor do Supabase
UPDATE public.profiles
SET 
    role = 'admin',
    subscription_status = 'active',
    updated_at = NOW()
WHERE LOWER(TRIM(email)) = 'guilherme.r.nascimento@live.com';

-- ==============================================================================
-- 7. ETAPA 2: CONFIGURAÇÕES INDIVIDUAIS POR USUÁRIO (APIs & TELEGRAM PRIVADO)
-- Campos adicionados à tabela profiles para cada usuário gerenciar suas chaves
-- ==============================================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ml_api_key TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ml_client_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ml_client_secret TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telegram_bot_token TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS desired_margin NUMERIC DEFAULT 20;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tax_percent NUMERIC DEFAULT 6;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fee_classico_percent NUMERIC DEFAULT 12;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fee_premium_percent NUMERIC DEFAULT 17;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fixed_fee_under_79 NUMERIC DEFAULT 6;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS packaging_cost NUMERIC DEFAULT 3.5;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS min_price_filter NUMERIC DEFAULT 15;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS max_price_filter NUMERIC DEFAULT 50000;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS excluded_keywords TEXT;

-- ==============================================================================
-- 8. ETAPA 1: TABELA ML_RADAR_DEALS & REGRA DE RETENÇÃO AUTOMÁTICA (FIFO 100)
-- Histórico individual indexado por user_id limitado aos 100 itens mais recentes
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ml_radar_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    original_price NUMERIC(12, 2),
    image_url TEXT,
    product_url TEXT NOT NULL,
    store TEXT NOT NULL DEFAULT 'Online',
    ml_title TEXT,
    ml_price NUMERIC(12, 2),
    ml_url TEXT,
    ml_image_url TEXT,
    net_profit NUMERIC(12, 2),
    roi_percent NUMERIC(8, 2),
    margin_percent NUMERIC(8, 2),
    verdict TEXT,
    gemini_analysis JSONB,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Índices obrigatórios por user_id e created_at
CREATE INDEX IF NOT EXISTS idx_ml_radar_deals_user_id ON public.ml_radar_deals(user_id);
CREATE INDEX IF NOT EXISTS idx_ml_radar_deals_created_at ON public.ml_radar_deals(created_at DESC);

-- Habilitação de RLS em ml_radar_deals
ALTER TABLE public.ml_radar_deals ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS: o usuário acessa e gerencia estritamente os seus próprios dados
DROP POLICY IF EXISTS "Usuário visualiza suas próprias ofertas ml_radar" ON public.ml_radar_deals;
CREATE POLICY "Usuário visualiza suas próprias ofertas ml_radar"
ON public.ml_radar_deals
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário insere suas próprias ofertas ml_radar" ON public.ml_radar_deals;
CREATE POLICY "Usuário insere suas próprias ofertas ml_radar"
ON public.ml_radar_deals
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário atualiza suas próprias ofertas ml_radar" ON public.ml_radar_deals;
CREATE POLICY "Usuário atualiza suas próprias ofertas ml_radar"
ON public.ml_radar_deals
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário deleta suas próprias ofertas ml_radar" ON public.ml_radar_deals;
CREATE POLICY "Usuário deleta suas próprias ofertas ml_radar"
ON public.ml_radar_deals
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Regra/Trigger de Retenção FIFO Automática (Limite de 100 itens por usuário)
-- Mantém estritamente os últimos 100 itens por user_id, excluindo os mais antigos
CREATE OR REPLACE FUNCTION public.handle_ml_radar_fifo_retention()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.ml_radar_deals
    WHERE id IN (
        SELECT id FROM public.ml_radar_deals
        WHERE user_id = NEW.user_id
        ORDER BY created_at DESC
        OFFSET 100
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_ml_radar_fifo ON public.ml_radar_deals;
CREATE TRIGGER trigger_ml_radar_fifo
AFTER INSERT ON public.ml_radar_deals
FOR EACH ROW
EXECUTE FUNCTION public.handle_ml_radar_fifo_retention();

-- ==============================================================================
-- 9. TABELA DE SIMULAÇÕES SALVAS DA CALCULADORA DE MARGEM (POR USUÁRIO)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.margin_calculations (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    analysis_id UUID,
    ml_price NUMERIC(12, 2) NOT NULL,
    listing_type TEXT NOT NULL DEFAULT 'gold_pro',
    product_cost NUMERIC(12, 2) NOT NULL,
    tax_percent NUMERIC(6, 2) DEFAULT 0,
    free_shipping_auto BOOLEAN DEFAULT TRUE,
    custom_shipping_enabled BOOLEAN DEFAULT FALSE,
    shipping_cost NUMERIC(12, 2) DEFAULT 0,
    packaging_cost NUMERIC(12, 2) DEFAULT 3.5,
    ads_percent NUMERIC(6, 2) DEFAULT 0,
    return_percent NUMERIC(6, 2) DEFAULT 2.0,
    commission_rate NUMERIC(6, 2) DEFAULT 17.0,
    commission_value NUMERIC(12, 2) DEFAULT 0,
    fixed_fee NUMERIC(12, 2) DEFAULT 0,
    net_profit NUMERIC(12, 2) NOT NULL,
    margin_percent NUMERIC(6, 2) NOT NULL,
    roi_percent NUMERIC(8, 2) NOT NULL,
    break_even_price NUMERIC(12, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_margin_calc_user ON public.margin_calculations(user_id);
ALTER TABLE public.margin_calculations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário gerencia suas próprias simulações" ON public.margin_calculations;
CREATE POLICY "Usuário gerencia suas próprias simulações"
ON public.margin_calculations
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


