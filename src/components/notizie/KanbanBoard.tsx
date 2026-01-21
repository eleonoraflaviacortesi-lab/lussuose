import { memo, useCallback, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Notizia, NotiziaStatus, useNotizie } from '@/hooks/useNotizie';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Palette, MessageCircle } from 'lucide-react';

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

// Preset colors for cards - liquid glass style
const cardColors = [
  { value: null, label: 'Default', bg: 'bg-card', text: 'text-foreground' },
  { value: '#fef3c7', label: 'Giallo', bg: 'bg-amber-100', text: 'text-amber-900' },
  { value: '#dcfce7', label: 'Verde', bg: 'bg-green-100', text: 'text-green-900' },
  { value: '#dbeafe', label: 'Blu', bg: 'bg-blue-100', text: 'text-blue-900' },
  { value: '#fce7f3', label: 'Rosa', bg: 'bg-pink-100', text: 'text-pink-900' },
  { value: '#1e293b', label: 'Scuro', bg: 'bg-slate-800', text: 'text-white' },
];

// Helper to determine if color is dark
const isDarkColor = (color: string | null): boolean => {
  if (!color) return false;
  // Simple check: if hex starts with low values, it's dark
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
};

// Card with color support
const Card = memo(({ notizia, onClick, onColorChange }: { 
  notizia: Notizia; 
  onClick: () => void;
  onColorChange: (color: string | null) => void;
}) => {
  const [colorOpen, setColorOpen] = useState(false);
  const isDark = isDarkColor(notizia.card_color);
  const commentsCount = notizia.comments?.length || 0;
  
  return (
    <div
      className={cn(
        "rounded-xl p-2.5 cursor-pointer active:scale-[0.98] transition-all shadow-sm relative group",
        notizia.card_color ? "backdrop-blur-sm bg-opacity-80" : "bg-card"
      )}
      style={notizia.card_color ? { 
        backgroundColor: notizia.card_color,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.3)'
      } : undefined}
      onClick={onClick}
    >
      {/* Color picker button - visible on hover */}
      <Popover open={colorOpen} onOpenChange={setColorOpen}>
        <PopoverTrigger asChild>
          <button
            onClick={(e) => { e.stopPropagation(); setColorOpen(true); }}
            className={cn(
              "absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center",
              "bg-white/90 backdrop-blur-sm shadow-md opacity-0 group-hover:opacity-100 transition-opacity",
              "active:scale-90"
            )}
          >
            <Palette className="w-3 h-3 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-2 bg-white/95 backdrop-blur-xl shadow-lg border-0 rounded-xl" 
          align="end"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-1.5">
            {cardColors.map((color) => (
              <button
                key={color.value || 'default'}
                onClick={() => { onColorChange(color.value); setColorOpen(false); }}
                className={cn(
                  "w-7 h-7 rounded-lg border-2 transition-transform active:scale-90",
                  color.bg,
                  notizia.card_color === color.value ? "border-primary" : "border-transparent"
                )}
                title={color.label}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

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
