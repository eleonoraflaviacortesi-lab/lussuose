import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Badge } from '@/components/ui/badge';
import { Notizia, NotiziaStatus } from '@/hooks/useNotizie';
import NotiziaCard from './NotiziaCard';
import { cn } from '@/lib/utils';

interface NotiziaColumnProps {
  title: string;
  count: number;
  notizie: Notizia[];
  variant: NotiziaStatus;
  onNotiziaClick: (notizia: Notizia) => void;
}

const variantStyles = {
  new: 'bg-yellow-200 text-yellow-900',
  in_progress: 'bg-yellow-400 text-yellow-950',
  done: 'bg-orange-400 text-orange-950',
  on_shot: 'bg-red-400 text-red-950',
  taken: 'bg-green-200 text-green-900',
};

const titleMap = {
  new: 'NEW!',
  in_progress: 'In progress',
  done: 'Done',
  on_shot: 'On shot',
  taken: 'Taken',
};

const NotiziaColumn = ({ title, count, notizie, variant, onNotiziaClick }: NotiziaColumnProps) => {
  return (
    <div className="flex flex-col min-w-[200px] max-w-[280px]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Badge className={cn('text-xs font-semibold', variantStyles[variant])}>
          {titleMap[variant]}
        </Badge>
        <span className="text-sm text-muted-foreground">{count}</span>
      </div>
      
      {/* Droppable Area */}
      <Droppable droppableId={variant}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex flex-col gap-2 min-h-[100px] rounded-xl p-2 transition-colors",
              snapshot.isDraggingOver && "bg-accent/20"
            )}
          >
            {notizie.map((notizia, index) => (
              <Draggable key={notizia.id} draggableId={notizia.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={cn(
                      "transition-transform",
                      snapshot.isDragging && "scale-105 shadow-xl rotate-1"
                    )}
                  >
                    <NotiziaCard
                      notizia={notizia}
                      onClick={() => onNotiziaClick(notizia)}
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
  );
};

export default NotiziaColumn;
