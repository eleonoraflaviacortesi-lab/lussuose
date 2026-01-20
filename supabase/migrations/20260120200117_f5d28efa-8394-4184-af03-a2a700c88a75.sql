-- Create user_settings table for storing personal objectives
CREATE TABLE public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  -- Piano Finanziario
  obbiettivo_fatturato NUMERIC NOT NULL DEFAULT 500000,
  base_fissa_annuale NUMERIC NOT NULL DEFAULT 0,
  percentuale_personale NUMERIC NOT NULL DEFAULT 10,
  prezzo_medio_vendita NUMERIC NOT NULL DEFAULT 500000,
  provvigione_agenzia NUMERIC NOT NULL DEFAULT 4,
  -- Obiettivi settimanali
  contatti_settimana INTEGER NOT NULL DEFAULT 25,
  notizie_settimana INTEGER NOT NULL DEFAULT 10,
  appuntamenti_settimana INTEGER NOT NULL DEFAULT 4,
  acquisizioni_settimana INTEGER NOT NULL DEFAULT 3,
  incarichi_settimana INTEGER NOT NULL DEFAULT 1,
  nuove_trattative_settimana INTEGER NOT NULL DEFAULT 2,
  trattative_chiuse_settimana INTEGER NOT NULL DEFAULT 1,
  vendite_settimana INTEGER NOT NULL DEFAULT 1,
  fatturato_credito_settimana NUMERIC NOT NULL DEFAULT 50000,
  fatturato_generato_settimana NUMERIC NOT NULL DEFAULT 20000,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own settings" 
ON public.user_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" 
ON public.user_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
ON public.user_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();