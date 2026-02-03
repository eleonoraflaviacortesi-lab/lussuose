import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

export interface KanbanColumn {
  id: string;
  user_id: string;
  key: string;
  label: string;
  color: string;
  display_order: number;
}

// Default columns for new users
const DEFAULT_COLUMNS: Omit<KanbanColumn, 'id' | 'user_id'>[] = [
  { key: 'new', label: 'New', color: '#22c55e', display_order: 0 },
  { key: 'in_progress', label: 'In Progress', color: '#f59e0b', display_order: 1 },
  { key: 'done', label: 'Done', color: '#3b82f6', display_order: 2 },
  { key: 'on_shot', label: 'On Shot', color: '#ef4444', display_order: 3 },
  { key: 'taken', label: 'Presi', color: '#8b5cf6', display_order: 4 },
  { key: 'credit', label: 'Credit', color: '#06b6d4', display_order: 5 },
  { key: 'no', label: 'No', color: '#1f2937', display_order: 6 },
  { key: 'sold', label: 'Sold', color: '#6b7280', display_order: 7 },
];

// Protected column that cannot be deleted or renamed (only color can be changed)
export const PROTECTED_COLUMN_KEY = 'taken';

export function useKanbanColumns() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: columns = [], isLoading } = useQuery({
    queryKey: ['kanban-columns', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kanban_columns')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as KanbanColumn[];
    },
    enabled: !!user,
  });

  // Initialize default columns if none exist, or ensure protected column exists
  useEffect(() => {
    if (!isLoading && user) {
      if (columns.length === 0) {
        initializeDefaultColumns();
      } else {
        // Ensure protected column exists
        const hasTakenColumn = columns.some(c => c.key === PROTECTED_COLUMN_KEY);
        if (!hasTakenColumn) {
          ensureProtectedColumn();
        }
      }
    }
  }, [isLoading, columns.length, user]);

  const ensureProtectedColumn = async () => {
    if (!user) return;
    
    // Find max display_order to add at the end
    const maxOrder = columns.reduce((max, col) => Math.max(max, col.display_order), -1);
    
    await supabase.from('kanban_columns').insert({
      user_id: user.id,
      key: PROTECTED_COLUMN_KEY,
      label: 'Presi',
      color: '#8b5cf6',
      display_order: maxOrder + 1,
    });
    queryClient.invalidateQueries({ queryKey: ['kanban-columns'] });
  };

  const initializeDefaultColumns = async () => {
    if (!user) return;
    
    const columnsToInsert = DEFAULT_COLUMNS.map(col => ({
      ...col,
      user_id: user.id,
    }));

    await supabase.from('kanban_columns').insert(columnsToInsert);
    queryClient.invalidateQueries({ queryKey: ['kanban-columns'] });
  };

  const updateColumn = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<KanbanColumn> & { id: string }) => {
      // Find the column to check if it's protected
      const column = columns.find(c => c.id === id);
      if (column?.key === PROTECTED_COLUMN_KEY && updates.label !== undefined) {
        // Don't allow renaming protected column, but allow color change
        delete updates.label;
      }

      const { error } = await supabase
        .from('kanban_columns')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-columns'] });
    },
  });

  const addColumn = useMutation({
    mutationFn: async ({ label, color }: { label: string; color: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      const key = `custom_${Date.now()}`;
      const maxOrder = columns.reduce((max, col) => Math.max(max, col.display_order), -1);
      
      const { error } = await supabase.from('kanban_columns').insert({
        user_id: user.id,
        key,
        label,
        color,
        display_order: maxOrder + 1,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-columns'] });
    },
  });

  const deleteColumn = useMutation({
    mutationFn: async (id: string) => {
      // Prevent deletion of protected column
      const column = columns.find(c => c.id === id);
      if (column?.key === PROTECTED_COLUMN_KEY) {
        throw new Error('La colonna "Presi" non può essere eliminata');
      }

      const { error } = await supabase
        .from('kanban_columns')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-columns'] });
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
          .from('kanban_columns')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-columns'] });
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
