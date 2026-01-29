import { Clock, User, FileText, Check } from 'lucide-react';
import { CalendarEvent } from './CalendarPage';
import { triggerHaptic } from '@/lib/haptics';

type Props = {
  event: CalendarEvent;
  onClick?: (e: React.MouseEvent) => void;
  onToggle?: (id: string, completed: boolean) => void;
  compact?: boolean;
};

const CalendarEventCard = ({ event, onClick, onToggle, compact }: Props) => {
  const getEventStyles = () => {
    switch (event.type) {
      case 'appointment':
        return {
          bg: event.completed ? 'bg-muted' : 'bg-accent/10',
          border: event.completed ? 'border-muted' : 'border-accent/30',
          dot: event.completed ? 'bg-muted-foreground' : 'bg-accent',
          icon: Clock,
          textClass: event.completed ? 'line-through text-muted-foreground' : 'text-foreground',
        };
      case 'cliente_reminder':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          dot: 'bg-amber-500',
          icon: User,
          textClass: 'text-foreground',
        };
      case 'notizia_reminder':
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          dot: 'bg-emerald-500',
          icon: FileText,
          textClass: 'text-foreground',
        };
    }
  };

  const styles = getEventStyles();
  const Icon = styles.icon;
  const canToggle = event.type === 'appointment';

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canToggle && onToggle) {
      triggerHaptic('light');
      onToggle(event.id, !event.completed);
    }
  };

  return (
    <div
      className={`${styles.bg} ${styles.border} border rounded-lg p-2 transition-all hover:scale-[1.02] cursor-pointer`}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        {/* Checkbox or dot */}
        {canToggle ? (
          <button
            onClick={handleToggle}
            className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
              event.completed 
                ? 'bg-accent border-accent' 
                : 'border-muted-foreground/50 hover:border-accent'
            }`}
          >
            {event.completed && <Check className="w-3 h-3 text-white" />}
          </button>
        ) : (
          <div className={`w-1.5 h-1.5 rounded-full ${styles.dot} mt-1.5 shrink-0`} />
        )}
        
        <div className="flex-1 min-w-0">
          <p className={`text-[10px] font-medium truncate ${styles.textClass}`}>
            {event.title}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <Icon className="w-2.5 h-2.5 text-muted-foreground" />
            <span className="text-[9px] text-muted-foreground">{event.time}</span>
            {event.clienteName && !compact && (
              <>
                <span className="text-[9px] text-muted-foreground">•</span>
                <span className="text-[9px] text-muted-foreground truncate">{event.clienteName}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarEventCard;