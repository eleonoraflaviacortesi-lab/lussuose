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
import { useMeetings, MeetingItem } from '@/hooks/useMeetings';
import { useProfiles } from '@/hooks/useProfiles';
import { useAllNotizie } from '@/hooks/useNotizie';
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
  title: z.string().optional(),
  description: z.string().optional(),
  assigned_to: z.string().optional(),
  buyer_name: z.string().optional(),
  goal_incarichi: z.number().min(0).optional(),
  goal_notizie: z.number().min(0).optional(),
  goal_acquisizioni: z.number().min(0).optional(),
  goal_trattative: z.number().min(0).optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditMeetingItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MeetingItem | null;
  sectionType: MeetingSectionType;
}

export const EditMeetingItemDialog = ({
  open,
  onOpenChange,
  item,
  sectionType,
}: EditMeetingItemDialogProps) => {
  const { updateItem } = useMeetings();
  const { profiles } = useProfiles();
  const { allNotizie } = useAllNotizie();
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
      goal_incarichi: 0,
      goal_notizie: 0,
      goal_acquisizioni: 0,
      goal_trattative: 0,
      notes: '',
    },
  });

  // Load item data when dialog opens
  useEffect(() => {
    if (open && item) {
      form.reset({
        title: item.title || '',
        description: item.description || '',
        assigned_to: item.assigned_to || '',
        buyer_name: (item as any).buyer_name || '',
        goal_incarichi: (item as any).goal_incarichi || 0,
        goal_notizie: (item as any).goal_notizie || 0,
        goal_acquisizioni: (item as any).goal_acquisizioni || 0,
        goal_trattative: (item as any).goal_trattative || 0,
        notes: (item as any).notes || '',
      });
      setLinkedNotizia(item.linked_notizia_id || null);
      setLinkedCliente(item.linked_cliente_id || null);
      setSearchQuery('');
      setShowLinkPicker(null);
    }
  }, [open, item, form]);

  const onSubmit = async (data: FormData) => {
    if (!item) return;

    if (fieldConfig.agentRequired && !data.assigned_to) {
      form.setError('assigned_to', { message: 'Agente obbligatorio per gli obiettivi' });
      return;
    }

    let title = data.title || '';
    if (sectionType === 'obiettivo') {
      title = 'Obiettivi settimanali';
    }

    await updateItem.mutateAsync({
      id: item.id,
      meeting_id: item.meeting_id,
      title,
      description: data.description || undefined,
      assigned_to: data.assigned_to || undefined,
      linked_notizia_id: linkedNotizia || undefined,
      linked_cliente_id: linkedCliente || undefined,
      buyer_name: data.buyer_name || undefined,
      goal_incarichi: data.goal_incarichi || 0,
      goal_notizie: data.goal_notizie || 0,
      goal_acquisizioni: data.goal_acquisizioni || 0,
      goal_trattative: data.goal_trattative || 0,
      notes: data.notes || undefined,
    } as any);
    
    onOpenChange(false);
  };

  const filteredNotizie = allNotizie?.filter(n => 
    n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.zona?.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 10);

  const filteredClienti = clienti?.filter(c =>
    c.nome.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 10);

  const selectedNotizia = allNotizie?.find(n => n.id === linkedNotizia);
  const selectedCliente = clienti?.find(c => c.id === linkedCliente);

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Modifica: {SECTION_LABELS[sectionType]}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Notizia linking */}
            {fieldConfig.showNotizia && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Collega Notizia</label>
                {selectedNotizia ? (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    <span className="text-lg">{selectedNotizia.emoji}</span>
                    <span className="flex-1 text-sm truncate">{selectedNotizia.name}</span>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setLinkedNotizia(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : showLinkPicker === 'notizia' ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cerca notizia..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                        autoFocus
                      />
                    </div>
                    <ScrollArea className="h-40">
                      <div className="space-y-1">
                        {filteredNotizie?.map(n => (
                          <Button
                            key={n.id}
                            type="button"
                            variant="ghost"
                            className="w-full justify-start text-left h-auto py-2"
                            onClick={() => {
                              setLinkedNotizia(n.id);
                              setShowLinkPicker(null);
                              setSearchQuery('');
                            }}
                          >
                            <span className="text-lg mr-2">{n.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{n.name}</p>
                              {n.zona && <p className="text-xs text-muted-foreground">{n.zona}</p>}
                            </div>
                          </Button>
                        ))}
                        {(!filteredNotizie || filteredNotizie.length === 0) && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Nessuna notizia trovata
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setShowLinkPicker(null)}
                    >
                      Annulla
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowLinkPicker('notizia')}
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Collega notizia
                  </Button>
                )}
              </div>
            )}

            {/* Cliente linking */}
            {fieldConfig.showBuyer && !fieldConfig.showBuyerText && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Collega Acquirente</label>
                {selectedCliente ? (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    <span className="text-lg">{selectedCliente.emoji}</span>
                    <span className="flex-1 text-sm truncate">{selectedCliente.nome}</span>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setLinkedCliente(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : showLinkPicker === 'cliente' ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cerca acquirente..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                        autoFocus
                      />
                    </div>
                    <ScrollArea className="h-40">
                      <div className="space-y-1">
                        {filteredClienti?.map(c => (
                          <Button
                            key={c.id}
                            type="button"
                            variant="ghost"
                            className="w-full justify-start text-left h-auto py-2"
                            onClick={() => {
                              setLinkedCliente(c.id);
                              setShowLinkPicker(null);
                              setSearchQuery('');
                            }}
                          >
                            <span className="text-lg mr-2">{c.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{c.nome}</p>
                            </div>
                          </Button>
                        ))}
                        {(!filteredClienti || filteredClienti.length === 0) && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Nessun acquirente trovato
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setShowLinkPicker(null)}
                    >
                      Annulla
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowLinkPicker('cliente')}
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Collega acquirente
                  </Button>
                )}
              </div>
            )}

            {/* Buyer text input for trattative */}
            {fieldConfig.showBuyerText && (
              <FormField
                control={form.control}
                name="buyer_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Acquirente</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome dell'acquirente..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Regular fields for non-obiettivo types */}
            {sectionType !== 'obiettivo' && (
              <>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titolo/Note</FormLabel>
                      <FormControl>
                        <Input placeholder={fieldConfig.titlePlaceholder} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dettagli (opzionale)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Note aggiuntive..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Obiettivo-specific fields */}
            {sectionType === 'obiettivo' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="goal_incarichi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Incarichi</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="goal_notizie"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notizie</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="goal_acquisizioni"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Acquisizioni</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="goal_trattative"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trattative</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Note aggiuntive..." {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Agent selection */}
            <FormField
              control={form.control}
              name="assigned_to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Assegna a {fieldConfig.agentRequired && <span className="text-destructive">*</span>}
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona agente..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {profiles?.map(p => (
                        <SelectItem key={p.user_id} value={p.user_id}>
                          <span className="flex items-center gap-2">
                            <span>{p.avatar_emoji}</span>
                            <span>{p.full_name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Annulla
              </Button>
              <Button type="submit" className="flex-1" disabled={updateItem.isPending}>
                {updateItem.isPending ? 'Salvando...' : 'Salva'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
