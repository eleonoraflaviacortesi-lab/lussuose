import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';
import { Home, Megaphone, Building2, Settings, TrendingUp, Check, Plus, Users } from 'lucide-react';
import { useTodayReportStatus } from '@/hooks/useTodayReportStatus';


interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const { hasReportedToday } = useTodayReportStatus();
  
  const tabs = [
    { id: 'numeri', icon: Home, label: 'Home' },
    { id: 'notizie', icon: Megaphone, label: 'Notizie' },
    { id: 'analisi', icon: TrendingUp, label: 'Analisi Report' },
    { id: 'agenzia', icon: Building2, label: 'Agenzia' },
    { id: 'clienti', icon: Users, label: 'Buyers' },
    { id: 'impostazioni', icon: Settings, label: 'Impostazioni' },
  ];

  const handleTabChange = (tabId: string) => {
    triggerHaptic('selection');
    onTabChange(tabId);
  };

  return (
    <nav className="flex flex-col items-center gap-2 py-1">
      {/* Pill Navigation */}
      <div className="pill-nav">
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <div key={tab.id} className="flex items-center">
              <button
                onClick={() => handleTabChange(tab.id)}
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
        onClick={() => {
          triggerHaptic('medium');
          onTabChange('inserisci');
        }}
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