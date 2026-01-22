import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export interface SedeTargets {
  contatti_target: number;
  notizie_target: number;
  incarichi_target: number;
  acquisizioni_target: number;
  appuntamenti_target: number;
  clienti_target: number;
  vendite_target: number;
  fatturato_target: number;
}

const DEFAULT_TARGETS: SedeTargets = {
  contatti_target: 100,
  notizie_target: 40,
  incarichi_target: 4,
  acquisizioni_target: 8,
  appuntamenti_target: 40,
  clienti_target: 20,
  vendite_target: 4,
  fatturato_target: 150000,
};

export const useSedeTargets = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const { data: targets, isLoading } = useQuery({
    queryKey: ['sede-targets', profile?.sede, currentMonth, currentYear],
    queryFn: async () => {
      if (!profile?.sede) return DEFAULT_TARGETS;

      const { data, error } = await supabase
        .from('sede_targets')
        .select('*')
        .eq('sede', profile.sede)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) return DEFAULT_TARGETS;

      return {
        contatti_target: data.contatti_target ?? DEFAULT_TARGETS.contatti_target,
        notizie_target: data.notizie_target ?? DEFAULT_TARGETS.notizie_target,
        incarichi_target: data.incarichi_target ?? DEFAULT_TARGETS.incarichi_target,
        acquisizioni_target: data.acquisizioni_target ?? DEFAULT_TARGETS.acquisizioni_target,
        appuntamenti_target: data.appuntamenti_target ?? DEFAULT_TARGETS.appuntamenti_target,
        clienti_target: data.clienti_target ?? DEFAULT_TARGETS.clienti_target,
        vendite_target: data.vendite_target ?? DEFAULT_TARGETS.vendite_target,
        fatturato_target: data.fatturato_target ?? DEFAULT_TARGETS.fatturato_target,
      } as SedeTargets;
    },
    enabled: !!user && !!profile?.sede,
  });

  const updateTargets = useMutation({
    mutationFn: async (newTargets: SedeTargets) => {
      if (!profile?.sede) throw new Error('Sede non trovata');

      // Check if record exists
      const { data: existing } = await supabase
        .from('sede_targets')
        .select('id')
        .eq('sede', profile.sede)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('sede_targets')
          .update({
            ...newTargets,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sede_targets')
          .insert({
            sede: profile.sede,
            month: currentMonth,
            year: currentYear,
            ...newTargets,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sede-targets'] });
      toast({ title: '✓ Obiettivi salvati!' });
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
    targets: targets || DEFAULT_TARGETS,
    isLoading,
    updateTargets,
  };
};
