import { useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  reference_id: string | null;
  read: boolean;
  created_at: string;
}

// Request browser notification permission
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// Show a browser notification
function showBrowserNotification(title: string, body?: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: body || undefined,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
      });
    } catch (e) {
      // Fallback for environments where Notification constructor fails
      console.warn('Browser notification failed:', e);
    }
  }
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const prevUnreadIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);

  // Request permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
    refetchInterval: 15000, // Poll every 15 seconds for faster detection
  });

  // Detect NEW unread notifications and trigger browser notification
  useEffect(() => {
    const currentUnread = notifications.filter(n => !n.read);
    const currentIds = new Set(currentUnread.map(n => n.id));

    if (initialLoadRef.current) {
      // On first load, just record the IDs without notifying
      prevUnreadIdsRef.current = currentIds;
      initialLoadRef.current = false;
      return;
    }

    // Find truly new notifications (not seen before)
    for (const n of currentUnread) {
      if (!prevUnreadIdsRef.current.has(n.id)) {
        showBrowserNotification(n.title, n.message || undefined);
      }
    }

    prevUnreadIdsRef.current = currentIds;
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const createNotification = useMutation({
    mutationFn: async (data: {
      user_id: string;
      type: string;
      title: string;
      message?: string;
      reference_id?: string;
    }) => {
      const { error } = await supabase
        .from('notifications')
        .insert(data);

      if (error) throw error;
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markAsRead.mutateAsync,
    markAllAsRead: markAllAsRead.mutateAsync,
    createNotification: createNotification.mutateAsync,
  };
}
