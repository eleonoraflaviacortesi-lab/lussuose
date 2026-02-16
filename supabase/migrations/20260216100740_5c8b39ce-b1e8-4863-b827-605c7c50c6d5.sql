ALTER TABLE public.clienti 
ADD COLUMN IF NOT EXISTS row_bg_color text,
ADD COLUMN IF NOT EXISTS row_text_color text;