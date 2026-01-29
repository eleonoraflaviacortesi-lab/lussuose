import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Appointment {
  id: string;
  user_id: string;
  cliente_id: string | null;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  google_event_id: string | null;
  google_calendar_synced: boolean;
  created_at: string;
  updated_at: string;
  cliente?: {
    id: string;
    nome: string;
  } | null;
}

export interface AppointmentInput {
  cliente_id?: string | null;
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  location?: string | null;
}

export const useAppointments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          cliente:clienti(id, nome)
        `)
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!user?.id,
  });

  const createAppointment = useMutation({
    mutationFn: async (input: AppointmentInput) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appuntamento creato');
    },
    onError: (error) => {
      console.error('Error creating appointment:', error);
      toast.error('Errore nella creazione dell\'appuntamento');
    },
  });

  const updateAppointment = useMutation({
    mutationFn: async ({ id, ...input }: AppointmentInput & { id: string }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appuntamento aggiornato');
    },
    onError: (error) => {
      console.error('Error updating appointment:', error);
      toast.error('Errore nell\'aggiornamento');
    },
  });

  const deleteAppointment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appuntamento eliminato');
    },
    onError: (error) => {
      console.error('Error deleting appointment:', error);
      toast.error('Errore nell\'eliminazione');
    },
  });

  return {
    appointments,
    isLoading,
    createAppointment,
    updateAppointment,
    deleteAppointment,
  };
};
