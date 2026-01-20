import { useAuth } from '@/hooks/useAuth';
import { useKPIs } from '@/hooks/useKPIs';
import { useDailyData } from '@/hooks/useDailyData';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Users, Zap, Award, Gift, Phone } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const PersonalDashboard = () => {
  const { profile } = useAuth();
  const { kpis, isLoading } = useKPIs('year');
  const { myData } = useDailyData();

  const annualTarget = 25;
  const currentSales = kpis?.vendite?.value || 0;
  const completionPercent = Math.min(100, Math.round((currentSales / annualTarget) * 100));
  const fatturato = kpis?.fatturato?.value || 0;
  const giornateTacking = myData?.length || 0;

  // Prepare chart data
  const chartData = myData?.slice(0, 7).reverse().map(entry => ({
    date: entry.date,
    notizie: entry.notizie_reali,
  })) || [];

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
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-foreground border-t-transparent"></div>
      </div>
    );
  }

  const contatti = kpis?.contatti?.value || 0;
  const notizie = kpis?.notizie?.value || 0;
  const chiusure = kpis?.vendite?.value || 0;
  const conversioni = contatti > 0 ? Math.round((chiusure / contatti) * 100) : 0;

  // Team incarichi
  const incarichiTeam = kpis?.incarichi?.value || 0;
  const incarichiTarget = 12;
  const incarichiPercent = Math.min(100, Math.round((incarichiTeam / incarichiTarget) * 100));

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

      {/* Trend Chart */}
      {chartData.length > 0 && (
        <div className="bg-card rounded-3xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground">
              TREND NOTIZIE PERSONALI
            </h3>
            <div className="w-2 h-2 rounded-full bg-foreground" />
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Bar 
                  dataKey="notizie" 
                  fill="hsl(var(--foreground))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalDashboard;
