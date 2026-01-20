-- Remove insecure user_metadata reference in RLS; rely on JWT email claim
DROP POLICY IF EXISTS "Users can view their assigned codes" ON public.discount_codes;

CREATE POLICY "Users can view their assigned codes"
ON public.discount_codes
FOR SELECT
TO authenticated
USING (
  assigned_email IS NOT NULL
  AND lower(assigned_email) = lower(auth.jwt() ->> 'email')
);