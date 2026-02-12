import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';
import { Home, Megaphone, Building2, Settings, TrendingUp, Calendar, UsersRound, Wallet } from 'lucide-react';

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
  // separator after clienti
  riunioni: '/riunioni',
  report: '/report',
  agenzia: '/agenzia',
  impostazioni: '/impostazioni',
};

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const navigate = useNavigate();
  
  const tabs = [
    { id: 'numeri', icon: Home, label: 'Home' },
    { id: 'calendario', icon: Calendar, label: 'Calendario' },
    { id: 'notizie', icon: Megaphone, label: 'Notizie' },
    { id: 'clienti', icon: Wallet, label: 'Buyers' },
    // separator after index 3 (clienti)
    { id: 'riunioni', icon: UsersRound, label: 'Riunioni' },
    { id: 'report', icon: TrendingUp, label: 'I Miei Report' },
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
    <nav className="fixed top-[88px] left-0 right-0 z-[55] flex justify-center md:py-2 md:px-0">
      {/* Pill Navigation */}
      <div className="pill-nav glass-nav w-full rounded-none rounded-b-[1.5rem] md:w-auto md:rounded-none md:rounded-b-[1.5rem]">
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
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
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