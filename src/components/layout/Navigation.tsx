import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';
import { Home, Megaphone, Building2, Settings, TrendingUp, Users, Calendar } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

// Map tab ids to URL paths
const tabToPath: Record<string, string> = {
  numeri: '/',
  calendario: '/calendario',
  notizie: '/notizie',
  clienti: '/clienti',
  inserisci: '/inserisci',
  agenzia: '/agenzia',
  impostazioni: '/impostazioni',
};

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const navigate = useNavigate();
  
  const tabs = [
    { id: 'numeri', icon: Home, label: 'Home' },
    { id: 'calendario', icon: Calendar, label: 'Calendario' },
    { id: 'notizie', icon: Megaphone, label: 'Notizie' },
    { id: 'clienti', icon: Users, label: 'Buyers' },
    // separator after index 3
    { id: 'inserisci', icon: TrendingUp, label: 'Ciclo Produttivo' },
    { id: 'agenzia', icon: Building2, label: 'Performance Ufficio' },
    { id: 'impostazioni', icon: Settings, label: 'Impostazioni' },
  ];

  const handleTabChange = (tabId: string) => {
    triggerHaptic('selection');
    onTabChange(tabId);
    // Update URL to match the tab (enables refresh persistence)
    navigate(tabToPath[tabId] || '/');
  };

  return (
    <nav className="flex flex-col items-center gap-4 -mt-1 pb-2">
      {/* Pill Navigation */}
      <div className="pill-nav">
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const showSeparatorAfter = index === 3; // After clienti
          
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
              {showSeparatorAfter && (
                <div className="w-px h-5 bg-border mx-0.5" />
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;