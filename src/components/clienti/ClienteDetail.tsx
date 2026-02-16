import { useState, useMemo } from 'react';
import { LINGUA_COLORS, PORTALE_COLORS, TIPO_CONTATTO_COLORS } from '@/lib/colorMaps';
import { Cliente } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import MentionInput from '@/components/ui/mention-input';
import { useMentionNotifications } from '@/hooks/useMentionNotifications';
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
  X,
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
  const { sendMentionNotifications } = useMentionNotifications();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Deduce data_submission from notes if not set
  const getDataRichiesta = (): string | null => {
    if (cliente?.data_submission) return cliente.data_submission;
    if (!cliente?.note_extra) return null;
    const match = cliente.note_extra.match(/📅\s*Data richiesta:\s*(\d{2}\/\d{2}\/\d{4})/);
    if (match) {
      const [dd, mm, yyyy] = match[1].split('/');
      return `${yyyy}-${mm}-${dd}`;
    }
    return null;
  };

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
      // Send mention notifications
      await sendMentionNotifications(newComment.trim(), {
        type: 'comment_cliente',
        entityName: cliente.nome,
        referenceId: cliente.id,
      });
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
      <DialogContent className="max-w-lg lg:max-w-5xl w-full h-[100dvh] max-h-[100dvh] flex flex-col p-0 rounded-none sm:rounded-none border-0 gap-0 [&>button]:hidden animate-in slide-in-from-bottom duration-300">
        <DialogHeader className="px-4 pt-4 pb-2 flex-shrink-0 pr-12">
          <div className="flex items-center gap-3">
            <button onClick={() => onOpenChange(false)} className="text-muted-foreground active:scale-95 transition-transform">
              <X className="w-5 h-5" />
            </button>
            <span className="text-2xl">{cliente.emoji}</span>
            <div className="flex-1 min-w-0">
              <InlineEditText
                value={cliente.nome}
                onSave={(value) => onUpdate({ nome: value })}
                className="text-lg font-semibold break-words"
                placeholder="Nome cliente"
                noHighlight
              />
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4">
        <div className="lg:grid lg:grid-cols-3 lg:gap-4 space-y-3 lg:space-y-0">
          {/* COLUMN 1: Notes + Assignment + Quick Actions */}
          <div className="space-y-3">
            {/* Notes at top */}
            <div className="bg-white rounded-2xl shadow-lg p-3 space-y-2">
              <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground border-b pb-1">Note</h3>
              <InlineEditText
                value={cliente.note_extra}
                onSave={(value) => onUpdate({ note_extra: value })}
                placeholder="Nessuna nota"
                multiline
                noHighlight
                className="text-sm break-words whitespace-pre-wrap"
              />
            </div>

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
                  reminderDate={cliente.reminder_date}
                  lastContactDate={cliente.last_contact_date}
                  onUpdateReminder={(date) => onUpdate({ reminder_date: date })}
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

            {/* Activity Log with Comments Input */}
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
                  
                  {/* Comments Input - under activity log */}
                  <div className="mt-4 pt-3 border-t border-muted">
                    <h4 className="font-medium text-xs mb-2 flex items-center gap-2 text-muted-foreground">
                      <MessageSquare className="w-3 h-3" /> Aggiungi commento
                    </h4>
                    <div className="flex gap-2">
                      <MentionInput
                        value={newComment}
                        onChange={setNewComment}
                        onSubmit={handleAddComment}
                        placeholder="Scrivi un commento... usa @ per taggare"
                        className="min-h-[60px] flex-1 w-full bg-white rounded-xl px-3 py-2 text-sm border border-input focus:outline-none focus:ring-2 focus:ring-ring"
                        multiline
                        rows={2}
                      />
                      <Button onClick={handleAddComment} disabled={!newComment.trim()} size="sm">
                        Invia
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Property Matches - below activity on desktop */}
            <div className="hidden lg:block">
              <PropertyMatchesSection clienteId={cliente.id} clientePhone={cliente.telefono} noteExtra={cliente.note_extra} />
            </div>
          </div>

          {/* COLUMN 2: Form Fields */}
          <div className="space-y-3">
            <div className="bg-white rounded-2xl shadow-lg p-3 space-y-3">
              {/* Personal Info */}
              <div className="space-y-2">
                <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground border-b pb-1">Dati Personali</h3>
                
                {/* Data richiesta */}
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-0.5">Data richiesta</label>
                  {(() => {
                    const dataRichiesta = getDataRichiesta();
                    return dataRichiesta ? (
                      <div className="flex items-center gap-1.5 text-sm">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="font-medium bg-amber-100 px-1.5 py-0.5 rounded">
                          {format(new Date(dataRichiesta), 'dd MMM yyyy', { locale: it })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">Non specificata</span>
                    );
                  })()}
                </div>

                <div>
                  <label className="text-[10px] text-muted-foreground block mb-0.5">Cognome</label>
                  <InlineEditText
                    value={cliente.cognome}
                    onSave={(value) => onUpdate({ cognome: value })}
                    placeholder="Non specificato"
                    className="text-sm"
                  />
                </div>

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
                  <label className="text-[10px] text-muted-foreground block mb-0.5">Lingua</label>
                <InlineEditSelect
                    value={cliente.lingua}
                    options={[
                      { value: 'ENG', label: 'English' },
                      { value: 'ITA', label: 'Italiano' },
                      { value: 'FRA', label: 'Français' },
                      { value: 'DEU', label: 'Deutsch' },
                      { value: 'ESP', label: 'Español' },
                    ]}
                    onSave={(value) => onUpdate({ lingua: value })}
                    placeholder="Non specificata"
                    className="text-sm"
                    prefix={LINGUA_COLORS[cliente.lingua || ''] ? (
                      <span className="px-2 py-0.5 rounded text-white text-[10px] font-semibold flex-shrink-0" style={{ backgroundColor: LINGUA_COLORS[cliente.lingua || ''] }}>
                        {cliente.lingua}
                      </span>
                    ) : undefined}
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

              {/* Tracking / CRM Section - new fields from spreadsheet */}
              <div className="space-y-2">
                <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground border-b pb-1">Tracking CRM</h3>
                
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-0.5">Portale di provenienza</label>
                <InlineEditSelect
                    value={cliente.portale}
                    options={[
                      { value: 'James Edition', label: 'James Edition' },
                      { value: 'Idealista', label: 'Idealista' },
                      { value: 'Gate-away', label: 'Gate-away' },
                      { value: 'Sito Cortesi', label: 'Sito Cortesi' },
                      { value: 'Immobiliare.it', label: 'Immobiliare.it' },
                      { value: 'Rightmove', label: 'Rightmove' },
                      { value: 'TALLY', label: 'TALLY' },
                      { value: 'Altro', label: 'Altro' },
                    ]}
                    onSave={(value) => onUpdate({ portale: value })}
                    placeholder="Non specificato"
                    className="text-sm"
                    prefix={PORTALE_COLORS[cliente.portale || ''] ? (
                      <span className="px-2 py-0.5 rounded text-white text-[10px] font-semibold flex-shrink-0" style={{ backgroundColor: PORTALE_COLORS[cliente.portale || ''] }}>
                        {cliente.portale}
                      </span>
                    ) : undefined}
                  />
                </div>

                <div>
                  <label className="text-[10px] text-muted-foreground block mb-0.5">Proprietà richiesta</label>
                  <InlineEditText
                    value={cliente.property_name}
                    onSave={(value) => onUpdate({ property_name: value })}
                    placeholder="Non specificato"
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-muted-foreground block mb-0.5">Ref.</label>
                  <InlineEditText
                    value={cliente.ref_number}
                    onSave={(value) => onUpdate({ ref_number: value })}
                    placeholder="Non specificato"
                    className="text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-muted-foreground block mb-0.5">Contattato da</label>
                  <InlineEditText
                    value={cliente.contattato_da}
                    onSave={(value) => onUpdate({ contattato_da: value })}
                    placeholder="Non specificato"
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-muted-foreground block mb-0.5">Tipo contatto</label>
                <InlineEditSelect
                    value={cliente.tipo_contatto}
                    options={[
                      { value: 'Mail', label: 'Mail' },
                      { value: 'WhatsApp', label: 'WhatsApp' },
                      { value: 'Call', label: 'Call' },
                      { value: 'Idealista', label: 'Idealista' },
                      { value: 'Sito Cortesi', label: 'Sito Cortesi' },
                    ]}
                    onSave={(value) => onUpdate({ tipo_contatto: value })}
                    placeholder="Non specificato"
                    className="text-sm"
                    prefix={TIPO_CONTATTO_COLORS[cliente.tipo_contatto || ''] ? (
                      <span className="px-2 py-0.5 rounded text-white text-[10px] font-semibold flex-shrink-0" style={{ backgroundColor: TIPO_CONTATTO_COLORS[cliente.tipo_contatto || ''] }}>
                        {cliente.tipo_contatto}
                      </span>
                    ) : undefined}
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
            </div>
          </div>

          {/* COLUMN 3: Property details + Features + Properties */}
          <div className="space-y-3">
            <div className="bg-white rounded-2xl shadow-lg p-3 space-y-3">
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

              {/* Description Section */}
              <div className="space-y-2">
                <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground border-b pb-1">Descrizione</h3>
                
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
              </div>
            </div>

            {/* Property Matches Section */}
            <div className="lg:hidden">
              <PropertyMatchesSection clienteId={cliente.id} clientePhone={cliente.telefono} noteExtra={cliente.note_extra} />
            </div>
          </div>

          {/* Full-width sections at bottom */}
          <div className="lg:col-span-3 space-y-3">
            {/* Legacy Comments Display (if any exist) */}
            {cliente.comments.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-3">
                <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Commenti Precedenti
                </h3>
                <div className="space-y-3">
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
              </div>
            )}

            {/* Metadata */}
            <div className="text-xs text-muted-foreground bg-white rounded-2xl shadow-lg p-3 space-y-1">
              <p>Creato: {format(new Date(cliente.created_at), 'dd MMM yyyy HH:mm', { locale: it })}</p>
              {cliente.data_submission && (
                <p>Submission: {format(new Date(cliente.data_submission), 'dd MMM yyyy HH:mm', { locale: it })}</p>
              )}
              {cliente.tally_submission_id && (
                <p className="font-mono text-[10px]">ID: {cliente.tally_submission_id}</p>
              )}
            </div>

            {/* Delete */}
            <div>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ClienteDetail;
