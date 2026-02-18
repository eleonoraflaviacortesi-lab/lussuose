import { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { Search, X, LayoutGrid, Table2, FileSpreadsheet } from 'lucide-react';
import { useNotizie, Notizia, NotiziaStatus } from '@/hooks/useNotizie';
import NotiziaDetail from './NotiziaDetail';
import AddNotiziaDialog from './AddNotiziaDialog';
import ImportCSVDialog from './ImportCSVDialog';
import NotizieStatsChart from './NotizieStatsChart';
import NotizieSheetView from './NotizieSheetView';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UndoRedoButtons } from '@/components/ui/undo-redo-buttons';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { exportToExcel } from '@/lib/exportExcel';
import { format } from 'date-fns';

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
  const { notizie, notizieByStatus, isLoading, updateNotizia, deleteNotizia, addNotizia } = useNotizie();
  const { pushAction } = useUndoRedo();
  const [selectedNotizia, setSelectedNotizia] = useState<Notizia | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickAddStatus, setQuickAddStatus] = useState<NotiziaStatus | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'sheet'>(() => {
    try { return (localStorage.getItem('notizie-view-mode') as any) || 'kanban'; } catch { return 'kanban'; }
  });

  const handleViewChange = useCallback((mode: 'kanban' | 'sheet') => {
    setViewMode(mode);
    try { localStorage.setItem('notizie-view-mode', mode); } catch {}
  }, []);

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

  const handleSheetUpdate = useCallback((id: string, updates: Partial<Notizia>) => {
    updateNotizia.mutate({ id, ...updates, silent: true } as any);
  }, [updateNotizia]);

  const handleExportExcel = useCallback(async () => {
    const data = notizie || [];
    const today = format(new Date(), 'yyyy-MM-dd');
    await exportToExcel(`notizie_${today}`, [
      { header: 'Nome', key: 'name', width: 30 },
      { header: 'Zona', key: 'zona', width: 20 },
      { header: 'Telefono', key: 'phone', width: 18 },
      { header: 'Tipo', key: 'type', width: 15 },
      { header: 'Stato', key: 'status', width: 15 },
      { header: 'Prezzo Richiesto', key: 'prezzo_richiesto', width: 18 },
      { header: 'Valore', key: 'valore', width: 15 },
      { header: 'Note', key: 'notes', width: 40 },
      { header: 'Online', key: 'is_online', width: 10 },
      { header: 'Creato', key: 'created_at', width: 20 },
    ], data.map(n => ({ ...n, is_online: n.is_online ? 'Sì' : 'No' })));
  }, [notizie]);

  return (
    <div className="space-y-3 pt-3 pb-20 lg:pt-1 lg:pb-4 lg:space-y-2 lg:h-[calc(100vh-100px)] lg:flex lg:flex-col">
      <div className="flex items-center justify-between gap-4 pt-[25px] shadow-none">
        {/* View toggle */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => handleViewChange('kanban')}
          >
            <LayoutGrid className="w-3.5 h-3.5 mr-1" />
            <span className="hidden sm:inline">Kanban</span>
          </Button>
          <Button
            variant={viewMode === 'sheet' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => handleViewChange('sheet')}
          >
            <Table2 className="w-3.5 h-3.5 mr-1" />
            <span className="hidden sm:inline">Spreadsheet</span>
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <UndoRedoButtons />
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportExcel}>
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Excel</span>
          </Button>
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

      {viewMode === 'kanban' && (
        <NotizieStatsChart notizieByStatus={filteredNotizieByStatus} />
      )}

      <div className="lg:flex-1 lg:min-h-0">
        {viewMode === 'kanban' ? (
          isLoading ?
          <BoardSkeleton /> :
          <Suspense fallback={<BoardSkeleton />}>
              <KanbanBoard
              notizieByStatus={filteredNotizieByStatus}
              onNotiziaClick={handleNotiziaClick}
              onStatusChange={handleStatusChange}
              onQuickAdd={handleQuickAdd} />
            </Suspense>
        ) : (
          <NotizieSheetView
            notizie={notizie || []}
            onNotiziaClick={handleNotiziaClick}
            onUpdate={handleSheetUpdate}
            onDelete={(id) => deleteNotizia.mutate(id)}
            onAddNew={() => addNotizia.mutate({ name: '' })}
            searchQuery={searchQuery}
          />
        )}
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
