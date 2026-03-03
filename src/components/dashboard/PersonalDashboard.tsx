import { useState, useMemo, useEffect, useRef, lazy, Suspense } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { useKPIs } from '@/hooks/useKPIs';
import { useDailyData } from '@/hooks/useDailyData';
import { useSedeTargets } from '@/hooks/useSedeTargets';
import { Progress } from '@/components/ui/progress';
import { Users, Zap, Award, Gift, TrendingUp, Plus, Check, Phone, FileText, CalendarCheck, Home, Handshake } from 'lucide-react';
import KPISummaryWidgets from './KPISummaryWidgets';
import { useNavigate } from 'react-router-dom';
import { useTodayReportStatus } from '@/hooks/useTodayReportStatus';
import IncarchiWidget from './IncarchiWidget';
import DailyQuote from './DailyQuote';
import AcquisitionChart from './AcquisitionChart';
import TodayRemindersWidget from './TodayRemindersWidget';
import WeeklyGoalsWidget from './WeeklyGoalsWidget';
import { triggerArcaneFog } from '@/lib/arcaneFog';
import { Notizia } from '@/hooks/useNotizie';

const PerformanceCharts = lazy(() => import('./PerformanceCharts'));
const KPIDetailModal = lazy(() => import('./KPIDetailModal'));

type Period = 'week' | 'month' | 'year';
type KPIKey = 'contatti' | 'notizie' | 'chiusure' | 'conversioni' | 'appuntamenti' | 'acquisizioni' | 'incarichi' | 'trattativeChiuse';

type PersonalDashboardProps = {
  onGoToCalendar?: () => void;
  onOpenNotizia?: (notizia: Notizia) => void;
};

const PersonalDashboard = ({ onGoToCalendar, onOpenNotizia }: PersonalDashboardProps) => {
  const [chartPeriod, setChartPeriod] = useState<Period>('month');
  const [selectedKPI, setSelectedKPI] = useState<KPIKey | null>(null);
  const { profile } = useAuth();
  const { kpis, isLoading } = useKPIs('year');
  const { myData, allData } = useDailyData();
  const { annualTargets, targets: sedeTargets } = useSedeTargets();
  const navigate = useNavigate();
  const { hasReportedToday } = useTodayReportStatus();

  // Annual target from sede targets (sum of all months)
  const annualTarget = annualTargets?.vendite_target || 48;
  const currentSales = kpis?.vendite?.value || 0;
  const completionPercent = Math.min(100, Math.round(currentSales / annualTarget * 100));
  const fatturato = kpis?.fatturato?.value || 0;

  // Track if goal was just reached to celebrate
  const previousSalesRef = useRef<number | null>(null);

  useEffect(() => {
    if (previousSalesRef.current !== null && previousSalesRef.current < annualTarget && currentSales >= annualTarget) {
      // Goal just reached!
      triggerArcaneFog();
    }
    previousSalesRef.current = currentSales;
  }, [currentSales, annualTarget]);

  // Calculate fatturato a credito from myData
  const fatturatoCredito = useMemo(() => {
    if (!myData) return 0;
    return myData.reduce((sum, d) => sum + (Number(d.fatturato_a_credito) || 0), 0);
  }, [myData]);

  const incarichiTeam = useMemo(() => {
    if (!allData) return 0;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return allData.
    filter((d) => new Date(d.date) >= startOfMonth).
    reduce((acc, d) => acc + (d.incarichi_vendita || 0), 0);
  }, [allData]);

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
      </div>);

  }

  const contatti = kpis?.contatti?.value || 0;
  const notizie = kpis?.notizie?.value || 0;
  const chiusure = kpis?.vendite?.value || 0;
  const conversioni = contatti > 0 ? Math.round(chiusure / contatti * 100) : 0;

  const incarichiTarget = sedeTargets.incarichi_target || 4;
  const incarichiPercent = Math.min(100, Math.round(incarichiTeam / incarichiTarget * 100));

  const handleNotiziaClick = (notizia: Notizia) => {
    onOpenNotizia?.(notizia);
  };

  return (
    <div className="px-4 pb-6 space-y-4 animate-fade-in">
      {/* Daily Quote at top */}
      <DailyQuote />

      {/* Ciclo Produttivo Pill Button */}
      <div className="flex justify-center">
        <button
          onClick={() => navigate('/inserisci')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium tracking-widest transition-all active:scale-95 ${
          hasReportedToday ?
          'bg-muted text-muted-foreground' :
          'bg-foreground text-background shadow-[0_0_25px_8px_rgba(0,0,0,0.25)]'}`
          }>
          {hasReportedToday ?
          <>
              <Check className="w-4 h-4" />
              FATTO
            </> :
          <>
              <Plus className="w-4 h-4" />
              CICLO PRODUTTIVO
            </>
          }
        </button>
      </div>

      {/* Weekly Goals Widget */}
      <WeeklyGoalsWidget />

      {/* === ROW 1: Calendario + Incarichi del Mese (big cards) === */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TodayRemindersWidget onNotiziaClick={handleNotiziaClick} onGoToCalendar={onGoToCalendar} />
        <IncarchiWidget />
      </div>

      {/* === ROW 2: Contatti, Notizie, Appuntamenti === */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Contatti', kpiKey: 'contatti' as KPIKey, value: kpis?.contatti?.value || 0, target: kpis?.contatti?.target || 0, icon: Phone },
          { label: 'Notizie', kpiKey: 'notizie' as KPIKey, value: kpis?.notizie?.value || 0, target: kpis?.notizie?.target || 0, icon: FileText },
          { label: 'Appuntamenti', kpiKey: 'appuntamenti' as KPIKey, value: kpis?.appuntamenti?.value || 0, target: kpis?.appuntamenti?.target || 0, icon: CalendarCheck },
        ].map((w) => {
          const Icon = w.icon;
          const pct = w.target > 0 ? Math.min(100, Math.round((w.value / w.target) * 100)) : 0;
          const isHit = w.target > 0 && w.value >= w.target;
          return (
            <button key={w.label} onClick={() => setSelectedKPI(w.kpiKey)} className="rounded-2xl p-4 border border-border bg-card text-card-foreground transition-transform active:scale-[0.97] text-left cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">{w.label}</p>
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl md:text-3xl font-medium">{w.value}</span>
                <span className="text-xs text-muted-foreground">/ {w.target}</span>
              </div>
              <div className="h-1.5 w-full rounded-full overflow-hidden bg-muted">
                <div className="h-full rounded-full transition-all duration-500 bg-foreground" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                <span>{pct}%</span>
                {isHit && <span className="font-semibold text-foreground">✓</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* === ROW 3: Acquisizioni, Incarichi, Trattative Chiuse === */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Acquisizioni', kpiKey: 'acquisizioni' as KPIKey, value: kpis?.acquisizioni?.value || 0, target: kpis?.acquisizioni?.target || 0, icon: Home },
          { label: 'Incarichi', kpiKey: 'incarichi' as KPIKey, value: kpis?.incarichi?.value || 0, target: kpis?.incarichi?.target || 0, icon: Handshake },
          { label: 'Trattative Chiuse', kpiKey: 'trattativeChiuse' as KPIKey, value: kpis?.trattativeChiuse?.value || 0, target: kpis?.trattativeChiuse?.target || 0, icon: TrendingUp },
        ].map((w) => {
          const Icon = w.icon;
          const pct = w.target > 0 ? Math.min(100, Math.round((w.value / w.target) * 100)) : 0;
          const isHit = w.target > 0 && w.value >= w.target;
          return (
            <button key={w.label} onClick={() => setSelectedKPI(w.kpiKey)} className="rounded-2xl p-4 border border-border bg-card text-card-foreground transition-transform active:scale-[0.97] text-left cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">{w.label}</p>
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl md:text-3xl font-medium">{w.value}</span>
                <span className="text-xs text-muted-foreground">/ {w.target}</span>
              </div>
              <div className="h-1.5 w-full rounded-full overflow-hidden bg-muted">
                <div className="h-full rounded-full transition-all duration-500 bg-foreground" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                <span>{pct}%</span>
                {isHit && <span className="font-semibold text-foreground">✓</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Status Annuale + Volumi */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="col-span-2 bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
            <p className="text-[10px] font-medium tracking-[0.3em] uppercase text-muted-foreground">STATUS ANNUALE</p>
          </div>
          <div className="flex items-baseline gap-1.5 mb-3">
            <span className="text-5xl font-light text-foreground tracking-tight">{currentSales}</span>
            <span className="text-xl font-light text-muted-foreground">/ {annualTarget}</span>
            <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground ml-1">VENDITE</span>
          </div>
          <Progress value={completionPercent} className="h-1 bg-muted" />
          <p className="text-[10px] text-muted-foreground mt-1.5">{completionPercent}% target</p>
        </div>
        <div className="col-span-1 dark-card py-4 px-4 flex flex-col justify-between">
          <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground mb-2">VOLUME GENERATO</p>
          <p className="text-2xl text-white whitespace-nowrap font-medium">{formatCompactCurrency(fatturato)}</p>
        </div>
        <div className="col-span-1 dark-card py-4 px-4 flex flex-col justify-between">
          <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground mb-2">VOLUME A CREDITO</p>
          <p className="text-2xl text-white whitespace-nowrap font-medium">{formatCompactCurrency(fatturatoCredito)}</p>
        </div>
      </div>

      {/* Incarichi Team */}
      <div className="bg-card rounded-2xl border border-border shadow p-4 relative overflow-hidden">
        <div className="absolute right-2 top-2 opacity-5">
          <Gift className="w-20 h-20 text-foreground" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-4 h-4 text-foreground" />
            <h3 className="text-[10px] font-bold tracking-[0.15em] uppercase">INCARICHI TEAM</h3>
          </div>
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="text-4xl text-foreground font-medium">{incarichiTeam}</span>
            <span className="text-lg font-light text-muted-foreground">/ {incarichiTarget}</span>
          </div>
          <Progress value={incarichiPercent} className="h-1 bg-muted mb-2" />
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Progresso ufficio</span>
            <span className="font-semibold text-foreground">{incarichiPercent}%</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <AcquisitionChart />

      <Suspense
        fallback={
        <div className="bg-card rounded-2xl shadow-lg p-4">
            <div className="h-24 rounded-xl bg-muted animate-pulse" />
          </div>
        }>
        <PerformanceCharts
          myData={myData}
          chartPeriod={chartPeriod}
          onChartPeriodChange={setChartPeriod}
          formatCompactCurrency={formatCompactCurrency} />
      </Suspense>

      <Suspense fallback={null}>
        <KPIDetailModal
          open={!!selectedKPI}
          onOpenChange={(open) => !open && setSelectedKPI(null)}
          kpiKey={selectedKPI}
          title={
            { contatti: 'CONTATTI REALI', notizie: 'NOTIZIE ACQUISITE', chiusure: 'CHIUSURE TOTALI', conversioni: 'CONVERSIONI', appuntamenti: 'APPUNTAMENTI', acquisizioni: 'ACQUISIZIONI', incarichi: 'INCARICHI', trattativeChiuse: 'TRATTATIVE CHIUSE' }[selectedKPI || 'contatti']
          }
          value={
            { contatti, notizie, chiusure, conversioni, appuntamenti: kpis?.appuntamenti?.value || 0, acquisizioni: kpis?.acquisizioni?.value || 0, incarichi: kpis?.incarichi?.value || 0, trattativeChiuse: kpis?.trattativeChiuse?.value || 0 }[selectedKPI || 'contatti']
          }
          icon={
            { contatti: Phone, notizie: FileText, chiusure: Award, conversioni: Zap, appuntamenti: CalendarCheck, acquisizioni: Home, incarichi: Handshake, trattativeChiuse: TrendingUp }[selectedKPI || 'contatti']
          } />
      </Suspense>
    </div>);


};

export default PersonalDashboard;