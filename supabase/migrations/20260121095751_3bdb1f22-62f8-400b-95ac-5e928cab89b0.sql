-- Drop the old constraint and add updated one with all status values
ALTER TABLE public.notizie DROP CONSTRAINT notizie_status_check;

ALTER TABLE public.notizie ADD CONSTRAINT notizie_status_check 
CHECK (status = ANY (ARRAY['new'::text, 'in_progress'::text, 'done'::text, 'on_shot'::text, 'taken'::text, 'no'::text, 'sold'::text]));