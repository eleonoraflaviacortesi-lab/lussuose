import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Property {
  id: string;
  ref_number: string | null;
  title: string;
  url: string;
  price: number | null;
  location: string | null;
  region: string | null;
  property_type: string | null;
  surface_mq: number | null;
  rooms: number | null;
  bathrooms: number | null;
  has_pool: boolean;
  has_land: boolean;
  land_hectares: number | null;
  image_url: string | null;
  description: string | null;
  features: string[];
  scraped_at: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PropertyMatch {
  id: string;
  cliente_id: string;
  property_id: string;
  match_type: 'auto' | 'manual';
  match_score: number;
  suggested: boolean;
  suggested_at: string | null;
  suggested_by: string | null;
  notes: string | null;
  reaction: 'liked' | 'disliked' | null;
  created_at: string;
  updated_at: string;
  property?: Property;
}

export function useProperties() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all active properties
  const { data: properties = [], isLoading, error } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('active', true)
        .order('price', { ascending: false });

      if (error) throw error;
      return data as Property[];
    },
    enabled: !!profile,
  });

  // Sync properties from website
  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sync-properties');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast({ 
        title: 'Sync completato', 
        description: `${data.stats?.scraped || 0} proprietà sincronizzate` 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Errore sync', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const refetchProperties = () => {
    queryClient.invalidateQueries({ queryKey: ['properties'] });
  };

  return {
    properties,
    isLoading,
    error,
    syncProperties: syncMutation.mutateAsync,
    isSyncing: syncMutation.isPending,
    refetchProperties,
  };
}

export function useClientPropertyMatches(clienteId: string | undefined) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch matches for a specific client
  const { data: matches = [], isLoading, error } = useQuery({
    queryKey: ['property-matches', clienteId],
    queryFn: async () => {
      if (!clienteId) return [];

      const { data, error } = await supabase
        .from('client_property_matches')
        .select(`
          *,
          property:properties(*)
        `)
        .eq('cliente_id', clienteId)
        .order('match_score', { ascending: false });

      if (error) throw error;
      return data as PropertyMatch[];
    },
    enabled: !!profile && !!clienteId,
  });

  // Calculate matches for this client
  const calculateMatchesMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('match-properties', {
        body: { clienteId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['property-matches', clienteId] });
      toast({ 
        title: 'Match calcolati', 
        description: `${data.stats?.matches || 0} proprietà compatibili trovate` 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Errore calcolo match', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  // Toggle suggested status
  const toggleSuggestedMutation = useMutation({
    mutationFn: async ({ matchId, suggested }: { matchId: string; suggested: boolean }) => {
      const { data, error } = await supabase
        .from('client_property_matches')
        .update({ 
          suggested,
          suggested_at: suggested ? new Date().toISOString() : null,
          suggested_by: suggested ? profile?.user_id : null,
        })
        .eq('id', matchId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-matches', clienteId] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Errore', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  // Set reaction (liked/disliked)
  const setReactionMutation = useMutation({
    mutationFn: async ({ matchId, reaction }: { matchId: string; reaction: 'liked' | 'disliked' | null }) => {
      const { data, error } = await supabase
        .from('client_property_matches')
        .update({ reaction })
        .eq('id', matchId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-matches', clienteId] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Errore', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  // Add manual match
  const addManualMatchMutation = useMutation({
    mutationFn: async ({ propertyId, notes }: { propertyId: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('client_property_matches')
        .insert({
          cliente_id: clienteId,
          property_id: propertyId,
          match_type: 'manual',
          match_score: 100, // Manual matches get full score
          notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-matches', clienteId] });
      toast({ title: 'Proprietà aggiunta' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Errore', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  // Remove match
  const removeMatchMutation = useMutation({
    mutationFn: async (matchId: string) => {
      const { error } = await supabase
        .from('client_property_matches')
        .delete()
        .eq('id', matchId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-matches', clienteId] });
      toast({ title: 'Associazione rimossa' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Errore', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  // Update match notes (comments)
  const updateNotesMutation = useMutation({
    mutationFn: async ({ matchId, notes }: { matchId: string; notes: string }) => {
      const { data, error } = await supabase
        .from('client_property_matches')
        .update({ notes })
        .eq('id', matchId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-matches', clienteId] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Errore', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  return {
    matches,
    isLoading,
    error,
    calculateMatches: calculateMatchesMutation.mutateAsync,
    isCalculating: calculateMatchesMutation.isPending,
    toggleSuggested: toggleSuggestedMutation.mutateAsync,
    setReaction: setReactionMutation.mutateAsync,
    addManualMatch: addManualMatchMutation.mutateAsync,
    removeMatch: removeMatchMutation.mutateAsync,
    updateNotes: updateNotesMutation.mutateAsync,
  };
}
