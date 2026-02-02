-- Create table for client kanban columns (similar to kanban_columns for notizie)
CREATE TABLE public.client_kanban_columns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  color TEXT DEFAULT '#e5e7eb',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_kanban_columns ENABLE ROW LEVEL SECURITY;

-- Create policies for user access (same as kanban_columns)
CREATE POLICY "Users can view own client columns" 
ON public.client_kanban_columns 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own client columns" 
ON public.client_kanban_columns 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own client columns" 
ON public.client_kanban_columns 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own client columns" 
ON public.client_kanban_columns 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX idx_client_kanban_columns_user_id ON public.client_kanban_columns(user_id);