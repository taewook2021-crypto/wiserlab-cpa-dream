-- Add exam_number column to orders table for paid users
ALTER TABLE public.orders ADD COLUMN exam_number TEXT UNIQUE;

-- Create index for faster lookup
CREATE INDEX idx_orders_exam_number ON public.orders(exam_number);