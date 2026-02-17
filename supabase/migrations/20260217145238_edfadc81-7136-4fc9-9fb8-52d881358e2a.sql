
-- Create chat_messages table for office chat
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  message text NOT NULL,
  reply_to_id uuid REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  sede text NOT NULL DEFAULT 'AREZZO',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Users in the same sede can view messages
CREATE POLICY "Users can view sede chat messages"
ON public.chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND (p.sede = chat_messages.sede OR chat_messages.sede = ANY(COALESCE(p.sedi, '{}')))
  )
);

-- Users can insert their own messages
CREATE POLICY "Users can insert chat messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete own chat messages"
ON public.chat_messages
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
