-- Add notes column to daily_data table
ALTER TABLE public.daily_data ADD COLUMN IF NOT EXISTS notes TEXT;