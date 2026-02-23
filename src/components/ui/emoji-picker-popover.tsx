import { useState, useRef, useEffect, memo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

const QUICK_EMOJIS = ['🏠', '🏡', '🏰', '🏛️', '🌳', '🌊', '⭐', '🔥', '💎', '🎯', '📞', '📸', '📋', '🖤', '💼', '🎨'];

interface EmojiPickerPopoverProps {
  emoji: string | null;
  onEmojiChange: (emoji: string | null) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const EmojiPickerPopover = memo(function EmojiPickerPopover({
  emoji,
  onEmojiChange,
  className,
  size = 'md',
}: EmojiPickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customEmoji, setCustomEmoji] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showCustomInput && inputRef.current) inputRef.current.focus();
  }, [showCustomInput]);

  const sizeClass = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-lg';

  const handleSelect = (e: string) => {
    onEmojiChange(e);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "rounded-full hover:bg-muted/80 active:scale-95 transition-all flex items-center justify-center cursor-pointer",
            size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-12 h-12' : 'w-9 h-9',
            sizeClass,
            className,
          )}
        >
          {emoji || '📋'}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start" side="bottom">
        <div className="flex flex-wrap items-center gap-1 max-w-[220px]">
          {emoji && (
            <button
              onClick={() => { onEmojiChange(null); setOpen(false); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center bg-muted hover:bg-destructive hover:text-white transition-colors"
              title="Rimuovi emoji"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {QUICK_EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => handleSelect(e)}
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center text-base hover:bg-muted transition-colors",
                emoji === e && "bg-muted ring-1 ring-foreground"
              )}
            >
              {e}
            </button>
          ))}
          {showCustomInput ? (
            <input
              ref={inputRef}
              value={customEmoji}
              onChange={(e) => setCustomEmoji(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customEmoji.trim()) {
                  handleSelect(customEmoji.trim());
                  setCustomEmoji('');
                  setShowCustomInput(false);
                }
              }}
              onBlur={() => { setShowCustomInput(false); setCustomEmoji(''); }}
              className="w-10 h-7 text-center text-base bg-muted rounded-lg border-0 outline-none focus:ring-1 focus:ring-foreground"
              placeholder="😀"
              maxLength={2}
            />
          ) : (
            <button
              onClick={() => setShowCustomInput(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs bg-muted hover:bg-foreground hover:text-background transition-colors font-bold"
            >
              +
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
});
