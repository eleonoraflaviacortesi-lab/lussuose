import { memo, useMemo, useState } from 'react';
import { NotiziaStatus } from '@/hooks/useNotizie';
import { useKanbanColumns } from '@/hooks/useKanbanColumns';
import { ChevronRight } from 'lucide-react';
import FunnelChartModal from './FunnelChartModal';

interface NotizieStatsChartProps {
  notizieByStatus: Record<string, { length: number }>;
}

const NotizieStatsChart = memo(({ notizieByStatus }: NotizieStatsChartProps) => {
  const [funnelOpen, setFunnelOpen] = useState(false);
  const { columns } = useKanbanColumns();

  const { total, bars } = useMemo(() => {
    const counts = columns.map(col => ({
      key: col.key,
      label: col.label,
      color: col.color,
      count: notizieByStatus[col.key]?.length || 0,
    }));
    const total = counts.reduce((sum, c) => sum + c.count, 0);
    return { total, bars: counts };
  }, [notizieByStatus, columns]);

  if (total === 0) return null;

  return (
    <>
      <div 
        onClick={() => setFunnelOpen(true)}
        className="bg-card rounded-xl p-2.5 lg:p-2 shadow-sm cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
      >
        <div className="flex items-center justify-between mb-1.5 lg:mb-1">
          <span className="text-[10px] font-medium tracking-wide uppercase text-muted-foreground">
            Distribuzione
          </span>
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold">{total} totali</span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>
        
        {/* Stacked bar */}
        <div className="flex h-2.5 lg:h-2 rounded-full overflow-hidden mb-1.5 lg:mb-1">
          {bars.map(({ key, color, count }) => 
            count > 0 && (
              <div
                key={key}
                className="transition-all"
                style={{ 
                  width: `${(count / total) * 100}%`,
                  backgroundColor: color 
                }}
              />
            )
          )}
        </div>

        {/* Legend - hidden on desktop to save space, visible on mobile */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 lg:hidden">
          {bars.filter(b => b.count > 0).map(({ key, label, color, count }) => (
            <div key={key} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
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
