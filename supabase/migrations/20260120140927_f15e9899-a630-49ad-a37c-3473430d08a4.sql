-- Update discount_codes SELECT policy to use JWT email claim (more reliable for OAuth providers)
DROP POLICY IF EXISTS "Users can view their assigned codes" ON public.discount_codes;

CREATE POLICY "Users can view their assigned codes"
ON public.discount_codes
FOR SELECT
TO authenticated
USING (
  assigned_email IS NOT NULL
  AND lower(assigned_email) = lower(
    coalesce(
      auth.jwt() ->> 'email',
      auth.jwt() -> 'user_metadata' ->> 'email'
    )
  )
);