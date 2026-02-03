-- Add numeric goal fields to meeting_items for 'obiettivo' type
ALTER TABLE public.meeting_items 
ADD COLUMN goal_incarichi INTEGER DEFAULT 0,
ADD COLUMN goal_notizie INTEGER DEFAULT 0,
ADD COLUMN goal_acquisizioni INTEGER DEFAULT 0,
ADD COLUMN goal_trattative INTEGER DEFAULT 0,
ADD COLUMN notes TEXT;