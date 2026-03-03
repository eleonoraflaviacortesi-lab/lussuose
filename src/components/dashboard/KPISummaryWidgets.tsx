import { useMemo } from 'react';
import { Phone, FileText, Home, Handshake, CalendarCheck, TrendingUp } from 'lucide-react';

interface WidgetData {
  label: string;
  value: number;
  target: number;
  icon: React.ElementType;
}

interface KPISummaryWidgetsProps {
  kpis: Record<string, { value: number; target: number; delta: number }> | null;
}

const KPISummaryWidgets = ({ kpis }: KPISummaryWidgetsProps) => {
  const widgets: WidgetData[] = useMemo(() => {
    if (!kpis) return [];
    return [
      { label: 'Contatti', value: kpis.contatti?.value || 0, target: kpis.contatti?.target || 0, icon: Phone },
      { label: 'Notizie', value: kpis.notizie?.value || 0, target: kpis.notizie?.target || 0, icon: FileText },
      { label: 'Appuntamenti', value: kpis.appuntamenti?.value || 0, target: kpis.appuntamenti?.target || 0, icon: CalendarCheck },
      { label: 'Acquisizioni', value: kpis.acquisizioni?.value || 0, target: kpis.acquisizioni?.target || 0, icon: Home },
      { label: 'Incarichi', value: kpis.incarichi?.value || 0, target: kpis.incarichi?.target || 0, icon: Handshake },
      { label: 'Trattative', value: kpis.trattativeChiuse?.value || 0, target: kpis.trattativeChiuse?.target || 0, icon: TrendingUp },
    ];
  }, [kpis]);

  if (!kpis) return null;

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-3">
      {widgets.map((w) => {
        const Icon = w.icon;
        const pct = w.target > 0 ? Math.min(100, Math.round((w.value / w.target) * 100)) : 0;
        const isHit = w.target > 0 && w.value >= w.target;

        return (
          <div
            key={w.label}
            className="rounded-2xl p-3 md:p-4 border border-border bg-card text-card-foreground transition-transform active:scale-[0.97]"
          >
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <p
                className="text-[8px] md:text-[10px] font-semibold tracking-[0.12em] md:tracking-[0.15em] uppercase text-muted-foreground whitespace-nowrap truncate"
                style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}
              >
                {w.label}
              </p>
              <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground shrink-0 ml-1" />
            </div>

            <div className="flex items-baseline gap-1 md:gap-1.5 mb-2 md:mb-3">
              <span className="text-2xl md:text-3xl font-medium">{w.value}</span>
              <span className="text-xs md:text-sm text-muted-foreground">/ {w.target}</span>
            </div>

            <div className="space-y-1">
              <div className="h-1 md:h-1.5 w-full rounded-full overflow-hidden bg-muted">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-foreground"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[8px] md:text-[10px] text-muted-foreground">
                <span>{pct}%</span>
                {isHit && (
                  <span className="font-semibold text-foreground">✓</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KPISummaryWidgets;
