
-- Add new tracking columns to clienti table matching the Google Sheet structure
ALTER TABLE public.clienti ADD COLUMN IF NOT EXISTS lingua text;
ALTER TABLE public.clienti ADD COLUMN IF NOT EXISTS cognome text;
ALTER TABLE public.clienti ADD COLUMN IF NOT EXISTS portale text;
ALTER TABLE public.clienti ADD COLUMN IF NOT EXISTS property_name text;
ALTER TABLE public.clienti ADD COLUMN IF NOT EXISTS ref_number text;
ALTER TABLE public.clienti ADD COLUMN IF NOT EXISTS contattato_da text;
ALTER TABLE public.clienti ADD COLUMN IF NOT EXISTS tipo_contatto text;
