import { useState, useEffect } from 'react';
import { useSedeTargets, SedeTargets } from '@/hooks/useSedeTargets';
import { useAuth } from '@/hooks/useAuth';
import { Target, Phone, FileText, Calendar, Briefcase, Building, Euro, ShoppingBag, ArrowRight, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const InputField = ({
  label, value, field, suffix, icon: Icon, onChange,
}: {
  label: string; value: number; field: string; suffix?: string;
  icon?: React.ComponentType<{ className?: string }>;
  onChange: (field: string, value: number) => void;
}) => (
  <div className="space-y-2">
    <span className="flex items-center gap-1.5 text-xs font-medium tracking-wider uppercase text-muted-foreground">
      {Icon && <Icon className="w-3.5 h-3.5" />}
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
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{suffix}</span>
      )}
    </div>
  </div>
);

const SedeTargetsPage = () => {
  const { targets, updateTargets } = useSedeTargets();
  const { profile } = useAuth();
  const [formData, setFormData] = useState<SedeTargets>(targets);

  useEffect(() => {
    setFormData(targets);
  }, [targets]);

  const handleChange = (field: string, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await updateTargets.mutateAsync(formData);
    } catch {
      // toast handled in hook
    }
  };

  return (
    <div className="px-4 md:px-6 pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-foreground text-background flex items-center justify-center">
          <Target className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold tracking-wide uppercase">OBIETTIVI AGENZIA</h2>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground">
            SEDE: {profile?.sede || '—'}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Obiettivi Economici (Annuali) */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-muted">
            <Euro className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-bold tracking-wider uppercase">OBIETTIVI ECONOMICI (ANNUALI)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Fatturato Agenzia" value={formData.fatturato_target || 0} field="fatturato_target" suffix="€" icon={Euro} onChange={handleChange} />
            <InputField label="Vendite Annuali" value={formData.vendite_target || 0} field="vendite_target" suffix="Qt" icon={ShoppingBag} onChange={handleChange} />
          </div>
        </div>

        {/* Obiettivi Operativi (Mensili) */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-muted">
            <span className="text-base">✨</span>
            <h3 className="text-sm font-bold tracking-wider uppercase">OBIETTIVI OPERATIVI (MENSILI)</h3>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            Volumi totali che la sede deve produrre al mese.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <InputField label="Contatti" value={formData.contatti_target || 0} field="contatti_target" suffix="Qt" icon={Phone} onChange={handleChange} />
            <InputField label="Notizie" value={formData.notizie_target || 0} field="notizie_target" suffix="Qt" icon={FileText} onChange={handleChange} />
            <InputField label="Appuntamenti" value={formData.appuntamenti_target || 0} field="appuntamenti_target" suffix="Qt" icon={Calendar} onChange={handleChange} />
            <InputField label="Acquisizioni" value={formData.acquisizioni_target || 0} field="acquisizioni_target" suffix="Qt" icon={Building} onChange={handleChange} />
            <InputField label="Incarichi" value={formData.incarichi_target || 0} field="incarichi_target" suffix="Qt" icon={Briefcase} onChange={handleChange} />
            <InputField label="Trattative Chiuse" value={formData.trattative_chiuse_target || 0} field="trattative_chiuse_target" suffix="Qt" icon={TrendingDown} onChange={handleChange} />
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={updateTargets.isPending}
          className="w-full bg-foreground text-background rounded-full h-14 flex items-center justify-center gap-3 font-medium tracking-[0.2em] uppercase hover:bg-foreground/90 transition-colors disabled:opacity-50"
        >
          {updateTargets.isPending ? 'SALVATAGGIO...' : 'SALVA STRATEGIA'}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default SedeTargetsPage;
