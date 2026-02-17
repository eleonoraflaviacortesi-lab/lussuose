
-- Add prezzo_richiesto and valore columns to notizie table
ALTER TABLE public.notizie ADD COLUMN IF NOT EXISTS prezzo_richiesto numeric NULL;
ALTER TABLE public.notizie ADD COLUMN IF NOT EXISTS valore numeric NULL;
