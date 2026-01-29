import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ClienteActivity, ClienteActivityType } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface CreateActivityInput {
  cliente_id: string;
  activity_type: ClienteActivityType;
  title: string;
  description?: string;
  property_id?: string;
}

export function useClienteActivities(clienteId?: string) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch activities for a specific cliente
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['cliente-activities', clienteId],
    queryFn: async () => {
      if (!clienteId) return [];

      const { data, error } = await supabase
        .from('cliente_activities')
        .select(`
          *,
          profiles!cliente_activities_created_by_fkey(full_name, avatar_emoji),
          properties(title)
        `)
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback query without joins if FK doesn't exist
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('cliente_activities')
          .select('*')
          .eq('cliente_id', clienteId)
          .order('created_at', { ascending: false });

        if (fallbackError) throw fallbackError;
        return (fallbackData || []) as ClienteActivity[];
      }

      return (data || []).map((row: any): ClienteActivity => ({
        id: row.id,
        cliente_id: row.cliente_id,
        activity_type: row.activity_type,
        title: row.title,
        description: row.description,
        property_id: row.property_id,
        created_by: row.created_by,
        created_at: row.created_at,
        author_name: row.profiles?.full_name,
        author_emoji: row.profiles?.avatar_emoji,
        property_title: row.properties?.title,
      }));
    },
    enabled: !!clienteId && !!profile,
  });

  // Create activity
  const createMutation = useMutation({
    mutationFn: async (input: CreateActivityInput) => {
      const { data, error } = await supabase
        .from('cliente_activities')
        .insert({
          cliente_id: input.cliente_id,
          activity_type: input.activity_type,
          title: input.title,
          description: input.description || null,
          property_id: input.property_id || null,
          created_by: profile?.user_id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update last_contact_date if it's a contact activity
      if (['call', 'email', 'visit'].includes(input.activity_type)) {
        await supabase
          .from('clienti')
          .update({ last_contact_date: new Date().toISOString() })
          .eq('id', input.cliente_id);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cliente-activities', variables.cliente_id] });
      queryClient.invalidateQueries({ queryKey: ['clienti'] });
    },
    onError: (error: any) => {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    },
  });

  // Delete activity
  const deleteMutation = useMutation({
    mutationFn: async (activityId: string) => {
      const { error } = await supabase
        .from('cliente_activities')
        .delete()
        .eq('id', activityId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente-activities', clienteId] });
    },
    onError: (error: any) => {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    },
  });

  // Helper to log common activities
  const logCall = (clienteId: string, description?: string) => 
    createMutation.mutateAsync({
      cliente_id: clienteId,
      activity_type: 'call',
      title: 'Chiamata effettuata',
      description,
    });

  const logEmail = (clienteId: string, description?: string) => 
    createMutation.mutateAsync({
      cliente_id: clienteId,
      activity_type: 'email',
      title: 'Email inviata',
      description,
    });

  const logVisit = (clienteId: string, description?: string) => 
    createMutation.mutateAsync({
      cliente_id: clienteId,
      activity_type: 'visit',
      title: 'Appuntamento/Visita',
      description,
    });

  const logProposal = (clienteId: string, propertyId: string, propertyTitle: string) => 
    createMutation.mutateAsync({
      cliente_id: clienteId,
      activity_type: 'proposal',
      title: 'Proposta immobiliare inviata',
      description: propertyTitle,
      property_id: propertyId,
    });

  const logStatusChange = (clienteId: string, fromStatus: string, toStatus: string) => 
    createMutation.mutateAsync({
      cliente_id: clienteId,
      activity_type: 'status_change',
      title: 'Cambio stato',
      description: `${fromStatus} → ${toStatus}`,
    });

  const logAssignment = (clienteId: string, agentName: string | null) => 
    createMutation.mutateAsync({
      cliente_id: clienteId,
      activity_type: 'assignment',
      title: agentName ? 'Cliente assegnato' : 'Assegnazione rimossa',
      description: agentName || undefined,
    });

  const logComment = (clienteId: string, commentPreview: string) => 
    createMutation.mutateAsync({
      cliente_id: clienteId,
      activity_type: 'comment',
      title: 'Commento aggiunto',
      description: commentPreview.substring(0, 100),
    });

  return {
    activities,
    isLoading,
    createActivity: createMutation.mutateAsync,
    deleteActivity: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    // Convenience methods
    logCall,
    logEmail,
    logVisit,
    logProposal,
    logStatusChange,
    logAssignment,
    logComment,
  };
}
