import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { Textarea } from '@/components/ui/textarea';
import { triggerHaptic } from '@/lib/haptics';
import { NotiziaComment } from '@/hooks/useNotizie';

interface CommentPopoverProps {
  comments: NotiziaComment[];
  onAddComment: (text: string) => void;
  trigger: React.ReactNode;
}

const CommentPopover = ({ comments, onAddComment, trigger }: CommentPopoverProps) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when opening or adding comment
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [open, comments.length]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSubmit = () => {
    if (!text.trim()) return;
    onAddComment(text.trim());
    setText('');
    triggerHaptic('light');
  };

  return (
    <div className="relative" ref={popoverRef}>
      <div
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(!open);
        }}
      >
        {trigger}
      </div>

      {open && (
        <>
          {/* Backdrop for mobile */}
          <div className="fixed inset-0 z-[55]" onClick={() => setOpen(false)} />
          
          <div
            className="absolute z-[56] bottom-full mb-1 right-0 w-[260px] bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.18)] border border-muted/30 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-muted/30">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                Commenti ({comments.length})
              </span>
              <button
                onClick={() => setOpen(false)}
                className="w-5 h-5 rounded-full hover:bg-muted flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Comments list */}
            <div ref={scrollRef} className="max-h-[200px] overflow-y-auto p-2 space-y-1.5">
              {comments.length === 0 ? (
                <p className="text-[10px] text-muted-foreground text-center py-3">Nessun commento</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="bg-muted/40 rounded-lg px-2.5 py-1.5">
                    <p className="text-[9px] text-muted-foreground">
                      {format(parseISO(c.created_at), 'd MMM HH:mm', { locale: it })}
                    </p>
                    <p className="text-[11px] text-foreground leading-snug">{c.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="flex gap-1.5 p-2 border-t border-muted/30">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Scrivi..."
                className="flex-1 min-h-[34px] max-h-[60px] text-[11px] px-2 py-1.5 resize-none rounded-lg"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={!text.trim()}
                className="w-7 h-7 shrink-0 rounded-lg bg-foreground text-background flex items-center justify-center hover:opacity-90 disabled:opacity-40"
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CommentPopover;
