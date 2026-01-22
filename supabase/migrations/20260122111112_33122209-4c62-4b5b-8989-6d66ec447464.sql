-- Add trattative_chiuse_target column to sede_targets
ALTER TABLE public.sede_targets 
ADD COLUMN IF NOT EXISTS trattative_chiuse_target integer DEFAULT 0;