-- Fix generate_iban_virtual function to ensure proper format
CREATE OR REPLACE FUNCTION public.generate_iban_virtual()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  iban TEXT;
BEGIN
  -- Use FLOOR to ensure integer, then pad to 16 digits
  iban := 'PV' || LPAD(FLOOR(RANDOM() * 9999999999999999 + 1)::BIGINT::TEXT, 16, '0');
  RETURN iban;
END;
$function$;

-- Fix handle_new_user to use proper IBAN format
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_iban TEXT;
  new_referral_code TEXT;
BEGIN
  -- Generate unique IBAN with proper integer format
  new_iban := 'PV' || LPAD(FLOOR(RANDOM() * 9999999999999999 + 1)::BIGINT::TEXT, 16, '0');
  
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
    true,
    'pending',
    false
  );
  
  RETURN NEW;
END;
$function$;

-- Fix existing IBANs with incorrect format
UPDATE profiles 
SET iban_virtual = 'PV' || LPAD(FLOOR(RANDOM() * 9999999999999999 + 1)::BIGINT::TEXT, 16, '0')
WHERE iban_virtual LIKE 'PV%.%' OR iban_virtual IS NULL;

-- Grant access to storage buckets for authenticated users (kyc-documents)
CREATE POLICY "Users can upload their own kyc documents" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view their own kyc documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins can view all kyc documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'kyc-documents' AND public.has_role(auth.uid(), 'admin'));

-- Grant access to storage buckets for pdf-products
CREATE POLICY "Users can upload their own pdf products" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'pdf-products' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view approved pdf products"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'pdf-products');

CREATE POLICY "Users can view their own pdf products"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'pdf-products' AND (storage.foldername(name))[1] = auth.uid()::text);