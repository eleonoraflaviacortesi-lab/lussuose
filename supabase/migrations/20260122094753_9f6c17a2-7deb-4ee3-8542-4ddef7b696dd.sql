-- Add valutazioni_fatte column to daily_data table
ALTER TABLE public.daily_data 
ADD COLUMN valutazioni_fatte integer NOT NULL DEFAULT 0;