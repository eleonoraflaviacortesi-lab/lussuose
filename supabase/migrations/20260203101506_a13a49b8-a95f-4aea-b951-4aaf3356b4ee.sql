-- Allow all sede users to create meetings
CREATE POLICY "All sede users can create meetings"
ON public.meetings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND (profiles.sede = meetings.sede OR meetings.sede = ANY(profiles.sedi))
  )
);

-- Allow all sede users to update meetings
CREATE POLICY "All sede users can update meetings"
ON public.meetings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND (profiles.sede = meetings.sede OR meetings.sede = ANY(profiles.sedi))
  )
);

-- Allow all sede users to manage meeting items (INSERT)
CREATE POLICY "All sede users can insert meeting items"
ON public.meeting_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM meetings m
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE m.id = meeting_items.meeting_id
    AND (p.sede = m.sede OR m.sede = ANY(p.sedi))
  )
);

-- Allow all sede users to update meeting items
CREATE POLICY "All sede users can update meeting items"
ON public.meeting_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM meetings m
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE m.id = meeting_items.meeting_id
    AND (p.sede = m.sede OR m.sede = ANY(p.sedi))
  )
);

-- Allow all sede users to delete meeting items
CREATE POLICY "All sede users can delete meeting items"
ON public.meeting_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM meetings m
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE m.id = meeting_items.meeting_id
    AND (p.sede = m.sede OR m.sede = ANY(p.sedi))
  )
);

-- Allow all authenticated users to view all notizie (for meeting searches)
CREATE POLICY "All users can view all notizie for meetings"
ON public.notizie
FOR SELECT
TO authenticated
USING (true);