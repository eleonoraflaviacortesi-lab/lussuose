import { useState, useMemo, useRef, memo, useEffect, useCallback } from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO, addWeeks, subWeeks, setHours, setMinutes, startOfMonth, endOfMonth, addMonths, isSameMonth } from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, X, Check, AlertTriangle, Trash2, MessageCircle, Send, CalendarDays, Palette, Star, MoreHorizontal, User, FileText, Pencil } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import CommentPopover from './CommentPopover';
import { ColorPickerOverlay } from '@/components/ui/color-picker-overlay';
import { useFavoriteColors } from '@/hooks/useFavoriteColors';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useAppointments } from '@/hooks/useAppointments';
import { useClienti } from '@/hooks/useClienti';
import { useNotizie, Notizia, NotiziaStatus, NotiziaComment } from '@/hooks/useNotizie';
import { useTasks, Task } from '@/hooks/useTasks';
import { useKanbanColumns, KanbanColumn } from '@/hooks/useKanbanColumns';
import { useIsMobile } from '@/hooks/use-mobile';
import { triggerHaptic } from '@/lib/haptics';
import { cn, isDarkColor } from '@/lib/utils';
import AddAppointmentDialog from './AddAppointmentDialog';
import AddToCalendarMenu from './AddToCalendarMenu';
import AddTaskDialog from './AddTaskDialog';
import EditTaskDialog from './EditTaskDialog';
import TaskContextMenu from './TaskContextMenu';
import CalendarDayView from './CalendarDayView';
import NotiziaDetail from '@/components/notizie/NotiziaDetail';
import { ClienteDetail } from '@/components/clienti/ClienteDetail';
import { useProfiles } from '@/hooks/useProfiles';
import { useAuth } from '@/hooks/useAuth';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';

export type CalendarEvent = {
  id: string;
  title: string;
  type: 'appointment' | 'cliente_reminder' | 'notizia_reminder' | 'task';
  clienteId?: string;
  clienteName?: string;
  notiziaId?: string;
  taskId?: string;
  completed?: boolean;
  emoji?: string;
  statusColor?: string; // Color based on status
  urgent?: boolean;
  displayOrder?: number; // For ordering within a day
  lastComment?: NotiziaComment; // Last comment from notizia/cliente
  commentsCount?: number; // Total number of comments
  notes?: string; // For tasks
  cardColor?: string; // Custom color for task card
  isUrgent?: boolean; // Urgent flag for tasks
};

export type CalendarViewMode = 'day' | '3days' | 'week' | 'month';

// Quick emojis
const QUICK_EMOJIS = ['🏠', '🏢', '🏘️', '🏡', '📍', '⭐', '🔑', '💎', '🌟', '❤️', '📋', '📞', '📸'];


// Context menu for events
const EventContextMenu = memo(({
  position,
  event,
  columns,
  notizia,
  cliente,
  onStatusChange,
  onEmojiChange,
  onUrgentToggle,
  onRemoveReminder,
  onAddComment,
  onColorChange,
  onDateChange,
  onClose
}: {position: {x: number;y: number;};event: CalendarEvent;columns: KanbanColumn[];notizia?: Notizia | null;cliente?: any | null;onStatusChange: (status: NotiziaStatus) => void;onEmojiChange: (emoji: string | null) => void;onUrgentToggle: () => void;onRemoveReminder: () => void;onAddComment: (text: string) => void;onColorChange?: (color: string | null) => void;onDateChange?: (newDate: string) => void;onClose: () => void;}) => {
  const [commentText, setCommentText] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const { favorites, addFavorite, removeFavorite } = useFavoriteColors();
  const currentDate = notizia?.reminder_date || cliente?.reminder_date || null;
  const currentCardColor = event.cardColor || null;

  // Get current notizia status to highlight it
  const currentStatus = notizia?.status || 'new';
  const isNotiziaReminder = event.type === 'notizia_reminder';
  const isClienteReminder = event.type === 'cliente_reminder';

  // Get existing comments
  const comments = notizia?.comments || cliente?.comments || [];
  const lastComment = comments.length > 0 ? comments[comments.length - 1] : null;

  const handleAddComment = () => {
    if (commentText.trim()) {
      onAddComment(commentText.trim());
      setCommentText('');
      triggerHaptic('light');
      toast.success('Commento aggiunto');
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50"
        onClick={onClose}
        onContextMenu={(e) => {e.preventDefault();onClose();}} />

      <div
        className="fixed z-50 flex flex-col gap-2.5 p-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] animate-in zoom-in-95 fade-in duration-150 w-[340px] max-w-[90vw] max-h-[80vh] overflow-y-auto"
        style={{
          left: Math.min(Math.max(10, position.x), window.innerWidth - 360),
          top: Math.min(Math.max(10, position.y), window.innerHeight * 0.15)
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}>

        {/* Comments section - for notizie and clienti reminders */}
        {(isNotiziaReminder || isClienteReminder) &&
        <div>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 block flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              Commenti ({comments.length})
            </span>
            
            {/* Show last comment if exists */}
            {lastComment &&
          <div className="bg-muted/50 rounded-xl px-3 py-2 text-sm text-foreground mb-2 max-h-[60px] overflow-y-auto">
                <p className="text-[10px] text-muted-foreground mb-0.5">
                  {format(parseISO(lastComment.created_at), 'd MMM HH:mm', { locale: it })}
                </p>
                <p className="text-xs">{lastComment.text}</p>
              </div>
          }
            
            {/* Add new comment */}
            <div className="flex gap-2">
              <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Aggiungi commento..."
              className="flex-1 min-h-[40px] max-h-[80px] text-xs px-2.5 py-2 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddComment();
                }
              }} />

              <button
              onClick={handleAddComment}
              disabled={!commentText.trim()}
              className="w-9 h-9 shrink-0 rounded-xl bg-foreground text-background flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40">

                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        }

        {/* Emoji picker - for both notizie and clienti */}
        {(isNotiziaReminder || isClienteReminder) &&
        <>
            {/* Separator */}
            <div className="h-px bg-muted/50" />

            {/* Emoji picker */}
            <div>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Emoji</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {event.emoji &&
              <button
                onClick={() => {onEmojiChange(null);onClose();}}
                className="w-7 h-7 rounded-lg flex items-center justify-center bg-muted hover:bg-destructive hover:text-white transition-colors"
                title="Rimuovi emoji">

                    <X className="w-3.5 h-3.5" />
                  </button>
              }
                {QUICK_EMOJIS.map((emoji) =>
              <button
                key={emoji}
                onClick={() => {onEmojiChange(emoji);onClose();}}
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center text-base hover:bg-muted transition-colors",
                  event.emoji === emoji && "bg-muted ring-1 ring-foreground"
                )}>

                    {emoji}
                  </button>
              )}
              </div>
            </div>
          </>
        }

        {/* Color picker - for both notizie and clienti */}
        {(isNotiziaReminder || isClienteReminder) && onColorChange &&
        <>
            <div className="h-px bg-muted/50" />
            <div>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 block flex items-center gap-1">
                <Palette className="w-3 h-3" />
                Colore
              </span>
               <div className="flex flex-wrap items-center gap-1.5">
                {currentCardColor &&
              <button
                onClick={() => {onColorChange(null);onClose();}}
                className="w-7 h-7 rounded-lg flex items-center justify-center bg-muted hover:bg-destructive hover:text-white transition-colors"
                title="Rimuovi colore">
                
                    <X className="w-3.5 h-3.5" />
                  </button>
              }
                {['#FEF3C7', '#DCFCE7', '#DBEAFE', '#FCE7F3', '#E9D5FF', '#FED7AA', '#F3F4F6', '#FFFFFF'].map((color) =>
              <button
                key={color}
                onClick={() => {onColorChange(color);onClose();}}
                className={cn(
                  "w-7 h-7 rounded-lg transition-all hover:scale-110",
                  currentCardColor === color && "ring-2 ring-offset-1 ring-foreground"
                )}
                style={{ backgroundColor: color, border: color === '#FFFFFF' ? '1px solid #e5e7eb' : 'none' }} />

              )}
                <button
                onClick={() => setShowColorPicker(true)}
                className="w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-red-400 via-purple-400 to-blue-400 hover:scale-110 transition-transform"
                title="Colore personalizzato">
                
                  <span className="text-white text-xs font-bold">+</span>
                </button>
              </div>
              {/* Favorite colors */}
              {favorites.length > 0 &&
            <div className="mt-2">
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1 block flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Preferiti
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {favorites.map((color) =>
                <button
                  key={color}
                  onClick={() => {onColorChange(color);onClose();}}
                  onContextMenu={(e) => {e.preventDefault();removeFavorite(color);triggerHaptic('light');}}
                  className={cn(
                    "w-7 h-7 rounded-lg transition-all hover:scale-110 relative group",
                    currentCardColor === color && "ring-2 ring-offset-1 ring-foreground"
                  )}
                  style={{ backgroundColor: color }}
                  title="Click: applica · Tasto destro: rimuovi">
                  
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-destructive text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</span>
                      </button>
                )}
                  </div>
                </div>
            }
              {/* Save as favorite */}
              {currentCardColor && !['#FEF3C7', '#DCFCE7', '#DBEAFE', '#FCE7F3', '#E9D5FF', '#FED7AA', '#F3F4F6', '#FFFFFF'].includes(currentCardColor) && !favorites.includes(currentCardColor) &&
            <button
              onClick={() => {addFavorite(currentCardColor);triggerHaptic('light');}}
              className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
              
                  <Star className="w-3 h-3" />
                  Salva come preferito
                </button>
            }
            </div>
          </>
        }

        {isNotiziaReminder &&
        <>
            {/* Separator */}
            <div className="h-px bg-muted/50" />

            {/* Urgent toggle */}
            <div>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Priorità</span>
              <button
              onClick={() => {onUrgentToggle();onClose();}}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all w-full",
                event.urgent ?
                "bg-red-500 text-white" :
                "bg-muted hover:bg-red-100 text-foreground"
              )}>

                <AlertTriangle className="w-4 h-4" />
                <span>{event.urgent ? 'Urgente ✓' : 'Segna come urgente'}</span>
              </button>
            </div>

            {/* Separator */}
            <div className="h-px bg-muted/50" />

            {/* Status selector - horizontal colored pills */}
            <div>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Status</span>
              <div className="flex flex-wrap gap-1.5">
                {columns.map((col) =>
              <button
                key={col.key}
                onClick={() => {onStatusChange(col.key as NotiziaStatus);onClose();}}
                className={cn(
                  "px-2.5 py-1 text-[10px] font-medium rounded-full transition-all active:scale-95",
                  currentStatus === col.key && "ring-2 ring-offset-1 ring-foreground"
                )}
                style={{
                  backgroundColor: col.color,
                  color: isDarkColor(col.color) ? 'white' : 'black'
                }}>

                    {col.label}
                  </button>
              )}
              </div>
            </div>

            {/* Separator */}
            <div className="h-px bg-muted/50" />

            {/* Remove reminder */}
            <button
            onClick={() => {onRemoveReminder();onClose();}}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all w-full bg-muted hover:bg-destructive hover:text-white text-foreground">

              <Trash2 className="w-4 h-4" />
              <span>Rimuovi promemoria</span>
            </button>
          </>
        }

        {/* Cliente-specific options */}
        {isClienteReminder &&
        <>
            {/* Separator */}
            <div className="h-px bg-muted/50" />

            {/* Remove reminder */}
            <button
            onClick={() => {onRemoveReminder();onClose();}}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all w-full bg-muted hover:bg-destructive hover:text-white text-foreground">

              <Trash2 className="w-4 h-4" />
              <span>Rimuovi promemoria</span>
            </button>
          </>
        }

        {/* Change date */}
        {onDateChange &&
        <>
            <div className="h-px bg-muted/50" />
            <div>
              <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-muted hover:bg-accent text-foreground transition-all w-full">
              
                <CalendarDays className="w-4 h-4" />
                <span>Cambia data</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {currentDate ? format(parseISO(currentDate), 'd MMM', { locale: it }) : ''}
                </span>
              </button>
              {showDatePicker &&
            <span className="text-xs text-muted-foreground">Seleziona data…</span>
            }
            </div>
          </>
        }
      </div>
      {/* Date picker as separate floating window */}
      {showDatePicker && onDateChange &&
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/25 backdrop-blur-[3px]" onClick={(e) => {e.stopPropagation();setShowDatePicker(false);}}>
          <div
          className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-5 animate-in zoom-in-95 fade-in duration-200 border border-white/60"
          onClick={(e) => e.stopPropagation()}>
          
            <Calendar
            mode="single"
            selected={currentDate ? parseISO(currentDate) : undefined}
            onSelect={(date) => {
              if (date) {
                onDateChange(format(date, 'yyyy-MM-dd'));
                triggerHaptic('light');
                onClose();
              }
            }}
            locale={it}
            className="rounded-2xl p-2 pointer-events-auto" />
          
          </div>
        </div>
      }
      {/* Color picker overlay */}
      <ColorPickerOverlay
        open={showColorPicker}
        color={currentCardColor || '#FEF3C7'}
        onChange={(newColor) => {
          if (onColorChange) {onColorChange(newColor);onClose();}
          setShowColorPicker(false);
        }}
        onClose={() => setShowColorPicker(false)} />
      
    </>);

});
EventContextMenu.displayName = 'EventContextMenu';

const CalendarPage = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [viewMode, setViewMode] = useState<CalendarViewMode>('day');
  const [currentWeekStart, setCurrentWeekStart] = useState(() => new Date());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addMenuInitialType, setAddMenuInitialType] = useState<'cliente' | 'notizia' | null>(null);
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayView, setShowDayView] = useState(false);

  // For opening detail modals
  const [selectedNotizia, setSelectedNotizia] = useState<Notizia | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<any | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Task context menu state (separate from other events)
  const [taskContextMenu, setTaskContextMenu] = useState<{task: Task;position: {x: number;y: number;};} | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{event: CalendarEvent;position: {x: number;y: number;};} | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const weekScrollRef = useRef<HTMLDivElement>(null);

  // Track dragging state to prevent click on day during drag
  const [isDragging, setIsDragging] = useState(false);

  // Calendar-only event colors (stored in localStorage, not on notizia/cliente)
  const [calendarEventColors, setCalendarEventColors] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('calendar_event_colors');
      return stored ? JSON.parse(stored) : {};
    } catch {return {};}
  });

  const setCalendarEventColor = useCallback((eventId: string, color: string | null) => {
    setCalendarEventColors((prev) => {
      const next = { ...prev };
      if (color) next[eventId] = color;else
      delete next[eventId];
      localStorage.setItem('calendar_event_colors', JSON.stringify(next));
      return next;
    });
  }, []);

  const { appointments, isLoading: loadingAppointments, toggleCompleted } = useAppointments();
  const { clienti, isLoading: loadingClienti, updateCliente, deleteCliente, addComment: addClienteComment, reorderClienti } = useClienti();
  const { notizie, isLoading: loadingNotizie, updateNotizia, reorderNotizie } = useNotizie();
  const { tasks, isLoading: loadingTasks, toggleCompleted: toggleTaskCompleted, updateTask, deleteTask, reorderTasks } = useTasks();
  const { columns } = useKanbanColumns();
  const { profiles } = useProfiles();
  const { user } = useAuth();

  // Auto-open entity detail from navigation state (e.g. from dashboard widget)
  useEffect(() => {
    const state = location.state as { openEntityType?: string; openEntityId?: string } | null;
    if (!state?.openEntityType || !state?.openEntityId) return;
    if (loadingNotizie || loadingClienti) return;

    if (state.openEntityType === 'notizia') {
      const notizia = notizie?.find((n) => n.id === state.openEntityId);
      if (notizia) setSelectedNotizia(notizia);
    } else if (state.openEntityType === 'cliente') {
      const cliente = clienti?.find((c) => c.id === state.openEntityId);
      if (cliente) setSelectedCliente(cliente);
    }
    // Clear state to prevent re-opening on re-render
    window.history.replaceState({}, '');
  }, [location.state, notizie, clienti, loadingNotizie, loadingClienti]);


  // Helper to get status color from columns
  const getStatusColor = (status: string): string => {
    const col = columns.find((c) => c.key === status);
    return col?.color || '#6b7280';
  };

  // Helper to get last comment from notizia or cliente
  const getLastComment = (comments: NotiziaComment[] | undefined): NotiziaComment | undefined => {
    if (!comments || comments.length === 0) return undefined;
    return comments[comments.length - 1];
  };

  const viewDays = useMemo(() => {
    switch (viewMode) {
      case 'day':
        return [currentWeekStart];
      case '3days':
        return Array.from({ length: 3 }, (_, i) => addDays(currentWeekStart, i));
      case 'week':
        return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
      case 'month':{
          const monthStart = startOfMonth(currentWeekStart);
          const monthEnd = endOfMonth(currentWeekStart);
          const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
          const days: Date[] = [];
          let d = gridStart;
          while (d <= monthEnd || days.length % 7 !== 0) {
            days.push(d);
            d = addDays(d, 1);
            if (days.length > 42) break;
          }
          return days;
        }
    }
  }, [viewMode, currentWeekStart]);

  // Scroll to today's card on mount and when week changes (mobile)
  useEffect(() => {
    if (!isMobile || !weekScrollRef.current || viewMode === 'month') return;

    const container = weekScrollRef.current;
    // Wait for DOM to paint the cards, then center "today"
    const timeoutId = setTimeout(() => {
      const todayEl = container.querySelector('[data-today="true"]') as HTMLElement | null;
      if (todayEl) {
        todayEl.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' });
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [currentWeekStart, isMobile, viewMode]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();

    viewDays.forEach((day) => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const events: CalendarEvent[] = [];

      // Add appointments
      appointments?.forEach((apt) => {
        if (isSameDay(parseISO(apt.start_time), day)) {
          events.push({
            id: apt.id,
            title: apt.title,
            type: 'appointment',
            clienteId: apt.cliente_id || undefined,
            clienteName: apt.cliente?.nome,
            completed: apt.completed
          });
        }
      });

      // Add cliente reminders
      clienti?.forEach((cliente) => {
        if (cliente.reminder_date && isSameDay(parseISO(cliente.reminder_date), day)) {
          const clienteComments = (cliente.comments || []) as Array<{id: string;text: string;createdAt?: string;created_at?: string;}>;
          // Normalize to NotiziaComment format
          const normalizedComments: NotiziaComment[] = clienteComments.map((c) => ({
            id: c.id,
            text: c.text,
            created_at: c.created_at || c.createdAt || new Date().toISOString()
          }));
          const clienteEventId = `cliente-${cliente.id}`;
          events.push({
            id: clienteEventId,
            title: cliente.nome,
            type: 'cliente_reminder',
            clienteId: cliente.id,
            clienteName: cliente.nome,
            emoji: cliente.emoji,
            statusColor: getStatusColor(cliente.status),
            cardColor: calendarEventColors[clienteEventId] || undefined,
            displayOrder: cliente.display_order,
            lastComment: getLastComment(normalizedComments),
            commentsCount: normalizedComments.length,
            notes: cliente.note_extra || cliente.descrizione || undefined
          });
        }
      });

      // Add notizia reminders
      notizie?.forEach((notizia) => {
        if (notizia.reminder_date && isSameDay(parseISO(notizia.reminder_date), day)) {
          // Check if note_extra contains "URGENT" flag (stored in notes field)
          const isUrgent = notizia.notes?.includes('[URGENT]') || false;

          const notiziaEventId = `notizia-${notizia.id}`;
          events.push({
            id: notiziaEventId,
            title: notizia.name,
            type: 'notizia_reminder',
            notiziaId: notizia.id,
            emoji: notizia.emoji,
            statusColor: getStatusColor(notizia.status),
            cardColor: calendarEventColors[notiziaEventId] || undefined,
            urgent: isUrgent,
            displayOrder: notizia.display_order,
            lastComment: getLastComment(notizia.comments),
            commentsCount: notizia.comments?.length || 0,
            notes: notizia.notes?.replace('[URGENT]', '').trim() || undefined
          });
        }
      });

      // Add tasks
      tasks?.forEach((task) => {
        if (isSameDay(parseISO(task.due_date), day)) {
          events.push({
            id: `task-${task.id}`,
            title: task.title,
            type: 'task',
            taskId: task.id,
            completed: task.completed,
            emoji: '✏️',
            displayOrder: task.display_order,
            notes: task.notes || undefined,
            cardColor: task.card_color || undefined,
            isUrgent: task.is_urgent || false,
            urgent: task.is_urgent || false // Map to the general urgent field for sorting
          });
        }
      });

      // Sort: urgent first, then by displayOrder
      events.sort((a, b) => {
        if (a.urgent && !b.urgent) return -1;
        if (!a.urgent && b.urgent) return 1;
        return (a.displayOrder || 0) - (b.displayOrder || 0);
      });
      map.set(dayKey, events);
    });

    return map;
  }, [viewDays, appointments, clienti, notizie, tasks, columns, calendarEventColors]);

  const navigateCalendar = (direction: 'prev' | 'next') => {
    const delta = direction === 'next' ? 1 : -1;
    setCurrentWeekStart((prev) => {
      switch (viewMode) {
        case 'day':return addDays(prev, delta);
        case '3days':return addDays(prev, delta * 3);
        case 'week':return direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1);
        case 'month':return addMonths(prev, delta);
      }
    });
  };

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    triggerHaptic('light');
    navigateCalendar(direction === 'left' ? 'next' : 'prev');
  }, [viewMode]);

  const swipeHandlers = useSwipeGesture({
    onSwipe: handleSwipe,
    enabled: isMobile && (viewMode === 'day' || viewMode === '3days'),
    threshold: 60
  });

  const goToToday = () => {
    const today = new Date();
    switch (viewMode) {
      case 'day':setCurrentWeekStart(today);break;
      case '3days':setCurrentWeekStart(today);break;
      case 'week':setCurrentWeekStart(startOfWeek(today, { weekStartsOn: 1 }));break;
      case 'month':setCurrentWeekStart(startOfMonth(today));break;
    }
  };

  const headerLabel = useMemo(() => {
    switch (viewMode) {
      case 'day':return format(currentWeekStart, 'd MMMM yyyy', { locale: it });
      case '3days':return `${format(currentWeekStart, 'd MMM', { locale: it })} – ${format(addDays(currentWeekStart, 2), 'd MMM', { locale: it })}`;
      case 'week':return `${format(currentWeekStart, 'd MMM', { locale: it })} – ${format(addDays(currentWeekStart, 6), 'd MMM', { locale: it })}`;
      case 'month':return format(currentWeekStart, 'MMMM yyyy', { locale: it });
    }
  }, [viewMode, currentWeekStart]);

  const handleDayClick = (day: Date) => {
    // Don't open dialog if we just finished dragging
    if (isDragging) return;

    setSelectedDate(day);
    if (isMobile) {
      setShowDayView(true);
    } else {
      setShowAddDialog(true);
    }
  };

  // Drag start handler to track dragging state
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleEventClick = (event: CalendarEvent) => {
    triggerHaptic('light');

    // Tasks - open edit dialog
    if (event.type === 'task' && event.taskId) {
      const task = tasks?.find((t) => t.id === event.taskId);
      if (task) {
        setSelectedTask(task);
      }
      return;
    }

    if (event.type === 'notizia_reminder' && event.notiziaId) {
      const notizia = notizie?.find((n) => n.id === event.notiziaId);
      if (notizia) {
        setSelectedNotizia(notizia);
      }
    } else if (event.type === 'cliente_reminder' && event.clienteId) {
      const cliente = clienti?.find((c) => c.id === event.clienteId);
      if (cliente) {
        setSelectedCliente(cliente);
      }
    } else if (event.type === 'appointment' && event.clienteId) {
      const cliente = clienti?.find((c) => c.id === event.clienteId);
      if (cliente) {
        setSelectedCliente(cliente);
      }
    }
  };

  const handleContextMenu = (event: CalendarEvent, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Tasks have their own context menu
    if (event.type === 'task' && event.taskId) {
      const task = tasks?.find((t) => t.id === event.taskId);
      if (task) {
        setTaskContextMenu({ task, position: { x: e.clientX - 100, y: e.clientY - 50 } });
      }
      return;
    }

    // Allow context menu for all event types now (for notes)
    setContextMenu({ event, position: { x: e.clientX - 100, y: e.clientY - 50 } });
  };

  const handleTouchStart = (event: CalendarEvent, e: React.TouchEvent) => {
    // On mobile, don't use long-press for context menu - use explicit button instead
    if (isMobile) return;
    const touch = e.touches[0];
    longPressTimer.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(15);

      // Tasks have their own context menu
      if (event.type === 'task' && event.taskId) {
        const task = tasks?.find((t) => t.id === event.taskId);
        if (task) {
          setTaskContextMenu({ task, position: { x: touch.clientX - 100, y: touch.clientY - 60 } });
        }
        return;
      }

      setContextMenu({ event, position: { x: touch.clientX - 100, y: touch.clientY - 60 } });
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Mobile-specific: open context menu via explicit button tap
  const handleMobileContextMenu = useCallback((event: CalendarEvent) => {
    triggerHaptic('light');
    if (event.type === 'task' && event.taskId) {
      const task = tasks?.find((t) => t.id === event.taskId);
      if (task) {
        setTaskContextMenu({ task, position: { x: window.innerWidth / 2 - 150, y: window.innerHeight * 0.15 } });
      }
      return;
    }
    setContextMenu({ event, position: { x: window.innerWidth / 2 - 150, y: window.innerHeight * 0.15 } });
  }, [tasks]);

  // Task-specific handlers
  const handleTaskColorChange = (taskId: string, color: string | null) => {
    updateTask.mutate({ id: taskId, card_color: color });
    triggerHaptic('light');
    toast.success(color ? 'Colore aggiornato' : 'Colore rimosso');
  };

  const handleTaskUrgentToggle = (taskId: string, isCurrentlyUrgent: boolean) => {
    updateTask.mutate({ id: taskId, is_urgent: !isCurrentlyUrgent });
    triggerHaptic('light');
    toast.success(!isCurrentlyUrgent ? 'Segnata come urgente' : 'Urgenza rimossa');
  };

  const handleToggleCompleted = (eventId: string, completed: boolean) => {
    if (eventId.startsWith('task-')) {
      const taskId = eventId.replace('task-', '');
      toggleTaskCompleted.mutate({ id: taskId, completed });
      triggerHaptic('light');
    } else if (!eventId.startsWith('cliente-') && !eventId.startsWith('notizia-')) {
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

  const isLoading = loadingAppointments || loadingClienti || loadingNotizie || loadingTasks;

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    const dayKey = format(selectedDate, 'yyyy-MM-dd');
    return eventsByDay.get(dayKey) || [];
  }, [selectedDate, eventsByDay]);

  // Agent data for ClienteDetail
  const agents = profiles?.map((p) => ({
    user_id: p.user_id,
    full_name: p.full_name,
    avatar_emoji: p.avatar_emoji || '👤'
  })) || [];

  // Get notizia for context menu
  const contextMenuNotizia = contextMenu?.event.notiziaId ?
  notizie?.find((n) => n.id === contextMenu.event.notiziaId) :
  null;

  // Get cliente for context menu
  const contextMenuCliente = contextMenu?.event.clienteId ?
  clienti?.find((c) => c.id === contextMenu.event.clienteId) :
  null;

  // Handler to remove reminder from notizia
  const handleRemoveReminder = (notiziaId: string) => {
    updateNotizia.mutate({ id: notiziaId, reminder_date: null as any, silent: true });
  };

  // Handler to add reminder to existing cliente
  const handleAddClienteReminder = (clienteId: string, date: Date) => {
    updateCliente({ id: clienteId, reminder_date: date.toISOString() });
  };

  // Handler to add reminder to existing notizia  
  const handleAddNotiziaReminder = (notiziaId: string, date: Date) => {
    updateNotizia.mutate({ id: notiziaId, reminder_date: date.toISOString(), silent: true });
  };

  // Handler to add comment to notizia
  const handleAddNotiziaComment = (notiziaId: string, text: string) => {
    const notizia = notizie?.find((n) => n.id === notiziaId);
    if (!notizia) return;

    const newComment: NotiziaComment = {
      id: crypto.randomUUID(),
      text,
      created_at: new Date().toISOString()
    };

    updateNotizia.mutate({
      id: notiziaId,
      comments: [...(notizia.comments || []), newComment],
      silent: true
    });
  };

  // Handler to add comment to cliente  
  const handleAddClienteCommentFromCalendar = (clienteId: string, text: string) => {
    addClienteComment({ id: clienteId, comment: text });
  };

  // Helper to get comments array for an event
  const getEventComments = useCallback((event: CalendarEvent): NotiziaComment[] => {
    if (event.notiziaId) {
      const n = notizie?.find((x) => x.id === event.notiziaId);
      return n?.comments || [];
    }
    if (event.clienteId && event.type === 'cliente_reminder') {
      const c = clienti?.find((x) => x.id === event.clienteId);
      const raw = (c?.comments || []) as Array<{id: string;text: string;createdAt?: string;created_at?: string;}>;
      return raw.map((r) => ({ id: r.id, text: r.text, created_at: r.created_at || r.createdAt || new Date().toISOString() }));
    }
    return [];
  }, [notizie, clienti]);

  // Helper to add comment for an event
  const handleEventAddComment = useCallback((event: CalendarEvent, text: string) => {
    if (event.notiziaId) {
      handleAddNotiziaComment(event.notiziaId, text);
    } else if (event.clienteId && event.type === 'cliente_reminder') {
      handleAddClienteCommentFromCalendar(event.clienteId, text);
    }
  }, [notizie, clienti]);

  // Helper function to move an event to a specific date - defined first so it can be used in handleDragEnd
  const moveEvent = useCallback((draggableId: string, targetDate: Date) => {
    // Parse draggableId to get event type and id
    // Format: 'notizia-{id}' or 'cliente-{id}' or 'task-{id}'
    if (draggableId.startsWith('notizia-')) {
      const notiziaId = draggableId.replace('notizia-', '');
      const notizia = notizie?.find((n) => n.id === notiziaId);

      if (notizia) {
        // Use default time of 09:00 if no reminder_date exists
        let hours = 9;
        let minutes = 0;

        if (notizia.reminder_date) {
          try {
            const oldDate = parseISO(notizia.reminder_date);
            if (!isNaN(oldDate.getTime())) {
              hours = oldDate.getHours();
              minutes = oldDate.getMinutes();
            }
          } catch {









































            // Use default values
          }}const newDate = setMinutes(setHours(targetDate, hours), minutes);triggerHaptic('light');updateNotizia.mutate({ id: notiziaId, reminder_date: newDate.toISOString(), silent: true });toast.success(`Promemoria spostato a ${format(newDate, 'd MMM', { locale: it })}`);}} else if (draggableId.startsWith('cliente-')) {const clienteId = draggableId.replace('cliente-', '');const cliente = clienti?.find((c) => c.id === clienteId);if (cliente) {// Use default time of 09:00 if no reminder_date exists
        let hours = 9;let minutes = 0;if (cliente.reminder_date) {try {const oldDate = parseISO(cliente.reminder_date);if (!isNaN(oldDate.getTime())) {hours = oldDate.getHours();minutes = oldDate.getMinutes();}} catch {




























            // Use default values
          }}const newDate = setMinutes(setHours(targetDate, hours), minutes);triggerHaptic('light');updateCliente({ id: clienteId, reminder_date: newDate.toISOString() });toast.success(`Promemoria spostato a ${format(newDate, 'd MMM', { locale: it })}`);}} else if (draggableId.startsWith('task-')) {const taskId = draggableId.replace('task-', '');const task = tasks?.find((t) => t.id === taskId);if (task) {const newDateStr = format(targetDate, 'yyyy-MM-dd');triggerHaptic('light');updateTask.mutate({ id: taskId, due_date: newDateStr });toast.success(`Task spostata a ${format(targetDate, 'd MMM', { locale: it })}`);}}}, [notizie, clienti, tasks, updateNotizia, updateCliente, updateTask]); // Drag and drop handler
  const handleDragEnd = useCallback((result: DropResult) => {// Reset dragging state after a short delay to prevent click from firing
      setTimeout(() => setIsDragging(false), 100);try {const { destination, source, draggableId } = result; // Dropped outside
        if (!destination) {return;} // Handle week navigation drops
        if (destination.droppableId === 'prev-week') {const targetDate = addDays(currentWeekStart, -1); // Last day of previous week (Sunday)
          moveEvent(draggableId, targetDate);return;
        }

        if (destination.droppableId === 'next-week') {
          const targetDate = addDays(currentWeekStart, 7); // First day of next week (Monday)
          moveEvent(draggableId, targetDate);
          return;
        }

        // Same position - no change needed (reordering in same day is a no-op for date)
        if (destination.droppableId === source.droppableId && destination.index === source.index) {
          return;
        }

        // Same day but different position - reorder within the day
        if (destination.droppableId === source.droppableId) {
          const dayKey = source.droppableId.replace('day-', '');
          const events = eventsByDay.get(dayKey) || [];

          // Get only draggable events (same filter as in the render)
          const draggableEvents = events.filter((e) =>
          e.type === 'notizia_reminder' ||
          e.type === 'cliente_reminder' ||
          e.type === 'task'
          );

          // Create a copy and reorder
          const reordered = [...draggableEvents];
          const [removed] = reordered.splice(source.index, 1);
          reordered.splice(destination.index, 0, removed);

          // Calculate new display_order for all events in this day and group by type
          const taskUpdates: {id: string;display_order: number;}[] = [];
          const notiziaUpdates: {id: string;display_order: number;}[] = [];
          const clienteUpdates: {id: string;display_order: number;}[] = [];

          reordered.forEach((event, index) => {
            const newOrder = index * 10;
            if (event.type === 'task' && event.taskId) {
              taskUpdates.push({ id: event.taskId, display_order: newOrder });
            } else if (event.type === 'notizia_reminder' && event.notiziaId) {
              notiziaUpdates.push({ id: event.notiziaId, display_order: newOrder });
            } else if (event.type === 'cliente_reminder' && event.clienteId) {
              clienteUpdates.push({ id: event.clienteId, display_order: newOrder });
            }
          });

          // Batch updates for each type
          if (taskUpdates.length > 0) reorderTasks.mutate(taskUpdates);
          if (notiziaUpdates.length > 0) reorderNotizie.mutate(notiziaUpdates);
          if (clienteUpdates.length > 0) reorderClienti.mutate(clienteUpdates);

          triggerHaptic('light');
          return;
        }

        // Get the target day from droppableId (format: 'day-yyyy-MM-dd')
        const targetDayKey = destination.droppableId.replace('day-', '');

        // Validate the date string before parsing
        if (!targetDayKey || !/^\d{4}-\d{2}-\d{2}$/.test(targetDayKey)) {
          console.error('Invalid target date key:', targetDayKey);
          return;
        }

        const targetDate = parseISO(targetDayKey);

        // Check if targetDate is valid
        if (isNaN(targetDate.getTime())) {
          console.error('Invalid target date:', targetDayKey);
          return;
        }

        moveEvent(draggableId, targetDate);
      } catch (error) {
        console.error('Error during drag and drop:', error);
        toast.error('Errore durante lo spostamento. Riprova.');
      }
    }, [currentWeekStart, moveEvent]);

  // Legacy alias for backward compatibility
  const moveEventToDate = moveEvent;

  return (
    <div className="pb-8 animate-fade-in pt-[3px]">

      {/* Week Navigation - Mobile optimized */}
      <div className="bg-card rounded-2xl p-3 sm:p-4 mb-6 opacity-100 border border-border pt-[16px] mx-0 px-0">
        {/* View mode toggle */}
        <div className="flex items-center justify-center gap-1 mb-3">
          {(['day', '3days', 'week', 'month'] as CalendarViewMode[]).map((mode) =>
          <button
            key={mode}
            onClick={() => {
              setViewMode(mode);
              const today = new Date();
              switch (mode) {
                case 'day':setCurrentWeekStart(today);break;
                case '3days':setCurrentWeekStart(today);break;
                case 'week':setCurrentWeekStart(startOfWeek(today, { weekStartsOn: 1 }));break;
                case 'month':setCurrentWeekStart(startOfMonth(today));break;
              }
            }}
            className={cn(
              "px-3 py-1 text-[10px] sm:text-xs font-medium tracking-wider uppercase rounded-full transition-colors",
              viewMode === mode ?
              "bg-foreground text-background" :
              "bg-muted text-muted-foreground hover:bg-muted/80"
            )}>
            
              {mode === 'day' ? 'Giorno' : mode === '3days' ? '3gg' : mode === 'week' ? 'Settimana' : 'Mese'}
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => navigateCalendar('prev')}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors shrink-0 bg-card border border-border">
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-4 flex-1 justify-center min-w-0">
            <span className="text-sm sm:text-lg font-semibold text-center truncate capitalize">
              {headerLabel}
            </span>
            <button
              onClick={goToToday}
              className="px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium tracking-wider uppercase bg-muted rounded-full hover:bg-muted/80 transition-colors shrink-0">
              Oggi
            </button>
          </div>

          <button
            onClick={() => navigateCalendar('next')}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors shrink-0 bg-white">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      {isLoading ?
      <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
        </div> :
      viewMode === 'month' ?
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="px-6">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((d) =>
            <div key={d} className="text-center text-[10px] font-medium tracking-wider uppercase text-muted-foreground py-1">
                  {d}
                </div>
            )}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {viewDays.map((day) => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const events = eventsByDay.get(dayKey) || [];
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentWeekStart);
              const draggableEvents = events.filter((e) => e.type === 'notizia_reminder' || e.type === 'cliente_reminder' || e.type === 'task');

              return (
                <Droppable droppableId={`day-${dayKey}`} key={dayKey}>
                    {(provided, snapshot) =>
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "bg-card rounded-xl p-1.5 sm:p-2 min-h-[80px] sm:min-h-[100px] cursor-pointer transition-all",
                      isToday && "ring-2 ring-foreground",
                      !isCurrentMonth && "opacity-40",
                      snapshot.isDraggingOver && "ring-2 ring-primary bg-primary/5"
                    )}
                    onClick={() => {
                      setSelectedDate(day);
                      if (isMobile) setShowDayView(true);else
                      setShowAddMenu(true);
                    }}>
                    
                        <p className={cn("text-[10px] sm:text-xs font-semibold mb-1", isToday ? "text-foreground" : "text-muted-foreground")}>
                          {format(day, 'd')}
                        </p>
                        <div className="space-y-0.5">
                          {draggableEvents.slice(0, isMobile ? 2 : 3).map((event, index) =>
                      <Draggable key={event.id} draggableId={event.id} index={index}>
                              {(dragProv) =>
                        <div
                          ref={dragProv.innerRef}
                          {...dragProv.draggableProps}
                          {...dragProv.dragHandleProps}
                          className={cn(
                            "text-[8px] sm:text-[9px] font-medium truncate rounded px-1 py-0.5 cursor-grab",
                            event.type === 'task' && event.completed && "line-through opacity-60"
                          )}
                          style={{
                            backgroundColor: event.cardColor ?
                            event.cardColor :
                            event.type === 'notizia_reminder' && event.statusColor ?
                            event.statusColor :
                            event.type === 'cliente_reminder' && event.statusColor ?
                            event.statusColor :
                            'hsl(var(--muted))',
                            color: (() => {
                              const bg = event.cardColor || (event.statusColor && (event.type === 'notizia_reminder' || event.type === 'cliente_reminder') ? event.statusColor : null);
                              return bg && isDarkColor(bg) ? 'white' : undefined;
                            })(),
                            border: (() => {
                              const bg = event.cardColor || (
                              event.type === 'notizia_reminder' && event.statusColor ? event.statusColor : null) || (
                              event.type === 'cliente_reminder' && event.statusColor ? event.statusColor : null);
                              return bg && isDarkColor(bg) ? 'none' : '1px solid #d1d5db';
                            })(),
                            ...dragProv.draggableProps.style
                          }}
                          onClick={(e) => {e.stopPropagation();handleEventClick(event);}}>
                          
                                  {event.emoji && <span className="mr-0.5">{event.emoji}</span>}
                                  {event.title}
                                </div>
                        }
                            </Draggable>
                      )}
                          {events.length > (isMobile ? 2 : 3) &&
                      <p className="text-[8px] text-muted-foreground">+{events.length - (isMobile ? 2 : 3)}</p>
                      }
                        </div>
                        {provided.placeholder}
                      </div>
                  }
                  </Droppable>);

            })}
            </div>
          </div>
        </DragDropContext> :
      isMobile ?
      <div
        ref={weekScrollRef}
        className={cn(
          "pb-4 px-6 scrollbar-hide",
          viewMode === 'day' ? 'flex flex-col gap-3' : 'flex gap-3 overflow-x-auto'
        )}
        {...swipeHandlers}
        style={viewMode === 'day' ? undefined : {
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'x proximity'
        }}>
        
          {viewDays.map((day) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const events = eventsByDay.get(dayKey) || [];
          const isToday = isSameDay(day, new Date());
          const maxVisible = viewMode === 'day' ? 10 : 4;

          return (
            <div
              key={dayKey}
              data-today={isToday ? 'true' : undefined}
              className={cn(
                "bg-card rounded-2xl border border-border p-3 transition-all",
                viewMode === 'day' ? 'w-full' : 'min-w-[280px] flex-shrink-0',
                isToday && "ring-2 ring-foreground"
              )}
              style={viewMode !== 'day' ? { scrollSnapAlign: 'center' } : undefined}
              onClick={() => handleDayClick(day)}>
              
                <div className="text-center mb-3 pb-2 border-b border-muted">
                  <p className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground">
                    {format(day, 'EEEE', { locale: it })}
                  </p>
                  <p className="text-2xl font-semibold text-foreground">
                    {format(day, 'd')}
                  </p>
                </div>

                <div className="space-y-2 min-h-[120px]">
                  {events.length === 0 ?
                <p className="text-xs text-muted-foreground text-center py-4 opacity-50">
                      Nessun evento
                    </p> :

                events.slice(0, maxVisible).map((event) =>
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => handleEventClick(event)}
                  onContextMenu={(e) => handleContextMenu(event, e)}
                  onTouchStart={(e) => handleTouchStart(event, e)}
                  onTouchEnd={handleTouchEnd}
                  onToggle={handleToggleCompleted}
                  hasComment={!!event.lastComment}
                  comments={getEventComments(event)}
                  onAddComment={(text) => handleEventAddComment(event, text)}
                  compact
                  isMobile={isMobile}
                  onMobileMenu={() => handleMobileContextMenu(event)} />

                )
                }
                  {events.length > maxVisible &&
                <p className="text-xs text-muted-foreground text-center">
                      +{events.length - maxVisible} altri
                    </p>
                }
                </div>

                <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDayClick(day);
                }}
                className="w-full mt-2 py-2 rounded-lg bg-muted text-foreground font-medium text-xs tracking-wider uppercase hover:bg-muted/80 transition-colors">
                
                  Vedi giorno
                </button>
              </div>);

        })}
        </div> :

      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex items-stretch gap-2 px-0">
            {viewMode === 'week' &&
          <Droppable droppableId="prev-week">
                {(provided, snapshot) =>
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn("w-12 shrink-0 rounded-2xl border-dashed transition-all flex flex-col items-center justify-center gap-2 border-0",

              snapshot.isDraggingOver ?
              "border-primary bg-primary/10 text-primary" :
              "border-muted-foreground/20 text-muted-foreground/50"
              )}>
              
                    <ChevronLeft className="w-5 h-5" />
                    <span className="text-[9px] font-medium tracking-wider uppercase" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                      Sett. prec.
                    </span>
                    {provided.placeholder}
                  </div>
            }
              </Droppable>
          }

            <div className={cn(
            "grid gap-2 flex-1",
            viewMode === 'day' ? 'grid-cols-1 max-w-2xl mx-auto' : viewMode === '3days' ? 'grid-cols-3' : 'grid-cols-7'
          )}>
              {viewDays.map((day) => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const events = eventsByDay.get(dayKey) || [];
              const isToday = isSameDay(day, new Date());
              const draggableEvents = events.filter((e) => e.type === 'notizia_reminder' || e.type === 'cliente_reminder' || e.type === 'task');
              const appointmentEvents = events.filter((e) => e.type === 'appointment');

              return (
                <Droppable droppableId={`day-${dayKey}`} key={dayKey}>
                    {(provided, snapshot) =>
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "bg-card rounded-2xl border border-border p-3 min-h-[200px] transition-all cursor-pointer",
                      isToday && "ring-2 ring-foreground",
                      snapshot.isDraggingOver && "ring-2 ring-primary bg-primary/5"
                    )}
                    onClick={() => handleDayClick(day)}>
                    
                        <div className="text-center mb-3 pb-2 border-b border-muted">
                          <p className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground">
                            {format(day, viewMode === 'day' ? 'EEEE' : 'EEE', { locale: it })}
                          </p>
                          <p className="text-xl font-semibold text-foreground">
                            {format(day, 'd')}
                          </p>
                        </div>

                        <div className="space-y-2 min-h-[80px]">
                          {appointmentEvents.map((event) =>
                      <EventCard
                        key={event.id}
                        event={event}
                        onClick={() => handleEventClick(event)}
                        onContextMenu={(e) => handleContextMenu(event, e)}
                        onTouchStart={(e) => handleTouchStart(event, e)}
                        onTouchEnd={handleTouchEnd}
                        onToggle={handleToggleCompleted}
                        hasComment={false}
                        showDetails={viewMode === 'day'} />

                      )}
                          
                          {draggableEvents.map((event, index) =>
                      <Draggable key={event.id} draggableId={event.id} index={index}>
                              {(dragProv, dragSnap) =>
                        <div
                          ref={dragProv.innerRef}
                          {...dragProv.draggableProps}
                          style={dragProv.draggableProps.style}>
                          
                                  <DraggableEventCard
                            event={event}
                            onClick={() => handleEventClick(event)}
                            onContextMenu={(e) => handleContextMenu(event, e)}
                            onTouchStart={(e) => handleTouchStart(event, e)}
                            onTouchEnd={handleTouchEnd}
                            onToggle={handleToggleCompleted}
                            isDragging={dragSnap.isDragging}
                            hasComment={!!event.lastComment}
                            comments={getEventComments(event)}
                            onAddComment={(text) => handleEventAddComment(event, text)}
                            dragHandleProps={dragProv.dragHandleProps}
                            showDetails={viewMode === 'day'} />
                          
                                </div>
                        }
                            </Draggable>
                      )}
                          
                          {events.length === 0 &&
                      <p className="text-xs text-muted-foreground text-center py-4 opacity-50">
                              Nessun evento
                            </p>
                      }
                          {provided.placeholder}
                        </div>

                        {viewMode === 'day' ?
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-muted border-0">
                            <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(day);
                          setShowAddMenu(true);
                          setAddMenuInitialType('cliente');
                        }}
                        className="flex-1 py-2 rounded-xl border border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5 text-[10px] font-medium">
                        
                              <User className="w-3.5 h-3.5" />
                              Buyer
                            </button>
                            <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(day);
                          setShowAddMenu(true);
                          setAddMenuInitialType('notizia');
                        }}
                        className="flex-1 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5 text-[10px] font-medium">
                        
                              <FileText className="w-3.5 h-3.5" />
                              Seller
                            </button>
                            <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(day);
                          setShowAddTaskDialog(true);
                        }}
                        className="flex-1 py-2 rounded-xl border border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5 text-[10px] font-medium">
                        
                              <Pencil className="w-3.5 h-3.5" />
                              Task
                            </button>
                          </div> :

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDate(day);
                        setShowAddMenu(true);
                      }}
                      className="w-full mt-2 py-1.5 rounded-lg border-dashed border-muted-foreground/30 text-muted-foreground hover:border-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1 border-0">
                      
                            <Plus className="w-3 h-3" />
                            <span className="text-[10px] font-medium">Aggiungi</span>
                          </button>
                    }
                      </div>
                  }
                  </Droppable>);

            })}
            </div>

            {viewMode === 'week' &&
          <Droppable droppableId="next-week">
                {(provided, snapshot) =>
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn("w-12 shrink-0 rounded-2xl border-dashed transition-all flex flex-col items-center justify-center gap-2 border-0",

              snapshot.isDraggingOver ?
              "border-primary bg-primary/10 text-primary" :
              "border-muted-foreground/20 text-muted-foreground/50"
              )}>
              
                    <ChevronRight className="w-5 h-5" />
                    <span className="text-[9px] font-medium tracking-wider uppercase" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                      Sett. succ.
                    </span>
                    {provided.placeholder}
                  </div>
            }
              </Droppable>
          }
          </div>
        </DragDropContext>
      }

      {/* Add Appointment Dialog */}
      <AddAppointmentDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        defaultDate={selectedDate} />


      {/* Add to Calendar Menu */}
      {selectedDate &&
      <AddToCalendarMenu
        open={showAddMenu}
        onOpenChange={(open) => {setShowAddMenu(open);if (!open) setAddMenuInitialType(null);}}
        date={selectedDate}
        clienti={clienti || []}
        notizie={notizie || []}
        initialType={addMenuInitialType}
        onAddAppointment={() => {
          setShowAddMenu(false);
          setAddMenuInitialType(null);
          setShowAddDialog(true);
        }}
        onAddClienteReminder={handleAddClienteReminder}
        onAddNotiziaReminder={handleAddNotiziaReminder}
        onAddTask={() => {
          setShowAddMenu(false);
          setAddMenuInitialType(null);
          setShowAddTaskDialog(true);
        }} />

      }

      {/* Add Task Dialog */}
      {selectedDate &&
      <AddTaskDialog
        open={showAddTaskDialog}
        onOpenChange={setShowAddTaskDialog}
        date={selectedDate} />

      }

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
          setShowAddMenu(true);
        }}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMobileMenu={handleMobileContextMenu} />


      {/* Notizia Detail Modal */}
      <NotiziaDetail
        notizia={selectedNotizia}
        open={!!selectedNotizia}
        onOpenChange={(open) => !open && setSelectedNotizia(null)} />


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
            addClienteComment({ id: selectedCliente.id, comment });
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
            setSelectedCliente((prev: any) => prev ? { ...prev, ...updates } : prev);
            updateCliente({ id: selectedCliente.id, ...updates });
          }
        }} />


      {/* Edit Task Dialog */}
      <EditTaskDialog
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        task={selectedTask} />


      {/* Context Menu */}
      {contextMenu &&
      <EventContextMenu
        position={contextMenu.position}
        event={contextMenu.event}
        columns={columns}
        notizia={contextMenuNotizia}
        cliente={contextMenuCliente}
        onStatusChange={(status) => {
          const notiziaId = contextMenu.event.notiziaId;
          if (notiziaId) handleNotiziaStatusChange(notiziaId, status);
        }}
        onEmojiChange={(emoji) => {
          const notiziaId = contextMenu.event.notiziaId;
          const clienteId = contextMenu.event.clienteId;
          if (notiziaId) {
            handleNotiziaEmojiChange(notiziaId, emoji);
          } else if (clienteId) {
            updateCliente({ id: clienteId, emoji: emoji || undefined });
          }
        }}
        onUrgentToggle={() => {
          const notiziaId = contextMenu.event.notiziaId;
          if (notiziaId && contextMenuNotizia) {
            handleNotiziaUrgentToggle(notiziaId, contextMenuNotizia.notes, contextMenu.event.urgent || false);
          }
        }}
        onRemoveReminder={() => {
          const notiziaId = contextMenu.event.notiziaId;
          const clienteId = contextMenu.event.clienteId;
          if (notiziaId) {
            handleRemoveReminder(notiziaId);
          } else if (clienteId) {
            updateCliente({ id: clienteId, reminder_date: null as any });
          }
        }}
        onAddComment={(text) => {
          if (contextMenu.event.notiziaId) {
            handleAddNotiziaComment(contextMenu.event.notiziaId, text);
          } else if (contextMenu.event.clienteId) {
            handleAddClienteCommentFromCalendar(contextMenu.event.clienteId, text);
          }
        }}
        onColorChange={(color) => {
          setCalendarEventColor(contextMenu.event.id, color);
          triggerHaptic('light');
          toast.success(color ? 'Colore aggiornato' : 'Colore rimosso');
          setContextMenu(null);
        }}
        onDateChange={(newDate) => {
          const notiziaId = contextMenu.event.notiziaId;
          const clienteId = contextMenu.event.clienteId;
          if (notiziaId) {
            updateNotizia.mutate({ id: notiziaId, reminder_date: new Date(newDate).toISOString(), silent: true });
            toast.success('Data aggiornata');
          } else if (clienteId) {
            updateCliente({ id: clienteId, reminder_date: new Date(newDate).toISOString() });
            toast.success('Data aggiornata');
          }
          setContextMenu(null);
        }}
        onClose={() => setContextMenu(null)} />

      }

      {/* Task Context Menu */}
      {taskContextMenu &&
      <TaskContextMenu
        position={taskContextMenu.position}
        task={taskContextMenu.task}
        onColorChange={(color) => handleTaskColorChange(taskContextMenu.task.id, color)}
        onUrgentToggle={() => handleTaskUrgentToggle(taskContextMenu.task.id, taskContextMenu.task.is_urgent)}
        onDateChange={async (newDate) => {
          try {
            await updateTask.mutateAsync({ id: taskContextMenu.task.id, due_date: newDate });
            toast.success('Data aggiornata');
          } catch (error) {
            console.error('Error updating task date:', error);
            toast.error('Errore aggiornamento data');
          }
          setTaskContextMenu(null);
        }}
        onDelete={async () => {
          try {
            await deleteTask.mutateAsync(taskContextMenu.task.id);
            toast.success('Task eliminata');
          } catch (error) {
            console.error('Error deleting task:', error);
            toast.error('Errore eliminazione task');
          }
          setTaskContextMenu(null);
        }}
        onClose={() => setTaskContextMenu(null)} />

      }
    </div>);

};

// Event Card component for rendering individual events
const EventCard = memo(({
  event, onClick, onContextMenu, onTouchStart, onTouchEnd, onToggle, hasComment, compact, comments, onAddComment, showDetails, onMobileMenu, isMobile
}: {event: CalendarEvent;onClick: () => void;onContextMenu: (e: React.MouseEvent) => void;onTouchStart: (e: React.TouchEvent) => void;onTouchEnd: () => void;onToggle: (id: string, completed: boolean) => void;hasComment?: boolean;compact?: boolean;comments?: NotiziaComment[];onAddComment?: (text: string) => void;showDetails?: boolean;onMobileMenu?: () => void;isMobile?: boolean;}) => {
  const getEventStyles = () => {
    // Tasks - white card with black border by default, or custom color
    if (event.type === 'task') {
      const hasCustomColor = !!event.cardColor;
      const baseColor = event.cardColor || null;
      const textColor = hasCustomColor && baseColor && isDarkColor(baseColor) ? 'text-white' : 'text-foreground';

      return {
        bg: hasCustomColor ? '' : 'bg-white',
        customBg: baseColor,
        border: hasCustomColor ? 'border-transparent' : 'border border-foreground',
        textClass: event.completed ? 'line-through text-muted-foreground' : textColor,
        timeClass: 'text-muted-foreground',
        isBuyer: false,
        showBuyerBadge: false,
        showTaskBadge: true,
        canToggle: true
      };
    }

    // Buyers (cliente_reminder)
    if (event.type === 'cliente_reminder') {
      const hasCustomColor = !!event.cardColor;
      const baseColor = event.cardColor || null;
      const textColor = hasCustomColor && baseColor && isDarkColor(baseColor) ? 'text-white' : 'text-foreground';
      return {
        bg: hasCustomColor ? '' : 'bg-white',
        customBg: baseColor,
        border: hasCustomColor ? baseColor && isDarkColor(baseColor) ? 'border-transparent' : 'border border-gray-300' : 'border border-foreground',
        textClass: textColor,
        timeClass: hasCustomColor && baseColor && isDarkColor(baseColor) ? 'text-white/70' : 'text-muted-foreground',
        isBuyer: true,
        showBuyerBadge: true,
        showTaskBadge: false,
        canToggle: false
      };
    }

    // Sellers (notizie) - use cardColor override or kanban status color
    if (event.type === 'notizia_reminder') {
      const baseColor = event.cardColor || event.statusColor || '#8B9A7D';
      const textColor = isDarkColor(baseColor) ? 'text-white' : 'text-foreground';
      return {
        bg: '',
        customBg: baseColor,
        border: isDarkColor(baseColor) ? 'border-transparent' : 'border border-gray-300',
        textClass: textColor,
        timeClass: isDarkColor(baseColor) ? 'text-white/70' : 'text-muted-foreground',
        isBuyer: false,
        showBuyerBadge: false,
        showTaskBadge: false,
        canToggle: false
      };
    }

    // Appointments - sage green
    if (event.type === 'appointment') {
      return {
        bg: event.completed ? 'bg-[#8B9A7D]/50' : 'bg-[#8B9A7D]/30',
        customBg: null,
        border: 'border-transparent',
        textClass: event.completed ? 'line-through text-muted-foreground' : 'text-foreground',
        timeClass: 'text-muted-foreground',
        isBuyer: false,
        showBuyerBadge: false,
        showTaskBadge: false,
        canToggle: true
      };
    }

    return {
      bg: 'bg-[#8B9A7D]/30',
      customBg: null,
      border: 'border-transparent',
      textClass: 'text-foreground',
      timeClass: 'text-muted-foreground',
      isBuyer: false,
      showBuyerBadge: false,
      showTaskBadge: false,
      canToggle: false
    };
  };

  const styles = getEventStyles();
  const canToggle = styles.canToggle;

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
        styles.border,
        event.urgent && "ring-2 ring-red-500"
      )}
      style={styles.customBg ? { backgroundColor: styles.customBg } : undefined}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onContextMenu={onContextMenu}
      onTouchStart={isMobile ? undefined : onTouchStart}
      onTouchEnd={isMobile ? undefined : onTouchEnd}
      onTouchMove={isMobile ? undefined : onTouchEnd}>

      {/* Top-right badge row */}
      <div className="absolute -top-1.5 -right-1 flex items-center gap-0.5">
        {event.urgent &&
        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-2.5 h-2.5 text-white" />
          </div>
        }
        {hasComment && comments && onAddComment &&
        <CommentPopover
          comments={comments}
          onAddComment={onAddComment}
          trigger={
          <div className="w-4 h-4 bg-foreground rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                <MessageCircle className="w-2.5 h-2.5 text-background" />
              </div>
          } />

        }
        {styles.showBuyerBadge && !event.urgent && !hasComment &&
        <div className="bg-foreground text-background text-[7px] font-bold px-1.5 py-0.5 rounded-full tracking-wider uppercase">
            Buyer
          </div>
        }
        {styles.showTaskBadge && !event.urgent && !hasComment &&
        <div className="bg-foreground text-background text-[7px] font-bold px-1.5 py-0.5 rounded-full tracking-wider uppercase">
            Task
          </div>
        }
      </div>
      <div className="flex items-start gap-2">
        {canToggle ?
        <button
          onClick={handleToggle}
          className={cn(
            "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
            event.completed ?
            'bg-foreground border-foreground' :
            'border-muted-foreground/50 hover:border-foreground'
          )}>

            {event.completed && <Check className="w-3 h-3 text-background" />}
          </button> :
        event.emoji ?
        <span className="text-sm shrink-0">{event.emoji}</span> :

        <div
          className="w-2 h-2 rounded-full mt-1.5 shrink-0"
          style={{ backgroundColor: event.statusColor || '#6b7280' }} />

        }
        
        <div className="flex-1 min-w-0">
          <p className={cn("text-[10px] font-medium whitespace-normal break-words leading-tight", styles.textClass, event.completed && "line-through opacity-60")}>
            {event.title}
          </p>
          {showDetails && event.lastComment?.text?.trim() &&
          <p className={cn("text-[9px] mt-0.5 whitespace-normal break-words leading-tight opacity-80", styles.textClass)}>
              💬 {event.lastComment.text.replace(/<[^>]*>/g, '').trim()} · {format(parseISO(event.lastComment.created_at), 'd MMM', { locale: it })}
            </p>
          }
        </div>
        {/* Mobile: explicit menu button instead of long-press */}
        {isMobile && onMobileMenu &&
        <button
          onClick={(e) => {e.stopPropagation();onMobileMenu();}}
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-muted/60 hover:bg-muted transition-colors">
          
            <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        }
      </div>
    </div>);

});
EventCard.displayName = 'EventCard';

// Draggable Event Card - entire card is draggable
const DraggableEventCard = memo(({
  event,
  onClick,
  onContextMenu,
  onTouchStart,
  onTouchEnd,
  onToggle,
  isDragging,
  hasComment,
  dragHandleProps,
  comments,
  onAddComment,
  showDetails
}: {event: CalendarEvent;onClick: () => void;onContextMenu: (e: React.MouseEvent) => void;onTouchStart: (e: React.TouchEvent) => void;onTouchEnd: () => void;onToggle: (id: string, completed: boolean) => void;isDragging: boolean;hasComment?: boolean;dragHandleProps?: any;comments?: NotiziaComment[];onAddComment?: (text: string) => void;showDetails?: boolean;}) => {
  const getEventStyles = () => {
    // Tasks - white card with black border, or custom color
    if (event.type === 'task') {
      const hasCustomColor = !!event.cardColor;
      const baseColor = event.cardColor || null;
      const textColor = hasCustomColor && baseColor && isDarkColor(baseColor) ? 'text-white' : 'text-foreground';

      return {
        bg: hasCustomColor ? '' : 'bg-white',
        customBg: baseColor,
        border: hasCustomColor ? 'border-transparent' : 'border border-foreground',
        textClass: event.completed ? 'line-through text-muted-foreground' : textColor,
        showBuyerBadge: false,
        showTaskBadge: true,
        canToggle: true
      };
    }

    // Buyers (cliente_reminder)
    if (event.type === 'cliente_reminder') {
      const hasCustomColor = !!event.cardColor;
      const baseColor = event.cardColor || null;
      const textColor = hasCustomColor && baseColor && isDarkColor(baseColor) ? 'text-white' : 'text-foreground';
      return {
        bg: hasCustomColor ? '' : 'bg-white',
        customBg: baseColor,
        border: hasCustomColor ? baseColor && isDarkColor(baseColor) ? 'border-transparent' : 'border border-gray-300' : 'border border-foreground',
        textClass: textColor,
        showBuyerBadge: true,
        showTaskBadge: false,
        canToggle: false
      };
    }

    // Sellers (notizie) - use cardColor override or kanban status color
    if (event.type === 'notizia_reminder') {
      const baseColor = event.cardColor || event.statusColor || '#8B9A7D';
      const textColor = isDarkColor(baseColor) ? 'text-white' : 'text-foreground';
      return {
        bg: '',
        customBg: baseColor,
        border: isDarkColor(baseColor) ? 'border-transparent' : 'border border-gray-300',
        textClass: textColor,
        showBuyerBadge: false,
        showTaskBadge: false,
        canToggle: false
      };
    }

    return {
      bg: 'bg-[#8B9A7D]/30',
      customBg: null,
      border: 'border-transparent',
      textClass: 'text-foreground',
      showBuyerBadge: false,
      showTaskBadge: false,
      canToggle: false
    };
  };

  const styles = getEventStyles();

  return (
    <div
      {...dragHandleProps}
      className={cn(
        "rounded-lg p-2 transition-all relative cursor-grab active:cursor-grabbing touch-none",
        styles.bg,
        styles.border,
        event.urgent && "ring-2 ring-red-500",
        isDragging && "ring-2 ring-primary scale-105 opacity-90"
      )}
      style={styles.customBg ? { backgroundColor: styles.customBg } : undefined}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onContextMenu={onContextMenu}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchMove={onTouchEnd}>

      {/* Top-right badge row */}
      <div className="absolute -top-1.5 -right-1 flex items-center gap-0.5">
        {event.urgent &&
        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-2.5 h-2.5 text-white" />
          </div>
        }
        {hasComment && comments && onAddComment &&
        <CommentPopover
          comments={comments}
          onAddComment={onAddComment}
          trigger={
          <div className="w-4 h-4 bg-foreground rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                <MessageCircle className="w-2.5 h-2.5 text-background" />
              </div>
          } />

        }
        {styles.showBuyerBadge && !event.urgent && !hasComment &&
        <div className="bg-foreground text-background text-[7px] font-bold px-1.5 py-0.5 rounded-full tracking-wider uppercase">
            Buyer
          </div>
        }
        {styles.showTaskBadge && !event.urgent && !hasComment &&
        <div className="bg-foreground text-background text-[7px] font-bold px-1.5 py-0.5 rounded-full tracking-wider uppercase">
            Task
          </div>
        }
      </div>
      <div className="flex items-center gap-2">
        {/* Checkbox for tasks, emoji/dot for others */}
        {styles.canToggle ?
        <button
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic('light');
            onToggle(event.id, !event.completed);
          }}
          className={cn(
            "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
            event.completed ?
            'bg-foreground border-foreground' :
            'border-muted-foreground/50 hover:border-foreground'
          )}>

            {event.completed && <Check className="w-3 h-3 text-background" />}
          </button> :
        event.emoji ?
        <span className="text-sm shrink-0">{event.emoji}</span> :

        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: event.statusColor || '#6b7280' }} />

        }
        
        <div className="flex-1 min-w-0">
          <p className={cn("text-[10px] font-medium whitespace-normal break-words leading-tight", styles.textClass, event.completed && "line-through opacity-60")}>
            {event.title}
          </p>
          {showDetails && event.lastComment?.text?.trim() &&
          <p className={cn("text-[9px] mt-0.5 whitespace-normal break-words leading-tight opacity-80", styles.textClass)}>
              💬 {event.lastComment.text.replace(/<[^>]*>/g, '').trim()} · {format(parseISO(event.lastComment.created_at), 'd MMM', { locale: it })}
            </p>
          }
        </div>
      </div>
    </div>);

});
DraggableEventCard.displayName = 'DraggableEventCard';

export default CalendarPage;