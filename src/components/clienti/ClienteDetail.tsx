import { useState } from 'react';
import { Cliente } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Euro, 
  Home, 
  Calendar,
  MessageSquare,
  Trash2,
  Droplets,
  Trees,
  User,
  History,
  Bell,
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { PropertyMatchesSection } from './PropertyMatchesSection';
import { 
  InlineEditText, 
  InlineEditNumber, 
  InlineEditBadges, 
  InlineEditSelect,
  InlineEditBoolean 
} from './InlineEdit';
import { ActivityLog } from './ActivityLog';
import { ActivityQuickActions } from './ActivityQuickActions';
import { ClienteReminder } from './ClienteReminder';
import { ClientePDFExport } from './ClientePDFExport';
import { useClienteActivities } from '@/hooks/useClienteActivities';

interface ClienteDetailProps {
  cliente: Cliente | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agents: Array<{ user_id: string; full_name: string; avatar_emoji: string }>;
  onAssign: (agentId: string | null) => void;
  onAddComment: (comment: string) => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<Cliente>) => void;
}

const REGION_OPTIONS = [
  'Tuscany', 'Umbria', 'Marche', 'Lazio', 'Emilia-Romagna', 
  'Liguria', 'Piemonte', 'Lombardia', 'Veneto', 'Sardegna'
];

const PROPERTY_TYPE_OPTIONS = [
  'Villa', 'Farmhouse', 'Apartment', 'Castle', 'Estate', 
  'Cottage', 'Mansion', 'Country House', 'Palace'
];

const YES_NO_OPTIONS = [
  { value: 'Yes', label: 'Sì' },
  { value: 'No', label: 'No' },
  { value: 'Open to it', label: 'Aperto' },
  { value: 'Not sure', label: 'Non sicuro' },
];

export function ClienteDetail({
  cliente,
  open,
  onOpenChange,
  agents,
  onAssign,
  onAddComment,
  onDelete,
  onUpdate,
}: ClienteDetailProps) {
  const [newComment, setNewComment] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Activity log hook
  const { 
    activities, 
    isLoading: activitiesLoading,
    logCall,
    logEmail,
    logVisit,
    logComment,
    isCreating: isLoggingActivity,
  } = useClienteActivities(cliente?.id);

  if (!cliente) return null;

  const handleAddComment = async () => {
    if (newComment.trim()) {
      onAddComment(newComment.trim());
      // Log the comment as activity
      await logComment(cliente.id, newComment.trim());
      setNewComment('');
    }
  };

  const formatBudget = (budget: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(budget);
  };

  const assignedAgent = agents.find(a => a.user_id === cliente.assigned_to);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95vw] h-[90vh] flex flex-col p-0 rounded-3xl overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2 flex-shrink-0 pr-12">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{cliente.emoji}</span>
            <div className="flex-1 min-w-0">
              <InlineEditText
                value={cliente.nome}
                onSave={(value) => onUpdate({ nome: value })}
                className="text-lg font-semibold break-words"
                placeholder="Nome cliente"
              />
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4">
        <div className="space-y-3">
          {/* Assignment */}
          <div className="bg-white rounded-2xl shadow-lg p-3">
            <Select
              value={cliente.assigned_to || 'unassigned'}
              onValueChange={(v) => onAssign(v === 'unassigned' ? null : v)}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue>
                  {assignedAgent ? (
                    <div className="flex items-center gap-2">
                      <span>{assignedAgent.avatar_emoji}</span>
                      <span className="truncate">{assignedAgent.full_name}</span>
                    </div>
                  ) : (
                    'Non assegnato'
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Non assegnato</SelectItem>
                {agents.map(a => (
                  <SelectItem key={a.user_id} value={a.user_id}>
                    <div className="flex items-center gap-2">
                      <span>{a.avatar_emoji}</span>
                      {a.full_name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Actions + Reminder + PDF Export */}
          <div className="bg-white rounded-2xl shadow-lg p-3 space-y-3">
            <h3 className="font-medium text-sm flex items-center gap-2">
              <Phone className="w-4 h-4" /> Azioni Rapide
            </h3>
            <ActivityQuickActions
              onLogCall={(desc) => logCall(cliente.id, desc)}
              isLoading={isLoggingActivity}
            />
            
            <div className="border-t pt-3">
              <ClienteReminder
                clienteId={cliente.id}
                clienteName={cliente.nome}
                clientePhone={cliente.telefono}
                clientePaese={cliente.paese}
                reminderDate={(cliente as any).reminder_date}
                lastContactDate={(cliente as any).last_contact_date}
                onUpdateReminder={(date) => onUpdate({ reminder_date: date } as any)}
              />
            </div>

            <div className="border-t pt-3">
              <ClientePDFExport
                cliente={cliente}
                activities={activities}
                agentName={assignedAgent?.full_name}
              />
            </div>
          </div>

          {/* Activity Log */}
          <Accordion type="single" collapsible defaultValue="activity">
            <AccordionItem value="activity" className="bg-white rounded-2xl shadow-lg border-0">
              <AccordionTrigger className="px-3 py-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  <span className="font-medium text-sm">Storico Attività</span>
                  {activities.length > 0 && (
                    <Badge variant="secondary" className="text-[10px]">
                      {activities.length}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <ActivityLog activities={activities} isLoading={activitiesLoading} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* ALL FORM FIELDS - Vertical layout with clear labels */}
          <div className="bg-white rounded-2xl shadow-lg p-3 space-y-3">
            {/* Personal Info */}
            <div className="space-y-2">
              <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground border-b pb-1">Dati Personali</h3>
              
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">Paese di provenienza</label>
                <InlineEditText
                  value={cliente.paese}
                  onSave={(value) => onUpdate({ paese: value })}
                  placeholder="Non specificato"
                  className="text-sm"
                />
              </div>
              
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">Telefono</label>
                <InlineEditText
                  value={cliente.telefono}
                  onSave={(value) => onUpdate({ telefono: value })}
                  placeholder="Non specificato"
                  className="text-sm"
                />
              </div>
              
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">Email</label>
                <InlineEditText
                  value={cliente.email}
                  onSave={(value) => onUpdate({ email: value })}
                  placeholder="Non specificato"
                  className="text-sm break-all"
                />
              </div>
            </div>

            {/* Budget Section */}
            <div className="space-y-2">
              <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground border-b pb-1">Budget e Finanziamento</h3>
              
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">Budget massimo</label>
                <InlineEditNumber
                  value={cliente.budget_max}
                  onSave={(value) => onUpdate({ budget_max: value })}
                  placeholder="Non specificato"
                  className="text-sm font-medium"
                  formatDisplay={formatBudget}
                />
              </div>
              
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">Ha bisogno di mutuo?</label>
                <InlineEditSelect
                  value={cliente.mutuo}
                  options={YES_NO_OPTIONS}
                  onSave={(value) => onUpdate({ mutuo: value })}
                  placeholder="Non specificato"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Timeline Section */}
            <div className="space-y-2">
              <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground border-b pb-1">Tempistiche</h3>
              
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">Quando vuole acquistare?</label>
                <InlineEditText
                  value={cliente.tempo_ricerca}
                  onSave={(value) => onUpdate({ tempo_ricerca: value })}
                  placeholder="Non specificato"
                  className="text-sm"
                />
              </div>
              
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">Ha già visitato la zona?</label>
                <InlineEditBoolean
                  value={cliente.ha_visitato}
                  onSave={(value) => onUpdate({ ha_visitato: value })}
                  labelTrue="Sì, ha visitato"
                  labelFalse="No, non ancora"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Location Section */}
            <div className="space-y-2">
              <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground border-b pb-1">Località Preferite</h3>
              
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">Regioni di interesse</label>
                <InlineEditBadges
                  values={cliente.regioni}
                  onSave={(values) => onUpdate({ regioni: values })}
                  placeholder="Nessuna specificata"
                  variant="secondary"
                />
              </div>
              
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">Contesto desiderato (campagna, collina, mare...)</label>
                <InlineEditBadges
                  values={cliente.contesto}
                  onSave={(values) => onUpdate({ contesto: values })}
                  placeholder="Non specificato"
                  variant="outline"
                />
              </div>
              
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">Perché questa zona?</label>
                <div className="flex flex-wrap gap-1">
                  {cliente.motivo_zona && cliente.motivo_zona.length > 0 ? (
                    cliente.motivo_zona.map((m, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{m}</Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground italic">Non specificato</span>
                  )}
                </div>
              </div>
              
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">Deve essere vicino a città/aeroporti?</label>
                <InlineEditBoolean
                  value={cliente.vicinanza_citta}
                  onSave={(value) => onUpdate({ vicinanza_citta: value })}
                  labelTrue="Sì, importante"
                  labelFalse="No, non necessario"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Property Type Section */}
            <div className="space-y-2">
              <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground border-b pb-1">Tipologia Immobile</h3>
              
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">Tipo di proprietà cercata</label>
                <InlineEditBadges
                  values={cliente.tipologia}
                  onSave={(values) => onUpdate({ tipologia: values })}
                  placeholder="Non specificato"
                  variant="outline"
                />
              </div>
              
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">Stile preferito (rustico, moderno...)</label>
                <InlineEditText
                  value={cliente.stile}
                  onSave={(value) => onUpdate({ stile: value })}
                  placeholder="Non specificato"
                  className="text-sm"
                />
              </div>
              
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">Numero camere da letto</label>
                <InlineEditText
                  value={cliente.camere}
                  onSave={(value) => onUpdate({ camere: value })}
                  placeholder="Non specificato"
                  className="text-sm"
                />
              </div>
              
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">Numero bagni</label>
                <InlineEditNumber
                  value={cliente.bagni}
                  onSave={(value) => onUpdate({ bagni: value })}
                  placeholder="Non specificato"
                  className="text-sm"
                />
              </div>
              
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">Preferenza layout (un piano, più piani...)</label>
                <InlineEditText
                  value={cliente.layout}
                  onSave={(value) => onUpdate({ layout: value })}
                  placeholder="Non specificato"
                  className="text-sm"
                />
              </div>
              
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">Dimensioni minime (mq)</label>
                <InlineEditNumber
                  value={cliente.dimensioni_min}
                  onSave={(value) => onUpdate({ dimensioni_min: value })}
                  placeholder="Non specificato"
                  className="text-sm"
                  suffix=" mq"
                />
              </div>
              
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">Dimensioni massime (mq)</label>
                <InlineEditNumber
                  value={cliente.dimensioni_max}
                  onSave={(value) => onUpdate({ dimensioni_max: value })}
                  placeholder="Non specificato"
                  className="text-sm"
                  suffix=" mq"
                />
              </div>
            </div>

            {/* Features Section */}
            <div className="space-y-2">
              <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground border-b pb-1">Caratteristiche Extra</h3>
              
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">Vuole la piscina?</label>
                <InlineEditSelect
                  value={cliente.piscina}
                  options={YES_NO_OPTIONS}
                  onSave={(value) => onUpdate({ piscina: value })}
                  placeholder="Non specificato"
                  className="text-sm"
                />
              </div>
              
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">Vuole terreno?</label>
                <InlineEditSelect
                  value={cliente.terreno}
                  options={YES_NO_OPTIONS}
                  onSave={(value) => onUpdate({ terreno: value })}
                  placeholder="Non specificato"
                  className="text-sm"
                />
              </div>
              
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">Vuole dependance?</label>
                <InlineEditSelect
                  value={cliente.dependance}
                  options={YES_NO_OPTIONS}
                  onSave={(value) => onUpdate({ dependance: value })}
                  placeholder="Non specificato"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Usage Section */}
            <div className="space-y-2">
              <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground border-b pb-1">Utilizzo</h3>
              
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">Come userà la proprietà?</label>
                <InlineEditText
                  value={cliente.uso}
                  onSave={(value) => onUpdate({ uso: value })}
                  placeholder="Non specificato"
                  className="text-sm"
                />
              </div>
              
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">Interessato ad affittare?</label>
                <InlineEditSelect
                  value={cliente.interesse_affitto}
                  options={YES_NO_OPTIONS}
                  onSave={(value) => onUpdate({ interesse_affitto: value })}
                  placeholder="Non specificato"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-2">
              <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground border-b pb-1">Note</h3>
              
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">Descrizione richiesta</label>
                <InlineEditText
                  value={cliente.descrizione}
                  onSave={(value) => onUpdate({ descrizione: value })}
                  placeholder="Non specificato"
                  multiline
                  className="text-sm break-words whitespace-pre-wrap"
                />
              </div>
              
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">Note aggiuntive</label>
                <InlineEditText
                  value={cliente.note_extra}
                  onSave={(value) => onUpdate({ note_extra: value })}
                  placeholder="Non specificato"
                  multiline
                  className="text-sm break-words whitespace-pre-wrap"
                />
              </div>
            </div>
          </div>

          {/* Property Matches Section */}
          <PropertyMatchesSection clienteId={cliente.id} clientePhone={cliente.telefono} />

          {/* Comments */}
          <div className="bg-white rounded-2xl shadow-lg p-3 mt-3">
            <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Commenti Interni
            </h3>
            
            {cliente.comments.length > 0 && (
              <div className="space-y-3 mb-4">
                {cliente.comments.map(comment => (
                  <div key={comment.id} className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{comment.author}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.createdAt), 'dd MMM HH:mm', { locale: it })}
                      </span>
                    </div>
                    <p className="text-sm">{comment.text}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Textarea
                placeholder="Aggiungi un commento..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                className="min-h-[60px]"
              />
              <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                Invia
              </Button>
            </div>
          </div>

          {/* Metadata */}
          <div className="text-xs text-muted-foreground bg-white rounded-2xl shadow-lg p-3 mt-3 space-y-1">
            <p>Creato: {format(new Date(cliente.created_at), 'dd MMM yyyy HH:mm', { locale: it })}</p>
            {cliente.data_submission && (
              <p>Submission: {format(new Date(cliente.data_submission), 'dd MMM yyyy HH:mm', { locale: it })}</p>
            )}
            {cliente.tally_submission_id && (
              <p className="font-mono text-[10px]">ID: {cliente.tally_submission_id}</p>
            )}
          </div>

          {/* Delete */}
          <div className="mt-3">
            {!showDeleteConfirm ? (
              <Button 
                variant="outline" 
                className="text-destructive hover:text-destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Elimina Cliente
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-destructive">Sei sicuro?</span>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => { onDelete(); onOpenChange(false); }}
                >
                  Elimina
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Annulla
                </Button>
              </div>
            )}
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ClienteDetail;
