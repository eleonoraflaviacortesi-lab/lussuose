-- Tabella attività cliente
CREATE TABLE public.cliente_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clienti(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Colonne reminder su clienti
ALTER TABLE public.clienti ADD COLUMN IF NOT EXISTS reminder_date TIMESTAMPTZ;
ALTER TABLE public.clienti ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMPTZ;

-- Enable RLS
ALTER TABLE public.cliente_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies per cliente_activities

-- Coordinatori possono vedere tutte le attività delle loro sedi
CREATE POLICY "Coordinators can view activities for sede clients"
ON public.cliente_activities
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clienti c
    JOIN public.profiles p ON p.user_id = auth.uid()
    WHERE c.id = cliente_activities.cliente_id
    AND p.role IN ('coordinatore', 'admin')
    AND (p.sede = c.sede OR c.sede = ANY(p.sedi))
  )
);

-- Agenti possono vedere attività dei clienti assegnati
CREATE POLICY "Agents can view activities for assigned clients"
ON public.cliente_activities
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clienti c
    WHERE c.id = cliente_activities.cliente_id
    AND c.assigned_to = auth.uid()
  )
);

-- Coordinatori possono inserire attività
CREATE POLICY "Coordinators can insert activities"
ON public.cliente_activities
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clienti c
    JOIN public.profiles p ON p.user_id = auth.uid()
    WHERE c.id = cliente_activities.cliente_id
    AND p.role IN ('coordinatore', 'admin')
    AND (p.sede = c.sede OR c.sede = ANY(p.sedi))
  )
);

-- Agenti possono inserire attività per clienti assegnati
CREATE POLICY "Agents can insert activities for assigned clients"
ON public.cliente_activities
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clienti c
    WHERE c.id = cliente_activities.cliente_id
    AND c.assigned_to = auth.uid()
  )
);

-- Coordinatori possono cancellare attività
CREATE POLICY "Coordinators can delete activities"
ON public.cliente_activities
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.clienti c
    JOIN public.profiles p ON p.user_id = auth.uid()
    WHERE c.id = cliente_activities.cliente_id
    AND p.role IN ('coordinatore', 'admin')
    AND (p.sede = c.sede OR c.sede = ANY(p.sedi))
  )
);

-- Indice per performance
CREATE INDEX idx_cliente_activities_cliente_id ON public.cliente_activities(cliente_id);
CREATE INDEX idx_cliente_activities_created_at ON public.cliente_activities(created_at DESC);
CREATE INDEX idx_clienti_reminder_date ON public.clienti(reminder_date) WHERE reminder_date IS NOT NULL;