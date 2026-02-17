import { useState } from 'react';
import { useKPIs } from '@/hooks/useKPIs';
import { useAuth } from '@/hooks/useAuth';
import { useNotizie, Notizia } from '@/hooks/useNotizie';
import { Progress } from '@/components/ui/progress';
import { Phone, FileText, Calendar, Building, Briefcase, Home, Euro, Settings, TrendingDown, CreditCard, Clock, Star } from 'lucide-react';
import SedeTargetsDialog from './SedeTargetsDialog';
import { cn } from '@/lib/utils';

const AgencyDashboard = () => {
  const { profile: currentProfile } = useAuth();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [showTargetsDialog, setShowTargetsDialog] = useState(false);
  const userSede = currentProfile?.sede || 'CITTÀ DI CASTELLO';

  const { kpis, isLoading } = useKPIs(period);
  const { notizieByStatus, isLoading: notizieLoading } = useNotizie();

  const creditNotizie = notizieByStatus?.credit ?? [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-foreground border-t-transparent"></div>
      </div>);

  }

  const periodLabel = period === 'week' ? 'SETTIMANA PERFORMANCE' : period === 'year' ? 'ANNO PERFORMANCE' : 'MESE PERFORMANCE';

  // Use KPI values directly from hook - targets are already calculated there
  const contatti = kpis?.contatti?.value || 0;
  const contattiTarget = kpis?.contatti?.target || 0;
  const contattiDelta = kpis?.contatti?.delta || 0;

  const notizie = kpis?.notizie?.value || 0;
  const notizieTarget = kpis?.notizie?.target || 0;
  const notizieDelta = kpis?.notizie?.delta || 0;

  const appuntamenti = kpis?.appuntamenti?.value || 0;
  const appuntamentiTarget = kpis?.appuntamenti?.target || 0;
  const appuntamentiDelta = kpis?.appuntamenti?.delta || 0;

  const acquisizioni = kpis?.acquisizioni?.value || 0;
  const acquisizioniTarget = kpis?.acquisizioni?.target || 0;
  const acquisizioniDelta = kpis?.acquisizioni?.delta || 0;

  const incarichi = kpis?.incarichi?.value || 0;
  const incarichiTarget = kpis?.incarichi?.target || 0;
  const incarichiDelta = kpis?.incarichi?.delta || 0;

  const vendite = kpis?.vendite?.value || 0;
  const venditeTarget = kpis?.vendite?.target || 0;
  const venditeDelta = kpis?.vendite?.delta || 0;

  const fatturato = kpis?.fatturato?.value || 0;
  const fatturatoTarget = kpis?.fatturato?.target || 0;
  const fatturatoDelta = kpis?.fatturato?.delta || 0;

  const trattativeChiuse = kpis?.trattativeChiuse?.value || 0;
  const trattativeChiuseTarget = kpis?.trattativeChiuse?.target || 0;
  const trattativeChiuseDelta = kpis?.trattativeChiuse?.delta || 0;

  const fatturatoCredito = kpis?.fatturatoCredito?.value || 0;

  // KPI Card component
  const KPICard = ({
    title,
    value,
    target,
    delta,
    icon: Icon,
    format = 'number'







  }: {title: string;value: number;target: number;delta: number;icon: React.ElementType;format?: 'number' | 'currency';}) => {
    const percent = target > 0 ? Math.min(100, Math.round(value / target * 100)) : 0;
    const formatValue = (val: number) => format === 'currency' ? formatCurrency(val) : val.toString();
    const formatDelta = (d: number) => {
      const prefix = d > 0 ? '+' : '';
      return format === 'currency' ? `Δ ${prefix}${formatCurrency(d)}` : `Δ ${prefix}${d}`;
    };

    return (
      <div className="bg-card rounded-2xl shadow-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-medium tracking-[0.1em] uppercase text-muted-foreground truncate pr-2">
            {title}
          </p>
          <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </div>
        <p className={cn("text-foreground mb-2 text-xl font-medium",

        format === 'currency' ? "text-2xl" : "text-3xl"
        )}>
          {formatValue(value)}
        </p>
        <Progress value={percent} className="h-1 bg-muted mb-2" />
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground">Target: {formatValue(target)}</span>
          <span className={cn(
            'font-medium',
            delta > 0 ? 'text-green-500' : delta < 0 ? 'text-orange-500' : 'text-muted-foreground'
          )}>
            {formatDelta(delta)}
          </span>
        </div>
      </div>);

  };

  return (
    <div className="px-4 pb-8 space-y-4 animate-fade-in">
      {/* Header with Period Toggle */}
      <div className="bg-card rounded-2xl shadow-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-foreground text-background flex items-center justify-center">
            <Star className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="tracking-wide uppercase text-xl font-medium">{userSede}</h2>
            <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground">
              {periodLabel}
            </p>
          </div>
          <button
            onClick={() => setShowTargetsDialog(true)}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">

            <Settings className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 bg-muted rounded-full p-1 justify-center">
          {(['week', 'month', 'year'] as const).map((p) =>
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 px-3 py-1.5 text-[10px] font-medium tracking-[0.1em] uppercase rounded-full transition-colors ${
            period === p ?
            'bg-foreground text-background' :
            'text-muted-foreground hover:text-foreground'}`
            }>

              {p === 'week' ? 'S' : p === 'month' ? 'M' : 'A'}
            </button>
          )}
        </div>
      </div>

      {/* Performance Generale Header */}
      <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground px-1">
        PERFORMANCE GENERALE (SOMMA AGENTI)
      </p>

      {/* KPI Grid - 4 columns on larger screens, 2 on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard title="Contatti" value={contatti} target={contattiTarget} delta={contattiDelta} icon={Phone} />
        <KPICard title="Notizie Vendita" value={notizie} target={notizieTarget} delta={notizieDelta} icon={FileText} />
        <KPICard title="Appuntamenti Vendita" value={appuntamenti} target={appuntamentiTarget} delta={appuntamentiDelta} icon={Calendar} />
        <KPICard title="Acquisizioni" value={acquisizioni} target={acquisizioniTarget} delta={acquisizioniDelta} icon={Building} />
        <KPICard title="Incarichi" value={incarichi} target={incarichiTarget} delta={incarichiDelta} icon={Briefcase} />
        <KPICard title="Vendite (Rogiti)" value={vendite} target={venditeTarget} delta={venditeDelta} icon={Home} />
        <KPICard title="Fatturato" value={fatturato} target={fatturatoTarget} delta={fatturatoDelta} icon={Euro} format="currency" />
        <KPICard title="Trattative Chiuse" value={trattativeChiuse} target={trattativeChiuseTarget} delta={trattativeChiuseDelta} icon={TrendingDown} />
        {/* Fatturato a Credito - no target, just value */}
        <div className="bg-card rounded-2xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-medium tracking-[0.1em] uppercase text-muted-foreground truncate pr-2">
              Fatturato a Credito
            </p>
            <CreditCard className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(fatturatoCredito)}</p>
        </div>
      </div>

      {/* In attesa di rogito section */}
      {creditNotizie.length > 0 &&
      <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <h3 className="text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground">
              IN ATTESA DI ROGITO ({creditNotizie.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {creditNotizie.map((notizia: Notizia) =>
          <div
            key={notizia.id}
            className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">

                <div className="w-8 h-8 rounded-full bg-blue-400 text-white flex items-center justify-center text-sm">
                  {notizia.emoji || '🏠'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{notizia.name}</p>
                  {notizia.zona &&
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{notizia.zona}</p>
              }
                </div>
              </div>
          )}
          </div>
        </div>
      }

      <SedeTargetsDialog open={showTargetsDialog} onOpenChange={setShowTargetsDialog} />
    </div>);

};

export default AgencyDashboard;