import { useAuth } from '@/hooks/useAuth';
import { useKPIs } from '@/hooks/useKPIs';
import { useDailyData } from '@/hooks/useDailyData';
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
  const { profile } = useAuth();
  const { kpis, chartData, isLoading } = useKPIs('month');
  const { myData } = useDailyData();

  const annualTarget = 32;
  const currentSales = kpis?.vendite?.value || 0;
  const completionPercent = ((currentSales / annualTarget) * 100).toFixed(1);
  const conversionRate = kpis?.appuntamenti?.value 
    ? ((kpis.vendite?.value || 0) / kpis.appuntamenti.value * 100).toFixed(1) 
    : '0';

  const stats = [
    { label: 'Contatti Reali Totali', value: kpis?.contatti?.value || 0, target: 100, icon: Phone },
    { label: 'Notizie Reali Totali', value: kpis?.notizie?.value || 0, target: 9, icon: TrendingUp },
    { label: 'Clienti Gestiti', value: kpis?.clienti?.value || 0, icon: Users },
    { label: 'Vendite Concluse', value: kpis?.vendite?.value || 0, icon: Home },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 animate-fade-in">
      {/* Obiettivo Annuale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-card rounded-xl border border-border p-4 md:p-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Obiettivo Annuale</p>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="font-serif text-4xl md:text-5xl font-bold text-foreground">{currentSales}</span>
            <span className="text-xl md:text-2xl text-muted-foreground">/{annualTarget}</span>
          </div>
          <p className="text-sm font-medium text-accent uppercase tracking-wider">Vendite</p>
          <p className="text-xs text-muted-foreground mt-2">Hai completato il {completionPercent}% del tuo piano vendite</p>
        </div>

        <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 md:p-6 lg:col-span-2">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg bg-success/10 text-success">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Performance Coach</p>
              <p className="text-sm text-muted-foreground mt-1">
                "🌟 {currentSales > 0 ? 'Ottimo lavoro! Continua così.' : 'Sei sulla buona strada. Mantieni costante la ricerca di notizie e i contatti giornalieri per alimentare la tua pipeline.'}"
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:gap-4 mt-4">
            <div className="bg-card rounded-lg p-3 md:p-4">
              <p className="text-xs text-muted-foreground mb-1">Fatturato Generato</p>
              <p className="font-serif text-xl md:text-2xl font-semibold text-foreground">{formatCurrency(kpis?.fatturato?.value || 0)}</p>
              <p className="text-xs text-muted-foreground">Target: € 1.000.000</p>
            </div>
            <div className="bg-card rounded-lg p-3 md:p-4">
              <p className="text-xs text-muted-foreground mb-1">Tasso Conversione</p>
              <p className="font-serif text-xl md:text-2xl font-semibold text-foreground">{conversionRate}%</p>
              <p className="text-xs text-muted-foreground">Appuntamenti → Vendite</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-card rounded-xl border border-border p-4 md:p-5">
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <Icon className="w-4 h-4 text-accent" />
                <span className="text-xs text-muted-foreground line-clamp-1">{stat.label}</span>
              </div>
              <p className="font-serif text-2xl md:text-3xl font-semibold text-foreground">{stat.value}</p>
              {stat.target && (
                <p className="text-xs text-muted-foreground mt-1">Target: {stat.target}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-card rounded-xl border border-border p-4 md:p-6">
          <h3 className="font-serif text-base md:text-lg font-semibold text-foreground mb-4">
            Focus Acquisizione (Ultimi 7 gg)
          </h3>
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="contatti" fill="hsl(var(--primary))" name="Contatti" radius={[4, 4, 0, 0]} />
                <Bar dataKey="notizie" fill="hsl(var(--accent))" name="Notizie" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 md:gap-6 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-primary" />
              <span className="text-muted-foreground">Contatti</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-accent" />
              <span className="text-muted-foreground">Notizie</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 md:p-6">
          <h3 className="font-serif text-base md:text-lg font-semibold text-foreground mb-4">
            Pipeline Vendita (Ultimi 7 gg)
          </h3>
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
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
                  name="Vendite"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 md:gap-6 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-accent" />
              <span className="text-muted-foreground">App. Vendita</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-success" />
              <span className="text-muted-foreground">Vendite</span>
            </div>
          </div>
        </div>
      </div>

      {/* Diario di Bordo */}
      <div className="bg-card rounded-xl border border-border p-4 md:p-6">
        <h3 className="font-serif text-base md:text-lg font-semibold text-foreground mb-4">Diario di Bordo</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Notizie</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Clienti</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">App.</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Vendite</th>
                <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Fatturato</th>
              </tr>
            </thead>
            <tbody>
              {myData && myData.length > 0 ? (
                myData.slice(0, 5).map((entry) => (
                  <tr key={entry.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-2 text-sm">{new Date(entry.date).toLocaleDateString('it-IT')}</td>
                    <td className="py-3 px-2 text-sm">
                      <span className={entry.notizie_reali >= entry.notizie_ideali ? 'text-success' : 'text-destructive'}>
                        {entry.notizie_reali}
                      </span>
                      /{entry.notizie_ideali}
                    </td>
                    <td className="py-3 px-2 text-sm">{entry.clienti_gestiti}</td>
                    <td className="py-3 px-2 text-sm">{entry.appuntamenti_vendita}</td>
                    <td className="py-3 px-2 text-sm">{entry.vendite_numero > 0 ? `${entry.vendite_numero} 🏠` : '-'}</td>
                    <td className="py-3 px-2 text-sm text-right font-medium">
                      {entry.vendite_valore > 0 ? formatCurrency(Number(entry.vendite_valore)) : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    Nessun dato registrato. Inizia inserendo i tuoi dati giornalieri!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MyNumbers;
