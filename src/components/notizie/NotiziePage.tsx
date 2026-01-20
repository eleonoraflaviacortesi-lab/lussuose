import { useState, useMemo } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Search, X } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useNotizie, Notizia, NotiziaStatus } from '@/hooks/useNotizie';
import NotiziaColumn from './NotiziaColumn';
import NotiziaDetail from './NotiziaDetail';
import AddNotiziaDialog from './AddNotiziaDialog';

const columns: { key: NotiziaStatus; title: string }[] = [
  { key: 'new', title: 'NEW!' },
  { key: 'in_progress', title: 'In progress' },
  { key: 'done', title: 'Done' },
  { key: 'on_shot', title: 'On shot' },
  { key: 'taken', title: 'Taken' },
];

const NotiziePage = () => {
  const { notizie, notizieByStatus, isLoading, updateNotizia } = useNotizie();
  const [selectedNotizia, setSelectedNotizia] = useState<Notizia | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleNotiziaClick = (notizia: Notizia) => {
    setSelectedNotizia(notizia);
    setDetailOpen(true);
  };

  // Filtra le notizie per ricerca
  const filteredNotizieByStatus = useMemo(() => {
    if (!searchQuery.trim()) {
      return notizieByStatus;
    }

    const query = searchQuery.toLowerCase();
    const filterNotizie = (list: Notizia[]) =>
      list.filter(
        (n) =>
          n.name.toLowerCase().includes(query) ||
          n.zona?.toLowerCase().includes(query) ||
          n.type?.toLowerCase().includes(query) ||
          n.notes?.toLowerCase().includes(query)
      );

    return {
      new: filterNotizie(notizieByStatus.new),
      in_progress: filterNotizie(notizieByStatus.in_progress),
      done: filterNotizie(notizieByStatus.done),
      on_shot: filterNotizie(notizieByStatus.on_shot),
      taken: filterNotizie(notizieByStatus.taken),
    };
  }, [notizieByStatus, searchQuery]);

  // Gestisce il drag & drop
  const handleDragEnd = (result: DropResult) => {
    const { destination, draggableId } = result;

    if (!destination) return;

    const newStatus = destination.droppableId as NotiziaStatus;
    const notizia = notizie?.find((n) => n.id === draggableId);

    if (notizia && notizia.status !== newStatus) {
      updateNotizia.mutate({
        id: draggableId,
        status: newStatus,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold shrink-0">Le mie Notizie</h2>
        
        {/* Search Bar */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca notizie..."
            className="pl-9 pr-8 bg-muted/30 border-muted/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full active:scale-95 transition-transform"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
        
        <AddNotiziaDialog />
      </div>

      {/* Kanban Board with Drag & Drop */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4 min-w-max">
            {columns.map((column) => (
              <NotiziaColumn
                key={column.key}
                title={column.title}
                count={filteredNotizieByStatus[column.key].length}
                notizie={filteredNotizieByStatus[column.key]}
                variant={column.key}
                onNotiziaClick={handleNotiziaClick}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DragDropContext>

      {/* Detail Modal */}
      <NotiziaDetail
        notizia={selectedNotizia}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
};

export default NotiziePage;
