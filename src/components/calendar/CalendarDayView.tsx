import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Plus, Check } from 'lucide-react';
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
    // For notizia/cliente reminders, use the status color
    if (event.statusColor && (event.type === 'notizia_reminder' || event.type === 'cliente_reminder')) {
      const textColor = isDarkColor(event.statusColor) ? 'text-white' : 'text-foreground';
      const label = event.type === 'notizia_reminder' ? 'Notizia' : 'Cliente';
      return {
        bg: '',
        customBg: event.statusColor,
        border: 'border-transparent',
        label,
        textClass: textColor,
      };
    }
    
    switch (event.type) {
      case 'appointment':
        return {
          bg: event.completed ? 'bg-muted' : 'bg-muted/50',
          customBg: null,
          border: 'border-transparent',
          label: 'Appuntamento',
          textClass: event.completed ? 'line-through text-muted-foreground' : 'text-foreground',
        };
      case 'cliente_reminder':
        return {
          bg: 'bg-muted/50',
          customBg: null,
          border: 'border-transparent',
          label: 'Cliente',
          textClass: 'text-foreground',
        };
      case 'notizia_reminder':
        return {
          bg: 'bg-muted/50',
          customBg: null,
          border: 'border-transparent',
          label: 'Notizia',
          textClass: 'text-foreground',
        };
    }
  };

  const handleToggle = (event: CalendarEvent) => {
    if (event.type === 'appointment') {
      triggerHaptic('light');
      onToggle(event.id, !event.completed);
    }
  };

  const completedCount = events.filter(e => e.type === 'appointment' && e.completed).length;
  const appointmentCount = events.filter(e => e.type === 'appointment').length;

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
            {appointmentCount > 0 && (
              <div className="text-right">
                <p className="text-lg font-semibold text-accent">
                  {completedCount}/{appointmentCount}
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
              const canToggle = event.type === 'appointment';

              return (
                <div
                  key={event.id}
                  className={cn(
                    "rounded-xl p-4 transition-all cursor-pointer relative active:scale-[0.98]",
                    styles.bg,
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
                          styles.customBg ? (isDarkColor(styles.customBg) ? 'bg-white/20 text-white' : 'bg-black/10 text-black') : 'bg-muted'
                        )}>
                          {styles.label}
                        </span>
                        <span className={cn(
                          "text-xs",
                          styles.customBg && isDarkColor(styles.customBg) ? 'text-white/70' : 'text-muted-foreground'
                        )}>
                          {event.time}
                        </span>
                      </div>
                      <p className={cn(
                        "font-medium",
                        event.completed ? 'line-through text-muted-foreground' : styles.textClass
                      )}>
                        {event.title}
                      </p>
                      {event.clienteName && (
                        <p className={cn(
                          "text-sm mt-1",
                          styles.customBg && isDarkColor(styles.customBg) ? 'text-white/70' : 'text-muted-foreground'
                        )}>
                          👤 {event.clienteName}
                        </p>
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
            Nuovo Appuntamento
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CalendarDayView;