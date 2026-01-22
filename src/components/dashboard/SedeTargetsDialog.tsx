import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useSedeTargets, SedeTargets } from '@/hooks/useSedeTargets';
import { useAuth } from '@/hooks/useAuth';
import { X, Target, Phone, FileText, Users, Gift, Home, Euro, ShoppingBag, Save } from 'lucide-react';
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

  const handleSave = () => {
    updateTargets.mutate(formData);
    onOpenChange(false);
  };

  const inputClass = cn(
    "w-full bg-white rounded-xl px-4 py-3 text-sm font-medium",
    "border border-border/50 shadow-sm",
    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30",
    "placeholder:text-muted-foreground/50"
  );

  const labelClass = "flex items-center gap-2 text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-2";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg mx-auto p-0 rounded-3xl border-0 bg-white/95 backdrop-blur-2xl shadow-[0_25px_80px_-20px_rgba(0,0,0,0.25)] overflow-hidden [&>button]:hidden">
        {/* Header */}
        <div className="flex items-start gap-4 p-6 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
            <Target className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold tracking-tight">
              Obiettivi Sede: {profile?.sede || 'Sede'}
            </h2>
            <p className="text-sm text-muted-foreground">
              Definisci la strategia globale dell'agenzia.
            </p>
          </div>
          <button 
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-6">
          {/* Obiettivi Economici (Annuali) */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-primary rounded-full" />
              <h3 className="text-sm font-bold tracking-wide uppercase">
                Obiettivi Economici (Annuali)
              </h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  <Euro className="w-3.5 h-3.5" />
                  Fatturato Agenzia Obiettivo (€)
                </label>
                <input
                  type="number"
                  value={formData.fatturato_target}
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
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Numero Vendite Obiettivo
                </label>
                <input
                  type="number"
                  value={formData.vendite_target}
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

          {/* Obiettivi Operativi (Settimanali) */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-5 bg-primary rounded-full" />
              <h3 className="text-sm font-bold tracking-wide uppercase">
                Obiettivi Operativi (Mensili)
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4 ml-3">
              Inserisci i volumi totali che l'intera sede deve produrre al mese.
            </p>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>
                  <Phone className="w-3.5 h-3.5" />
                  Contatti Totali
                </label>
                <input
                  type="number"
                  value={formData.contatti_target}
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
                  <FileText className="w-3.5 h-3.5" />
                  Notizie Totali
                </label>
                <input
                  type="number"
                  value={formData.notizie_target}
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
                  <Users className="w-3.5 h-3.5" />
                  App. Vendita Totali
                </label>
                <input
                  type="number"
                  value={formData.appuntamenti_target}
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
                  <Gift className="w-3.5 h-3.5" />
                  Incarichi Totali
                </label>
                <input
                  type="number"
                  value={formData.incarichi_target}
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
                  <Home className="w-3.5 h-3.5" />
                  Acquisizioni Totali
                </label>
                <input
                  type="number"
                  value={formData.acquisizioni_target}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    acquisizioni_target: Number(e.target.value) || 0,
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
              className="px-6 py-2.5 rounded-xl text-sm font-medium border border-border/50 text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              disabled={updateTargets.isPending}
              className="px-6 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
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
