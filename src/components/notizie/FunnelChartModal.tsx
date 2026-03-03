import { memo, useMemo, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useKanbanColumns } from '@/hooks/useKanbanColumns';
import { ArrowDown } from 'lucide-react';
import { isDarkColor } from '@/lib/utils';

interface FunnelChartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notizieByStatus: Record<string, { length: number }>;
}


const FunnelChartModal = memo(({ open, onOpenChange, notizieByStatus }: FunnelChartModalProps) => {
  const [animated, setAnimated] = useState(false);
  const { columns } = useKanbanColumns();

  // Trigger animation after modal opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setAnimated(true), 50);
      return () => clearTimeout(timer);
    } else {
      setAnimated(false);
    }
  }, [open]);

  const funnelData = useMemo(() => {
    const steps = columns.map(col => ({
      key: col.key,
      label: col.label,
      color: col.color,
      count: notizieByStatus[col.key]?.length || 0,
    }));

    // Calculate cumulative totals for funnel
    const cumulativeCounts = steps.map((step, i) => {
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
        textColor: isDarkColor(step.color) ? 'text-white' : 'text-black',
      };
    });
  }, [notizieByStatus, columns]);

  const firstColumn = columns[0];
  const lastColumn = columns[columns.length - 1];
  const totalFirst = firstColumn ? (notizieByStatus[firstColumn.key]?.length || 0) : 0;
  const totalLast = lastColumn ? (notizieByStatus[lastColumn.key]?.length || 0) : 0;
  const overallConversion = totalFirst > 0 ? Math.round((totalLast / totalFirst) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-card rounded-3xl border border-border p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-center">
            Funnel Conversione
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1 mt-4">
          {funnelData.map((step, i) => (
            <div 
              key={step.key} 
              className="flex flex-col items-center"
              style={{ 
                opacity: animated ? 1 : 0,
                transform: animated ? 'translateY(0)' : 'translateY(10px)',
                transition: `opacity 0.3s ease-out ${i * 0.1}s, transform 0.3s ease-out ${i * 0.1}s`
              }}
            >
              {/* Funnel bar */}
              <div
                className={`${step.textColor} rounded-lg py-2.5 px-4 flex items-center justify-center gap-3 overflow-hidden`}
                style={{ 
                  backgroundColor: step.color,
                  width: animated ? `${step.widthPercent}%` : '15%',
                  minWidth: '100px',
                  transition: `width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.1 + 0.1}s`
                }}
              >
                <span className="text-xs font-semibold whitespace-nowrap">{step.label}</span>
                <span 
                  className="text-sm font-bold tabular-nums"
                  style={{
                    opacity: animated ? 1 : 0,
                    transition: `opacity 0.3s ease-out ${i * 0.1 + 0.4}s`
                  }}
                >
                  {step.cumulativeCount}
                </span>
              </div>

              {/* Conversion arrow */}
              {i < funnelData.length - 1 && (
                <div 
                  className="flex items-center gap-1 py-1 text-muted-foreground"
                  style={{
                    opacity: animated ? 1 : 0,
                    transition: `opacity 0.3s ease-out ${i * 0.1 + 0.3}s`
                  }}
                >
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
        <div 
          className="mt-6 pt-4 border-t border-border/50 text-center"
          style={{
            opacity: animated ? 1 : 0,
            transform: animated ? 'scale(1)' : 'scale(0.9)',
            transition: 'opacity 0.4s ease-out 0.6s, transform 0.4s ease-out 0.6s'
          }}
        >
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Conversione totale
          </p>
          <p className="text-3xl font-bold text-foreground">
            {overallConversion}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {totalFirst} {firstColumn?.label || 'Start'} → {totalLast} {lastColumn?.label || 'End'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
});

FunnelChartModal.displayName = 'FunnelChartModal';

export default FunnelChartModal;
