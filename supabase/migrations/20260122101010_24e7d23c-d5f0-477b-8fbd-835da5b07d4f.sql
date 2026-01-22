-- Add display_order column to notizie for custom sorting within columns
ALTER TABLE public.notizie 
ADD COLUMN display_order integer NOT NULL DEFAULT 0;