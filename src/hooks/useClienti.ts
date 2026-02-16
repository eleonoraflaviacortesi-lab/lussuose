import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Cliente, ClienteStatus, ClienteGroupBy, ClienteFilters, ClienteComment } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Transform DB row to Cliente type
const transformCliente = (row: any): Cliente => ({
  ...row,
  regioni: row.regioni || [],
  motivo_zona: row.motivo_zona || [],
  tipologia: row.tipologia || [],
  contesto: row.contesto || [],
  comments: row.comments || [],
});

// Budget ranges for grouping
const getBudgetRange = (budget: number | null): string => {
  if (!budget) return 'Non specificato';
  if (budget < 200000) return '< €200k';
  if (budget < 400000) return '€200k - €400k';
  if (budget < 600000) return '€400k - €600k';
  if (budget < 1000000) return '€600k - €1M';
  return '> €1M';
};

// Check if client is urgent (searching < 3 months)
const isUrgent = (tempoRicerca: string | null): boolean => {
  if (!tempoRicerca) return false;
  const lower = tempoRicerca.toLowerCase();
  return lower.includes('less than 3') || lower.includes('< 3') || lower.includes('1 month');
};

export function useClienti(options?: {
  groupBy?: ClienteGroupBy;
  filters?: ClienteFilters;
}) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { groupBy = 'status', filters = {} } = options || {};

  // Fetch clienti - RLS handles filtering, but we include sedi in cache key
  const allSedi = profile?.sede ? [profile.sede, ...((profile as any).sedi || [])] : [];
  const { data: clienti = [], isLoading, error } = useQuery({
    queryKey: ['clienti', profile?.sede, (profile as any)?.sedi],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clienti')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return (data || []).map(transformCliente);
    },
    enabled: !!profile,
  });

  // Apply filters
  const filteredClienti = clienti.filter(cliente => {
    if (filters.portale && cliente.portale?.toLowerCase() !== filters.portale.toLowerCase()) return false;
    if (filters.regione && !cliente.regioni.some(r => r.toLowerCase() === filters.regione!.toLowerCase())) return false;
    if (filters.ref_number && cliente.ref_number !== filters.ref_number) return false;
    if (filters.status && cliente.status !== filters.status) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        cliente.nome.toLowerCase().includes(searchLower) ||
        cliente.telefono?.toLowerCase().includes(searchLower) ||
        cliente.paese?.toLowerCase().includes(searchLower) ||
        cliente.regioni.some(r => r.toLowerCase().includes(searchLower));
      if (!matchesSearch) return false;
    }
    return true;
  });

  // Group clienti based on groupBy option
  const groupClienti = (items: Cliente[]): Map<string, Cliente[]> => {
    const groups = new Map<string, Cliente[]>();

    items.forEach(cliente => {
      let keys: string[] = [];

      switch (groupBy) {
        case 'status':
          keys = [cliente.status];
          break;
        case 'regione':
          // Duplicate card for each region
          keys = cliente.regioni.length > 0 ? cliente.regioni : ['Non specificata'];
          break;
        case 'tipologia':
          // Duplicate card for each property type
          keys = cliente.tipologia.length > 0 ? cliente.tipologia : ['Non specificata'];
          break;
        case 'budget':
          keys = [getBudgetRange(cliente.budget_max)];
          break;
        case 'agente':
          keys = [cliente.assigned_to || 'non_assegnato'];
          break;
        default:
          keys = [cliente.status];
      }

      keys.forEach(key => {
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(cliente);
      });
    });

    return groups;
  };

  const clientiGrouped = groupClienti(filteredClienti);

  // Fetch agents for assignment dropdown - include all sedi for coordinators
  const { data: agents = [] } = useQuery({
    queryKey: ['agents', profile?.sede, (profile as any)?.sedi],
    queryFn: async () => {
      const sediToFetch = [profile?.sede, ...((profile as any)?.sedi || [])].filter(Boolean);
      
      let query = supabase
        .from('profiles')
        .select('user_id, full_name, avatar_emoji, sede')
        .order('full_name');
      
      if (sediToFetch.length > 0) {
        query = query.in('sede', sediToFetch);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.sede,
  });

  // Create cliente
  const createMutation = useMutation({
    mutationFn: async (clienteData: Partial<Cliente>) => {
      const insertData = {
        nome: clienteData.nome || 'Unknown',
        telefono: clienteData.telefono,
        email: clienteData.email,
        paese: clienteData.paese,
        budget_max: clienteData.budget_max,
        regioni: clienteData.regioni,
        tipologia: clienteData.tipologia,
        descrizione: clienteData.descrizione,
        status: clienteData.status || 'new',
        sede: profile?.sede || 'AREZZO',
        comments: JSON.stringify(clienteData.comments || []),
      };
      
      const { data, error } = await supabase
        .from('clienti')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return transformCliente(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clienti'] });
    },
    onError: (error: any) => {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    },
  });

  // Update cliente with optimistic update for instant UI feedback
  const updateMutation = useMutation({
    mutationFn: async ({ id, comments, ...updates }: Partial<Cliente> & { id: string }) => {
      const updateData: Record<string, unknown> = { ...updates };
      if (comments !== undefined) {
        updateData.comments = JSON.stringify(comments);
      }
      
      const { data, error } = await supabase
        .from('clienti')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return transformCliente(data);
    },
    // Optimistic update for instant UI feedback
    onMutate: async ({ id, comments, ...updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['clienti'] });
      
      // Snapshot previous value
      const previousClienti = queryClient.getQueryData<Cliente[]>(['clienti', profile?.sede, (profile as any)?.sedi]);
      
      // Optimistically update cache
      if (previousClienti) {
        queryClient.setQueryData<Cliente[]>(['clienti', profile?.sede, (profile as any)?.sedi], (old) =>
          old?.map((c) =>
            c.id === id
              ? { 
                  ...c, 
                  ...updates,
                  ...(comments !== undefined && { comments }),
                  updated_at: new Date().toISOString(),
                }
              : c
          ) || []
        );
      }
      
      return { previousClienti };
    },
    onSuccess: () => {
      // Don't invalidate - optimistic update is already applied
      // This prevents the slow re-fetch that causes UI delay
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousClienti) {
        queryClient.setQueryData(['clienti', profile?.sede, (profile as any)?.sedi], context.previousClienti);
      }
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    },
  });

  // Delete cliente
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clienti')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clienti'] });
      toast({ title: 'Cliente eliminato' });
    },
    onError: (error: any) => {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    },
  });

  // Assign cliente to agent
  const assignMutation = useMutation({
    mutationFn: async ({ id, agentId }: { id: string; agentId: string | null }) => {
      const cliente = clienti.find(c => c.id === id);
      
      const { data, error } = await supabase
        .from('clienti')
        .update({ assigned_to: agentId })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Send notification to the assigned agent
      if (agentId && cliente) {
        const agent = agents.find(a => a.user_id === agentId);
        await supabase.from('notifications').insert({
          user_id: agentId,
          type: 'assignment',
          title: 'Nuovo cliente assegnato',
          message: `Ti è stato assegnato ${cliente.nome}${cliente.paese ? ` (${cliente.paese})` : ''}`,
          reference_id: id,
        });
      }
      
      return transformCliente(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clienti'] });
      toast({ title: 'Cliente assegnato' });
    },
    onError: (error: any) => {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    },
  });

  // Update order (for drag-drop)
  const updateOrderMutation = useMutation({
    mutationFn: async (items: { id: string; display_order: number; status?: ClienteStatus }[]) => {
      // Batch update all items in parallel
      const results = await Promise.all(
        items.map(item => {
          const updateData: Record<string, unknown> = { display_order: item.display_order };
          if (item.status) updateData.status = item.status;
          return supabase.from('clienti').update(updateData).eq('id', item.id);
        })
      );
      const errorResult = results.find(r => r.error);
      if (errorResult?.error) throw errorResult.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clienti'] });
    },
  });

  // Add comment
  const addCommentMutation = useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment: string }) => {
      const cliente = clienti.find(c => c.id === id);
      if (!cliente) throw new Error('Cliente non trovato');

      const newComment: ClienteComment = {
        id: crypto.randomUUID(),
        text: comment,
        author: profile?.full_name || 'Unknown',
        authorId: profile?.user_id || '',
        createdAt: new Date().toISOString(),
      };

      const updatedComments = [...(cliente.comments || []), newComment];

      const { data, error } = await supabase
        .from('clienti')
        .update({ comments: JSON.stringify(updatedComments) })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return transformCliente(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clienti'] });
      toast({ title: 'Commento aggiunto' });
    },
    onError: (error: any) => {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    },
  });

  // Reorder clienti - batch update display_order only (for calendar same-day reordering)
  const reorderClientiMutation = useMutation({
    mutationFn: async (updates: { id: string; display_order: number }[]) => {
      const results = await Promise.all(
        updates.map(update =>
          supabase
            .from('clienti')
            .update({ display_order: update.display_order })
            .eq('id', update.id)
        )
      );
      
      const errorResult = results.find(r => r.error);
      if (errorResult?.error) throw errorResult.error;
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ['clienti'] });
      
      const previousClienti = queryClient.getQueryData<Cliente[]>(['clienti', profile?.sede, (profile as any)?.sedi]);
      
      if (previousClienti) {
        queryClient.setQueryData<Cliente[]>(['clienti', profile?.sede, (profile as any)?.sedi], 
          previousClienti.map(cliente => {
            const update = updates.find(u => u.id === cliente.id);
            return update ? { ...cliente, display_order: update.display_order } : cliente;
          })
        );
      }
      
      return { previousClienti };
    },
    onError: (err, updates, context) => {
      if (context?.previousClienti) {
        queryClient.setQueryData(['clienti', profile?.sede, (profile as any)?.sedi], context.previousClienti);
      }
    },
  });

  return {
    clienti: filteredClienti,
    clientiGrouped,
    agents,
    isLoading,
    error,
    createCliente: createMutation.mutateAsync,
    updateCliente: updateMutation.mutateAsync,
    deleteCliente: deleteMutation.mutateAsync,
    assignCliente: assignMutation.mutateAsync,
    updateOrder: updateOrderMutation.mutateAsync,
    addComment: addCommentMutation.mutateAsync,
    reorderClienti: reorderClientiMutation,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
