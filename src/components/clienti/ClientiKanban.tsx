import { useState, useCallback, useMemo, useRef, useEffect, memo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Cliente, ClienteStatus, ClienteGroupBy } from '@/types';
import { ClienteCard } from './ClienteCard';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';
import { useClientKanbanColumns, ClientKanbanColumn } from '@/hooks/useClientKanbanColumns';
import { GripVertical, Trash2, Plus } from 'lucide-react';
import { LiquidGlassColorPicker } from '@/components/ui/liquid-glass-color-picker';

interface ClientiKanbanProps {
  clientiGrouped: Map<string, Cliente[]>;
  groupBy: ClienteGroupBy;
  agents: Array<{ user_id: string; full_name: string; avatar_emoji: string | null }>;
  onCardClick: (cliente: Cliente) => void;
  onStatusChange: (clienteId: string, newStatus: ClienteStatus) => void;
  onOrderChange: (items: { id: string; display_order: number; status?: ClienteStatus }[]) => void;
  onColorChange: (clienteId: string, color: string | null) => void;
  onEmojiChange: (clienteId: string, emoji: string | null) => void;
  searchQuery?: string;
}

// Preset colors for columns
const COLUMN_COLORS = [
  '#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', 
  '#06b6d4', '#ec4899', '#1f2937', '#6b7280', '#84cc16'
];

// Budget ranges for grouping
const budgetColumns = [
  '< €200k',
  '€200k - €400k',
  '€400k - €600k',
  '€600k - €1M',
  '> €1M',
  'Non specificato',
];

// Region column order
const regionOrder = [
  'Tuscany',
  'Umbria',
  'Lazio',
  'Liguria',
  'Emilia-Romagna',
  'Veneto',
  'Lombardia',
  'Piemonte',
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
  isDragging 
}: { 
  column: ClientKanbanColumn;
  count: number;
  onUpdate: (updates: Partial<ClientKanbanColumn>) => void;
  onDelete: () => void;
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
      
      <button
        onClick={onDelete}
        className="ml-auto text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
        title="Elimina colonna"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {/* Color picker dropdown */}
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
            
            {/* Custom color picker */}
            {showCustomPicker && (
              <div className="mt-3 pt-3 border-t border-black/5">
                <LiquidGlassColorPicker
                  color={customColor}
                  onChange={(newColor) => {
                    setCustomColor(newColor);
                    onUpdate({ color: newColor });
                    setShowColorPicker(false);
                    setShowCustomPicker(false);
                  }}
                  onClose={() => setShowCustomPicker(false)}
                  showEyeDropper={true}
                  className="shadow-none p-0 bg-transparent backdrop-blur-none"
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
});
ColumnHeader.displayName = 'ColumnHeader';

export function ClientiKanban({
  clientiGrouped,
  groupBy,
  agents,
  onCardClick,
  onStatusChange,
  onOrderChange,
  onColorChange,
  onEmojiChange,
  searchQuery = '',
}: ClientiKanbanProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { columns: kanbanColumns, updateColumn, deleteColumn, addColumn, isLoading: columnsLoading } = useClientKanbanColumns();

  // Get agent info for display
  const getAgent = useCallback((agentId: string | null) => {
    if (!agentId) return { name: null, emoji: null };
    const agent = agents.find(a => a.user_id === agentId);
    return agent ? { name: agent.full_name, emoji: agent.avatar_emoji } : { name: null, emoji: null };
  }, [agents]);

  // Filter clients by search query
  const filterBySearch = useCallback((clients: Cliente[]) => {
    if (!searchQuery.trim()) return clients;
    const query = searchQuery.toLowerCase();
    return clients.filter(c => 
      c.nome.toLowerCase().includes(query) ||
      c.paese?.toLowerCase().includes(query) ||
      c.regioni.some(r => r.toLowerCase().includes(query)) ||
      c.email?.toLowerCase().includes(query) ||
      c.telefono?.includes(query)
    );
  }, [searchQuery]);

  // Get columns based on groupBy
  const columns = useMemo(() => {
    if (groupBy === 'status') {
      // Use custom kanban columns when grouped by status
      return kanbanColumns.map(c => ({
        id: c.key,
        label: c.label,
        color: c.color,
        columnId: c.id,
        items: filterBySearch(clientiGrouped.get(c.key) || []),
      }));
    }

    if (groupBy === 'budget') {
      return budgetColumns.map(range => ({
        id: range,
        label: range,
        color: '#e5e7eb',
        items: filterBySearch(clientiGrouped.get(range) || []),
      }));
    }

    if (groupBy === 'agente') {
      const agentColumns = agents.map(agent => ({
        id: agent.user_id,
        label: `${agent.avatar_emoji || '👤'} ${agent.full_name}`,
        color: '#e5e7eb',
        items: filterBySearch(clientiGrouped.get(agent.user_id) || []),
      }));
      agentColumns.unshift({
        id: 'non_assegnato',
        label: 'Non assegnati',
        color: '#f59e0b',
        items: filterBySearch(clientiGrouped.get('non_assegnato') || []),
      });
      return agentColumns;
    }

    // For regione and tipologia
    const allKeys = Array.from(clientiGrouped.keys());
    
    if (groupBy === 'regione') {
      allKeys.sort((a, b) => {
        const aIdx = regionOrder.indexOf(a);
        const bIdx = regionOrder.indexOf(b);
        if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
        if (aIdx === -1) return 1;
        if (bIdx === -1) return -1;
        return aIdx - bIdx;
      });
    }

    return allKeys.map(key => ({
      id: key,
      label: key,
      color: '#e5e7eb',
      items: filterBySearch(clientiGrouped.get(key) || []),
    }));
  }, [clientiGrouped, groupBy, agents, kanbanColumns, filterBySearch]);

  // Status columns for picker (from custom columns)
  const statusColumnsForPicker = useMemo(() => 
    kanbanColumns.map(c => ({ id: c.key as ClienteStatus, label: c.label, color: c.color })),
  [kanbanColumns]);

  // Handle drag end
  const handleDragEnd = useCallback((result: DropResult) => {
    const { source, destination, draggableId } = result;
    
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    triggerHaptic('light');

    // Find the dragged item
    let draggedItem: Cliente | undefined;
    for (const items of clientiGrouped.values()) {
      draggedItem = items.find(c => c.id === draggableId);
      if (draggedItem) break;
    }
    if (!draggedItem) return;

    const updates: { id: string; display_order: number; status?: ClienteStatus }[] = [];
    
    if (groupBy === 'status') {
      const newStatus = destination.droppableId as ClienteStatus;
      const destItems = [...(clientiGrouped.get(newStatus) || [])];
      
      if (source.droppableId === destination.droppableId) {
        const [removed] = destItems.splice(source.index, 1);
        destItems.splice(destination.index, 0, removed);
        
        destItems.forEach((item, idx) => {
          updates.push({ id: item.id, display_order: idx });
        });
      } else {
        destItems.splice(destination.index, 0, draggedItem);
        
        destItems.forEach((item, idx) => {
          updates.push({
            id: item.id,
            display_order: idx,
            status: newStatus,
          });
        });
      }
    } else {
      const destItems = [...(clientiGrouped.get(destination.droppableId) || [])];
      
      if (source.droppableId === destination.droppableId) {
        const [removed] = destItems.splice(source.index, 1);
        destItems.splice(destination.index, 0, removed);
      } else {
        destItems.splice(destination.index, 0, draggedItem);
      }
      
      destItems.forEach((item, idx) => {
        updates.push({ id: item.id, display_order: idx });
      });
    }

    if (updates.length > 0) {
      onOrderChange(updates);
    }
  }, [clientiGrouped, groupBy, onOrderChange]);

  const handleAddColumn = async () => {
    const newLabel = `Colonna ${kanbanColumns.length + 1}`;
    const newKey = `custom_${Date.now()}`;
    await addColumn({ key: newKey, label: newLabel, color: '#e5e7eb' });
  };

  if (columnsLoading && groupBy === 'status') {
    return <div className="py-10 text-center text-muted-foreground">Caricamento...</div>;
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div 
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto overflow-y-hidden pb-4"
      >
        {columns.map(column => (
          <Droppable key={column.id} droppableId={column.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "w-[280px] flex-shrink-0 rounded-xl p-2 min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto",
                  snapshot.isDraggingOver ? "bg-accent/50" : "bg-muted/30"
                )}
              >
                {/* Column header */}
                {groupBy === 'status' && 'columnId' in column ? (
                  <ColumnHeader
                    column={kanbanColumns.find(c => c.id === column.columnId)!}
                    count={column.items.length}
                    onUpdate={(updates) => updateColumn({ id: column.columnId as string, ...updates })}
                    onDelete={() => deleteColumn(column.columnId as string)}
                  />
                ) : (
                  <div className="flex items-center gap-2 px-2 py-1 mb-2 sticky top-0 bg-inherit z-10">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: column.color }}
                    />
                    <span className="text-sm font-medium">{column.label}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {column.items.length}
                    </span>
                  </div>
                )}
                
                <div className="space-y-2">
                  {column.items.map((cliente, index) => (
                    <Draggable
                      key={cliente.id}
                      draggableId={cliente.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <ClienteCard
                            cliente={cliente}
                            onClick={() => onCardClick(cliente)}
                            onColorChange={(color) => onColorChange(cliente.id, color)}
                            onEmojiChange={(emoji) => onEmojiChange(cliente.id, emoji)}
                            onStatusChange={(status) => onStatusChange(cliente.id, status)}
                            isDragging={snapshot.isDragging}
                            showAgent={groupBy !== 'agente'}
                            agentName={getAgent(cliente.assigned_to).name}
                            agentEmoji={getAgent(cliente.assigned_to).emoji}
                            statusColumns={statusColumnsForPicker}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                </div>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
        
        {/* Add column button - only for status grouping */}
        {groupBy === 'status' && (
          <button
            onClick={handleAddColumn}
            className="w-[280px] flex-shrink-0 rounded-xl p-4 min-h-[100px] border-2 border-dashed border-muted-foreground/30 flex items-center justify-center gap-2 text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-medium">Aggiungi colonna</span>
          </button>
        )}
      </div>
    </DragDropContext>
  );
}

export default ClientiKanban;
