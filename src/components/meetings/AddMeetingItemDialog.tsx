import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, Link2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMeetings } from '@/hooks/useMeetings';
import { useProfiles } from '@/hooks/useProfiles';
import { useNotizie } from '@/hooks/useNotizie';
import { useClienti } from '@/hooks/useClienti';
import type { MeetingSectionType } from './MeetingDetail';

const SECTION_LABELS: Record<MeetingSectionType, string> = {
  trattativa_corso: 'Trattativa in corso',
  trattativa_chiusa: 'Trattativa chiusa',
  incarico_preso: 'Incarico preso',
  incarico_mirino: 'Incarico nel mirino',
  acquirente_caldo: 'Acquirente caldo',
  incarico_ribasso: 'Incarico da ribassare',
  obiettivo: 'Obiettivo settimana',
};

// Config per ogni sezione: quali campi mostrare
const SECTION_FIELDS: Record<MeetingSectionType, {
  showNotizia: boolean;
  showBuyer: boolean;
  showBuyerText: boolean;
  agentRequired: boolean;
  titlePlaceholder: string;
}> = {
  trattativa_corso: { showNotizia: true, showBuyer: true, showBuyerText: true, agentRequired: false, titlePlaceholder: 'Note sulla trattativa...' },
  trattativa_chiusa: { showNotizia: true, showBuyer: true, showBuyerText: true, agentRequired: false, titlePlaceholder: 'Note sulla chiusura...' },
  incarico_preso: { showNotizia: true, showBuyer: false, showBuyerText: false, agentRequired: false, titlePlaceholder: 'Dettagli incarico...' },
  incarico_mirino: { showNotizia: true, showBuyer: false, showBuyerText: false, agentRequired: false, titlePlaceholder: 'Potenziale incarico...' },
  acquirente_caldo: { showNotizia: false, showBuyer: true, showBuyerText: false, agentRequired: false, titlePlaceholder: 'Note acquirente...' },
  incarico_ribasso: { showNotizia: true, showBuyer: false, showBuyerText: false, agentRequired: false, titlePlaceholder: 'Proposta di ribasso...' },
  obiettivo: { showNotizia: false, showBuyer: false, showBuyerText: false, agentRequired: true, titlePlaceholder: 'Descrivi l\'obiettivo...' },
};

const formSchema = z.object({
  title: z.string().min(1, 'Campo obbligatorio'),
  description: z.string().optional(),
  assigned_to: z.string().optional(),
  buyer_name: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddMeetingItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string;
  sectionType: MeetingSectionType;
}

export const AddMeetingItemDialog = ({
  open,
  onOpenChange,
  meetingId,
  sectionType,
}: AddMeetingItemDialogProps) => {
  const { addItem } = useMeetings();
  const { profiles } = useProfiles();
  const { notizie } = useNotizie();
  const { clienti } = useClienti();

  const [linkedNotizia, setLinkedNotizia] = useState<string | null>(null);
  const [linkedCliente, setLinkedCliente] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLinkPicker, setShowLinkPicker] = useState<'notizia' | 'cliente' | null>(null);

  const fieldConfig = SECTION_FIELDS[sectionType];

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      assigned_to: '',
      buyer_name: '',
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset();
      setLinkedNotizia(null);
      setLinkedCliente(null);
      setSearchQuery('');
      setShowLinkPicker(null);
    }
  }, [open, form]);

  const onSubmit = async (data: FormData) => {
    // Validazione agente per obiettivi
    if (fieldConfig.agentRequired && !data.assigned_to) {
      form.setError('assigned_to', { message: 'Agente obbligatorio per gli obiettivi' });
      return;
    }

    await addItem.mutateAsync({
      meeting_id: meetingId,
      item_type: sectionType,
      title: data.title,
      description: data.description || undefined,
      assigned_to: data.assigned_to || undefined,
      linked_notizia_id: linkedNotizia || undefined,
      linked_cliente_id: linkedCliente || undefined,
      // buyer_name viene gestito lato DB
    } as any);
    
    // Se c'è buyer_name ma non cliente collegato, lo salviamo separatamente
    // Nota: questo richiede che il campo buyer_name sia stato aggiunto alla tabella
    
    onOpenChange(false);
  };

  const filteredNotizie = notizie?.filter(n => 
    n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.zona?.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 10);

  const filteredClienti = clienti?.filter(c =>
    c.nome.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 10);

  const selectedNotizia = notizie?.find(n => n.id === linkedNotizia);
  const selectedCliente = clienti?.find(c => c.id === linkedCliente);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Aggiungi: {SECTION_LABELS[sectionType]}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Notizia picker */}
            {fieldConfig.showNotizia && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Collega Notizia</label>
                {!linkedNotizia ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowLinkPicker('notizia')}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Cerca notizia...
                  </Button>
                ) : (
                  <Badge variant="secondary" className="flex items-center gap-2 p-2 w-full justify-between">
                    <span>📋 {selectedNotizia?.name}</span>
                    <button
                      type="button"
                      onClick={() => setLinkedNotizia(null)}
                      className="hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </Badge>
                )}
                
                {showLinkPicker === 'notizia' && (
                  <div className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Cerca notizia..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8"
                        autoFocus
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowLinkPicker(null);
                          setSearchQuery('');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <ScrollArea className="h-32">
                      {filteredNotizie?.map(n => (
                        <button
                          key={n.id}
                          type="button"
                          className="w-full text-left px-2 py-1.5 hover:bg-muted rounded text-sm"
                          onClick={() => {
                            setLinkedNotizia(n.id);
                            setShowLinkPicker(null);
                            setSearchQuery('');
                          }}
                        >
                          {n.emoji || '📋'} {n.name}
                          {n.zona && <span className="text-muted-foreground ml-1">- {n.zona}</span>}
                        </button>
                      ))}
                      {filteredNotizie?.length === 0 && (
                        <p className="text-sm text-muted-foreground p-2">Nessun risultato</p>
                      )}
                    </ScrollArea>
                  </div>
                )}
              </div>
            )}

            {/* Buyer picker */}
            {fieldConfig.showBuyer && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Collega Buyer</label>
                {!linkedCliente ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowLinkPicker('cliente')}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Cerca buyer...
                  </Button>
                ) : (
                  <Badge variant="secondary" className="flex items-center gap-2 p-2 w-full justify-between">
                    <span>👤 {selectedCliente?.nome}</span>
                    <button
                      type="button"
                      onClick={() => setLinkedCliente(null)}
                      className="hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </Badge>
                )}
                
                {showLinkPicker === 'cliente' && (
                  <div className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Cerca buyer..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8"
                        autoFocus
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowLinkPicker(null);
                          setSearchQuery('');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <ScrollArea className="h-32">
                      {filteredClienti?.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          className="w-full text-left px-2 py-1.5 hover:bg-muted rounded text-sm"
                          onClick={() => {
                            setLinkedCliente(c.id);
                            setShowLinkPicker(null);
                            setSearchQuery('');
                            form.setValue('buyer_name', ''); // Clear text if selecting
                          }}
                        >
                          {c.emoji || '👤'} {c.nome}
                        </button>
                      ))}
                      {filteredClienti?.length === 0 && (
                        <p className="text-sm text-muted-foreground p-2">Nessun risultato</p>
                      )}
                    </ScrollArea>
                  </div>
                )}
              </div>
            )}

            {/* Buyer text (if buyer not linked) */}
            {fieldConfig.showBuyerText && !linkedCliente && (
              <FormField
                control={form.control}
                name="buyer_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Oppure scrivi nome buyer</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome buyer..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Title/Notes */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{sectionType === 'obiettivo' ? 'Obiettivo' : 'Titolo/Note'}</FormLabel>
                  <FormControl>
                    <Input placeholder={fieldConfig.titlePlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description (optional) */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dettagli (opzionale)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Note aggiuntive..." 
                      className="min-h-[60px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Agent assignment */}
            <FormField
              control={form.control}
              name="assigned_to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Assegna a {fieldConfig.agentRequired && <span className="text-destructive">*</span>}
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona agente..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {profiles?.map(p => (
                        <SelectItem key={p.user_id} value={p.user_id}>
                          {p.avatar_emoji} {p.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annulla
              </Button>
              <Button type="submit" disabled={addItem.isPending}>
                {addItem.isPending ? 'Salvataggio...' : 'Aggiungi'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};