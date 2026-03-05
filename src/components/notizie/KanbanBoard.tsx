import { memo, useCallback, useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Notizia, NotiziaStatus, useNotizie } from '@/hooks/useNotizie';
import { useKanbanColumns, KanbanColumn, PROTECTED_COLUMN_KEY } from '@/hooks/useKanbanColumns';
import { cn, isDarkColor } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';
import { MessageCircle, X, Plus, Star, Wifi, WifiOff, Trash2 } from 'lucide-react';
import { ColorPickerOverlay } from '@/components/ui/color-picker-overlay';
import { useFavoriteColors } from '@/hooks/useFavoriteColors';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { EmojiGridWithCustom } from '@/components/shared/EmojiGridWithCustom';
import { KanbanColumnHeader } from '@/components/shared/KanbanColumnHeader';
import { EntityCardWrapper } from '@/components/shared/EntityCardWrapper';
import { TitleFormatControls, getTitleFormat, titleFormatToCustomFields, titleStyle } from '@/components/shared/TitleFormatControls';

// Common emojis for quick selection
const QUICK_EMOJIS = ['🏠', '🏢', '🏘️', '🏡', '📍', '⭐', '🔑', '💎', '🌟', '❤️', '📋', '📞', '📸'];

// Preset colors for columns
const COLUMN_COLORS = [
'#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6',
'#06b6d4', '#ec4899', '#1f2937', '#6b7280', '#84cc16'];


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
{ value: '#bbf7d0', label: 'Verde', color: 'bg-green-300' }];





// Color, Status, and Emoji picker pill component - uses dynamic columns
const ColorStatusPickerPill = memo(({
  position,
  currentColor,
  currentStatus,
  currentEmoji,
  currentCustomFields,
  columns,
  onColorSelect,
  onStatusChange,
  onEmojiSelect,
  onTitleFormatChange,
  onDelete,
  onClose













}: {position: {x: number;y: number;};currentColor: string | null;currentStatus: NotiziaStatus;currentEmoji: string | null;currentCustomFields: any;columns: KanbanColumn[];onColorSelect: (color: string | null) => void;onStatusChange: (status: NotiziaStatus) => void;onEmojiSelect: (emoji: string | null) => void;onTitleFormatChange?: (customFields: Record<string, any>) => void;onDelete?: () => void;onClose: () => void;}) => {
  const [customCardColor, setCustomCardColor] = useState(currentColor || '#fef3c7');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const { favorites, addFavorite, removeFavorite } = useFavoriteColors();

  const handleSaveCustomColor = () => {
    onColorSelect(customCardColor);
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50"
        onClick={onClose}
        onContextMenu={(e) => {e.preventDefault();onClose();}} />
      
      <div
        className="fixed z-50 flex flex-col gap-2.5 p-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] animate-in zoom-in-95 fade-in duration-150 max-h-[85vh] overflow-y-auto"
        style={{
          left: Math.min(Math.max(10, position.x), window.innerWidth - 260),
          top: Math.min(Math.max(10, position.y), window.innerHeight - 40),
          transform: position.y > window.innerHeight * 0.6 ? 'translateY(-100%)' : 'none'
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}>
        
        {/* Status selector - uses dynamic columns */}
        <div className="flex flex-wrap gap-1.5 max-w-[220px]">
          {columns.map((col) =>
          <button
            key={col.key}
            onClick={() => {onStatusChange(col.key as NotiziaStatus);onClose();}}
            className={cn(
              "px-2.5 py-1 text-[10px] font-medium rounded-full transition-all active:scale-95",
              currentStatus === col.key && "ring-2 ring-foreground ring-offset-1"
            )}
            style={{
              backgroundColor: col.color,
              color: isDarkColor(col.color) ? 'white' : 'black'
            }}>
            
              {col.label}
            </button>
          )}
        </div>
        
        {/* Separator */}
        <div className="h-px bg-muted/50" />
        
        {/* Title format */}
        {onTitleFormatChange &&
        <>
            <TitleFormatControls
            format={getTitleFormat(currentCustomFields)}
            onChange={(fmt) => {
              const existing = currentCustomFields || {};
              onTitleFormatChange({ ...existing, ...titleFormatToCustomFields(fmt) });
            }} />
          
            <div className="h-px bg-muted/50" />
          </>
        }
        
        {/* Emoji picker */}
        <div>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Emoji</span>
          <EmojiGridWithCustom
            currentEmoji={currentEmoji}
            onSelect={(emoji) => {onEmojiSelect(emoji);onClose();}}
            onRemove={() => {onEmojiSelect(null);onClose();}} />
          
        </div>

        {/* Separator */}
        <div className="h-px bg-muted/50" />
        
        {/* Card color picker */}
        <div>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Colore card</span>
          <div className="flex items-center gap-1.5">
            {cardColors.map((c) =>
            <button
              key={c.value || 'default'}
              onClick={() => {onColorSelect(c.value);onClose();}}
              className={cn(
                "w-7 h-7 rounded-full transition-transform active:scale-90 border border-border",
                c.color,
                currentColor === c.value && "ring-2 ring-foreground ring-offset-1"
              )}
              title={c.label} />

            )}
            {/* Custom color toggle */}
            <button
              onClick={() => setShowCustomPicker(!showCustomPicker)}
              className={cn(
                "w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center text-sm font-bold text-foreground transition-all active:scale-90",
                showCustomPicker && "ring-2 ring-foreground ring-offset-1"
              )}>
              
              +
            </button>
          </div>
          {/* Save current color as favorite */}
          {currentColor && !cardColors.some((c) => c.value === currentColor) && !favorites.includes(currentColor) &&
          <button
            onClick={() => {addFavorite(currentColor);triggerHaptic('light');}}
            className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
            
              <Star className="w-3 h-3" />
              Salva come preferito
            </button>
          }
        </div>

        {/* Favorite colors */}
        {favorites.length > 0 &&
        <>
            <div className="h-px bg-muted/50" />
            <div>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 block flex items-center gap-1">
                <Star className="w-3 h-3" />
                Preferiti
              </span>
              <div className="flex flex-wrap items-center gap-1.5 max-w-[220px]">
                {favorites.map((color) =>
              <button
                key={color}
                onClick={() => {onColorSelect(color);onClose();}}
                onContextMenu={(e) => {e.preventDefault();removeFavorite(color);triggerHaptic('light');}}
                className={cn(
                  "w-7 h-7 rounded-lg transition-all hover:scale-110 relative group",
                  currentColor === color && "ring-2 ring-offset-1 ring-foreground"
                )}
                style={{ backgroundColor: color }}
                title="Click: applica · Tasto destro: rimuovi">
                
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-destructive text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</span>
                  </button>
              )}
              </div>
            </div>
          </>
        }

        {/* Delete */}
        {onDelete &&
        <>
            <div className="h-px bg-muted/50" />
            <button
            onClick={() => {
              if (window.confirm('Eliminare questa notizia?')) {
                onDelete();
                onClose();
              }
            }}
            className="flex items-center gap-2 text-xs text-destructive hover:text-destructive/80 transition-colors py-1">
            
              <Trash2 className="w-3.5 h-3.5" />
              Elimina notizia
            </button>
          </>
        }
      </div>
      {/* Custom color picker overlay - outside scrollable container */}
      <ColorPickerOverlay
        open={showCustomPicker}
        color={customCardColor}
        onChange={(newColor) => {
          onColorSelect(newColor);
          onClose();
        }}
        onClose={() => setShowCustomPicker(false)} />
      
    </>);

});
ColorStatusPickerPill.displayName = 'ColorStatusPickerPill';

// Emoji picker pill component
const EmojiPickerPill = memo(({
  position,
  currentEmoji,
  onSelect,
  onClose





}: {position: {x: number;y: number;};currentEmoji: string | null;onSelect: (emoji: string | null) => void;onClose: () => void;}) => {
  return (
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <div
        className="fixed z-50 flex flex-wrap items-center gap-1 p-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] animate-in zoom-in-95 fade-in duration-150 max-w-[250px]"
        style={{
          left: Math.min(Math.max(10, position.x), window.innerWidth - 260),
          top: Math.min(position.y, window.innerHeight - 60)
        }}
        onClick={(e) => e.stopPropagation()}>
        
        <EmojiGridWithCustom
          currentEmoji={currentEmoji}
          onSelect={(emoji) => {onSelect(emoji);onClose();}}
          onRemove={() => {onSelect(null);onClose();}} />
        
      </div>
    </>);

});
EmojiPickerPill.displayName = 'EmojiPickerPill';

// Card component
const Card = memo(({ notizia, columns, onClick, onColorChange, onEmojiChange, onStatusChange, onOnlineToggle, onTitleFormatChange, onDelete









}: {notizia: Notizia;columns: KanbanColumn[];onClick: () => void;onColorChange: (color: string | null) => void;onEmojiChange: (emoji: string | null) => void;onStatusChange: (status: NotiziaStatus) => void;onOnlineToggle: (isOnline: boolean) => void;onTitleFormatChange?: (customFields: Record<string, any>) => void;onDelete?: () => void;}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [pickerPos, setPickerPos] = useState({ x: 0, y: 0 });
  const isDark = isDarkColor(notizia.card_color);
  const commentsCount = notizia.comments?.length || 0;

  const handleContextAction = useCallback((pos: {x: number;y: number;}) => {
    if (pickerOpen || emojiPickerOpen) return;
    setPickerPos({ x: pos.x - 100, y: pos.y - 50 });
    setPickerOpen(true);
  }, [pickerOpen, emojiPickerOpen]);

  const handleEmojiClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setPickerPos({ x: rect.left, y: rect.bottom + 5 });
    setEmojiPickerOpen(true);
  };

  const handleCardClick = useCallback(() => {
    if (pickerOpen || emojiPickerOpen) return;
    onClick();
  }, [pickerOpen, emojiPickerOpen, onClick]);

  return (
    <>
      <EntityCardWrapper
        cardColor={notizia.card_color}
        onClick={handleCardClick}
        onContextAction={handleContextAction}>
        
        <div className="flex items-start gap-2">
          <button
            onClick={handleEmojiClick}
            className={cn(
              "text-sm shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-black/10 transition-colors",
              isDark && "drop-shadow-sm hover:bg-white/20"
            )}>
            
            {notizia.emoji || <span className="text-[10px] text-muted-foreground">+</span>}
          </button>
          <div className="flex-1">
            <p className={cn("leading-tight whitespace-normal text-xs font-medium",

            isDark ? "text-white" : "text-foreground"
            )} style={{ wordBreak: 'break-word', ...titleStyle(getTitleFormat((notizia as any).custom_fields)) }}>
              {notizia.name}
            </p>
            {notizia.zona &&
            <span className={cn("text-[10px]", isDark ? "text-white/70" : "text-muted-foreground")}>{notizia.zona}</span>
            }
          </div>
          
          {/* Online/Offline toggle for "taken" status */}
          {notizia.status === 'taken' &&
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('light');
              onOnlineToggle(!notizia.is_online);
            }}
            className={cn(
              "shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all active:scale-90",
              notizia.is_online ?
              "bg-green-500 text-white" :
              isDark ?
              "bg-white/20 text-white/60" :
              "bg-muted text-muted-foreground"
            )}
            title={notizia.is_online ? "Online - Pubblicato" : "Offline - Non pubblicato"}>
            
              {notizia.is_online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            </button>
          }
          
          {commentsCount > 0 &&
          <div className={cn("flex items-center gap-0.5", isDark ? "text-white/70" : "text-muted-foreground")}>
              <MessageCircle className="w-3 h-3" />
              <span className="text-[10px]">{commentsCount}</span>
            </div>
          }
        </div>
      </EntityCardWrapper>

      {pickerOpen && createPortal(
      <ColorStatusPickerPill
        position={pickerPos}
        currentColor={notizia.card_color}
        currentStatus={notizia.status as NotiziaStatus}
        currentEmoji={notizia.emoji}
        currentCustomFields={(notizia as any).custom_fields}
        columns={columns}
        onColorSelect={onColorChange}
        onStatusChange={onStatusChange}
        onEmojiSelect={onEmojiChange}
        onTitleFormatChange={onTitleFormatChange}
        onDelete={onDelete}
        onClose={() => setPickerOpen(false)} />,
      document.body
      )}

      {emojiPickerOpen && createPortal(
      <EmojiPickerPill
        position={pickerPos}
        currentEmoji={notizia.emoji}
        onSelect={onEmojiChange}
        onClose={() => setEmojiPickerOpen(false)} />,
      document.body
      )}
    </>);

});
Card.displayName = 'Card';

// Add Column Button
const AddColumnButton = memo(({ onAdd, width }: {onAdd: () => void;width: number;}) =>
<button
  onClick={onAdd}
  className="flex flex-col items-center justify-center h-24 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-muted-foreground"
  style={{ width, minWidth: width, maxWidth: width }}>
  
    <Plus className={cn("w-6 h-6", width >= 140 && "mb-1")} />
    {width >= 140 && <span className="text-xs truncate">Aggiungi colonna</span>}
  </button>
);
AddColumnButton.displayName = 'AddColumnButton';

const KanbanBoard = memo(({ notizieByStatus, onNotiziaClick, onStatusChange, onQuickAdd }: KanbanBoardProps) => {
  const { updateNotizia, updateOrder, deleteNotizia, addNotizia } = useNotizie();
  const { pushAction } = useUndoRedo();
  const { columns, updateColumn, addColumn, deleteColumn, reorderColumns, isLoading } = useKanbanColumns();
  const topScrollRef = useRef<HTMLDivElement>(null);
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const [scrollWidth, setScrollWidth] = useState(0);

  // Sync scroll between top and main scrollbars
  useEffect(() => {
    const mainEl = mainScrollRef.current;
    const topEl = topScrollRef.current;
    if (!mainEl || !topEl) return;

    const updateMetrics = () => {
      setScrollWidth(mainEl.scrollWidth);
    };
    updateMetrics();

    const syncTop = () => {if (mainEl) mainEl.scrollLeft = topEl.scrollLeft;};
    const syncMain = () => {if (topEl) topEl.scrollLeft = mainEl.scrollLeft;};

    const resizeObserver = new ResizeObserver(updateMetrics);
    resizeObserver.observe(mainEl);

    topEl.addEventListener('scroll', syncTop);
    mainEl.addEventListener('scroll', syncMain);

    return () => {
      resizeObserver.disconnect();
      topEl.removeEventListener('scroll', syncTop);
      mainEl.removeEventListener('scroll', syncMain);
    };
  }, [notizieByStatus, columns]);

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    triggerHaptic('medium');

    const { type } = result;

    if (type === 'COLUMN') {
      const newOrder = [...columns];
      const [removed] = newOrder.splice(result.source.index, 1);
      newOrder.splice(result.destination.index, 0, removed);
      reorderColumns(newOrder.map((c) => c.id));
      return;
    }

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
      ...(item.id === movedItem.id && sourceStatus !== destStatus ? { status: destStatus } : {})
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

  const handleOnlineToggle = useCallback((id: string, isOnline: boolean) => {
    updateNotizia.mutate({ id, is_online: isOnline, silent: true });
  }, [updateNotizia]);

  const handleTitleFormatChange = useCallback((id: string, customFields: Record<string, any>) => {
    updateNotizia.mutate({ id, custom_fields: customFields, silent: true } as any);
  }, [updateNotizia]);

  const handleAddColumn = useCallback(() => {
    addColumn({ label: 'Nuova', color: '#6b7280' });
  }, [addColumn]);

  const handleDeleteColumn = useCallback(async (columnId: string, columnKey: string) => {
    const notizieToMove = notizieByStatus[columnKey] || [];
    for (const notizia of notizieToMove) {
      await updateNotizia.mutateAsync({ id: notizia.id, status: 'new' as NotiziaStatus, silent: true });
    }
    deleteColumn(columnId);
  }, [notizieByStatus, updateNotizia, deleteColumn]);

  const adaptiveColumnWidth = useMemo(() => {
    // Contenuto fisso: la box si adatta allo schermo, le colonne scorrono internamente.
    return 240;
  }, []);

  if (isLoading || columns.length === 0) {
    return (
      <div className="flex gap-4 pb-4 overflow-x-auto animate-pulse">
        {[1, 2, 3, 4, 5].map((i) =>
        <div key={i} className="w-[240px] min-w-[240px]">
            <div className="h-6 w-20 bg-muted rounded-md mb-3" />
            <div className="space-y-2">
              <div className="h-16 bg-muted rounded-xl" />
              <div className="h-16 bg-muted rounded-xl" />
            </div>
          </div>
        )}
      </div>);

  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="bg-card rounded-xl sm:rounded-2xl p-2 sm:p-3 pt-[12px] my-[17px] border-0">
        {/* Top scrollbar (desktop only) */}
        <div
          ref={topScrollRef}
          className="hidden lg:block overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40 mb-1"
          style={{ height: '12px' }}>
          
          <div style={{ width: scrollWidth, height: '1px' }} />
        </div>
        
        <Droppable droppableId="columns" type="COLUMN" direction="horizontal">
          {(provided) =>
          <div
            ref={(el) => {
              provided.innerRef(el);
              if (mainScrollRef.current !== el) {
                (mainScrollRef as any).current = el;
              }
            }}
            {...provided.droppableProps}
            className="flex gap-3 pb-3 overflow-x-auto w-full min-w-0 max-w-full lg:gap-3 mx-0">
            
              {columns.map((column, columnIndex) =>
            <Draggable key={column.id} draggableId={`column-${column.id}`} index={columnIndex}>
                  {(columnProvided, columnSnapshot) =>
              <div
                ref={columnProvided.innerRef}
                {...columnProvided.draggableProps}
                className={cn("flex flex-col relative flex-shrink-0 mx-[5px] my-[5px]",

                columnSnapshot.isDragging && "z-50"
                )}
                style={{ width: adaptiveColumnWidth, minWidth: adaptiveColumnWidth, maxWidth: adaptiveColumnWidth }}>
                
                      <div {...columnProvided.dragHandleProps}>
                        <KanbanColumnHeader
                    column={column}
                    count={(notizieByStatus[column.key] || []).length}
                    onUpdate={(updates) => updateColumn({ id: column.id, ...updates })}
                    onDelete={() => handleDeleteColumn(column.id, column.key)}
                    onQuickAdd={onQuickAdd ? () => onQuickAdd(column.key as NotiziaStatus) : undefined}
                    isDragging={columnSnapshot.isDragging}
                    isProtected={column.key === PROTECTED_COLUMN_KEY} />
                  
                      </div>
                      
                      <Droppable droppableId={column.key} type="CARD">
                        {(provided, snapshot) =>
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex flex-col gap-1 lg:gap-1 min-h-[80px] max-h-[calc(100vh-220px)] overflow-y-auto rounded-lg p-1 transition-colors",
                      snapshot.isDraggingOver && "bg-accent/20"
                    )}>
                    
                            {(notizieByStatus[column.key] || []).map((notizia, index) =>
                    <Draggable key={notizia.id} draggableId={notizia.id} index={index}>
                                {(provided, snapshot) =>
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={cn(snapshot.isDragging && "scale-105 rotate-1")}>
                        
                                    <Card
                          notizia={notizia}
                          columns={columns}
                          onClick={() => onNotiziaClick(notizia)}
                          onColorChange={(color) => handleColorChange(notizia.id, color)}
                          onEmojiChange={(emoji) => handleEmojiChange(notizia.id, emoji)}
                          onStatusChange={(status) => onStatusChange(notizia.id, status)}
                          onOnlineToggle={(isOnline) => handleOnlineToggle(notizia.id, isOnline)}
                          onTitleFormatChange={(cf) => handleTitleFormatChange(notizia.id, cf)}
                          onDelete={() => {
                            const notiziaSnap = notizia;
                            deleteNotizia.mutate(notizia.id);
                            pushAction({
                              description: `Elimina ${notiziaSnap.name}`,
                              undo: async () => {await addNotizia.mutateAsync({ name: notiziaSnap.name, zona: notiziaSnap.zona, phone: notiziaSnap.phone, type: notiziaSnap.type, notes: notiziaSnap.notes, status: notiziaSnap.status, emoji: notiziaSnap.emoji, card_color: notiziaSnap.card_color, is_online: notiziaSnap.is_online });},
                              redo: async () => {deleteNotizia.mutate(notiziaSnap.id);}
                            });
                          }} />
                        
                                  </div>
                      }
                              </Draggable>
                    )}
                            {provided.placeholder}
                          </div>
                  }
                      </Droppable>
                    </div>
              }
                </Draggable>
            )}
              {provided.placeholder}
              
              <AddColumnButton onAdd={handleAddColumn} width={adaptiveColumnWidth} />
            </div>
          }
        </Droppable>
      </div>
    </DragDropContext>);

});

KanbanBoard.displayName = 'KanbanBoard';

export default KanbanBoard;