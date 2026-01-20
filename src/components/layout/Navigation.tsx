import { cn } from '@/lib/utils';
import { LayoutGrid, PlusCircle, Users, Settings, BarChart3 } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const tabs = [
    { id: 'numeri', icon: LayoutGrid, label: 'I miei numeri' },
    { id: 'inserisci', icon: PlusCircle, label: 'Report giornaliero' },
    { id: 'analisi', icon: BarChart3, label: 'Analisi Report' },
    { id: 'agenzia', icon: Users, label: 'Agenzia' },
    { id: 'impostazioni', icon: Settings, label: 'Impostazioni' },
  ];

  return (
    <nav className="flex flex-col items-center gap-4 py-4 bg-background">
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
                <div className="w-px h-6 bg-border mx-1" />
              )}
            </div>
          );
        })}
      </div>

      {/* Report Button - Black Minimal */}
      <button 
        onClick={() => onTabChange('inserisci')}
        className="btn-report"
      >
        Report
      </button>
    </nav>
  );
};

export default Navigation;