-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Coordinators can insert sede targets" ON public.sede_targets;
DROP POLICY IF EXISTS "Coordinators can update sede targets" ON public.sede_targets;
DROP POLICY IF EXISTS "Coordinators can delete sede targets" ON public.sede_targets;

-- Create new policies that allow all authenticated users
CREATE POLICY "All authenticated users can insert sede targets"
ON public.sede_targets
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "All authenticated users can update sede targets"
ON public.sede_targets
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "All authenticated users can delete sede targets"
ON public.sede_targets
FOR DELETE
TO authenticated
USING (true);