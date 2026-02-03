import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';
import { Json } from '@/integrations/supabase/types';

// Default statuses + any custom status string
export type NotiziaStatus = 'new' | 'in_progress' | 'done' | 'on_shot' | 'taken' | 'credit' | 'no' | 'sold' | string;

export interface NotiziaComment {
  id: string;
  text: string;
  created_at: string;
}

export interface Notizia {
  id: string;
  user_id: string;
  name: string;
  zona: string | null;
  phone: string | null;
  type: string | null;
  notes: string | null;
  status: NotiziaStatus;
  emoji: string | null;
  reminder_date: string | null;
  created_at: string;
  updated_at: string;
  comments: NotiziaComment[];
  card_color: string | null;
  display_order: number;
  is_online: boolean;
}

export interface NotiziaInput {
  name: string;
  zona?: string;
  phone?: string;
  type?: string;
  notes?: string;
  status?: NotiziaStatus;
  emoji?: string;
  reminder_date?: string;
  created_at?: string;
  comments?: NotiziaComment[];
  card_color?: string | null;
  display_order?: number;
  is_online?: boolean;
}

// Helper to parse comments from JSON
const parseComments = (comments: Json | null): NotiziaComment[] => {
  if (!comments || !Array.isArray(comments)) return [];
  return comments.map(c => ({
    id: String((c as Record<string, unknown>).id || ''),
    text: String((c as Record<string, unknown>).text || ''),
    created_at: String((c as Record<string, unknown>).created_at || ''),
  }));
};

export const useNotizie = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch only user's own notizie (for Notizie page, Calendar)
  const { data: notizie, isLoading } = useQuery({
    queryKey: ['notizie', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('notizie')
        .select('id,name,zona,phone,type,notes,status,emoji,created_at,updated_at,user_id,reminder_date,comments,card_color,display_order,is_online')
        .eq('user_id', user.id) // Only user's own notizie
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform data to match our Notizia interface
      return (data || []).map(item => ({
        ...item,
        status: item.status as NotiziaStatus,
        comments: parseComments(item.comments),
        is_online: item.is_online ?? false,
      })) as Notizia[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in garbage collection for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on tab focus
  });

  const addNotizia = useMutation({
    mutationFn: async (input: NotiziaInput) => {
      if (!user) throw new Error('Non autenticato');
      
      const { comments, ...rest } = input;
      const { error } = await supabase
        .from('notizie')
        .insert({ 
          ...rest, 
          user_id: user.id,
          comments: comments ? JSON.parse(JSON.stringify(comments)) : [],
        });
      
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
    mutationFn: async ({ id, comments, silent, ...input }: Partial<NotiziaInput> & { id: string; silent?: boolean }) => {
      if (!user) throw new Error('Non autenticato');
      
      const updateData: Record<string, unknown> = { ...input };
      if (comments !== undefined) {
        updateData.comments = JSON.parse(JSON.stringify(comments));
      }
      
      const { error } = await supabase
        .from('notizie')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      return { silent };
    },
    // Optimistic update for instant UI feedback
    onMutate: async ({ id, comments, silent, ...input }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notizie'] });
      
      // Snapshot previous value
      const previousNotizie = queryClient.getQueryData<Notizia[]>(['notizie']);
      
      // Optimistically update cache
      if (previousNotizie) {
        queryClient.setQueryData<Notizia[]>(['notizie'], (old) =>
          old?.map((n) =>
            n.id === id
              ? { 
                  ...n, 
                  ...input,
                  ...(comments !== undefined && { comments }),
                  updated_at: new Date().toISOString(),
                }
              : n
          ) || []
        );
      }
      
      return { previousNotizie, silent };
    },
    onSuccess: (_data, _variables, context) => {
      // Don't invalidate - optimistic update is already applied
      // This prevents the slow re-fetch that causes UI delay
      // Only show toast if not silent
      if (!context?.silent) {
        toast({ title: 'Notizia aggiornata!' });
      }
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousNotizie) {
        queryClient.setQueryData(['notizie'], context.previousNotizie);
      }
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

  // Group notizie by status dynamically (supports custom columns)
  const notizieByStatus = (notizie || []).reduce((acc, notizia) => {
    const status = notizia.status;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(notizia);
    return acc;
  }, {} as Record<string, Notizia[]>);
  
  // Sort each group by display_order
  Object.keys(notizieByStatus).forEach(key => {
    notizieByStatus[key].sort((a, b) => a.display_order - b.display_order);
  });

  // Batch update order for multiple notizie using Promise.all for performance
  const updateOrder = useMutation({
    mutationFn: async (updates: { id: string; display_order: number; status?: NotiziaStatus }[]) => {
      if (!user) throw new Error('Non autenticato');
      
      // Execute all updates in parallel for better performance
      const results = await Promise.all(
        updates.map(update =>
          supabase
            .from('notizie')
            .update({ 
              display_order: update.display_order, 
              ...(update.status && { status: update.status }) 
            })
            .eq('id', update.id)
        )
      );
      
      // Check for any errors
      const errorResult = results.find(r => r.error);
      if (errorResult?.error) throw errorResult.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notizie'] });
    },
  });

  return {
    notizie,
    notizieByStatus,
    isLoading,
    addNotizia,
    updateNotizia,
    deleteNotizia,
    updateOrder,
  };
};

// Separate hook to search ALL notizie (for meetings only)
export const useAllNotizie = () => {
  const { user } = useAuth();

  const { data: allNotizie, isLoading } = useQuery({
    queryKey: ['all-notizie'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('notizie')
        .select('id,name,zona,phone,type,notes,status,emoji,created_at,updated_at,user_id,reminder_date,card_color,display_order,is_online')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        status: item.status as NotiziaStatus,
        comments: [] as NotiziaComment[], // Don't load comments for search
        is_online: item.is_online ?? false,
      })) as Notizia[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  return { allNotizie, isLoading };
};
