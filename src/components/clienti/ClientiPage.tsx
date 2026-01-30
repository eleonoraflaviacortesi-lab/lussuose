import { useState, useCallback, useMemo, useEffect } from 'react';
import { useClienti } from '@/hooks/useClienti';
import { useAuth } from '@/hooks/useAuth';
import { Cliente, ClienteStatus, ClienteGroupBy, ClienteFilters as Filters } from '@/types';
import { ClientiFilters } from './ClientiFilters';
import { ClientiKanban } from './ClientiKanban';
import { ClienteDetail } from './ClienteDetail';
import { AddClienteDialog } from './AddClienteDialog';
import { ImportTallyDialog } from './ImportTallyDialog';
import ClientiStatsChart from './ClientiStatsChart';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Upload } from 'lucide-react';

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
    await updateCliente({ id: clienteId, card_color: color });
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

  if (isLoading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="py-4 space-y-4 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isCoordinator ? '✱' : 'ASSIGNED BUYERS'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isCoordinator 
              ? 'Gestisci i clienti internazionali in cerca di immobili'
              : `${displayClients.length} clienti assegnati a te`}
          </p>
        </div>
        {isCoordinator && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <Upload className="w-4 h-4 mr-1.5" />
              CSV
            </Button>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}
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
        />
      )}

      {/* Kanban Board */}
      <ClientiKanban
        clientiGrouped={displayGrouped}
        groupBy={isCoordinator ? groupBy : 'status'}
        agents={agents}
        onCardClick={handleCardClick}
        onStatusChange={async (clienteId, status) => {
          await updateCliente({ id: clienteId, status });
        }}
        onOrderChange={handleOrderChange}
        onColorChange={handleColorChange}
        onEmojiChange={handleEmojiChange}
      />

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
    </div>
  );
}

export default ClientiPage;
