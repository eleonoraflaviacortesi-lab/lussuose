
-- Add columns to chat_messages for rich features
ALTER TABLE public.chat_messages
  ADD COLUMN reactions jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN audio_url text,
  ADD COLUMN linked_notizia_id uuid REFERENCES public.notizie(id) ON DELETE SET NULL,
  ADD COLUMN linked_cliente_id uuid REFERENCES public.clienti(id) ON DELETE SET NULL,
  ADD COLUMN mentions uuid[] DEFAULT '{}'::uuid[];

-- Create storage bucket for chat audio
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-audio', 'chat-audio', true);

-- Storage policies for chat audio
CREATE POLICY "Authenticated users can upload chat audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-audio' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view chat audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-audio');

CREATE POLICY "Users can delete own chat audio"
ON storage.objects FOR DELETE
USING (bucket_id = 'chat-audio' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow update on chat_messages for reactions (any sede member can add reactions)
CREATE POLICY "Sede users can update chat message reactions"
ON public.chat_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND (p.sede = chat_messages.sede OR chat_messages.sede = ANY(COALESCE(p.sedi, '{}')))
  )
);

-- RLS policy: allow viewing a cliente if it's linked in a chat message you can see
-- This lets non-coordinators see buyers linked in chat
CREATE POLICY "Users can view clients linked in chat"
ON public.clienti
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chat_messages cm
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE cm.linked_cliente_id = clienti.id
    AND (p.sede = cm.sede OR cm.sede = ANY(COALESCE(p.sedi, '{}')))
  )
);
