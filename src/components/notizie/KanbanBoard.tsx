import { memo, useCallback, useState, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Notizia, NotiziaStatus, useNotizie } from '@/hooks/useNotizie';
import { useKanbanColumns, KanbanColumn } from '@/hooks/useKanbanColumns';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';
import { MessageCircle, X, Plus, GripVertical, Trash2 } from 'lucide-react';

// Common emojis for quick selection
const QUICK_EMOJIS = ['🏠', '🏢', '🏘️', '🏡', '📍', '⭐', '🔑', '💎', '🌟', '❤️', '📋', '📞'];

// Preset colors for columns
const COLUMN_COLORS = [
  '#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', 
  '#06b6d4', '#ec4899', '#1f2937', '#6b7280', '#84cc16'
];

interface KanbanBoardProps {
  notizieByStatus: Record<string, Notizia[]>;
  onNotiziaClick: (notizia: Notizia) => void;
  onStatusChange: (id: string, status: NotiziaStatus) => void;
  onQuickAdd?: (status: NotiziaStatus) => void;
}

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
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
};

// Editable column header
const ColumnHeader = memo(({ 
  column, 
  count, 
  onUpdate, 
  onDelete, 
  onQuickAdd,
  isDragging 
}: { 
  column: KanbanColumn;
  count: number;
  onUpdate: (updates: Partial<KanbanColumn>) => void;
  onDelete: () => void;
  onQuickAdd?: () => void;
  isDragging?: boolean;
}) => {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(column.label);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = () => {
    if (label.trim() && label !== column.label) {
      onUpdate({ label: label.trim() });
    }
    setEditing(false);
  };

  const handleColorSelect = (color: string) => {
    onUpdate({ color });
    setShowColorPicker(false);
  };

  const [customColor, setCustomColor] = useState(column.color);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const handleSaveCustomColor = () => {
    onUpdate({ color: customColor });
    setShowCustomPicker(false);
    setShowColorPicker(false);
  };

  return (
    <div className={cn(
      "flex items-center gap-2 mb-2 lg:mb-3 group relative",
      isDragging && "opacity-50"
    )}>
      <GripVertical className="w-4 h-4 text-muted-foreground lg:opacity-0 lg:group-hover:opacity-100 transition-opacity cursor-grab shrink-0 touch-none" />
      
      {editing ? (
        <input
          ref={inputRef}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') { setLabel(column.label); setEditing(false); }
          }}
          className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white shadow-lg outline-none w-24"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="text-[11px] font-semibold px-2 py-0.5 rounded-md transition-transform hover:scale-105 cursor-text"
          style={{ 
            backgroundColor: column.color,
            color: isDarkColor(column.color) ? 'white' : 'black'
          }}
          title="Clicca per modificare nome"
        >
          {column.label}
        </button>
      )}
      
      {/* Color button */}
      <button
        onClick={() => setShowColorPicker(!showColorPicker)}
        className="w-4 h-4 rounded-full shrink-0 transition-transform hover:scale-110 ring-1 ring-black/10"
        style={{ backgroundColor: column.color }}
        title="Cambia colore"
      />
      
      <span className="text-xs text-muted-foreground">{count}</span>
      
      {onQuickAdd && (
        <button
          onClick={onQuickAdd}
          className="ml-auto text-foreground hover:opacity-60 transition-opacity"
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
      
      <button
        onClick={onDelete}
        className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
        title="Elimina colonna"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {/* Color picker dropdown - Liquid Glass style */}
      {showColorPicker && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setShowColorPicker(false); setShowCustomPicker(false); }} />
          <div className="absolute top-8 left-0 z-50 p-3 bg-white/90 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] rounded-2xl min-w-[220px] animate-in zoom-in-95 fade-in duration-150">
            <div className="flex flex-wrap items-center gap-2">
              {COLUMN_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all active:scale-90 shadow-sm",
                    column.color === color && "ring-2 ring-foreground ring-offset-2"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
              {/* Custom color toggle */}
              <button
                onClick={() => setShowCustomPicker(!showCustomPicker)}
                className={cn(
                  "w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-sm font-bold text-black transition-all active:scale-90",
                  showCustomPicker && "ring-2 ring-foreground ring-offset-2"
                )}
              >
                +
              </button>
            </div>
            
            {/* Custom color picker section */}
            {showCustomPicker && (
              <div className="mt-3 pt-3 border-t border-black/5">
                <div className="flex items-center gap-3">
                  <input
                    ref={colorInputRef}
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-12 h-12 rounded-xl cursor-pointer shadow-inner"
                  />
                  <div 
                    className="flex-1 h-12 rounded-xl shadow-inner"
                    style={{ backgroundColor: customColor }}
                  />
                  <button
                    onClick={handleSaveCustomColor}
                    className="px-4 py-2.5 bg-foreground text-background text-xs font-semibold rounded-full shadow-lg active:scale-95 transition-transform"
                  >
                    Salva
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
});
ColumnHeader.displayName = 'ColumnHeader';

// Color and Status picker pill component - uses dynamic columns
const ColorStatusPickerPill = memo(({ 
  position, 
  currentColor,
  currentStatus,
  columns,
  onColorSelect, 
  onStatusChange,
  onClose 
}: { 
  position: { x: number; y: number }; 
  currentColor: string | null;
  currentStatus: NotiziaStatus;
  columns: KanbanColumn[];
  onColorSelect: (color: string | null) => void;
  onStatusChange: (status: NotiziaStatus) => void;
  onClose: () => void;
}) => {
  const [customCardColor, setCustomCardColor] = useState(currentColor || '#fef3c7');
  
  return (
    <>
      <div 
        className="fixed inset-0 z-50" 
        onClick={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      />
      <div
        className="fixed z-50 flex flex-col gap-2.5 p-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] animate-in zoom-in-95 fade-in duration-150"
        style={{
          left: Math.min(Math.max(10, position.x), window.innerWidth - 240),
          top: Math.min(position.y, window.innerHeight - 180),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Status selector - uses dynamic columns */}
        <div className="flex flex-wrap gap-1.5 max-w-[220px]">
          {columns.map((col) => (
            <button
              key={col.key}
              onClick={() => { onStatusChange(col.key as NotiziaStatus); onClose(); }}
              className={cn(
                "px-2.5 py-1 text-[10px] font-medium rounded-full transition-all active:scale-95",
                currentStatus === col.key && "ring-2 ring-foreground ring-offset-1"
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
            <div className="relative">
              <input
                type="color"
                value={customCardColor}
                onChange={(e) => setCustomCardColor(e.target.value)}
                onBlur={() => { onColorSelect(customCardColor); onClose(); }}
                className="absolute inset-0 w-7 h-7 opacity-0 cursor-pointer"
              />
              <div className="w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center text-sm font-bold text-black">
                +
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});
ColorStatusPickerPill.displayName = 'ColorStatusPickerPill';

// Emoji picker pill component
const EmojiPickerPill = memo(({ 
  position, 
  currentEmoji, 
  onSelect, 
  onClose 
}: { 
  position: { x: number; y: number }; 
  currentEmoji: string | null;
  onSelect: (emoji: string | null) => void;
  onClose: () => void;
}) => {
  return (
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <div
        className="fixed z-50 flex flex-wrap items-center gap-1 p-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] animate-in zoom-in-95 fade-in duration-150 max-w-[200px]"
        style={{
          left: Math.min(Math.max(10, position.x), window.innerWidth - 210),
          top: Math.min(position.y, window.innerHeight - 80),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {currentEmoji && (
          <button
            onClick={() => { onSelect(null); onClose(); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center bg-muted hover:bg-destructive hover:text-white transition-colors"
            title="Rimuovi emoji"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => { onSelect(emoji); onClose(); }}
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center text-base hover:bg-muted transition-colors",
              currentEmoji === emoji && "bg-muted ring-1 ring-foreground"
            )}
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
});
EmojiPickerPill.displayName = 'EmojiPickerPill';

// Card component
const Card = memo(({ notizia, columns, onClick, onColorChange, onEmojiChange, onStatusChange }: { 
  notizia: Notizia; 
  columns: KanbanColumn[];
  onClick: () => void;
  onColorChange: (color: string | null) => void;
  onEmojiChange: (emoji: string | null) => void;
  onStatusChange: (status: NotiziaStatus) => void;
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
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
    // Don't start long press if a picker is already open
    if (pickerOpen || emojiPickerOpen) return;
    
    const touch = e.touches[0];
    longPressTimer.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(15);
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

  const handleEmojiClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setPickerPos({ x: rect.left, y: rect.bottom + 5 });
    setEmojiPickerOpen(true);
  };

  const handleCardClick = () => {
    // Don't open detail if a picker is open or was just closed
    if (pickerOpen || emojiPickerOpen) return;
    triggerHaptic('light');
    onClick();
  };
  
  return (
    <>
      <div
        className={cn(
          "rounded-xl p-2.5 cursor-pointer transition-all duration-100 shadow-sm select-none active:scale-[0.97] active:shadow-md",
          notizia.card_color ? "backdrop-blur-sm" : "bg-card"
        )}
        style={notizia.card_color ? { 
          backgroundColor: notizia.card_color,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.4)'
        } : undefined}
        onClick={handleCardClick}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
      >
        <div className="flex items-start gap-2">
          <button
            onClick={handleEmojiClick}
            className={cn(
              "text-sm shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-black/10 transition-colors",
              isDark && "drop-shadow-sm hover:bg-white/20"
            )}
          >
            {notizia.emoji || <span className="text-[10px] text-muted-foreground">+</span>}
          </button>
          <div className="flex-1">
            <p className={cn(
              "font-medium text-sm leading-tight whitespace-normal",
              isDark ? "text-white" : "text-foreground"
            )} style={{ wordBreak: 'break-word' }}>
              {notizia.name}
            </p>
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
        <ColorStatusPickerPill
          position={pickerPos}
          currentColor={notizia.card_color}
          currentStatus={notizia.status as NotiziaStatus}
          columns={columns}
          onColorSelect={onColorChange}
          onStatusChange={onStatusChange}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {emojiPickerOpen && (
        <EmojiPickerPill
          position={pickerPos}
          currentEmoji={notizia.emoji}
          onSelect={onEmojiChange}
          onClose={() => setEmojiPickerOpen(false)}
        />
      )}
    </>
  );
});
Card.displayName = 'Card';

// Add Column Button
const AddColumnButton = memo(({ onAdd }: { onAdd: () => void }) => (
  <button
    onClick={onAdd}
    className="flex flex-col items-center justify-center w-[240px] min-w-[240px] h-24 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-muted-foreground"
  >
    <Plus className="w-6 h-6 mb-1" />
    <span className="text-xs">Aggiungi colonna</span>
  </button>
));
AddColumnButton.displayName = 'AddColumnButton';

const KanbanBoard = memo(({ notizieByStatus, onNotiziaClick, onStatusChange, onQuickAdd }: KanbanBoardProps) => {
  const { updateNotizia, updateOrder } = useNotizie();
  const { columns, updateColumn, addColumn, deleteColumn, reorderColumns, isLoading } = useKanbanColumns();
  const topScrollRef = useRef<HTMLDivElement>(null);
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const [scrollWidth, setScrollWidth] = useState(0);

  // Sync scroll between top and main scrollbars
  useEffect(() => {
    const mainEl = mainScrollRef.current;
    const topEl = topScrollRef.current;
    if (!mainEl || !topEl) return;

    setScrollWidth(mainEl.scrollWidth);

    const syncTop = () => { if (mainEl) mainEl.scrollLeft = topEl.scrollLeft; };
    const syncMain = () => { if (topEl) topEl.scrollLeft = mainEl.scrollLeft; };

    topEl.addEventListener('scroll', syncTop);
    mainEl.addEventListener('scroll', syncMain);

    return () => {
      topEl.removeEventListener('scroll', syncTop);
      mainEl.removeEventListener('scroll', syncMain);
    };
  }, [notizieByStatus, columns]);
  
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    
    // Haptic feedback on drop
    triggerHaptic('medium');
    
    const { type } = result;
    
    // Handle column reordering
    if (type === 'COLUMN') {
      const newOrder = [...columns];
      const [removed] = newOrder.splice(result.source.index, 1);
      newOrder.splice(result.destination.index, 0, removed);
      reorderColumns(newOrder.map(c => c.id));
      return;
    }
    
    // Handle card reordering
    const sourceStatus = result.source.droppableId as NotiziaStatus;
    const destStatus = result.destination.droppableId as NotiziaStatus;
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;
    
    const destItems = [...(notizieByStatus[destStatus] || [])];
    const sourceItems = sourceStatus === destStatus ? destItems : [...(notizieByStatus[sourceStatus] || [])];
    
    const [movedItem] = sourceItems.splice(sourceIndex, 1);
    destItems.splice(destIndex, 0, movedItem);
    
    const updates = destItems.map((item, index) => ({
      id: item.id,
      display_order: index,
      ...(item.id === movedItem.id && sourceStatus !== destStatus ? { status: destStatus } : {}),
    }));
    
    if (sourceStatus !== destStatus) {
      onStatusChange(result.draggableId, destStatus);
    }
    
    updateOrder.mutate(updates);
  }, [columns, notizieByStatus, onStatusChange, updateOrder, reorderColumns]);

  const handleColorChange = useCallback((id: string, color: string | null) => {
    updateNotizia.mutate({ id, card_color: color, silent: true });
  }, [updateNotizia]);

  const handleEmojiChange = useCallback((id: string, emoji: string | null) => {
    updateNotizia.mutate({ id, emoji: emoji, silent: true });
  }, [updateNotizia]);

  const handleAddColumn = useCallback(() => {
    addColumn({ label: 'Nuova', color: '#6b7280' });
  }, [addColumn]);

  const handleDeleteColumn = useCallback(async (columnId: string, columnKey: string) => {
    // Move all notizie in this column to 'new' status first
    const notizieToMove = notizieByStatus[columnKey] || [];
    for (const notizia of notizieToMove) {
      await updateNotizia.mutateAsync({ id: notizia.id, status: 'new' as NotiziaStatus, silent: true });
    }
    deleteColumn(columnId);
  }, [notizieByStatus, updateNotizia, deleteColumn]);

  if (isLoading || columns.length === 0) {
    return (
      <div className="flex gap-4 pb-4 overflow-x-auto animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="w-[240px] min-w-[240px]">
            <div className="h-6 w-20 bg-muted rounded-md mb-3" />
            <div className="space-y-2">
              <div className="h-16 bg-muted rounded-xl" />
              <div className="h-16 bg-muted rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="lg:h-full lg:flex lg:flex-col">
        {/* Top scrollbar (desktop only) */}
        <div
          ref={topScrollRef}
          className="hidden lg:block overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40 mb-1"
          style={{ height: '12px' }}
        >
          <div style={{ width: scrollWidth, height: '1px' }} />
        </div>
        
        {/* Columns container with horizontal drag */}
        <Droppable droppableId="columns" type="COLUMN" direction="horizontal">
          {(provided) => (
            <div 
              ref={(el) => {
                provided.innerRef(el);
                if (mainScrollRef.current !== el) {
                  (mainScrollRef as any).current = el;
                }
              }}
              {...provided.droppableProps}
              className="flex gap-3 pb-4 overflow-x-auto lg:flex-1 lg:gap-4 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40"
            >
              {columns.map((column, columnIndex) => (
                <Draggable key={column.id} draggableId={`column-${column.id}`} index={columnIndex}>
                  {(columnProvided, columnSnapshot) => (
                    <div
                      ref={columnProvided.innerRef}
                      {...columnProvided.draggableProps}
                      className={cn(
                        "flex flex-col w-[240px] min-w-[240px] max-w-[240px] lg:w-[260px] lg:min-w-[260px] lg:max-w-[260px] relative",
                        columnSnapshot.isDragging && "z-50"
                      )}
                    >
                      <div {...columnProvided.dragHandleProps}>
                        <ColumnHeader
                          column={column}
                          count={(notizieByStatus[column.key] || []).length}
                          onUpdate={(updates) => updateColumn({ id: column.id, ...updates })}
                          onDelete={() => handleDeleteColumn(column.id, column.key)}
                          onQuickAdd={onQuickAdd ? () => onQuickAdd(column.key as NotiziaStatus) : undefined}
                          isDragging={columnSnapshot.isDragging}
                        />
                      </div>
                      
                      <Droppable droppableId={column.key} type="CARD">
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn(
                              "flex flex-col gap-1.5 min-h-[80px] rounded-lg p-1.5 transition-colors lg:flex-1 lg:min-h-0 lg:overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40",
                              snapshot.isDraggingOver && "bg-accent/20"
                            )}
                          >
                            {(notizieByStatus[column.key] || []).map((notizia, index) => (
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
                                      columns={columns}
                                      onClick={() => onNotiziaClick(notizia)} 
                                      onColorChange={(color) => handleColorChange(notizia.id, color)}
                                      onEmojiChange={(emoji) => handleEmojiChange(notizia.id, emoji)}
                                      onStatusChange={(status) => onStatusChange(notizia.id, status)}
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
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              
              {/* Add column button */}
              <AddColumnButton onAdd={handleAddColumn} />
            </div>
          )}
        </Droppable>
      </div>
    </DragDropContext>
  );
});

KanbanBoard.displayName = 'KanbanBoard';

export default KanbanBoard;
