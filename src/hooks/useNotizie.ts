import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';
import { Json } from '@/integrations/supabase/types';

export type NotiziaStatus = 'new' | 'in_progress' | 'done' | 'on_shot' | 'taken' | 'no' | 'sold';

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

  const { data: notizie, isLoading } = useQuery({
    queryKey: ['notizie'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('notizie')
        .select('id,name,zona,phone,type,notes,status,emoji,created_at,updated_at,user_id,reminder_date,comments,card_color')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform data to match our Notizia interface
      return (data || []).map(item => ({
        ...item,
        status: item.status as NotiziaStatus,
        comments: parseComments(item.comments),
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
    mutationFn: async ({ id, comments, ...input }: Partial<NotiziaInput> & { id: string }) => {
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
    no: notizie?.filter(n => n.status === 'no') || [],
    sold: notizie?.filter(n => n.status === 'sold') || [],
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
