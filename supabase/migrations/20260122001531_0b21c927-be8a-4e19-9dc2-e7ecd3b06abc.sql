-- Adicionar campos para controle de bônus e PWA
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pwa_installed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pwa_install_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pwa_bonus_claimed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS signup_bonus_claimed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bonus_balance NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_profit NUMERIC DEFAULT 0;

-- Comentários explicativos
COMMENT ON COLUMN public.profiles.bonus_balance IS 'Saldo de bônus (não pode ser sacado diretamente)';
COMMENT ON COLUMN public.profiles.total_profit IS 'Lucro total do usuário em trading';
COMMENT ON COLUMN public.profiles.pwa_installed IS 'Se o usuário instalou o PWA';