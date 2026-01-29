import { Clock, User, Bell, FileText } from 'lucide-react';

type CalendarEvent = {
  id: string;
  title: string;
  time: string;
  type: 'appointment' | 'cliente_reminder' | 'notizia_reminder';
  clienteId?: string;
  clienteName?: string;
  notiziaId?: string;
};

type Props = {
  event: CalendarEvent;
};

const CalendarEventCard = ({ event }: Props) => {
  const getEventStyles = () => {
    switch (event.type) {
      case 'appointment':
        return {
          bg: 'bg-accent/10',
          border: 'border-accent/30',
          dot: 'bg-accent',
          icon: Clock,
        };
      case 'cliente_reminder':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          dot: 'bg-amber-500',
          icon: User,
        };
      case 'notizia_reminder':
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          dot: 'bg-emerald-500',
          icon: FileText,
        };
    }
  };

  const styles = getEventStyles();
  const Icon = styles.icon;

  return (
    <div
      className={`${styles.bg} ${styles.border} border rounded-lg p-2 transition-all hover:scale-[1.02]`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${styles.dot} mt-1.5 shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium text-foreground truncate">
            {event.title}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <Icon className="w-2.5 h-2.5 text-muted-foreground" />
            <span className="text-[9px] text-muted-foreground">{event.time}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarEventCard;
