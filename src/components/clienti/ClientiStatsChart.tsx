import { memo, useMemo, useState } from 'react';
import { Cliente } from '@/types';
import { ChevronRight } from 'lucide-react';
import ClientiFunnelChartModal from './ClientiFunnelChartModal';

interface ClientiStatsChartProps {
  clienti: Cliente[];
}

const CLIENTE_COLUMNS = [
  { key: 'new', label: 'Nuovo', color: '#e5e5e5' },
  { key: 'contacted', label: 'Contattato', color: '#fbbf24' },
  { key: 'qualified', label: 'Qualificato', color: '#60a5fa' },
  { key: 'proposal', label: 'Proposta', color: '#a78bfa' },
  { key: 'negotiation', label: 'Trattativa', color: '#f97316' },
  { key: 'closed_won', label: 'Chiuso ✓', color: '#22c55e' },
  { key: 'closed_lost', label: 'Perso', color: '#1a1a1a' },
];

const ClientiStatsChart = memo(({ clienti }: ClientiStatsChartProps) => {
  const [funnelOpen, setFunnelOpen] = useState(false);

  const { total, bars } = useMemo(() => {
    const counts = CLIENTE_COLUMNS.map(col => {
      const count = clienti.filter(c => c.status === col.key).length;
      return { ...col, count };
    });
    const total = counts.reduce((sum, c) => sum + c.count, 0);
    return { total, bars: counts };
  }, [clienti]);

  if (total === 0) return null;

  return (
    <>
      <div 
        onClick={() => setFunnelOpen(true)}
        className="bg-card rounded-xl p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-medium tracking-wide uppercase text-muted-foreground">
            Pipeline Clienti
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
                className="transition-all"
                style={{ 
                  width: `${(count / total) * 100}%`,
                  backgroundColor: color 
                }}
              />
            )
          )}
        </div>

        {/* Legend - only show statuses with items */}
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {bars.filter(b => b.count > 0).map(({ key, label, color, count }) => (
            <div key={key} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-[9px] text-muted-foreground">{label}</span>
              <span className="text-[9px] font-medium">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <ClientiFunnelChartModal
        open={funnelOpen}
        onOpenChange={setFunnelOpen}
        clienti={clienti}
      />
    </>
  );
});

ClientiStatsChart.displayName = 'ClientiStatsChart';

export default ClientiStatsChart;
