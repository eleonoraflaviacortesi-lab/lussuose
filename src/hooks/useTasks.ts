import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type Task = {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  due_date: string;
  completed: boolean;
  display_order: number;
  card_color: string | null;
  is_urgent: boolean;
  created_at: string;
  updated_at: string;
};

export const useTasks = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!user?.id,
  });

  const createTask = useMutation({
    mutationFn: async (newTask: { title: string; notes?: string; due_date: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: newTask.title,
          notes: newTask.notes || null,
          due_date: newTask.due_date,
          completed: false,
          display_order: 0,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const updateTask = useMutation({
    mutationFn: async (updates: { id: string; title?: string; notes?: string; due_date?: string; completed?: boolean; display_order?: number; card_color?: string | null; is_urgent?: boolean }) => {
      const { id, ...rest } = updates;
      
      const { data, error } = await supabase
        .from('tasks')
        .update(rest)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Task;
    },
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      
      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', user?.id]);
      
      // Optimistically update
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(['tasks', user?.id], 
          previousTasks.map(task => 
            task.id === updates.id ? { ...task, ...updates } : task
          )
        );
      }
      
      return { previousTasks };
    },
    onError: (err, updates, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', user?.id], context.previousTasks);
      }
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
      
      if (error) throw error;
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', user?.id]);
      
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(['tasks', user?.id], 
          previousTasks.filter(task => task.id !== taskId)
        );
      }
      
      return { previousTasks };
    },
    onError: (err, taskId, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', user?.id], context.previousTasks);
      }
    },
  });

  const toggleCompleted = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ completed })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Task;
    },
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', user?.id]);
      
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(['tasks', user?.id], 
          previousTasks.map(task => 
            task.id === id ? { ...task, completed } : task
          )
        );
      }
      
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', user?.id], context.previousTasks);
      }
    },
  });

  return {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    toggleCompleted,
  };
};
