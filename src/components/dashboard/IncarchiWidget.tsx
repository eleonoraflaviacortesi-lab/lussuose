import { useMemo } from 'react';
import { useDailyData } from '@/hooks/useDailyData';
import { useUserSettings } from '@/hooks/useUserSettings';
import { Progress } from '@/components/ui/progress';
import { FileText, Target } from 'lucide-react';

const IncarchiWidget = () => {
  const { myData } = useDailyData();
  const { settings } = useUserSettings();

  const { incarichiMese, targetMensile, mancanti, percent } = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Calculate incarichi this month
    const incarichiMese = myData
      ?.filter(d => new Date(d.date) >= startOfMonth)
      .reduce((acc, d) => acc + (d.incarichi_vendita || 0), 0) || 0;
    
    // Calculate monthly target based on weekly ideal * 4
    const weeklyIdeal = settings?.incarichi_settimana || 1;
    const targetMensile = weeklyIdeal * 4;
    
    const mancanti = Math.max(0, targetMensile - incarichiMese);
    const percent = targetMensile > 0 ? Math.min(100, Math.round((incarichiMese / targetMensile) * 100)) : 0;
    
    return { incarichiMese, targetMensile, mancanti, percent };
  }, [myData, settings]);

  return (
    <div className="bg-card rounded-2xl shadow-lg p-5 relative overflow-hidden">
      <div className="absolute right-3 top-3 opacity-5">
        <Target className="w-24 h-24 text-foreground" />
      </div>
      
      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-foreground" />
          <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-foreground">
            INCARICHI DEL MESE
          </h3>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-light text-foreground">{incarichiMese}</span>
          <span className="text-xl font-light text-muted-foreground">/ {targetMensile}</span>
        </div>

        <Progress value={percent} className="h-1.5 bg-muted" />

        <div className="flex items-center justify-between text-xs">
          <span className="font-medium tracking-wider uppercase text-muted-foreground">
            {mancanti > 0 ? `MANCANO ${mancanti} INCARICHI` : 'OBIETTIVO RAGGIUNTO! 🎉'}
          </span>
          <span className="font-semibold text-foreground">{percent}%</span>
        </div>
      </div>
    </div>
  );
};

export default IncarchiWidget;