-- Create properties table for scraped listings
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ref_number TEXT UNIQUE,
  title TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,
  price NUMERIC,
  location TEXT,
  region TEXT,
  property_type TEXT,
  surface_mq INTEGER,
  rooms INTEGER,
  bathrooms INTEGER,
  has_pool BOOLEAN DEFAULT false,
  has_land BOOLEAN DEFAULT false,
  land_hectares NUMERIC,
  image_url TEXT,
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  scraped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client_property_matches table for tracking associations
CREATE TABLE public.client_property_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.clienti(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  match_type TEXT NOT NULL DEFAULT 'auto' CHECK (match_type IN ('auto', 'manual')),
  match_score INTEGER DEFAULT 0,
  suggested BOOLEAN DEFAULT false,
  suggested_at TIMESTAMP WITH TIME ZONE,
  suggested_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(cliente_id, property_id)
);

-- Enable RLS on properties
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Properties are viewable by all authenticated users
CREATE POLICY "Authenticated users can view properties"
ON public.properties
FOR SELECT
USING (auth.role() = 'authenticated');

-- Only coordinators can manage properties
CREATE POLICY "Coordinators can insert properties"
ON public.properties
FOR INSERT
WITH CHECK (is_coordinator_or_admin(auth.uid()));

CREATE POLICY "Coordinators can update properties"
ON public.properties
FOR UPDATE
USING (is_coordinator_or_admin(auth.uid()));

CREATE POLICY "Coordinators can delete properties"
ON public.properties
FOR DELETE
USING (is_coordinator_or_admin(auth.uid()));

-- Enable RLS on client_property_matches
ALTER TABLE public.client_property_matches ENABLE ROW LEVEL SECURITY;

-- Coordinators can manage all matches
CREATE POLICY "Coordinators can view all matches"
ON public.client_property_matches
FOR SELECT
USING (is_coordinator_or_admin(auth.uid()));

CREATE POLICY "Coordinators can insert matches"
ON public.client_property_matches
FOR INSERT
WITH CHECK (is_coordinator_or_admin(auth.uid()));

CREATE POLICY "Coordinators can update matches"
ON public.client_property_matches
FOR UPDATE
USING (is_coordinator_or_admin(auth.uid()));

CREATE POLICY "Coordinators can delete matches"
ON public.client_property_matches
FOR DELETE
USING (is_coordinator_or_admin(auth.uid()));

-- Agents can view matches for their assigned clients
CREATE POLICY "Agents can view matches for assigned clients"
ON public.client_property_matches
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clienti
    WHERE clienti.id = client_property_matches.cliente_id
    AND clienti.assigned_to = auth.uid()
  )
);

-- Agents can update matches for their assigned clients (to mark as suggested)
CREATE POLICY "Agents can update matches for assigned clients"
ON public.client_property_matches
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.clienti
    WHERE clienti.id = client_property_matches.cliente_id
    AND clienti.assigned_to = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX idx_properties_region ON public.properties(region);
CREATE INDEX idx_properties_price ON public.properties(price);
CREATE INDEX idx_properties_active ON public.properties(active);
CREATE INDEX idx_client_matches_cliente ON public.client_property_matches(cliente_id);
CREATE INDEX idx_client_matches_property ON public.client_property_matches(property_id);
CREATE INDEX idx_client_matches_score ON public.client_property_matches(match_score DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_property_matches_updated_at
BEFORE UPDATE ON public.client_property_matches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();