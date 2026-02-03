import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { startOfWeek, endOfWeek, format, parseISO } from 'date-fns';

export interface WeeklyProductionSummary {
  incarichi: number;
  notizie: number;
  valutazioni: number; // called "acquisizioni" in goals
  trattative: number;
}

/**
 * Fetch production data (daily_data) for a specific week and user
 * Note: "acquisizioni" in goals corresponds to "valutazioni_fatte" in daily_data
 * But in the actual daily_data table it seems "acquisizioni" is the field
 */
export const useWeeklyProductionData = (
  weekStart: string | null, 
  userId: string | null
) => {
  return useQuery({
    queryKey: ['weekly-production', weekStart, userId],
    queryFn: async (): Promise<WeeklyProductionSummary> => {
      if (!weekStart || !userId) {
        return { incarichi: 0, notizie: 0, valutazioni: 0, trattative: 0 };
      }

      const weekStartDate = parseISO(weekStart);
      const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 });
      
      const startStr = format(weekStartDate, 'yyyy-MM-dd');
      const endStr = format(weekEndDate, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('daily_data')
        .select('incarichi_vendita, notizie_reali, acquisizioni, nuove_trattative')
        .eq('user_id', userId)
        .gte('date', startStr)
        .lte('date', endStr);

      if (error) throw error;

      // Sum up the weekly values
      const summary = (data || []).reduce(
        (acc, day) => ({
          incarichi: acc.incarichi + (day.incarichi_vendita || 0),
          notizie: acc.notizie + (day.notizie_reali || 0),
          valutazioni: acc.valutazioni + (day.acquisizioni || 0), // "acquisizioni" in DB = "valutazioni" in goals
          trattative: acc.trattative + (day.nuove_trattative || 0),
        }),
        { incarichi: 0, notizie: 0, valutazioni: 0, trattative: 0 }
      );

      return summary;
    },
    enabled: !!weekStart && !!userId,
    staleTime: 1000 * 60 * 2,
  });
};

/**
 * Fetch production data for all users in a sede for a specific week
 */
export const useWeeklyProductionDataBySede = (
  weekStart: string | null,
  sede: string | null
) => {
  return useQuery({
    queryKey: ['weekly-production-sede', weekStart, sede],
    queryFn: async (): Promise<Record<string, WeeklyProductionSummary>> => {
      if (!weekStart || !sede) return {};

      const weekStartDate = parseISO(weekStart);
      const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 });
      
      const startStr = format(weekStartDate, 'yyyy-MM-dd');
      const endStr = format(weekEndDate, 'yyyy-MM-dd');

      // Get all users in this sede
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('sede', sede);

      if (profilesError) throw profilesError;
      if (!profiles || profiles.length === 0) return {};

      const userIds = profiles.map(p => p.user_id);

      // Fetch daily data for all these users in the week
      const { data, error } = await supabase
        .from('daily_data')
        .select('user_id, incarichi_vendita, notizie_reali, acquisizioni, nuove_trattative')
        .in('user_id', userIds)
        .gte('date', startStr)
        .lte('date', endStr);

      if (error) throw error;

      // Group by user
      const byUser: Record<string, WeeklyProductionSummary> = {};
      
      for (const day of data || []) {
        if (!byUser[day.user_id]) {
          byUser[day.user_id] = { incarichi: 0, notizie: 0, valutazioni: 0, trattative: 0 };
        }
        byUser[day.user_id].incarichi += day.incarichi_vendita || 0;
        byUser[day.user_id].notizie += day.notizie_reali || 0;
        byUser[day.user_id].valutazioni += day.acquisizioni || 0;
        byUser[day.user_id].trattative += day.nuove_trattative || 0;
      }

      return byUser;
    },
    enabled: !!weekStart && !!sede,
    staleTime: 1000 * 60 * 2,
  });
};
