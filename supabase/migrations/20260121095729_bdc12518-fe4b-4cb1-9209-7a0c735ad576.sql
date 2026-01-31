-- Add wallet activation and virtual card fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wallet_activated BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wallet_activation_date TIMESTAMP WITH TIME ZONE;

-- Create chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_chuva BOOLEAN DEFAULT false,
  chuva_amount NUMERIC DEFAULT 0,
  chuva_recipients INTEGER DEFAULT 0,
  chuva_claimed_by UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_deleted BOOLEAN DEFAULT false
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view chat messages"
ON public.chat_messages FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can send messages"
ON public.chat_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can delete messages"
ON public.chat_messages FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create user bans table
CREATE TABLE IF NOT EXISTS public.user_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  banned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  banned_by UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bans"
ON public.user_bans FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own ban"
ON public.user_bans FOR SELECT
USING (auth.uid() = user_id);

-- Create trading history table for real trades
CREATE TABLE IF NOT EXISTS public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pair VARCHAR(20) NOT NULL,
  direction VARCHAR(4) NOT NULL CHECK (direction IN ('call', 'put')),
  amount NUMERIC NOT NULL CHECK (amount >= 50 AND amount <= 5000000),
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC,
  duration_seconds INTEGER NOT NULL,
  is_demo BOOLEAN DEFAULT false,
  is_win BOOLEAN,
  profit_loss NUMERIC,
  admin_commission NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trades"
ON public.trades FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trades"
ON public.trades FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update trades"
ON public.trades FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all trades"
ON public.trades FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Add admin role for isaacmuaco582@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role 
FROM auth.users 
WHERE email = 'isaacmuaco582@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;