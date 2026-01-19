import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export interface OperationInput {
  date: string;
  type: 'acquisizione' | 'vendita' | 'incarico' | 'affitto';
  value?: number;
  notes?: string;
}

export const useOperations = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: operations, isLoading } = useQuery({
    queryKey: ['operations'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('operations')
        .select('*, profiles!inner(full_name)')
        .order('date', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addOperation = useMutation({
    mutationFn: async (input: OperationInput) => {
      if (!user) throw new Error('Non autenticato');
      
      const { error } = await supabase
        .from('operations')
        .insert({ ...input, user_id: user.id });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      toast({ title: 'Operazione registrata!' });
    },
    onError: (error) => {
      toast({
        title: 'Errore',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    operations,
    isLoading,
    addOperation,
  };
};
