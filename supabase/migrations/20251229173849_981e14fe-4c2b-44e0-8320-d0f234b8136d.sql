-- Tighten RLS on pending_orders (remove overly permissive policy)
DROP POLICY IF EXISTS "Service role can access all pending orders" ON public.pending_orders;

-- Allow users to delete their own pending orders
CREATE POLICY "Users can delete their own pending orders"
  ON public.pending_orders
  FOR DELETE
  USING (auth.uid() = user_id);
