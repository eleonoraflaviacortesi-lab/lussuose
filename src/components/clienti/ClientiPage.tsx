import { useState, useCallback } from 'react';
import { useClienti } from '@/hooks/useClienti';
import { useAuth } from '@/hooks/useAuth';
import { Cliente, ClienteStatus, ClienteGroupBy, ClienteFilters as Filters } from '@/types';
import { ClientiFilters } from './ClientiFilters';
import { ClientiKanban } from './ClientiKanban';
import { ClienteDetail } from './ClienteDetail';
import { AddClienteDialog } from './AddClienteDialog';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';

export function ClientiPage() {
  const { profile } = useAuth();
  const [groupBy, setGroupBy] = useState<ClienteGroupBy>('status');
  const [filters, setFilters] = useState<Filters>({});
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

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

  const handleCardClick = useCallback((cliente: Cliente) => {
    setSelectedCliente(cliente);
    setDetailOpen(true);
  }, []);

  const handleStatusChange = useCallback(async (clienteId: string, newStatus: ClienteStatus) => {
    await updateCliente({ id: clienteId, status: newStatus });
    // Update local state
    if (selectedCliente?.id === clienteId) {
      setSelectedCliente(prev => prev ? { ...prev, status: newStatus } : null);
    }
  }, [updateCliente, selectedCliente]);

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

  const handleAssign = useCallback(async (agentId: string | null) => {
    if (selectedCliente) {
      await assignCliente({ id: selectedCliente.id, agentId });
      setSelectedCliente(prev => prev ? { ...prev, assigned_to: agentId } : null);
    }
  }, [selectedCliente, assignCliente]);

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

  if (!isCoordinator) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <p>Solo i coordinatori possono accedere a questa sezione.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clienti Acquirenti</h1>
          <p className="text-sm text-muted-foreground">
            Gestisci i clienti internazionali in cerca di immobili
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Aggiungi
        </Button>
      </div>

      {/* Filters */}
      <ClientiFilters
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        filters={filters}
        onFiltersChange={setFilters}
        totalCount={clienti.length}
        filteredCount={clienti.length}
      />

      {/* Kanban Board */}
      <ClientiKanban
        clientiGrouped={clientiGrouped}
        groupBy={groupBy}
        agents={agents}
        onCardClick={handleCardClick}
        onStatusChange={handleStatusChange}
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
        onStatusChange={(status) => selectedCliente && handleStatusChange(selectedCliente.id, status)}
        onAssign={handleAssign}
        onAddComment={handleAddComment}
        onDelete={handleDelete}
      />

      {/* Add Dialog */}
      <AddClienteDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={async (data) => { await createCliente(data); }}
        isLoading={isCreating}
      />
    </div>
  );
}

export default ClientiPage;
