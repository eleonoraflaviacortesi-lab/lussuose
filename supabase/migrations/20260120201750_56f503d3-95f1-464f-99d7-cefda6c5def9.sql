-- Create notizie table for sales leads tracking
CREATE TABLE public.notizie (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  zona TEXT,
  phone TEXT,
  type TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'done', 'on_shot', 'taken')),
  reminder_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notizie ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notizie"
  ON public.notizie FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notizie"
  ON public.notizie FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notizie"
  ON public.notizie FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notizie"
  ON public.notizie FOR DELETE
  USING (auth.uid() = user_id);

-- Coordinators can view all notizie
CREATE POLICY "Coordinators can view all notizie"
  ON public.notizie FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('coordinatore', 'admin')
  ));

-- Trigger for updated_at
CREATE TRIGGER update_notizie_updated_at
  BEFORE UPDATE ON public.notizie
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();