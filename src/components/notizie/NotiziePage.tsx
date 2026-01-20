import { useState, useMemo, useRef, useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Search, X } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useNotizie, Notizia, NotiziaStatus } from '@/hooks/useNotizie';
import NotiziaColumn from './NotiziaColumn';
import NotiziaDetail from './NotiziaDetail';
import AddNotiziaDialog from './AddNotiziaDialog';
import { cn } from '@/lib/utils';

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
  const [searchExpanded, setSearchExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleNotiziaClick = (notizia: Notizia) => {
    setSelectedNotizia(notizia);
    setDetailOpen(true);
  };

  // Focus input when expanded
  useEffect(() => {
    if (searchExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchExpanded]);

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

  const handleSearchToggle = () => {
    if (searchExpanded) {
      // Closing - clear search and collapse
      setSearchQuery('');
      setSearchExpanded(false);
    } else {
      // Opening
      setSearchExpanded(true);
    }
  };

  const handleSearchBlur = () => {
    // Only collapse if search is empty
    if (!searchQuery.trim()) {
      setSearchExpanded(false);
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
    <div className="space-y-4 pt-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold shrink-0">Le mie Notizie</h2>
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

      {/* Floating Search Button/Bar */}
      <div className="fixed bottom-24 right-4 z-40">
        <div
          className={cn(
            "flex items-center bg-white/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] transition-all duration-300 ease-out",
            searchExpanded
              ? "w-72 rounded-full px-4 py-3"
              : "w-12 h-12 rounded-full justify-center cursor-pointer active:scale-95"
          )}
          onClick={!searchExpanded ? handleSearchToggle : undefined}
        >
          {searchExpanded ? (
            <>
              <Search className="w-5 h-5 text-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={handleSearchBlur}
                placeholder="Cerca notizie..."
                className="flex-1 bg-transparent border-0 outline-none px-3 text-sm text-foreground placeholder:text-muted-foreground"
              />
              <button
                onClick={handleSearchToggle}
                className="w-6 h-6 flex items-center justify-center rounded-full active:scale-90 transition-transform"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </>
          ) : (
            <Search className="w-5 h-5 text-foreground" />
          )}
        </div>
        
        {/* Active search indicator */}
        {searchQuery && !searchExpanded && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
        )}
      </div>

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
