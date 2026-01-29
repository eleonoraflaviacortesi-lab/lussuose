import { useState, useMemo, useRef } from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO, addWeeks, subWeeks } from 'date-fns';
import { it } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useAppointments } from '@/hooks/useAppointments';
import { useClienti } from '@/hooks/useClienti';
import { useNotizie } from '@/hooks/useNotizie';
import { useIsMobile } from '@/hooks/use-mobile';
import AddAppointmentDialog from './AddAppointmentDialog';
import CalendarEventCard from './CalendarEventCard';
import CalendarDayView from './CalendarDayView';
import EventDetailSheet from './EventDetailSheet';

export type CalendarEvent = {
  id: string;
  title: string;
  time: string;
  type: 'appointment' | 'cliente_reminder' | 'notizia_reminder';
  clienteId?: string;
  clienteName?: string;
  notiziaId?: string;
  completed?: boolean;
};

const CalendarPage = () => {
  const isMobile = useIsMobile();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayView, setShowDayView] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { appointments, isLoading: loadingAppointments, toggleCompleted } = useAppointments();
  const { clienti, isLoading: loadingClienti } = useClienti();
  const { notizie, isLoading: loadingNotizie } = useNotizie();

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    
    weekDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const events: CalendarEvent[] = [];

      // Add appointments
      appointments?.forEach(apt => {
        if (isSameDay(parseISO(apt.start_time), day)) {
          events.push({
            id: apt.id,
            title: apt.title,
            time: format(parseISO(apt.start_time), 'HH:mm'),
            type: 'appointment',
            clienteId: apt.cliente_id || undefined,
            clienteName: apt.cliente?.nome,
            completed: apt.completed,
          });
        }
      });

      // Add cliente reminders
      clienti?.forEach(cliente => {
        if (cliente.reminder_date && isSameDay(parseISO(cliente.reminder_date), day)) {
          events.push({
            id: `cliente-${cliente.id}`,
            title: cliente.nome,
            time: format(parseISO(cliente.reminder_date), 'HH:mm'),
            type: 'cliente_reminder',
            clienteId: cliente.id,
            clienteName: cliente.nome,
          });
        }
      });

      // Add notizia reminders
      notizie?.forEach(notizia => {
        if (notizia.reminder_date && isSameDay(parseISO(notizia.reminder_date), day)) {
          events.push({
            id: `notizia-${notizia.id}`,
            title: notizia.name,
            time: format(parseISO(notizia.reminder_date), 'HH:mm'),
            type: 'notizia_reminder',
            notiziaId: notizia.id,
          });
        }
      });

      // Sort by time
      events.sort((a, b) => a.time.localeCompare(b.time));
      map.set(dayKey, events);
    });

    return map;
  }, [weekDays, appointments, clienti, notizie]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekStart(prev => 
      direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1)
    );
  };

  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    if (isMobile) {
      setShowDayView(true);
    } else {
      setShowAddDialog(true);
    }
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
  };

  const handleToggleCompleted = (eventId: string, completed: boolean) => {
    // Only appointments can be toggled
    if (!eventId.startsWith('cliente-') && !eventId.startsWith('notizia-')) {
      toggleCompleted.mutate({ id: eventId, completed });
    }
  };

  const isLoading = loadingAppointments || loadingClienti || loadingNotizie;

  // Get events for selected date (day view)
  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    const dayKey = format(selectedDate, 'yyyy-MM-dd');
    return eventsByDay.get(dayKey) || [];
  }, [selectedDate, eventsByDay]);

  return (
    <div className="px-6 pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-foreground text-background flex items-center justify-center">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">CALENDARIO</h1>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground">
              TASKS & REMINDER
            </p>
          </div>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="bg-card rounded-2xl shadow-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateWeek('prev')}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4">
            <span className="text-lg font-semibold">
              {format(currentWeekStart, 'd MMM', { locale: it })} - {format(addDays(currentWeekStart, 6), 'd MMM yyyy', { locale: it })}
            </span>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-xs font-medium tracking-wider uppercase bg-muted rounded-full hover:bg-muted/80 transition-colors"
            >
              Oggi
            </button>
          </div>

          <button
            onClick={() => navigateWeek('next')}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-4 px-2 overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-3 h-3 rounded-full bg-accent" />
          <span className="text-xs text-muted-foreground">Appuntamenti</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-xs text-muted-foreground">Clienti</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-xs text-muted-foreground">Notizie</span>
        </div>
      </div>

      {/* Week Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
        </div>
      ) : isMobile ? (
        // Mobile: Horizontal scrolling days like Google Calendar
        <div 
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-4 -mx-2 px-2 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {weekDays.map((day) => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const events = eventsByDay.get(dayKey) || [];
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={dayKey}
                className={`bg-card rounded-2xl shadow-lg p-3 min-w-[280px] snap-center flex-shrink-0 transition-all ${
                  isToday ? 'ring-2 ring-accent' : ''
                }`}
                onClick={() => handleDayClick(day)}
              >
                {/* Day Header */}
                <div className="text-center mb-3 pb-2 border-b border-muted">
                  <p className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground">
                    {format(day, 'EEEE', { locale: it })}
                  </p>
                  <p className={`text-2xl font-semibold ${isToday ? 'text-accent' : 'text-foreground'}`}>
                    {format(day, 'd')}
                  </p>
                </div>

                {/* Events */}
                <div className="space-y-2 min-h-[120px]">
                  {events.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4 opacity-50">
                      Nessun evento
                    </p>
                  ) : (
                    events.slice(0, 4).map((event) => (
                      <CalendarEventCard 
                        key={event.id} 
                        event={event} 
                        onClick={(e) => handleEventClick(event, e)}
                        onToggle={handleToggleCompleted}
                        compact
                      />
                    ))
                  )}
                  {events.length > 4 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{events.length - 4} altri
                    </p>
                  )}
                </div>

                {/* View day / Add button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDayClick(day);
                  }}
                  className="w-full mt-2 py-2 rounded-lg bg-muted text-foreground font-medium text-xs tracking-wider uppercase hover:bg-muted/80 transition-colors"
                >
                  Vedi giorno
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        // Desktop: 7-column grid
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const events = eventsByDay.get(dayKey) || [];
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={dayKey}
                className={`bg-card rounded-2xl shadow-lg p-3 min-h-[200px] transition-all cursor-pointer hover:shadow-xl ${
                  isToday ? 'ring-2 ring-accent' : ''
                }`}
                onClick={() => handleDayClick(day)}
              >
                {/* Day Header */}
                <div className="text-center mb-3 pb-2 border-b border-muted">
                  <p className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground">
                    {format(day, 'EEE', { locale: it })}
                  </p>
                  <p className={`text-xl font-semibold ${isToday ? 'text-accent' : 'text-foreground'}`}>
                    {format(day, 'd')}
                  </p>
                </div>

                {/* Events */}
                <div className="space-y-2">
                  {events.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4 opacity-50">
                      Nessun evento
                    </p>
                  ) : (
                    events.map((event) => (
                      <CalendarEventCard 
                        key={event.id} 
                        event={event}
                        onClick={(e) => handleEventClick(event, e)}
                        onToggle={handleToggleCompleted}
                      />
                    ))
                  )}
                </div>

                {/* Add button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDate(day);
                    setShowAddDialog(true);
                  }}
                  className="w-full mt-2 py-1.5 rounded-lg border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-accent hover:text-accent transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span className="text-[10px] font-medium">Aggiungi</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Appointment Dialog */}
      <AddAppointmentDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        defaultDate={selectedDate}
      />

      {/* Day View Sheet (Mobile) */}
      <CalendarDayView
        open={showDayView}
        onOpenChange={setShowDayView}
        date={selectedDate}
        events={selectedDayEvents}
        onEventClick={(event) => setSelectedEvent(event)}
        onToggle={handleToggleCompleted}
        onAddClick={() => {
          setShowDayView(false);
          setShowAddDialog(true);
        }}
      />

      {/* Event Detail Sheet */}
      <EventDetailSheet
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        clienti={clienti}
        notizie={notizie}
      />
    </div>
  );
};

export default CalendarPage;