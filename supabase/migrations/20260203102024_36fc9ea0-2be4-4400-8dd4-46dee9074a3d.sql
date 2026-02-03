-- Allow all sede users to delete meetings
CREATE POLICY "All sede users can delete meetings"
ON public.meetings
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND (profiles.sede = meetings.sede OR meetings.sede = ANY(profiles.sedi))
  )
);