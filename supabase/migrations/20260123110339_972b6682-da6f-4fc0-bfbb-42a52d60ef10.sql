-- Create notifications table for in-app notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'assignment',
  title TEXT NOT NULL,
  message TEXT,
  reference_id UUID,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Coordinators can insert notifications for anyone
CREATE POLICY "Coordinators can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (is_coordinator_or_admin(auth.uid()));

-- Index for fast queries
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read) WHERE read = false;