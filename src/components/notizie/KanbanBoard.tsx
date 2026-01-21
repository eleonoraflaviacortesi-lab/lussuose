import { memo, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Notizia, NotiziaStatus } from '@/hooks/useNotizie';
import { cn } from '@/lib/utils';

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

// Minimal card - full name with word wrap
const Card = memo(({ notizia, onClick }: { notizia: Notizia; onClick: () => void }) => (
  <div
    onClick={onClick}
    className="bg-card rounded-xl p-2.5 cursor-pointer active:scale-[0.98] transition-transform shadow-sm"
  >
    <div className="flex items-start gap-2">
      <span className="text-sm shrink-0">{notizia.emoji || '📋'}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm leading-tight">{notizia.name}</p>
        {notizia.zona && (
          <span className="text-[10px] text-muted-foreground">{notizia.zona}</span>
        )}
      </div>
    </div>
  </div>
));
Card.displayName = 'Card';

const KanbanBoard = memo(({ notizieByStatus, onNotiziaClick, onStatusChange }: KanbanBoardProps) => {
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId as NotiziaStatus;
    onStatusChange(result.draggableId, newStatus);
  }, [onStatusChange]);

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
                          <Card notizia={notizia} onClick={() => onNotiziaClick(notizia)} />
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
