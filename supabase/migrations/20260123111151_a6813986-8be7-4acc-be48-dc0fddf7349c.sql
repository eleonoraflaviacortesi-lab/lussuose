-- Add sedi array for multi-sede coordinators
ALTER TABLE public.profiles 
ADD COLUMN sedi TEXT[] DEFAULT '{}';

-- Initialize sedi with current sede value for all users
UPDATE public.profiles 
SET sedi = ARRAY[sede];

-- Update clienti RLS policy to support multi-sede coordinators
DROP POLICY IF EXISTS "Coordinators can view sede clients" ON public.clienti;
CREATE POLICY "Coordinators can view sede clients"
ON public.clienti FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = ANY (ARRAY['coordinatore'::text, 'admin'::text])
      AND (profiles.sede = clienti.sede OR clienti.sede = ANY(profiles.sedi))
  )
);

DROP POLICY IF EXISTS "Coordinators can update clients" ON public.clienti;
CREATE POLICY "Coordinators can update clients"
ON public.clienti FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = ANY (ARRAY['coordinatore'::text, 'admin'::text])
      AND (profiles.sede = clienti.sede OR clienti.sede = ANY(profiles.sedi))
  )
);

DROP POLICY IF EXISTS "Coordinators can delete clients" ON public.clienti;
CREATE POLICY "Coordinators can delete clients"
ON public.clienti FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = ANY (ARRAY['coordinatore'::text, 'admin'::text])
      AND (profiles.sede = clienti.sede OR clienti.sede = ANY(profiles.sedi))
  )
);