-- Add shipping and phone columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS shipping_address text,
ADD COLUMN IF NOT EXISTS shipping_detail_address text,
ADD COLUMN IF NOT EXISTS shipping_postal_code text;