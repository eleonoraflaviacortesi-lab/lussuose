-- 1. Restrict profiles SELECT to authenticated users only
DROP POLICY IF EXISTS "Anyone can view profiles for login" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 2. Public RPC for the login picker that returns ONLY minimal account info
CREATE OR REPLACE FUNCTION public.get_login_accounts()
RETURNS TABLE (
  user_id uuid,
  full_name text,
  avatar_emoji text,
  sede text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id, full_name, avatar_emoji, sede
  FROM public.profiles
  ORDER BY full_name;
$$;

GRANT EXECUTE ON FUNCTION public.get_login_accounts() TO anon, authenticated;

-- 3. Tighten sede_targets write policies (drop overly permissive `true` checks)
DROP POLICY IF EXISTS "All authenticated users can insert sede targets" ON public.sede_targets;
DROP POLICY IF EXISTS "All authenticated users can update sede targets" ON public.sede_targets;
DROP POLICY IF EXISTS "All authenticated users can delete sede targets" ON public.sede_targets;

CREATE POLICY "Coordinators can insert sede targets"
ON public.sede_targets
FOR INSERT
TO authenticated
WITH CHECK (public.is_coordinator_or_admin(auth.uid()));

CREATE POLICY "Coordinators can update sede targets"
ON public.sede_targets
FOR UPDATE
TO authenticated
USING (public.is_coordinator_or_admin(auth.uid()))
WITH CHECK (public.is_coordinator_or_admin(auth.uid()));

CREATE POLICY "Coordinators can delete sede targets"
ON public.sede_targets
FOR DELETE
TO authenticated
USING (public.is_coordinator_or_admin(auth.uid()));