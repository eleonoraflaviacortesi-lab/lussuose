import { useState, useMemo, useEffect, useRef, lazy, Suspense } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { useKPIs } from '@/hooks/useKPIs';
import { useDailyData } from '@/hooks/useDailyData';
import { useSedeTargets } from '@/hooks/useSedeTargets';
import { useUserSettings } from '@/hooks/useUserSettings';
import { Users, Zap, Award, Gift, TrendingUp, Plus, Check, Phone, FileText, CalendarCheck, Home, Handshake, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTodayReportStatus } from '@/hooks/useTodayReportStatus';
import DailyQuote from './DailyQuote';
import TodayRemindersWidget from './TodayRemindersWidget';
import WeeklyGoalsWidget from './WeeklyGoalsWidget';
import IncarchiWidget from './IncarchiWidget';
import AcquisitionChart from './AcquisitionChart';
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

/* ── Circular Progress Ring ───────────────────────────── */
const CircularProgress = ({ percent, size = 140, stroke = 8 }: { percent: number; size?: number; stroke?: number }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="hsl(var(--foreground))"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tracking-tight">{percent}%</span>
      </div>
    </div>
  );
};

const PersonalDashboard = ({ onGoToCalendar, onOpenNotizia }: PersonalDashboardProps) => {
  const [chartPeriod, setChartPeriod] = useState<Period>('month');
  const [selectedKPI, setSelectedKPI] = useState<KPIKey | null>(null);
  const { profile } = useAuth();
  const { kpis, isLoading } = useKPIs('year');
  const { myData, allData } = useDailyData();
  const { annualTargets, targets: sedeTargets } = useSedeTargets();
  const { settings } = useUserSettings();
  const navigate = useNavigate();
  const { hasReportedToday } = useTodayReportStatus();

  const annualTarget = annualTargets?.vendite_target || 48;
  const currentSales = kpis?.vendite?.value || 0;
  const completionPercent = Math.min(100, Math.round(currentSales / annualTarget * 100));
  const fatturato = kpis?.fatturato?.value || 0;

  const previousSalesRef = useRef<number | null>(null);

  useEffect(() => {
    if (previousSalesRef.current !== null && previousSalesRef.current < annualTarget && currentSales >= annualTarget) {
      triggerArcaneFog();
    }
    previousSalesRef.current = currentSales;
  }, [currentSales, annualTarget]);

  const fatturatoCredito = useMemo(() => {
    if (!myData) return 0;
    return myData.reduce((sum, d) => sum + (Number(d.fatturato_a_credito) || 0), 0);
  }, [myData]);

  const { incarichiMese, incarichiTarget: incarichiMeseTarget, incarichiPercent: incarichiMesePercent } = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const incarichiMese = myData
      ?.filter((d) => new Date(d.date) >= startOfMonth)
      .reduce((acc, d) => acc + (d.incarichi_vendita || 0), 0) || 0;
    const weeklyIdeal = settings?.incarichi_settimana || 1;
    const incarichiTarget = weeklyIdeal * 4;
    const incarichiPercent = incarichiTarget > 0 ? Math.min(100, Math.round(incarichiMese / incarichiTarget * 100)) : 0;
    return { incarichiMese, incarichiTarget, incarichiPercent };
  }, [myData, settings]);

  const incarichiTeam = useMemo(() => {
    if (!allData) return 0;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return allData.filter((d) => new Date(d.date) >= startOfMonth).reduce((acc, d) => acc + (d.incarichi_vendita || 0), 0);
  }, [allData]);

  const formatCompactCurrency = (value: number) => {
    if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`;
    return `€${value}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-foreground border-t-transparent" />
      </div>
    );
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

  /* KPI rows data */
  const kpiRow1 = [
    { label: 'Contatti', kpiKey: 'contatti' as KPIKey, value: kpis?.contatti?.value || 0, target: kpis?.contatti?.target || 0, icon: Phone },
    { label: 'Notizie', kpiKey: 'notizie' as KPIKey, value: kpis?.notizie?.value || 0, target: kpis?.notizie?.target || 0, icon: FileText },
    { label: 'Appuntamenti', kpiKey: 'appuntamenti' as KPIKey, value: kpis?.appuntamenti?.value || 0, target: kpis?.appuntamenti?.target || 0, icon: CalendarCheck },
  ];

  const kpiRow2 = [
    { label: 'Acquisizioni', kpiKey: 'acquisizioni' as KPIKey, value: kpis?.acquisizioni?.value || 0, target: kpis?.acquisizioni?.target || 0, icon: Home },
    { label: 'Incarichi', kpiKey: 'incarichi' as KPIKey, value: kpis?.incarichi?.value || 0, target: kpis?.incarichi?.target || 0, icon: Handshake },
    { label: 'Trattative', kpiKey: 'trattativeChiuse' as KPIKey, value: kpis?.trattativeChiuse?.value || 0, target: kpis?.trattativeChiuse?.target || 0, icon: TrendingUp },
  ];

  const renderKPICard = (w: typeof kpiRow1[0]) => {
    const Icon = w.icon;
    const pct = w.target > 0 ? Math.min(100, Math.round(w.value / w.target * 100)) : 0;
    const isHit = w.target > 0 && w.value >= w.target;
    return (
      <button
        key={w.label}
        onClick={() => setSelectedKPI(w.kpiKey)}
        className="bg-card rounded-3xl border border-border p-5 text-left transition-all active:scale-[0.97] cursor-pointer hover:border-foreground/20"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <Icon className="w-4 h-4 text-foreground" />
          </div>
          {isHit && <span className="text-xs font-semibold text-foreground bg-muted px-2 py-0.5 rounded-full">✓</span>}
        </div>
        <p className="text-xs font-medium tracking-wide uppercase text-muted-foreground mb-1">{w.label}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold tracking-tight">{w.value}</span>
          <span className="text-sm text-muted-foreground font-light">/ {w.target}</span>
        </div>
        <div className="mt-3 h-1.5 w-full rounded-full overflow-hidden bg-muted">
          <div
            className="h-full rounded-full transition-all duration-500 bg-foreground"
            style={{ width: `${pct}%` }}
          />
        </div>
      </button>
    );
  };

  return (
    <div className="pb-8 space-y-6 animate-fade-in">

      {/* Ciclo Produttivo CTA */}
      <div className="flex justify-center">
        <button
          onClick={() => navigate('/inserisci')}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-full text-sm font-semibold tracking-widest transition-all active:scale-95 ${
            hasReportedToday
              ? 'bg-muted text-muted-foreground'
              : 'bg-foreground text-background'
          }`}
        >
          {hasReportedToday ? (
            <><Check className="w-4 h-4" /> FATTO</>
          ) : (
            <><Plus className="w-4 h-4" /> CICLO PRODUTTIVO</>
          )}
        </button>
      </div>

      {/* Weekly Goals */}
      <WeeklyGoalsWidget />

      {/* Main Grid: Reminders + Annual Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left: Today Reminders (2 cols) */}
        <div className="md:col-span-2 [&>div]:h-full">
          <TodayRemindersWidget onNotiziaClick={handleNotiziaClick} onGoToCalendar={onGoToCalendar} />
        </div>

        {/* Right: Incarichi del Mese (circular) */}
        <div className="bg-card rounded-3xl border border-border p-6 flex flex-col items-center justify-center gap-3">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground">Incarichi del Mese</p>
          <CircularProgress percent={incarichiMesePercent} />
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-2xl font-bold">{incarichiMese}</span>
              <span className="text-sm text-muted-foreground font-light">/ {incarichiMeseTarget}</span>
            </div>
            <p className="text-[10px] text-muted-foreground tracking-wider uppercase mt-0.5">
              {incarichiMesePercent >= 100 ? 'Obiettivo raggiunto! 🎉' : `mancano ${Math.max(0, incarichiMeseTarget - incarichiMese)}`}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-3 gap-4">
        {kpiRow2.map(renderKPICard)}
      </div>

      {/* Chart */}
      <AcquisitionChart />

      {/* Volume cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-foreground text-background rounded-3xl p-6 flex flex-col justify-between">
          <p className="text-[10px] font-medium tracking-[0.2em] uppercase opacity-60 mb-3">VOLUME GENERATO</p>
          <p className="text-3xl font-bold">{formatCompactCurrency(fatturato)}</p>
        </div>
        <div className="bg-foreground text-background rounded-3xl p-6 flex flex-col justify-between">
          <p className="text-[10px] font-medium tracking-[0.2em] uppercase opacity-60 mb-3">VOLUME A CREDITO</p>
          <p className="text-3xl font-bold">{formatCompactCurrency(fatturatoCredito)}</p>
        </div>
        <div className="bg-card rounded-3xl border border-border p-6">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="w-4 h-4 text-foreground" />
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">INCARICHI TEAM</p>
          </div>
          <div className="flex items-baseline gap-1.5 mb-3">
            <span className="text-3xl font-bold">{incarichiTeam}</span>
            <span className="text-sm text-muted-foreground font-light">/ {incarichiTarget}</span>
          </div>
          <div className="h-1.5 w-full rounded-full overflow-hidden bg-muted">
            <div className="h-full rounded-full transition-all duration-500 bg-foreground" style={{ width: `${incarichiPercent}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">{incarichiPercent}%</p>
        </div>
      </div>

      {/* Incarichi Widget */}
      <IncarchiWidget />

      {/* Performance Charts */}
      <Suspense
        fallback={
          <div className="bg-card rounded-3xl border border-border p-6">
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

      {/* KPI Detail Modal */}
      <Suspense fallback={null}>
        <KPIDetailModal
          open={!!selectedKPI}
          onOpenChange={(open) => !open && setSelectedKPI(null)}
          kpiKey={selectedKPI}
          title={
            { contatti: 'CONTATTI', notizie: 'NOTIZIE', chiusure: 'CHIUSURE', conversioni: 'CONVERSIONI', appuntamenti: 'APPUNTAMENTI', acquisizioni: 'ACQUISIZIONI', incarichi: 'INCARICHI', trattativeChiuse: 'TRATTATIVE CHIUSE' }[selectedKPI || 'contatti']
          }
          value={
            { contatti, notizie, chiusure, conversioni, appuntamenti: kpis?.appuntamenti?.value || 0, acquisizioni: kpis?.acquisizioni?.value || 0, incarichi: kpis?.incarichi?.value || 0, trattativeChiuse: kpis?.trattativeChiuse?.value || 0 }[selectedKPI || 'contatti']
          }
          icon={
            { contatti: Phone, notizie: FileText, chiusure: Award, conversioni: Zap, appuntamenti: CalendarCheck, acquisizioni: Home, incarichi: Handshake, trattativeChiuse: TrendingUp }[selectedKPI || 'contatti']
          }
        />
      </Suspense>
    </div>
  );
};

export default PersonalDashboard;
