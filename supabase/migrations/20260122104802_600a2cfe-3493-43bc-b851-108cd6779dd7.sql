-- Drop the restrictive policy and create a permissive one for anonymous access
DROP POLICY IF EXISTS "Users can view all profiles in their sede" ON public.profiles;

-- Create a permissive policy that allows anyone (including unauthenticated) to view profiles
CREATE POLICY "Anyone can view profiles for login"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);