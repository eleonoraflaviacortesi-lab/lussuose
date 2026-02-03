-- Create weekly meetings table
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sede TEXT NOT NULL DEFAULT 'AREZZO',
  week_start DATE NOT NULL,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  title TEXT,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sede, week_start)
);

-- Create meeting items table (structured entries)
CREATE TABLE public.meeting_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('incarico', 'trattativa', 'acquirente', 'obiettivo', 'task')),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed', 'postponed')),
  -- Links to existing entities (optional, without duplicating data)
  linked_notizia_id UUID REFERENCES public.notizie(id) ON DELETE SET NULL,
  linked_cliente_id UUID REFERENCES public.clienti(id) ON DELETE SET NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_items ENABLE ROW LEVEL SECURITY;

-- RLS for meetings: coordinators can manage, agents can view their sede
CREATE POLICY "Coordinators can manage meetings"
  ON public.meetings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('coordinatore', 'admin')
      AND (profiles.sede = meetings.sede OR meetings.sede = ANY(profiles.sedi))
    )
  );

CREATE POLICY "Agents can view sede meetings"
  ON public.meetings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.sede = meetings.sede
    )
  );

-- RLS for meeting_items: follow parent meeting permissions
CREATE POLICY "Users can view meeting items"
  ON public.meeting_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meetings m
      JOIN profiles p ON p.user_id = auth.uid()
      WHERE m.id = meeting_items.meeting_id
      AND (p.sede = m.sede OR m.sede = ANY(p.sedi))
    )
  );

CREATE POLICY "Coordinators can manage meeting items"
  ON public.meeting_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM meetings m
      JOIN profiles p ON p.user_id = auth.uid()
      WHERE m.id = meeting_items.meeting_id
      AND p.role IN ('coordinatore', 'admin')
      AND (p.sede = m.sede OR m.sede = ANY(p.sedi))
    )
  );

-- Agents can update items assigned to them
CREATE POLICY "Agents can update assigned items"
  ON public.meeting_items FOR UPDATE
  USING (assigned_to = auth.uid());

-- Indexes for performance
CREATE INDEX idx_meetings_sede_week ON public.meetings(sede, week_start);
CREATE INDEX idx_meeting_items_meeting ON public.meeting_items(meeting_id);
CREATE INDEX idx_meeting_items_linked_notizia ON public.meeting_items(linked_notizia_id) WHERE linked_notizia_id IS NOT NULL;
CREATE INDEX idx_meeting_items_linked_cliente ON public.meeting_items(linked_cliente_id) WHERE linked_cliente_id IS NOT NULL;
CREATE INDEX idx_meeting_items_assigned ON public.meeting_items(assigned_to) WHERE assigned_to IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meeting_items_updated_at
  BEFORE UPDATE ON public.meeting_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();