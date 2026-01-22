import { useEffect, useState, useCallback } from 'react';
import { Settings, Target, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useUserSettings, UserSettingsInput } from '@/hooks/useUserSettings';

// Moved outside component to prevent re-mount on every render
const InputField = ({ 
  label, 
  value, 
  field, 
  suffix,
  onChange,
}: { 
  label: string; 
  value: number; 
  field: string; 
  suffix?: string;
  onChange: (field: string, value: number) => void;
}) => (
  <div className="space-y-2">
    <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
      {label}
    </span>
    <div className="relative">
      <Input
        type="number"
        inputMode="numeric"
        value={value || ''}
        onChange={(e) => onChange(field, parseInt(e.target.value) || 0)}
        placeholder="0"
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

const SettingsPage = () => {
  const { settings, isLoading, saveSettings, defaultSettings } = useUserSettings();
  
  const [localSettings, setLocalSettings] = useState<UserSettingsInput>(defaultSettings);

  // Sync local state with fetched settings
  useEffect(() => {
    if (settings) {
      setLocalSettings({
        obbiettivo_fatturato: Number(settings.obbiettivo_fatturato),
        base_fissa_annuale: Number(settings.base_fissa_annuale),
        percentuale_personale: Number(settings.percentuale_personale),
        prezzo_medio_vendita: Number(settings.prezzo_medio_vendita),
        provvigione_agenzia: Number(settings.provvigione_agenzia),
        contatti_settimana: settings.contatti_settimana,
        notizie_settimana: settings.notizie_settimana,
        appuntamenti_settimana: settings.appuntamenti_settimana,
        acquisizioni_settimana: settings.acquisizioni_settimana,
        incarichi_settimana: settings.incarichi_settimana,
        nuove_trattative_settimana: settings.nuove_trattative_settimana,
        trattative_chiuse_settimana: settings.trattative_chiuse_settimana,
        vendite_settimana: settings.vendite_settimana,
        fatturato_credito_settimana: Number(settings.fatturato_credito_settimana),
        fatturato_generato_settimana: Number(settings.fatturato_generato_settimana),
      });
    }
  }, [settings]);

  // Calcoli corretti:
  // obbiettivo_fatturato = obiettivo provvigionale personale (ciò che vuoi guadagnare)
  // percentuale_personale = la tua % sulla provvigione dell'agenzia
  // provvigione_agenzia = % che l'agenzia guadagna sulla vendita
  
  const fatturatoNetto = localSettings.obbiettivo_fatturato; // È già il tuo obiettivo personale
  
  // Per guadagnare €50.000, se prendi il 10% dell'agenzia, l'agenzia deve fatturare €500.000
  const fatturatoAgenziaNeeded = localSettings.obbiettivo_fatturato / (localSettings.percentuale_personale / 100);
  
  // Se l'agenzia prende il 4% sulle vendite, il volume vendite deve essere €12.500.000
  const volumeVenditeNeeded = fatturatoAgenziaNeeded / (localSettings.provvigione_agenzia / 100);
  
  // Numero vendite = volume / prezzo medio
  const venditeTotali = Math.ceil(volumeVenditeNeeded / localSettings.prezzo_medio_vendita);
  const mediaVenditeMese = (venditeTotali / 11).toFixed(1);

  const handleChange = useCallback((field: string, value: number) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = () => {
    saveSettings.mutate(localSettings);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-foreground border-t-transparent"></div>
      </div>
    );
  }

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
            I TUOI OBIETTIVI PERSONALI
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Piano Finanziario Personale */}
        <div className="bg-card rounded-2xl shadow-lg p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-muted">
            <Target className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-bold tracking-wider uppercase">
              IL TUO PIANO FINANZIARIO
            </h3>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            Questi sono i tuoi obiettivi personali per calcolare le proiezioni del tuo reddito.
          </p>

          <div className="space-y-4">
            <InputField
              label="TUO OBIETTIVO PROVVIGIONALE"
              value={localSettings.obbiettivo_fatturato}
              field="obbiettivo_fatturato"
              suffix="€"
              onChange={handleChange}
            />
            <InputField
              label="BASE FISSA ANNUALE"
              value={localSettings.base_fissa_annuale}
              field="base_fissa_annuale"
              suffix="€"
              onChange={handleChange}
            />
            <InputField
              label="TUA %"
              value={localSettings.percentuale_personale}
              field="percentuale_personale"
              suffix="%"
              onChange={handleChange}
            />
            <InputField
              label="PREZZO MEDIO VENDITA"
              value={localSettings.prezzo_medio_vendita}
              field="prezzo_medio_vendita"
              suffix="€"
              onChange={handleChange}
            />
            <InputField
              label="PROVVIGIONE AGENZIA"
              value={localSettings.provvigione_agenzia}
              field="provvigione_agenzia"
              suffix="%"
              onChange={handleChange}
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
              value={localSettings.contatti_settimana}
              field="contatti_settimana"
              suffix="Qt"
              onChange={handleChange}
            />
            <InputField
              label="NOTIZIE"
              value={localSettings.notizie_settimana}
              field="notizie_settimana"
              suffix="Qt"
              onChange={handleChange}
            />
            <InputField
              label="APPUNTAMENTI"
              value={localSettings.appuntamenti_settimana}
              field="appuntamenti_settimana"
              suffix="Qt"
              onChange={handleChange}
            />
            <InputField
              label="ACQUISIZIONI"
              value={localSettings.acquisizioni_settimana}
              field="acquisizioni_settimana"
              suffix="Qt"
              onChange={handleChange}
            />
            <InputField
              label="INCARICHI"
              value={localSettings.incarichi_settimana}
              field="incarichi_settimana"
              suffix="Qt"
              onChange={handleChange}
            />
            <InputField
              label="NUOVE TRATTATIVE"
              value={localSettings.nuove_trattative_settimana}
              field="nuove_trattative_settimana"
              suffix="Qt"
              onChange={handleChange}
            />
            <InputField
              label="TRATTATIVE CHIUSE"
              value={localSettings.trattative_chiuse_settimana}
              field="trattative_chiuse_settimana"
              suffix="Qt"
              onChange={handleChange}
            />
            <InputField
              label="VENDITE"
              value={localSettings.vendite_settimana}
              field="vendite_settimana"
              suffix="Qt"
              onChange={handleChange}
            />
            <InputField
              label="FATTURATO A CREDITO"
              value={localSettings.fatturato_credito_settimana}
              field="fatturato_credito_settimana"
              suffix="€"
              onChange={handleChange}
            />
            <InputField
              label="FATTURATO GENERATO"
              value={localSettings.fatturato_generato_settimana}
              field="fatturato_generato_settimana"
              suffix="€"
              onChange={handleChange}
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
          disabled={saveSettings.isPending}
          className="w-full bg-foreground text-background rounded-full h-14 flex items-center justify-center gap-3 font-medium tracking-[0.2em] uppercase hover:bg-foreground/90 transition-colors disabled:opacity-50"
        >
          {saveSettings.isPending ? 'SALVATAGGIO...' : 'SALVA CONFIGURAZIONE'}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;