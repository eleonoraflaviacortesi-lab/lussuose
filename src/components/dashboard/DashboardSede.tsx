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
import { sedeKPIs } from '@/data/mockData';

const DashboardSede = () => {
  const currentMonth = new Date().toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

  const kpiCards = [
    { title: 'Contatti', icon: 'phone', ...sedeKPIs.contatti },
    { title: 'Notizie Vendita', icon: 'fileText', ...sedeKPIs.notizieVendita },
    { title: 'Clienti Gestiti', icon: 'users', ...sedeKPIs.clientiGestiti },
    { title: 'Appuntamenti Vendita', icon: 'calendar', ...sedeKPIs.appuntamentiVendita },
    { title: 'Acquisizioni', icon: 'building', ...sedeKPIs.acquisizioni },
    { title: 'Incarichi', icon: 'briefcase', ...sedeKPIs.incarichi },
    { title: 'Vendite (Rogiti)', icon: 'home', ...sedeKPIs.venditeRogiti },
    { title: 'Fatturato', icon: 'euro', ...sedeKPIs.fatturato, format: 'currency' as const },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10 text-accent">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-semibold text-foreground">Dashboard Sede</h1>
            <p className="text-sm text-muted-foreground capitalize">{currentMonth}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Target className="w-4 h-4" />
            <span>Imposta Obiettivi Sede</span>
          </Button>
          
          <Select defaultValue="arezzo">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="arezzo">AREZZO</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex rounded-lg border border-border overflow-hidden">
            <button className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors">
              Sett
            </button>
            <button className="px-4 py-2 text-sm bg-accent text-accent-foreground font-medium">
              Mese
            </button>
            <button className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors">
              Anno
            </button>
          </div>
        </div>
      </div>

      {/* Performance Generale */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-accent text-lg">📊</span>
          <h2 className="font-serif text-lg font-semibold text-foreground">
            Performance Generale <span className="font-normal text-muted-foreground">(Somma Agenti)</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <RecentOperations />
      </div>
    </div>
  );
};

export default DashboardSede;
