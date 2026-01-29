import { useState, useMemo, useRef, memo } from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO, addWeeks, subWeeks } from 'date-fns';
import { it } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight, Plus, X, Check, AlertTriangle } from 'lucide-react';
import { useAppointments } from '@/hooks/useAppointments';
import { useClienti } from '@/hooks/useClienti';
import { useNotizie, Notizia, NotiziaStatus } from '@/hooks/useNotizie';
import { useKanbanColumns, KanbanColumn } from '@/hooks/useKanbanColumns';
import { useIsMobile } from '@/hooks/use-mobile';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import AddAppointmentDialog from './AddAppointmentDialog';
import CalendarDayView from './CalendarDayView';
import NotiziaDetail from '@/components/notizie/NotiziaDetail';
import { ClienteDetail } from '@/components/clienti/ClienteDetail';
import { useProfiles } from '@/hooks/useProfiles';

export type CalendarEvent = {
  id: string;
  title: string;
  time: string;
  type: 'appointment' | 'cliente_reminder' | 'notizia_reminder';
  clienteId?: string;
  clienteName?: string;
  notiziaId?: string;
  completed?: boolean;
  emoji?: string;
  statusColor?: string; // Color based on status
  urgent?: boolean;
};

// Quick emojis
const QUICK_EMOJIS = ['🏠', '🏢', '🏘️', '🏡', '📍', '⭐', '🔑', '💎', '🌟', '❤️', '📋', '📞'];

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

// Context menu for events
const EventContextMenu = memo(({ 
  position, 
  event,
  columns,
  notizia,
  onStatusChange,
  onEmojiChange,
  onUrgentToggle,
  onClose 
}: { 
  position: { x: number; y: number }; 
  event: CalendarEvent;
  columns: KanbanColumn[];
  notizia?: Notizia | null;
  onStatusChange: (status: NotiziaStatus) => void;
  onEmojiChange: (emoji: string | null) => void;
  onUrgentToggle: () => void;
  onClose: () => void;
}) => {
  // Only show for notizia reminders
  if (event.type !== 'notizia_reminder') {
    return null;
  }
  
  // Get current notizia status to highlight it
  const currentStatus = notizia?.status || 'new';
  
  return (
    <>
      <div 
        className="fixed inset-0 z-50" 
        onClick={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      />
      <div
        className="fixed z-50 flex flex-col gap-2.5 p-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] animate-in zoom-in-95 fade-in duration-150"
        style={{
          left: Math.min(Math.max(10, position.x), window.innerWidth - 260),
          top: Math.min(position.y, window.innerHeight - 280),
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* Urgent toggle */}
        <div>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Priorità</span>
          <button
            onClick={() => { onUrgentToggle(); onClose(); }}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all w-full",
              event.urgent 
                ? "bg-red-500 text-white" 
                : "bg-muted hover:bg-red-100 text-foreground"
            )}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{event.urgent ? 'Urgente ✓' : 'Segna come urgente'}</span>
          </button>
        </div>

        {/* Separator */}
        <div className="h-px bg-muted/50" />

        {/* Emoji picker */}
        <div>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Emoji</span>
          <div className="flex flex-wrap items-center gap-1 max-w-[220px]">
            {event.emoji && (
              <button
                onClick={() => { onEmojiChange(null); onClose(); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center bg-muted hover:bg-destructive hover:text-white transition-colors"
                title="Rimuovi emoji"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => { onEmojiChange(emoji); onClose(); }}
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center text-base hover:bg-muted transition-colors",
                  event.emoji === emoji && "bg-muted ring-1 ring-foreground"
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        
        {/* Separator */}
        <div className="h-px bg-muted/50" />

        {/* Status selector */}
        <div>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Status</span>
          <div className="flex flex-wrap gap-1.5 max-w-[220px]">
            {columns.map((col) => (
              <button
                key={col.key}
                onClick={() => { onStatusChange(col.key as NotiziaStatus); onClose(); }}
                className={cn(
                  "px-2.5 py-1 text-[10px] font-medium rounded-full transition-all active:scale-95",
                  currentStatus === col.key && "ring-2 ring-offset-1 ring-foreground"
                )}
                style={{ 
                  backgroundColor: col.color,
                  color: isDarkColor(col.color) ? 'white' : 'black'
                }}
              >
                {col.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
});
EventContextMenu.displayName = 'EventContextMenu';

const CalendarPage = () => {
  const isMobile = useIsMobile();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayView, setShowDayView] = useState(false);
  
  // For opening detail modals
  const [selectedNotizia, setSelectedNotizia] = useState<Notizia | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<any | null>(null);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ event: CalendarEvent; position: { x: number; y: number } } | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const { appointments, isLoading: loadingAppointments, toggleCompleted } = useAppointments();
  const { clienti, isLoading: loadingClienti, updateCliente, deleteCliente, addComment } = useClienti();
  const { notizie, isLoading: loadingNotizie, updateNotizia } = useNotizie();
  const { columns } = useKanbanColumns();
  const { profiles } = useProfiles();

  // Helper to get status color from columns
  const getStatusColor = (status: string): string => {
    const col = columns.find(c => c.key === status);
    return col?.color || '#6b7280';
  };

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
            emoji: cliente.emoji,
            statusColor: getStatusColor(cliente.status),
          });
        }
      });

      // Add notizia reminders
      notizie?.forEach(notizia => {
        if (notizia.reminder_date && isSameDay(parseISO(notizia.reminder_date), day)) {
          // Check if note_extra contains "URGENT" flag (stored in notes field)
          const isUrgent = notizia.notes?.includes('[URGENT]') || false;
          
          events.push({
            id: `notizia-${notizia.id}`,
            title: notizia.name,
            time: format(parseISO(notizia.reminder_date), 'HH:mm'),
            type: 'notizia_reminder',
            notiziaId: notizia.id,
            emoji: notizia.emoji,
            statusColor: getStatusColor(notizia.status),
            urgent: isUrgent,
          });
        }
      });

      // Sort: urgent first, then by time
      events.sort((a, b) => {
        if (a.urgent && !b.urgent) return -1;
        if (!a.urgent && b.urgent) return 1;
        return a.time.localeCompare(b.time);
      });
      map.set(dayKey, events);
    });

    return map;
  }, [weekDays, appointments, clienti, notizie, columns]);

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

  const handleEventClick = (event: CalendarEvent) => {
    triggerHaptic('light');
    
    if (event.type === 'notizia_reminder' && event.notiziaId) {
      const notizia = notizie?.find(n => n.id === event.notiziaId);
      if (notizia) {
        setSelectedNotizia(notizia);
      }
    } else if (event.type === 'cliente_reminder' && event.clienteId) {
      const cliente = clienti?.find(c => c.id === event.clienteId);
      if (cliente) {
        setSelectedCliente(cliente);
      }
    } else if (event.type === 'appointment' && event.clienteId) {
      const cliente = clienti?.find(c => c.id === event.clienteId);
      if (cliente) {
        setSelectedCliente(cliente);
      }
    }
  };

  const handleContextMenu = (event: CalendarEvent, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (event.type === 'notizia_reminder') {
      setContextMenu({ event, position: { x: e.clientX - 100, y: e.clientY - 50 } });
    }
  };

  const handleTouchStart = (event: CalendarEvent, e: React.TouchEvent) => {
    if (event.type !== 'notizia_reminder') return;
    
    const touch = e.touches[0];
    longPressTimer.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(15);
      setContextMenu({ event, position: { x: touch.clientX - 100, y: touch.clientY - 60 } });
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleToggleCompleted = (eventId: string, completed: boolean) => {
    if (!eventId.startsWith('cliente-') && !eventId.startsWith('notizia-')) {
      toggleCompleted.mutate({ id: eventId, completed });
    }
  };

  const handleNotiziaStatusChange = (notiziaId: string, status: NotiziaStatus) => {
    updateNotizia.mutate({ id: notiziaId, status, silent: true });
  };

  const handleNotiziaEmojiChange = (notiziaId: string, emoji: string | null) => {
    updateNotizia.mutate({ id: notiziaId, emoji: emoji || undefined, silent: true });
  };

  const handleNotiziaUrgentToggle = (notiziaId: string, currentNotes: string | null, isCurrentlyUrgent: boolean) => {
    let newNotes = currentNotes || '';
    if (isCurrentlyUrgent) {
      // Remove [URGENT] flag
      newNotes = newNotes.replace('[URGENT]', '').trim();
    } else {
      // Add [URGENT] flag
      newNotes = '[URGENT] ' + newNotes;
    }
    updateNotizia.mutate({ id: notiziaId, notes: newNotes, silent: true });
  };

  const isLoading = loadingAppointments || loadingClienti || loadingNotizie;

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    const dayKey = format(selectedDate, 'yyyy-MM-dd');
    return eventsByDay.get(dayKey) || [];
  }, [selectedDate, eventsByDay]);

  // Agent data for ClienteDetail
  const agents = profiles?.map(p => ({
    user_id: p.user_id,
    full_name: p.full_name,
    avatar_emoji: p.avatar_emoji || '👤',
  })) || [];

  // Get notizia for context menu
  const contextMenuNotizia = contextMenu?.event.notiziaId 
    ? notizie?.find(n => n.id === contextMenu.event.notiziaId) 
    : null;

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

      {/* Week Navigation - Mobile optimized */}
      <div className="bg-card rounded-2xl shadow-lg p-3 sm:p-4 mb-6">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => navigateWeek('prev')}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-4 flex-1 justify-center min-w-0">
            <span className="text-sm sm:text-lg font-semibold text-center truncate">
              {format(currentWeekStart, 'd MMM', { locale: it })} - {format(addDays(currentWeekStart, 6), 'd MMM', { locale: it })}
            </span>
            <span className="text-xs text-muted-foreground sm:hidden">
              {format(currentWeekStart, 'yyyy')}
            </span>
            <button
              onClick={goToToday}
              className="px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium tracking-wider uppercase bg-muted rounded-full hover:bg-muted/80 transition-colors shrink-0"
            >
              Oggi
            </button>
          </div>

          <button
            onClick={() => navigateWeek('next')}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors shrink-0"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Week Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
        </div>
      ) : isMobile ? (
        <div 
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
                className={cn(
                  "bg-card rounded-2xl shadow-lg p-3 min-w-[280px] snap-center flex-shrink-0 transition-all",
                  isToday && "ring-2 ring-foreground"
                )}
                onClick={() => handleDayClick(day)}
              >
                <div className="text-center mb-3 pb-2 border-b border-muted">
                  <p className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground">
                    {format(day, 'EEEE', { locale: it })}
                  </p>
                  <p className={cn(
                    "text-2xl font-semibold",
                    isToday ? "text-foreground" : "text-foreground"
                  )}>
                    {format(day, 'd')}
                  </p>
                </div>

                <div className="space-y-2 min-h-[120px]">
                  {events.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4 opacity-50">
                      Nessun evento
                    </p>
                  ) : (
                    events.slice(0, 4).map((event) => (
                      <EventCard 
                        key={event.id} 
                        event={event}
                        onClick={() => handleEventClick(event)}
                        onContextMenu={(e) => handleContextMenu(event, e)}
                        onTouchStart={(e) => handleTouchStart(event, e)}
                        onTouchEnd={handleTouchEnd}
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
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const events = eventsByDay.get(dayKey) || [];
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={dayKey}
                className={cn(
                  "bg-card rounded-2xl shadow-lg p-3 min-h-[200px] transition-all cursor-pointer hover:shadow-xl",
                  isToday && "ring-2 ring-foreground"
                )}
                onClick={() => handleDayClick(day)}
              >
                <div className="text-center mb-3 pb-2 border-b border-muted">
                  <p className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground">
                    {format(day, 'EEE', { locale: it })}
                  </p>
                  <p className="text-xl font-semibold text-foreground">
                    {format(day, 'd')}
                  </p>
                </div>

                <div className="space-y-2">
                  {events.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4 opacity-50">
                      Nessun evento
                    </p>
                  ) : (
                    events.map((event) => (
                      <EventCard 
                        key={event.id} 
                        event={event}
                        onClick={() => handleEventClick(event)}
                        onContextMenu={(e) => handleContextMenu(event, e)}
                        onTouchStart={(e) => handleTouchStart(event, e)}
                        onTouchEnd={handleTouchEnd}
                        onToggle={handleToggleCompleted}
                      />
                    ))
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDate(day);
                    setShowAddDialog(true);
                  }}
                  className="w-full mt-2 py-1.5 rounded-lg border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
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
        onEventClick={handleEventClick}
        onToggle={handleToggleCompleted}
        onAddClick={() => {
          setShowDayView(false);
          setShowAddDialog(true);
        }}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />

      {/* Notizia Detail Modal */}
      <NotiziaDetail
        notizia={selectedNotizia}
        open={!!selectedNotizia}
        onOpenChange={(open) => !open && setSelectedNotizia(null)}
      />

      {/* Cliente Detail Modal */}
      <ClienteDetail
        cliente={selectedCliente}
        open={!!selectedCliente}
        onOpenChange={(open) => !open && setSelectedCliente(null)}
        agents={agents}
        onAssign={(agentId) => {
          if (selectedCliente) {
            updateCliente({ id: selectedCliente.id, assigned_to: agentId });
          }
        }}
        onAddComment={(comment) => {
          if (selectedCliente) {
            addComment({ id: selectedCliente.id, comment });
          }
        }}
        onDelete={() => {
          if (selectedCliente) {
            deleteCliente(selectedCliente.id);
            setSelectedCliente(null);
          }
        }}
        onUpdate={(updates) => {
          if (selectedCliente) {
            updateCliente({ id: selectedCliente.id, ...updates });
          }
        }}
      />

      {/* Context Menu */}
      {contextMenu && (
        <EventContextMenu
          position={contextMenu.position}
          event={contextMenu.event}
          columns={columns}
          notizia={contextMenuNotizia}
          onStatusChange={(status) => {
            const notiziaId = contextMenu.event.notiziaId;
            if (notiziaId) handleNotiziaStatusChange(notiziaId, status);
          }}
          onEmojiChange={(emoji) => {
            const notiziaId = contextMenu.event.notiziaId;
            if (notiziaId) handleNotiziaEmojiChange(notiziaId, emoji);
          }}
          onUrgentToggle={() => {
            const notiziaId = contextMenu.event.notiziaId;
            if (notiziaId && contextMenuNotizia) {
              handleNotiziaUrgentToggle(notiziaId, contextMenuNotizia.notes, contextMenu.event.urgent || false);
            }
          }}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

// Event Card component
const EventCard = memo(({ 
  event, 
  onClick,
  onContextMenu,
  onTouchStart,
  onTouchEnd,
  onToggle,
  compact 
}: {
  event: CalendarEvent;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onToggle: (id: string, completed: boolean) => void;
  compact?: boolean;
}) => {
  const getEventStyles = () => {
    // For notizia/cliente reminders, use the status color
    if (event.statusColor && (event.type === 'notizia_reminder' || event.type === 'cliente_reminder')) {
      const textColor = isDarkColor(event.statusColor) ? 'text-white' : 'text-foreground';
      return {
        bg: '',
        customBg: event.statusColor,
        border: 'border-transparent',
        textClass: textColor,
        timeClass: isDarkColor(event.statusColor) ? 'text-white/70' : 'text-muted-foreground',
      };
    }
    
    // Appointments use muted styles
    if (event.type === 'appointment') {
      return {
        bg: event.completed ? 'bg-muted' : 'bg-muted/50',
        customBg: null,
        border: 'border-transparent',
        textClass: event.completed ? 'line-through text-muted-foreground' : 'text-foreground',
        timeClass: 'text-muted-foreground',
      };
    }

    // Default
    return {
      bg: 'bg-muted/50',
      customBg: null,
      border: 'border-transparent',
      textClass: 'text-foreground',
      timeClass: 'text-muted-foreground',
    };
  };

  const styles = getEventStyles();
  const canToggle = event.type === 'appointment';

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canToggle) {
      triggerHaptic('light');
      onToggle(event.id, !event.completed);
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg p-2 transition-all hover:scale-[1.02] cursor-pointer relative",
        styles.bg,
        event.urgent && "ring-2 ring-red-500"
      )}
      style={styles.customBg ? { backgroundColor: styles.customBg } : undefined}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onContextMenu={onContextMenu}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchMove={onTouchEnd}
    >
      {event.urgent && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-2.5 h-2.5 text-white" />
        </div>
      )}
      <div className="flex items-start gap-2">
        {canToggle ? (
          <button
            onClick={handleToggle}
            className={cn(
              "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
              event.completed 
                ? 'bg-foreground border-foreground' 
                : 'border-muted-foreground/50 hover:border-foreground'
            )}
          >
            {event.completed && <Check className="w-3 h-3 text-background" />}
          </button>
        ) : event.emoji ? (
          <span className="text-sm shrink-0">{event.emoji}</span>
        ) : (
          <div 
            className="w-2 h-2 rounded-full mt-1.5 shrink-0"
            style={{ backgroundColor: event.statusColor || '#6b7280' }}
          />
        )}
        
        <div className="flex-1 min-w-0">
          <p className={cn("text-[10px] font-medium truncate", styles.textClass)}>
            {event.title}
          </p>
          <span className={cn("text-[9px]", styles.timeClass)}>
            {event.time}
          </span>
        </div>
      </div>
    </div>
  );
});
EventCard.displayName = 'EventCard';

export default CalendarPage;
