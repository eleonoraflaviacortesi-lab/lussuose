import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Phone, X, Trash2, CalendarIcon, Bell, ExternalLink, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Notizia, NotiziaStatus, NotiziaComment, useNotizie } from '@/hooks/useNotizie';
import { cn } from '@/lib/utils';
import { generateNotiziaCalendarUrl } from '@/lib/googleCalendar';
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

const pillInputClass = "w-full bg-white rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-0 focus:outline-none focus:ring-2 focus:ring-primary/20";
const pillTextareaClass = "w-full bg-white rounded-2xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none";
const liquidGlassPopover = "bg-white/95 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border-0 rounded-2xl";

const commonEmojis = ['📋', '🏠', '🏡', '🏰', '🏛️', '🌳', '⭐', '💎', '🔑', '📍', '🌸', '🌺', '🌻', '🍀', '✨', '💫', '🎯', '🔥', '💰', '🏆', '🌊', '🏖️', '🌅', '🌄', '🏔️', '🌲', '🌴', '🌷', '🌹', '💐', '🎨', '🎭', '🎪', '🎢', '🎡'];

interface NotiziaDetailProps {
  notizia: Notizia | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusLabels: Record<NotiziaStatus, string> = {
  new: 'New',
  in_progress: 'In Progress',
  done: 'Done',
  on_shot: 'On Shot',
  taken: 'Taken',
  no: 'No',
  sold: 'Sold',
};

const NotiziaDetail = ({ notizia, open, onOpenChange }: NotiziaDetailProps) => {
  const { updateNotizia, deleteNotizia } = useNotizie();
  const [customEmoji, setCustomEmoji] = useState('');
  const [newComment, setNewComment] = useState('');
  const [editData, setEditData] = useState({
    name: '',
    zona: '',
    phone: '',
    type: '',
    notes: '',
    status: 'new' as NotiziaStatus,
    emoji: '📋',
    reminder_date: null as Date | null,
    reminder_time: '09:00',
    comments: [] as NotiziaComment[],
  });

  // Inizializza editData quando cambia la notizia
  useEffect(() => {
    if (notizia) {
      const reminderDate = notizia.reminder_date ? new Date(notizia.reminder_date) : null;
      setEditData({
        name: notizia.name,
        zona: notizia.zona || '',
        phone: notizia.phone || '',
        type: notizia.type || '',
        notes: notizia.notes || '',
        status: notizia.status,
        emoji: notizia.emoji || '📋',
        reminder_date: reminderDate,
        reminder_time: reminderDate ? format(reminderDate, 'HH:mm') : '09:00',
        comments: notizia.comments || [],
      });
      setNewComment('');
    }
  }, [notizia]);

  if (!notizia || !open) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData.name.trim()) return;
    
    let reminderDateTime: string | null = null;
    if (editData.reminder_date) {
      const [hours, minutes] = editData.reminder_time.split(':');
      const reminderDate = new Date(editData.reminder_date);
      reminderDate.setHours(parseInt(hours), parseInt(minutes));
      reminderDateTime = reminderDate.toISOString();
    }
    
    updateNotizia.mutate({
      id: notizia.id,
      name: editData.name,
      zona: editData.zona || undefined,
      phone: editData.phone || undefined,
      type: editData.type || undefined,
      notes: editData.notes || undefined,
      status: editData.status,
      emoji: editData.emoji || '📋',
      reminder_date: reminderDateTime,
      comments: editData.comments,
    });
    onOpenChange(false);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment: NotiziaComment = {
      id: crypto.randomUUID(),
      text: newComment.trim(),
      created_at: new Date().toISOString(),
    };
    setEditData({ ...editData, comments: [...editData.comments, comment] });
    setNewComment('');
  };

  const handleDeleteComment = (commentId: string) => {
    setEditData({ 
      ...editData, 
      comments: editData.comments.filter(c => c.id !== commentId) 
    });
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

  const handleCustomEmojiSubmit = () => {
    if (customEmoji.trim()) {
      setEditData({ ...editData, emoji: customEmoji.trim() });
      setCustomEmoji('');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={() => onOpenChange(false)}
    >
      {/* Blur backdrop */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-md" />
      
      {/* Compact floating card - same style as AddNotiziaDialog */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative z-10 w-full max-w-sm",
          "bg-white/85 backdrop-blur-2xl",
          "rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]",
          "p-5 animate-in zoom-in-95 fade-in duration-200",
          "max-h-[90vh] overflow-y-auto"
        )}
      >
        {/* Close button */}
        <button 
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 text-muted-foreground active:scale-95 transition-transform"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <h3 className="text-center text-base font-bold tracking-wide uppercase mb-4">
          Modifica Notizia
        </h3>

        <form onSubmit={handleSave} className="space-y-3">
          {/* Emoji + Name row */}
          <div className="flex gap-2">
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Emoji</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <button 
                    type="button"
                    className="w-12 h-10 bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] flex items-center justify-center text-lg active:scale-95 transition-transform"
                  >
                    {editData.emoji}
                  </button>
                </PopoverTrigger>
                <PopoverContent className={cn(liquidGlassPopover, "w-auto p-3")} align="start">
                  {/* Custom emoji input */}
                  <div className="flex gap-2 mb-3">
                    <input
                      value={customEmoji}
                      onChange={(e) => setCustomEmoji(e.target.value)}
                      placeholder="Incolla emoji..."
                      className="flex-1 bg-white rounded-full px-3 py-1.5 text-sm shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-0 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCustomEmojiSubmit}
                      className="px-3 py-1.5 bg-primary text-primary-foreground rounded-full text-xs font-medium active:scale-95 transition-transform"
                    >
                      Usa
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
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
            </div>
            <div className="flex-1">
              <Label htmlFor="edit-name" className="text-xs font-medium mb-1.5 block">Nome proprietà *</Label>
              <input
                id="edit-name"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                placeholder="Es: Villa Serenity"
                required
                className={pillInputClass}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="edit-zona" className="text-xs font-medium mb-1.5 block">Zona</Label>
              <input
                id="edit-zona"
                value={editData.zona}
                onChange={(e) => setEditData({ ...editData, zona: e.target.value })}
                placeholder="Es: Umbertide"
                className={pillInputClass}
              />
            </div>
            <div>
              <Label htmlFor="edit-type" className="text-xs font-medium mb-1.5 block">Tipo</Label>
              <input
                id="edit-type"
                value={editData.type}
                onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                placeholder="Es: Casale"
                className={pillInputClass}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="edit-phone" className="text-xs font-medium mb-1.5 block">Telefono</Label>
            <div className="flex gap-2">
              <input
                id="edit-phone"
                type="tel"
                value={editData.phone}
                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                placeholder="+39 333 1234567"
                className={cn(pillInputClass, "flex-1")}
              />
              {editData.phone && (
                <button
                  type="button"
                  onClick={handlePhoneClick}
                  className="w-10 h-10 bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] flex items-center justify-center active:scale-95 transition-transform"
                >
                  <Phone className="w-4 h-4 text-primary" />
                </button>
              )}
            </div>
          </div>
          
          <div>
            <Label htmlFor="edit-status" className="text-xs font-medium mb-1.5 block">Status</Label>
            <Select
              value={editData.status}
              onValueChange={(value) => setEditData({ ...editData, status: value as NotiziaStatus })}
            >
              <SelectTrigger className="bg-white rounded-full px-4 py-2.5 h-auto text-sm shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={cn(liquidGlassPopover, "rounded-xl")}>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="edit-notes" className="text-xs font-medium mb-1.5 block">Note</Label>
            <textarea
              id="edit-notes"
              value={editData.notes}
              onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
              placeholder="Aggiungi note..."
              rows={2}
              className={pillTextareaClass}
            />
          </div>

          {/* Comments Section */}
          <div>
            <Label className="text-xs font-medium mb-1.5 block">Commenti</Label>
            {/* Existing comments */}
            {editData.comments.length > 0 && (
              <div className="space-y-2 mb-2 max-h-32 overflow-y-auto">
                {editData.comments.map((comment) => (
                  <div 
                    key={comment.id}
                    className="bg-white/60 rounded-xl px-3 py-2 text-sm flex items-start gap-2 group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground leading-snug">{comment.text}</p>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(comment.created_at), 'd MMM, HH:mm', { locale: it })}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {/* New comment input */}
            <div className="flex gap-2">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Aggiungi un commento..."
                className={cn(pillInputClass, "flex-1")}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="w-10 h-10 bg-foreground text-background rounded-full flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs font-medium mb-1.5 block text-muted-foreground">Creata</Label>
              <div className="bg-muted/30 rounded-full px-4 py-2.5 text-sm text-muted-foreground">
                {format(new Date(notizia.created_at), 'd MMM yyyy', { locale: it })}
              </div>
            </div>
            
            {/* Promemoria - Custom Calendar + Time */}
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Promemoria</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "w-full bg-white rounded-full px-4 py-2.5 text-sm shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-0 flex items-center gap-2 active:scale-[0.98] transition-transform",
                      !editData.reminder_date && "text-muted-foreground"
                    )}
                  >
                    <Bell className="w-4 h-4" />
                    {editData.reminder_date ? format(editData.reminder_date, 'd MMM', { locale: it }) : 'Seleziona'}
                  </button>
                </PopoverTrigger>
                <PopoverContent className={cn(liquidGlassPopover, "w-auto p-0")} align="start">
                  <Calendar
                    mode="single"
                    selected={editData.reminder_date || undefined}
                    onSelect={(date) => setEditData({ ...editData, reminder_date: date || null })}
                    locale={it}
                    className="pointer-events-auto"
                  />
                  <div className="p-3 border-t border-muted/20">
                    <Label className="text-xs font-medium mb-1.5 block">Ora</Label>
                    <input
                      type="time"
                      value={editData.reminder_time}
                      onChange={(e) => setEditData({ ...editData, reminder_time: e.target.value })}
                      className="w-full bg-white rounded-full px-4 py-2 text-sm shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-0 focus:outline-none"
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Google Calendar Button */}
          <button
            type="button"
            onClick={() => {
              // First save the notizia
              let reminderDateTime: string | null = null;
              const [hours, minutes] = editData.reminder_time.split(':');
              const reminderDate = editData.reminder_date 
                ? new Date(editData.reminder_date)
                : new Date();
              reminderDate.setHours(parseInt(hours), parseInt(minutes));
              
              if (editData.reminder_date) {
                reminderDateTime = reminderDate.toISOString();
              }
              
              updateNotizia.mutate({
                id: notizia.id,
                name: editData.name,
                zona: editData.zona || undefined,
                phone: editData.phone || undefined,
                type: editData.type || undefined,
                notes: editData.notes || undefined,
                status: editData.status,
                emoji: editData.emoji || '📋',
                reminder_date: reminderDateTime,
              });
              
              // Then open Google Calendar
              const url = generateNotiziaCalendarUrl({
                name: editData.name,
                emoji: editData.emoji,
                zona: editData.zona || undefined,
                type: editData.type || undefined,
                phone: editData.phone || undefined,
                notes: editData.notes || undefined,
                reminder_date: reminderDate,
              });
              window.open(url, '_blank');
            }}
            className="w-full flex items-center justify-center gap-2 bg-foreground text-background rounded-full px-4 py-2.5 text-sm font-medium shadow-[0_2px_8px_rgba(0,0,0,0.15)] active:scale-[0.98] transition-transform hover:opacity-90"
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Aggiungi a Google Calendar</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </button>
          
          <div className="flex justify-center gap-2 pt-3">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="rounded-full px-5 text-sm active:scale-[0.98] transition-transform"
            >
              Annulla
            </Button>
            <Button 
              type="submit" 
              disabled={!editData.name.trim()}
              className="rounded-full px-5 text-sm active:scale-[0.98] transition-transform"
            >
              Salva
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  type="button"
                  variant="destructive" 
                  size="icon" 
                  className="rounded-full w-10 h-10 active:scale-95 transition-transform"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className={cn(liquidGlassPopover, "rounded-2xl")}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminare questa notizia?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Questa azione non può essere annullata. La notizia verrà eliminata permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-full active:scale-[0.98] transition-transform">Annulla</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="rounded-full active:scale-[0.98] transition-transform">Elimina</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NotiziaDetail;
