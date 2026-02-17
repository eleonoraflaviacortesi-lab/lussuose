-- Add a JSONB column to store custom field values per client
ALTER TABLE public.clienti ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}'::jsonb;
