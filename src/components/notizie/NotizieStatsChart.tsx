import { memo, useMemo, useState } from 'react';
import { NotiziaStatus } from '@/hooks/useNotizie';
import { ChevronRight } from 'lucide-react';
import FunnelChartModal from './FunnelChartModal';

interface NotizieStatsChartProps {
  notizieByStatus: Record<NotiziaStatus, { length: number }>;
}

const statusConfig: { key: NotiziaStatus; label: string; color: string }[] = [
  { key: 'new', label: 'New', color: 'bg-yellow-200' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-yellow-400' },
  { key: 'done', label: 'Done', color: 'bg-orange-400' },
  { key: 'on_shot', label: 'On Shot', color: 'bg-red-400' },
  { key: 'taken', label: 'Taken', color: 'bg-green-300' },
  { key: 'no', label: 'No', color: 'bg-zinc-800' },
  { key: 'sold', label: 'Sold', color: 'bg-zinc-500' },
];

const NotizieStatsChart = memo(({ notizieByStatus }: NotizieStatsChartProps) => {
  const [funnelOpen, setFunnelOpen] = useState(false);

  const { total, bars } = useMemo(() => {
    const counts = statusConfig.map(s => ({
      ...s,
      count: notizieByStatus[s.key]?.length || 0,
    }));
    const total = counts.reduce((sum, c) => sum + c.count, 0);
    return { total, bars: counts };
  }, [notizieByStatus]);

  if (total === 0) return null;

  return (
    <>
      <div 
        onClick={() => setFunnelOpen(true)}
        className="bg-card rounded-xl p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-medium tracking-wide uppercase text-muted-foreground">
            Distribuzione
          </span>
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold">{total} totali</span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>
        
        {/* Stacked bar */}
        <div className="flex h-3 rounded-full overflow-hidden mb-2">
          {bars.map(({ key, color, count }) => 
            count > 0 && (
              <div
                key={key}
                className={`${color} transition-all`}
                style={{ width: `${(count / total) * 100}%` }}
              />
            )
          )}
        </div>

        {/* Legend - only show statuses with items */}
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {bars.filter(b => b.count > 0).map(({ key, label, color, count }) => (
            <div key={key} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-sm ${color}`} />
              <span className="text-[9px] text-muted-foreground">{label}</span>
              <span className="text-[9px] font-medium">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <FunnelChartModal
        open={funnelOpen}
        onOpenChange={setFunnelOpen}
        notizieByStatus={notizieByStatus}
      />
    </>
  );
});

NotizieStatsChart.displayName = 'NotizieStatsChart';

export default NotizieStatsChart;
