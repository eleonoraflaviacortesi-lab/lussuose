import { useState, useMemo } from 'react';
import { useDailyData, DailyDataInput } from '@/hooks/useDailyData';
import { Calendar, ChevronLeft, ChevronRight, Edit2, X, Check } from 'lucide-react';

type FilterPeriod = 'week' | 'month' | '6months' | 'year';

const ReportAnalysisTab = () => {
  const { myData, saveDailyData } = useDailyData();
  
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('month');
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date();

    switch (filterPeriod) {
      case 'week':
        startDate = new Date(selectedWeekStart);
        endDate = new Date(selectedWeekStart);
        endDate.setDate(endDate.getDate() + 6);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();

  const filteredData = useMemo(() => {
    if (!myData) return [];
    return myData.filter(d => {
      const date = new Date(d.date);
      return date >= startDate && date <= endDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [myData, startDate, endDate]);

  const aggregatedData = useMemo(() => {
    return filteredData.reduce((acc, d) => ({
      contatti_reali: acc.contatti_reali + (d.contatti_reali || 0),
      notizie_reali: acc.notizie_reali + (d.notizie_reali || 0),
      appuntamenti_vendita: acc.appuntamenti_vendita + (d.appuntamenti_vendita || 0),
      nuove_trattative: acc.nuove_trattative + (d.nuove_trattative || 0),
      trattative_chiuse: acc.trattative_chiuse + (d.trattative_chiuse || 0),
      fatturato_a_credito: acc.fatturato_a_credito + Number(d.fatturato_a_credito || 0),
      vendite_numero: acc.vendite_numero + (d.vendite_numero || 0),
      vendite_valore: acc.vendite_valore + Number(d.vendite_valore || 0),
      incarichi_vendita: acc.incarichi_vendita + (d.incarichi_vendita || 0),
    }), {
      contatti_reali: 0,
      notizie_reali: 0,
      appuntamenti_vendita: 0,
      nuove_trattative: 0,
      trattative_chiuse: 0,
      fatturato_a_credito: 0,
      vendite_numero: 0,
      vendite_valore: 0,
      incarichi_vendita: 0,
    });
  }, [filteredData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('it-IT', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedWeekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeekStart(newDate);
  };

  const startEdit = (entry: any) => {
    setEditingId(entry.id);
    setEditFormData({
      contatti_reali: entry.contatti_reali,
      notizie_reali: entry.notizie_reali,
      appuntamenti_vendita: entry.appuntamenti_vendita,
      nuove_trattative: entry.nuove_trattative || 0,
      trattative_chiuse: entry.trattative_chiuse || 0,
      fatturato_a_credito: Number(entry.fatturato_a_credito) || 0,
      vendite_numero: entry.vendite_numero,
      vendite_valore: Number(entry.vendite_valore),
      date: entry.date,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFormData(null);
  };

  const saveEdit = () => {
    if (!editFormData) return;
    
    const input: DailyDataInput = {
      date: editFormData.date,
      contatti_reali: editFormData.contatti_reali,
      contatti_ideali: 25,
      notizie_reali: editFormData.notizie_reali,
      notizie_ideali: 3,
      clienti_gestiti: 0,
      appuntamenti_vendita: editFormData.appuntamenti_vendita,
      acquisizioni: 0,
      incarichi_vendita: 0,
      vendite_numero: editFormData.vendite_numero,
      vendite_valore: editFormData.vendite_valore,
      affitti_numero: 0,
      affitti_valore: 0,
      nuove_trattative: editFormData.nuove_trattative,
      nuove_trattative_ideali: 2,
      trattative_chiuse: editFormData.trattative_chiuse,
      trattative_chiuse_ideali: 1,
      fatturato_a_credito: editFormData.fatturato_a_credito,
    };
    
    saveDailyData.mutate(input, {
      onSuccess: () => {
        setEditingId(null);
        setEditFormData(null);
      },
    });
  };

  const StatCard = ({ label, value, isCurrency = false }: { label: string; value: number; isCurrency?: boolean }) => (
    <div className="bg-card rounded-2xl shadow-lg p-4">
      <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-1">
        {label}
      </p>
      <p className="text-2xl font-light text-foreground">
        {isCurrency ? formatCurrency(value) : value}
      </p>
    </div>
  );

  return (
    <div className="px-6 pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-foreground text-background flex items-center justify-center">
          <Calendar className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">ANALISI REPORT</h1>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground">
            STORICO PERFORMANCE
          </p>
        </div>
      </div>

      {/* Period Filter */}
      <div className="bg-card rounded-2xl shadow-lg p-4 mb-6">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {(['week', 'month', '6months', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setFilterPeriod(p)}
              className={`px-4 py-2 text-xs font-medium tracking-[0.1em] uppercase rounded-full transition-all duration-150 ${
                filterPeriod === p 
                  ? 'bg-foreground text-background' 
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {p === 'week' ? 'SETTIMANA' : p === 'month' ? 'MESE' : p === '6months' ? '6 MESI' : 'ANNO'}
            </button>
          ))}
        </div>

        {filterPeriod === 'week' && (
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={() => navigateWeek('prev')}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium">
              {selectedWeekStart.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })} - {
                new Date(new Date(selectedWeekStart).setDate(selectedWeekStart.getDate() + 6))
                  .toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
              }
            </span>
            <button
              onClick={() => navigateWeek('next')}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Aggregated Stats */}
      <div className="mb-8">
        <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4">
          TOTALI PERIODO
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Contatti" value={aggregatedData.contatti_reali} />
          <StatCard label="Notizie" value={aggregatedData.notizie_reali} />
          <StatCard label="Appuntamenti" value={aggregatedData.appuntamenti_vendita} />
          <StatCard label="Nuove Trattative" value={aggregatedData.nuove_trattative} />
          <StatCard label="Trattative Chiuse" value={aggregatedData.trattative_chiuse} />
          <StatCard label="Fatturato Credito" value={aggregatedData.fatturato_a_credito} isCurrency />
          <StatCard label="Vendite" value={aggregatedData.vendite_numero} />
          <StatCard label="Fatturato" value={aggregatedData.vendite_valore} isCurrency />
        </div>
      </div>

      {/* Report List */}
      <div>
        <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4">
          DETTAGLIO REPORT ({filteredData.length})
        </h2>
        
        <div className="space-y-3">
          {filteredData.length === 0 ? (
            <div className="bg-card rounded-2xl shadow-lg p-8 text-center">
              <p className="text-muted-foreground">Nessun report trovato per questo periodo</p>
            </div>
          ) : (
            filteredData.map((entry) => (
              <div 
                key={entry.id} 
                className="bg-card rounded-2xl shadow-lg p-4 transition-all duration-150"
              >
                {editingId === entry.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{formatDate(entry.date)}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={cancelEdit}
                          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={saveEdit}
                          disabled={saveDailyData.isPending}
                          className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-foreground/80 transition-colors disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                      {[
                        { key: 'contatti_reali', label: 'Contatti' },
                        { key: 'notizie_reali', label: 'Notizie' },
                        { key: 'appuntamenti_vendita', label: 'Appunt.' },
                        { key: 'nuove_trattative', label: 'Nuove Tratt.' },
                        { key: 'trattative_chiuse', label: 'Tratt. Chiuse' },
                        { key: 'vendite_numero', label: 'Vendite' },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {label}
                          </label>
                          <input
                            type="number"
                            value={editFormData[key]}
                            onChange={(e) => setEditFormData({ ...editFormData, [key]: parseInt(e.target.value) || 0 })}
                            className="w-full bg-muted rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                      ))}
                      {[
                        { key: 'fatturato_a_credito', label: 'Fatt. Credito' },
                        { key: 'vendite_valore', label: 'Fatturato' },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {label}
                          </label>
                          <input
                            type="number"
                            value={editFormData[key]}
                            onChange={(e) => setEditFormData({ ...editFormData, [key]: parseInt(e.target.value) || 0 })}
                            className="w-full bg-muted rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                        <span className="text-sm font-semibold">{formatDate(entry.date).split(' ')[1]}</span>
                      </div>
                      <div className="grid grid-cols-4 md:grid-cols-8 gap-x-4 gap-y-1 text-xs">
                        <div>
                          <span className="text-muted-foreground">Cont.</span>
                          <span className="ml-1 font-medium">{entry.contatti_reali}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Not.</span>
                          <span className="ml-1 font-medium">{entry.notizie_reali}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">App.</span>
                          <span className="ml-1 font-medium">{entry.appuntamenti_vendita}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">N.Tr.</span>
                          <span className="ml-1 font-medium">{entry.nuove_trattative || 0}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">T.Ch.</span>
                          <span className="ml-1 font-medium">{entry.trattative_chiuse || 0}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">F.Cr.</span>
                          <span className="ml-1 font-medium">€{Number(entry.fatturato_a_credito || 0).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Vend.</span>
                          <span className="ml-1 font-medium">{entry.vendite_numero}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Fatt.</span>
                          <span className="ml-1 font-medium">€{Number(entry.vendite_valore).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => startEdit(entry)}
                      className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportAnalysisTab;