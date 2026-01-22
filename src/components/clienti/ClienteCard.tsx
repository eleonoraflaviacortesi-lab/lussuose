import { memo, useState, useCallback } from 'react';
import { Cliente } from '@/types';
import { cn } from '@/lib/utils';
import { MapPin, Euro, Home, User, Clock } from 'lucide-react';

interface ClienteCardProps {
  cliente: Cliente;
  onClick: () => void;
  onColorChange?: (color: string | null) => void;
  onEmojiChange?: (emoji: string) => void;
  isDragging?: boolean;
  showAgent?: boolean;
  agentName?: string;
}

const cardColors = [
  null, // Reset
  '#fef3c7', // Amber
  '#dcfce7', // Green
  '#dbeafe', // Blue
  '#fce7f3', // Pink
  '#f3e8ff', // Purple
  '#fed7d7', // Red
  '#e0e7ff', // Indigo
];

const quickEmojis = ['🏠', '🏡', '🏰', '🏛️', '🌳', '🌊', '⭐', '🔥', '💎', '🎯'];

const isDarkColor = (hex: string | null): boolean => {
  if (!hex) return false;
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 0.299 + g * 0.587 + b * 0.114) < 150;
};

const isUrgent = (tempoRicerca: string | null): boolean => {
  if (!tempoRicerca) return false;
  const lower = tempoRicerca.toLowerCase();
  return lower.includes('less than 3') || lower.includes('< 3') || lower.includes('1 month');
};

const ColorPicker = memo(({ onSelect, onClose }: { 
  onSelect: (color: string | null) => void; 
  onClose: () => void;
}) => (
  <div 
    className="absolute top-full left-0 mt-1 z-50 bg-white rounded-lg shadow-lg p-2 flex gap-1 flex-wrap max-w-[140px]"
    onClick={e => e.stopPropagation()}
  >
    {cardColors.map((color, i) => (
      <button
        key={i}
        className={cn(
          "w-6 h-6 rounded-full transition-transform hover:scale-110",
          color === null ? "bg-muted" : ""
        )}
        style={{ backgroundColor: color || undefined }}
        onClick={() => { onSelect(color); onClose(); }}
      />
    ))}
  </div>
));
ColorPicker.displayName = 'ColorPicker';

const EmojiPicker = memo(({ onSelect, onClose }: { 
  onSelect: (emoji: string) => void; 
  onClose: () => void;
}) => (
  <div 
    className="absolute top-full left-0 mt-1 z-50 bg-white rounded-lg shadow-lg p-2 flex gap-1 flex-wrap max-w-[180px]"
    onClick={e => e.stopPropagation()}
  >
    {quickEmojis.map(emoji => (
      <button
        key={emoji}
        className="w-7 h-7 rounded hover:bg-muted flex items-center justify-center text-lg"
        onClick={() => { onSelect(emoji); onClose(); }}
      >
        {emoji}
      </button>
    ))}
  </div>
));
EmojiPicker.displayName = 'EmojiPicker';

export const ClienteCard = memo(({ 
  cliente, 
  onClick, 
  onColorChange,
  onEmojiChange,
  isDragging,
  showAgent = true,
  agentName,
}: ClienteCardProps) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onColorChange) {
      setShowColorPicker(true);
      setShowEmojiPicker(false);
    }
  }, [onColorChange]);

  const handleEmojiClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEmojiChange) {
      setShowEmojiPicker(true);
      setShowColorPicker(false);
    }
  }, [onEmojiChange]);

  const urgent = isUrgent(cliente.tempo_ricerca);
  const textColor = isDarkColor(cliente.card_color) ? 'text-white' : 'text-foreground';

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
    >
      {/* Header with emoji and name */}
      <div className="flex items-start gap-2 mb-2">
        <button
          className="text-xl hover:scale-110 transition-transform flex-shrink-0"
          onClick={handleEmojiClick}
        >
          {cliente.emoji}
        </button>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{cliente.nome}</h4>
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

      {/* Footer: Agent + Urgency */}
      <div className="flex items-center justify-between mt-2 pt-2">
        {showAgent && (
          <div className="flex items-center gap-1 text-xs opacity-70">
            <User className="w-3 h-3" />
            <span className="truncate max-w-[80px]">
              {agentName || 'Non assegnato'}
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

      {/* Pickers */}
      {showColorPicker && onColorChange && (
        <ColorPicker 
          onSelect={onColorChange} 
          onClose={() => setShowColorPicker(false)} 
        />
      )}
      {showEmojiPicker && onEmojiChange && (
        <EmojiPicker 
          onSelect={onEmojiChange} 
          onClose={() => setShowEmojiPicker(false)} 
        />
      )}
    </div>
  );
});

ClienteCard.displayName = 'ClienteCard';

export default ClienteCard;
