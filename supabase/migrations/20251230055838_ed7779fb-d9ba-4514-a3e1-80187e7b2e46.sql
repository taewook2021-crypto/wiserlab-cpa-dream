-- 1. Remove exam_number column from orders table
ALTER TABLE public.orders DROP COLUMN IF EXISTS exam_number;

-- 2. Add user_id column to exam_numbers table for permanent code linking
ALTER TABLE public.exam_numbers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Update RLS policy to allow users to link their own code
DROP POLICY IF EXISTS "Users can mark exam number as used" ON public.exam_numbers;

CREATE POLICY "Users can link exam number to their account"
  ON public.exam_numbers
  FOR UPDATE
  USING (is_used = false OR user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. Add policy for users to view their linked codes
CREATE POLICY "Users can view their linked codes"
  ON public.exam_numbers
  FOR SELECT
  USING (user_id = auth.uid());