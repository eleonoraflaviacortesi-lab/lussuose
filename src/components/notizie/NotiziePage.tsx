import { useState, useMemo, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import { Search, X } from 'lucide-react';
import { useNotizie, Notizia, NotiziaStatus } from '@/hooks/useNotizie';
import NotiziaDetail from './NotiziaDetail';
import AddNotiziaDialog from './AddNotiziaDialog';
import ImportCSVDialog from './ImportCSVDialog';
import NotizieStatsChart from './NotizieStatsChart';
import { cn } from '@/lib/utils';

// Lazy load drag-drop board for faster initial render
const KanbanBoard = lazy(() => import('./KanbanBoard'));

const columns: NotiziaStatus[] = ['new', 'in_progress', 'done', 'on_shot', 'taken', 'no', 'sold'];

// Ultra-light skeleton
const BoardSkeleton = () => (
  <div className="flex gap-4 pb-4 overflow-x-auto">
    {columns.map((key) => (
      <div key={key} className="flex flex-col min-w-[200px] animate-pulse">
        <div className="h-5 w-16 bg-muted rounded-md mb-3" />
        <div className="flex flex-col gap-2">
          <div className="bg-muted rounded-xl h-14" />
          <div className="bg-muted rounded-xl h-14" />
        </div>
      </div>
    ))}
  </div>
);

const NotiziePage = () => {
  const { notizie, notizieByStatus, isLoading, updateNotizia } = useNotizie();
  const [selectedNotizia, setSelectedNotizia] = useState<Notizia | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [quickAddStatus, setQuickAddStatus] = useState<NotiziaStatus | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleNotiziaClick = useCallback((notizia: Notizia) => {
    setSelectedNotizia(notizia);
    setDetailOpen(true);
  }, []);

  const handleQuickAdd = useCallback((status: NotiziaStatus) => {
    setQuickAddStatus(status);
  }, []);

  useEffect(() => {
    if (searchExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchExpanded]);

  const filteredNotizieByStatus = useMemo(() => {
    if (!searchQuery.trim()) return notizieByStatus;

    const q = searchQuery.toLowerCase();
    const filter = (list: Notizia[]) =>
      list.filter(n =>
        n.name.toLowerCase().includes(q) ||
        n.zona?.toLowerCase().includes(q)
      );

    // Filter all status groups dynamically
    const filtered: Record<string, Notizia[]> = {};
    Object.keys(notizieByStatus).forEach(key => {
      filtered[key] = filter(notizieByStatus[key] || []);
    });
    return filtered;
  }, [notizieByStatus, searchQuery]);

  const handleStatusChange = useCallback((id: string, newStatus: NotiziaStatus) => {
    updateNotizia.mutate({ id, status: newStatus, silent: true });
  }, [updateNotizia]);

  return (
    <div className="space-y-4 pt-4 pb-20 lg:pt-2 lg:pb-6 lg:h-[calc(100vh-140px)] lg:flex lg:flex-col">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold shrink-0">Le mie Notizie</h2>
        <div className="flex items-center gap-2">
          <ImportCSVDialog />
          <AddNotiziaDialog />
        </div>
      </div>

      <NotizieStatsChart notizieByStatus={filteredNotizieByStatus} />

      <div className="lg:flex-1 lg:min-h-0">
        {isLoading ? (
          <BoardSkeleton />
        ) : (
          <Suspense fallback={<BoardSkeleton />}>
            <KanbanBoard
              notizieByStatus={filteredNotizieByStatus}
              onNotiziaClick={handleNotiziaClick}
              onStatusChange={handleStatusChange}
              onQuickAdd={handleQuickAdd}
            />
          </Suspense>
        )}
      </div>

      {/* Floating Search */}
      <div className="fixed bottom-24 right-4 z-40">
        <div
          className={cn(
            "flex items-center bg-white/90 backdrop-blur-xl shadow-lg transition-all duration-200",
            searchExpanded ? "w-64 rounded-full px-4 py-2.5" : "w-11 h-11 rounded-full justify-center cursor-pointer active:scale-95"
          )}
          onClick={!searchExpanded ? () => setSearchExpanded(true) : undefined}
        >
          {searchExpanded ? (
            <>
              <Search className="w-4 h-4 text-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => !searchQuery && setSearchExpanded(false)}
                placeholder="Cerca..."
                className="flex-1 bg-transparent border-0 outline-none px-2 text-sm"
              />
              <button onClick={() => { setSearchQuery(''); setSearchExpanded(false); }} className="p-1">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </>
          ) : (
            <Search className="w-5 h-5 text-foreground" />
          )}
        </div>
        {searchQuery && !searchExpanded && (
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full" />
        )}
      </div>

      <NotiziaDetail notizia={selectedNotizia} open={detailOpen} onOpenChange={setDetailOpen} />
      
      {/* Quick Add Dialog */}
      {quickAddStatus && (
        <AddNotiziaDialog
          defaultStatus={quickAddStatus}
          open={true}
          onOpenChange={(open) => !open && setQuickAddStatus(null)}
          showTrigger={false}
        />
      )}
    </div>
  );
};

export default NotiziePage;
