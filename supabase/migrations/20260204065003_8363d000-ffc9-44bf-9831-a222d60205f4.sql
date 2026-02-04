-- Fix function search_path warning
CREATE OR REPLACE FUNCTION generate_iban_virtual()
RETURNS TEXT AS $$
DECLARE
  iban TEXT;
BEGIN
  iban := 'PV' || LPAD(FLOOR(RANDOM() * 10000000000000000)::TEXT, 16, '0');
  RETURN iban;
END;
$$ LANGUAGE plpgsql
SET search_path = public;