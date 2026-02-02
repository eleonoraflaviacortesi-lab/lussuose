import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { ClienteStatus } from '@/types';

export interface ClientKanbanColumn {
  id: string;
  user_id: string;
  key: ClienteStatus;
  label: string;
  color: string;
  display_order: number;
}

// Default columns for new users matching client statuses
const DEFAULT_COLUMNS: Omit<ClientKanbanColumn, 'id' | 'user_id'>[] = [
  { key: 'new', label: 'Nuovi', color: '#f59e0b', display_order: 0 },
  { key: 'contacted', label: 'Contattati', color: '#60a5fa', display_order: 1 },
  { key: 'qualified', label: 'Qualificati', color: '#2563eb', display_order: 2 },
  { key: 'proposal', label: 'Proposta', color: '#f97316', display_order: 3 },
  { key: 'negotiation', label: 'Trattativa', color: '#ef4444', display_order: 4 },
  { key: 'closed_won', label: 'Chiusi ✓', color: '#22c55e', display_order: 5 },
  { key: 'closed_lost', label: 'Persi', color: '#6b7280', display_order: 6 },
];

export function useClientKanbanColumns() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: columns = [], isLoading } = useQuery({
    queryKey: ['client-kanban-columns', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_kanban_columns')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as ClientKanbanColumn[];
    },
    enabled: !!user,
  });

  // Initialize default columns if none exist
  useEffect(() => {
    if (!isLoading && columns.length === 0 && user) {
      initializeDefaultColumns();
    }
  }, [isLoading, columns.length, user]);

  const initializeDefaultColumns = async () => {
    if (!user) return;
    
    const columnsToInsert = DEFAULT_COLUMNS.map(col => ({
      ...col,
      user_id: user.id,
    }));

    await supabase.from('client_kanban_columns').insert(columnsToInsert);
    queryClient.invalidateQueries({ queryKey: ['client-kanban-columns'] });
  };

  const updateColumn = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ClientKanbanColumn> & { id: string }) => {
      const { error } = await supabase
        .from('client_kanban_columns')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-kanban-columns'] });
    },
  });

  const addColumn = useMutation({
    mutationFn: async ({ key, label, color }: { key: string; label: string; color: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      const maxOrder = columns.reduce((max, col) => Math.max(max, col.display_order), -1);
      
      const { error } = await supabase.from('client_kanban_columns').insert({
        user_id: user.id,
        key,
        label,
        color,
        display_order: maxOrder + 1,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-kanban-columns'] });
    },
  });

  const deleteColumn = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('client_kanban_columns')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-kanban-columns'] });
    },
  });

  const reorderColumns = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => ({
        id,
        display_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from('client_kanban_columns')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-kanban-columns'] });
    },
  });

  return {
    columns,
    isLoading,
    updateColumn: updateColumn.mutateAsync,
    addColumn: addColumn.mutateAsync,
    deleteColumn: deleteColumn.mutateAsync,
    reorderColumns: reorderColumns.mutateAsync,
  };
}
