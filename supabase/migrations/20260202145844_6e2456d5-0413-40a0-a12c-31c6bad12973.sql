-- Add online_status field to notizie table for tracking if the listing is published on the website
ALTER TABLE public.notizie 
ADD COLUMN is_online BOOLEAN DEFAULT false;