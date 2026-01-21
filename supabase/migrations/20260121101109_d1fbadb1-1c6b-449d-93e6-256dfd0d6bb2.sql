-- Add comments (jsonb array) and card_color columns to notizie table
ALTER TABLE public.notizie 
ADD COLUMN IF NOT EXISTS comments jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS card_color text DEFAULT NULL;