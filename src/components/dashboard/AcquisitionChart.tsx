import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useDailyData } from '@/hooks/useDailyData';

const AcquisitionChart = () => {
  const { allData } = useDailyData();

  const chartData = useMemo(() => {
    if (!allData || allData.length === 0) return [];

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);

    const grouped = allData
      .filter((d) => new Date(d.date) >= startDate)
      .reduce((acc, d) => {
        const dateKey = d.date;
        if (!acc[dateKey]) {
          acc[dateKey] = { contatti: 0, notizie: 0 };
        }
        acc[dateKey].contatti += d.contatti_reali || 0;
        acc[dateKey].notizie += d.notizie_reali || 0;
        return acc;
      }, {} as Record<string, { contatti: number; notizie: number }>);

    return Object.entries(grouped)
      .map(([date, values]) => ({
        date: new Date(date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
        contatti: values.contatti,
        notizie: values.notizie,
      }))
      .sort((a, b) => {
        const [dayA, monthA] = a.date.split('/').map(Number);
        const [dayB, monthB] = b.date.split('/').map(Number);
        return monthA - monthB || dayA - dayB;
      })
      .slice(-7);
  }, [allData]);

  if (chartData.length === 0) {
    return (
      <div className="bg-card rounded-3xl border border-border p-6">
        <h3 className="text-sm font-bold tracking-tight mb-4">Focus Acquisizione</h3>
        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
          Nessun dato disponibile
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-3xl border border-border p-6">
      <h3 className="text-sm font-bold tracking-tight mb-1">Focus Acquisizione</h3>
      <p className="text-[10px] text-muted-foreground tracking-wider uppercase mb-4">Ultimi 7 giorni</p>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={2} barCategoryGap="20%">
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              width={30}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '16px',
                boxShadow: 'none',
                fontSize: '12px',
              }}
              cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
            />
            <Bar dataKey="contatti" name="Contatti" fill="hsl(var(--foreground))" radius={[6, 6, 0, 0]} />
            <Bar dataKey="notizie" name="Notizie" fill="hsl(var(--muted-foreground) / 0.3)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-foreground" />
          <span className="text-xs text-muted-foreground">Contatti</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
          <span className="text-xs text-muted-foreground">Notizie</span>
        </div>
      </div>
    </div>
  );
};

export default AcquisitionChart;
