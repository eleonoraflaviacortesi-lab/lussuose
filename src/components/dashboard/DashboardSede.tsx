import { useKPIs } from '@/hooks/useKPIs';
import { useProfiles } from '@/hooks/useProfiles';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { Progress } from '@/components/ui/progress';

const DashboardSede = () => {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const { kpis, isLoading } = useKPIs(period);
  const { profile } = useAuth();
  // Filtra profili solo per la sede dell'utente
  const { profiles } = useProfiles(true);
  
  const currentMonth = new Date().toLocaleDateString('it-IT', { month: 'long' }).toUpperCase();

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const agents = profiles?.filter(p => p.role === 'agente') || [];

  return (
    <div className="px-6 pb-8 space-y-8 animate-fade-in">
      {/* Period Selector */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-full border border-border overflow-hidden">
          {(['week', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-6 py-2.5 text-xs font-medium tracking-[0.2em] uppercase transition-colors ${
                period === p 
                  ? 'bg-foreground text-background' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p === 'week' ? 'SETT' : p === 'month' ? 'MESE' : 'ANNO'}
            </button>
          ))}
        </div>
      </div>

      {/* Sede and Month Header */}
      <div className="text-center space-y-1">
        <h2 className="text-sm font-bold tracking-tight uppercase">{profile?.sede}</h2>
        <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground">
          {currentMonth}
        </p>
      </div>

      {/* Fatturato Card */}
      <div className="dark-card text-center">
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-3">
          FATTURATO SEDE
        </p>
        <p className="text-5xl font-light text-white mb-2">
          {formatCurrency(kpis?.fatturato?.value || 0)}
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <span className="text-xs text-muted-foreground">Target:</span>
          <span className="text-xs text-white font-medium">
            {formatCurrency(kpis?.fatturato?.target || 1000000)}
          </span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-2">
            VENDITE
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-light text-foreground">{kpis?.vendite?.value || 0}</span>
            <span className="text-sm text-muted-foreground">/{kpis?.vendite?.target || 10}</span>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-2">
            ACQUISIZIONI
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-light text-foreground">{kpis?.acquisizioni?.value || 0}</span>
            <span className="text-sm text-muted-foreground">/{kpis?.acquisizioni?.target || 15}</span>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-2">
            INCARICHI
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-light text-foreground">{kpis?.incarichi?.value || 0}</span>
            <span className="text-sm text-muted-foreground">/{kpis?.incarichi?.target || 12}</span>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-2">
            APPUNTAMENTI
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-light text-foreground">{kpis?.appuntamenti?.value || 0}</span>
            <span className="text-sm text-muted-foreground">/{kpis?.appuntamenti?.target || 40}</span>
          </div>
        </div>
      </div>

      {/* Team Ranking */}
      {agents.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-center text-muted-foreground">
            CLASSIFICA TEAM
          </h3>
          <div className="space-y-3">
            {agents.slice(0, 5).map((agent, index) => (
              <div 
                key={agent.id}
                className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border"
              >
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{agent.full_name}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{agent.sede}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardSede;