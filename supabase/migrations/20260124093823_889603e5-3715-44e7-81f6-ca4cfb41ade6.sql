-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Only coordinators can insert sede targets" ON public.sede_targets;
DROP POLICY IF EXISTS "Only coordinators can update sede targets" ON public.sede_targets;
DROP POLICY IF EXISTS "Only coordinators can delete sede targets" ON public.sede_targets;

-- Create new policies allowing all authenticated users
CREATE POLICY "All authenticated users can insert sede targets"
ON public.sede_targets
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "All authenticated users can update sede targets"
ON public.sede_targets
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "All authenticated users can delete sede targets"
ON public.sede_targets
FOR DELETE
TO authenticated
USING (true);