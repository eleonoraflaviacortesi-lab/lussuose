import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';
import { celebrateSuccess } from '@/lib/confetti';

export interface DailyDataInput {
  date: string;
  contatti_reali: number;
  contatti_ideali: number;
  notizie_reali: number;
  notizie_ideali: number;
  clienti_gestiti: number;
  appuntamenti_vendita: number;
  acquisizioni: number;
  incarichi_vendita: number;
  valutazioni_fatte: number;
  vendite_numero: number;
  vendite_valore: number;
  affitti_numero: number;
  affitti_valore: number;
  nuove_trattative: number;
  nuove_trattative_ideali: number;
  trattative_chiuse: number;
  trattative_chiuse_ideali: number;
  fatturato_a_credito: number;
}

export const useDailyData = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: myData, isLoading: myDataLoading } = useQuery({
    queryKey: ['daily-data', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('daily_data')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes cache
    gcTime: 1000 * 60 * 5, // 5 minutes garbage collection
  });

  // Query for all data filtered by user's sede (using subquery for user_ids)
  const { data: allData, isLoading: allDataLoading } = useQuery({
    queryKey: ['daily-data-all', profile?.sede],
    queryFn: async () => {
      if (!user || !profile?.sede) return [];
      
      // First get all user_ids for this sede
      const { data: sedeProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('sede', profile.sede);
      
      if (profilesError) throw profilesError;
      if (!sedeProfiles || sedeProfiles.length === 0) return [];
      
      const userIds = sedeProfiles.map(p => p.user_id);
      
      // Then get daily_data for those users
      const { data, error } = await supabase
        .from('daily_data')
        .select('*')
        .in('user_id', userIds)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!profile?.sede && profile?.role !== 'agente',
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
  });

  const saveDailyData = useMutation({
    mutationFn: async (input: DailyDataInput) => {
      if (!user) throw new Error('Non autenticato');

      const { data: existing } = await supabase
        .from('daily_data')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', input.date)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('daily_data')
          .update({ ...input, user_id: user.id })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('daily_data')
          .insert({ ...input, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      // Invalidate the exact user-scoped query so dashboards refresh immediately
      queryClient.invalidateQueries({ queryKey: ['daily-data', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['daily-data-all'] });
      toast({ title: '✓ Report salvato con successo!' });
      celebrateSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Errore nel salvataggio',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteDailyData = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Non autenticato');

      const { error } = await supabase
        .from('daily_data')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-data', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['daily-data-all'] });
      toast({ title: '✓ Report eliminato!' });
    },
    onError: (error) => {
      toast({
        title: 'Errore nell\'eliminazione',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    myData,
    allData: profile?.role !== 'agente' ? allData : myData,
    isLoading: myDataLoading || allDataLoading,
    saveDailyData,
    deleteDailyData,
  };
};
