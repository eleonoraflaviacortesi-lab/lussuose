-- Allow agents to insert clients (they will be added to the agent's sede)
CREATE POLICY "Agents can insert clients"
ON public.clienti
FOR INSERT
TO authenticated
WITH CHECK (true);
