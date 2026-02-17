import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfiles } from '@/hooks/useProfiles';
import { Send, Reply, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { it } from 'date-fns/locale';

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  reply_to_id: string | null;
  sede: string;
  created_at: string;
}

const OfficeChatPage = () => {
  const { user, profile } = useAuth();
  const { profiles } = useProfiles();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isNearBottomRef = useRef(true);

  const sede = profile?.sede || 'AREZZO';

  const getProfile = useCallback((userId: string) => {
    return profiles?.find(p => p.user_id === userId);
  }, [profiles]);

  // Load messages
  useEffect(() => {
    if (!user || !sede) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('sede', sede)
        .order('created_at', { ascending: true })
        .limit(200);
      if (data) setMessages(data as ChatMessage[]);
    };

    loadMessages();

    // Realtime subscription
    const channel = supabase
      .channel('office-chat')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `sede=eq.${sede}`,
      }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        if (isNearBottomRef.current) {
          setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'chat_messages',
      }, (payload) => {
        setMessages(prev => prev.filter(m => m.id !== (payload.old as any).id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, sede]);

  // Initial scroll
  useEffect(() => {
    if (messages.length > 0) {
      endRef.current?.scrollIntoView({ behavior: 'instant' as any });
    }
  }, [messages.length === 0]); // only on first load

  // Scroll tracking
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const near = el.scrollTop + el.clientHeight >= el.scrollHeight - 120;
      isNearBottomRef.current = near;
      setShowScrollBtn(!near);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToBottom = () => endRef.current?.scrollIntoView({ behavior: 'smooth' });

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || isSending) return;
    setIsSending(true);
    const text = newMessage.trim();
    setNewMessage('');
    const replyId = replyTo?.id || null;
    setReplyTo(null);

    try {
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        message: text,
        reply_to_id: replyId,
        sede,
      });
    } catch {
      setNewMessage(text);
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = '0';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }, [newMessage]);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return format(d, 'HH:mm');
  };

  const formatDateSeparator = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isToday(d)) return 'Oggi';
    if (isYesterday(d)) return 'Ieri';
    return format(d, 'd MMMM yyyy', { locale: it });
  };

  // Group messages by date
  const messagesWithDates: Array<{ type: 'date'; date: string } | { type: 'msg'; msg: ChatMessage }> = [];
  let lastDate = '';
  for (const msg of messages) {
    const d = new Date(msg.created_at).toDateString();
    if (d !== lastDate) {
      messagesWithDates.push({ type: 'date', date: msg.created_at });
      lastDate = d;
    }
    messagesWithDates.push({ type: 'msg', msg });
  }

  const getReplyPreview = (replyId: string) => {
    const m = messages.find(msg => msg.id === replyId);
    if (!m) return null;
    const p = getProfile(m.user_id);
    return { name: p?.full_name || 'Utente', text: m.message };
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-w-2xl mx-auto">
      {/* Messages area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Nessun messaggio ancora. Inizia la conversazione! 💬
          </div>
        )}

        {messagesWithDates.map((item, i) => {
          if (item.type === 'date') {
            return (
              <div key={`date-${i}`} className="flex justify-center py-3">
                <span className="glass-surface text-xs text-muted-foreground px-3 py-1 rounded-full">
                  {formatDateSeparator(item.date)}
                </span>
              </div>
            );
          }

          const msg = item.msg;
          const isOwn = msg.user_id === user?.id;
          const senderProfile = getProfile(msg.user_id);
          const replyPreview = msg.reply_to_id ? getReplyPreview(msg.reply_to_id) : null;

          // Check if previous message is from the same user (for grouping)
          const prevItem = messagesWithDates[i - 1];
          const showAvatar = !prevItem || prevItem.type === 'date' || (prevItem.type === 'msg' && prevItem.msg.user_id !== msg.user_id);

          return (
            <div
              key={msg.id}
              className={cn(
                'flex gap-2',
                isOwn ? 'flex-row-reverse' : 'flex-row',
                showAvatar ? 'mt-3' : 'mt-0.5'
              )}
            >
              {/* Avatar */}
              {!isOwn && (
                <div className="w-8 flex-shrink-0">
                  {showAvatar && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                      {senderProfile?.avatar_emoji || '🖤'}
                    </div>
                  )}
                </div>
              )}

              {/* Bubble */}
              <div className={cn('max-w-[75%] min-w-[80px]')}>
                {/* Sender name */}
                {showAvatar && !isOwn && (
                  <p className="text-xs font-medium text-muted-foreground mb-0.5 ml-1">
                    {senderProfile?.full_name || 'Utente'}
                  </p>
                )}

                <div
                  className={cn(
                    'px-3 py-2 rounded-2xl text-sm relative group',
                    isOwn
                      ? 'bg-foreground text-background rounded-br-md'
                      : 'glass-surface rounded-bl-md'
                  )}
                  onDoubleClick={() => setReplyTo(msg)}
                >
                  {/* Reply preview */}
                  {replyPreview && (
                    <div className={cn(
                      'text-xs px-2 py-1 rounded-lg mb-1 border-l-2',
                      isOwn
                        ? 'bg-background/10 border-background/30 text-background/70'
                        : 'bg-foreground/5 border-foreground/20 text-muted-foreground'
                    )}>
                      <span className="font-medium">{replyPreview.name}</span>
                      <p className="truncate">{replyPreview.text}</p>
                    </div>
                  )}

                  <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                  <span className={cn(
                    'text-[10px] float-right mt-1 ml-2',
                    isOwn ? 'text-background/50' : 'text-muted-foreground/60'
                  )}>
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        <div ref={endRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-28 right-6 w-9 h-9 rounded-full glass-surface shadow-lg flex items-center justify-center z-10"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}

      {/* Reply bar */}
      {replyTo && (
        <div className="px-3 pt-2 flex items-center gap-2 glass-surface mx-3 rounded-t-xl">
          <Reply className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0 text-xs">
            <span className="font-medium">{getProfile(replyTo.user_id)?.full_name || 'Utente'}</span>
            <p className="text-muted-foreground truncate">{replyTo.message}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="p-1">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className={cn('px-3 pb-3 pt-2 flex items-end gap-2', replyTo && 'pt-0')}>
        <textarea
          ref={textareaRef}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Scrivi un messaggio..."
          rows={1}
          className="flex-1 resize-none glass-surface rounded-2xl px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50 max-h-[120px]"
        />
        <button
          onClick={sendMessage}
          disabled={!newMessage.trim() || isSending}
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
            newMessage.trim()
              ? 'bg-foreground text-background'
              : 'bg-muted text-muted-foreground'
          )}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default OfficeChatPage;
