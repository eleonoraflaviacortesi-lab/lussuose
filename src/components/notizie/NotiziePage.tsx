import { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { Search, X } from 'lucide-react';
import { useNotizie, Notizia, NotiziaStatus } from '@/hooks/useNotizie';
import NotiziaDetail from './NotiziaDetail';
import AddNotiziaDialog from './AddNotiziaDialog';
import ImportCSVDialog from './ImportCSVDialog';
import ImportDalilaDialog from './ImportDalilaDialog';
import NotizieStatsChart from './NotizieStatsChart';
import { Input } from '@/components/ui/input';
import { UndoRedoButtons } from '@/components/ui/undo-redo-buttons';
import { useUndoRedo } from '@/hooks/useUndoRedo';

// Lazy load drag-drop board for faster initial render
const KanbanBoard = lazy(() => import('./KanbanBoard'));

const columns: NotiziaStatus[] = ['new', 'in_progress', 'done', 'on_shot', 'taken', 'no', 'sold'];

// Ultra-light skeleton
const BoardSkeleton = () =>
<div className="flex gap-4 pb-4 overflow-x-auto">
    {columns.map((key) =>
  <div key={key} className="flex flex-col min-w-[200px] animate-pulse">
        <div className="h-5 w-16 bg-muted rounded-md mb-3" />
        <div className="flex flex-col gap-2">
          <div className="bg-muted rounded-xl h-14" />
          <div className="bg-muted rounded-xl h-14" />
        </div>
      </div>
  )}
  </div>;


const NotiziePage = () => {
  const { notizie, notizieByStatus, isLoading, updateNotizia } = useNotizie();
  const { pushAction } = useUndoRedo();
  const [selectedNotizia, setSelectedNotizia] = useState<Notizia | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickAddStatus, setQuickAddStatus] = useState<NotiziaStatus | null>(null);

  const handleNotiziaClick = useCallback((notizia: Notizia) => {
    setSelectedNotizia(notizia);
    setDetailOpen(true);
  }, []);

  const handleQuickAdd = useCallback((status: NotiziaStatus) => {
    setQuickAddStatus(status);
  }, []);

  const filteredNotizieByStatus = useMemo(() => {
    if (!searchQuery.trim()) return notizieByStatus;

    const q = searchQuery.toLowerCase();
    const filter = (list: Notizia[]) =>
    list.filter((n) =>
    n.name.toLowerCase().includes(q) ||
    n.zona?.toLowerCase().includes(q)
    );

    // Filter all status groups dynamically
    const filtered: Record<string, Notizia[]> = {};
    Object.keys(notizieByStatus).forEach((key) => {
      filtered[key] = filter(notizieByStatus[key] || []);
    });
    return filtered;
  }, [notizieByStatus, searchQuery]);

  const handleStatusChange = useCallback((id: string, newStatus: NotiziaStatus) => {
    const old = (notizie || []).find((n) => n.id === id);
    const oldStatus = old?.status;
    updateNotizia.mutate({ id, status: newStatus, silent: true });
    if (old && oldStatus) {
      pushAction({
        description: `Stato ${old.name}`,
        undo: () => {updateNotizia.mutate({ id, status: oldStatus, silent: true });return Promise.resolve();},
        redo: () => {updateNotizia.mutate({ id, status: newStatus, silent: true });return Promise.resolve();}
      });
    }
  }, [updateNotizia, notizie, pushAction]);

  return (
    <div className="space-y-3 pt-3 pb-20 lg:pt-1 lg:pb-4 lg:space-y-2 lg:h-[calc(100vh-100px)] lg:flex lg:flex-col">
      <div className="flex items-center justify-between gap-4 pt-[25px] shadow-none">
        
        <div className="flex items-center gap-2">
          <UndoRedoButtons />
          <ImportDalilaDialog />
          <ImportCSVDialog />
          <AddNotiziaDialog />
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Cerca per nome o zona..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9" />

        {searchQuery &&
        <button
          onClick={() => setSearchQuery('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted">

            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        }
      </div>

      <NotizieStatsChart notizieByStatus={filteredNotizieByStatus} />

      <div className="lg:flex-1 lg:min-h-0">
        {isLoading ?
        <BoardSkeleton /> :

        <Suspense fallback={<BoardSkeleton />}>
            <KanbanBoard
            notizieByStatus={filteredNotizieByStatus}
            onNotiziaClick={handleNotiziaClick}
            onStatusChange={handleStatusChange}
            onQuickAdd={handleQuickAdd} />

          </Suspense>
        }
      </div>

      <NotiziaDetail notizia={selectedNotizia} open={detailOpen} onOpenChange={setDetailOpen} />
      
      {/* Quick Add Dialog */}
      {quickAddStatus &&
      <AddNotiziaDialog
        defaultStatus={quickAddStatus}
        open={true}
        onOpenChange={(open) => !open && setQuickAddStatus(null)}
        showTrigger={false} />

      }
    </div>);

};

export default NotiziePage;