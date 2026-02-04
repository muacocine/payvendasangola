-- Create function to generate IBAN virtual
CREATE OR REPLACE FUNCTION generate_iban_virtual()
RETURNS TEXT AS $$
DECLARE
  iban TEXT;
BEGIN
  iban := 'PV' || LPAD(FLOOR(RANDOM() * 10000000000000000)::TEXT, 16, '0');
  RETURN iban;
END;
$$ LANGUAGE plpgsql;

-- Update existing profiles without IBAN
UPDATE profiles 
SET iban_virtual = generate_iban_virtual()
WHERE iban_virtual IS NULL;

-- Create or replace the trigger function for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_iban TEXT;
  new_referral_code TEXT;
BEGIN
  -- Generate unique IBAN
  new_iban := 'PV' || LPAD(FLOOR(RANDOM() * 10000000000000000)::TEXT, 16, '0');
  
  -- Generate referral code from user id
  new_referral_code := UPPER(SUBSTRING(NEW.id::TEXT, 1, 8));
  
  INSERT INTO public.profiles (
    user_id,
    full_name,
    phone,
    iban_virtual,
    referral_code,
    balance,
    bonus_balance,
    wallet_activated,
    kyc_status,
    signup_bonus_claimed
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    new_iban,
    new_referral_code,
    0,
    0,
    true,  -- Wallet is free now
    'pending',
    false
  );
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();