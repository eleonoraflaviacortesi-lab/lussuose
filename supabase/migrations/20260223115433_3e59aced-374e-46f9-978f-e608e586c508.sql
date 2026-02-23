
-- Create attachments table
CREATE TABLE public.attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL, -- 'cliente' or 'notizia'
  entity_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  content_type TEXT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Coordinators can manage all attachments for their sede
CREATE POLICY "Coordinators can view attachments"
ON public.attachments FOR SELECT
USING (
  is_coordinator_or_admin(auth.uid())
);

CREATE POLICY "Coordinators can insert attachments"
ON public.attachments FOR INSERT
WITH CHECK (
  auth.uid() = uploaded_by
);

CREATE POLICY "Coordinators can delete attachments"
ON public.attachments FOR DELETE
USING (
  auth.uid() = uploaded_by OR is_coordinator_or_admin(auth.uid())
);

-- Agents can view attachments for clients assigned to them
CREATE POLICY "Agents can view client attachments"
ON public.attachments FOR SELECT
USING (
  entity_type = 'cliente' AND EXISTS (
    SELECT 1 FROM clienti WHERE clienti.id = attachments.entity_id AND clienti.assigned_to = auth.uid()
  )
);

-- Agents can view their own notizie attachments
CREATE POLICY "Agents can view notizia attachments"
ON public.attachments FOR SELECT
USING (
  entity_type = 'notizia' AND EXISTS (
    SELECT 1 FROM notizie WHERE notizie.id = attachments.entity_id AND notizie.user_id = auth.uid()
  )
);

-- Create storage bucket for attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', false);

-- Storage policies
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'attachments' AND auth.role() = 'authenticated');
