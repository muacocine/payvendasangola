-- Criar tabela para PDFs/produtos digitais
CREATE TABLE public.pdf_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  file_url TEXT,
  cover_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  downloads_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pdf_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view approved products" 
ON public.pdf_products 
FOR SELECT 
USING (status = 'approved' OR auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "KYC approved users can create products" 
ON public.pdf_products 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products" 
ON public.pdf_products 
FOR UPDATE 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete products" 
ON public.pdf_products 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_pdf_products_updated_at
BEFORE UPDATE ON public.pdf_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.pdf_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.pdf_products(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pdf_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their purchases" 
ON public.pdf_purchases 
FOR SELECT 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create purchases" 
ON public.pdf_purchases 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public) 
VALUES ('pdf-products', 'pdf-products', false)
ON CONFLICT (id) DO NOTHING;