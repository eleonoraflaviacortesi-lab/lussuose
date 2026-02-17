import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfiles } from '@/hooks/useProfiles';
import { toast } from 'sonner';
import { MessageCircle } from 'lucide-react';

/**
 * Global listener for chat messages.
 * - Shows a preview banner when a new message arrives and user is NOT on the chat tab.
 * - Plays notification sound ONLY when user is @mentioned.
 */
interface ChatGlobalListenerProps {
  activeTab: string;
  onGoToChat: () => void;
}

const playNotificationSound = () => {
  try {
    const audio = new Audio('/sounds/msn_messenger_noti.mp3');
    audio.volume = 0.6;
    audio.play().catch(() => {});
  } catch {}
};

const ChatGlobalListener = ({ activeTab, onGoToChat }: ChatGlobalListenerProps) => {
  const { user, profile } = useAuth();
  const { profiles } = useProfiles();
  const sede = profile?.sede || 'AREZZO';
  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const getProfile = useCallback((userId: string) => {
    return profiles?.find(p => p.user_id === userId);
  }, [profiles]);

  useEffect(() => {
    if (!user || !sede) return;

    const channel = supabase
      .channel('chat-global-listener')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `sede=eq.${sede}`,
      }, (payload) => {
        const msg = payload.new as any;
        // Don't notify for own messages
        if (msg.user_id === user.id) return;

        const senderProfile = getProfile(msg.user_id);
        const senderName = senderProfile?.full_name || 'Qualcuno';
        const senderEmoji = senderProfile?.avatar_emoji || '🖤';
        const mentions: string[] = msg.mentions || [];
        const isMentioned = mentions.includes(user.id);

        // Play sound only when mentioned
        if (isMentioned) {
          playNotificationSound();
        }

        // Show preview banner if not in chat tab
        if (activeTabRef.current !== 'chat') {
          const previewText = msg.audio_url
            ? '🎤 Messaggio vocale'
            : msg.message?.length > 60
              ? msg.message.slice(0, 60) + '...'
              : msg.message || 'Nuovo messaggio';

          toast(
            <button
              onClick={() => { onGoToChat(); toast.dismiss(); }}
              className="flex items-center gap-3 w-full text-left"
            >
              <span className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-base flex-shrink-0">
                {senderEmoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm">{senderName}</p>
                <p className="text-xs text-muted-foreground truncate">{previewText}</p>
              </div>
              <MessageCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>,
            {
              duration: 4000,
              position: 'top-center',
              className: 'p-0',
              style: { padding: '8px 12px' },
            }
          );
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, sede, getProfile, onGoToChat]);

  return null;
};

export default ChatGlobalListener;
