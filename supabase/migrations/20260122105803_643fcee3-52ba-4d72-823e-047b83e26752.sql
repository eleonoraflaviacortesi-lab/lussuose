-- Create a security definer function to check user role safely
CREATE OR REPLACE FUNCTION public.is_coordinator_or_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND role = ANY (ARRAY['coordinatore'::text, 'admin'::text])
  )
$$;

-- Drop existing policies that might cause issues
DROP POLICY IF EXISTS "Coordinators can manage sede targets" ON public.sede_targets;

-- Recreate INSERT policy using the security definer function
CREATE POLICY "Coordinators can insert sede targets"
ON public.sede_targets
FOR INSERT
TO authenticated
WITH CHECK (public.is_coordinator_or_admin(auth.uid()));

-- Recreate UPDATE policy using the security definer function
CREATE POLICY "Coordinators can update sede targets"
ON public.sede_targets
FOR UPDATE
TO authenticated
USING (public.is_coordinator_or_admin(auth.uid()));

-- Recreate DELETE policy using the security definer function  
CREATE POLICY "Coordinators can delete sede targets"
ON public.sede_targets
FOR DELETE
TO authenticated
USING (public.is_coordinator_or_admin(auth.uid()));