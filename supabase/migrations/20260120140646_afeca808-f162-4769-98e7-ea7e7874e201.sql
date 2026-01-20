-- Fix discount_codes RLS: remove restrictive admin ALL policy that blocks non-admin SELECT
DROP POLICY IF EXISTS "Admins can manage discount codes" ON public.discount_codes;

-- Admins: can view all discount codes
CREATE POLICY "Admins can view all discount codes"
ON public.discount_codes
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Admins: can insert discount codes
CREATE POLICY "Admins can insert discount codes"
ON public.discount_codes
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Admins: can update discount codes
CREATE POLICY "Admins can update discount codes"
ON public.discount_codes
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Admins: can delete discount codes
CREATE POLICY "Admins can delete discount codes"
ON public.discount_codes
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));