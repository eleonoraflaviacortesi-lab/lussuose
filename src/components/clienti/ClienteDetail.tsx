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
import { Separator } from '@/components/ui/separator';
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

  if (!cliente) return null;

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment(newComment.trim());
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
      <DialogContent className="max-w-lg w-[95vw] max-h-[85vh] overflow-y-auto p-4 sm:p-6 rounded-3xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{cliente.emoji}</span>
            <div className="flex-1 min-w-0">
              <InlineEditText
                value={cliente.nome}
                onSave={(value) => onUpdate({ nome: value })}
                className="text-lg font-semibold"
                placeholder="Nome cliente"
              />
              <InlineEditText
                value={cliente.paese}
                onSave={(value) => onUpdate({ paese: value })}
                className="text-xs text-muted-foreground"
                placeholder="Paese"
                prefix={<MapPin className="h-3 w-3" />}
              />
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-3">
          {/* Assignment */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Assegnato a</label>
            <Select
              value={cliente.assigned_to || 'unassigned'}
              onValueChange={(v) => onAssign(v === 'unassigned' ? null : v)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue>
                  {assignedAgent ? (
                    <div className="flex items-center gap-2">
                      <span>{assignedAgent.avatar_emoji}</span>
                      {assignedAgent.full_name}
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

          {/* Contact Info - Liquid glass card */}
          <div className="bg-white rounded-2xl shadow-lg p-3 space-y-1.5">
            <h3 className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-2">Contatti</h3>
            <InlineEditText
              value={cliente.telefono}
              onSave={(value) => onUpdate({ telefono: value })}
              placeholder="Aggiungi telefono"
              prefix={<Phone className="w-3.5 h-3.5 text-muted-foreground" />}
              className="text-sm"
            />
            <InlineEditText
              value={cliente.email}
              onSave={(value) => onUpdate({ email: value })}
              placeholder="Aggiungi email"
              prefix={<Mail className="w-3.5 h-3.5 text-muted-foreground" />}
              className="text-sm"
            />
          </div>

          {/* Budget & Timeline - Liquid glass cards side by side */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white rounded-2xl shadow-lg p-3">
              <h3 className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                <Euro className="w-3 h-3" /> Budget
              </h3>
              <InlineEditNumber
                value={cliente.budget_max}
                onSave={(value) => onUpdate({ budget_max: value })}
                placeholder="€..."
                className="text-base font-semibold"
                formatDisplay={formatBudget}
              />
              <InlineEditSelect
                value={cliente.mutuo}
                options={YES_NO_OPTIONS}
                onSave={(value) => onUpdate({ mutuo: value })}
                placeholder="Mutuo?"
                className="text-[10px] text-muted-foreground"
                prefix={<span>Mutuo:</span>}
              />
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-3">
              <h3 className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Timeline
              </h3>
              <InlineEditText
                value={cliente.tempo_ricerca}
                onSave={(value) => onUpdate({ tempo_ricerca: value })}
                placeholder="Tempo"
                className="text-sm"
              />
              <InlineEditBoolean
                value={cliente.ha_visitato}
                onSave={(value) => onUpdate({ ha_visitato: value })}
                labelTrue="Ha visitato"
                labelFalse="Non visitato"
                className="text-[10px]"
              />
            </div>
          </div>

          {/* Location Preferences - Liquid glass */}
          <div className="bg-white rounded-2xl shadow-lg p-3">
            <h3 className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Località
            </h3>
            <InlineEditBadges
              values={cliente.regioni}
              onSave={(values) => onUpdate({ regioni: values })}
              placeholder="Regioni"
              variant="secondary"
            />
            <InlineEditBadges
              values={cliente.contesto}
              onSave={(values) => onUpdate({ contesto: values })}
              placeholder="Contesto"
              variant="outline"
            />
            <InlineEditBoolean
              value={cliente.vicinanza_citta}
              onSave={(value) => onUpdate({ vicinanza_citta: value })}
              labelTrue="Vicino città"
              labelFalse="Non vicino città"
              className="text-[10px] mt-1"
            />
          </div>

          {/* Property Preferences - Compact liquid glass */}
          <div className="bg-white rounded-2xl shadow-lg p-3">
            <h3 className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
              <Home className="w-3 h-3" /> Tipologia
            </h3>
            <InlineEditBadges
              values={cliente.tipologia}
              onSave={(values) => onUpdate({ tipologia: values })}
              placeholder="Tipologie"
              variant="outline"
            />
            <div className="grid grid-cols-2 gap-1.5 text-[10px] mt-2">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Stile:</span>
                <InlineEditText
                  value={cliente.stile}
                  onSave={(value) => onUpdate({ stile: value })}
                  placeholder="-"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Camere:</span>
                <InlineEditText
                  value={cliente.camere}
                  onSave={(value) => onUpdate({ camere: value })}
                  placeholder="-"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Bagni:</span>
                <InlineEditNumber
                  value={cliente.bagni}
                  onSave={(value) => onUpdate({ bagni: value })}
                  placeholder="-"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">mq:</span>
                <InlineEditNumber
                  value={cliente.dimensioni_min}
                  onSave={(value) => onUpdate({ dimensioni_min: value })}
                  placeholder="-"
                />
                <span>-</span>
                <InlineEditNumber
                  value={cliente.dimensioni_max}
                  onSave={(value) => onUpdate({ dimensioni_max: value })}
                  placeholder="-"
                />
              </div>
            </div>
          </div>

          {/* Features - Compact row */}
          <div className="bg-white rounded-2xl shadow-lg p-3">
            <h3 className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-2">Caratteristiche</h3>
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50">
                <Droplets className="w-3 h-3 text-blue-500" />
                <InlineEditSelect
                  value={cliente.piscina}
                  options={YES_NO_OPTIONS}
                  onSave={(value) => onUpdate({ piscina: value })}
                  placeholder="Piscina"
                  className="text-[10px]"
                />
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-50">
                <Trees className="w-3 h-3 text-green-500" />
                <InlineEditSelect
                  value={cliente.terreno}
                  options={YES_NO_OPTIONS}
                  onSave={(value) => onUpdate({ terreno: value })}
                  placeholder="Terreno"
                  className="text-[10px]"
                />
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-50">
                <Home className="w-3 h-3 text-purple-500" />
                <InlineEditSelect
                  value={cliente.dependance}
                  options={YES_NO_OPTIONS}
                  onSave={(value) => onUpdate({ dependance: value })}
                  placeholder="Dep."
                  className="text-[10px]"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2 text-[10px]">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Uso:</span>
                <InlineEditText
                  value={cliente.uso}
                  onSave={(value) => onUpdate({ uso: value })}
                  placeholder="-"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Affitto:</span>
                <InlineEditSelect
                  value={cliente.interesse_affitto}
                  options={YES_NO_OPTIONS}
                  onSave={(value) => onUpdate({ interesse_affitto: value })}
                  placeholder="-"
                />
              </div>
            </div>
          </div>

          {/* Notes - Collapsible */}
          <div className="bg-white rounded-2xl shadow-lg p-3">
            <h3 className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-2">Note</h3>
            <InlineEditText
              value={cliente.descrizione}
              onSave={(value) => onUpdate({ descrizione: value })}
              placeholder="Descrizione..."
              multiline
              className="text-xs"
            />
            <InlineEditText
              value={cliente.note_extra}
              onSave={(value) => onUpdate({ note_extra: value })}
              placeholder="Note extra..."
              multiline
              className="text-xs text-muted-foreground mt-1"
            />
          </div>

          {/* Property Matches Section */}
          <Separator />
          <PropertyMatchesSection clienteId={cliente.id} clientePhone={cliente.telefono} />

          {/* Comments */}
          <div className="border-t pt-4">
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
          <div className="text-xs text-muted-foreground border-t pt-4 space-y-1">
            <p>Creato: {format(new Date(cliente.created_at), 'dd MMM yyyy HH:mm', { locale: it })}</p>
            {cliente.data_submission && (
              <p>Submission: {format(new Date(cliente.data_submission), 'dd MMM yyyy HH:mm', { locale: it })}</p>
            )}
            {cliente.tally_submission_id && (
              <p className="font-mono text-[10px]">ID: {cliente.tally_submission_id}</p>
            )}
          </div>

          {/* Delete */}
          <div className="border-t pt-4">
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
      </DialogContent>
    </Dialog>
  );
}

export default ClienteDetail;
