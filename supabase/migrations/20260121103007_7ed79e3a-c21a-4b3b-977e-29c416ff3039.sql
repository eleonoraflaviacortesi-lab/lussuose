-- Create demo users table for passwordless login
CREATE TABLE IF NOT EXISTS public.demo_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  avatar_emoji text DEFAULT '🖤',
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS but allow public read for login selection
ALTER TABLE public.demo_users ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read demo users (for login screen)
CREATE POLICY "Anyone can view demo users" ON public.demo_users
FOR SELECT USING (true);

-- Only authenticated coordinators/admins can manage demo users
CREATE POLICY "Admins can manage demo users" ON public.demo_users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('coordinatore', 'admin')
  )
);