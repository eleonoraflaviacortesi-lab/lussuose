import { useState } from 'react';
import { Settings, Target, Phone, FileText, CalendarDays, Gift, Award, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    // Piano Finanziario
    obbiettivo_fatturato: 500000,
    base_fissa_annuale: 0,
    percentuale_personale: 10,
    prezzo_medio_vendita: 500000,
    provvigione_agenzia: 4,
    // Obiettivi settimanali
    contatti_settimana: 25,
    notizie_settimana: 10,
    appuntamenti_settimana: 4,
    acquisizioni_settimana: 3,
    incarichi_settimana: 1,
  });

  // Calculate projections
  const fatturatoNetto = settings.obbiettivo_fatturato * (settings.percentuale_personale / 100);
  const venditeTotali = Math.ceil(settings.obbiettivo_fatturato / (settings.prezzo_medio_vendita * (settings.provvigione_agenzia / 100)));
  const mediaVenditeMese = (venditeTotali / 11).toFixed(1);

  const handleChange = (field: string, value: number) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // TODO: Save to database
    console.log('Saving settings:', settings);
  };

  const InputField = ({ 
    label, 
    value, 
    field, 
    suffix,
    icon: Icon 
  }: { 
    label: string; 
    value: number; 
    field: string; 
    suffix?: string;
    icon?: any;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
        <span className="text-xs font-medium tracking-[0.15em] uppercase text-primary">
          {label}
        </span>
      </div>
      <div className="relative">
        <Input
          type="number"
          value={value}
          onChange={(e) => handleChange(field, parseInt(e.target.value) || 0)}
          className="bg-muted border-0 rounded-xl h-14 text-base pr-12"
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="px-6 pb-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Settings Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-foreground text-background flex items-center justify-center">
              <Settings className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">IMPOSTAZIONI STRATEGICHE</h2>
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-primary">
                DEFINISCI I TARGET DELL'AGENZIA
              </p>
            </div>
          </div>

          {/* Piano Finanziario */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium tracking-[0.2em] uppercase text-primary">
                PIANO FINANZIARIO ANNUALE
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <InputField
                label="OBBIETTIVO FATTURATO AGENZIA"
                value={settings.obbiettivo_fatturato}
                field="obbiettivo_fatturato"
                suffix="€"
              />
              <InputField
                label="BASE FISSA ANNUALE"
                value={settings.base_fissa_annuale}
                field="base_fissa_annuale"
                suffix="€"
              />
              <InputField
                label="TUA PERCENTUALE (%)"
                value={settings.percentuale_personale}
                field="percentuale_personale"
                suffix="%"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="PREZZO MEDIO VENDITA"
                value={settings.prezzo_medio_vendita}
                field="prezzo_medio_vendita"
                suffix="€"
              />
              <InputField
                label="PROVVIGIONE AGENZIA (%)"
                value={settings.provvigione_agenzia}
                field="provvigione_agenzia"
                suffix="%"
              />
            </div>
          </div>

          {/* Obiettivi Settimanali */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-lg">✨</span>
              <h3 className="text-sm font-medium tracking-[0.2em] uppercase text-muted-foreground">
                OBIETTIVI OPERATIVI SETTIMANALI (IDEALI)
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <InputField
                label="CONTATTI/SETTIMANA"
                value={settings.contatti_settimana}
                field="contatti_settimana"
                suffix="Q.ty"
                icon={Phone}
              />
              <InputField
                label="NOTIZIE/SETTIMANA"
                value={settings.notizie_settimana}
                field="notizie_settimana"
                suffix="Q.ty"
                icon={FileText}
              />
              <InputField
                label="APPUNTAMENTI/SETTIMANA"
                value={settings.appuntamenti_settimana}
                field="appuntamenti_settimana"
                suffix="Q.ty"
                icon={CalendarDays}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="ACQUISIZIONI/SETTIMANA"
                value={settings.acquisizioni_settimana}
                field="acquisizioni_settimana"
                suffix="Q.ty"
                icon={Gift}
              />
              <InputField
                label="INCARICHI/SETTIMANA"
                value={settings.incarichi_settimana}
                field="incarichi_settimana"
                suffix="Q.ty"
                icon={Award}
              />
            </div>
          </div>
        </div>

        {/* Right Column - Projection */}
        <div className="space-y-6">
          <div className="dark-card space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-lg">✦</span>
              <h3 className="text-sm font-medium tracking-[0.15em] uppercase text-white">
                PROIEZIONE RISULTATI
              </h3>
            </div>

            <div>
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-2">
                REDDITO NETTO STIMATO
              </p>
              <p className="text-4xl font-light text-primary">
                € {new Intl.NumberFormat('it-IT').format(fatturatoNetto)}
              </p>
            </div>

            <div className="border-t border-white/10 pt-6">
              <p className="text-6xl font-bold text-white">{venditeTotali}</p>
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mt-1">
                VENDITE TOTALI
              </p>
            </div>

            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-1">
                MEDIA VENDITE/MESE
              </p>
              <p className="text-2xl font-light text-white">
                {mediaVenditeMese} <span className="text-sm text-muted-foreground">Unità</span>
              </p>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full bg-card text-foreground border border-border rounded-full h-14 flex items-center justify-center gap-3 font-medium tracking-[0.2em] uppercase hover:bg-muted transition-colors"
          >
            SALVA CONFIGURAZIONE
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
