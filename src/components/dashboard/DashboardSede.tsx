import { Building, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import KPICard from './KPICard';
import MonthlyRanking from './MonthlyRanking';
import RecentOperations from './RecentOperations';
import { useKPIs } from '@/hooks/useKPIs';
import { useState } from 'react';

const DashboardSede = () => {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const { kpis, isLoading } = useKPIs(period);
  const currentMonth = new Date().toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

  const kpiCards = kpis ? [
    { title: 'Contatti', icon: 'phone', ...kpis.contatti },
    { title: 'Notizie Vendita', icon: 'fileText', ...kpis.notizie },
    { title: 'Clienti Gestiti', icon: 'users', ...kpis.clienti },
    { title: 'Appuntamenti Vendita', icon: 'calendar', ...kpis.appuntamenti },
    { title: 'Acquisizioni', icon: 'building', ...kpis.acquisizioni },
    { title: 'Incarichi', icon: 'briefcase', ...kpis.incarichi },
    { title: 'Vendite (Rogiti)', icon: 'home', ...kpis.vendite },
    { title: 'Fatturato', icon: 'euro', ...kpis.fatturato, format: 'currency' as const },
  ] : [];

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 bg-card rounded-xl border border-border p-4 md:p-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10 text-accent">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif text-lg md:text-xl font-semibold text-foreground">Dashboard Sede</h1>
            <p className="text-sm text-muted-foreground capitalize">{currentMonth}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <Button variant="outline" className="gap-2 text-xs md:text-sm">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Imposta Obiettivi Sede</span>
            <span className="sm:hidden">Obiettivi</span>
          </Button>
          
          <Select defaultValue="arezzo">
            <SelectTrigger className="w-28 md:w-32 text-xs md:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="arezzo">AREZZO</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex rounded-lg border border-border overflow-hidden">
            <button 
              onClick={() => setPeriod('week')}
              className={`px-3 md:px-4 py-2 text-xs md:text-sm transition-colors ${period === 'week' ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:bg-muted'}`}
            >
              Sett
            </button>
            <button 
              onClick={() => setPeriod('month')}
              className={`px-3 md:px-4 py-2 text-xs md:text-sm transition-colors ${period === 'month' ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:bg-muted'}`}
            >
              Mese
            </button>
            <button 
              onClick={() => setPeriod('year')}
              className={`px-3 md:px-4 py-2 text-xs md:text-sm transition-colors ${period === 'year' ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:bg-muted'}`}
            >
              Anno
            </button>
          </div>
        </div>
      </div>

      {/* Performance Generale */}
      <div className="bg-card rounded-xl border border-border p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4 md:mb-6">
          <span className="text-accent text-lg">📊</span>
          <h2 className="font-serif text-base md:text-lg font-semibold text-foreground">
            Performance Generale <span className="font-normal text-muted-foreground">(Somma Agenti)</span>
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {kpiCards.map((kpi) => (
              <KPICard
                key={kpi.title}
                title={kpi.title}
                value={kpi.value}
                target={kpi.target}
                delta={kpi.delta}
                icon={kpi.icon}
                format={'format' in kpi ? kpi.format : 'number'}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <MonthlyRanking />
        <RecentOperations />
      </div>
    </div>
  );
};

export default DashboardSede;
