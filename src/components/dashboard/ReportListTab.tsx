import { useState, useMemo } from 'react';
import { useDailyData } from '@/hooks/useDailyData';
import { format, parseISO, startOfMonth, endOfMonth, eachWeekOfInterval } from 'date-fns';
import { it } from 'date-fns/locale';
import { Trash2, Pencil, Search, CalendarDays } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ReportListTabProps {
  onEditReport: (date: string) => void;
}

const ReportListTab = ({ onEditReport }: ReportListTabProps) => {
  const { myData, deleteDailyData } = useDailyData();
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [weekFilter, setWeekFilter] = useState('');

  const months = useMemo(() => {
    if (!myData) return [];
    const set = new Set(myData.map((r) => r.date.substring(0, 7)));
    return Array.from(set).sort().reverse();
  }, [myData]);

  const weeks = useMemo(() => {
    if (!monthFilter) return [];
    const monthStart = startOfMonth(parseISO(monthFilter + '-01'));
    const monthEnd = endOfMonth(monthStart);
    const weekStarts = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });
    return weekStarts.map((ws, i) => ({
      label: `Settimana ${i + 1}`,
      value: String(i + 1),
      start: ws,
      end: new Date(Math.min(new Date(ws.getTime() + 6 * 86400000).getTime(), monthEnd.getTime())),
    }));
  }, [monthFilter]);

  const filtered = useMemo(() => {
    if (!myData) return [];
    return myData.filter((r) => {
      if (monthFilter) {
        if (r.date.substring(0, 7) !== monthFilter) return false;
      }
      if (weekFilter && weeks.length > 0) {
        const w = weeks[parseInt(weekFilter) - 1];
        if (w) {
          const d = parseISO(r.date);
          if (d < w.start || d > w.end) return false;
        }
      }
      if (search) {
        const s = search.toLowerCase();
        const dateStr = format(parseISO(r.date), 'dd/MM/yyyy');
        const notes = (r.notes || '').toLowerCase();
        if (!dateStr.includes(s) && !notes.includes(s)) return false;
      }
      return true;
    });
  }, [myData, search, monthFilter, weekFilter, weeks]);

  const handleDelete = (id: string, date: string) => {
    if (confirm(`Eliminare il report del ${format(parseISO(date), 'dd/MM/yyyy')}?`)) {
      deleteDailyData.mutate(id);
    }
  };

  return (
    <div className="px-6 pb-8 animate-fade-in">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per data o note..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-full bg-card border-0"
          />
        </div>
        <select
          value={monthFilter}
          onChange={(e) => { setMonthFilter(e.target.value); setWeekFilter(''); }}
          className="h-10 rounded-full border-0 bg-card px-4 text-sm text-foreground"
        >
          <option value="">Tutti i mesi</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {format(parseISO(m + '-01'), 'MMMM yyyy', { locale: it })}
            </option>
          ))}
        </select>
        {monthFilter && weeks.length > 0 && (
          <select
            value={weekFilter}
            onChange={(e) => setWeekFilter(e.target.value)}
            className="h-10 rounded-full border-0 bg-card px-4 text-sm text-foreground"
          >
            <option value="">Tutte le settimane</option>
            {weeks.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label} ({format(w.start, 'dd/MM')} - {format(w.end, 'dd/MM')})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nessun report trovato</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => {
            const d = parseISO(r.date);
            const hasData = r.contatti_reali > 0 || r.notizie_reali > 0 || r.appuntamenti_vendita > 0 || r.vendite_numero > 0;
            return (
              <div
                key={r.id}
                className="flex items-center gap-3 bg-card rounded-2xl px-4 py-3 group hover:bg-muted/30 transition-colors"
              >
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-muted flex flex-col items-center justify-center">
                  <span className="text-lg font-bold leading-none">{format(d, 'dd')}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {format(d, 'MMM', { locale: it })}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {format(d, 'EEEE', { locale: it }).charAt(0).toUpperCase() + format(d, 'EEEE', { locale: it }).slice(1)}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                    {r.contatti_reali > 0 && <span>{r.contatti_reali} contatti</span>}
                    {r.notizie_reali > 0 && <span>{r.notizie_reali} notizie</span>}
                    {r.appuntamenti_vendita > 0 && <span>{r.appuntamenti_vendita} app.</span>}
                    {r.vendite_numero > 0 && <span>{r.vendite_numero} vendite</span>}
                    {r.nuove_trattative > 0 && <span>{r.nuove_trattative} tratt.</span>}
                    {!hasData && <span className="italic">Vuoto</span>}
                  </div>
                  {r.notes && (
                    <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{r.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEditReport(r.date)}
                    className="p-2 rounded-full hover:bg-muted transition-colors"
                    title="Modifica"
                  >
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleDelete(r.id, r.date)}
                    className="p-2 rounded-full hover:bg-destructive/10 transition-colors"
                    title="Elimina"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReportListTab;
