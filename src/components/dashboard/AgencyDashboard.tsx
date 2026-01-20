import { useState } from 'react';
import { useKPIs } from '@/hooks/useKPIs';
import { useProfiles } from '@/hooks/useProfiles';
import { useAuth } from '@/hooks/useAuth';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, Settings, Phone, FileText, Gift, Euro, BarChart3 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SEDI = ['Città di Castello', 'AREZZO', 'PERUGIA'];

const AgencyDashboard = () => {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [selectedSede, setSelectedSede] = useState('Città di Castello');
  const { kpis, isLoading } = useKPIs(period);
  const { profiles } = useProfiles();
  const { profile: currentProfile } = useAuth();

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

  const contatti = kpis?.contatti?.value || 0;
  const contattiTarget = 108;
  const contattiPercent = Math.min(100, Math.round((contatti / contattiTarget) * 100));

  const notizie = kpis?.notizie?.value || 0;
  const notizieTarget = 43;
  const notiziePercent = Math.min(100, Math.round((notizie / notizieTarget) * 100));

  const incarichi = kpis?.incarichi?.value || 0;
  const incarichiTarget = 4;
  const incarichiPercent = Math.min(100, Math.round((incarichi / incarichiTarget) * 100));

  const fatturato = kpis?.fatturato?.value || 0;
  const fatturatoTarget = 145455;
  const fatturatoPercent = Math.min(100, Math.round((fatturato / fatturatoTarget) * 100));

  return (
    <div className="px-6 pb-8 space-y-6 animate-fade-in">
      {/* Header with Sede Selector and Period Toggle */}
      <div className="bg-card rounded-3xl border border-border p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-foreground text-background flex items-center justify-center">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold tracking-tight">{selectedSede}</h2>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-primary">
              MESE PERFORMANCE
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <Select value={selectedSede} onValueChange={setSelectedSede}>
            <SelectTrigger className="w-48 bg-muted border-0 rounded-xl">
              <SelectValue placeholder="Seleziona sede" />
            </SelectTrigger>
            <SelectContent>
              {SEDI.map((sede) => (
                <SelectItem key={sede} value={sede}>
                  {sede}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 bg-muted rounded-full p-1">
            {(['week', 'month', 'year'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-xs font-medium tracking-[0.15em] uppercase rounded-full transition-colors ${
                  period === p 
                    ? 'bg-foreground text-background' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p === 'week' ? 'SETT' : p === 'month' ? 'MESE' : 'ANNO'}
              </button>
            ))}
          </div>

          <button className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Contatti Sede */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">
              CONTATTI SEDE
            </p>
            <Phone className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-4xl font-light text-foreground mb-3">{contatti}</p>
          <Progress value={contattiPercent} className="h-1 bg-muted mb-2" />
          <p className="text-xs text-muted-foreground">GOAL: {contattiTarget}</p>
        </div>

        {/* Notizie Acquisite */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">
              NOTIZIE ACQUISITE
            </p>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-4xl font-light text-foreground mb-3">{notizie}</p>
          <Progress value={notiziePercent} className="h-1 bg-muted mb-2" />
          <p className="text-xs text-muted-foreground">GOAL: {notizieTarget}</p>
        </div>

        {/* Incarichi Totali */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">
              INCARICHI TOTALI
            </p>
            <Gift className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-4xl font-light text-foreground mb-3">{incarichi}</p>
          <Progress value={incarichiPercent} className="h-1 bg-muted mb-2" />
          <p className="text-xs text-muted-foreground">GOAL: {incarichiTarget}</p>
        </div>

        {/* Fatturato Rogitato */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">
              FATTURATO ROGITATO
            </p>
            <Euro className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-light text-foreground mb-3">{formatCurrency(fatturato)}</p>
          <Progress value={fatturatoPercent} className="h-1 bg-muted mb-2" />
          <p className="text-xs text-muted-foreground">GOAL: {formatCurrency(fatturatoTarget)}</p>
        </div>
      </div>

      {/* Team Ranking */}
      {profiles && profiles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-center text-muted-foreground">
            CLASSIFICA TEAM
          </h3>
          <div className="space-y-3">
            {profiles.filter(p => p.role === 'agente').slice(0, 5).map((agent, index) => (
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

export default AgencyDashboard;
