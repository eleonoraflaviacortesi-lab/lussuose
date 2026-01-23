-- Create table for custom kanban columns per user
CREATE TABLE public.kanban_columns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  color TEXT DEFAULT '#e5e7eb',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, key)
);

-- Enable RLS
ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;

-- Users can only see their own columns
CREATE POLICY "Users can view own columns"
ON public.kanban_columns FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own columns
CREATE POLICY "Users can insert own columns"
ON public.kanban_columns FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own columns
CREATE POLICY "Users can update own columns"
ON public.kanban_columns FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own columns
CREATE POLICY "Users can delete own columns"
ON public.kanban_columns FOR DELETE
USING (auth.uid() = user_id);

-- Index for fast queries
CREATE INDEX idx_kanban_columns_user ON public.kanban_columns(user_id, display_order);