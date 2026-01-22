import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Cliente, ClienteStatus, ClienteGroupBy } from '@/types';
import { ClienteCard } from './ClienteCard';
import { cn } from '@/lib/utils';

interface ClientiKanbanProps {
  clientiGrouped: Map<string, Cliente[]>;
  groupBy: ClienteGroupBy;
  agents: Array<{ user_id: string; full_name: string; avatar_emoji: string }>;
  onCardClick: (cliente: Cliente) => void;
  onStatusChange: (clienteId: string, newStatus: ClienteStatus) => void;
  onOrderChange: (items: { id: string; display_order: number; status?: ClienteStatus }[]) => void;
  onColorChange: (clienteId: string, color: string | null) => void;
  onEmojiChange: (clienteId: string, emoji: string) => void;
}

// Column definitions for status grouping
const statusColumns: { id: ClienteStatus; label: string; color: string }[] = [
  { id: 'new', label: 'Nuovi', color: 'bg-yellow-500' },
  { id: 'contacted', label: 'Contattati', color: 'bg-blue-400' },
  { id: 'qualified', label: 'Qualificati', color: 'bg-blue-600' },
  { id: 'proposal', label: 'Proposta', color: 'bg-orange-500' },
  { id: 'negotiation', label: 'Trattativa', color: 'bg-red-500' },
  { id: 'closed_won', label: 'Chiusi ✓', color: 'bg-green-500' },
  { id: 'closed_lost', label: 'Persi', color: 'bg-gray-500' },
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
  const headerRef = useRef<HTMLDivElement>(null);

  // Sync horizontal scroll between header and content
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    const header = headerRef.current;
    if (!scrollContainer || !header) return;

    const handleScroll = () => {
      header.scrollLeft = scrollContainer.scrollLeft;
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Get columns based on groupBy
  const columns = useMemo(() => {
    if (groupBy === 'status') {
      return statusColumns.map(c => ({
        id: c.id,
        label: c.label,
        color: c.color,
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

  // Get agent name for display
  const getAgentName = useCallback((agentId: string | null) => {
    if (!agentId) return null;
    const agent = agents.find(a => a.user_id === agentId);
    return agent ? agent.full_name : null;
  }, [agents]);

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
      <div className="flex flex-col h-full">
        {/* Fixed header */}
        <div 
          ref={headerRef}
          className="flex gap-3 pb-2 overflow-x-hidden"
          style={{ minWidth: 'max-content' }}
        >
          {columns.map(column => (
            <div 
              key={column.id} 
              className="w-[280px] flex-shrink-0"
            >
              <div className="flex items-center gap-2 px-2 py-1">
                <div className={cn("w-2 h-2 rounded-full", column.color)} />
                <span className="text-sm font-medium">{column.label}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {column.items.length}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Scrollable content */}
        <div 
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto overflow-y-hidden flex-1 pb-4"
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
                              isDragging={snapshot.isDragging}
                              showAgent={groupBy !== 'agente'}
                              agentName={getAgentName(cliente.assigned_to)}
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
      </div>
    </DragDropContext>
  );
}

export default ClientiKanban;
