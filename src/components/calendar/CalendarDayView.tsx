import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Plus, Check, Clock, User, FileText } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { CalendarEvent } from './CalendarPage';
import { triggerHaptic } from '@/lib/haptics';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onToggle: (id: string, completed: boolean) => void;
  onAddClick: () => void;
};

const CalendarDayView = ({ open, onOpenChange, date, events, onEventClick, onToggle, onAddClick }: Props) => {
  if (!date) return null;

  const getEventStyles = (event: CalendarEvent) => {
    switch (event.type) {
      case 'appointment':
        return {
          bg: event.completed ? 'bg-muted' : 'bg-accent/10',
          border: event.completed ? 'border-muted' : 'border-accent/30',
          dot: event.completed ? 'bg-muted-foreground' : 'bg-accent',
          icon: Clock,
          label: 'Appuntamento',
        };
      case 'cliente_reminder':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          dot: 'bg-amber-500',
          icon: User,
          label: 'Reminder Cliente',
        };
      case 'notizia_reminder':
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          dot: 'bg-emerald-500',
          icon: FileText,
          label: 'Reminder Notizia',
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
              const Icon = styles.icon;
              const canToggle = event.type === 'appointment';

              return (
                <div
                  key={event.id}
                  className={`${styles.bg} ${styles.border} border rounded-xl p-4 transition-all`}
                  onClick={() => onEventClick(event)}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox or dot */}
                    {canToggle ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(event);
                        }}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                          event.completed 
                            ? 'bg-accent border-accent' 
                            : 'border-muted-foreground/50 hover:border-accent'
                        }`}
                      >
                        {event.completed && <Check className="w-4 h-4 text-white" />}
                      </button>
                    ) : (
                      <div className={`w-3 h-3 rounded-full ${styles.dot} mt-1.5 shrink-0`} />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-medium tracking-wider uppercase px-2 py-0.5 rounded-full ${styles.bg}`}>
                          {styles.label}
                        </span>
                        <span className="text-xs text-muted-foreground">{event.time}</span>
                      </div>
                      <p className={`font-medium ${event.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {event.title}
                      </p>
                      {event.clienteName && (
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {event.clienteName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add button */}
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