import { useState, useMemo, useEffect } from 'react';
import { Plus, User, FileText, Search, X, Pencil } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle } from
'@/components/ui/sheet';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem } from
'@/components/ui/command';
import { cn } from '@/lib/utils';
import { format, setHours, setMinutes } from 'date-fns';
import { it } from 'date-fns/locale';

type AddType = 'appointment' | 'cliente' | 'notizia' | 'task';

type Cliente = {
  id: string;
  nome: string;
  emoji?: string | null;
  reminder_date?: string | null;
};

type Notizia = {
  id: string;
  name: string;
  emoji?: string | null;
  reminder_date?: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  clienti: Cliente[];
  notizie: Notizia[];
  initialType?: 'cliente' | 'notizia' | null;
  onAddAppointment: () => void;
  onAddClienteReminder: (clienteId: string, date: Date) => void;
  onAddNotiziaReminder: (notiziaId: string, date: Date) => void;
  onAddTask: () => void;
  onAddNotizia?: () => void;
};

const AddToCalendarMenu = ({
  open,
  onOpenChange,
  date,
  clienti,
  notizie,
  initialType,
  onAddAppointment,
  onAddClienteReminder,
  onAddNotiziaReminder,
  onAddTask,
  onAddNotizia
}: Props) => {
  const [selectedType, setSelectedType] = useState<AddType | null>(initialType || null);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync initialType when menu opens
  useEffect(() => {
    if (open) {
      setSelectedType(initialType || null);
      setSearchQuery('');
    }
  }, [open, initialType]);

  // Filter clienti without reminder on this date
  const availableClienti = useMemo(() => {
    return clienti.filter((c) => {
      // Include all clienti, let user choose even if already has reminder
      return c.nome.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [clienti, searchQuery]);

  // Filter notizie without reminder on this date
  const availableNotizie = useMemo(() => {
    return notizie.filter((n) => {
      return n.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [notizie, searchQuery]);

  const handleSelectCliente = (cliente: Cliente) => {
    // Set reminder to 09:00 of selected date
    const reminderDate = setMinutes(setHours(date, 9), 0);
    onAddClienteReminder(cliente.id, reminderDate);
    onOpenChange(false);
    setSelectedType(null);
    setSearchQuery('');
  };

  const handleSelectNotizia = (notizia: Notizia) => {
    // Set reminder to 09:00 of selected date
    const reminderDate = setMinutes(setHours(date, 9), 0);
    onAddNotiziaReminder(notizia.id, reminderDate);
    onOpenChange(false);
    setSelectedType(null);
    setSearchQuery('');
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedType(null);
    setSearchQuery('');
  };

  const handleBack = () => {
    setSelectedType(null);
    setSearchQuery('');
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
        <SheetHeader className="pb-4 border-b border-muted">
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedType &&
              <button
                onClick={handleBack}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                
                  <X className="w-4 h-4" />
                </button>
              }
              <div>
                <p className="text-xl font-bold">
                  {selectedType === 'cliente' ?
                  'Seleziona Buyer' :
                  selectedType === 'notizia' ?
                  'Seleziona Seller' :
                  'Aggiungi'}
                </p>
                <p className="text-sm text-muted-foreground font-normal">
                  {format(date, 'd MMMM yyyy', { locale: it })}
                </p>
              </div>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="py-4 overflow-y-auto max-h-[calc(70vh-120px)]">
          {!selectedType ?
          // Main menu
          <div className="space-y-3">
              <button
              onClick={() => setSelectedType('cliente')}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
              
                <div className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center">
                  <User className="w-6 h-6 text-background" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">Buyer</p>
                  <p className="text-sm text-muted-foreground">Imposta promemoria per un buyer</p>
                </div>
              </button>

              <button
              onClick={() => setSelectedType('notizia')}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
              
                <div className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center">
                  <FileText className="w-6 h-6 text-background" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">Seller</p>
                  <p className="text-sm text-muted-foreground">Imposta promemoria per un seller</p>
                </div>
              </button>

              <button
              onClick={() => {
                onAddTask();
                onOpenChange(false);
              }}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-white border border-foreground hover:bg-muted transition-colors">
              
                <div className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center">
                  <Pencil className="w-6 h-6 text-background" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">Task</p>
                  <p className="text-sm text-muted-foreground">Aggiungi un'attività da completare</p>
                </div>
              </button>
            </div> :
          selectedType === 'cliente' ?
          // Cliente search
          <Command className="rounded-xl border-0 bg-transparent">
              <div className="px-1 pb-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <input
                  type="text"
                  placeholder="Cerca buyer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground" />
                
                </div>
              </div>
              <CommandList className="max-h-[calc(70vh-220px)]">
                {availableClienti.length === 0 ?
              <div className="py-8 text-center text-muted-foreground text-sm">
                    Nessun buyer trovato
                  </div> :

              <div className="space-y-2">
                    {availableClienti.map((cliente) =>
                <button
                  key={cliente.id}
                  onClick={() => handleSelectCliente(cliente)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left">
                  
                        <span className="text-xl">{cliente.emoji || '👤'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm">{cliente.nome}</p>
                          {cliente.reminder_date &&
                    <p className="text-xs text-muted-foreground">
                              Ha già promemoria: {format(new Date(cliente.reminder_date), 'd MMM', { locale: it })}
                            </p>
                    }
                        </div>
                      </button>
                )}
                  </div>
              }
              </CommandList>
            </Command> :

          // Notizia search
          <Command className="rounded-xl border-0 bg-transparent">
              <div className="px-1 pb-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <input
                  type="text"
                  placeholder="Cerca seller..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground" />
                
                </div>
              </div>
              {onAddNotizia &&
                <div className="px-1 pb-3">
                  <button
                    onClick={() => {
                      onAddNotizia();
                      handleClose();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-muted-foreground/30 hover:bg-muted transition-colors text-left">
                    <span className="text-xl">➕</span>
                    <p className="font-medium text-sm">Aggiungi nuovo seller</p>
                  </button>
                </div>
              }
              <CommandList className="max-h-[calc(70vh-220px)]">
                {availableNotizie.length === 0 ?
              <div className="py-8 text-center text-muted-foreground text-sm">
                    Nessun seller trovato
                  </div> :

              <div className="space-y-2">
                    {availableNotizie.map((notizia) =>
                <button
                  key={notizia.id}
                  onClick={() => handleSelectNotizia(notizia)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left">
                  
                        <span className="text-xl">{notizia.emoji || '📋'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm">{notizia.name}</p>
                          {notizia.reminder_date &&
                    <p className="text-xs text-muted-foreground">
                              Ha già promemoria: {format(new Date(notizia.reminder_date), 'd MMM', { locale: it })}
                            </p>
                    }
                        </div>
                      </button>
                )}
                  </div>
              }
              </CommandList>
            </Command>
          }
        </div>
      </SheetContent>
    </Sheet>);

};

export default AddToCalendarMenu;