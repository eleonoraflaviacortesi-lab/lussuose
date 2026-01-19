import { useUser } from '@/context/UserContext';
import { Target, TrendingUp, Users, Phone, Calendar, Home } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

const MyNumbers = () => {
  const { currentUser } = useUser();

  const weeklyData = [
    { day: '18/12', contatti: 5, notizie: 0 },
    { day: '12/01', contatti: 3, notizie: 1 },
    { day: '13/01', contatti: 8, notizie: 2 },
    { day: '14/01', contatti: 10, notizie: 3 },
  ];

  const pipelineData = [
    { day: '18/12', appVendita: 3, vendite: 1 },
    { day: '12/01', appVendita: 0, vendite: 0 },
    { day: '13/01', appVendita: 1, vendite: 0 },
    { day: '14/01', appVendita: 1, vendite: 0 },
  ];

  const stats = [
    { label: 'Contatti Reali Totali', value: 44, target: 100, icon: Phone },
    { label: 'Notizie Reali Totali', value: 16, target: 9, icon: TrendingUp },
    { label: 'Clienti Gestiti', value: 10, icon: Users },
    { label: 'Vendite Concluse', value: 1, icon: Home },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Obiettivo Annuale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Obiettivo Annuale</p>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="font-serif text-5xl font-bold text-foreground">1</span>
            <span className="text-2xl text-muted-foreground">/32</span>
          </div>
          <p className="text-sm font-medium text-accent uppercase tracking-wider">Vendite</p>
          <p className="text-xs text-muted-foreground mt-2">Hai completato il 3.1% del tuo piano vendite</p>
        </div>

        <div className="bg-accent/5 border border-accent/20 rounded-xl p-6 lg:col-span-2">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg bg-success/10 text-success">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Performance Coach</p>
              <p className="text-sm text-muted-foreground mt-1">
                "🌟 Sei sulla buona strada. Mantieni costante la ricerca di notizie e i contatti giornalieri per alimentare la tua pipeline."
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-card rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Fatturato Agenzia Generato</p>
              <p className="font-serif text-2xl font-semibold text-foreground">€ 40.000</p>
              <p className="text-xs text-muted-foreground">Target: € 1.000.000</p>
            </div>
            <div className="bg-card rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Tasso Conversione Appuntamenti</p>
              <p className="font-serif text-2xl font-semibold text-foreground">25.0%</p>
              <p className="text-xs text-muted-foreground">Appuntamenti → Vendite</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-accent" />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className="font-serif text-3xl font-semibold text-foreground">{stat.value}</p>
              {stat.target && (
                <p className="text-xs text-muted-foreground mt-1">Target Ideale: {stat.target}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-serif text-lg font-semibold text-foreground mb-4">
            Focus Acquisizione (Ultimi 7 gg)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="contatti" fill="hsl(var(--primary))" name="Contatti Reali" radius={[4, 4, 0, 0]} />
                <Bar dataKey="notizie" fill="hsl(var(--accent))" name="Notizie Nuove Reali" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-6 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-primary" />
              <span className="text-muted-foreground">Contatti Reali</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-accent" />
              <span className="text-muted-foreground">Notizie Nuove Reali</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-serif text-lg font-semibold text-foreground mb-4">
            Pipeline Vendita (Ultimi 7 gg)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="appVendita"
                  stroke="hsl(var(--accent))"
                  fill="hsl(var(--accent) / 0.2)"
                  name="App. Vendita"
                />
                <Area
                  type="monotone"
                  dataKey="vendite"
                  stroke="hsl(var(--success))"
                  fill="hsl(var(--success) / 0.2)"
                  name="Vendite (N°)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-6 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-accent" />
              <span className="text-muted-foreground">App. Vendita</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-success" />
              <span className="text-muted-foreground">Vendite (N°)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Diario di Bordo */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-serif text-lg font-semibold text-foreground mb-4">Diario di Bordo</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Notizie</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Clienti</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">App. Vend.</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Vendite (N°)</th>
                <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Fatturato Agenzia</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="py-3 px-2 text-sm">14/01/2026</td>
                <td className="py-3 px-2 text-sm"><span className="text-success">10</span>/3</td>
                <td className="py-3 px-2 text-sm">10</td>
                <td className="py-3 px-2 text-sm">0</td>
                <td className="py-3 px-2 text-sm">-</td>
                <td className="py-3 px-2 text-sm text-right">-</td>
              </tr>
              <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="py-3 px-2 text-sm">13/01/2026</td>
                <td className="py-3 px-2 text-sm"><span className="text-destructive">0</span>/3</td>
                <td className="py-3 px-2 text-sm">0</td>
                <td className="py-3 px-2 text-sm">1</td>
                <td className="py-3 px-2 text-sm">-</td>
                <td className="py-3 px-2 text-sm text-right">-</td>
              </tr>
              <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="py-3 px-2 text-sm">12/01/2026</td>
                <td className="py-3 px-2 text-sm"><span className="text-destructive">1</span>/3</td>
                <td className="py-3 px-2 text-sm">0</td>
                <td className="py-3 px-2 text-sm">0</td>
                <td className="py-3 px-2 text-sm">-</td>
                <td className="py-3 px-2 text-sm text-right">-</td>
              </tr>
              <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="py-3 px-2 text-sm">18/12/2025</td>
                <td className="py-3 px-2 text-sm"><span className="text-success">5</span>/0</td>
                <td className="py-3 px-2 text-sm">0</td>
                <td className="py-3 px-2 text-sm">3</td>
                <td className="py-3 px-2 text-sm">1 🏠</td>
                <td className="py-3 px-2 text-sm text-right font-medium">€ 40.000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MyNumbers;
