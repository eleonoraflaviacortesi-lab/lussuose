-- Drop existing constraint and recreate with 'credit' status
ALTER TABLE public.notizie DROP CONSTRAINT IF EXISTS notizie_status_check;

ALTER TABLE public.notizie ADD CONSTRAINT notizie_status_check 
CHECK (status IN ('new', 'in_progress', 'done', 'on_shot', 'taken', 'credit', 'no', 'sold'));