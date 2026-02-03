import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';
import { startOfWeek, getISOWeek, getYear, format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

export type MeetingItemType = 'incarico' | 'trattativa' | 'acquirente' | 'obiettivo' | 'task';
export type MeetingItemStatus = 'open' | 'completed' | 'postponed';

export interface MeetingItem {
  id: string;
  meeting_id: string;
  item_type: MeetingItemType;
  title: string;
  description: string | null;
  assigned_to: string | null;
  status: MeetingItemStatus;
  linked_notizia_id: string | null;
  linked_cliente_id: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  assigned_to_name?: string;
  assigned_to_emoji?: string;
  linked_notizia_name?: string;
  linked_cliente_name?: string;
}

export interface Meeting {
  id: string;
  sede: string;
  week_start: string;
  week_number: number;
  year: number;
  title: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  items?: MeetingItem[];
}

export interface MeetingInput {
  sede: string;
  week_start: string;
  week_number: number;
  year: number;
  title?: string;
  notes?: string;
}

export interface MeetingItemInput {
  meeting_id: string;
  item_type: MeetingItemType;
  title: string;
  description?: string;
  assigned_to?: string;
  status?: MeetingItemStatus;
  linked_notizia_id?: string;
  linked_cliente_id?: string;
  display_order?: number;
}

// Get week info for a date
export const getWeekInfo = (date: Date) => {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  return {
    weekStart: format(weekStart, 'yyyy-MM-dd'),
    weekNumber: getISOWeek(date),
    year: getYear(date),
    label: `Settimana ${getISOWeek(date)}, ${getYear(date)}`,
  };
};

export const useMeetings = (sede?: string) => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const effectiveSede = sede || profile?.sede || 'AREZZO';

  // Fetch all meetings for sede
  const { data: meetings, isLoading } = useQuery({
    queryKey: ['meetings', effectiveSede],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('sede', effectiveSede)
        .order('week_start', { ascending: false });

      if (error) throw error;
      return data as Meeting[];
    },
    enabled: !!user,
  });

  // Fetch single meeting with items
  const useMeetingDetail = (meetingId: string | null) => {
    return useQuery({
      queryKey: ['meeting', meetingId],
      queryFn: async () => {
        if (!meetingId) return null;

        // Fetch meeting
        const { data: meeting, error: meetingError } = await supabase
          .from('meetings')
          .select('*')
          .eq('id', meetingId)
          .single();

        if (meetingError) throw meetingError;

        // Fetch items with joined data
        const { data: items, error: itemsError } = await supabase
          .from('meeting_items')
          .select('*')
          .eq('meeting_id', meetingId)
          .order('item_type')
          .order('display_order');

        if (itemsError) throw itemsError;

        // Fetch profiles for assigned_to
        const assignedIds = [...new Set(items.filter(i => i.assigned_to).map(i => i.assigned_to))];
        let profilesMap: Record<string, { name: string; emoji: string }> = {};
        
        if (assignedIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_emoji')
            .in('user_id', assignedIds);
          
          profiles?.forEach(p => {
            profilesMap[p.user_id] = { name: p.full_name, emoji: p.avatar_emoji || '🖤' };
          });
        }

        // Fetch linked notizie names
        const notiziaIds = [...new Set(items.filter(i => i.linked_notizia_id).map(i => i.linked_notizia_id))];
        let notizieMap: Record<string, string> = {};
        
        if (notiziaIds.length > 0) {
          const { data: notizie } = await supabase
            .from('notizie')
            .select('id, name')
            .in('id', notiziaIds);
          
          notizie?.forEach(n => {
            notizieMap[n.id] = n.name;
          });
        }

        // Fetch linked clienti names
        const clienteIds = [...new Set(items.filter(i => i.linked_cliente_id).map(i => i.linked_cliente_id))];
        let clientiMap: Record<string, string> = {};
        
        if (clienteIds.length > 0) {
          const { data: clienti } = await supabase
            .from('clienti')
            .select('id, nome')
            .in('id', clienteIds);
          
          clienti?.forEach(c => {
            clientiMap[c.id] = c.nome;
          });
        }

        // Enrich items
        const enrichedItems: MeetingItem[] = items.map(item => ({
          ...item,
          item_type: item.item_type as MeetingItemType,
          status: item.status as MeetingItemStatus,
          assigned_to_name: item.assigned_to ? profilesMap[item.assigned_to]?.name : undefined,
          assigned_to_emoji: item.assigned_to ? profilesMap[item.assigned_to]?.emoji : undefined,
          linked_notizia_name: item.linked_notizia_id ? notizieMap[item.linked_notizia_id] : undefined,
          linked_cliente_name: item.linked_cliente_id ? clientiMap[item.linked_cliente_id] : undefined,
        }));

        return { ...meeting, items: enrichedItems } as Meeting;
      },
      enabled: !!meetingId && !!user,
    });
  };

  // Create or get meeting for a week
  const createOrGetMeeting = useMutation({
    mutationFn: async (input: MeetingInput) => {
      if (!user) throw new Error('Non autenticato');

      // Try to find existing meeting for this week
      const { data: existing } = await supabase
        .from('meetings')
        .select('id')
        .eq('sede', input.sede)
        .eq('week_start', input.week_start)
        .single();

      if (existing) return existing.id;

      // Create new meeting
      const { data, error } = await supabase
        .from('meetings')
        .insert({
          ...input,
          created_by: user.id,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
    onError: (error) => {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    },
  });

  // Update meeting
  const updateMeeting = useMutation({
    mutationFn: async ({ id, ...input }: Partial<MeetingInput> & { id: string }) => {
      const { error } = await supabase
        .from('meetings')
        .update(input)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['meeting', variables.id] });
    },
  });

  // Add item to meeting
  const addItem = useMutation({
    mutationFn: async (input: MeetingItemInput) => {
      if (!user) throw new Error('Non autenticato');

      const { error } = await supabase
        .from('meeting_items')
        .insert(input);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meeting', variables.meeting_id] });
      toast({ title: 'Voce aggiunta!' });
    },
    onError: (error) => {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    },
  });

  // Update item
  const updateItem = useMutation({
    mutationFn: async ({ id, meeting_id, ...input }: Partial<MeetingItemInput> & { id: string; meeting_id: string }) => {
      const { error } = await supabase
        .from('meeting_items')
        .update(input)
        .eq('id', id);

      if (error) throw error;
      return meeting_id;
    },
    onSuccess: (meetingId) => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
    },
  });

  // Delete item
  const deleteItem = useMutation({
    mutationFn: async ({ id, meeting_id }: { id: string; meeting_id: string }) => {
      const { error } = await supabase
        .from('meeting_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return meeting_id;
    },
    onSuccess: (meetingId) => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
      toast({ title: 'Voce eliminata' });
    },
  });

  // Delete meeting
  const deleteMeeting = useMutation({
    mutationFn: async (meetingId: string) => {
      // First delete all items
      const { error: itemsError } = await supabase
        .from('meeting_items')
        .delete()
        .eq('meeting_id', meetingId);
      
      if (itemsError) throw itemsError;

      // Then delete meeting
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meetingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast({ title: 'Riunione eliminata' });
    },
    onError: (error) => {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    },
  });

  // Duplicate meeting to current week
  const duplicateMeeting = useMutation({
    mutationFn: async (sourceMeetingId: string) => {
      if (!user) throw new Error('Non autenticato');

      // Get source meeting with items
      const { data: sourceMeeting, error: meetingError } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', sourceMeetingId)
        .single();

      if (meetingError) throw meetingError;

      const { data: sourceItems, error: itemsError } = await supabase
        .from('meeting_items')
        .select('*')
        .eq('meeting_id', sourceMeetingId);

      if (itemsError) throw itemsError;

      // Get current week info
      const today = new Date();
      const weekInfo = getWeekInfo(today);

      // Check if meeting already exists for current week
      const { data: existing } = await supabase
        .from('meetings')
        .select('id')
        .eq('sede', sourceMeeting.sede)
        .eq('week_start', weekInfo.weekStart)
        .maybeSingle();

      if (existing) {
        throw new Error('Esiste già una riunione per questa settimana');
      }

      // Create new meeting for current week
      const { data: newMeeting, error: createError } = await supabase
        .from('meetings')
        .insert({
          sede: sourceMeeting.sede,
          week_start: weekInfo.weekStart,
          week_number: weekInfo.weekNumber,
          year: weekInfo.year,
          title: `Riunione ${weekInfo.label}`,
          notes: sourceMeeting.notes,
          created_by: user.id,
        })
        .select('id')
        .single();

      if (createError) throw createError;

      // Copy items to new meeting
      if (sourceItems && sourceItems.length > 0) {
        const newItems = sourceItems.map(item => ({
          meeting_id: newMeeting.id,
          item_type: item.item_type,
          title: item.title,
          description: item.description,
          assigned_to: item.assigned_to,
          status: 'open', // Reset status
          linked_notizia_id: item.linked_notizia_id,
          linked_cliente_id: item.linked_cliente_id,
          display_order: item.display_order,
          buyer_name: item.buyer_name,
          goal_incarichi: item.goal_incarichi,
          goal_notizie: item.goal_notizie,
          goal_acquisizioni: item.goal_acquisizioni,
          goal_trattative: item.goal_trattative,
          notes: item.notes,
        }));

        const { error: insertError } = await supabase
          .from('meeting_items')
          .insert(newItems);

        if (insertError) throw insertError;
      }

      return newMeeting.id;
    },
    onSuccess: (newMeetingId) => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast({ title: 'Riunione duplicata per questa settimana!' });
      return newMeetingId;
    },
    onError: (error) => {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    },
  });

  return {
    meetings,
    isLoading,
    useMeetingDetail,
    createOrGetMeeting,
    updateMeeting,
    addItem,
    updateItem,
    deleteItem,
    deleteMeeting,
    duplicateMeeting,
  };
};

// Hook to find meetings where a notizia/cliente was discussed
export const useEntityMeetings = (entityType: 'notizia' | 'cliente', entityId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['entity-meetings', entityType, entityId],
    queryFn: async () => {
      if (!entityId) return [];

      const column = entityType === 'notizia' ? 'linked_notizia_id' : 'linked_cliente_id';
      
      const { data, error } = await supabase
        .from('meeting_items')
        .select(`
          id,
          title,
          item_type,
          status,
          meeting_id,
          meetings!inner(id, week_start, week_number, year, sede)
        `)
        .eq(column, entityId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!entityId && !!user,
  });
};
