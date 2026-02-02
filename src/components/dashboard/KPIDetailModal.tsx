import { memo, useMemo, forwardRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useDailyData } from '@/hooks/useDailyData';
import { LucideIcon } from 'lucide-react';

interface KPIDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kpiKey: 'contatti' | 'notizie' | 'chiusure' | 'conversioni' | null;
  title: string;
  value: number | string;
  icon: LucideIcon;
}

const dataKeyMap: Record<string, string> = {
  contatti: 'contatti_reali',
  notizie: 'notizie_reali',
  chiusure: 'vendite_numero',
  conversioni: 'vendite_numero', // We'll compute conversion rate
};

const KPIDetailModal = memo(forwardRef<HTMLDivElement, KPIDetailModalProps>(({ open, onOpenChange, kpiKey, title, value, icon: Icon }, ref) => {
  const { myData } = useDailyData();

  const chartData = useMemo(() => {
    if (!myData || !kpiKey) return [];

    // Last 30 days
    const sorted = [...myData]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30);

    if (kpiKey === 'conversioni') {
      // Calculate running conversion rate
      let totalContatti = 0;
      let totalVendite = 0;
      return sorted.map(d => {
        totalContatti += d.contatti_reali || 0;
        totalVendite += d.vendite_numero || 0;
        const rate = totalContatti > 0 ? Math.round((totalVendite / totalContatti) * 100) : 0;
        return {
          date: new Date(d.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
          value: rate,
        };
      });
    }

    const key = dataKeyMap[kpiKey];
    return sorted.map(d => ({
      date: new Date(d.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
      value: (d as any)[key] || 0,
    }));
  }, [myData, kpiKey]);

  if (!kpiKey) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 border-0 bg-transparent shadow-none">
        {/* Liquid Glass Container */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-foreground/5 flex items-center justify-center">
              <Icon className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground">
                {title}
              </p>
              <p className="text-3xl font-light text-foreground">
                {typeof value === 'number' && kpiKey === 'conversioni' ? `${value}%` : value}
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="h-40">
            <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground mb-2">
              ULTIMI 30 GIORNI
            </p>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="kpiGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(8px)',
                    border: '0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    fontSize: '11px',
                  }}
                  formatter={(val: number) => [
                    kpiKey === 'conversioni' ? `${val}%` : val,
                    title,
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--foreground))"
                  strokeWidth={2}
                  fill="url(#kpiGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Insight */}
          {chartData.length > 1 && (
            <div className="text-xs text-muted-foreground">
              {(() => {
                const first = chartData[0]?.value || 0;
                const last = chartData[chartData.length - 1]?.value || 0;
                const diff = last - first;
                if (diff > 0) return `📈 +${diff} rispetto all'inizio del periodo`;
                if (diff < 0) return `📉 ${diff} rispetto all'inizio del periodo`;
                return '➡️ Stabile nel periodo';
              })()}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}));

KPIDetailModal.displayName = 'KPIDetailModal';

export default KPIDetailModal;
