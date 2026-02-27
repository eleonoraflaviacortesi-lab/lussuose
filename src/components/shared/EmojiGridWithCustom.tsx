import { memo, useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEFAULT_EMOJIS = ['🏠', '🏢', '🏘️', '🏡', '📍', '⭐', '🔑', '💎', '🌟', '❤️', '📋', '📞', '📸'];

interface EmojiGridWithCustomProps {
  currentEmoji: string | null;
  onSelect: (emoji: string) => void;
  onRemove: () => void;
  emojis?: string[];
}

export const EmojiGridWithCustom = memo(({ currentEmoji, onSelect, onRemove, emojis = DEFAULT_EMOJIS }: EmojiGridWithCustomProps) => {
  const [showInput, setShowInput] = useState(false);
  const [customEmoji, setCustomEmoji] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showInput && inputRef.current) inputRef.current.focus();
  }, [showInput]);

  return (
    <div className="flex flex-wrap items-center gap-1 max-w-[220px]">
      {currentEmoji && (
        <button
          onClick={onRemove}
          className="w-7 h-7 rounded-lg flex items-center justify-center bg-muted hover:bg-destructive hover:text-white transition-colors"
          title="Rimuovi emoji"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      {emojis.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center text-base hover:bg-muted transition-colors",
            currentEmoji === emoji && "bg-muted ring-1 ring-foreground"
          )}
        >
          {emoji}
        </button>
      ))}
      {showInput ? (
        <input
          ref={inputRef}
          value={customEmoji}
          onChange={(e) => setCustomEmoji(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && customEmoji.trim()) {
              onSelect(customEmoji.trim());
              setCustomEmoji('');
              setShowInput(false);
            }
          }}
          onBlur={() => { setShowInput(false); setCustomEmoji(''); }}
          className="w-10 h-7 text-center text-base bg-muted rounded-lg border-0 outline-none focus:ring-1 focus:ring-foreground"
          placeholder="😀"
          maxLength={2}
        />
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="w-7 h-7 rounded-lg bg-white shadow-md flex items-center justify-center text-sm font-bold text-black transition-all active:scale-90 hover:bg-muted"
        >
          +
        </button>
      )}
    </div>
  );
});
EmojiGridWithCustom.displayName = 'EmojiGridWithCustom';
