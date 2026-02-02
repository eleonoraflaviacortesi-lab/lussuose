import { useState, useCallback, useMemo, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Cliente, ClienteStatus, ClienteGroupBy } from '@/types';
import { ClienteCard } from './ClienteCard';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';

interface ClientiKanbanProps {
  clientiGrouped: Map<string, Cliente[]>;
  groupBy: ClienteGroupBy;
  agents: Array<{ user_id: string; full_name: string; avatar_emoji: string | null }>;
  onCardClick: (cliente: Cliente) => void;
  onStatusChange: (clienteId: string, newStatus: ClienteStatus) => void;
  onOrderChange: (items: { id: string; display_order: number; status?: ClienteStatus }[]) => void;
  onColorChange: (clienteId: string, color: string | null) => void;
  onEmojiChange: (clienteId: string, emoji: string | null) => void;
}

// Column definitions for status grouping with hex colors for context menu
const statusColumns: { id: ClienteStatus; label: string; color: string; bgClass: string }[] = [
  { id: 'new', label: 'Nuovi', color: '#f59e0b', bgClass: 'bg-yellow-500' },
  { id: 'contacted', label: 'Contattati', color: '#60a5fa', bgClass: 'bg-blue-400' },
  { id: 'qualified', label: 'Qualificati', color: '#2563eb', bgClass: 'bg-blue-600' },
  { id: 'proposal', label: 'Proposta', color: '#f97316', bgClass: 'bg-orange-500' },
  { id: 'negotiation', label: 'Trattativa', color: '#ef4444', bgClass: 'bg-red-500' },
  { id: 'closed_won', label: 'Chiusi ✓', color: '#22c55e', bgClass: 'bg-green-500' },
  { id: 'closed_lost', label: 'Persi', color: '#6b7280', bgClass: 'bg-gray-500' },
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

// Region column order (common Italian regions)
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
}: ClientiKanbanProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get columns based on groupBy
  const columns = useMemo(() => {
    if (groupBy === 'status') {
      return statusColumns.map(c => ({
        id: c.id,
        label: c.label,
        color: c.bgClass,
        items: clientiGrouped.get(c.id) || [],
      }));
    }

    if (groupBy === 'budget') {
      return budgetColumns.map(range => ({
        id: range,
        label: range,
        color: 'bg-muted',
        items: clientiGrouped.get(range) || [],
      }));
    }

    if (groupBy === 'agente') {
      const agentColumns = agents.map(agent => ({
        id: agent.user_id,
        label: `${agent.avatar_emoji} ${agent.full_name}`,
        color: 'bg-muted',
        items: clientiGrouped.get(agent.user_id) || [],
      }));
      // Add "Non assegnati" column
      agentColumns.unshift({
        id: 'non_assegnato',
        label: 'Non assegnati',
        color: 'bg-amber-500',
        items: clientiGrouped.get('non_assegnato') || [],
      });
      return agentColumns;
    }

    // For regione and tipologia, use dynamic columns from data
    const allKeys = Array.from(clientiGrouped.keys());
    
    // Sort regions by predefined order
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
      color: 'bg-muted',
      items: clientiGrouped.get(key) || [],
    }));
  }, [clientiGrouped, groupBy, agents]);

  // Get agent info for display
  const getAgent = useCallback((agentId: string | null) => {
    if (!agentId) return { name: null, emoji: null };
    const agent = agents.find(a => a.user_id === agentId);
    return agent ? { name: agent.full_name, emoji: agent.avatar_emoji } : { name: null, emoji: null };
  }, [agents]);

  // Status columns for picker
  const statusColumnsForPicker = useMemo(() => 
    statusColumns.map(c => ({ id: c.id, label: c.label, color: c.color })),
  []);
  // Handle drag end
  const handleDragEnd = useCallback((result: DropResult) => {
    const { source, destination, draggableId } = result;
    
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    // Find the dragged item
    let draggedItem: Cliente | undefined;
    for (const items of clientiGrouped.values()) {
      draggedItem = items.find(c => c.id === draggableId);
      if (draggedItem) break;
    }
    if (!draggedItem) return;

    // Build updates
    const updates: { id: string; display_order: number; status?: ClienteStatus }[] = [];
    
    // If groupBy is 'status', we're moving between status columns
    if (groupBy === 'status') {
      const newStatus = destination.droppableId as ClienteStatus;
      
      // Get all items in destination column
      const destItems = [...(clientiGrouped.get(newStatus) || [])];
      
      // If same column, just reorder
      if (source.droppableId === destination.droppableId) {
        const [removed] = destItems.splice(source.index, 1);
        destItems.splice(destination.index, 0, removed);
        
        destItems.forEach((item, idx) => {
          updates.push({ id: item.id, display_order: idx });
        });
      } else {
        // Moving to new column
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
      // For other groupings, just update order within column
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
                {/* Column header - scrolls with column */}
                <div className="flex items-center gap-2 px-2 py-1 mb-2 sticky top-0 bg-inherit z-10">
                  <div className={cn("w-2 h-2 rounded-full", column.color)} />
                  <span className="text-sm font-medium">{column.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {column.items.length}
                  </span>
                </div>
                
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
      </div>
    </DragDropContext>
  );
}

export default ClientiKanban;
