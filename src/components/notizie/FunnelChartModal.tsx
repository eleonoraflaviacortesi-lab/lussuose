import { memo, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { NotiziaStatus } from '@/hooks/useNotizie';
import { ArrowDown } from 'lucide-react';

interface FunnelChartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notizieByStatus: Record<NotiziaStatus, { length: number }>;
}

const funnelSteps: { key: NotiziaStatus; label: string; color: string }[] = [
  { key: 'new', label: 'New', color: 'bg-yellow-200 text-yellow-900' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-yellow-400 text-yellow-950' },
  { key: 'done', label: 'Done', color: 'bg-orange-400 text-orange-950' },
  { key: 'taken', label: 'Taken', color: 'bg-green-300 text-green-900' },
  { key: 'sold', label: 'Sold', color: 'bg-zinc-600 text-white' },
];

const FunnelChartModal = memo(({ open, onOpenChange, notizieByStatus }: FunnelChartModalProps) => {
  const funnelData = useMemo(() => {
    const steps = funnelSteps.map(s => ({
      ...s,
      count: notizieByStatus[s.key]?.length || 0,
    }));

    // Calculate cumulative totals for funnel (each step includes items that progressed further)
    const cumulativeCounts = steps.map((step, i) => {
      // Sum this step + all steps after it (items that passed through this stage)
      const cumulativeCount = steps.slice(i).reduce((sum, s) => sum + s.count, 0);
      return { ...step, cumulativeCount };
    });

    const maxCount = Math.max(cumulativeCounts[0]?.cumulativeCount || 1, 1);

    return cumulativeCounts.map((step, i) => {
      const prevCount = i === 0 ? step.cumulativeCount : cumulativeCounts[i - 1].cumulativeCount;
      const conversionRate = prevCount > 0 ? Math.round((step.cumulativeCount / prevCount) * 100) : 0;
      const widthPercent = Math.max((step.cumulativeCount / maxCount) * 100, 15);
      
      return {
        ...step,
        conversionRate,
        widthPercent,
        isFirst: i === 0,
      };
    });
  }, [notizieByStatus]);

  const totalNew = notizieByStatus.new?.length || 0;
  const totalSold = notizieByStatus.sold?.length || 0;
  const overallConversion = totalNew > 0 ? Math.round((totalSold / totalNew) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-white/95 backdrop-blur-xl rounded-3xl border-0 shadow-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-center">
            Funnel Conversione
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1 mt-4">
          {funnelData.map((step, i) => (
            <div key={step.key} className="flex flex-col items-center">
              {/* Funnel bar */}
              <div
                className={`${step.color} rounded-lg py-2.5 px-4 flex items-center justify-between transition-all duration-300`}
                style={{ width: `${step.widthPercent}%` }}
              >
                <span className="text-xs font-semibold">{step.label}</span>
                <span className="text-sm font-bold">{step.cumulativeCount}</span>
              </div>

              {/* Conversion arrow */}
              {i < funnelData.length - 1 && (
                <div className="flex items-center gap-1 py-1 text-muted-foreground">
                  <ArrowDown className="w-3 h-3" />
                  <span className="text-[10px] font-medium">
                    {funnelData[i + 1].conversionRate}%
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Overall conversion summary */}
        <div className="mt-6 pt-4 border-t border-border/50 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Conversione totale
          </p>
          <p className="text-3xl font-bold text-foreground">
            {overallConversion}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {totalNew} New → {totalSold} Sold
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
});

FunnelChartModal.displayName = 'FunnelChartModal';

export default FunnelChartModal;
