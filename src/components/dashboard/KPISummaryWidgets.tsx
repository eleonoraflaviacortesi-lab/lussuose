import { useMemo } from 'react';
import { Phone, FileText, Home, Handshake, CalendarCheck, TrendingUp } from 'lucide-react';

interface WidgetData {
  label: string;
  value: number;
  target: number;
  icon: React.ElementType;
  colorClass: string;
}

interface KPISummaryWidgetsProps {
  kpis: Record<string, { value: number; target: number; delta: number }> | null;
}

const KPISummaryWidgets = ({ kpis }: KPISummaryWidgetsProps) => {
  const widgets: WidgetData[] = useMemo(() => {
    if (!kpis) return [];
    return [
      {
        label: 'Contatti',
        value: kpis.contatti?.value || 0,
        target: kpis.contatti?.target || 0,
        icon: Phone,
        colorClass: 'widget-peach',
      },
      {
        label: 'Notizie',
        value: kpis.notizie?.value || 0,
        target: kpis.notizie?.target || 0,
        icon: FileText,
        colorClass: 'widget-mint',
      },
      {
        label: 'Appuntamenti',
        value: kpis.appuntamenti?.value || 0,
        target: kpis.appuntamenti?.target || 0,
        icon: CalendarCheck,
        colorClass: 'widget-lavender',
      },
      {
        label: 'Acquisizioni',
        value: kpis.acquisizioni?.value || 0,
        target: kpis.acquisizioni?.target || 0,
        icon: Home,
        colorClass: 'widget-cream',
      },
      {
        label: 'Incarichi',
        value: kpis.incarichi?.value || 0,
        target: kpis.incarichi?.target || 0,
        icon: Handshake,
        colorClass: 'widget-rose',
      },
      {
        label: 'Trattative Chiuse',
        value: kpis.trattativeChiuse?.value || 0,
        target: kpis.trattativeChiuse?.target || 0,
        icon: TrendingUp,
        colorClass: 'widget-sky',
      },
    ];
  }, [kpis]);

  if (!kpis) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {widgets.map((w) => {
        const Icon = w.icon;
        const pct = w.target > 0 ? Math.min(100, Math.round((w.value / w.target) * 100)) : 0;
        const isHit = w.target > 0 && w.value >= w.target;

        return (
          <div
            key={w.label}
            className="rounded-2xl p-4 transition-transform active:scale-[0.97]"
            style={{
              backgroundColor: `hsl(var(--${w.colorClass}))`,
              color: `hsl(var(--${w.colorClass}-foreground))`,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold tracking-[0.15em] uppercase opacity-70">
                {w.label}
              </p>
              <Icon className="w-4 h-4 opacity-40" />
            </div>

            <div className="flex items-baseline gap-1.5 mb-3">
              <span className="text-3xl font-medium">{w.value}</span>
              <span className="text-sm opacity-50">/ {w.target}</span>
            </div>

            {/* Custom progress bar */}
            <div className="space-y-1">
              <div
                className="h-1.5 w-full rounded-full overflow-hidden"
                style={{ backgroundColor: `hsl(var(--${w.colorClass}-foreground) / 0.15)` }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: `hsl(var(--${w.colorClass}-foreground) / 0.6)`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="opacity-60">{pct}%</span>
                {isHit && (
                  <span className="font-semibold opacity-80">✓ Raggiunto</span>
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
