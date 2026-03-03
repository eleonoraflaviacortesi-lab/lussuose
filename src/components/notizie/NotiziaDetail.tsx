import React, { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { AttachmentsSection } from '@/components/shared/AttachmentsSection';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Phone, X, Trash2, CalendarIcon, Bell, ExternalLink, Send, Check } from 'lucide-react';
import { StarRating } from '@/components/ui/star-rating';
import MentionInput from '@/components/ui/mention-input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useMentionNotifications } from '@/hooks/useMentionNotifications';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Notizia, NotiziaStatus, NotiziaComment, useNotizie } from '@/hooks/useNotizie';
import { useKanbanColumns } from '@/hooks/useKanbanColumns';
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

// Helper to determine if color is dark
const isDarkColor = (color: string | null): boolean => {
  if (!color) return false;
  const hex = color.replace('#', '');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
};

const pillInputClass = "w-full bg-white rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-0 focus:outline-none focus:ring-2 focus:ring-primary/20";
const pillTextareaClass = "w-full bg-white rounded-2xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none";
const liquidGlassPopover = "bg-white/95 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border-0 rounded-2xl";

const commonEmojis = ['📋', '🏠', '🏡', '🏰', '🏛️', '🌳', '⭐', '💎', '🔑', '📍', '🌸', '🌺', '🌻', '🍀', '✨', '💫', '🎯', '🔥', '💰', '🏆', '🌊', '🏖️', '🌅', '🌄', '🏔️', '🌲', '🌴', '🌷', '🌹', '💐', '🎨', '🎭', '🎪', '🎢', '🎡', '📸'];

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
  credit: 'Credit',
  no: 'No',
  sold: 'Sold',
};

const NotiziaDetail = ({ notizia, open, onOpenChange }: NotiziaDetailProps) => {
  const { updateNotizia, deleteNotizia } = useNotizie();
  const { columns } = useKanbanColumns();
  const { sendMentionNotifications } = useMentionNotifications();
  const [customEmoji, setCustomEmoji] = useState('');
  const [newComment, setNewComment] = useState('');
  const [showSaved, setShowSaved] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
    prezzo_richiesto: null as number | null,
    valore: null as number | null,
    rating: null as number | null,
  });

  // Auto-save function - exclude comments to prevent overwriting external changes
  const performSave = useCallback(() => {
    if (!notizia || !editData.name.trim()) return;
    
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
      prezzo_richiesto: editData.prezzo_richiesto,
      valore: editData.valore,
      rating: editData.rating,
    });

    // Show saved indicator
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 1500);
  }, [notizia, editData, updateNotizia]);

  // Debounced auto-save on field changes
  const triggerAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      performSave();
    }, 500);
  }, [performSave]);

  // Update handler that triggers auto-save
  const updateField = useCallback((field: string, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Trigger save on blur for text fields
  const handleBlur = useCallback(() => {
    triggerAutoSave();
  }, [triggerAutoSave]);

  // Immediate save for select/picker changes
  const updateAndSave = useCallback((field: string, value: any) => {
    setEditData(prev => {
      const newData = { ...prev, [field]: value };
      // Save directly with new data to avoid stale closure
      setTimeout(() => {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        if (!notizia || !newData.name.trim()) return;
        
        let reminderDateTime: string | null = null;
        if (newData.reminder_date) {
          const [hours, minutes] = newData.reminder_time.split(':');
          const reminderDate = new Date(newData.reminder_date);
          reminderDate.setHours(parseInt(hours), parseInt(minutes));
          reminderDateTime = reminderDate.toISOString();
        }
        
        updateNotizia.mutate({
          id: notizia.id,
          name: newData.name,
          zona: newData.zona || undefined,
          phone: newData.phone || undefined,
          type: newData.type || undefined,
          notes: newData.notes || undefined,
          status: newData.status,
          emoji: newData.emoji || '📋',
          reminder_date: reminderDateTime,
          prezzo_richiesto: newData.prezzo_richiesto,
          valore: newData.valore,
          rating: newData.rating,
        });
        
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 1500);
      }, 100);
      return newData;
    });
  }, [notizia, updateNotizia]);

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
        prezzo_richiesto: notizia.prezzo_richiesto ?? null,
        valore: notizia.valore ?? null,
        rating: notizia.rating ?? null,
      });
      setNewComment('');
    }
  }, [notizia?.id]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Early return AFTER all hooks
  if (!notizia || !open) return null;

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const comment: NotiziaComment = {
      id: crypto.randomUUID(),
      text: newComment.trim(),
      created_at: new Date().toISOString(),
    };
    const newComments = [...editData.comments, comment];
    setEditData({ ...editData, comments: newComments });
    
    // Send mention notifications
    await sendMentionNotifications(newComment.trim(), {
      type: 'comment_notizia',
      entityName: editData.name,
      referenceId: notizia.id,
    });
    
    setNewComment('');
    // Save comments directly
    updateNotizia.mutate({ id: notizia.id, comments: newComments, silent: true });
  };

  const handleDeleteComment = (commentId: string) => {
    const newComments = editData.comments.filter(c => c.id !== commentId);
    setEditData({ 
      ...editData, 
      comments: newComments 
    });
    // Save comments directly
    updateNotizia.mutate({ id: notizia.id, comments: newComments, silent: true });
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
      updateAndSave('emoji', customEmoji.trim());
      setCustomEmoji('');
    }
  };

  return (
    <Fragment>
      {/* Backdrop overlay - transparent to keep content visible */}
      <div 
        className="fixed inset-0 z-[54] bg-black/10 animate-in fade-in duration-200"
        style={{ top: 'var(--banner-height, 28px)' }}
        onClick={() => onOpenChange(false)}
      />
      {/* Side peek panel */}
      <div 
        className={cn(
          "fixed right-0 top-0 bottom-0 z-[55] flex flex-col bg-background border-l border-border/50 shadow-[-8px_0_30px_rgba(0,0,0,0.12)]",
          "animate-in slide-in-from-right duration-300",
          "w-full sm:w-[480px] md:w-[520px]",
        )}
      >
        {/* Close button - fixed at top right of panel */}
        <button 
          onClick={() => onOpenChange(false)}
          className="absolute right-8 top-10 z-10 text-muted-foreground active:scale-95 transition-transform"
        >
          <X className="w-4 h-4" />
        </button>
        {/* Side peek scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="w-full pt-10 px-5 pb-10">

        {/* Saved indicator */}
        {showSaved && (
          <div className="flex items-center justify-center gap-1 mb-4 text-xs text-success animate-in fade-in duration-200">
            <Check className="w-3 h-3" />
            Salvato
          </div>
        )}

        <div className="space-y-3">
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
                        onClick={() => updateAndSave('emoji', emoji)}
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
                onChange={(e) => updateField('name', e.target.value)}
                onBlur={handleBlur}
                placeholder="Es: Villa Serenity"
                className={pillInputClass}
              />
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <Label className="text-xs font-medium">Rating</Label>
            <StarRating
              value={editData.rating}
              onChange={(val) => {
                if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                setEditData(prev => ({ ...prev, rating: val }));
                if (notizia) {
                  updateNotizia.mutate({ id: notizia.id, rating: val, silent: true });
                }
              }}
              size="sm"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="edit-zona" className="text-xs font-medium mb-1.5 block">Zona</Label>
              <input
                id="edit-zona"
                value={editData.zona}
                onChange={(e) => updateField('zona', e.target.value)}
                onBlur={handleBlur}
                placeholder="Es: Umbertide"
                className={pillInputClass}
              />
            </div>
            <div>
              <Label htmlFor="edit-type" className="text-xs font-medium mb-1.5 block">Tipo</Label>
              <input
                id="edit-type"
                value={editData.type}
                onChange={(e) => updateField('type', e.target.value)}
                onBlur={handleBlur}
                placeholder="Es: Casale"
                className={pillInputClass}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="edit-prezzo" className="text-xs font-medium mb-1.5 block">Prezzo Richiesto</Label>
              <input
                id="edit-prezzo"
                type="number"
                value={editData.prezzo_richiesto ?? ''}
                onChange={(e) => updateField('prezzo_richiesto', e.target.value ? Number(e.target.value) : null)}
                onBlur={handleBlur}
                placeholder="€ 350.000"
                className={pillInputClass}
              />
            </div>
            <div>
              <Label htmlFor="edit-valore" className="text-xs font-medium mb-1.5 block">Valore</Label>
              <input
                id="edit-valore"
                type="number"
                value={editData.valore ?? ''}
                onChange={(e) => updateField('valore', e.target.value ? Number(e.target.value) : null)}
                onBlur={handleBlur}
                placeholder="€ 300.000"
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
                onChange={(e) => updateField('phone', e.target.value)}
                onBlur={handleBlur}
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
            <Label className="text-xs font-medium mb-1.5 block">Status</Label>
            <div className="flex flex-wrap gap-1.5">
              {columns.map((col) => (
                <button
                  key={col.key}
                  type="button"
                  onClick={() => updateAndSave('status', col.key as NotiziaStatus)}
                  className={cn(
                    "px-2.5 py-1 text-[10px] font-medium rounded-full transition-all active:scale-95",
                    editData.status === col.key && "ring-2 ring-offset-1 ring-foreground"
                  )}
                  style={{ 
                    backgroundColor: col.color,
                    color: isDarkColor(col.color) ? 'white' : 'black'
                  }}
                >
                  {col.label}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <Label htmlFor="edit-notes" className="text-xs font-medium mb-1.5 block">Note</Label>
            <RichTextEditor
              value={editData.notes}
              onChange={(val) => updateField('notes', val)}
              onBlur={handleBlur}
              placeholder="Aggiungi note..."
              minHeight="60px"
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
            <div className="flex gap-2 items-center w-full">
              <MentionInput
                value={newComment}
                onChange={setNewComment}
                onSubmit={handleAddComment}
                placeholder="Aggiungi un commento... usa @ per taggare"
                className={cn(pillInputClass, "flex-1")}
              />
              <button
                type="button"
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="w-10 h-10 bg-foreground text-background rounded-full flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
           </div>
          </div>

          {/* Allegati */}
          <AttachmentsSection entityType="notizia" entityId={notizia.id} />

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
                    onSelect={(date) => updateField('reminder_date', date || null)}
                    locale={it}
                    className="pointer-events-auto"
                  />
                  <div className="p-3 bg-white/60 backdrop-blur-sm border-t border-muted/30">
                    <Label className="text-xs font-medium mb-1.5 block">Ora</Label>
                    <div className="flex gap-2">
                      <Select
                        value={editData.reminder_time?.split(':')[0] || '09'}
                        onValueChange={(hour) => {
                          const mins = editData.reminder_time?.split(':')[1] || '00';
                          updateField('reminder_time', `${hour}:${mins}`);
                        }}
                      >
                        <SelectTrigger className="flex-1 bg-white rounded-full px-3 py-2 h-auto text-sm shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-0">
                          <SelectValue placeholder="Ora" />
                        </SelectTrigger>
                        <SelectContent className={cn(liquidGlassPopover, "rounded-xl max-h-48")}>
                          {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map((hour) => (
                            <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="flex items-center text-muted-foreground font-medium">:</span>
                      <Select
                        value={editData.reminder_time?.split(':')[1] || '00'}
                        onValueChange={(mins) => {
                          const hour = editData.reminder_time?.split(':')[0] || '09';
                          updateField('reminder_time', `${hour}:${mins}`);
                        }}
                      >
                        <SelectTrigger className="flex-1 bg-white rounded-full px-3 py-2 h-auto text-sm shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-0">
                          <SelectValue placeholder="Min" />
                        </SelectTrigger>
                        <SelectContent className={cn(liquidGlassPopover, "rounded-xl max-h-48")}>
                          {['00', '15', '30', '45'].map((mins) => (
                            <SelectItem key={mins} value={mins}>{mins}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Save button - always visible when date is selected */}
                    {editData.reminder_date && (
                      <button
                        type="button"
                        onClick={() => {
                          const [hours, minutes] = editData.reminder_time.split(':');
                          const reminderDate = new Date(editData.reminder_date!);
                          reminderDate.setHours(parseInt(hours), parseInt(minutes));
                          
                          updateNotizia.mutate({
                            id: notizia.id,
                            reminder_date: reminderDate.toISOString(),
                          });
                          
                          setShowSaved(true);
                          setTimeout(() => setShowSaved(false), 1500);
                        }}
                        className="w-full mt-3 py-2.5 rounded-full bg-foreground text-background text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:opacity-90"
                      >
                        <Check className="w-4 h-4" />
                        <span>Salva</span>
                      </button>
                    )}
                    
                    {/* Remove reminder button */}
                    {editData.reminder_date && (
                      <button
                        type="button"
                        onClick={() => {
                          updateAndSave('reminder_date', null);
                        }}
                        className="w-full mt-2 py-2 rounded-full bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive hover:text-white transition-colors"
                      >
                        Rimuovi promemoria
                      </button>
                    )}
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
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="rounded-full px-6 text-sm active:scale-[0.98] transition-transform"
            >
              Chiudi
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
        </div>
        </div>
        </div>
      </div>
    </Fragment>
  );
};

export default NotiziaDetail;
