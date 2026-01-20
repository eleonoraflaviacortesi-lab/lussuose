import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export interface UserSettings {
  id: string;
  user_id: string;
  // Piano Finanziario
  obbiettivo_fatturato: number;
  base_fissa_annuale: number;
  percentuale_personale: number;
  prezzo_medio_vendita: number;
  provvigione_agenzia: number;
  // Obiettivi settimanali
  contatti_settimana: number;
  notizie_settimana: number;
  appuntamenti_settimana: number;
  acquisizioni_settimana: number;
  incarichi_settimana: number;
  nuove_trattative_settimana: number;
  trattative_chiuse_settimana: number;
  vendite_settimana: number;
  fatturato_credito_settimana: number;
  fatturato_generato_settimana: number;
  created_at: string;
  updated_at: string;
}

export type UserSettingsInput = Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

const defaultSettings: UserSettingsInput = {
  obbiettivo_fatturato: 500000,
  base_fissa_annuale: 0,
  percentuale_personale: 10,
  prezzo_medio_vendita: 500000,
  provvigione_agenzia: 4,
  contatti_settimana: 25,
  notizie_settimana: 10,
  appuntamenti_settimana: 4,
  acquisizioni_settimana: 3,
  incarichi_settimana: 1,
  nuove_trattative_settimana: 2,
  trattative_chiuse_settimana: 1,
  vendite_settimana: 1,
  fatturato_credito_settimana: 50000,
  fatturato_generato_settimana: 20000,
};

export const useUserSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['user-settings', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      // Return existing settings or defaults
      if (data) return data as UserSettings;
      
      return {
        ...defaultSettings,
        user_id: user.id,
      } as UserSettings;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const saveSettings = useMutation({
    mutationFn: async (input: UserSettingsInput) => {
      if (!user) throw new Error('Non autenticato');

      const { data: existing } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_settings')
          .update(input)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_settings')
          .insert({ ...input, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      toast({ title: '✓ Aggiornato!' });
    },
    onError: (error) => {
      toast({
        title: 'Errore nel salvataggio',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    settings: settings || defaultSettings as UserSettings,
    isLoading,
    saveSettings,
    defaultSettings,
  };
};