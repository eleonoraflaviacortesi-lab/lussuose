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
  onClienteClick?: (clienteId: string) => void;
  onGoToCalendar?: () => void;
};

const TodayRemindersWidget = ({ onNotiziaClick, onClienteClick, onGoToCalendar }: TodayRemindersWidgetProps) => {
  const { clienti } = useClienti();
  const { notizie } = useNotizie();
  const { columns } = useKanbanColumns();
  const today = new Date();

  const getStatusColor = (status: string): string => {
    const col = columns.find((c) => c.key === status);
    return col?.color || '#6b7280';
  };

  const calendarColors = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('calendar_event_colors') || '{}') as Record<string, string>;
    } catch { return {} as Record<string, string>; }
  }, []);

  const todayReminders = useMemo(() => {
    const reminders: Array<{
      id: string;
      type: 'cliente' | 'notizia';
      name: string;
      time: string;
      emoji?: string | null;
      statusColor: string;
      cardColor?: string;
      lastComment?: NotiziaComment;
      data: any;
    }> = [];

    clienti?.forEach((cliente) => {
      if (cliente.reminder_date && isSameDay(parseISO(cliente.reminder_date), today)) {
        const comments = (cliente.comments || []) as Array<{id: string;text: string;created_at?: string;createdAt?: string;}>;
        const lastComment = comments.length > 0 ? {
          id: comments[comments.length - 1].id,
          text: comments[comments.length - 1].text,
          created_at: comments[comments.length - 1].created_at || comments[comments.length - 1].createdAt || ''
        } : undefined;
        const clienteEventId = `cliente-${cliente.id}`;
        reminders.push({
          id: clienteEventId,
          type: 'cliente',
          name: cliente.nome,
          time: format(parseISO(cliente.reminder_date), 'HH:mm'),
          emoji: cliente.emoji,
          statusColor: getStatusColor(cliente.status),
          cardColor: calendarColors[clienteEventId],
          lastComment,
          data: cliente
        });
      }
    });

    notizie?.forEach((notizia) => {
      if (notizia.reminder_date && isSameDay(parseISO(notizia.reminder_date), today)) {
        const comments = notizia.comments || [];
        const lastComment = comments.length > 0 ? comments[comments.length - 1] : undefined;
        const notiziaEventId = `notizia-${notizia.id}`;
        reminders.push({
          id: notiziaEventId,
          type: 'notizia',
          name: notizia.name,
          time: format(parseISO(notizia.reminder_date), 'HH:mm'),
          emoji: notizia.emoji,
          statusColor: getStatusColor(notizia.status),
          cardColor: calendarColors[notiziaEventId],
          lastComment,
          data: notizia
        });
      }
    });

    return reminders.sort((a, b) => a.time.localeCompare(b.time));
  }, [clienti, notizie, columns, today]);

  const handleReminderClick = (reminder: typeof todayReminders[0]) => {
    if (reminder.type === 'notizia' && onNotiziaClick) {
      onNotiziaClick(reminder.data);
    } else if (reminder.type === 'cliente' && onClienteClick) {
      onClienteClick(reminder.data.id);
    } else if (onGoToCalendar) {
      onGoToCalendar();
    }
  };

  const goToCalendar = () => {
    if (onGoToCalendar) {
      onGoToCalendar();
    }
  };

  return (
    <div className="bg-card rounded-3xl border border-border">
      {/* Header */}
      <button
        onClick={goToCalendar}
        className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-muted/30 transition-colors rounded-t-3xl"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-foreground flex items-center justify-center">
            <Calendar className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-background" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">
              Oggi, {format(today, 'd MMMM', { locale: it })}
            </p>
            <p className="font-bold text-base sm:text-lg">
              {todayReminders.length > 0 ? `${todayReminders.length} promemoria` : 'Nessun promemoria'}
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </button>

      {/* Reminders list */}
      <div className="px-4 pb-4 sm:px-5 sm:pb-5 space-y-2">
        {todayReminders.slice(0, 5).map((reminder) => {
          const isBuyer = reminder.type === 'cliente';

          const effectiveColor = reminder.cardColor || (isBuyer ? undefined : reminder.statusColor);
          const hasCustomColor = !!effectiveColor;
          const darkBg = hasCustomColor ? isDarkColor(effectiveColor!) : false;

          return (
            <button
              key={reminder.id}
              onClick={() => handleReminderClick(reminder)}
              className={cn(
                "w-full flex items-center gap-3 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl transition-all active:scale-[0.98] relative",
                !hasCustomColor && isBuyer
                  ? "bg-background border border-foreground/10"
                  : ""
              )}
              style={hasCustomColor ? { backgroundColor: effectiveColor } : undefined}
            >
              {isBuyer && (
                <div className="absolute -top-1.5 right-3 bg-foreground text-background text-[7px] font-bold px-1.5 py-0.5 rounded-full tracking-wider uppercase">
                  Buyer
                </div>
              )}

              {reminder.emoji ? (
                <span className="text-lg">{reminder.emoji}</span>
              ) : (
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  !hasCustomColor && isBuyer ? "bg-muted" : "bg-white/20"
                )}>
                  {isBuyer && !hasCustomColor ? (
                    <User className="w-4 h-4 text-foreground" />
                  ) : (
                    <FileText className={cn("w-4 h-4", darkBg ? "text-white" : "text-black")} />
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0 text-left">
                <p className={cn(
                  "font-semibold text-sm truncate",
                  !hasCustomColor && isBuyer ? "text-foreground" : darkBg ? "text-white" : "text-black"
                )}>
                  {reminder.name}
                </p>
                {reminder.lastComment?.text && (
                  <p className={cn(
                    "text-[9px] truncate mt-0.5 opacity-80",
                    !hasCustomColor && isBuyer ? "text-muted-foreground" : darkBg ? "text-white/70" : "text-black/60"
                  )}>
                    💬 {reminder.lastComment.text.replace(/<[^>]*>/g, '').trim()}
                    {reminder.lastComment.created_at && ` · ${format(parseISO(reminder.lastComment.created_at), 'd MMM', { locale: it })}`}
                  </p>
                )}
              </div>
              <span className={cn(
                "text-xs font-medium",
                !hasCustomColor && isBuyer ? "text-muted-foreground" : darkBg ? "text-white/70" : "text-black/60"
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
