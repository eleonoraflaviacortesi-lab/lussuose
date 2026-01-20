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
    nuove_trattative_settimana: 2,
    trattative_chiuse_settimana: 1,
    vendite_settimana: 1,
    fatturato_credito_settimana: 50000,
    fatturato_generato_settimana: 20000,
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
  }: { 
    label: string; 
    value: number; 
    field: string; 
    suffix?: string;
  }) => (
    <div className="space-y-2">
      <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
        {label}
      </span>
      <div className="relative">
        <Input
          type="number"
          value={value}
          onChange={(e) => handleChange(field, parseInt(e.target.value) || 0)}
          className="bg-muted border-0 rounded-xl h-12 text-base pr-12"
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="px-6 pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-foreground text-background flex items-center justify-center">
          <Settings className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">IMPOSTAZIONI</h2>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground">
            CONFIGURA I TUOI TARGET
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Piano Finanziario */}
        <div className="bg-card rounded-2xl shadow-lg p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-muted">
            <Target className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-bold tracking-wider uppercase">
              PIANO FINANZIARIO ANNUALE
            </h3>
          </div>

          <div className="space-y-4">
            <InputField
              label="OBIETTIVO FATTURATO"
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
              label="TUA %"
              value={settings.percentuale_personale}
              field="percentuale_personale"
              suffix="%"
            />
            <InputField
              label="PREZZO MEDIO VENDITA"
              value={settings.prezzo_medio_vendita}
              field="prezzo_medio_vendita"
              suffix="€"
            />
            <InputField
              label="PROVVIGIONE AGENZIA"
              value={settings.provvigione_agenzia}
              field="provvigione_agenzia"
              suffix="%"
            />
          </div>
        </div>

        {/* Obiettivi Settimanali */}
        <div className="bg-card rounded-2xl shadow-lg p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-muted">
            <span className="text-base">✨</span>
            <h3 className="text-sm font-bold tracking-wider uppercase">
              OBIETTIVI SETTIMANALI
            </h3>
          </div>

          <div className="space-y-4">
            <InputField
              label="CONTATTI"
              value={settings.contatti_settimana}
              field="contatti_settimana"
              suffix="Qt"
            />
            <InputField
              label="NOTIZIE"
              value={settings.notizie_settimana}
              field="notizie_settimana"
              suffix="Qt"
            />
            <InputField
              label="APPUNTAMENTI"
              value={settings.appuntamenti_settimana}
              field="appuntamenti_settimana"
              suffix="Qt"
            />
            <InputField
              label="ACQUISIZIONI"
              value={settings.acquisizioni_settimana}
              field="acquisizioni_settimana"
              suffix="Qt"
            />
            <InputField
              label="INCARICHI"
              value={settings.incarichi_settimana}
              field="incarichi_settimana"
              suffix="Qt"
            />
            <InputField
              label="NUOVE TRATTATIVE"
              value={settings.nuove_trattative_settimana}
              field="nuove_trattative_settimana"
              suffix="Qt"
            />
            <InputField
              label="TRATTATIVE CHIUSE"
              value={settings.trattative_chiuse_settimana}
              field="trattative_chiuse_settimana"
              suffix="Qt"
            />
            <InputField
              label="VENDITE"
              value={settings.vendite_settimana}
              field="vendite_settimana"
              suffix="Qt"
            />
            <InputField
              label="FATTURATO A CREDITO"
              value={settings.fatturato_credito_settimana}
              field="fatturato_credito_settimana"
              suffix="€"
            />
            <InputField
              label="FATTURATO GENERATO"
              value={settings.fatturato_generato_settimana}
              field="fatturato_generato_settimana"
              suffix="€"
            />
          </div>
        </div>

        {/* Proiezione Risultati */}
        <div className="dark-card space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-base">✦</span>
            <h3 className="text-sm font-bold tracking-wider uppercase text-white">
              PROIEZIONE RISULTATI
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-1">
                REDDITO NETTO
              </p>
              <p className="text-xl font-light text-white whitespace-nowrap">
                €{new Intl.NumberFormat('it-IT').format(fatturatoNetto)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-1">
                VENDITE TOTALI
              </p>
              <p className="text-xl font-bold text-white">{venditeTotali}</p>
            </div>
            <div>
              <p className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-1">
                MEDIA/MESE
              </p>
              <p className="text-xl font-light text-white">{mediaVenditeMese}</p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full bg-foreground text-background rounded-full h-14 flex items-center justify-center gap-3 font-medium tracking-[0.2em] uppercase hover:bg-foreground/90 transition-colors"
        >
          SALVA CONFIGURAZIONE
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;