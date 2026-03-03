import { useMemo } from 'react';
import { useDailyData } from '@/hooks/useDailyData';
import { useUserSettings } from '@/hooks/useUserSettings';
import { FileText, Target } from 'lucide-react';

const IncarchiWidget = () => {
  const { myData } = useDailyData();
  const { settings } = useUserSettings();

  const { incarichiMese, targetMensile, mancanti, percent } = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const incarichiMese = myData
      ?.filter((d) => new Date(d.date) >= startOfMonth)
      .reduce((acc, d) => acc + (d.incarichi_vendita || 0), 0) || 0;

    const weeklyIdeal = settings?.incarichi_settimana || 1;
    const targetMensile = weeklyIdeal * 4;
    const mancanti = Math.max(0, targetMensile - incarichiMese);
    const percent = targetMensile > 0 ? Math.min(100, Math.round(incarichiMese / targetMensile * 100)) : 0;

    return { incarichiMese, targetMensile, mancanti, percent };
  }, [myData, settings]);

  return (
    <div className="bg-card rounded-3xl border border-border p-6 relative overflow-hidden">
      <div className="absolute right-4 top-4 opacity-[0.03]">
        <Target className="w-28 h-28 text-foreground" />
      </div>

      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <FileText className="w-4 h-4 text-foreground" />
          </div>
          <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground">
            Incarichi del Mese
          </h3>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold tracking-tight">{incarichiMese}</span>
          <span className="text-lg text-muted-foreground font-light">/ {targetMensile}</span>
        </div>

        <div className="h-1.5 w-full rounded-full overflow-hidden bg-muted">
          <div
            className="h-full rounded-full transition-all duration-500 bg-foreground"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="font-medium tracking-wider uppercase text-muted-foreground">
            {mancanti > 0 ? `Mancano ${mancanti} incarichi` : 'Obiettivo raggiunto! 🎉'}
          </span>
          <span className="font-bold text-foreground">{percent}%</span>
        </div>
      </div>
    </div>
  );
};

export default IncarchiWidget;
