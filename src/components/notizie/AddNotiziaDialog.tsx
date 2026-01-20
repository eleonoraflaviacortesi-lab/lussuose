import { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Plus, X, CalendarIcon, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useNotizie, NotiziaStatus } from '@/hooks/useNotizie';
import { cn } from '@/lib/utils';
import { generateNotiziaCalendarUrl } from '@/lib/googleCalendar';

const pillInputClass = "w-full bg-white rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-0 focus:outline-none focus:ring-2 focus:ring-primary/20";
const pillTextareaClass = "w-full bg-white rounded-2xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none";
const liquidGlassPopover = "bg-white/95 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border-0 rounded-2xl";

const commonEmojis = ['📋', '🏠', '🏡', '🏰', '🏛️', '🌳', '⭐', '💎', '🔑', '📍', '🌸', '🌺', '🌻', '🍀', '✨', '💫', '🎯', '🔥', '💰', '🏆', '🌊', '🏖️', '🌅', '🌄', '🏔️', '🌲', '🌴', '🌷', '🌹', '💐', '🎨', '🎭', '🎪', '🎢', '🎡'];

const AddNotiziaDialog = () => {
  const { addNotizia } = useNotizie();
  const [open, setOpen] = useState(false);
  const [customEmoji, setCustomEmoji] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    zona: '',
    phone: '',
    type: '',
    notes: '',
    status: 'new' as NotiziaStatus,
    emoji: '📋',
    reminder_date: null as Date | null,
    reminder_time: '09:00',
    created_date: null as Date | null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    let reminderDateTime: string | undefined;
    if (formData.reminder_date) {
      const [hours, minutes] = formData.reminder_time.split(':');
      const reminderDate = new Date(formData.reminder_date);
      reminderDate.setHours(parseInt(hours), parseInt(minutes));
      reminderDateTime = reminderDate.toISOString();
    }
    
    addNotizia.mutate({
      name: formData.name,
      zona: formData.zona || undefined,
      phone: formData.phone || undefined,
      type: formData.type || undefined,
      notes: formData.notes || undefined,
      status: formData.status,
      emoji: formData.emoji,
      reminder_date: reminderDateTime,
      created_at: formData.created_date ? formData.created_date.toISOString() : undefined,
    });
    
    setFormData({
      name: '',
      zona: '',
      phone: '',
      type: '',
      notes: '',
      status: 'new',
      emoji: '📋',
      reminder_date: null,
      reminder_time: '09:00',
      created_date: null,
    });
    setCustomEmoji('');
    setOpen(false);
  };

  const handleCustomEmojiSubmit = () => {
    if (customEmoji.trim()) {
      setFormData({ ...formData, emoji: customEmoji.trim() });
      setCustomEmoji('');
    }
  };

  return (
    <>
      <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" />
        Nuova notizia
      </Button>

      {/* Liquid Glass Overlay */}
      {open && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          {/* Blur backdrop */}
          <div className="absolute inset-0 bg-black/10 backdrop-blur-md" />
          
          {/* Compact floating card */}
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
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground active:scale-95 transition-transform"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Title */}
            <h3 className="text-center text-base font-bold tracking-wide uppercase mb-4">
              Nuova Notizia
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
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
                        {formData.emoji}
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
                            onClick={() => setFormData({ ...formData, emoji })}
                            className={cn(
                              "w-8 h-8 flex items-center justify-center rounded-lg active:scale-95 transition-transform",
                              formData.emoji === emoji && "bg-accent"
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
                  <Label htmlFor="name" className="text-xs font-medium mb-1.5 block">Nome proprietà *</Label>
                  <input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Es: Villa Serenity"
                    required
                    className={pillInputClass}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="zona" className="text-xs font-medium mb-1.5 block">Zona</Label>
                  <input
                    id="zona"
                    value={formData.zona}
                    onChange={(e) => setFormData({ ...formData, zona: e.target.value })}
                    placeholder="Es: Umbertide"
                    className={pillInputClass}
                  />
                </div>
                <div>
                  <Label htmlFor="type" className="text-xs font-medium mb-1.5 block">Tipo</Label>
                  <input
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    placeholder="Es: Casale"
                    className={pillInputClass}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="phone" className="text-xs font-medium mb-1.5 block">Telefono</Label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+39 333 1234567"
                  className={pillInputClass}
                />
              </div>
              
              <div>
                <Label htmlFor="status" className="text-xs font-medium mb-1.5 block">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as NotiziaStatus })}
                >
                  <SelectTrigger className="bg-white rounded-full px-4 py-2.5 h-auto text-sm shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={cn(liquidGlassPopover, "rounded-xl")}>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="on_shot">On Shot</SelectItem>
                    <SelectItem value="taken">Taken</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="notes" className="text-xs font-medium mb-1.5 block">Note</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Aggiungi note..."
                  rows={2}
                  className={pillTextareaClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Data notizia - Custom Calendar */}
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">Data notizia</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "w-full bg-white rounded-full px-4 py-2.5 text-sm shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-0 flex items-center gap-2 active:scale-[0.98] transition-transform",
                          !formData.created_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="w-4 h-4" />
                        {formData.created_date ? format(formData.created_date, 'd MMM', { locale: it }) : 'Seleziona'}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className={cn(liquidGlassPopover, "w-auto p-0")} align="start">
                      <Calendar
                        mode="single"
                        selected={formData.created_date || undefined}
                        onSelect={(date) => setFormData({ ...formData, created_date: date || null })}
                        locale={it}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
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
                          !formData.reminder_date && "text-muted-foreground"
                        )}
                      >
                        <Clock className="w-4 h-4" />
                        {formData.reminder_date ? format(formData.reminder_date, 'd MMM', { locale: it }) : 'Seleziona'}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className={cn(liquidGlassPopover, "w-auto p-0")} align="start">
                      <Calendar
                        mode="single"
                        selected={formData.reminder_date || undefined}
                        onSelect={(date) => setFormData({ ...formData, reminder_date: date || null })}
                        locale={it}
                        className="pointer-events-auto"
                      />
                      <div className="p-3 border-t border-muted/20">
                        <Label className="text-xs font-medium mb-1.5 block">Ora</Label>
                        <input
                          type="time"
                          value={formData.reminder_time}
                          onChange={(e) => setFormData({ ...formData, reminder_time: e.target.value })}
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
                  const [hours, minutes] = formData.reminder_time.split(':');
                  const reminderDate = formData.reminder_date 
                    ? new Date(formData.reminder_date)
                    : new Date();
                  reminderDate.setHours(parseInt(hours), parseInt(minutes));
                  
                  const url = generateNotiziaCalendarUrl({
                    name: formData.name || 'Nuova notizia',
                    emoji: formData.emoji,
                    zona: formData.zona || undefined,
                    type: formData.type || undefined,
                    phone: formData.phone || undefined,
                    notes: formData.notes || undefined,
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
                  onClick={() => setOpen(false)}
                  className="rounded-full px-5 text-sm active:scale-[0.98] transition-transform"
                >
                  Annulla
                </Button>
                <Button 
                  type="submit" 
                  disabled={!formData.name.trim()}
                  className="rounded-full px-5 text-sm active:scale-[0.98] transition-transform"
                >
                  Aggiungi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AddNotiziaDialog;
