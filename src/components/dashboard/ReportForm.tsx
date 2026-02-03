import { useState, useEffect, useCallback } from 'react';
import { Calendar, Check, Phone, FileText, CalendarDays, Euro, Handshake, CheckCircle, CreditCard, ClipboardCheck } from 'lucide-react';
import { useDailyData, DailyDataInput } from '@/hooks/useDailyData';

type ReportFormData = {
  contatti_reali: number;
  notizie_reali: number;
  appuntamenti_vendita: number;
  incarichi_vendita: number;
  valutazioni_fatte: number;
  vendite_numero: number;
  vendite_valore: number;
  nuove_trattative: number;
  trattative_chiuse: number;
  fatturato_a_credito: number;
};

type FieldKey = keyof ReportFormData;

const CounterField = ({
  label,
  value,
  field,
  ideal,
  icon: Icon,
  onChange,
}: {
  label: string;
  value: number;
  field: FieldKey;
  ideal?: number;
  icon: any;
  onChange: (field: FieldKey, value: number) => void;
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
    <input
      type="number"
      inputMode="numeric"
      value={value || ''}
      onChange={(e) => onChange(field, parseInt(e.target.value) || 0)}
      placeholder="0"
      className="w-full h-12 text-center text-lg font-light bg-background rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary"
    />
  </div>
);

const CurrencyField = ({
  label,
  value,
  field,
  icon: Icon,
  onChange,
}: {
  label: string;
  value: number;
  field: FieldKey;
  icon: any;
  onChange: (field: FieldKey, value: number) => void;
}) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">
        {label}
      </span>
    </div>
    <div className="flex items-center rounded-xl border border-border bg-background h-12 px-3">
      <span className="text-muted-foreground mr-2">€</span>
      <input
        type="number"
        inputMode="numeric"
        value={value || ''}
        onChange={(e) => onChange(field, parseInt(e.target.value) || 0)}
        placeholder="0"
        className="flex-1 text-center text-lg font-light bg-transparent border-0 focus:outline-none"
      />
    </div>
  </div>
);

const ReportForm = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState<ReportFormData>({
    contatti_reali: 0,
    notizie_reali: 0,
    appuntamenti_vendita: 0,
    incarichi_vendita: 0,
    valutazioni_fatte: 0,
    vendite_numero: 0,
    vendite_valore: 0,
    nuove_trattative: 0,
    trattative_chiuse: 0,
    fatturato_a_credito: 0,
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
          incarichi_vendita: existingEntry.incarichi_vendita || 0,
          valutazioni_fatte: (existingEntry as any).valutazioni_fatte || 0,
          vendite_numero: existingEntry.vendite_numero,
          vendite_valore: Number(existingEntry.vendite_valore),
          nuove_trattative: existingEntry.nuove_trattative || 0,
          trattative_chiuse: existingEntry.trattative_chiuse || 0,
          fatturato_a_credito: Number(existingEntry.fatturato_a_credito) || 0,
        });
      } else {
        setFormData({
          contatti_reali: 0,
          notizie_reali: 0,
          appuntamenti_vendita: 0,
          incarichi_vendita: 0,
          valutazioni_fatte: 0,
          vendite_numero: 0,
          vendite_valore: 0,
          nuove_trattative: 0,
          trattative_chiuse: 0,
          fatturato_a_credito: 0,
        });
      }
    }
  }, [date, myData]);

  const handleValueChange = useCallback((field: FieldKey, value: number) => {
    setFormData(prev => ({ ...prev, [field]: Math.max(0, value) }));
  }, []);

  const handleSave = () => {
    const input: DailyDataInput = {
      date,
      ...formData,
      contatti_ideali: 25,
      notizie_ideali: 3,
      clienti_gestiti: 0,
      acquisizioni: 0,
      affitti_numero: 0,
      affitti_valore: 0,
      nuove_trattative_ideali: 2,
      trattative_chiuse_ideali: 1,
    };
    saveDailyData.mutate(input);
  };

  return (
    <div className="px-6 pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-foreground text-background flex items-center justify-center">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">CICLO PRODUTTIVO</h2>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground">
              PERFORMANCE ODIERNE
            </p>
          </div>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-muted border-0 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary w-[120px] shrink-0"
        />
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Attività Lead */}
        <div className="bg-card rounded-2xl shadow-lg p-6 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-muted">
            <span className="text-lg">⚡</span>
            <h3 className="text-sm font-bold tracking-[0.15em] uppercase">ATTIVITÀ LEAD</h3>
          </div>
          
          <CounterField
            label="CONTATTI REALI"
            value={formData.contatti_reali}
            field="contatti_reali"
            ideal={5}
            icon={Phone}
            onChange={handleValueChange}
          />
          
          <CounterField
            label="NOTIZIE ACQUISITE"
            value={formData.notizie_reali}
            field="notizie_reali"
            ideal={2}
            icon={FileText}
            onChange={handleValueChange}
          />
          
          <CounterField
            label="APPUNTAMENTI VENDITA"
            value={formData.appuntamenti_vendita}
            field="appuntamenti_vendita"
            ideal={1}
            icon={CalendarDays}
            onChange={handleValueChange}
          />
          
          <CounterField
            label="INCARICHI PRESI"
            value={formData.incarichi_vendita}
            field="incarichi_vendita"
            icon={Handshake}
            onChange={handleValueChange}
          />
          
          <CounterField
            label="ACQUISIZIONI"
            value={formData.valutazioni_fatte}
            field="valutazioni_fatte"
            icon={ClipboardCheck}
            onChange={handleValueChange}
          />
        </div>

        {/* Trattative */}
        <div className="bg-card rounded-2xl shadow-lg p-6 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-muted">
            <span className="text-lg">🤝</span>
            <h3 className="text-sm font-bold tracking-[0.15em] uppercase">TRATTATIVE</h3>
          </div>
          
          <CounterField
            label="NUOVE TRATTATIVE"
            value={formData.nuove_trattative}
            field="nuove_trattative"
            ideal={2}
            icon={Handshake}
            onChange={handleValueChange}
          />
          
          <CounterField
            label="TRATTATIVE CHIUSE"
            value={formData.trattative_chiuse}
            field="trattative_chiuse"
            ideal={1}
            icon={CheckCircle}
            onChange={handleValueChange}
          />

          <CurrencyField
            label="FATTURATO A CREDITO"
            value={formData.fatturato_a_credito}
            field="fatturato_a_credito"
            icon={CreditCard}
            onChange={handleValueChange}
          />
        </div>

        {/* Risultati Chiusura */}
        <div className="bg-card rounded-2xl shadow-lg p-6 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-muted">
            <span className="text-lg">€</span>
            <h3 className="text-sm font-bold tracking-[0.15em] uppercase">RISULTATI CHIUSURA</h3>
          </div>
          
          <CounterField
            label="NUMERO VENDITE"
            value={formData.vendite_numero}
            field="vendite_numero"
            ideal={0.1}
            icon={Check}
            onChange={handleValueChange}
          />
          
          <CurrencyField
            label="FATTURATO (€)"
            value={formData.vendite_valore}
            field="vendite_valore"
            icon={Euro}
            onChange={handleValueChange}
          />
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saveDailyData.isPending}
        className="w-full bg-foreground text-background rounded-full h-14 flex items-center justify-center gap-2 font-medium text-sm tracking-[0.15em] uppercase hover:bg-foreground/90 transition-colors disabled:opacity-50"
      >
        <span>{saveDailyData.isPending ? 'SALVATAGGIO...' : 'SALVA REPORT'}</span>
        <Check className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ReportForm;