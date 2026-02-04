import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Plus, Check, MessageCircle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { CalendarEvent } from './CalendarPage';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onToggle: (id: string, completed: boolean) => void;
  onAddClick: () => void;
  onContextMenu: (event: CalendarEvent, e: React.MouseEvent) => void;
  onTouchStart: (event: CalendarEvent, e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onCloseAndOpenDetail?: () => void;
};

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

const CalendarDayView = ({ 
  open, 
  onOpenChange, 
  date, 
  events, 
  onEventClick, 
  onToggle, 
  onAddClick,
  onContextMenu,
  onTouchStart,
  onTouchEnd,
}: Props) => {
  if (!date) return null;

  const handleEventClick = (event: CalendarEvent) => {
    // Close sheet first, then open detail
    onOpenChange(false);
    // Small delay to let sheet close animation complete
    setTimeout(() => {
      onEventClick(event);
    }, 150);
  };

  const getEventStyles = (event: CalendarEvent) => {
    // Tasks - white card with black border, like Buyers
    if (event.type === 'task') {
      return {
        bg: 'bg-white',
        customBg: null,
        border: 'border border-foreground',
        label: 'Task',
        textClass: event.completed ? 'line-through text-muted-foreground' : 'text-foreground',
        showBuyerBadge: false,
        showTaskBadge: true,
        canToggle: true,
      };
    }
    
    // Buyers (cliente_reminder) - Minimal elegant: white card with black border
    if (event.type === 'cliente_reminder') {
      return {
        bg: 'bg-white',
        customBg: null,
        border: 'border border-foreground',
        label: 'Buyer',
        textClass: 'text-foreground',
        showBuyerBadge: true,
        showTaskBadge: false,
        canToggle: false,
      };
    }
    
    // Notizie (seller leads) - use status color or sage green default
    if (event.type === 'notizia_reminder') {
      const baseColor = event.statusColor || '#8B9A7D';
      const textColor = isDarkColor(baseColor) ? 'text-white' : 'text-foreground';
      return {
        bg: '',
        customBg: baseColor,
        border: 'border-transparent',
        label: 'Notizia',
        textClass: textColor,
        showBuyerBadge: false,
        showTaskBadge: false,
        canToggle: false,
      };
    }
    
    // Appointments - sage green tint
    if (event.type === 'appointment') {
      return {
        bg: event.completed ? 'bg-[#8B9A7D]/50' : 'bg-[#8B9A7D]/30',
        customBg: null,
        border: 'border-transparent',
        label: 'Appuntamento',
        textClass: event.completed ? 'line-through text-muted-foreground' : 'text-foreground',
        showBuyerBadge: false,
        showTaskBadge: false,
        canToggle: true,
      };
    }
    
    // Default
    return {
      bg: 'bg-[#8B9A7D]/30',
      customBg: null,
      border: 'border-transparent',
      label: 'Evento',
      textClass: 'text-foreground',
      showBuyerBadge: false,
      showTaskBadge: false,
      canToggle: false,
    };
  };

  const handleToggle = (event: CalendarEvent) => {
    if (event.type === 'appointment' || event.type === 'task') {
      triggerHaptic('light');
      onToggle(event.id, !event.completed);
    }
  };

  const completedCount = events.filter(e => (e.type === 'appointment' || e.type === 'task') && e.completed).length;
  const toggleableCount = events.filter(e => e.type === 'appointment' || e.type === 'task').length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="pb-4 border-b border-muted">
          <SheetTitle className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">
                {format(date, 'd MMMM', { locale: it })}
              </p>
              <p className="text-sm text-muted-foreground font-normal">
                {format(date, 'EEEE', { locale: it })}
              </p>
            </div>
            {toggleableCount > 0 && (
              <div className="text-right">
                <p className="text-lg font-semibold text-accent">
                  {completedCount}/{toggleableCount}
                </p>
                <p className="text-xs text-muted-foreground">completati</p>
              </div>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="py-4 space-y-3 overflow-y-auto max-h-[calc(85vh-160px)]">
          {events.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nessun evento per oggi</p>
            </div>
          ) : (
            events.map((event) => {
              const styles = getEventStyles(event);
              const canToggle = styles.canToggle;
              const lastComment = event.lastComment;

              return (
                <div
                  key={event.id}
                  className={cn(
                    "rounded-xl p-4 transition-all cursor-pointer relative active:scale-[0.98]",
                    styles.bg,
                    styles.border,
                    event.urgent && "ring-2 ring-red-500"
                  )}
                  style={styles.customBg ? { backgroundColor: styles.customBg } : undefined}
                  onClick={() => handleEventClick(event)}
                  onContextMenu={(e) => onContextMenu(event, e)}
                  onTouchStart={(e) => onTouchStart(event, e)}
                  onTouchEnd={onTouchEnd}
                  onTouchMove={onTouchEnd}
                >
                  {event.urgent && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">!</span>
                    </div>
                  )}
                  {lastComment && !event.urgent && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-400 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    {canToggle ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(event);
                        }}
                        className={cn(
                          "w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors",
                          event.completed 
                            ? 'bg-foreground border-foreground' 
                            : 'border-muted-foreground/50 hover:border-foreground'
                        )}
                      >
                        {event.completed && <Check className="w-4 h-4 text-background" />}
                      </button>
                    ) : event.emoji ? (
                      <span className="text-xl shrink-0">{event.emoji}</span>
                    ) : (
                      <div 
                        className="w-3 h-3 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: event.statusColor || '#6b7280' }}
                      />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "text-[10px] font-medium tracking-wider uppercase px-2 py-0.5 rounded-full",
                          styles.showTaskBadge 
                            ? 'bg-foreground text-background' 
                            : styles.customBg 
                              ? (isDarkColor(styles.customBg) ? 'bg-white/20 text-white' : 'bg-black/10 text-black') 
                              : 'bg-muted'
                        )}>
                          {styles.label}
                        </span>
                      </div>
                      <p className={cn(
                        "font-medium",
                        event.completed ? 'line-through text-muted-foreground' : styles.textClass
                      )}>
                        {event.title}
                      </p>
                      {event.notes && event.type === 'task' && (
                        <p className="text-sm text-muted-foreground mt-1">
                          📝 {event.notes}
                        </p>
                      )}
                      {event.clienteName && (
                        <p className={cn(
                          "text-sm mt-1",
                          styles.customBg && isDarkColor(styles.customBg) ? 'text-white/70' : 'text-muted-foreground'
                        )}>
                          👤 {event.clienteName}
                        </p>
                      )}
                      {lastComment && (
                        <div className={cn(
                          "mt-2 text-xs px-2 py-1.5 rounded-lg",
                          styles.customBg && isDarkColor(styles.customBg) 
                            ? 'bg-white/20 text-white/90' 
                            : 'bg-blue-50 text-blue-900'
                        )}>
                          💬 {lastComment.text}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="absolute bottom-6 left-0 right-0 px-6">
          <button
            onClick={onAddClick}
            className="w-full bg-foreground text-background py-4 rounded-xl font-medium text-sm tracking-wider uppercase flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Aggiungi
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CalendarDayView;