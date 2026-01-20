-- Add new fields to daily_data table
ALTER TABLE public.daily_data
ADD COLUMN nuove_trattative integer NOT NULL DEFAULT 0,
ADD COLUMN nuove_trattative_ideali integer NOT NULL DEFAULT 2,
ADD COLUMN trattative_chiuse integer NOT NULL DEFAULT 0,
ADD COLUMN trattative_chiuse_ideali integer NOT NULL DEFAULT 1,
ADD COLUMN fatturato_a_credito numeric NOT NULL DEFAULT 0;