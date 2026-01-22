-- Add reaction columns to client_property_matches
ALTER TABLE public.client_property_matches
ADD COLUMN IF NOT EXISTS reaction TEXT CHECK (reaction IN ('liked', 'disliked', NULL));

-- Update suggested column comment for clarity (it means "proposed to client")
COMMENT ON COLUMN public.client_property_matches.suggested IS 'Whether this property was proposed/sent to the client';