-- Add avatar_emoji column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN avatar_emoji text DEFAULT '🖤';