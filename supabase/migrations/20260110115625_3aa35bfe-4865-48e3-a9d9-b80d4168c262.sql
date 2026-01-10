-- Create discount_codes table for university discount codes
CREATE TABLE public.discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_amount INTEGER NOT NULL DEFAULT 20000,
  batch_name TEXT NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  user_id UUID,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage discount codes"
ON public.discount_codes
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Authenticated users can view codes (to validate during payment)
CREATE POLICY "Authenticated users can view discount codes"
ON public.discount_codes
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Authenticated users can update codes they use (mark as used)
CREATE POLICY "Users can use discount codes"
ON public.discount_codes
FOR UPDATE
USING (is_used = false AND auth.uid() IS NOT NULL)
WITH CHECK (user_id = auth.uid() AND is_used = true);

-- Create index for faster code lookups
CREATE INDEX idx_discount_codes_code ON public.discount_codes(code);
CREATE INDEX idx_discount_codes_batch_name ON public.discount_codes(batch_name);