import { useState, useMemo } from 'react';
import { useDailyData, DailyDataInput } from '@/hooks/useDailyData';
import { Calendar, ChevronLeft, ChevronRight, Edit2, Trash2, X, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type FilterPeriod = 'week' | 'month' | '6months' | 'year';

const ReportAnalysisTab = () => {
  const { myData, saveDailyData, deleteDailyData } = useDailyData();
  
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('month');
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
  });
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

  const formatShortDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const formatFullDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('it-IT', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedWeekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeekStart(newDate);
  };

  const openReportDetail = (entry: any) => {
    setSelectedReport(entry);
    setIsEditing(false);
    setEditFormData(null);
  };

  const startEditing = () => {
    if (!selectedReport) return;
    setIsEditing(true);
    setEditFormData({
      contatti_reali: selectedReport.contatti_reali,
      notizie_reali: selectedReport.notizie_reali,
      appuntamenti_vendita: selectedReport.appuntamenti_vendita,
      nuove_trattative: selectedReport.nuove_trattative || 0,
      trattative_chiuse: selectedReport.trattative_chiuse || 0,
      fatturato_a_credito: Number(selectedReport.fatturato_a_credito) || 0,
      vendite_numero: selectedReport.vendite_numero,
      vendite_valore: Number(selectedReport.vendite_valore),
      date: selectedReport.date,
    });
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditFormData(null);
  };

  const saveEdit = () => {
    if (!editFormData || !selectedReport) return;
    
    const input: DailyDataInput = {
      date: editFormData.date,
      contatti_reali: editFormData.contatti_reali,
      contatti_ideali: 25,
      notizie_reali: editFormData.notizie_reali,
      notizie_ideali: 3,
      clienti_gestiti: 0,
      appuntamenti_vendita: editFormData.appuntamenti_vendita,
      acquisizioni: 0,
      incarichi_vendita: selectedReport.incarichi_vendita || 0,
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
        setSelectedReport(null);
        setIsEditing(false);
        setEditFormData(null);
      },
    });
  };

  const handleDelete = () => {
    if (!deleteConfirmId) return;
    deleteDailyData.mutate(deleteConfirmId, {
      onSuccess: () => {
        setDeleteConfirmId(null);
        setSelectedReport(null);
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

  const DetailRow = ({ label, value, isCurrency = false }: { label: string; value: number; isCurrency?: boolean }) => (
    <div className="flex items-center justify-between py-3 border-b border-muted last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-lg font-medium">{isCurrency ? formatCurrency(value) : value}</span>
    </div>
  );

  const EditField = ({ label, field }: { label: string; field: string }) => (
    <div className="flex items-center justify-between py-3 border-b border-muted last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <input
        type="number"
        value={editFormData[field]}
        onChange={(e) => setEditFormData({ ...editFormData, [field]: parseInt(e.target.value) || 0 })}
        className="w-24 bg-muted rounded-lg px-3 py-2 text-right text-sm font-medium"
      />
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

      {/* Report List - Preview Only */}
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
                className="bg-card rounded-2xl shadow-lg p-4 transition-all duration-150 cursor-pointer hover:shadow-xl"
                onClick={() => openReportDetail(entry)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center">
                      <span className="text-sm font-semibold">{formatShortDate(entry.date)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Tocca per visualizzare i dettagli
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openReportDetail(entry);
                        setTimeout(startEditing, 100);
                      }}
                      className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(entry.id);
                      }}
                      className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Report Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="text-lg font-bold tracking-tight">DETTAGLIO REPORT</span>
              {!isEditing && (
                <div className="flex gap-2">
                  <button
                    onClick={startEditing}
                    className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(selectedReport?.id)}
                    className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-4">
              <div className="text-center py-4 bg-muted rounded-xl">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Data</p>
                <p className="text-lg font-medium capitalize">{formatFullDate(selectedReport.date)}</p>
              </div>

              {isEditing && editFormData ? (
                <div className="space-y-1">
                  <EditField label="Contatti Reali" field="contatti_reali" />
                  <EditField label="Notizie Acquisite" field="notizie_reali" />
                  <EditField label="Appuntamenti Vendita" field="appuntamenti_vendita" />
                  <EditField label="Nuove Trattative" field="nuove_trattative" />
                  <EditField label="Trattative Chiuse" field="trattative_chiuse" />
                  <EditField label="Fatturato a Credito (€)" field="fatturato_a_credito" />
                  <EditField label="Numero Vendite" field="vendite_numero" />
                  <EditField label="Fatturato (€)" field="vendite_valore" />
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={cancelEditing}
                      className="flex-1 h-12 rounded-xl bg-muted flex items-center justify-center gap-2 font-medium hover:bg-muted/80 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Annulla
                    </button>
                    <button
                      onClick={saveEdit}
                      disabled={saveDailyData.isPending}
                      className="flex-1 h-12 rounded-xl bg-foreground text-background flex items-center justify-center gap-2 font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      Salva
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <DetailRow label="Contatti Reali" value={selectedReport.contatti_reali} />
                  <DetailRow label="Notizie Acquisite" value={selectedReport.notizie_reali} />
                  <DetailRow label="Appuntamenti Vendita" value={selectedReport.appuntamenti_vendita} />
                  <DetailRow label="Nuove Trattative" value={selectedReport.nuove_trattative || 0} />
                  <DetailRow label="Trattative Chiuse" value={selectedReport.trattative_chiuse || 0} />
                  <DetailRow label="Fatturato a Credito" value={Number(selectedReport.fatturato_a_credito) || 0} isCurrency />
                  <DetailRow label="Numero Vendite" value={selectedReport.vendite_numero} />
                  <DetailRow label="Fatturato" value={Number(selectedReport.vendite_valore)} isCurrency />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questo report?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. Il report verrà eliminato permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              {deleteDailyData.isPending ? 'Eliminazione...' : 'Elimina'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReportAnalysisTab;