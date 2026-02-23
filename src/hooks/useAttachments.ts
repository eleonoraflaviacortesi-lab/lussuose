import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Attachment {
  id: string;
  entity_type: 'cliente' | 'notizia';
  entity_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  content_type: string | null;
  uploaded_by: string;
  created_at: string;
}

export function useAttachments(entityType: 'cliente' | 'notizia', entityId: string | undefined) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: attachments = [], isLoading } = useQuery({
    queryKey: ['attachments', entityType, entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Attachment[];
    },
    enabled: !!entityId && !!profile,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!profile?.user_id || !entityId) throw new Error('Missing context');

      const ext = file.name.split('.').pop();
      const filePath = `${entityType}/${entityId}/${crypto.randomUUID()}.${ext}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save metadata
      const { data, error } = await supabase
        .from('attachments')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          content_type: file.type,
          uploaded_by: profile.user_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Attachment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', entityType, entityId] });
      toast({ title: 'File caricato' });
    },
    onError: (error: any) => {
      toast({ title: 'Errore upload', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (attachment: Attachment) => {
      // Delete from storage
      await supabase.storage.from('attachments').remove([attachment.file_path]);

      // Delete metadata
      const { error } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachment.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', entityType, entityId] });
      toast({ title: 'File eliminato' });
    },
    onError: (error: any) => {
      toast({ title: 'Errore eliminazione', description: error.message, variant: 'destructive' });
    },
  });

  const getDownloadUrl = async (filePath: string) => {
    const { data } = await supabase.storage
      .from('attachments')
      .createSignedUrl(filePath, 3600);
    return data?.signedUrl;
  };

  return {
    attachments,
    isLoading,
    uploadFile: uploadMutation.mutateAsync,
    deleteFile: deleteMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    getDownloadUrl,
  };
}
