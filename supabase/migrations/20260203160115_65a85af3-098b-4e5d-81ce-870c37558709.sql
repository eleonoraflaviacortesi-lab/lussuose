-- Remove the overly permissive policy that allows everyone to see all notizie
DROP POLICY IF EXISTS "All users can view all notizie for meetings" ON public.notizie;

-- The existing policy "Users can view their own notizie" with (auth.uid() = user_id) 
-- will now be the only SELECT policy, ensuring users only see their own notizie