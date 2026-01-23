-- Allow agents to update clients assigned to them (for comments and status changes)
CREATE POLICY "Agents can update assigned clients"
ON public.clienti
FOR UPDATE
USING (assigned_to = auth.uid())
WITH CHECK (assigned_to = auth.uid());