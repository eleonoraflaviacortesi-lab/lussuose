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
  onTouchEnd
}: Props) => {
  if (!date) return null;

  const getEventStyles = (event: CalendarEvent) => {
    if (event.cardColor) {
      return {
        bg: '',
        customBg: event.cardColor,
        border: 'border-transparent',
        label: event.type === 'notizia_reminder' ? 'Notizia' : event.type === 'cliente_reminder' ? 'Cliente' : 'Appuntamento',
        textClass: isDarkColor(event.cardColor) ? 'text-white' : 'text-foreground',
      };
    }
    
    switch (event.type) {
      case 'appointment':
        return {
          bg: event.completed ? 'bg-muted' : 'bg-accent/10',
          customBg: null,
          border: event.completed ? 'border-muted' : 'border-accent/30',
          label: 'Appuntamento',
          textClass: 'text-foreground',
        };
      case 'cliente_reminder':
        return {
          bg: 'bg-amber-500/10',
          customBg: null,
          border: 'border-amber-500/30',
          label: 'Cliente',
          textClass: 'text-foreground',
        };
      case 'notizia_reminder':
        return {
          bg: 'bg-emerald-500/10',
          customBg: null,
          border: 'border-emerald-500/30',
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
                    "border rounded-xl p-4 transition-all cursor-pointer",
                    styles.bg,
                    styles.border
                  )}
                  style={styles.customBg ? { backgroundColor: styles.customBg } : undefined}
                  onClick={() => onEventClick(event)}
                  onContextMenu={(e) => onContextMenu(event, e)}
                  onTouchStart={(e) => onTouchStart(event, e)}
                  onTouchEnd={onTouchEnd}
                  onTouchMove={onTouchEnd}
                >
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
                            ? 'bg-accent border-accent' 
                            : 'border-muted-foreground/50 hover:border-accent'
                        )}
                      >
                        {event.completed && <Check className="w-4 h-4 text-white" />}
                      </button>
                    ) : event.emoji ? (
                      <span className="text-xl shrink-0">{event.emoji}</span>
                    ) : (
                      <div className={cn(
                        "w-3 h-3 rounded-full mt-1.5 shrink-0",
                        event.type === 'appointment' ? 'bg-accent' :
                        event.type === 'cliente_reminder' ? 'bg-amber-500' : 'bg-emerald-500'
                      )} />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "text-[10px] font-medium tracking-wider uppercase px-2 py-0.5 rounded-full",
                          styles.customBg ? (isDarkColor(styles.customBg) ? 'bg-white/20 text-white' : 'bg-black/10 text-black') : styles.bg
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