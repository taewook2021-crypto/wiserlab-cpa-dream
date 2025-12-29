-- Create pending_orders table for storing order info before payment
CREATE TABLE public.pending_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  order_id TEXT NOT NULL UNIQUE,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT,
  buyer_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_detail_address TEXT,
  shipping_postal_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '1 hour')
);

-- Enable RLS
ALTER TABLE public.pending_orders ENABLE ROW LEVEL SECURITY;

-- Users can insert their own pending orders
CREATE POLICY "Users can insert their own pending orders" 
  ON public.pending_orders 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own pending orders
CREATE POLICY "Users can view their own pending orders" 
  ON public.pending_orders 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Service role can access all (for edge functions)
CREATE POLICY "Service role can access all pending orders" 
  ON public.pending_orders 
  FOR ALL 
  USING (true)
  WITH CHECK (true);