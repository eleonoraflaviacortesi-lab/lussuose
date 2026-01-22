-- Create clienti table for buyer clients management
CREATE TABLE public.clienti (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Personal Data
  nome text NOT NULL,
  telefono text,
  email text,
  paese text,
  
  -- Budget & Financing
  budget_max numeric,
  mutuo text, -- "Yes", "No", "Not sure yet"
  
  -- Timeline
  tempo_ricerca text, -- "Less than 3 months", "3-6 months", etc.
  ha_visitato boolean DEFAULT false,
  
  -- Location Preferences
  regioni text[] DEFAULT '{}', -- Array: ["Tuscany", "Umbria"]
  vicinanza_citta boolean DEFAULT false,
  motivo_zona text[] DEFAULT '{}', -- Array: ["Investment", "Lifestyle"]
  
  -- Property Type
  tipologia text[] DEFAULT '{}', -- Array: ["Farmhouse", "Villa"]
  stile text, -- "Luxurious", "Rustic", "Modern"
  contesto text[] DEFAULT '{}', -- Array: ["Hilltop", "Rural"]
  
  -- Property Features
  dimensioni_min integer,
  dimensioni_max integer,
  camere text, -- "At least 3", "4+", etc.
  bagni integer,
  layout text, -- "Open plan", "Traditional", etc.
  dependance text, -- "Essential", "Not essential"
  terreno text, -- "Yes", "No", "Maybe"
  piscina text, -- "Essential", "Optional", "Not needed"
  
  -- Usage
  uso text, -- "Personal", "Rental", "Mixed"
  interesse_affitto text, -- "Yes", "No", "Not sure"
  
  -- Management
  status text NOT NULL DEFAULT 'new',
  display_order integer NOT NULL DEFAULT 0,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sede text NOT NULL DEFAULT 'AREZZO',
  emoji text DEFAULT '🏠',
  card_color text,
  comments jsonb DEFAULT '[]'::jsonb,
  
  -- Notes from form
  descrizione text,
  note_extra text,
  
  -- Tally metadata
  tally_submission_id text UNIQUE,
  data_submission timestamp with time zone,
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clienti ENABLE ROW LEVEL SECURITY;

-- Create index for performance
CREATE INDEX idx_clienti_sede ON public.clienti(sede);
CREATE INDEX idx_clienti_status ON public.clienti(status);
CREATE INDEX idx_clienti_assigned_to ON public.clienti(assigned_to);
CREATE INDEX idx_clienti_regioni ON public.clienti USING GIN(regioni);

-- RLS Policies

-- Coordinators/Admins can view all clients in their sede
CREATE POLICY "Coordinators can view sede clients"
ON public.clienti
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('coordinatore', 'admin')
    AND profiles.sede = clienti.sede
  )
);

-- Agents can view clients assigned to them
CREATE POLICY "Agents can view assigned clients"
ON public.clienti
FOR SELECT
USING (assigned_to = auth.uid());

-- Coordinators/Admins can insert clients
CREATE POLICY "Coordinators can insert clients"
ON public.clienti
FOR INSERT
WITH CHECK (is_coordinator_or_admin(auth.uid()));

-- Coordinators/Admins can update clients in their sede
CREATE POLICY "Coordinators can update clients"
ON public.clienti
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('coordinatore', 'admin')
    AND profiles.sede = clienti.sede
  )
);

-- Coordinators/Admins can delete clients in their sede
CREATE POLICY "Coordinators can delete clients"
ON public.clienti
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('coordinatore', 'admin')
    AND profiles.sede = clienti.sede
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_clienti_updated_at
BEFORE UPDATE ON public.clienti
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();