import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Phone, MapPin, FileText, Calendar, Clock, Tag, Bell, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

const commonEmojis = ['📋', '🏠', '🏡', '🏰', '🏛️', '🌳', '⭐', '💎', '🔑', '📍', '🌸', '🌺', '🌻', '🍀', '✨', '💫', '🎯', '🔥', '💰', '🏆'];

interface NotiziaDetailProps {
  notizia: Notizia | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors: Record<NotiziaStatus, string> = {
  new: 'bg-yellow-200 text-yellow-900',
  in_progress: 'bg-yellow-400 text-yellow-950',
  done: 'bg-orange-400 text-orange-950',
  on_shot: 'bg-red-400 text-red-950',
  taken: 'bg-green-200 text-green-900',
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
  const [editData, setEditData] = useState<Partial<Notizia>>({});

  // Inizializza editData quando cambia la notizia
  useEffect(() => {
    if (notizia) {
      setEditData({
        name: notizia.name,
        zona: notizia.zona || '',
        phone: notizia.phone || '',
        type: notizia.type || '',
        notes: notizia.notes || '',
        status: notizia.status,
        emoji: notizia.emoji || '📋',
        reminder_date: notizia.reminder_date?.slice(0, 16) || '',
      });
    }
  }, [notizia]);

  if (!notizia) return null;
  if (!open) return null;

  const handleSave = () => {
    updateNotizia.mutate({
      id: notizia.id,
      ...editData,
      emoji: editData.emoji || '📋',
      reminder_date: editData.reminder_date || null,
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    deleteNotizia.mutate(notizia.id);
    onOpenChange(false);
  };

  const handlePhoneClick = () => {
    if (editData.phone) {
      window.location.href = `tel:${editData.phone}`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Modal - Liquid Glass Style */}
      <div className="relative w-full max-w-md bg-background/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 animate-scale-in overflow-hidden">
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full active:scale-95 transition-transform"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="p-6 max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            {/* Emoji Selector */}
            <Popover>
              <PopoverTrigger asChild>
                <button 
                  type="button"
                  className="w-14 h-14 bg-muted/50 rounded-xl flex items-center justify-center text-3xl active:scale-95 transition-transform border border-primary/20"
                >
                  {editData.emoji || '📋'}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2 bg-background/90 backdrop-blur-xl border border-white/10" align="start">
                <div className="grid grid-cols-5 gap-1">
                  {commonEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setEditData({ ...editData, emoji })}
                      className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-lg active:scale-95 transition-transform",
                        editData.emoji === emoji && "bg-accent"
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            
            {/* Name Input */}
            <Input
              value={editData.name || ''}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="text-xl font-bold bg-transparent border-muted/50 focus:border-primary/50"
              placeholder="Nome notizia"
            />
          </div>

          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-muted-foreground" />
              <span className="text-muted-foreground w-24 text-sm">Status</span>
              <Select
                value={editData.status}
                onValueChange={(value) => setEditData({ ...editData, status: value as NotiziaStatus })}
              >
                <SelectTrigger className="w-32 bg-muted/30 border-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background/90 backdrop-blur-xl border border-white/10">
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Zona */}
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground w-24 text-sm">Zona</span>
              <Input
                value={editData.zona || ''}
                onChange={(e) => setEditData({ ...editData, zona: e.target.value })}
                placeholder="Inserisci zona"
                className="flex-1 bg-muted/30 border-muted/50"
              />
            </div>

            {/* Notes */}
            <div className="flex items-start gap-3">
              <FileText className="w-4 h-4 text-muted-foreground mt-2" />
              <span className="text-muted-foreground w-24 text-sm mt-2">Note</span>
              <Textarea
                value={editData.notes || ''}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                placeholder="Aggiungi note"
                className="flex-1 bg-muted/30 border-muted/50 min-h-[80px]"
              />
            </div>

            {/* Created Date - Read only */}
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground w-24 text-sm">Creata</span>
              <span className="text-foreground text-sm">
                {format(new Date(notizia.created_at), 'd MMMM yyyy', { locale: it })}
              </span>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground w-24 text-sm">Telefono</span>
              <div className="flex-1 flex gap-2">
                <Input
                  value={editData.phone || ''}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  placeholder="Numero di telefono"
                  type="tel"
                  className="flex-1 bg-muted/30 border-muted/50"
                />
                {editData.phone && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePhoneClick}
                    className="active:scale-95 transition-transform bg-muted/30 border-muted/50"
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Type */}
            <div className="flex items-center gap-3">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground w-24 text-sm">Tipo</span>
              <Input
                value={editData.type || ''}
                onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                placeholder="Es: Villa, Casale, Appartamento"
                className="flex-1 bg-muted/30 border-muted/50"
              />
            </div>

            {/* Last Edited - Read only */}
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground w-24 text-sm">Modificata</span>
              <span className="text-foreground text-sm">
                {format(new Date(notizia.updated_at), 'd MMMM yyyy', { locale: it })}
              </span>
            </div>

            {/* Reminder */}
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground w-24 text-sm">Promemoria</span>
              <Input
                type="datetime-local"
                value={editData.reminder_date || ''}
                onChange={(e) => setEditData({ ...editData, reminder_date: e.target.value })}
                className="flex-1 bg-muted/30 border-muted/50"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex gap-2">
            <Button onClick={handleSave} className="flex-1 active:scale-[0.98] transition-transform">
              Salva
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="active:scale-[0.98] transition-transform bg-muted/30 border-muted/50">
              Annulla
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon" className="active:scale-95 transition-transform">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-background/90 backdrop-blur-xl border border-white/10">
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminare questa notizia?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Questa azione non può essere annullata. La notizia verrà eliminata permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="active:scale-[0.98] transition-transform">Annulla</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="active:scale-[0.98] transition-transform">Elimina</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotiziaDetail;
