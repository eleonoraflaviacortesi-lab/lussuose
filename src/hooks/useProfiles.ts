import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useProfiles = (filterBySede: boolean = true) => {
  const { user, profile } = useAuth();

  // Get profiles filtered by current user's sede (default behavior)
  const { data: profiles, isLoading } = useQuery({
    queryKey: ['profiles', filterBySede ? profile?.sede : 'all'],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      
      // Filter by sede if requested and user has a sede
      if (filterBySede && profile?.sede) {
        query = query.eq('sede', profile.sede);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user && (!filterBySede || !!profile?.sede),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  return { profiles, isLoading };
};
