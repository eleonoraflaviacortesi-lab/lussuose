-- Fix RLS policies for sede_targets (currently too permissive)
-- Only coordinators/admins should be able to modify targets

-- Drop existing permissive policies
DROP POLICY IF EXISTS "All authenticated users can delete sede targets" ON sede_targets;
DROP POLICY IF EXISTS "All authenticated users can insert sede targets" ON sede_targets;
DROP POLICY IF EXISTS "All authenticated users can update sede targets" ON sede_targets;

-- Create restrictive policies using the existing is_coordinator_or_admin function
CREATE POLICY "Only coordinators can insert sede targets" ON sede_targets
  FOR INSERT TO authenticated
  WITH CHECK (public.is_coordinator_or_admin(auth.uid()));

CREATE POLICY "Only coordinators can update sede targets" ON sede_targets
  FOR UPDATE TO authenticated
  USING (public.is_coordinator_or_admin(auth.uid()));

CREATE POLICY "Only coordinators can delete sede targets" ON sede_targets
  FOR DELETE TO authenticated
  USING (public.is_coordinator_or_admin(auth.uid()));

-- Add unique constraint for daily_data upsert support
ALTER TABLE daily_data 
  ADD CONSTRAINT daily_data_user_date_unique UNIQUE (user_id, date);