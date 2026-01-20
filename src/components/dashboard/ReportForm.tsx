import { useState, useEffect } from 'react';
import { Calendar, Check, Minus, Plus, Phone, FileText, CalendarDays, Euro } from 'lucide-react';
import { useDailyData, DailyDataInput } from '@/hooks/useDailyData';

const ReportForm = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({
    contatti_reali: 0,
    notizie_reali: 0,
    appuntamenti_vendita: 0,
    vendite_numero: 0,
    vendite_valore: 0,
  });

  const { saveDailyData, myData } = useDailyData();

  // Load existing data for selected date
  useEffect(() => {
    if (myData) {
      const existingEntry = myData.find(entry => entry.date === date);
      if (existingEntry) {
        setFormData({
          contatti_reali: existingEntry.contatti_reali,
          notizie_reali: existingEntry.notizie_reali,
          appuntamenti_vendita: existingEntry.appuntamenti_vendita,
          vendite_numero: existingEntry.vendite_numero,
          vendite_valore: existingEntry.vendite_valore,
        });
      } else {
        setFormData({
          contatti_reali: 0,
          notizie_reali: 0,
          appuntamenti_vendita: 0,
          vendite_numero: 0,
          vendite_valore: 0,
        });
      }
    }
  }, [date, myData]);

  const handleIncrement = (field: keyof typeof formData) => {
    setFormData(prev => ({ ...prev, [field]: prev[field] + 1 }));
  };

  const handleDecrement = (field: keyof typeof formData) => {
    setFormData(prev => ({ ...prev, [field]: Math.max(0, prev[field] - 1) }));
  };

  const handleValueChange = (field: keyof typeof formData, value: number) => {
    setFormData(prev => ({ ...prev, [field]: Math.max(0, value) }));
  };

  const handleSave = () => {
    const input: DailyDataInput = {
      date,
      ...formData,
      contatti_ideali: 25,
      notizie_ideali: 3,
      clienti_gestiti: 0,
      acquisizioni: 0,
      incarichi_vendita: 0,
      affitti_numero: 0,
      affitti_valore: 0,
    };
    saveDailyData.mutate(input);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const CounterField = ({ 
    label, 
    value, 
    field, 
    ideal,
    icon: Icon 
  }: { 
    label: string; 
    value: number; 
    field: keyof typeof formData; 
    ideal?: number;
    icon: any;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">
            {label}
          </span>
        </div>
        {ideal !== undefined && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
            IDEALE: {ideal}
          </span>
        )}
      </div>
      <div className="flex items-center rounded-xl border border-border bg-background">
        <button
          onClick={() => handleDecrement(field)}
          className="w-12 h-12 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => handleValueChange(field, parseInt(e.target.value) || 0)}
          className="flex-1 text-center text-lg font-light bg-transparent border-0 focus:outline-none"
        />
        <button
          onClick={() => handleIncrement(field)}
          className="w-12 h-12 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="px-6 pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-foreground text-background flex items-center justify-center">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">REPORT DATI</h2>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground">
              PERFORMANCE ODIERNE
            </p>
          </div>
        </div>
        <div className="relative">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-muted border-0 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Attività Lead */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-border">
            <span className="text-lg">⚡</span>
            <h3 className="text-sm font-bold tracking-[0.15em] uppercase">ATTIVITÀ LEAD</h3>
          </div>
          
          <CounterField
            label="CONTATTI REALI"
            value={formData.contatti_reali}
            field="contatti_reali"
            ideal={5}
            icon={Phone}
          />
          
          <CounterField
            label="NOTIZIE ACQUISITE"
            value={formData.notizie_reali}
            field="notizie_reali"
            ideal={2}
            icon={FileText}
          />
          
          <CounterField
            label="APPUNTAMENTI VENDITA"
            value={formData.appuntamenti_vendita}
            field="appuntamenti_vendita"
            ideal={1}
            icon={CalendarDays}
          />
        </div>

        {/* Risultati Chiusura */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-border">
            <span className="text-lg">€</span>
            <h3 className="text-sm font-bold tracking-[0.15em] uppercase">RISULTATI CHIUSURA</h3>
          </div>
          
          <CounterField
            label="NUMERO VENDITE"
            value={formData.vendite_numero}
            field="vendite_numero"
            ideal={0.1}
            icon={Check}
          />
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Euro className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">
                FATTURATO (€)
              </span>
            </div>
            <div className="flex items-center rounded-xl border border-border bg-background">
              <button
                onClick={() => handleValueChange('vendite_valore', formData.vendite_valore - 1000)}
                className="w-12 h-12 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="flex-1 flex items-center justify-center">
                <span className="text-muted-foreground mr-2">€</span>
                <input
                  type="number"
                  value={formData.vendite_valore}
                  onChange={(e) => handleValueChange('vendite_valore', parseInt(e.target.value) || 0)}
                  className="w-24 text-center text-lg font-light bg-transparent border-0 focus:outline-none"
                />
              </div>
              <button
                onClick={() => handleValueChange('vendite_valore', formData.vendite_valore + 1000)}
                className="w-12 h-12 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saveDailyData.isPending}
        className="w-full bg-foreground text-background rounded-full h-14 flex items-center justify-center gap-3 font-medium tracking-[0.2em] uppercase hover:bg-foreground/90 transition-colors disabled:opacity-50"
      >
        <Check className="w-5 h-5" />
        {saveDailyData.isPending ? 'SALVATAGGIO...' : 'SALVA REPORT PERFORMANCE'}
      </button>
    </div>
  );
};

export default ReportForm;
