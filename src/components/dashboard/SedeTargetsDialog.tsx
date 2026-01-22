import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSedeTargets, SedeTargets } from '@/hooks/useSedeTargets';
import { Settings } from 'lucide-react';

interface SedeTargetsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SedeTargetsDialog = ({ open, onOpenChange }: SedeTargetsDialogProps) => {
  const { targets, updateTargets } = useSedeTargets();
  const [formData, setFormData] = useState<SedeTargets>(targets);

  useEffect(() => {
    setFormData(targets);
  }, [targets]);

  const handleSave = () => {
    updateTargets.mutate(formData);
    onOpenChange(false);
  };

  const fields = [
    { key: 'contatti_target', label: 'Contatti', type: 'number' },
    { key: 'notizie_target', label: 'Notizie', type: 'number' },
    { key: 'incarichi_target', label: 'Incarichi', type: 'number' },
    { key: 'acquisizioni_target', label: 'Acquisizioni', type: 'number' },
    { key: 'appuntamenti_target', label: 'Appuntamenti', type: 'number' },
    { key: 'vendite_target', label: 'Vendite', type: 'number' },
    { key: 'fatturato_target', label: 'Fatturato Target', type: 'currency' },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto rounded-3xl border-0 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Settings className="w-5 h-5" />
            Obiettivi Sede
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {fields.map(({ key, label, type }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                {label}
              </label>
              <div className="relative">
                {type === 'currency' && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                )}
                <input
                  type="number"
                  value={formData[key]}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    [key]: Number(e.target.value) || 0,
                  }))}
                  className={`w-28 bg-muted/50 rounded-xl py-2 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    type === 'currency' ? 'pl-7 pr-3' : 'px-3'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={updateTargets.isPending}
          className="w-full bg-foreground text-background rounded-xl py-3 text-sm font-medium mt-2 disabled:opacity-50"
        >
          {updateTargets.isPending ? 'Salvando...' : 'Salva Obiettivi'}
        </button>
      </DialogContent>
    </Dialog>
  );
};

export default SedeTargetsDialog;
