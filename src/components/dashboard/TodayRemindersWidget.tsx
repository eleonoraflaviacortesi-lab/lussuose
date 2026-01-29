import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isSameDay, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { Calendar, ChevronRight, User, FileText } from 'lucide-react';
import { useClienti } from '@/hooks/useClienti';
import { useNotizie, Notizia } from '@/hooks/useNotizie';
import { useKanbanColumns } from '@/hooks/useKanbanColumns';
import { cn } from '@/lib/utils';

type TodayRemindersWidgetProps = {
  onNotiziaClick?: (notizia: Notizia) => void;
};

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

const TodayRemindersWidget = ({ onNotiziaClick }: TodayRemindersWidgetProps) => {
  const navigate = useNavigate();
  const { clienti } = useClienti();
  const { notizie } = useNotizie();
  const { columns } = useKanbanColumns();
  const today = new Date();

  const getStatusColor = (status: string): string => {
    const col = columns.find(c => c.key === status);
    return col?.color || '#6b7280';
  };

  const todayReminders = useMemo(() => {
    const reminders: Array<{
      id: string;
      type: 'cliente' | 'notizia';
      name: string;
      time: string;
      emoji?: string | null;
      statusColor: string;
      data: any;
    }> = [];

    // Add cliente reminders for today
    clienti?.forEach(cliente => {
      if (cliente.reminder_date && isSameDay(parseISO(cliente.reminder_date), today)) {
        reminders.push({
          id: `cliente-${cliente.id}`,
          type: 'cliente',
          name: cliente.nome,
          time: format(parseISO(cliente.reminder_date), 'HH:mm'),
          emoji: cliente.emoji,
          statusColor: getStatusColor(cliente.status),
          data: cliente,
        });
      }
    });

    // Add notizia reminders for today
    notizie?.forEach(notizia => {
      if (notizia.reminder_date && isSameDay(parseISO(notizia.reminder_date), today)) {
        reminders.push({
          id: `notizia-${notizia.id}`,
          type: 'notizia',
          name: notizia.name,
          time: format(parseISO(notizia.reminder_date), 'HH:mm'),
          emoji: notizia.emoji,
          statusColor: getStatusColor(notizia.status),
          data: notizia,
        });
      }
    });

    // Sort by time
    return reminders.sort((a, b) => a.time.localeCompare(b.time));
  }, [clienti, notizie, columns, today]);

  const handleReminderClick = (reminder: typeof todayReminders[0]) => {
    if (reminder.type === 'notizia' && onNotiziaClick) {
      onNotiziaClick(reminder.data);
    } else {
      // Navigate to calendar
      navigate('/calendario');
    }
  };

  const goToCalendar = () => {
    navigate('/calendario');
  };

  if (todayReminders.length === 0) {
    return null;
  }

  return (
    <div className="bg-card rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={goToCalendar}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center">
            <Calendar className="w-5 h-5 text-background" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground">
              Oggi, {format(today, 'd MMMM', { locale: it })}
            </p>
            <p className="font-semibold">
              {todayReminders.length} promemoria
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </button>

      {/* Reminders list - compact */}
      <div className="px-4 pb-4 space-y-2">
        {todayReminders.slice(0, 5).map((reminder) => (
          <button
            key={reminder.id}
            onClick={() => handleReminderClick(reminder)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all active:scale-[0.98]"
            )}
            style={{ backgroundColor: reminder.statusColor }}
          >
            {reminder.emoji ? (
              <span className="text-lg">{reminder.emoji}</span>
            ) : (
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                {reminder.type === 'cliente' ? (
                  <User className={cn("w-4 h-4", isDarkColor(reminder.statusColor) ? "text-white" : "text-black")} />
                ) : (
                  <FileText className={cn("w-4 h-4", isDarkColor(reminder.statusColor) ? "text-white" : "text-black")} />
                )}
              </div>
            )}
            <div className="flex-1 min-w-0 text-left">
              <p className={cn(
                "font-medium text-sm truncate",
                isDarkColor(reminder.statusColor) ? "text-white" : "text-black"
              )}>
                {reminder.name}
              </p>
            </div>
            <span className={cn(
              "text-xs font-medium",
              isDarkColor(reminder.statusColor) ? "text-white/70" : "text-black/60"
            )}>
              {reminder.time}
            </span>
          </button>
        ))}
        
        {todayReminders.length > 5 && (
          <button
            onClick={goToCalendar}
            className="w-full text-center py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            +{todayReminders.length - 5} altri
          </button>
        )}
      </div>
    </div>
  );
};

export default TodayRemindersWidget;
