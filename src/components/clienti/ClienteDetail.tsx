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
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ClienteDetailProps {
  cliente: Cliente | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agents: Array<{ user_id: string; full_name: string; avatar_emoji: string }>;
  onAssign: (agentId: string | null) => void;
  onAddComment: (comment: string) => void;
  onDelete: () => void;
}


export function ClienteDetail({
  cliente,
  open,
  onOpenChange,
  agents,
  onAssign,
  onAddComment,
  onDelete,
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

  const formatBudget = (budget: number | null) => {
    if (!budget) return 'Non specificato';
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(budget);
  };

  const assignedAgent = agents.find(a => a.user_id === cliente.assigned_to);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{cliente.emoji}</span>
            <div>
              <DialogTitle className="text-xl">{cliente.nome}</DialogTitle>
              {cliente.paese && (
                <p className="text-sm text-muted-foreground">{cliente.paese}</p>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Assignment Only */}
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

          {/* Contact Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h3 className="font-medium text-sm mb-3">Contatti</h3>
            {cliente.telefono && (
              <a 
                href={`tel:${cliente.telefono}`} 
                className="flex items-center gap-2 text-sm hover:text-primary"
              >
                <Phone className="w-4 h-4" />
                {cliente.telefono}
              </a>
            )}
            {cliente.email && (
              <a 
                href={`mailto:${cliente.email}`} 
                className="flex items-center gap-2 text-sm hover:text-primary"
              >
                <Mail className="w-4 h-4" />
                {cliente.email}
              </a>
            )}
          </div>

          {/* Budget & Timeline */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Euro className="w-4 h-4" /> Budget
              </h3>
              <p className="text-lg font-semibold">{formatBudget(cliente.budget_max)}</p>
              {cliente.mutuo && (
                <p className="text-xs text-muted-foreground mt-1">
                  Mutuo: {cliente.mutuo}
                </p>
              )}
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Timeline
              </h3>
              <p className="text-sm">{cliente.tempo_ricerca || 'Non specificato'}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {cliente.ha_visitato ? '✓ Ha già visitato' : 'Non ha ancora visitato'}
              </p>
            </div>
          </div>

          {/* Location Preferences */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Preferenze Località
            </h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {cliente.regioni.map(r => (
                <Badge key={r} variant="secondary">{r}</Badge>
              ))}
            </div>
            {cliente.contesto.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Contesto: {cliente.contesto.join(', ')}
              </p>
            )}
            {cliente.vicinanza_citta && (
              <p className="text-xs text-muted-foreground mt-1">
                ✓ Vicino a città/aeroporti
              </p>
            )}
          </div>

          {/* Property Preferences */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
              <Home className="w-4 h-4" /> Tipologia Ricercata
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {cliente.tipologia.map(t => (
                <Badge key={t} variant="outline">{t}</Badge>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {cliente.stile && <p>Stile: {cliente.stile}</p>}
              {cliente.camere && <p>Camere: {cliente.camere}</p>}
              {cliente.bagni && <p>Bagni: {cliente.bagni}</p>}
              {cliente.layout && <p>Layout: {cliente.layout}</p>}
              {(cliente.dimensioni_min || cliente.dimensioni_max) && (
                <p>
                  Dimensioni: {cliente.dimensioni_min || '?'} - {cliente.dimensioni_max || '?'} mq
                </p>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-3">
            {cliente.piscina && (
              <div className="flex items-center gap-1.5 text-sm bg-blue-100 text-blue-800 rounded-full px-3 py-1">
                <Droplets className="w-3.5 h-3.5" />
                Piscina: {cliente.piscina}
              </div>
            )}
            {cliente.terreno && (
              <div className="flex items-center gap-1.5 text-sm bg-green-100 text-green-800 rounded-full px-3 py-1">
                <Trees className="w-3.5 h-3.5" />
                Terreno: {cliente.terreno}
              </div>
            )}
            {cliente.dependance && (
              <div className="flex items-center gap-1.5 text-sm bg-purple-100 text-purple-800 rounded-full px-3 py-1">
                <Home className="w-3.5 h-3.5" />
                Dependance: {cliente.dependance}
              </div>
            )}
          </div>

          {/* Usage */}
          {(cliente.uso || cliente.interesse_affitto) && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium text-sm mb-2">Utilizzo Previsto</h3>
              {cliente.uso && <p className="text-sm">Uso: {cliente.uso}</p>}
              {cliente.interesse_affitto && (
                <p className="text-xs text-muted-foreground">
                  Interesse affitto: {cliente.interesse_affitto}
                </p>
              )}
            </div>
          )}

          {/* Notes from form */}
          {(cliente.descrizione || cliente.note_extra) && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium text-sm mb-2">Note dal Form</h3>
              {cliente.descrizione && (
                <p className="text-sm whitespace-pre-wrap">{cliente.descrizione}</p>
              )}
              {cliente.note_extra && (
                <p className="text-sm mt-2 text-muted-foreground whitespace-pre-wrap">
                  {cliente.note_extra}
                </p>
              )}
            </div>
          )}

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
