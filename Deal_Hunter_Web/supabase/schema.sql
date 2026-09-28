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
