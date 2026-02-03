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
import { useMeetings, MeetingItemType } from '@/hooks/useMeetings';
import { useProfiles } from '@/hooks/useProfiles';
import { useNotizie } from '@/hooks/useNotizie';
import { useClienti } from '@/hooks/useClienti';

const ITEM_TYPE_LABELS: Record<MeetingItemType, string> = {
  incarico: 'Incarico',
  trattativa: 'Trattativa',
  acquirente: 'Acquirente',
  obiettivo: 'Obiettivo',
  task: 'Task',
};

const formSchema = z.object({
  title: z.string().min(1, 'Titolo obbligatorio'),
  description: z.string().optional(),
  assigned_to: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddMeetingItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string;
  itemType: MeetingItemType;
}

export const AddMeetingItemDialog = ({
  open,
  onOpenChange,
  meetingId,
  itemType,
}: AddMeetingItemDialogProps) => {
  const { addItem } = useMeetings();
  const { profiles } = useProfiles();
  const { notizie } = useNotizie();
  const { clienti } = useClienti();

  const [linkedNotizia, setLinkedNotizia] = useState<string | null>(null);
  const [linkedCliente, setLinkedCliente] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLinkPicker, setShowLinkPicker] = useState<'notizia' | 'cliente' | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      assigned_to: '',
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
    await addItem.mutateAsync({
      meeting_id: meetingId,
      item_type: itemType,
      title: data.title,
      description: data.description || undefined,
      assigned_to: data.assigned_to || undefined,
      linked_notizia_id: linkedNotizia || undefined,
      linked_cliente_id: linkedCliente || undefined,
    });
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Aggiungi {ITEM_TYPE_LABELS[itemType]}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titolo</FormLabel>
                  <FormControl>
                    <Input placeholder="Descrivi brevemente..." {...field} />
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
                    <Textarea 
                      placeholder="Note aggiuntive..." 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assigned_to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assegna a</FormLabel>
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

            {/* Link to existing entities */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Collega a</label>
              
              <div className="flex gap-2 flex-wrap">
                {/* Link Notizia button */}
                {!linkedNotizia ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLinkPicker('notizia')}
                  >
                    <Link2 className="h-3 w-3 mr-1" />
                    Notizia
                  </Button>
                ) : (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    📋 {selectedNotizia?.name}
                    <button
                      type="button"
                      onClick={() => setLinkedNotizia(null)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}

                {/* Link Cliente button */}
                {!linkedCliente ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLinkPicker('cliente')}
                  >
                    <Link2 className="h-3 w-3 mr-1" />
                    Buyer
                  </Button>
                ) : (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    👤 {selectedCliente?.nome}
                    <button
                      type="button"
                      onClick={() => setLinkedCliente(null)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>

              {/* Link picker */}
              {showLinkPicker && (
                <div className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={`Cerca ${showLinkPicker === 'notizia' ? 'notizia' : 'buyer'}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8"
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
                    {showLinkPicker === 'notizia' ? (
                      filteredNotizie?.map(n => (
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
                      ))
                    ) : (
                      filteredClienti?.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          className="w-full text-left px-2 py-1.5 hover:bg-muted rounded text-sm"
                          onClick={() => {
                            setLinkedCliente(c.id);
                            setShowLinkPicker(null);
                            setSearchQuery('');
                          }}
                        >
                          {c.emoji || '👤'} {c.nome}
                        </button>
                      ))
                    )}
                  </ScrollArea>
                </div>
              )}
            </div>

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
