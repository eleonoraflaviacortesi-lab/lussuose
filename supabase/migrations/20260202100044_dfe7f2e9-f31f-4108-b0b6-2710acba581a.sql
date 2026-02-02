-- Remove the restrictive status check constraint to allow custom kanban column statuses
ALTER TABLE public.notizie DROP CONSTRAINT IF EXISTS notizie_status_check;