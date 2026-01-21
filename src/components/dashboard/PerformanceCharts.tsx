import { useMemo } from 'react';
import { TrendingUp, FileText, Award, Euro } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, AreaChart, Area } from 'recharts';

type Period = 'week' | 'month' | 'year';

type Props = {
  myData: any[] | undefined;
  chartPeriod: Period;
  onChartPeriodChange: (p: Period) => void;
  formatCompactCurrency: (value: number) => string;
};

const PerformanceCharts = ({ myData, chartPeriod, onChartPeriodChange, formatCompactCurrency }: Props) => {
  const performanceChartData = useMemo(() => {
    if (!myData || myData.length === 0) return [];

    const now = new Date();
    let startDate: Date;

    switch (chartPeriod) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const filteredData = myData
      .filter((d) => new Date(d.date) >= startDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return filteredData.map((d) => ({
      date: new Date(d.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
      incarichi: d.incarichi_vendita || 0,
      vendite: d.vendite_numero || 0,
      fatturato: Number(d.vendite_valore) || 0,
    }));
  }, [myData, chartPeriod]);

  const periodTotals = useMemo(() => {
    return performanceChartData.reduce(
      (acc, d) => ({
        incarichi: acc.incarichi + d.incarichi,
        vendite: acc.vendite + d.vendite,
        fatturato: acc.fatturato + d.fatturato,
      }),
      { incarichi: 0, vendite: 0, fatturato: 0 }
    );
  }, [performanceChartData]);

  return (
    <div className="bg-card rounded-2xl shadow-lg p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 shrink-0">
          <TrendingUp className="w-3 h-3 text-foreground" />
          <h3 className="text-[9px] font-medium tracking-[0.1em] uppercase text-foreground">PERF</h3>
        </div>

        {/* Compact toggle buttons */}
        <div className="inline-flex items-center bg-muted rounded-full p-0.5">
          {(['week', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => onChartPeriodChange(p)}
              className={
                `px-2.5 py-1 text-[8px] font-semibold tracking-wide uppercase rounded-full transition-all ` +
                (chartPeriod === p ? 'bg-foreground text-background' : 'text-muted-foreground')
              }
            >
              {p === 'week' ? 'S' : p === 'month' ? 'M' : 'A'}
            </button>
          ))}
        </div>
      </div>

      <div key={chartPeriod} className="space-y-3 animate-fade-in">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground">INCARICHI</span>
            </div>
            <span className="text-sm font-semibold text-foreground">{periodTotals.incarichi}</span>
          </div>
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceChartData}>
                <XAxis dataKey="date" tick={{ fontSize: 8 }} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Bar dataKey="incarichi" fill="hsl(var(--foreground))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Award className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground">VENDITE</span>
            </div>
            <span className="text-sm font-semibold text-foreground">{periodTotals.vendite}</span>
          </div>
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceChartData}>
                <XAxis dataKey="date" tick={{ fontSize: 8 }} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Bar dataKey="vendite" fill="hsl(var(--foreground))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Euro className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground">FATTURATO</span>
            </div>
            <span className="text-sm font-semibold text-foreground whitespace-nowrap">
              {formatCompactCurrency(periodTotals.fatturato)}
            </span>
          </div>
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceChartData}>
                <defs>
                  <linearGradient id="fatturatoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 8 }} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Area
                  type="monotone"
                  dataKey="fatturato"
                  stroke="hsl(var(--foreground))"
                  strokeWidth={1.5}
                  fill="url(#fatturatoGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceCharts;
