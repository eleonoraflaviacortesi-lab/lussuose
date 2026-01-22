import { useState, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useKPIs } from '@/hooks/useKPIs';
import { useDailyData } from '@/hooks/useDailyData';
import { Progress } from '@/components/ui/progress';
import { Users, Zap, Award, Gift, TrendingUp } from 'lucide-react';
import IncarchiWidget from './IncarchiWidget';
import DailyQuote from './DailyQuote';
import AcquisitionChart from './AcquisitionChart';
import { celebrateGoal } from '@/lib/confetti';

const PerformanceCharts = lazy(() => import('./PerformanceCharts'));
const KPIDetailModal = lazy(() => import('./KPIDetailModal'));

type Period = 'week' | 'month' | 'year';
type KPIKey = 'contatti' | 'notizie' | 'chiusure' | 'conversioni';

const PersonalDashboard = () => {
  const [chartPeriod, setChartPeriod] = useState<Period>('month');
  const [selectedKPI, setSelectedKPI] = useState<KPIKey | null>(null);
  const { profile } = useAuth();
  const { kpis, isLoading } = useKPIs('year');
  const { myData } = useDailyData();

  const annualTarget = 25;
  const currentSales = kpis?.vendite?.value || 0;
  const completionPercent = Math.min(100, Math.round((currentSales / annualTarget) * 100));
  const fatturato = kpis?.fatturato?.value || 0;
  
  // Track if goal was just reached to celebrate
  const previousSalesRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (previousSalesRef.current !== null && previousSalesRef.current < annualTarget && currentSales >= annualTarget) {
      // Goal just reached!
      celebrateGoal();
    }
    previousSalesRef.current = currentSales;
  }, [currentSales, annualTarget]);
  
  // Calculate fatturato a credito from myData
  const fatturatoCredito = useMemo(() => {
    if (!myData) return 0;
    return myData.reduce((sum, d) => sum + (Number(d.fatturato_a_credito) || 0), 0);
  }, [myData]);

  // NOTE: performance charts (Recharts) are lazy-loaded in PerformanceCharts to speed up first paint.

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

  return (
    <div className="px-4 pb-6 space-y-4 animate-fade-in">
      {/* Daily Quote */}
      <DailyQuote />

      {/* Status Annuale Personale */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
          <h2 className="text-[10px] font-medium tracking-[0.3em] uppercase text-foreground">
            STATUS ANNUALE
          </h2>
        </div>

        {/* Big Number */}
        <div className="flex items-baseline justify-center gap-1.5">
          <span className="text-6xl font-light text-foreground tracking-tight">
            {currentSales}
          </span>
          <span className="text-2xl font-light text-muted-foreground">/ {annualTarget}</span>
          <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground ml-1">
            VENDITE
          </span>
        </div>

        {/* Progress Bar */}
        <div className="max-w-xs mx-auto">
          <Progress value={completionPercent} className="h-1 bg-muted" />
          <p className="text-[10px] text-muted-foreground mt-1">{completionPercent}% target</p>
        </div>
      </div>

      {/* Incarichi Widget */}
      <IncarchiWidget />

      {/* Volume Generato & Volume a Credito */}
      <div className="grid grid-cols-2 gap-3">
        <div className="dark-card py-3 px-4">
          <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground mb-1">
            VOLUME GENERATO
          </p>
          <p className="text-xl font-bold text-white whitespace-nowrap">
            {formatCompactCurrency(fatturato)}
          </p>
        </div>
        <div className="dark-card py-3 px-4">
          <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground mb-1">
            VOLUME A CREDITO
          </p>
          <p className="text-xl font-bold text-white whitespace-nowrap">
            {formatCompactCurrency(fatturatoCredito)}
          </p>
        </div>
      </div>

      {/* Focus Acquisizione Chart */}
      <AcquisitionChart />

      <Suspense
        fallback={
          <div className="bg-card rounded-2xl shadow-lg p-4">
            <div className="h-24 rounded-xl bg-muted animate-pulse" />
          </div>
        }
      >
        <PerformanceCharts
          myData={myData}
          chartPeriod={chartPeriod}
          onChartPeriodChange={setChartPeriod}
          formatCompactCurrency={formatCompactCurrency}
        />
      </Suspense>

      {/* Stats Grid - Clickable Cards */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => setSelectedKPI('contatti')}
          className="bg-card rounded-xl shadow p-3 text-center transition-transform active:scale-[0.97]"
        >
          <Users className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />
          <p className="text-xl font-light text-foreground">{contatti}</p>
          <p className="text-[8px] font-medium tracking-[0.1em] uppercase text-muted-foreground">CONTATTI</p>
        </button>
        <button
          onClick={() => setSelectedKPI('notizie')}
          className="bg-card rounded-xl shadow p-3 text-center transition-transform active:scale-[0.97]"
        >
          <TrendingUp className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />
          <p className="text-xl font-light text-foreground">{notizie}</p>
          <p className="text-[8px] font-medium tracking-[0.1em] uppercase text-muted-foreground">NOTIZIE</p>
        </button>
        <button
          onClick={() => setSelectedKPI('chiusure')}
          className="bg-card rounded-xl shadow p-3 text-center transition-transform active:scale-[0.97]"
        >
          <Award className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />
          <p className="text-xl font-light text-foreground">{chiusure}</p>
          <p className="text-[8px] font-medium tracking-[0.1em] uppercase text-muted-foreground">CHIUSURE</p>
        </button>
        <button
          onClick={() => setSelectedKPI('conversioni')}
          className="bg-card rounded-xl shadow p-3 text-center transition-transform active:scale-[0.97]"
        >
          <Zap className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />
          <p className="text-xl font-light text-foreground">{conversioni}%</p>
          <p className="text-[8px] font-medium tracking-[0.1em] uppercase text-muted-foreground">CONV.</p>
        </button>
      </div>

      <Suspense fallback={null}>
        <KPIDetailModal
          open={!!selectedKPI}
          onOpenChange={(open) => !open && setSelectedKPI(null)}
          kpiKey={selectedKPI}
          title={
            selectedKPI === 'contatti' ? 'CONTATTI REALI' :
            selectedKPI === 'notizie' ? 'NOTIZIE ACQUISITE' :
            selectedKPI === 'chiusure' ? 'CHIUSURE TOTALI' :
            'CONVERSIONI'
          }
          value={
            selectedKPI === 'contatti' ? contatti :
            selectedKPI === 'notizie' ? notizie :
            selectedKPI === 'chiusure' ? chiusure :
            conversioni
          }
          icon={
            selectedKPI === 'contatti' ? Users :
            selectedKPI === 'notizie' ? TrendingUp :
            selectedKPI === 'chiusure' ? Award :
            Zap
          }
        />
      </Suspense>

      {/* Incarichi Team Card */}
      <div className="bg-card rounded-2xl shadow p-4 relative overflow-hidden">
        <div className="absolute right-2 top-2 opacity-5">
          <Gift className="w-20 h-20 text-foreground" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-4 h-4 text-foreground" />
            <h3 className="text-[10px] font-bold tracking-[0.15em] uppercase">
              INCARICHI TEAM
            </h3>
          </div>
          
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="text-4xl font-bold text-foreground">{incarichiTeam}</span>
            <span className="text-lg font-light text-muted-foreground">/ {incarichiTarget}</span>
          </div>

          <Progress value={incarichiPercent} className="h-1 bg-muted mb-2" />
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Progresso ufficio</span>
            <span className="font-semibold text-foreground">{incarichiPercent}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalDashboard;