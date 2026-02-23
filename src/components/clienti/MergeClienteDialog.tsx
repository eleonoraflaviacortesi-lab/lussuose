import { useState, useMemo } from 'react';
import { Cliente } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Merge, Check, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface MergeClienteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: Cliente;
  allClienti: Cliente[];
  onMerged: () => void;
  tallyOnly?: boolean;
}

export function MergeClienteDialog({ open, onOpenChange, cliente, allClienti, onMerged, tallyOnly = false }: MergeClienteDialogProps) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [merging, setMerging] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Find potential duplicates - same phone, email, or name
  const candidates = useMemo(() => {
    return allClienti
      .filter(c => {
        if (c.id === cliente.id) return false;
        // If tallyOnly, only show TALLY submissions
        if (tallyOnly && c.portale !== 'TALLY') return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            c.nome.toLowerCase().includes(q) ||
            c.cognome?.toLowerCase().includes(q) ||
            c.telefono?.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q) ||
            c.portale?.toLowerCase().includes(q)
          );
        }
        // If tallyOnly, show all TALLY submissions (already filtered above)
        if (tallyOnly) return true;
        // Auto-suggest: same phone or email
        const samePhone = cliente.telefono && c.telefono && 
          c.telefono.replace(/\s/g, '') === cliente.telefono.replace(/\s/g, '');
        const sameEmail = cliente.email && c.email &&
          c.email.toLowerCase() === cliente.email.toLowerCase();
        const sameName = c.nome.toLowerCase() === cliente.nome.toLowerCase() &&
          c.cognome?.toLowerCase() === cliente.cognome?.toLowerCase();
        return samePhone || sameEmail || sameName;
      })
      .sort((a, b) => {
        // Prioritize Tally submissions
        if (a.portale === 'TALLY' && b.portale !== 'TALLY') return -1;
        if (b.portale === 'TALLY' && a.portale !== 'TALLY') return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [allClienti, cliente, search, tallyOnly]);

  const selectedCliente = candidates.find(c => c.id === selectedId);

  const handleMerge = async () => {
    if (!selectedCliente) return;
    setMerging(true);

    try {
      // The current cliente absorbs the selected one's data
      // Merge strategy: keep current cliente's data, fill in blanks from selected
      const mergedData: Record<string, unknown> = {};
      
      // Fill missing fields from the duplicate
      if (!cliente.cognome && selectedCliente.cognome) mergedData.cognome = selectedCliente.cognome;
      if (!cliente.telefono && selectedCliente.telefono) mergedData.telefono = selectedCliente.telefono;
      if (!cliente.email && selectedCliente.email) mergedData.email = selectedCliente.email;
      if (!cliente.paese && selectedCliente.paese) mergedData.paese = selectedCliente.paese;
      if (!cliente.lingua && selectedCliente.lingua) mergedData.lingua = selectedCliente.lingua;
      if (!cliente.budget_max && selectedCliente.budget_max) mergedData.budget_max = selectedCliente.budget_max;
      if (!cliente.mutuo && selectedCliente.mutuo) mergedData.mutuo = selectedCliente.mutuo;
      if (!cliente.tempo_ricerca && selectedCliente.tempo_ricerca) mergedData.tempo_ricerca = selectedCliente.tempo_ricerca;
      if (!cliente.stile && selectedCliente.stile) mergedData.stile = selectedCliente.stile;
      if (!cliente.camere && selectedCliente.camere) mergedData.camere = selectedCliente.camere;
      if (!cliente.piscina && selectedCliente.piscina) mergedData.piscina = selectedCliente.piscina;
      if (!cliente.terreno && selectedCliente.terreno) mergedData.terreno = selectedCliente.terreno;
      if (!cliente.dependance && selectedCliente.dependance) mergedData.dependance = selectedCliente.dependance;
      if (!cliente.uso && selectedCliente.uso) mergedData.uso = selectedCliente.uso;
      if (!cliente.interesse_affitto && selectedCliente.interesse_affitto) mergedData.interesse_affitto = selectedCliente.interesse_affitto;
      if (!cliente.portale && selectedCliente.portale) mergedData.portale = selectedCliente.portale;
      if (!cliente.property_name && selectedCliente.property_name) mergedData.property_name = selectedCliente.property_name;
      if (!cliente.ref_number && selectedCliente.ref_number) mergedData.ref_number = selectedCliente.ref_number;
      if (!cliente.contattato_da && selectedCliente.contattato_da) mergedData.contattato_da = selectedCliente.contattato_da;
      if (!cliente.tipo_contatto && selectedCliente.tipo_contatto) mergedData.tipo_contatto = selectedCliente.tipo_contatto;
      if (!cliente.descrizione && selectedCliente.descrizione) mergedData.descrizione = selectedCliente.descrizione;
      if (!cliente.dimensioni_min && selectedCliente.dimensioni_min) mergedData.dimensioni_min = selectedCliente.dimensioni_min;
      if (!cliente.dimensioni_max && selectedCliente.dimensioni_max) mergedData.dimensioni_max = selectedCliente.dimensioni_max;
      if (!cliente.layout && selectedCliente.layout) mergedData.layout = selectedCliente.layout;
      if (!cliente.bagni && selectedCliente.bagni) mergedData.bagni = selectedCliente.bagni;

      // Merge arrays (union)
      if (selectedCliente.regioni?.length) {
        mergedData.regioni = [...new Set([...cliente.regioni, ...selectedCliente.regioni])];
      }
      if (selectedCliente.tipologia?.length) {
        mergedData.tipologia = [...new Set([...cliente.tipologia, ...selectedCliente.tipologia])];
      }
      if (selectedCliente.contesto?.length) {
        mergedData.contesto = [...new Set([...cliente.contesto, ...selectedCliente.contesto])];
      }
      if (selectedCliente.motivo_zona?.length) {
        mergedData.motivo_zona = [...new Set([...(cliente.motivo_zona || []), ...selectedCliente.motivo_zona])];
      }

      // Merge comments
      const mergedComments = [...(cliente.comments || []), ...(selectedCliente.comments || [])];
      mergedData.comments = mergedComments;

      // Append note about merge
      const mergeNote = `\n\n🔗 Unito con richiesta "${selectedCliente.nome}" (${selectedCliente.portale || 'N/A'}) del ${selectedCliente.data_submission ? format(new Date(selectedCliente.data_submission), 'dd/MM/yyyy', { locale: it }) : 'N/A'}`;
      mergedData.note_extra = (cliente.note_extra || '') + mergeNote;

      // Update current cliente
      if (Object.keys(mergedData).length > 0) {
        const { error: updateError } = await supabase
          .from('clienti')
          .update(mergedData)
          .eq('id', cliente.id);
        if (updateError) throw updateError;
      }

      // Move activities from duplicate to current
      await supabase
        .from('cliente_activities')
        .update({ cliente_id: cliente.id })
        .eq('cliente_id', selectedCliente.id);

      // Move property matches from duplicate to current
      await supabase
        .from('client_property_matches')
        .update({ cliente_id: cliente.id })
        .eq('cliente_id', selectedCliente.id);

      // Delete the duplicate
      const { error: deleteError } = await supabase
        .from('clienti')
        .delete()
        .eq('id', selectedCliente.id);
      if (deleteError) throw deleteError;

      queryClient.invalidateQueries({ queryKey: ['clienti'] });
      queryClient.invalidateQueries({ queryKey: ['cliente-activities'] });
      
      toast({ title: '✅ Richieste unite', description: `"${selectedCliente.nome}" è stato unito a "${cliente.nome}"` });
      onMerged();
      onOpenChange(false);
      setSelectedId(null);
      setConfirmStep(false);
    } catch (err: any) {
      toast({ title: 'Errore', description: err.message, variant: 'destructive' });
    } finally {
      setMerging(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setSelectedId(null); setConfirmStep(false); } }}>
      <DialogContent className="max-w-md w-full max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Merge className="w-4 h-4" /> {tallyOnly ? 'Associa Questionario Tally' : 'Associa a Richiesta'}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            {tallyOnly 
              ? <>Cerca una submission Tally da associare a <strong>{cliente.nome}</strong>. I dati verranno uniti e il duplicato eliminato.</>
              : <>Unisci un duplicato a <strong>{cliente.nome}</strong>. I dati mancanti verranno compilati e il duplicato eliminato.</>
            }
          </p>
        </DialogHeader>

        {!confirmStep ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per nome, telefono, email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="flex-1 max-h-[50vh]">
              <div className="space-y-1.5 pr-2">
                {candidates.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {search ? 'Nessun risultato' : 'Nessun duplicato trovato automaticamente. Usa la ricerca.'}
                  </p>
                ) : (
                  candidates.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className={`w-full text-left rounded-xl p-3 border transition-all ${
                        selectedId === c.id
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{c.emoji} {c.nome} {c.cognome || ''}</span>
                        {c.portale && (
                          <Badge variant="secondary" className="text-[9px]">{c.portale}</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 text-[10px] text-muted-foreground">
                        {c.telefono && <span>📞 {c.telefono}</span>}
                        {c.email && <span>✉️ {c.email}</span>}
                        {c.data_submission && (
                          <span>📅 {format(new Date(c.data_submission), 'dd/MM/yyyy')}</span>
                        )}
                        {c.paese && <span>🌍 {c.paese}</span>}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>

            <Button
              onClick={() => setConfirmStep(true)}
              disabled={!selectedId}
              className="w-full"
            >
              <Merge className="w-4 h-4 mr-2" />
              Seleziona per unire
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Conferma unione</p>
                <p className="text-amber-700 mt-1">
                  Stai per unire <strong>"{selectedCliente?.nome}"</strong> a <strong>"{cliente.nome}"</strong>.
                  I dati mancanti verranno copiati e la richiesta duplicata verrà eliminata. Questa azione è irreversibile.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmStep(false)}>
                Indietro
              </Button>
              <Button
                className="flex-1"
                onClick={handleMerge}
                disabled={merging}
              >
                {merging ? 'Unendo...' : (
                  <>
                    <Check className="w-4 h-4 mr-1" /> Conferma Unione
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
