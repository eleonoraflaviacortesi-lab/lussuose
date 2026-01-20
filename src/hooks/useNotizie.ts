import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export type NotiziaStatus = 'new' | 'in_progress' | 'done' | 'on_shot' | 'taken';

export interface Notizia {
  id: string;
  user_id: string;
  name: string;
  zona: string | null;
  phone: string | null;
  type: string | null;
  notes: string | null;
  status: NotiziaStatus;
  reminder_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotiziaInput {
  name: string;
  zona?: string;
  phone?: string;
  type?: string;
  notes?: string;
  status?: NotiziaStatus;
  reminder_date?: string;
}

export const useNotizie = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notizie, isLoading } = useQuery({
    queryKey: ['notizie'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('notizie')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Notizia[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const addNotizia = useMutation({
    mutationFn: async (input: NotiziaInput) => {
      if (!user) throw new Error('Non autenticato');
      
      const { error } = await supabase
        .from('notizie')
        .insert({ ...input, user_id: user.id });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notizie'] });
      toast({ title: 'Notizia aggiunta!' });
    },
    onError: (error) => {
      toast({
        title: 'Errore',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateNotizia = useMutation({
    mutationFn: async ({ id, ...input }: Partial<NotiziaInput> & { id: string }) => {
      if (!user) throw new Error('Non autenticato');
      
      const { error } = await supabase
        .from('notizie')
        .update(input)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notizie'] });
      toast({ title: 'Notizia aggiornata!' });
    },
    onError: (error) => {
      toast({
        title: 'Errore',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteNotizia = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Non autenticato');
      
      const { error } = await supabase
        .from('notizie')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notizie'] });
      toast({ title: 'Notizia eliminata!' });
    },
    onError: (error) => {
      toast({
        title: 'Errore',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Group notizie by status
  const notizieByStatus = {
    new: notizie?.filter(n => n.status === 'new') || [],
    in_progress: notizie?.filter(n => n.status === 'in_progress') || [],
    done: notizie?.filter(n => n.status === 'done') || [],
    on_shot: notizie?.filter(n => n.status === 'on_shot') || [],
    taken: notizie?.filter(n => n.status === 'taken') || [],
  };

  return {
    notizie,
    notizieByStatus,
    isLoading,
    addNotizia,
    updateNotizia,
    deleteNotizia,
  };
};
