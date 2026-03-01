
CREATE TABLE public.app_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view app_settings" ON public.app_settings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Coordinators can manage app_settings" ON public.app_settings FOR ALL USING (is_coordinator_or_admin(auth.uid()));

INSERT INTO public.app_settings (key, value) VALUES
  ('banner_text_1', 'MANCANO €{remaining} AL TRAGUARDO'),
  ('banner_text_2', 'OBBIETTIVO FATTURATO AGENZIA €{target}'),
  ('banner_text_3', 'FATTURATO A CREDITO €{fatturatoCredito}'),
  ('banner_text_4', ''),
  ('banner_bg_color', '#000000'),
  ('banner_text_color', '#FFFFFF'),
  ('banner_speed', '40');
