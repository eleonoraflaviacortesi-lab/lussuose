-- Add completed field to appointments for task completion
ALTER TABLE public.appointments ADD COLUMN completed BOOLEAN DEFAULT FALSE;

-- Remove Google Calendar related columns from profiles (no longer needed)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS google_access_token;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS google_refresh_token;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS google_token_expiry;