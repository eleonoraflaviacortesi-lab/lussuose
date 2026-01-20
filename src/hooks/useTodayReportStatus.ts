import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useTodayReportStatus = () => {
  const { user } = useAuth();

  const today = new Date().toISOString().split('T')[0];

  const { data: hasReportedToday, isLoading } = useQuery({
    queryKey: ['today-report-status', user?.id, today],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('daily_data')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();
      
      if (error) throw error;
      return !!data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 1, // 1 minute cache
    refetchInterval: 1000 * 60 * 1, // refetch every minute
  });

  return {
    hasReportedToday: hasReportedToday ?? false,
    isLoading,
  };
};
