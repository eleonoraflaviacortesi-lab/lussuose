import { cn } from '@/lib/utils';
import { Home, Megaphone, Building2, Settings, TrendingUp, Check, Plus, Users } from 'lucide-react';
import { useTodayReportStatus } from '@/hooks/useTodayReportStatus';
import { useAuth } from '@/hooks/useAuth';


interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const { hasReportedToday } = useTodayReportStatus();
  const { profile } = useAuth();
  const isCoordinator = profile?.role === 'coordinatore' || profile?.role === 'admin';
  
  const tabs = [
    { id: 'numeri', icon: Home, label: 'Home' },
    { id: 'notizie', icon: Megaphone, label: 'Notizie' },
    { id: 'analisi', icon: TrendingUp, label: 'Analisi Report' },
    { id: 'agenzia', icon: Building2, label: 'Agenzia' },
    ...(isCoordinator ? [{ id: 'clienti', icon: Users, label: 'Buyers' }] : []),
    { id: 'impostazioni', icon: Settings, label: 'Impostazioni' },
  ];

  return (
    <nav className="flex flex-col items-center gap-4 py-4">
      {/* Pill Navigation */}
      <div className="pill-nav">
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <div key={tab.id} className="flex items-center">
              <button
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'pill-nav-item',
                  isActive && 'active'
                )}
                title={tab.label}
              >
                <Icon className="w-4 h-4" strokeWidth={isActive ? 2 : 1.5} />
              </button>
              {index === 3 && (
                <div className="w-px h-5 bg-border mx-0.5" />
              )}
            </div>
          );
        })}
      </div>

      {/* Ciclo Produttivo Button - Dynamic State */}
      <button 
        onClick={() => onTabChange('inserisci')}
        className={cn(
          'btn-report flex items-center gap-2',
          hasReportedToday ? 'completed' : 'pending'
        )}
      >
        {hasReportedToday ? (
          <>
            <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span>Fatto</span>
          </>
        ) : (
          <>
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span>CICLO PRODUTTIVO</span>
          </>
        )}
      </button>
    </nav>
  );
};

export default Navigation;