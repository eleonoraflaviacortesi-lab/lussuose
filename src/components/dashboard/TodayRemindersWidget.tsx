import { useMemo } from 'react';
import { format, isSameDay, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { NotiziaComment } from '@/hooks/useNotizie';
import { Calendar, ChevronRight, User, FileText } from 'lucide-react';
import { useClienti } from '@/hooks/useClienti';
import { useNotizie, Notizia } from '@/hooks/useNotizie';
import { useKanbanColumns } from '@/hooks/useKanbanColumns';
import { cn, isDarkColor } from '@/lib/utils';

type TodayRemindersWidgetProps = {
  onNotiziaClick?: (notizia: Notizia) => void;
  onGoToCalendar?: () => void;
};

const TodayRemindersWidget = ({ onNotiziaClick, onGoToCalendar }: TodayRemindersWidgetProps) => {
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
      lastComment?: NotiziaComment;
      data: any;
    }> = [];

    // Add cliente reminders for today
    clienti?.forEach(cliente => {
      if (cliente.reminder_date && isSameDay(parseISO(cliente.reminder_date), today)) {
        const comments = (cliente.comments || []) as Array<{id: string; text: string; created_at?: string; createdAt?: string}>;
        const lastComment = comments.length > 0 ? {
          id: comments[comments.length - 1].id,
          text: comments[comments.length - 1].text,
          created_at: comments[comments.length - 1].created_at || comments[comments.length - 1].createdAt || '',
        } : undefined;
        reminders.push({
          id: `cliente-${cliente.id}`,
          type: 'cliente',
          name: cliente.nome,
          time: format(parseISO(cliente.reminder_date), 'HH:mm'),
          emoji: cliente.emoji,
          statusColor: getStatusColor(cliente.status),
          lastComment,
          data: cliente,
        });
      }
    });

    // Add notizia reminders for today
    notizie?.forEach(notizia => {
      if (notizia.reminder_date && isSameDay(parseISO(notizia.reminder_date), today)) {
        const comments = notizia.comments || [];
        const lastComment = comments.length > 0 ? comments[comments.length - 1] : undefined;
        reminders.push({
          id: `notizia-${notizia.id}`,
          type: 'notizia',
          name: notizia.name,
          time: format(parseISO(notizia.reminder_date), 'HH:mm'),
          emoji: notizia.emoji,
          statusColor: getStatusColor(notizia.status),
          lastComment,
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
    } else if (onGoToCalendar) {
      // For clienti reminders, go to calendar
      onGoToCalendar();
    }
  };

  const goToCalendar = () => {
    if (onGoToCalendar) {
      onGoToCalendar();
    }
  };

  if (todayReminders.length === 0) {
    return null;
  }

  return (
    <div className="bg-card rounded-2xl shadow-lg">
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
        {todayReminders.slice(0, 5).map((reminder) => {
          const isBuyer = reminder.type === 'cliente';
          
          return (
            <button
              key={reminder.id}
              onClick={() => handleReminderClick(reminder)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all active:scale-[0.98] relative",
                isBuyer 
                  ? "bg-white border border-foreground" 
                  : ""
              )}
              style={!isBuyer ? { backgroundColor: reminder.statusColor } : undefined}
            >
              {/* Buyer badge */}
              {isBuyer && (
                <div className="absolute -top-1.5 right-2 bg-foreground text-background text-[7px] font-bold px-1.5 py-0.5 rounded-full tracking-wider uppercase">
                  Buyer
                </div>
              )}
              
              {reminder.emoji ? (
                <span className="text-lg">{reminder.emoji}</span>
              ) : (
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center",
                  isBuyer ? "bg-muted" : "bg-white/20"
                )}>
                  {isBuyer ? (
                    <User className="w-4 h-4 text-foreground" />
                  ) : (
                    <FileText className={cn("w-4 h-4", isDarkColor(reminder.statusColor) ? "text-white" : "text-black")} />
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0 text-left">
                <p className={cn(
                  "font-medium text-sm truncate",
                  isBuyer ? "text-foreground" : (isDarkColor(reminder.statusColor) ? "text-white" : "text-black")
                )}>
                  {reminder.name}
                </p>
                {reminder.lastComment?.text && (
                  <p className={cn(
                    "text-[9px] truncate mt-0.5 opacity-80",
                    isBuyer ? "text-muted-foreground" : (isDarkColor(reminder.statusColor) ? "text-white/70" : "text-black/60")
                  )}>
                    💬 {reminder.lastComment.text.replace(/<[^>]*>/g, '').trim()}
                    {reminder.lastComment.created_at && ` · ${format(parseISO(reminder.lastComment.created_at), 'd MMM', { locale: it })}`}
                  </p>
                )}
              </div>
              <span className={cn(
                "text-xs font-medium",
                isBuyer ? "text-muted-foreground" : (isDarkColor(reminder.statusColor) ? "text-white/70" : "text-black/60")
              )}>
                {reminder.time}
              </span>
            </button>
          );
        })}
        
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
