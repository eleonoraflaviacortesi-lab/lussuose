import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfiles } from '@/hooks/useProfiles';
import { Send, Reply, X, ChevronDown, Mic, Square, Paperclip, Megaphone, Wallet, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { it } from 'date-fns/locale';
import { getMentionedUserIds } from '@/components/ui/mention-input';
import NotiziaDetail from '@/components/notizie/NotiziaDetail';
import { ClienteDetail } from '@/components/clienti/ClienteDetail';
import type { Notizia } from '@/hooks/useNotizie';
import type { Cliente } from '@/types';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  reply_to_id: string | null;
  sede: string;
  created_at: string;
  reactions: Array<{ emoji: string; user_ids: string[] }>;
  audio_url: string | null;
  linked_notizia_id: string | null;
  linked_cliente_id: string | null;
  mentions: string[];
}

const REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🔥'];

const OfficeChatPage = () => {
  const { user, profile } = useAuth();
  const { profiles } = useProfiles();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval>>();

  // Attachment state
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showNotiziePicker, setShowNotiziePicker] = useState(false);
  const [showClientiPicker, setShowClientiPicker] = useState(false);
  const [notizie, setNotizie] = useState<any[]>([]);
  const [clienti, setClienti] = useState<any[]>([]);
  const [attachSearch, setAttachSearch] = useState('');

  // Linked data cache
  const [linkedNotizie, setLinkedNotizie] = useState<Record<string, any>>({});
  const [linkedClienti, setLinkedClienti] = useState<Record<string, any>>({});

  // Detail modals
  const [selectedNotizia, setSelectedNotizia] = useState<Notizia | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  // Mention dropdown
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [cursorPos, setCursorPos] = useState(0);

  // Audio playback
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isNearBottomRef = useRef(true);

  const sede = profile?.sede || 'AREZZO';

  const getProfile = useCallback((userId: string) => {
    return profiles?.find(p => p.user_id === userId);
  }, [profiles]);

  const filteredMentionProfiles = useMemo(() => {
    if (!profiles) return [];
    return profiles
      .filter(p => p.user_id !== user?.id)
      .filter(p => !mentionQuery || p.full_name.toLowerCase().includes(mentionQuery.toLowerCase()))
      .slice(0, 5);
  }, [profiles, user?.id, mentionQuery]);

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
      if (data) {
        setMessages(data.map(d => ({
          ...d,
          reactions: (d.reactions as any) || [],
          mentions: (d.mentions as any) || [],
        })) as ChatMessage[]);
      }
    };

    loadMessages();

    const channel = supabase
      .channel('office-chat')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_messages',
        filter: `sede=eq.${sede}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newMsg = {
            ...payload.new,
            reactions: (payload.new.reactions as any) || [],
            mentions: (payload.new.mentions as any) || [],
          } as ChatMessage;
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          if (isNearBottomRef.current) {
            setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
          }
        } else if (payload.eventType === 'UPDATE') {
          const updated = {
            ...payload.new,
            reactions: (payload.new.reactions as any) || [],
            mentions: (payload.new.mentions as any) || [],
          } as ChatMessage;
          setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
        } else if (payload.eventType === 'DELETE') {
          setMessages(prev => prev.filter(m => m.id !== (payload.old as any).id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, sede]);

  // Load linked data for messages
  useEffect(() => {
    const notiziaIds = messages
      .filter(m => m.linked_notizia_id && !linkedNotizie[m.linked_notizia_id])
      .map(m => m.linked_notizia_id!);
    const clienteIds = messages
      .filter(m => m.linked_cliente_id && !linkedClienti[m.linked_cliente_id])
      .map(m => m.linked_cliente_id!);

    if (notiziaIds.length > 0) {
      supabase.from('notizie').select('*').in('id', [...new Set(notiziaIds)]).then(({ data }) => {
        if (data) {
          setLinkedNotizie(prev => {
            const next = { ...prev };
            data.forEach(n => { next[n.id] = n; });
            return next;
          });
        }
      });
    }
    if (clienteIds.length > 0) {
      supabase.from('clienti').select('*').in('id', [...new Set(clienteIds)]).then(({ data }) => {
        if (data) {
          setLinkedClienti(prev => {
            const next = { ...prev };
            data.forEach(c => { next[c.id] = c; });
            return next;
          });
        }
      });
    }
  }, [messages]);

  // Initial scroll
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'instant' as any }), 100);
    }
  }, [messages.length === 0]);

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

  // Send text message
  const sendMessage = async (linkedNotiziaId?: string, linkedClienteId?: string) => {
    if ((!newMessage.trim() && !linkedNotiziaId && !linkedClienteId) || !user || isSending) return;
    setIsSending(true);
    const text = newMessage.trim();
    setNewMessage('');
    const replyId = replyTo?.id || null;
    setReplyTo(null);

    const mentionIds = text ? getMentionedUserIds(text, profiles || []) : [];

    try {
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        message: text || (linkedNotiziaId ? '📋 Notizia allegata' : '👤 Buyer allegato'),
        reply_to_id: replyId,
        sede,
        mentions: mentionIds,
        linked_notizia_id: linkedNotiziaId || null,
        linked_cliente_id: linkedClienteId || null,
      });
    } catch {
      setNewMessage(text);
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  // Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await uploadAndSendAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      // Microphone not available
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const uploadAndSendAudio = async (blob: Blob) => {
    if (!user) return;
    const filename = `${user.id}/${Date.now()}.webm`;
    const { data: uploadData, error } = await supabase.storage
      .from('chat-audio')
      .upload(filename, blob);
    if (error || !uploadData) return;

    const { data: urlData } = supabase.storage.from('chat-audio').getPublicUrl(uploadData.path);
    
    await supabase.from('chat_messages').insert({
      user_id: user.id,
      message: '🎤 Messaggio vocale',
      sede,
      audio_url: urlData.publicUrl,
      reply_to_id: replyTo?.id || null,
    });
    setReplyTo(null);
  };

  // Play audio
  const toggleAudio = (msgId: string, url: string) => {
    if (playingAudioId === msgId) {
      audioElementRef.current?.pause();
      setPlayingAudioId(null);
      return;
    }
    if (audioElementRef.current) audioElementRef.current.pause();
    const audio = new Audio(url);
    audioElementRef.current = audio;
    audio.onended = () => setPlayingAudioId(null);
    audio.play();
    setPlayingAudioId(msgId);
  };

  // Reactions
  const toggleReaction = async (msg: ChatMessage, emoji: string) => {
    if (!user) return;
    const reactions = [...(msg.reactions || [])];
    const existing = reactions.find(r => r.emoji === emoji);
    
    if (existing) {
      if (existing.user_ids.includes(user.id)) {
        existing.user_ids = existing.user_ids.filter(id => id !== user.id);
        if (existing.user_ids.length === 0) {
          const idx = reactions.indexOf(existing);
          reactions.splice(idx, 1);
        }
      } else {
        existing.user_ids.push(user.id);
      }
    } else {
      reactions.push({ emoji, user_ids: [user.id] });
    }

    await supabase.from('chat_messages').update({ reactions }).eq('id', msg.id);
  };

  // Load notizie/clienti for picker
  const loadNotizie = async () => {
    const { data } = await supabase.from('notizie').select('*').order('created_at', { ascending: false }).limit(50);
    if (data) setNotizie(data);
  };
  const loadClienti = async () => {
    const { data } = await supabase.from('clienti').select('*').eq('sede', sede).order('created_at', { ascending: false }).limit(50);
    if (data) setClienti(data);
  };

  // Mention detection in textarea
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart || 0;
    setNewMessage(val);
    setCursorPos(pos);

    const beforeCursor = val.slice(0, pos);
    const atIdx = beforeCursor.lastIndexOf('@');
    if (atIdx >= 0 && (atIdx === 0 || beforeCursor[atIdx - 1] === ' ' || beforeCursor[atIdx - 1] === '\n')) {
      const q = beforeCursor.slice(atIdx + 1);
      if (!q.includes('\n') && !q.includes(' ')) {
        setMentionQuery(q);
        setMentionIndex(0);
        setShowMentionDropdown(true);
        return;
      }
    }
    setShowMentionDropdown(false);
  };

  const selectMention = (p: { full_name: string; user_id: string }) => {
    const beforeCursor = newMessage.slice(0, cursorPos);
    const atIdx = beforeCursor.lastIndexOf('@');
    const after = newMessage.slice(cursorPos);
    const val = newMessage.slice(0, atIdx) + `@${p.full_name} ` + after;
    setNewMessage(val);
    setShowMentionDropdown(false);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentionDropdown && filteredMentionProfiles.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIndex(i => Math.min(i + 1, filteredMentionProfiles.length - 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIndex(i => Math.max(i - 1, 0)); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); selectMention(filteredMentionProfiles[mentionIndex]); return; }
      if (e.key === 'Escape') { setShowMentionDropdown(false); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey && !showMentionDropdown) {
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

  const formatTime = (d: string) => format(new Date(d), 'HH:mm');
  const formatDateSeparator = (d: string) => {
    const date = new Date(d);
    if (isToday(date)) return 'Oggi';
    if (isYesterday(date)) return 'Ieri';
    return format(date, 'd MMMM yyyy', { locale: it });
  };

  // Render message text with highlighted mentions
  const renderMessageText = (text: string) => {
    const parts = text.split(/(@[\w\s]+?)(?=\s|$)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const name = part.slice(1).trim();
        const matched = profiles?.find(p => p.full_name.toLowerCase() === name.toLowerCase());
        if (matched) {
          return (
            <span key={i} className="font-semibold text-primary cursor-pointer hover:underline">
              {part}
            </span>
          );
        }
      }
      return <span key={i}>{part}</span>;
    });
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
    <div className="flex flex-col h-[calc(100vh-200px)] max-w-2xl mx-auto relative">
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
          const prevItem = messagesWithDates[i - 1];
          const showAvatar = !prevItem || prevItem.type === 'date' || (prevItem.type === 'msg' && prevItem.msg.user_id !== msg.user_id);

          const linkedNotizia = msg.linked_notizia_id ? linkedNotizie[msg.linked_notizia_id] : null;
          const linkedCliente = msg.linked_cliente_id ? linkedClienti[msg.linked_cliente_id] : null;

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

                  {/* Audio message */}
                  {msg.audio_url ? (
                    <div className="flex items-center gap-2 py-1">
                      <button
                        onClick={() => toggleAudio(msg.id, msg.audio_url!)}
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                          isOwn ? 'bg-background/20' : 'bg-foreground/10'
                        )}
                      >
                        {playingAudioId === msg.id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className={cn(
                          'h-1 rounded-full',
                          isOwn ? 'bg-background/20' : 'bg-foreground/10'
                        )}>
                          <div className={cn(
                            'h-full rounded-full w-0 transition-all',
                            playingAudioId === msg.id && 'w-full duration-[30s]',
                            isOwn ? 'bg-background/50' : 'bg-foreground/30'
                          )} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words">{renderMessageText(msg.message)}</p>
                  )}

                  {/* Linked notizia */}
                  {linkedNotizia && (
                    <button
                      onClick={() => setSelectedNotizia(linkedNotizia)}
                      className={cn(
                        'mt-1.5 w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center gap-2 transition-opacity hover:opacity-80',
                        isOwn ? 'bg-background/10' : 'bg-foreground/5'
                      )}
                    >
                      <Megaphone className="w-3.5 h-3.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{linkedNotizia.name}</p>
                        {linkedNotizia.zona && <p className="opacity-60 truncate">{linkedNotizia.zona}</p>}
                      </div>
                    </button>
                  )}

                  {/* Linked cliente */}
                  {linkedCliente && (
                    <button
                      onClick={() => setSelectedCliente(linkedCliente)}
                      className={cn(
                        'mt-1.5 w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center gap-2 transition-opacity hover:opacity-80',
                        isOwn ? 'bg-background/10' : 'bg-foreground/5'
                      )}
                    >
                      <Wallet className="w-3.5 h-3.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{linkedCliente.nome} {linkedCliente.cognome || ''}</p>
                        {linkedCliente.paese && <p className="opacity-60 truncate">{linkedCliente.paese}</p>}
                      </div>
                    </button>
                  )}

                  <span className={cn(
                    'text-[10px] float-right mt-1 ml-2',
                    isOwn ? 'text-background/50' : 'text-muted-foreground/60'
                  )}>
                    {formatTime(msg.created_at)}
                  </span>

                  {/* Reaction button (shown on hover) */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className={cn(
                        'absolute -bottom-3 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-background border border-border rounded-full px-1.5 py-0.5 shadow-sm',
                        isOwn ? 'left-0' : 'right-0'
                      )}>
                        😊
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-1 flex gap-0.5" side="top">
                      {REACTION_EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => toggleReaction(msg, emoji)}
                          className="text-lg hover:scale-125 transition-transform px-1"
                        >
                          {emoji}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Reactions display */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className={cn('flex flex-wrap gap-1 mt-1', isOwn ? 'justify-end' : 'justify-start')}>
                    {msg.reactions.map((r, idx) => (
                      <button
                        key={idx}
                        onClick={() => toggleReaction(msg, r.emoji)}
                        className={cn(
                          'text-xs px-1.5 py-0.5 rounded-full border flex items-center gap-0.5 transition-colors',
                          r.user_ids.includes(user?.id || '')
                            ? 'border-primary/30 bg-primary/10'
                            : 'border-border bg-background'
                        )}
                      >
                        <span>{r.emoji}</span>
                        <span className="text-muted-foreground">{r.user_ids.length}</span>
                      </button>
                    ))}
                  </div>
                )}
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

      {/* Mention dropdown */}
      {showMentionDropdown && filteredMentionProfiles.length > 0 && (
        <div className="absolute bottom-20 left-3 right-3 max-w-lg bg-background rounded-xl shadow-xl border border-border z-50 overflow-hidden">
          {filteredMentionProfiles.map((p, idx) => (
            <button
              key={p.user_id}
              onMouseDown={(e) => { e.preventDefault(); selectMention(p); }}
              className={cn(
                'w-full text-left px-3 py-2.5 flex items-center gap-2.5 text-sm',
                idx === mentionIndex ? 'bg-muted' : 'hover:bg-muted/50'
              )}
            >
              <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-base">
                {p.avatar_emoji || '🖤'}
              </span>
              <span className="font-medium">{p.full_name}</span>
            </button>
          ))}
        </div>
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

      {/* Input area */}
      <div className={cn('px-3 pb-3 pt-2 flex items-end gap-2', replyTo && 'pt-0')}>
        {/* Attachment button */}
        <Popover open={showAttachMenu} onOpenChange={setShowAttachMenu}>
          <PopoverTrigger asChild>
            <button className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1" side="top" align="start">
            <button
              onClick={() => { setShowAttachMenu(false); setShowNotiziePicker(true); loadNotizie(); setAttachSearch(''); }}
              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted flex items-center gap-2.5 text-sm"
            >
              <Megaphone className="w-4 h-4" />
              Allega Notizia
            </button>
            <button
              onClick={() => { setShowAttachMenu(false); setShowClientiPicker(true); loadClienti(); setAttachSearch(''); }}
              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted flex items-center gap-2.5 text-sm"
            >
              <Wallet className="w-4 h-4" />
              Allega Buyer
            </button>
          </PopoverContent>
        </Popover>

        {isRecording ? (
          // Recording UI
          <div className="flex-1 flex items-center gap-3 glass-surface rounded-2xl px-4 py-2.5">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium text-foreground">
              {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
            </span>
            <div className="flex-1" />
            <button onClick={stopRecording} className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white">
              <Square className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Scrivi... usa @ per taggare"
              rows={1}
              className="flex-1 resize-none glass-surface rounded-2xl px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50 max-h-[120px]"
            />
            {newMessage.trim() ? (
              <button
                onClick={() => sendMessage()}
                disabled={isSending}
                className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center flex-shrink-0 hover:text-foreground transition-colors"
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Notizia picker modal */}
      {showNotiziePicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowNotiziePicker(false)}>
          <div className="bg-background rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[70vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold">Allega Notizia</h3>
              <button onClick={() => setShowNotiziePicker(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-3">
              <input
                value={attachSearch}
                onChange={e => setAttachSearch(e.target.value)}
                placeholder="Cerca notizia..."
                className="w-full glass-surface rounded-xl px-3 py-2 text-sm outline-none"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto max-h-[50vh] p-3 space-y-1">
              {notizie
                .filter(n => !attachSearch || n.name.toLowerCase().includes(attachSearch.toLowerCase()))
                .map(n => (
                  <button
                    key={n.id}
                    onClick={() => { setShowNotiziePicker(false); sendMessage(n.id, undefined); }}
                    className="w-full text-left p-3 rounded-xl hover:bg-muted flex items-center gap-3"
                  >
                    <span className="text-lg">{n.emoji || '📋'}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{n.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{n.zona || n.status}</p>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Clienti picker modal */}
      {showClientiPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowClientiPicker(false)}>
          <div className="bg-background rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[70vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold">Allega Buyer</h3>
              <button onClick={() => setShowClientiPicker(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-3">
              <input
                value={attachSearch}
                onChange={e => setAttachSearch(e.target.value)}
                placeholder="Cerca buyer..."
                className="w-full glass-surface rounded-xl px-3 py-2 text-sm outline-none"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto max-h-[50vh] p-3 space-y-1">
              {clienti
                .filter(c => !attachSearch || `${c.nome} ${c.cognome || ''}`.toLowerCase().includes(attachSearch.toLowerCase()))
                .map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setShowClientiPicker(false); sendMessage(undefined, c.id); }}
                    className="w-full text-left p-3 rounded-xl hover:bg-muted flex items-center gap-3"
                  >
                    <span className="text-lg">{c.emoji || '🏠'}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{c.nome} {c.cognome || ''}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.paese || c.status}</p>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Notizia detail modal */}
      <NotiziaDetail
        notizia={selectedNotizia}
        open={!!selectedNotizia}
        onOpenChange={(open) => !open && setSelectedNotizia(null)}
      />

      {/* Cliente detail modal - simplified view */}
      {selectedCliente && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setSelectedCliente(null)}>
          <div className="bg-background rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span>{selectedCliente.emoji || '🏠'}</span>
                {selectedCliente.nome} {selectedCliente.cognome || ''}
              </h2>
              <button onClick={() => setSelectedCliente(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-sm">
              {selectedCliente.telefono && <p>📞 {selectedCliente.telefono}</p>}
              {selectedCliente.email && <p>✉️ {selectedCliente.email}</p>}
              {selectedCliente.paese && <p>🌍 {selectedCliente.paese}</p>}
              {selectedCliente.budget_max && <p>💰 Budget: €{selectedCliente.budget_max?.toLocaleString()}</p>}
              {selectedCliente.regioni && selectedCliente.regioni.length > 0 && <p>📍 {selectedCliente.regioni.join(', ')}</p>}
              {selectedCliente.tipologia && selectedCliente.tipologia.length > 0 && <p>🏠 {selectedCliente.tipologia.join(', ')}</p>}
              {selectedCliente.descrizione && <p className="text-muted-foreground">{selectedCliente.descrizione}</p>}
              {selectedCliente.note_extra && <p className="text-muted-foreground italic">{selectedCliente.note_extra}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficeChatPage;
