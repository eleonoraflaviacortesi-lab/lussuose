-- Remove the policy that allows coordinators to view all notizie
-- Each user should only see their own notizie
DROP POLICY IF EXISTS "Coordinators can view all notizie" ON public.notizie;