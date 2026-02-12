import { memo, useState, useCallback, useMemo, useRef } from 'react';
import { Cliente, ClienteStatus } from '@/types';
import { cn, isDarkColor } from '@/lib/utils';
import { MapPin, Euro, Home, Clock, Bell, X } from 'lucide-react';
import { isPast, isToday, isTomorrow } from 'date-fns';
import { triggerHaptic } from '@/lib/haptics';
import { ColorPickerOverlay } from '@/components/ui/color-picker-overlay';

interface ClienteCardProps {
  cliente: Cliente & { reminder_date?: string | null };
  onClick: () => void;
  onColorChange?: (color: string | null) => void;
  onEmojiChange?: (emoji: string | null) => void;
  onStatusChange?: (status: ClienteStatus) => void;
  isDragging?: boolean;
  showAgent?: boolean;
  agentName?: string | null;
  agentEmoji?: string | null;
  statusColumns?: Array<{ id: ClienteStatus; label: string; color: string }>;
}

// Preset colors for cards
const cardColors = [
  { value: null, label: 'Default', color: 'bg-card border-2 border-muted' },
  { value: '#fef3c7', label: 'Giallo', color: 'bg-amber-200' },
  { value: '#fed7aa', label: 'Arancio', color: 'bg-orange-300' },
  { value: '#fecaca', label: 'Rosso', color: 'bg-red-300' },
  { value: '#bbf7d0', label: 'Verde', color: 'bg-green-300' },
];

// Quick emojis
const QUICK_EMOJIS = ['🏠', '🏡', '🏰', '🏛️', '🌳', '🌊', '⭐', '🔥', '💎', '🎯', '📞', '📸'];

// Status columns (default)
const defaultStatusColumns: Array<{ id: ClienteStatus; label: string; color: string }> = [
  { id: 'new', label: 'Nuovi', color: '#f59e0b' },
  { id: 'contacted', label: 'Contattati', color: '#3b82f6' },
  { id: 'qualified', label: 'Qualificati', color: '#2563eb' },
  { id: 'proposal', label: 'Proposta', color: '#f97316' },
  { id: 'negotiation', label: 'Trattativa', color: '#ef4444' },
  { id: 'closed_won', label: 'Chiusi ✓', color: '#22c55e' },
  { id: 'closed_lost', label: 'Persi', color: '#6b7280' },
];

const isUrgent = (tempoRicerca: string | null): boolean => {
  if (!tempoRicerca) return false;
  const lower = tempoRicerca.toLowerCase();
  return lower.includes('less than 3') || lower.includes('< 3') || lower.includes('1 month');
};

// Unified picker pill component
const ColorStatusPickerPill = memo(({ 
  position, 
  currentColor,
  currentStatus,
  currentEmoji,
  statusColumns,
  onColorSelect, 
  onStatusChange,
  onEmojiSelect,
  onClose 
}: { 
  position: { x: number; y: number }; 
  currentColor: string | null;
  currentStatus: ClienteStatus;
  currentEmoji: string | null;
  statusColumns: Array<{ id: ClienteStatus; label: string; color: string }>;
  onColorSelect: (color: string | null) => void;
  onStatusChange: (status: ClienteStatus) => void;
  onEmojiSelect: (emoji: string | null) => void;
  onClose: () => void;
}) => {
  const [customCardColor, setCustomCardColor] = useState(currentColor || '#fef3c7');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  
  return (
    <>
      <div 
        className="fixed inset-0 z-[110]" 
        onClick={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      />
      <div
        className="fixed z-[110] flex flex-col gap-2.5 p-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] animate-in zoom-in-95 fade-in duration-150"
        style={{
          left: Math.min(Math.max(10, position.x), window.innerWidth - 260),
          top: Math.min(position.y, window.innerHeight - 300),
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* Status selector */}
        <div>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Stato</span>
          <div className="flex flex-wrap gap-1.5 max-w-[220px]">
            {statusColumns.map((col) => (
              <button
                key={col.id}
                onClick={() => { onStatusChange(col.id); onClose(); }}
                className={cn(
                  "px-2.5 py-1 text-[10px] font-medium rounded-full transition-all active:scale-95",
                  currentStatus === col.id && "ring-2 ring-foreground ring-offset-1"
                )}
                style={{ 
                  backgroundColor: col.color,
                  color: isDarkColor(col.color) ? 'white' : 'black'
                }}
              >
                {col.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Separator */}
        <div className="h-px bg-muted/50" />
        
        {/* Emoji picker */}
        <div>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Emoji</span>
          <div className="flex flex-wrap items-center gap-1 max-w-[220px]">
            {currentEmoji && (
              <button
                onClick={() => { onEmojiSelect(null); onClose(); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center bg-muted hover:bg-destructive hover:text-white transition-colors"
                title="Rimuovi emoji"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => { onEmojiSelect(emoji); onClose(); }}
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center text-base hover:bg-muted transition-colors",
                  currentEmoji === emoji && "bg-muted ring-1 ring-foreground"
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-muted/50" />
        
        {/* Card color picker */}
        <div>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Colore card</span>
          <div className="flex items-center gap-1.5">
            {cardColors.map((c) => (
              <button
                key={c.value || 'default'}
                onClick={() => { onColorSelect(c.value); onClose(); }}
                className={cn(
                  "w-7 h-7 rounded-full transition-transform active:scale-90 shadow-sm",
                  c.color,
                  currentColor === c.value && "ring-2 ring-foreground ring-offset-1"
                )}
                title={c.label}
              />
            ))}
            {/* Custom color toggle */}
            <button
              onClick={() => setShowCustomPicker(!showCustomPicker)}
              className={cn(
                "w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center text-sm font-bold text-black transition-all active:scale-90",
                showCustomPicker && "ring-2 ring-foreground ring-offset-1"
              )}
            >
              +
            </button>
          </div>
        </div>
        
        {/* Custom color picker overlay */}
        <ColorPickerOverlay
          open={showCustomPicker}
          color={customCardColor}
          onChange={(newColor) => {
            onColorSelect(newColor);
            onClose();
          }}
          onClose={() => setShowCustomPicker(false)}
        />
      </div>
    </>
  );
});
ColorStatusPickerPill.displayName = 'ColorStatusPickerPill';

export const ClienteCard = memo(({ 
  cliente, 
  onClick, 
  onColorChange,
  onEmojiChange,
  onStatusChange,
  isDragging,
  showAgent = true,
  agentName,
  agentEmoji,
  statusColumns = defaultStatusColumns,
}: ClienteCardProps) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPos, setPickerPos] = useState({ x: 0, y: 0 });
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    triggerHaptic('medium');
    setPickerPos({ x: e.clientX, y: e.clientY });
    setPickerOpen(true);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    
    longPressTimer.current = setTimeout(() => {
      triggerHaptic('medium');
      setPickerPos({ x: touch.clientX, y: touch.clientY });
      setPickerOpen(true);
    }, 500);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartPos.current || !longPressTimer.current) return;
    
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPos.current.x);
    const dy = Math.abs(touch.clientY - touchStartPos.current.y);
    
    if (dx > 10 || dy > 10) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const urgent = isUrgent(cliente.tempo_ricerca);
  const textColor = isDarkColor(cliente.card_color) ? 'text-white' : 'text-foreground';

  // Reminder status
  const reminderStatus = useMemo(() => {
    if (!cliente.reminder_date) return null;
    const date = new Date(cliente.reminder_date);
    if (isPast(date) && !isToday(date)) return 'overdue';
    if (isToday(date)) return 'today';
    if (isTomorrow(date)) return 'tomorrow';
    return null;
  }, [cliente.reminder_date]);

  const formatBudget = (budget: number | null) => {
    if (!budget) return null;
    if (budget >= 1000000) return `€${(budget / 1000000).toFixed(1)}M`;
    return `€${(budget / 1000).toFixed(0)}k`;
  };

  return (
    <div
      className={cn(
        "relative rounded-xl p-3 cursor-pointer transition-all shadow-lg",
        "hover:shadow-xl",
        isDragging && "opacity-70 rotate-2 shadow-xl",
        !cliente.card_color && "bg-white",
        textColor
      )}
      style={{ backgroundColor: cliente.card_color || undefined }}
      onClick={onClick}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header with emoji and name */}
      <div className="flex items-start gap-2 mb-2">
        <span className="text-xl flex-shrink-0">
          {cliente.emoji}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm whitespace-normal break-words">{cliente.nome}</h4>
          {cliente.paese && (
            <span className="text-xs opacity-70">{cliente.paese}</span>
          )}
        </div>
      </div>

      {/* Regions */}
      {cliente.regioni.length > 0 && (
        <div className="flex items-center gap-1 text-xs mb-1.5 opacity-80">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{cliente.regioni.join(', ')}</span>
        </div>
      )}

      {/* Budget */}
      {cliente.budget_max && (
        <div className="flex items-center gap-1 text-xs mb-1.5 opacity-80">
          <Euro className="w-3 h-3 flex-shrink-0" />
          <span>{formatBudget(cliente.budget_max)} max</span>
        </div>
      )}

      {/* Property types */}
      {cliente.tipologia.length > 0 && (
        <div className="flex items-center gap-1 text-xs mb-1.5 opacity-80">
          <Home className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{cliente.tipologia.join(', ')}</span>
        </div>
      )}

      {/* Footer: Agent + Urgency + Reminder */}
      <div className="flex items-center justify-between mt-2 pt-2 flex-wrap gap-1">
        {showAgent && (
          <div className="flex items-center gap-1.5 text-xs opacity-70">
            {agentEmoji ? (
              <span className="text-base">{agentEmoji}</span>
            ) : (
              <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px]">?</span>
            )}
            <span className="truncate max-w-[80px]">
              {agentName || 'Non assegnato'}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          {reminderStatus && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium",
              reminderStatus === 'overdue' ? 'text-red-600' : 
              reminderStatus === 'today' ? 'text-primary' : 'text-amber-600'
            )}>
              <Bell className="w-3 h-3" />
              <span>
                {reminderStatus === 'overdue' ? 'Scaduto' : 
                 reminderStatus === 'today' ? 'Oggi' : 'Domani'}
              </span>
            </div>
          )}
          {urgent && (
            <div className="flex items-center gap-1 text-xs text-amber-600 font-medium">
              <Clock className="w-3 h-3" />
              <span>Urgente</span>
            </div>
          )}
        </div>
      </div>

      {/* Context menu picker */}
      {pickerOpen && onColorChange && onStatusChange && (
        <ColorStatusPickerPill
          position={pickerPos}
          currentColor={cliente.card_color}
          currentStatus={cliente.status as ClienteStatus}
          currentEmoji={cliente.emoji}
          statusColumns={statusColumns}
          onColorSelect={onColorChange}
          onStatusChange={onStatusChange}
          onEmojiSelect={(emoji) => onEmojiChange?.(emoji)}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
});

ClienteCard.displayName = 'ClienteCard';

export default ClienteCard;
