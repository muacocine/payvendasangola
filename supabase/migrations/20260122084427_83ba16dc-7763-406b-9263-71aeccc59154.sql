-- Drop overly permissive policies
DROP POLICY IF EXISTS "System can insert referrals" ON public.referrals;
DROP POLICY IF EXISTS "System can update referrals" ON public.referrals;

-- Create proper RLS policies
CREATE POLICY "Authenticated users can create referrals" ON public.referrals
FOR INSERT WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Users can update their referrals" ON public.referrals
FOR UPDATE USING (auth.uid() = referrer_id);

-- Fix function search paths
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := 'BIO' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NEW.user_id::TEXT), 1, 6));
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_referral_commission(
  _user_id UUID,
  _profit_amount NUMERIC
)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _referrer_id UUID;
  _commission NUMERIC;
BEGIN
  IF _profit_amount <= 0 THEN
    RETURN;
  END IF;
  
  SELECT referred_by INTO _referrer_id
  FROM public.profiles
  WHERE user_id = _user_id;
  
  IF _referrer_id IS NULL THEN
    RETURN;
  END IF;
  
  _commission := _profit_amount * 0.05;
  
  UPDATE public.profiles
  SET referral_earnings = COALESCE(referral_earnings, 0) + _commission,
      balance = COALESCE(balance, 0) + _commission
  WHERE user_id = _referrer_id;
  
  UPDATE public.referrals
  SET commission_earned = COALESCE(commission_earned, 0) + _commission
  WHERE referrer_id = _referrer_id AND referred_id = _user_id;
  
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (
    _referrer_id,
    'referral_commission',
    'Comissão de Afiliado',
    'Você ganhou ' || _commission || ' AOA de comissão do seu afiliado!'
  );
END;
$$;