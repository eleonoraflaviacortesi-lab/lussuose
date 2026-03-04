import { memo, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Cliente, ClienteStatus } from '@/types';
import { cn, isDarkColor } from '@/lib/utils';
import { MapPin, Euro, Home, Clock, Bell, X, AlertCircle, Star, Trash2 } from 'lucide-react';
import { isPast, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { triggerHaptic } from '@/lib/haptics';
import { ColorPickerOverlay } from '@/components/ui/color-picker-overlay';
import { useFavoriteColors } from '@/hooks/useFavoriteColors';
import { EmojiGridWithCustom } from '@/components/shared/EmojiGridWithCustom';
import { EntityCardWrapper } from '@/components/shared/EntityCardWrapper';
import { TitleFormatControls, getTitleFormat, titleFormatToCustomFields, titleStyle } from '@/components/shared/TitleFormatControls';

interface ClienteCardProps {
  cliente: Cliente & { reminder_date?: string | null };
  onClick: () => void;
  onColorChange?: (color: string | null) => void;
  onEmojiChange?: (emoji: string | null) => void;
  onStatusChange?: (status: ClienteStatus) => void;
  onTitleFormatChange?: (customFields: Record<string, any>) => void;
  onDelete?: () => void;
  isDragging?: boolean;
  showAgent?: boolean;
  agentName?: string | null;
  agentEmoji?: string | null;
  statusColumns?: Array<{ id: ClienteStatus; label: string; color: string }>;
}

// Full color palette for cards (matches screenshot)
const PALETTE_COLORS = [
  null,      '#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', '#adb5bd', '#6c757d', '#495057', '#343a40', '#212529',
  '#fff3cd', '#fef9c3', '#fde68a', '#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f',
  '#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#059669', '#047857', '#065f46', '#064e3b', '#022c22',
  '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a', '#172554',
  '#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#be185d', '#9d174d', '#831843', '#500724',
  '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#450a0a',
];

const BUYER_EMOJIS = ['🏠', '🏡', '🏰', '🏛️', '🌳', '🌊', '⭐', '🔥', '💎', '🎯', '📞', '📸'];

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
  currentCustomFields,
  statusColumns,
  onColorSelect, 
  onStatusChange,
  onEmojiSelect,
  onTitleFormatChange,
  onDelete,
  onClose 
}: { 
  position: { x: number; y: number }; 
  currentColor: string | null;
  currentStatus: ClienteStatus;
  currentEmoji: string | null;
  currentCustomFields: any;
  statusColumns: Array<{ id: ClienteStatus; label: string; color: string }>;
  onColorSelect: (color: string | null) => void;
  onStatusChange: (status: ClienteStatus) => void;
  onEmojiSelect: (emoji: string | null) => void;
  onTitleFormatChange?: (customFields: Record<string, any>) => void;
  onDelete?: () => void;
  onClose: () => void;
}) => {
  const [customCardColor, setCustomCardColor] = useState(currentColor || '#fef3c7');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const { favorites, addFavorite, removeFavorite } = useFavoriteColors();
  
  return (
    <>
      <div 
        className="fixed inset-0 z-[110]" 
        onClick={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      />
      <div
        className="fixed z-[110] flex flex-col gap-2.5 p-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] animate-in zoom-in-95 fade-in duration-150 w-[340px] max-w-[90vw] max-h-[80vh] overflow-y-auto"
        style={{
          left: Math.min(Math.max(10, position.x), window.innerWidth - 360),
          top: Math.min(Math.max(10, position.y), window.innerHeight * 0.15),
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* Status selector */}
        <div>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Stato</span>
          <div className="flex flex-wrap gap-1.5">
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
        
        <div className="h-px bg-muted/50" />
        
        {/* Title format */}
        {onTitleFormatChange && (
          <>
            <TitleFormatControls
              format={getTitleFormat(currentCustomFields)}
              onChange={(fmt) => {
                const existing = currentCustomFields || {};
                onTitleFormatChange({ ...existing, ...titleFormatToCustomFields(fmt) });
              }}
            />
            <div className="h-px bg-muted/50" />
          </>
        )}
        
        {/* Emoji picker */}
        <div>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Emoji</span>
          <EmojiGridWithCustom
            currentEmoji={currentEmoji}
            onSelect={(emoji) => { onEmojiSelect(emoji); onClose(); }}
            onRemove={() => { onEmojiSelect(null); onClose(); }}
            emojis={BUYER_EMOJIS}
          />
        </div>

        <div className="h-px bg-muted/50" />
        
        {/* Card color picker */}
        <div>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Colore card</span>
          <div className="grid grid-cols-10 gap-1">
            {PALETTE_COLORS.map((c, i) => (
              <button
                key={c || 'default'}
                onClick={() => { onColorSelect(c); onClose(); }}
                className={cn(
                  "w-5 h-5 rounded-sm border border-border/30 hover:scale-125 transition-transform",
                  !c && "bg-card border-2 border-muted",
                  currentColor === c && "ring-2 ring-foreground ring-offset-1"
                )}
                style={c ? { backgroundColor: c } : undefined}
                title={c || 'Default'}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => setShowCustomPicker(!showCustomPicker)}
              className={cn(
                "text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1",
                showCustomPicker && "text-foreground font-medium"
              )}
            >
              + Colore personalizzato
            </button>
            {currentColor && !PALETTE_COLORS.includes(currentColor) && !favorites.includes(currentColor) && (
              <button
                onClick={() => { addFavorite(currentColor); triggerHaptic('light'); }}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Star className="w-3 h-3" />
                Salva
              </button>
            )}
          </div>
          {currentColor && (
            <button
              onClick={() => { onColorSelect(null); onClose(); }}
              className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3 h-3" />
              Rimuovi colore
            </button>
          )}
        </div>

        {/* Favorite colors */}
        {favorites.length > 0 && (
          <>
            <div className="h-px bg-muted/50" />
            <div>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 block flex items-center gap-1">
                <Star className="w-3 h-3" />
                Preferiti
              </span>
              <div className="flex flex-wrap items-center gap-1.5 max-w-[220px]">
                {favorites.map((color) => (
                  <button
                    key={color}
                    onClick={() => { onColorSelect(color); onClose(); }}
                    onContextMenu={(e) => { e.preventDefault(); removeFavorite(color); triggerHaptic('light'); }}
                    className={cn(
                      "w-7 h-7 rounded-lg transition-all hover:scale-110 relative group",
                      currentColor === color && "ring-2 ring-offset-1 ring-foreground"
                    )}
                    style={{ backgroundColor: color }}
                    title="Click: applica · Tasto destro: rimuovi"
                  >
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-destructive text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Delete button */}
        {onDelete && (
          <>
            <div className="h-px bg-muted/50" />
            <button
              onClick={() => {
                if (window.confirm('Eliminare questo cliente?')) {
                  onDelete();
                  onClose();
                }
              }}
              className="flex items-center gap-2 text-xs text-destructive hover:text-destructive/80 transition-colors py-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Elimina cliente
            </button>
          </>
        )}
      </div>
      
      <ColorPickerOverlay
        open={showCustomPicker}
        color={customCardColor}
        onChange={(newColor) => {
          onColorSelect(newColor);
          onClose();
        }}
        onClose={() => setShowCustomPicker(false)}
      />
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
  onTitleFormatChange,
  onDelete,
  isDragging,
  showAgent = true,
  agentName,
  agentEmoji,
  statusColumns = defaultStatusColumns,
}: ClienteCardProps) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPos, setPickerPos] = useState({ x: 0, y: 0 });

  const handleContextAction = useCallback((pos: { x: number; y: number }) => {
    setPickerPos(pos);
    setPickerOpen(true);
  }, []);

  const handleCardClick = useCallback(() => {
    if (pickerOpen) return;
    onClick();
  }, [pickerOpen, onClick]);

  const urgent = isUrgent(cliente.tempo_ricerca);
  const textColor = isDarkColor(cliente.card_color) ? 'text-white' : 'text-foreground';

  const reminderStatus = useMemo(() => {
    if (!cliente.reminder_date) return null;
    const date = new Date(cliente.reminder_date);
    if (isPast(date) && !isToday(date)) return 'overdue';
    if (isToday(date)) return 'today';
    if (isTomorrow(date)) return 'tomorrow';
    return null;
  }, [cliente.reminder_date]);

  const daysSinceContact = useMemo(() => {
    const refDate = cliente.last_contact_date || cliente.updated_at;
    if (!refDate) return null;
    return differenceInDays(new Date(), new Date(refDate));
  }, [cliente.last_contact_date, cliente.updated_at]);

  const formatBudget = (budget: number | null) => {
    if (!budget) return null;
    if (budget >= 1000000) return `€${(budget / 1000000).toFixed(1)}M`;
    return `€${(budget / 1000).toFixed(0)}k`;
  };

  return (
    <EntityCardWrapper
      cardColor={cliente.card_color}
      isDragging={isDragging}
      onClick={handleCardClick}
      onContextAction={handleContextAction}
      className={cn("relative p-3", !cliente.card_color && "bg-card", textColor)}
    >
      {/* Header with emoji and name */}
      <div className="flex items-start gap-2 mb-2">
        <span className="text-xl flex-shrink-0">
          {cliente.emoji}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm whitespace-normal break-words" style={{ textTransform: 'none', letterSpacing: 'normal', fontSize: '14px', ...titleStyle(getTitleFormat((cliente as any).custom_fields)) }}>{[cliente.nome, cliente.cognome].filter(Boolean).join(' ')}</h4>
          {cliente.paese && (
            <span className="text-xs opacity-70">{cliente.paese}</span>
          )}
        </div>
      </div>

      {/* Notes preview */}
      {cliente.note_extra && (
        <div className="text-xs opacity-70 mb-1.5 line-clamp-2 whitespace-pre-line break-words">
          {cliente.note_extra}
        </div>
      )}

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
              reminderStatus === 'overdue' ? 'text-destructive' : 
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
          {daysSinceContact !== null && daysSinceContact > 14 && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium",
              daysSinceContact > 30 ? 'text-destructive' : 'text-amber-600'
            )}>
              <AlertCircle className="w-3 h-3" />
              <span>{daysSinceContact}g</span>
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
          currentCustomFields={(cliente as any).custom_fields}
          statusColumns={statusColumns}
          onColorSelect={onColorChange}
          onStatusChange={onStatusChange}
          onEmojiSelect={(emoji) => onEmojiChange?.(emoji)}
          onTitleFormatChange={onTitleFormatChange}
          onDelete={onDelete}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </EntityCardWrapper>
  );
});

ClienteCard.displayName = 'ClienteCard';

export default ClienteCard;
