-- Add emoji column to notizie table
ALTER TABLE public.notizie 
ADD COLUMN emoji TEXT DEFAULT '📋';