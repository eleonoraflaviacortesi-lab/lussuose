import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useKPIs } from '@/hooks/useKPIs';
import { useDailyData } from '@/hooks/useDailyData';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Users, Zap, Award, Gift, FileText, Euro } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area } from 'recharts';
import IncarchiWidget from './IncarchiWidget';

type Period = 'week' | 'month' | 'year';

const PersonalDashboard = () => {
  const [chartPeriod, setChartPeriod] = useState<Period>('month');
  const { profile } = useAuth();
  const { kpis, isLoading } = useKPIs('year');
  const { myData } = useDailyData();

  const annualTarget = 25;
  const currentSales = kpis?.vendite?.value || 0;
  const completionPercent = Math.min(100, Math.round((currentSales / annualTarget) * 100));
  const fatturato = kpis?.fatturato?.value || 0;
  const giornateTacking = myData?.length || 0;

  // Prepare performance chart data based on selected period
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
      .filter(d => new Date(d.date) >= startDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return filteredData.map(d => ({
      date: new Date(d.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
      incarichi: d.incarichi_vendita || 0,
      vendite: d.vendite_numero || 0,
      fatturato: Number(d.vendite_valore) || 0,
      notizie: d.notizie_reali || 0,
    }));
  }, [myData, chartPeriod]);

  // Calculate period totals for the charts
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatCompactCurrency = (value: number) => {
    if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`;
    return `€${value}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-foreground border-t-transparent"></div>
      </div>
    );
  }

  const contatti = kpis?.contatti?.value || 0;
  const notizie = kpis?.notizie?.value || 0;
  const chiusure = kpis?.vendite?.value || 0;
  const conversioni = contatti > 0 ? Math.round((chiusure / contatti) * 100) : 0;

  const incarichiTeam = kpis?.incarichi?.value || 0;
  const incarichiTarget = 12;
  const incarichiPercent = Math.min(100, Math.round((incarichiTeam / incarichiTarget) * 100));

  const PeriodToggle = () => (
    <div className="inline-flex items-center gap-1 bg-muted rounded-full p-1">
      {(['week', 'month', 'year'] as const).map((p) => (
        <button
          key={p}
          onClick={() => setChartPeriod(p)}
          className={`px-4 py-1.5 text-[10px] font-medium tracking-[0.1em] uppercase rounded-full transition-all duration-150 ${
            chartPeriod === p 
              ? 'bg-foreground text-background' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {p === 'week' ? 'SETT' : p === 'month' ? 'MESE' : 'ANNO'}
        </button>
      ))}
    </div>
  );

  return (
    <div className="px-6 pb-8 space-y-6 animate-fade-in">
      {/* Status Annuale Personale */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-foreground" />
          <h2 className="text-xs font-medium tracking-[0.3em] uppercase text-foreground">
            STATUS ANNUALE PERSONALE
          </h2>
        </div>

        {/* Big Number */}
        <div className="space-y-1">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-8xl font-light text-foreground tracking-tight">
              {currentSales}
            </span>
            <span className="text-3xl font-light text-muted-foreground">/ {annualTarget}</span>
          </div>
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-foreground">
            VENDITE
          </p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium tracking-[0.2em] uppercase text-muted-foreground">
              AVANZAMENTO TARGET
            </span>
            <span className="font-semibold text-foreground">{completionPercent}%</span>
          </div>
          <Progress value={completionPercent} className="h-1 bg-muted" />
        </div>
      </div>

      {/* Volume Generato & Giornate */}
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 dark-card">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-2">
            VOLUME GENERATO
          </p>
          <p className="text-4xl font-light text-white mb-1">
            {formatCurrency(fatturato)}
          </p>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground">
            FATTURATO AGENZIA
          </p>
        </div>
        <div className="col-span-2 bg-card rounded-2xl shadow-lg p-5">
          <p className="text-xs font-medium tracking-[0.15em] uppercase text-foreground mb-2">
            GIORNATE TRACKING
          </p>
          <p className="text-4xl font-light text-foreground">{giornateTacking}</p>
          <p className="text-xs text-muted-foreground mt-1">DATI ACQUISITI</p>
        </div>
      </div>

      {/* Incarichi Widget */}
      <IncarchiWidget weeklyIdeal={3} />

      {/* Performance Charts Section */}
      <div className="bg-card rounded-3xl shadow-lg p-6 space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-foreground" />
            <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-foreground">
              PERFORMANCE AGENTE
            </h3>
          </div>
          <PeriodToggle />
        </div>

        {/* Chart Grid */}
        <div key={chartPeriod} className="space-y-6 animate-fade-in">
          {/* Incarichi Chart */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
                  INCARICHI
                </span>
              </div>
              <span className="text-lg font-semibold text-foreground">{periodTotals.incarichi}</span>
            </div>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceChartData}>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 9 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '11px'
                    }}
                  />
                  <Bar 
                    dataKey="incarichi" 
                    fill="hsl(var(--foreground))" 
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Vendite Chart */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
                  VENDITE
                </span>
              </div>
              <span className="text-lg font-semibold text-foreground">{periodTotals.vendite}</span>
            </div>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceChartData}>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 9 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '11px'
                    }}
                  />
                  <Bar 
                    dataKey="vendite" 
                    fill="hsl(var(--foreground))" 
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fatturato Chart */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Euro className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
                  FATTURATO
                </span>
              </div>
              <span className="text-lg font-semibold text-foreground whitespace-nowrap">
                {formatCompactCurrency(periodTotals.fatturato)}
              </span>
            </div>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceChartData}>
                  <defs>
                    <linearGradient id="fatturatoGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 9 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis hide />
                  <Tooltip 
                    formatter={(value: number) => [formatCompactCurrency(value), 'Fatturato']}
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '11px'
                    }}
                  />
                  <Area 
                    type="monotone"
                    dataKey="fatturato" 
                    stroke="hsl(var(--foreground))" 
                    strokeWidth={2}
                    fill="url(#fatturatoGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl shadow-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">
              CONTATTI REALI
            </p>
            <Users className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-light text-foreground">{contatti}</p>
        </div>
        <div className="bg-card rounded-2xl shadow-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">
              NOTIZIE ACQUISITE
            </p>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-light text-foreground">{notizie}</p>
        </div>
        <div className="bg-card rounded-2xl shadow-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">
              CHIUSURE TOTALI
            </p>
            <Award className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-light text-foreground">{chiusure}</p>
        </div>
        <div className="bg-card rounded-2xl shadow-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">
              CONVERSIONI
            </p>
            <Zap className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-light text-foreground">{conversioni}%</p>
        </div>
      </div>

      {/* Incarichi Team Card */}
      <div className="bg-card rounded-3xl shadow-lg p-6 relative overflow-hidden">
        <div className="absolute right-4 top-4 opacity-10">
          <Gift className="w-32 h-32 text-foreground" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Gift className="w-5 h-5 text-foreground" />
          </div>
          <h3 className="text-sm font-bold tracking-[0.2em] uppercase mb-1">
            INCARICHI TOTALI TEAM
          </h3>
          <p className="text-xs text-muted-foreground mb-6">
            RISULTATO COLLETTIVO DEL MESE
          </p>
          
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-6xl font-bold text-foreground">{incarichiTeam}</span>
            <span className="text-2xl font-light text-muted-foreground">/ {incarichiTarget}</span>
          </div>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4">
            INCARICHI ACQUISITI DAL TEAM
          </p>

          <Progress value={incarichiPercent} className="h-1 bg-muted mb-3" />
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium tracking-wider uppercase">PROGRESSO UFFICIO</span>
            <span className="font-semibold text-foreground">{incarichiPercent}%</span>
          </div>

          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-muted">
            <span>🌷</span>
            <span>💎</span>
            <span>🖤</span>
            <span className="text-xs text-muted-foreground tracking-wider uppercase ml-2">
              INSIEME VERSO IL TRAGUARDO
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalDashboard;