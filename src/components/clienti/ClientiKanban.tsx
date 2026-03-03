import { useState, useCallback, useMemo, useRef, memo, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Cliente, ClienteStatus, ClienteGroupBy } from '@/types';
import { ClienteCard } from './ClienteCard';
import { cn, isDarkColor } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';
import { useClientKanbanColumns, ClientKanbanColumn } from '@/hooks/useClientKanbanColumns';
import { Plus } from 'lucide-react';
import { KanbanColumnHeader } from '@/components/shared/KanbanColumnHeader';

interface ClientiKanbanProps {
  clientiGrouped: Map<string, Cliente[]>;
  groupBy: ClienteGroupBy;
  agents: Array<{ user_id: string; full_name: string; avatar_emoji: string | null }>;
  onCardClick: (cliente: Cliente) => void;
  onStatusChange: (clienteId: string, newStatus: ClienteStatus) => void;
  onOrderChange: (items: { id: string; display_order: number; status?: ClienteStatus }[]) => void;
  onColorChange: (clienteId: string, color: string | null) => void;
  onEmojiChange: (clienteId: string, emoji: string | null) => void;
  onDeleteCliente?: (clienteId: string) => void;
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




export function ClientiKanban({
  clientiGrouped,
  groupBy,
  agents,
  onCardClick,
  onStatusChange,
  onOrderChange,
  onColorChange,
  onEmojiChange,
  onDeleteCliente,
  searchQuery = '',
}: ClientiKanbanProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const { columns: kanbanColumns, updateColumn, deleteColumn, addColumn, isLoading: columnsLoading } = useClientKanbanColumns();

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const update = () => setViewportWidth(container.clientWidth);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(container);
    window.addEventListener('resize', update);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

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
      c.telefono?.includes(query) ||
      c.note_extra?.toLowerCase().includes(query)
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

  const adaptiveColumnWidth = useMemo(() => {
    const totalColumns = Math.max(columns.length + (groupBy === 'status' ? 1 : 0), 1);
    if (!viewportWidth) return 260;

    const gap = 12;
    const availableWidth = Math.max(viewportWidth - gap * (totalColumns - 1) - 8, viewportWidth);
    const idealWidth = Math.floor(availableWidth / totalColumns);

    // Non comprimere il contenuto: box adattata al viewport, scroll interno per colonne in eccesso.
    return Math.max(240, Math.min(280, idealWidth));
  }, [columns.length, groupBy, viewportWidth]);

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
        className="flex gap-3 overflow-x-auto overflow-y-hidden pb-4 bg-card rounded-xl sm:rounded-2xl p-2 sm:p-3 w-full"
      >
        {columns.map(column => (
          <Droppable key={column.id} droppableId={column.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "flex-shrink-0 rounded-xl p-2 min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto",
                  snapshot.isDraggingOver ? "bg-accent/50" : "bg-muted/30"
                )}
                style={{ width: adaptiveColumnWidth, minWidth: adaptiveColumnWidth, maxWidth: adaptiveColumnWidth }}
              >
                {/* Column header */}
                {groupBy === 'status' && 'columnId' in column ? (
                  <KanbanColumnHeader
                    column={kanbanColumns.find(c => c.id === column.columnId)!}
                    count={column.items.length}
                    onUpdate={(updates) => updateColumn({ id: column.columnId as string, ...updates } as any)}
                    onDelete={() => deleteColumn(column.columnId as string)}
                  />
                ) : (
                  <div className="flex items-center gap-2 px-2 py-1 mb-2 sticky top-0 bg-inherit z-10">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: column.color }}
                    />
                    <span className="text-sm font-medium truncate">{column.label}</span>
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
                            onDelete={onDeleteCliente ? () => onDeleteCliente(cliente.id) : undefined}
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
            className="flex-shrink-0 rounded-xl p-4 min-h-[100px] border-2 border-dashed border-muted-foreground/30 flex items-center justify-center gap-2 text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground transition-colors"
            style={{ width: adaptiveColumnWidth, minWidth: adaptiveColumnWidth, maxWidth: adaptiveColumnWidth }}
          >
            <Plus className="w-5 h-5" />
            {adaptiveColumnWidth >= 140 && <span className="text-sm font-medium truncate">Aggiungi colonna</span>}
          </button>
        )}
      </div>
    </DragDropContext>
  );
}

export default ClientiKanban;
