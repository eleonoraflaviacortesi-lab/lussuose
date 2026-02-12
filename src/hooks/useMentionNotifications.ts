import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfiles } from '@/hooks/useProfiles';
import { getMentionedUserIds } from '@/components/ui/mention-input';

/**
 * Hook to send notifications to mentioned users in a text.
 * Returns a function that parses @mentions and creates notifications.
 */
export function useMentionNotifications() {
  const { user, profile } = useAuth();
  const { profiles } = useProfiles(true);

  const sendMentionNotifications = useCallback(async (
    text: string,
    context: {
      type: 'task' | 'comment_notizia' | 'comment_cliente';
      entityName: string;
      referenceId?: string;
    }
  ) => {
    if (!user || !profiles || !text) return;

    const mentionedIds = getMentionedUserIds(text, profiles);
    // Don't notify yourself
    const toNotify = mentionedIds.filter(id => id !== user.id);

    if (toNotify.length === 0) return;

    const senderName = profile?.full_name || 'Qualcuno';
    
    let title = '';
    let message = '';
    
    switch (context.type) {
      case 'task':
        title = `${senderName} ti ha taggato in una task`;
        message = `Task: ${context.entityName}`;
        break;
      case 'comment_notizia':
        title = `${senderName} ti ha menzionato in un commento`;
        message = `Notizia: ${context.entityName}`;
        break;
      case 'comment_cliente':
        title = `${senderName} ti ha menzionato in un commento`;
        message = `Cliente: ${context.entityName}`;
        break;
    }

    // Insert notifications for all mentioned users
    const notifications = toNotify.map(userId => ({
      user_id: userId,
      type: 'mention',
      title,
      message,
      reference_id: context.referenceId || null,
    }));

    await supabase.from('notifications').insert(notifications);
  }, [user, profile, profiles]);

  return { sendMentionNotifications };
}
