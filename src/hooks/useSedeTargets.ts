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
  vendite_target: number;
  fatturato_target: number;
  trattative_chiuse_target: number;
}

const DEFAULT_TARGETS: SedeTargets = {
  contatti_target: 100,
  notizie_target: 40,
  incarichi_target: 4,
  acquisizioni_target: 8,
  appuntamenti_target: 40,
  vendite_target: 48,  // Annual: 4 per month
  fatturato_target: 500000,  // Annual target
  trattative_chiuse_target: 4,
};

export const useSedeTargets = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Current month targets
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
        vendite_target: data.vendite_target ?? DEFAULT_TARGETS.vendite_target,
        fatturato_target: data.fatturato_target ?? DEFAULT_TARGETS.fatturato_target,
        trattative_chiuse_target: data.trattative_chiuse_target ?? DEFAULT_TARGETS.trattative_chiuse_target,
      } as SedeTargets;
    },
    enabled: !!user && !!profile?.sede,
  });

  // Annual targets (sum of all months for current year)
  const { data: annualTargets } = useQuery({
    queryKey: ['sede-targets-annual', profile?.sede, currentYear],
    queryFn: async () => {
      if (!profile?.sede) return { vendite_target: DEFAULT_TARGETS.vendite_target * 12, fatturato_target: DEFAULT_TARGETS.fatturato_target };

      const { data, error } = await supabase
        .from('sede_targets')
        .select('vendite_target, fatturato_target')
        .eq('sede', profile.sede)
        .eq('year', currentYear);

      if (error) throw error;
      
      if (!data || data.length === 0) {
        return { vendite_target: DEFAULT_TARGETS.vendite_target * 12, fatturato_target: DEFAULT_TARGETS.fatturato_target };
      }

      // Sum all months for annual target
      const annualVendite = data.reduce((sum, m) => sum + (m.vendite_target || 0), 0);
      const annualFatturato = data.reduce((sum, m) => sum + (m.fatturato_target || 0), 0);

      return {
        vendite_target: annualVendite || DEFAULT_TARGETS.vendite_target * 12,
        fatturato_target: annualFatturato || DEFAULT_TARGETS.fatturato_target,
      };
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
    annualTargets: annualTargets || { vendite_target: DEFAULT_TARGETS.vendite_target * 12, fatturato_target: DEFAULT_TARGETS.fatturato_target },
    isLoading,
    updateTargets,
  };
};
