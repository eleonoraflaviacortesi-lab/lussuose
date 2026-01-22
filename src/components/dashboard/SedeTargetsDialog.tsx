import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useSedeTargets, SedeTargets } from '@/hooks/useSedeTargets';
import { useAuth } from '@/hooks/useAuth';
import { X, Target, Phone, FileText, Calendar, Briefcase, Building, Home, Euro, ShoppingBag, Save, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SedeTargetsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SedeTargetsDialog = ({ open, onOpenChange }: SedeTargetsDialogProps) => {
  const { targets, updateTargets } = useSedeTargets();
  const { profile } = useAuth();
  const [formData, setFormData] = useState<SedeTargets>(targets);

  useEffect(() => {
    setFormData(targets);
  }, [targets]);

  const handleSave = async () => {
    try {
      await updateTargets.mutateAsync(formData);
      onOpenChange(false);
    } catch {
      // toast handled inside the hook
    }
  };

  const inputClass = cn(
    "w-full bg-white rounded-xl px-4 py-3.5 text-base font-medium",
    "border border-border/50 shadow-sm",
    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30",
    "placeholder:text-muted-foreground/50"
  );

  const labelClass = "flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground mb-2 min-h-[32px]";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto p-0 rounded-3xl border-0 bg-white/95 backdrop-blur-2xl shadow-[0_25px_80px_-20px_rgba(0,0,0,0.25)] overflow-hidden [&>button]:hidden">
        {/* Header */}
        <div className="flex items-start gap-4 p-6 pb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg flex-shrink-0">
            <Target className="w-7 h-7 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold tracking-tight leading-tight">
              Obiettivi Sede: {profile?.sede || 'Sede'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Definisci la strategia globale dell'agenzia.
            </p>
          </div>
          <button 
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 -m-1 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-6">
          {/* Obiettivi Economici (Annuali) */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-primary rounded-full" />
              <h3 className="text-xs font-bold tracking-wide uppercase">
                Obiettivi Economici (Annuali)
              </h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  <Euro className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Fatturato Agenzia (€)</span>
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={formData.fatturato_target || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    fatturato_target: Number(e.target.value) || 0,
                  }))}
                  className={inputClass}
                  placeholder="0"
                />
              </div>
              <div>
                <label className={labelClass}>
                  <ShoppingBag className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Vendite Annuali</span>
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={formData.vendite_target || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    vendite_target: Number(e.target.value) || 0,
                  }))}
                  className={inputClass}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Obiettivi Operativi (Mensili) */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-5 bg-primary rounded-full" />
              <h3 className="text-xs font-bold tracking-wide uppercase">
                Obiettivi Operativi (Mensili)
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4 ml-3">
              Volumi totali che la sede deve produrre al mese.
            </p>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Contatti</span>
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={formData.contatti_target || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contatti_target: Number(e.target.value) || 0,
                  }))}
                  className={inputClass}
                  placeholder="0"
                />
              </div>
              <div>
                <label className={labelClass}>
                  <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Notizie</span>
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={formData.notizie_target || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    notizie_target: Number(e.target.value) || 0,
                  }))}
                  className={inputClass}
                  placeholder="0"
                />
              </div>
              <div>
                <label className={labelClass}>
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Appuntamenti</span>
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={formData.appuntamenti_target || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    appuntamenti_target: Number(e.target.value) || 0,
                  }))}
                  className={inputClass}
                  placeholder="0"
                />
              </div>
              <div>
                <label className={labelClass}>
                  <Building className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Acquisizioni</span>
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={formData.acquisizioni_target || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    acquisizioni_target: Number(e.target.value) || 0,
                  }))}
                  className={inputClass}
                  placeholder="0"
                />
              </div>
              <div>
                <label className={labelClass}>
                  <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Incarichi</span>
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={formData.incarichi_target || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    incarichi_target: Number(e.target.value) || 0,
                  }))}
                  className={inputClass}
                  placeholder="0"
                />
              </div>
              <div>
                <label className={labelClass}>
                  <TrendingDown className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Trattative</span>
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={formData.trattative_chiuse_target || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    trattative_chiuse_target: Number(e.target.value) || 0,
                  }))}
                  className={inputClass}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => onOpenChange(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium border border-border/50 text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              disabled={updateTargets.isPending}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {updateTargets.isPending ? 'Salvando...' : 'Salva Strategia'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SedeTargetsDialog;
