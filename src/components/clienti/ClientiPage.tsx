import { useState, useCallback, useMemo, useEffect } from 'react';
import { isDarkColor } from '@/lib/utils';
import { useClienti } from '@/hooks/useClienti';
import { useAuth } from '@/hooks/useAuth';
import { Cliente, ClienteStatus, ClienteGroupBy, ClienteFilters as Filters } from '@/types';
import { ClientiFilters } from './ClientiFilters';
import { ClientiKanban } from './ClientiKanban';
import { ClientiSheetView } from './ClientiSheetView';
import { ClienteDetail } from './ClienteDetail';
import { AddClienteDialog } from './AddClienteDialog';
import { ImportTallyDialog } from './ImportTallyDialog';
import ClientiStatsChart from './ClientiStatsChart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Loader2, Upload, Search, X, FileSpreadsheet, ArrowUpDown, LayoutGrid, Table, BarChart3 } from 'lucide-react';
import ImportDalilaCSVDialog from './ImportDalilaCSVDialog';
import { ClientiAnalysisModal } from './ClientiAnalysisModal';

// Extract date from note_extra for imported buyers
function getDataRichiestaFromNotes(noteExtra: string | null): string | null {
  if (!noteExtra) return null;
  const match = noteExtra.match(/📅\s*Data richiesta:\s*(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return null;
}

function getEffectiveDate(cliente: Cliente): string | null {
  return cliente.data_submission || getDataRichiestaFromNotes(cliente.note_extra) || null;
}

interface ClientiPageProps {
  initialClienteId?: string | null;
  onClienteOpened?: () => void;
}

export function ClientiPage({ initialClienteId, onClienteOpened }: ClientiPageProps) {
  const { profile } = useAuth();
  const [groupBy, setGroupBy] = useState<ClienteGroupBy>('status');
  const [filters, setFilters] = useState<Filters>({});
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dalilaImportOpen, setDalilaImportOpen] = useState(false);
  const [dateSortDir, setDateSortDir] = useState<'desc' | 'asc' | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'sheet'>('kanban');
  const [analysisOpen, setAnalysisOpen] = useState(false);

  const {
    clienti,
    clientiGrouped,
    agents,
    isLoading,
    createCliente,
    updateCliente,
    deleteCliente,
    assignCliente,
    updateOrder,
    addComment,
    isCreating,
  } = useClienti({ groupBy, filters });

  // Check if user is coordinator/admin
  const isCoordinator = profile?.role === 'coordinatore' || profile?.role === 'admin';

  // Handle opening cliente from notification
  useEffect(() => {
    if (initialClienteId && clienti.length > 0) {
      const cliente = clienti.find(c => c.id === initialClienteId);
      if (cliente) {
        setSelectedCliente(cliente);
        setDetailOpen(true);
        onClienteOpened?.();
      }
    }
  }, [initialClienteId, clienti, onClienteOpened]);

  const handleCardClick = useCallback((cliente: Cliente) => {
    setSelectedCliente(cliente);
    setDetailOpen(true);
  }, []);

  const handleAssignInline = useCallback(async (agentId: string | null) => {
    if (selectedCliente) {
      await assignCliente({ id: selectedCliente.id, agentId });
      setSelectedCliente(prev => prev ? { ...prev, assigned_to: agentId } : null);
    }
  }, [selectedCliente, assignCliente]);

  const handleOrderChange = useCallback(async (
    items: { id: string; display_order: number; status?: ClienteStatus }[]
  ) => {
    await updateOrder(items);
  }, [updateOrder]);

  const handleColorChange = useCallback(async (clienteId: string, color: string | null) => {
    const autoTextColor = color ? (isDarkColor(color) ? '#ffffff' : '#000000') : null;
    await updateCliente({ id: clienteId, card_color: color, row_bg_color: color, row_text_color: autoTextColor });
  }, [updateCliente]);

  const handleEmojiChange = useCallback(async (clienteId: string, emoji: string) => {
    await updateCliente({ id: clienteId, emoji });
  }, [updateCliente]);


  const handleAddComment = useCallback(async (comment: string) => {
    if (selectedCliente) {
      await addComment({ id: selectedCliente.id, comment });
      // Refresh selected cliente
      const updated = clienti.find(c => c.id === selectedCliente.id);
      if (updated) setSelectedCliente(updated);
    }
  }, [selectedCliente, addComment, clienti]);

  const handleDelete = useCallback(async () => {
    if (selectedCliente) {
      await deleteCliente(selectedCliente.id);
      setDetailOpen(false);
      setSelectedCliente(null);
    }
  }, [selectedCliente, deleteCliente]);

  // Agents see only assigned clients, coordinators see all
  const displayClients = isCoordinator 
    ? clienti 
    : clienti.filter(c => c.assigned_to === profile?.user_id);

  // Create grouped data for display (for agents, use only their clients)
  const displayGrouped = useMemo(() => {
    if (isCoordinator) return clientiGrouped;
    
    // Group display clients by status for agents
    const groups = new Map<string, Cliente[]>();
    displayClients.forEach(cliente => {
      const key = cliente.status;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(cliente);
    });
    return groups;
  }, [isCoordinator, clientiGrouped, displayClients]);

  // Apply date sorting within groups if active
  const sortedGrouped = useMemo(() => {
    if (!dateSortDir) return displayGrouped;
    
    const sorted = new Map<string, Cliente[]>();
    displayGrouped.forEach((clients, key) => {
      const sortedClients = [...clients].sort((a, b) => {
        const dateA = getEffectiveDate(a);
        const dateB = getEffectiveDate(b);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateSortDir === 'desc'
          ? dateB.localeCompare(dateA)
          : dateA.localeCompare(dateB);
      });
      sorted.set(key, sortedClients);
    });
    return sorted;
  }, [displayGrouped, dateSortDir]);

  if (isLoading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="py-4 space-y-4 overflow-x-hidden">
      {/* Header row: view toggle + actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* View toggle */}
        <div className="flex rounded-lg border overflow-hidden">
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-none gap-1 sm:gap-1.5 px-2.5 sm:px-4"
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Kanban</span>
          </Button>
          <Button
            variant={viewMode === 'sheet' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-none gap-1 sm:gap-1.5 px-2.5 sm:px-4"
            onClick={() => setViewMode('sheet')}
          >
            <Table className="w-4 h-4" />
            <span className="hidden sm:inline">Spreadsheet</span>
          </Button>
        </div>

        <div className="flex-1" />

        {isCoordinator && (
          <Button variant="outline" size="icon" onClick={() => setAnalysisOpen(true)} className="w-9 h-9 sm:w-auto sm:h-9 sm:px-3 sm:gap-1.5">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Analisi</span>
          </Button>
        )}
        {isCoordinator && (
          <Button variant="outline" size="icon" onClick={() => setImportDialogOpen(true)} className="w-9 h-9 sm:w-auto sm:h-9 sm:px-3 sm:gap-1.5">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">CSV</span>
          </Button>
        )}
        <Button onClick={() => setAddDialogOpen(true)} className="rounded-full w-9 h-9 p-0">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Stats Chart - only for coordinators */}
      {isCoordinator && <ClientiStatsChart clienti={clienti} />}

      {/* Filters - only for coordinators */}
      {isCoordinator && (
        <ClientiFilters
groupBy={groupBy}
          onGroupByChange={setGroupBy}
          filters={filters}
          onFiltersChange={setFilters}
          totalCount={clienti.length}
          filteredCount={displayClients.length}
          clienti={clienti}
          dateSortDir={dateSortDir}
          onDateSortChange={() => {
            setDateSortDir(prev => 
              prev === null ? 'desc' : prev === 'desc' ? 'asc' : null
            );
          }}
        />
      )}

      {/* Date Sort - only when not coordinator (coordinators have it in filters) */}
      {!isCoordinator && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cerca per nome, paese, regione, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <Button
            variant={dateSortDir ? 'default' : 'outline'}
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={() => {
              setDateSortDir(prev => 
                prev === null ? 'desc' : prev === 'desc' ? 'asc' : null
              );
            }}
          >
            <ArrowUpDown className="w-4 h-4" />
            <span className="hidden sm:inline">
              {dateSortDir === 'desc' ? 'Recenti ↓' : dateSortDir === 'asc' ? 'Vecchi ↓' : 'Data'}
            </span>
          </Button>
        </div>
      )}

      {/* Board */}
      {viewMode === 'kanban' ? (
        <ClientiKanban
          clientiGrouped={sortedGrouped}
          groupBy={isCoordinator ? groupBy : 'status'}
          agents={agents}
          onCardClick={handleCardClick}
          onStatusChange={async (clienteId, status) => {
            await updateCliente({ id: clienteId, status });
          }}
          onOrderChange={handleOrderChange}
          onColorChange={handleColorChange}
          onEmojiChange={handleEmojiChange}
          searchQuery={isCoordinator ? (filters.search || '') : searchQuery}
        />
      ) : (
        <ClientiSheetView
          clienti={dateSortDir ? [...displayClients].sort((a, b) => {
            const dateA = getEffectiveDate(a);
            const dateB = getEffectiveDate(b);
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            return dateSortDir === 'desc' ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
          }) : displayClients}
          agents={agents}
          onCardClick={handleCardClick}
          onUpdate={async (id, updates) => {
            await updateCliente({ id, ...updates });
          }}
          searchQuery={isCoordinator ? (filters.search || '') : searchQuery}
          onAddNew={async () => {
            const today = new Date().toISOString().split('T')[0];
            await createCliente({ nome: '', data_submission: today });
          }}
        />
      )}

      {/* Detail Modal */}
      <ClienteDetail
        cliente={selectedCliente}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        agents={agents}
        onAssign={handleAssignInline}
        onAddComment={handleAddComment}
        onDelete={handleDelete}
        onUpdate={async (updates) => {
          if (selectedCliente) {
            await updateCliente({ id: selectedCliente.id, ...updates });
          }
        }}
        allClienti={clienti}
      />

      {/* Add Dialog */}
      <AddClienteDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={async (data) => { await createCliente(data); }}
        agents={agents}
        isLoading={isCreating}
      />

      {/* Import Dialog */}
      <ImportTallyDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={() => {
          setImportDialogOpen(false);
        }}
      />

      {/* Dalila CSV Import Dialog */}
      <ImportDalilaCSVDialog
        open={dalilaImportOpen}
        onOpenChange={setDalilaImportOpen}
      />

      {/* Analysis Modal */}
      <ClientiAnalysisModal
        open={analysisOpen}
        onOpenChange={setAnalysisOpen}
        clienti={clienti}
      />
    </div>
  );
}

export default ClientiPage;
