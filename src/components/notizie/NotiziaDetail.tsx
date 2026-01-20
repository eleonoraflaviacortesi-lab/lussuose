import { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Phone, MapPin, FileText, Calendar, Clock, Tag, Bell, X, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Notizia, NotiziaStatus, useNotizie } from '@/hooks/useNotizie';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface NotiziaDetailProps {
  notizia: Notizia | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors: Record<NotiziaStatus, string> = {
  new: 'bg-yellow-500 text-yellow-950',
  in_progress: 'bg-amber-600 text-amber-950',
  done: 'bg-purple-600 text-purple-950',
  on_shot: 'bg-pink-600 text-pink-950',
  taken: 'bg-muted text-muted-foreground',
};

const statusLabels: Record<NotiziaStatus, string> = {
  new: 'New',
  in_progress: 'In Progress',
  done: 'Done',
  on_shot: 'On Shot',
  taken: 'Taken',
};

const NotiziaDetail = ({ notizia, open, onOpenChange }: NotiziaDetailProps) => {
  const { updateNotizia, deleteNotizia } = useNotizie();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Notizia>>({});

  if (!notizia) return null;

  const handleEdit = () => {
    setEditData({
      name: notizia.name,
      zona: notizia.zona || '',
      phone: notizia.phone || '',
      type: notizia.type || '',
      notes: notizia.notes || '',
      status: notizia.status,
      reminder_date: notizia.reminder_date?.slice(0, 16) || '',
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateNotizia.mutate({
      id: notizia.id,
      ...editData,
      reminder_date: editData.reminder_date || null,
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteNotizia.mutate(notizia.id);
    onOpenChange(false);
  };

  const handlePhoneClick = () => {
    if (notizia.phone) {
      window.location.href = `tel:${notizia.phone}`;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="text-left">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-bold pr-8">
              {isEditing ? (
                <Input
                  value={editData.name || ''}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="text-xl font-bold"
                />
              ) : (
                notizia.name
              )}
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Status */}
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-muted-foreground" />
            <span className="text-muted-foreground w-24">Status</span>
            {isEditing ? (
              <Select
                value={editData.status}
                onValueChange={(value) => setEditData({ ...editData, status: value as NotiziaStatus })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge className={cn('text-xs', statusColors[notizia.status])}>
                {statusLabels[notizia.status]}
              </Badge>
            )}
          </div>

          {/* Zona */}
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground w-24">Zona</span>
            {isEditing ? (
              <Input
                value={editData.zona || ''}
                onChange={(e) => setEditData({ ...editData, zona: e.target.value })}
                placeholder="Inserisci zona"
                className="flex-1"
              />
            ) : (
              <Badge variant="secondary">{notizia.zona || 'Non specificata'}</Badge>
            )}
          </div>

          {/* Notes */}
          <div className="flex items-start gap-3">
            <FileText className="w-4 h-4 text-muted-foreground mt-1" />
            <span className="text-muted-foreground w-24">Note</span>
            {isEditing ? (
              <Textarea
                value={editData.notes || ''}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                placeholder="Aggiungi note"
                className="flex-1"
              />
            ) : (
              <span className="text-foreground flex-1">{notizia.notes || 'Nessuna nota'}</span>
            )}
          </div>

          {/* Created Date */}
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground w-24">Creata</span>
            <span className="text-foreground">
              {format(new Date(notizia.created_at), 'd MMMM yyyy', { locale: it })}
            </span>
          </div>

          {/* Phone - Clickable */}
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground w-24">Telefono</span>
            {isEditing ? (
              <Input
                value={editData.phone || ''}
                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                placeholder="Numero di telefono"
                type="tel"
                className="flex-1"
              />
            ) : notizia.phone ? (
              <button
                onClick={handlePhoneClick}
                className="text-primary underline hover:text-primary/80 transition-colors"
              >
                {notizia.phone}
              </button>
            ) : (
              <span className="text-muted-foreground italic">Non disponibile</span>
            )}
          </div>

          {/* Type */}
          <div className="flex items-center gap-3">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground w-24">Tipo</span>
            {isEditing ? (
              <Input
                value={editData.type || ''}
                onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                placeholder="Es: Villa, Casale, Appartamento"
                className="flex-1"
              />
            ) : notizia.type ? (
              <Badge variant="outline" className="bg-amber-600/20 text-amber-300 border-0">
                {notizia.type}
              </Badge>
            ) : (
              <span className="text-muted-foreground italic">Non specificato</span>
            )}
          </div>

          {/* Last Edited */}
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground w-24">Modificata</span>
            <span className="text-foreground">
              {format(new Date(notizia.updated_at), 'd MMMM yyyy', { locale: it })}
            </span>
          </div>

          {/* Reminder */}
          <div className="flex items-center gap-3">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground w-24">Promemoria</span>
            {isEditing ? (
              <Input
                type="datetime-local"
                value={editData.reminder_date || ''}
                onChange={(e) => setEditData({ ...editData, reminder_date: e.target.value })}
                className="flex-1"
              />
            ) : notizia.reminder_date ? (
              <span className="text-foreground">
                {format(new Date(notizia.reminder_date), 'd MMMM yyyy, HH:mm', { locale: it })}
              </span>
            ) : (
              <span className="text-muted-foreground italic">Nessun promemoria</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} className="flex-1">
                Salva
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Annulla
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleEdit} className="flex-1">
                Modifica
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminare questa notizia?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Questa azione non può essere annullata. La notizia verrà eliminata permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Elimina</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NotiziaDetail;
