-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'agente' CHECK (role IN ('agente', 'coordinatore', 'admin')),
  sede TEXT NOT NULL DEFAULT 'AREZZO',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles in their sede"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create daily_data table for tracking agent activities
CREATE TABLE public.daily_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  contatti_reali INTEGER NOT NULL DEFAULT 0,
  contatti_ideali INTEGER NOT NULL DEFAULT 25,
  notizie_reali INTEGER NOT NULL DEFAULT 0,
  notizie_ideali INTEGER NOT NULL DEFAULT 3,
  clienti_gestiti INTEGER NOT NULL DEFAULT 0,
  appuntamenti_vendita INTEGER NOT NULL DEFAULT 0,
  acquisizioni INTEGER NOT NULL DEFAULT 0,
  incarichi_vendita INTEGER NOT NULL DEFAULT 0,
  vendite_numero INTEGER NOT NULL DEFAULT 0,
  vendite_valore DECIMAL(12,2) NOT NULL DEFAULT 0,
  affitti_numero INTEGER NOT NULL DEFAULT 0,
  affitti_valore DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.daily_data ENABLE ROW LEVEL SECURITY;

-- Daily data policies - agents see their own data, coordinators see all
CREATE POLICY "Users can view their own data"
  ON public.daily_data FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Coordinators can view all data"
  ON public.daily_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('coordinatore', 'admin')
    )
  );

CREATE POLICY "Users can insert their own data"
  ON public.daily_data FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own data"
  ON public.daily_data FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own data"
  ON public.daily_data FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create operations table for tracking significant events
CREATE TABLE public.operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('acquisizione', 'vendita', 'incarico', 'affitto')),
  value DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.operations ENABLE ROW LEVEL SECURITY;

-- Operations policies
CREATE POLICY "Users can view their own operations"
  ON public.operations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Coordinators can view all operations"
  ON public.operations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('coordinatore', 'admin')
    )
  );

CREATE POLICY "Users can insert their own operations"
  ON public.operations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own operations"
  ON public.operations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own operations"
  ON public.operations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create sede_targets table for office-level targets
CREATE TABLE public.sede_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sede TEXT NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  contatti_target INTEGER DEFAULT 0,
  notizie_target INTEGER DEFAULT 0,
  clienti_target INTEGER DEFAULT 0,
  appuntamenti_target INTEGER DEFAULT 0,
  acquisizioni_target INTEGER DEFAULT 0,
  incarichi_target INTEGER DEFAULT 0,
  vendite_target INTEGER DEFAULT 4,
  fatturato_target DECIMAL(12,2) DEFAULT 100000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sede, month, year)
);

-- Enable RLS
ALTER TABLE public.sede_targets ENABLE ROW LEVEL SECURITY;

-- Sede targets policies - coordinators can manage, all can view
CREATE POLICY "All authenticated users can view sede targets"
  ON public.sede_targets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Coordinators can manage sede targets"
  ON public.sede_targets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('coordinatore', 'admin')
    )
  );

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_data_updated_at
  BEFORE UPDATE ON public.daily_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sede_targets_updated_at
  BEFORE UPDATE ON public.sede_targets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role, sede)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'agente'),
    COALESCE(NEW.raw_user_meta_data->>'sede', 'AREZZO')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();