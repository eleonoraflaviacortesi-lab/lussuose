import { useEffect, useState, useCallback } from 'react';
import { Settings, Target, ArrowRight, User, MapPin, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useUserSettings, UserSettingsInput } from '@/hooks/useUserSettings';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';

const EMOJI_OPTIONS = ['👑', '👩‍💼', '📈', '🏠', '✨', '🖤', '💼', '💎', '🌸', '💅', '👠', '💄'];
const SEDI = ['CITTÀ DI CASTELLO', 'AREZZO'] as const;

const pillInputClass = "w-full bg-muted border-0 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 h-12";

const InputField = ({
  label, value, field, suffix, onChange



}: {label: string;value: number;field: string;suffix?: string;onChange: (field: string, value: number) => void;}) =>
<div className="space-y-2">
    <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground">{label}</span>
    <div className="relative">
      <Input
      type="number"
      inputMode="numeric"
      value={value || ''}
      onChange={(e) => onChange(field, parseInt(e.target.value) || 0)}
      placeholder="0"
      className="bg-muted border-0 rounded-xl h-12 text-base pr-12" />
    
      {suffix &&
    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{suffix}</span>
    }
    </div>
  </div>;


const SettingsPage = () => {
  const { settings, isLoading, saveSettings, defaultSettings } = useUserSettings();
  const { profile, user, refetchProfile } = useAuth();

  const [localSettings, setLocalSettings] = useState<UserSettingsInput>(defaultSettings);

  // Profile state
  const [selectedEmoji, setSelectedEmoji] = useState('🖤');
  const [customEmoji, setCustomEmoji] = useState('');
  const [fullName, setFullName] = useState('');
  const [sede, setSede] = useState<string>('AREZZO');
  const [selectedSedi, setSelectedSedi] = useState<string[]>([]);
  const [role, setRole] = useState<string>('agente');
  const [profileSaving, setProfileSaving] = useState(false);

  const isCoordinator = role === 'coordinatore' || role === 'admin';

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
        fatturato_generato_settimana: Number(settings.fatturato_generato_settimana)
      });
    }
  }, [settings]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setSede(profile.sede || 'AREZZO');
      setSelectedSedi((profile as any).sedi || []);
      setRole(profile.role || 'agente');
      if (profile.avatar_emoji) setSelectedEmoji(profile.avatar_emoji);
    }
  }, [profile]);

  const toggleSede = (s: string) => {
    triggerHaptic('selection');
    setSelectedSedi((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const fatturatoNetto = localSettings.obbiettivo_fatturato;
  const fatturatoAgenziaNeeded = localSettings.obbiettivo_fatturato / (localSettings.percentuale_personale / 100);
  const volumeVenditeNeeded = fatturatoAgenziaNeeded / (localSettings.provvigione_agenzia / 100);
  const venditeTotali = Math.ceil(volumeVenditeNeeded / localSettings.prezzo_medio_vendita);
  const mediaVenditeMese = (venditeTotali / 11).toFixed(1);

  const handleChange = useCallback((field: string, value: number) => {
    setLocalSettings((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSaveAll = async () => {
    // Save profile
    if (user) {
      setProfileSaving(true);
      try {
        const avatarToSave = customEmoji || selectedEmoji;
        const isCoord = role === 'coordinatore' || role === 'admin';
        const { error } = await supabase.
        from('profiles').
        update({
          full_name: fullName,
          avatar_emoji: avatarToSave,
          sede,
          role,
          sedi: isCoord ? selectedSedi : []
        }).
        eq('user_id', user.id);
        if (error) throw error;
        await refetchProfile();
      } catch (error: any) {
        triggerHaptic('error');
        toast({ title: 'Errore profilo', description: error.message, variant: 'destructive' });
        setProfileSaving(false);
        return;
      }
      setProfileSaving(false);
    }

    // Save settings
    saveSettings.mutate(localSettings);
    triggerHaptic('success');
  };

  const isSaving = profileSaving || saveSettings.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-foreground border-t-transparent"></div>
      </div>);

  }

  const currentEmoji = customEmoji || selectedEmoji;

  return (
    <div className="px-4 md:px-6 pb-8 animate-fade-in">
      {/* Header */}
      









      

      <div className="space-y-6">
        {/* ── PROFILO ── */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-muted">
            <User className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-bold tracking-wider uppercase">IL TUO PROFILO</h3>
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-4xl shadow-sm">
              {currentEmoji}
            </div>
          </div>

          {/* Emoji Selector */}
          <div className="space-y-2">
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground text-center">SCEGLI AVATAR</p>
            <div className="flex justify-center gap-2 flex-wrap">
              {EMOJI_OPTIONS.map((emoji) =>
              <button
                key={emoji}
                onClick={() => {setSelectedEmoji(emoji);setCustomEmoji('');}}
                className={cn(
                  "w-10 h-10 text-xl rounded-full flex items-center justify-center transition-all active:scale-95",
                  selectedEmoji === emoji && !customEmoji ?
                  'bg-foreground text-background' :
                  'bg-muted hover:bg-accent'
                )}>
                
                  {emoji}
                </button>
              )}
            </div>
            <input
              placeholder="Oppure incolla emoji personalizzata..."
              value={customEmoji}
              onChange={(e) => setCustomEmoji(e.target.value)}
              className={cn(pillInputClass, "text-center")} />
            
          </div>

          {/* Name */}
          <div className="space-y-2">
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">NOME COMPLETO</p>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={cn(pillInputClass, "pl-11")}
                placeholder="Il tuo nome" />
              
            </div>
          </div>

          {/* Role & Sede */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">RUOLO</p>
              <div className="flex gap-1">
                {(['agente', 'coordinatore'] as const).map((r) =>
                <button
                  key={r}
                  onClick={() => {triggerHaptic('selection');setRole(r);}}
                  className={cn(
                    "flex-1 h-10 rounded-full text-[10px] font-medium transition-all flex items-center justify-center capitalize active:scale-95",
                    role === r ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                  )}>
                  
                    {r === 'coordinatore' ? 'Coord.' : 'Agente'}
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">
                {isCoordinator ? 'SEDE PRINCIPALE' : 'SEDE'}
              </p>
              <div className="flex gap-1">
                {SEDI.map((s) =>
                <button
                  key={s}
                  onClick={() => {triggerHaptic('selection');setSede(s);}}
                  className={cn(
                    "flex-1 h-10 rounded-full text-[10px] font-medium transition-all flex items-center justify-center gap-1 active:scale-95",
                    sede === s ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                  )}>
                  
                    <MapPin className="w-3 h-3" />
                    {s === 'CITTÀ DI CASTELLO' ? 'CDT' : 'AR'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Multi-sede for coordinators */}
          {isCoordinator &&
          <div className="space-y-2">
              <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">SEDI GESTITE</p>
              <div className="flex gap-2">
                {SEDI.map((s) =>
              <button
                key={s}
                onClick={() => toggleSede(s)}
                className={cn(
                  "flex-1 h-12 rounded-2xl text-xs font-medium transition-all flex items-center justify-center gap-2 active:scale-95",
                  selectedSedi.includes(s) ?
                  "bg-foreground text-background" :
                  "bg-muted text-muted-foreground border-2 border-dashed border-muted-foreground/30"
                )}>
                
                    <MapPin className="w-4 h-4" />
                    {s === 'CITTÀ DI CASTELLO' ? 'Città di Castello' : 'Arezzo'}
                    {selectedSedi.includes(s) && <Check className="w-4 h-4" />}
                  </button>
              )}
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Seleziona le sedi di cui vuoi vedere clienti e notizie
              </p>
            </div>
          }
        </div>

        {/* ── PIANO FINANZIARIO ── */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-muted">
            <Target className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-bold tracking-wider uppercase">IL TUO PIANO FINANZIARIO</h3>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            Questi sono i tuoi obiettivi personali per calcolare le proiezioni del tuo reddito.
          </p>
          <div className="space-y-4">
            <InputField label="TUO OBIETTIVO PROVVIGIONALE" value={localSettings.obbiettivo_fatturato} field="obbiettivo_fatturato" suffix="€" onChange={handleChange} />
            <InputField label="BASE FISSA ANNUALE" value={localSettings.base_fissa_annuale} field="base_fissa_annuale" suffix="€" onChange={handleChange} />
            <InputField label="TUA %" value={localSettings.percentuale_personale} field="percentuale_personale" suffix="%" onChange={handleChange} />
            <InputField label="PREZZO MEDIO VENDITA" value={localSettings.prezzo_medio_vendita} field="prezzo_medio_vendita" suffix="€" onChange={handleChange} />
            <InputField label="PROVVIGIONE AGENZIA" value={localSettings.provvigione_agenzia} field="provvigione_agenzia" suffix="%" onChange={handleChange} />
          </div>
        </div>

        {/* ── OBIETTIVI SETTIMANALI ── */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-muted">
            <span className="text-base">✨</span>
            <h3 className="text-sm font-bold tracking-wider uppercase">OBIETTIVI SETTIMANALI</h3>
          </div>
          <div className="space-y-4">
            <InputField label="CONTATTI" value={localSettings.contatti_settimana} field="contatti_settimana" suffix="Qt" onChange={handleChange} />
            <InputField label="NOTIZIE" value={localSettings.notizie_settimana} field="notizie_settimana" suffix="Qt" onChange={handleChange} />
            <InputField label="APPUNTAMENTI" value={localSettings.appuntamenti_settimana} field="appuntamenti_settimana" suffix="Qt" onChange={handleChange} />
            <InputField label="ACQUISIZIONI" value={localSettings.acquisizioni_settimana} field="acquisizioni_settimana" suffix="Qt" onChange={handleChange} />
            <InputField label="INCARICHI" value={localSettings.incarichi_settimana} field="incarichi_settimana" suffix="Qt" onChange={handleChange} />
            <InputField label="NUOVE TRATTATIVE" value={localSettings.nuove_trattative_settimana} field="nuove_trattative_settimana" suffix="Qt" onChange={handleChange} />
            <InputField label="TRATTATIVE CHIUSE" value={localSettings.trattative_chiuse_settimana} field="trattative_chiuse_settimana" suffix="Qt" onChange={handleChange} />
            <InputField label="VENDITE" value={localSettings.vendite_settimana} field="vendite_settimana" suffix="Qt" onChange={handleChange} />
            <InputField label="FATTURATO A CREDITO" value={localSettings.fatturato_credito_settimana} field="fatturato_credito_settimana" suffix="€" onChange={handleChange} />
            <InputField label="FATTURATO GENERATO" value={localSettings.fatturato_generato_settimana} field="fatturato_generato_settimana" suffix="€" onChange={handleChange} />
          </div>
        </div>

        {/* ── PROIEZIONE ── */}
        <div className="dark-card space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-base">✦</span>
            <h3 className="text-sm font-bold tracking-wider uppercase text-white">PROIEZIONE RISULTATI</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-1">REDDITO NETTO</p>
              <p className="text-xl font-light text-white whitespace-nowrap">€{new Intl.NumberFormat('it-IT').format(fatturatoNetto)}</p>
            </div>
            <div>
              <p className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-1">VENDITE TOTALI</p>
              <p className="text-xl font-bold text-white">{venditeTotali}</p>
            </div>
            <div>
              <p className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-1">MEDIA/MESE</p>
              <p className="text-xl font-light text-white">{mediaVenditeMese}</p>
            </div>
          </div>
        </div>

        {/* Save All */}
        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="w-full bg-foreground text-background rounded-full h-14 flex items-center justify-center gap-3 font-medium tracking-[0.2em] uppercase hover:bg-foreground/90 transition-colors disabled:opacity-50">
          
          {isSaving ? 'SALVATAGGIO...' : 'SALVA TUTTO'}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>);

};

export default SettingsPage;