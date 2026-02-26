CREATE POLICY "Agents can view sede clients"
ON clienti FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND (profiles.sede = clienti.sede OR clienti.sede = ANY(COALESCE(profiles.sedi, '{}'::text[])))
  )
);