import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';
import { Home, Megaphone, Calendar, Wallet, Building2, Settings } from 'lucide-react';

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
  ufficio: '/ufficio',
  impostazioni: '/impostazioni',
};

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const navigate = useNavigate();
  
  const tabs = [
    { id: 'numeri', icon: Home, label: 'Home' },
    { id: 'calendario', icon: Calendar, label: 'Calendario' },
    { id: 'notizie', icon: Megaphone, label: 'Notizie' },
    { id: 'clienti', icon: Wallet, label: 'Buyers' },
    { id: 'ufficio', icon: Building2, label: 'Ufficio' },
    { id: 'impostazioni', icon: Settings, label: 'Impostazioni' },
  ];

  const handleTabChange = (tabId: string) => {
    triggerHaptic('selection');
    onTabChange(tabId);
    navigate(tabToPath[tabId] || '/');
  };

  // Map legacy tab ids to ufficio
  const resolvedActiveTab = ['riunioni', 'report', 'agenzia'].includes(activeTab) ? 'ufficio' : activeTab;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[60] flex justify-center px-4 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="bottom-nav-bar w-full max-w-lg mb-2 rounded-[1.75rem] px-2 py-1.5 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = resolvedActiveTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'bottom-nav-item relative flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-2xl transition-all duration-150',
                isActive ? 'active' : ''
              )}
              title={tab.label}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon 
                className={cn(
                  'w-[22px] h-[22px] transition-all duration-150',
                  isActive ? 'text-white scale-110' : 'text-white/50'
                )} 
                strokeWidth={isActive ? 2.2 : 1.5} 
              />
              <span className={cn(
                'text-[9px] font-semibold tracking-wide transition-all duration-150',
                isActive ? 'text-white' : 'text-white/40'
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
