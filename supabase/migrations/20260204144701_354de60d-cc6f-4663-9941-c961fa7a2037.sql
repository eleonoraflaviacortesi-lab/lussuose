-- Add card_color and is_urgent columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN card_color TEXT DEFAULT NULL,
ADD COLUMN is_urgent BOOLEAN DEFAULT false;