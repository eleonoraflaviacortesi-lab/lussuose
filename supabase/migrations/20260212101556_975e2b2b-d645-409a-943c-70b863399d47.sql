
-- Allow any authenticated user to insert notifications (for @mention tagging)
DROP POLICY IF EXISTS "Coordinators can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');
