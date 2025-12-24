-- Allow admins to view all scoring results
CREATE POLICY "Admins can view all scoring results"
ON public.scoring_results
FOR SELECT
USING (has_role(auth.uid(), 'admin'));