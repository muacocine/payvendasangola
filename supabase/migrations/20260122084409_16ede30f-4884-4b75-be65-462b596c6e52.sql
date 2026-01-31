-- Add referral columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(user_id),
ADD COLUMN IF NOT EXISTS referral_earnings NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;

-- Generate unique referral codes for existing users
UPDATE public.profiles 
SET referral_code = 'BIO' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6))
WHERE referral_code IS NULL;

-- Create referrals tracking table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(user_id),
  referred_id UUID NOT NULL REFERENCES public.profiles(user_id),
  status TEXT DEFAULT 'pending',
  commission_earned NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  activated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(referred_id)
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referrals
CREATE POLICY "Users can view their referrals" ON public.referrals
FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "System can insert referrals" ON public.referrals
FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update referrals" ON public.referrals
FOR UPDATE USING (true);

-- Admins can view all
CREATE POLICY "Admins can view all referrals" ON public.referrals
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to generate referral code on new user
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := 'BIO' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NEW.user_id::TEXT), 1, 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-generating referral codes
DROP TRIGGER IF EXISTS generate_referral_code_trigger ON public.profiles;
CREATE TRIGGER generate_referral_code_trigger
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.generate_referral_code();

-- Function to process referral commission (5% of trading profits)
CREATE OR REPLACE FUNCTION public.process_referral_commission(
  _user_id UUID,
  _profit_amount NUMERIC
)
RETURNS VOID AS $$
DECLARE
  _referrer_id UUID;
  _commission NUMERIC;
BEGIN
  -- Only process if profit is positive
  IF _profit_amount <= 0 THEN
    RETURN;
  END IF;
  
  -- Find referrer
  SELECT referred_by INTO _referrer_id
  FROM public.profiles
  WHERE user_id = _user_id;
  
  IF _referrer_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Calculate 5% commission
  _commission := _profit_amount * 0.05;
  
  -- Update referrer earnings
  UPDATE public.profiles
  SET referral_earnings = COALESCE(referral_earnings, 0) + _commission,
      balance = COALESCE(balance, 0) + _commission
  WHERE user_id = _referrer_id;
  
  -- Update referral record
  UPDATE public.referrals
  SET commission_earned = COALESCE(commission_earned, 0) + _commission
  WHERE referrer_id = _referrer_id AND referred_id = _user_id;
  
  -- Create notification for referrer
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (
    _referrer_id,
    'referral_commission',
    'Comissão de Afiliado',
    'Você ganhou ' || _commission || ' AOA de comissão do seu afiliado!'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;