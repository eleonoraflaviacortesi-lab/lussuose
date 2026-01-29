import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { Clock, User, FileText, MapPin, Phone, Mail, Euro, Home, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { CalendarEvent } from './CalendarPage';

type Cliente = {
  id: string;
  nome: string;
  telefono: string | null;
  email: string | null;
  budget_max: number | null;
  regioni: string[] | null;
  status: string;
};

type Notizia = {
  id: string;
  name: string;
  phone: string | null;
  zona: string | null;
  type: string | null;
  status: string;
  notes: string | null;
};

type Props = {
  event: CalendarEvent | null;
  onClose: () => void;
  clienti?: Cliente[];
  notizie?: Notizia[];
};

const EventDetailSheet = ({ event, onClose, clienti, notizie }: Props) => {
  if (!event) return null;

  const getEventData = () => {
    if (event.type === 'cliente_reminder' && event.clienteId) {
      const cliente = clienti?.find(c => c.id === event.clienteId);
      return { type: 'cliente', data: cliente };
    }
    if (event.type === 'notizia_reminder' && event.notiziaId) {
      const notizia = notizie?.find(n => n.id === event.notiziaId);
      return { type: 'notizia', data: notizia };
    }
    if (event.type === 'appointment' && event.clienteId) {
      const cliente = clienti?.find(c => c.id === event.clienteId);
      return { type: 'cliente', data: cliente };
    }
    return { type: 'appointment', data: null };
  };

  const { type, data } = getEventData();

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      new: 'Nuovo',
      contacted: 'Contattato',
      qualified: 'Qualificato',
      proposal: 'Proposta',
      negotiation: 'Trattativa',
      closed_won: 'Chiuso (Vinto)',
      closed_lost: 'Chiuso (Perso)',
      lead: 'Lead',
      primo_contatto: 'Primo Contatto',
      appuntamento: 'Appuntamento',
      valutazione: 'Valutazione',
      incarico: 'Incarico',
      venduto: 'Venduto',
      archiviato: 'Archiviato',
    };
    return statusMap[status] || status;
  };

  const formatBudget = (value: number) => {
    if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`;
    }
    return `€${(value / 1000).toFixed(0)}K`;
  };

  return (
    <Sheet open={!!event} onOpenChange={() => onClose()}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
        <SheetHeader className="pb-4 border-b border-muted">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                event.type === 'appointment' ? 'bg-accent/10' :
                event.type === 'cliente_reminder' ? 'bg-amber-500/10' : 'bg-emerald-500/10'
              }`}>
                {event.type === 'appointment' ? <Clock className="w-6 h-6 text-accent" /> :
                 event.type === 'cliente_reminder' ? <User className="w-6 h-6 text-amber-500" /> :
                 <FileText className="w-6 h-6 text-emerald-500" />}
              </div>
              <div>
                <SheetTitle className="text-left">{event.title}</SheetTitle>
                <p className="text-sm text-muted-foreground">{event.time}</p>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="py-4 space-y-4 overflow-y-auto max-h-[calc(70vh-120px)]">
          {/* Cliente details */}
          {type === 'cliente' && data && (
            <>
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
                  Dettagli Cliente
                </h3>
                
                {(data as Cliente).telefono && (
                  <a 
                    href={`tel:${(data as Cliente).telefono}`}
                    className="flex items-center gap-3 text-sm hover:text-accent transition-colors"
                  >
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    {(data as Cliente).telefono}
                  </a>
                )}
                
                {(data as Cliente).email && (
                  <a 
                    href={`mailto:${(data as Cliente).email}`}
                    className="flex items-center gap-3 text-sm hover:text-accent transition-colors"
                  >
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    {(data as Cliente).email}
                  </a>
                )}
                
                {(data as Cliente).budget_max && (
                  <div className="flex items-center gap-3 text-sm">
                    <Euro className="w-4 h-4 text-muted-foreground" />
                    Budget: {formatBudget((data as Cliente).budget_max!)}
                  </div>
                )}
                
                {(data as Cliente).regioni && (data as Cliente).regioni!.length > 0 && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    {(data as Cliente).regioni!.join(', ')}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
                  Stato:
                </span>
                <span className="px-2 py-1 bg-accent/10 text-accent text-xs font-medium rounded-full">
                  {getStatusLabel((data as Cliente).status)}
                </span>
              </div>
            </>
          )}

          {/* Notizia details */}
          {type === 'notizia' && data && (
            <>
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
                  Dettagli Notizia
                </h3>
                
                {(data as Notizia).phone && (
                  <a 
                    href={`tel:${(data as Notizia).phone}`}
                    className="flex items-center gap-3 text-sm hover:text-accent transition-colors"
                  >
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    {(data as Notizia).phone}
                  </a>
                )}
                
                {(data as Notizia).zona && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    {(data as Notizia).zona}
                  </div>
                )}
                
                {(data as Notizia).type && (
                  <div className="flex items-center gap-3 text-sm">
                    <Home className="w-4 h-4 text-muted-foreground" />
                    {(data as Notizia).type}
                  </div>
                )}
                
                {(data as Notizia).notes && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {(data as Notizia).notes}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
                  Stato:
                </span>
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 text-xs font-medium rounded-full">
                  {getStatusLabel((data as Notizia).status)}
                </span>
              </div>
            </>
          )}

          {/* Appointment only (no linked entity) */}
          {type === 'appointment' && !data && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Appuntamento senza cliente collegato
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default EventDetailSheet;