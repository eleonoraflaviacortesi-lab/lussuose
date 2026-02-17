import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';
import { Home, Megaphone, Newspaper, Settings, Calendar, Wallet } from 'lucide-react';

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
    { id: 'ufficio', icon: Newspaper, label: 'Ufficio' },
    { id: 'impostazioni', icon: Settings, label: 'Impostazioni' },
  ];

  const handleTabChange = (tabId: string) => {
    triggerHaptic('selection');
    onTabChange(tabId);
    // Update URL to match the tab (enables refresh persistence)
    navigate(tabToPath[tabId] || '/');
  };

  return (
    <nav className="fixed left-0 right-0 z-[55] flex justify-center md:py-0 md:px-0" style={{ top: 'calc(85px + env(safe-area-inset-top, 0px))' }}>
      {/* Pill Navigation */}
      <div className="pill-nav glass-nav w-full rounded-none rounded-b-[1.5rem] md:w-auto md:rounded-none md:rounded-b-[1.5rem]">
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const showSeparatorAfter = false;
          
          return (
            <div key={tab.id} className="flex items-center">
              <button
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'pill-nav-item relative',
                  isActive && 'active'
                )}
                title={tab.label}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <span
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34px] h-[34px] rounded-full bg-white"
                    style={{ boxShadow: '0 3px 8px rgba(0,0,0,0.18)' }}
                  />
                )}
                <Icon className="w-4 h-4 relative z-10" strokeWidth={isActive ? 2 : 1.5} />
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