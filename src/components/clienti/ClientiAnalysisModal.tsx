import { useMemo } from 'react';
import { Cliente } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { PORTALE_COLORS } from '@/lib/colorMaps';

interface ClientiAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienti: Cliente[];
}

const DEFAULT_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#64748b',
];

export function ClientiAnalysisModal({ open, onOpenChange, clienti }: ClientiAnalysisModalProps) {
  const portaleData = useMemo(() => {
    const counts: Record<string, number> = {};
    clienti.forEach(c => {
      const key = c.portale || 'Non specificato';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        color: PORTALE_COLORS[name] || DEFAULT_COLORS[Object.keys(counts).indexOf(name) % DEFAULT_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [clienti]);

  const total = clienti.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">📊 Analisi Provenienza Richieste</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pie Chart */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
              Distribuzione per Portale
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={portaleData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                    style={{ fontSize: '10px' }}
                  >
                    {portaleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value} richieste (${((value / total) * 100).toFixed(1)}%)`, 'Totale']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
              Richieste per Portale
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={portaleData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip formatter={(value: number) => [`${value} richieste`, 'Totale']} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {portaleData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legend Table */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
              Dettaglio
            </h3>
            <div className="space-y-1.5">
              {portaleData.map(({ name, value, color }) => (
                <div key={name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
                    <span>{name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{value}</span>
                    <span className="text-muted-foreground text-xs">
                      ({((value / total) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
              <div className="border-t pt-1.5 flex items-center justify-between text-sm font-bold">
                <span>Totale</span>
                <span>{total}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
