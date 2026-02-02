-- Change dimensioni_min, dimensioni_max, and bagni from integer to text to accept textual values
ALTER TABLE public.clienti 
  ALTER COLUMN dimensioni_min TYPE text USING dimensioni_min::text,
  ALTER COLUMN dimensioni_max TYPE text USING dimensioni_max::text,
  ALTER COLUMN bagni TYPE text USING bagni::text;