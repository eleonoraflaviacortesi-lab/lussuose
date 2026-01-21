import { memo, useCallback, useState, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Notizia, NotiziaStatus, useNotizie } from '@/hooks/useNotizie';
import { cn } from '@/lib/utils';
import { MessageCircle } from 'lucide-react';

interface KanbanBoardProps {
  notizieByStatus: Record<NotiziaStatus, Notizia[]>;
  onNotiziaClick: (notizia: Notizia) => void;
  onStatusChange: (id: string, status: NotiziaStatus) => void;
}

const columns: { key: NotiziaStatus; label: string; style: string }[] = [
  { key: 'new', label: 'NEW!', style: 'bg-yellow-200 text-yellow-900' },
  { key: 'in_progress', label: 'In progress', style: 'bg-yellow-400 text-yellow-950' },
  { key: 'done', label: 'Done', style: 'bg-orange-400 text-orange-950' },
  { key: 'on_shot', label: 'On shot', style: 'bg-red-400 text-red-950' },
  { key: 'taken', label: 'Taken', style: 'bg-green-200 text-green-900' },
  { key: 'no', label: 'No', style: 'bg-zinc-900 text-white' },
  { key: 'sold', label: 'Sold', style: 'bg-zinc-600 text-white' },
];

// Preset colors for cards
const cardColors = [
  { value: null, label: 'Default', color: 'bg-card border-2 border-muted' },
  { value: '#fef3c7', label: 'Giallo', color: 'bg-amber-200' },
  { value: '#fed7aa', label: 'Arancio', color: 'bg-orange-300' },
  { value: '#fecaca', label: 'Rosso', color: 'bg-red-300' },
  { value: '#bbf7d0', label: 'Verde', color: 'bg-green-300' },
];

// Helper to determine if color is dark
const isDarkColor = (color: string | null): boolean => {
  if (!color) return false;
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
};

// Color picker pill component
const ColorPickerPill = memo(({ 
  position, 
  currentColor, 
  onSelect, 
  onClose 
}: { 
  position: { x: number; y: number }; 
  currentColor: string | null;
  onSelect: (color: string | null) => void;
  onClose: () => void;
}) => {
  const [customColor, setCustomColor] = useState(currentColor || '#fef3c7');
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50" 
        onClick={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      />
      {/* Pill */}
      <div
        className="fixed z-50 flex items-center gap-1.5 px-2 py-1.5 bg-white/90 backdrop-blur-xl rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.15)] animate-in zoom-in-95 fade-in duration-150"
        style={{
          left: Math.min(position.x, window.innerWidth - 200),
          top: Math.min(position.y, window.innerHeight - 60),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {cardColors.map((c) => (
          <button
            key={c.value || 'default'}
            onClick={() => { onSelect(c.value); onClose(); }}
            className={cn(
              "w-7 h-7 rounded-full transition-transform active:scale-90 shadow-sm",
              c.color,
              currentColor === c.value && "ring-2 ring-foreground ring-offset-1"
            )}
            title={c.label}
          />
        ))}
        {/* Custom color picker */}
        <div className="relative">
          <input
            type="color"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            onBlur={() => { onSelect(customColor); onClose(); }}
            className="absolute inset-0 w-7 h-7 opacity-0 cursor-pointer"
          />
          <div 
            className="w-7 h-7 rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center text-[10px] font-bold text-muted-foreground"
            style={{ background: `linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3)` }}
          >
            +
          </div>
        </div>
      </div>
    </>
  );
});
ColorPickerPill.displayName = 'ColorPickerPill';

// Card with long-press and right-click color support
const Card = memo(({ notizia, onClick, onColorChange }: { 
  notizia: Notizia; 
  onClick: () => void;
  onColorChange: (color: string | null) => void;
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPos, setPickerPos] = useState({ x: 0, y: 0 });
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isDark = isDarkColor(notizia.card_color);
  const commentsCount = notizia.comments?.length || 0;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPickerPos({ x: e.clientX - 100, y: e.clientY - 50 });
    setPickerOpen(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    longPressTimer.current = setTimeout(() => {
      // Haptic feedback on mobile
      if (navigator.vibrate) {
        navigator.vibrate(15);
      }
      setPickerPos({ x: touch.clientX - 100, y: touch.clientY - 60 });
      setPickerOpen(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchMove = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };
  
  return (
    <>
      <div
        className={cn(
          "rounded-xl p-2.5 cursor-pointer active:scale-[0.98] transition-all shadow-sm select-none",
          notizia.card_color ? "backdrop-blur-sm" : "bg-card"
        )}
        style={notizia.card_color ? { 
          backgroundColor: notizia.card_color,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.4)'
        } : undefined}
        onClick={onClick}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
      >
        <div className="flex items-start gap-2">
          {notizia.emoji && <span className={cn("text-sm shrink-0", isDark && "drop-shadow-sm")}>{notizia.emoji}</span>}
          <div className="flex-1 min-w-0">
            <p className={cn("font-medium text-sm leading-tight", isDark ? "text-white" : "text-foreground")}>{notizia.name}</p>
            {notizia.zona && (
              <span className={cn("text-[10px]", isDark ? "text-white/70" : "text-muted-foreground")}>{notizia.zona}</span>
            )}
          </div>
          {commentsCount > 0 && (
            <div className={cn("flex items-center gap-0.5", isDark ? "text-white/70" : "text-muted-foreground")}>
              <MessageCircle className="w-3 h-3" />
              <span className="text-[10px]">{commentsCount}</span>
            </div>
          )}
        </div>
      </div>

      {pickerOpen && (
        <ColorPickerPill
          position={pickerPos}
          currentColor={notizia.card_color}
          onSelect={(color) => onColorChange(color)}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
});
Card.displayName = 'Card';

const KanbanBoard = memo(({ notizieByStatus, onNotiziaClick, onStatusChange }: KanbanBoardProps) => {
  const { updateNotizia } = useNotizie();
  
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId as NotiziaStatus;
    onStatusChange(result.draggableId, newStatus);
  }, [onStatusChange]);

  const handleColorChange = useCallback((id: string, color: string | null) => {
    updateNotizia.mutate({ id, card_color: color });
  }, [updateNotizia]);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-3 pb-4 overflow-x-auto lg:h-full lg:gap-4 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
        {columns.map(({ key, label, style }) => (
          <div key={key} className="flex flex-col min-w-[180px] max-w-[240px] lg:flex-1 lg:min-w-0 lg:max-w-none">
            <div className="flex items-center gap-2 mb-2 lg:mb-3">
              <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-md', style)}>
                {label}
              </span>
              <span className="text-xs text-muted-foreground">{notizieByStatus[key].length}</span>
            </div>
            <Droppable droppableId={key}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "flex flex-col gap-1.5 min-h-[80px] rounded-lg p-1.5 transition-colors lg:flex-1 lg:min-h-0 lg:overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40",
                    snapshot.isDraggingOver && "bg-accent/20"
                  )}
                >
                  {notizieByStatus[key].map((notizia, index) => (
                    <Draggable key={notizia.id} draggableId={notizia.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={cn(snapshot.isDragging && "scale-105 shadow-lg rotate-1")}
                        >
                          <Card 
                            notizia={notizia} 
                            onClick={() => onNotiziaClick(notizia)} 
                            onColorChange={(color) => handleColorChange(notizia.id, color)}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
});

KanbanBoard.displayName = 'KanbanBoard';

export default KanbanBoard;
