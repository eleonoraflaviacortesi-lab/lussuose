import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';
import { Home, Megaphone, Newspaper, Calendar, Wallet } from 'lucide-react';

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
};

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const navigate = useNavigate();
  
  const tabs = [
    { id: 'numeri', icon: Home, label: 'Home' },
    { id: 'calendario', icon: Calendar, label: 'Calendario' },
    { id: 'notizie', icon: Megaphone, label: 'Notizie' },
    { id: 'clienti', icon: Wallet, label: 'Buyers' },
    { id: 'ufficio', icon: Newspaper, label: 'Ufficio' },
  ];

  const handleTabChange = (tabId: string) => {
    triggerHaptic('selection');
    onTabChange(tabId);
    navigate(tabToPath[tabId] || '/');
  };

  return (
    <nav
      className="flex justify-center pt-8 pb-2"
    >
      <div className="glass-nav rounded-full px-3 py-2 flex items-center gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-100',
                isActive ? 'text-foreground' : 'text-muted-foreground'
              )}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              title={tab.label}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <span
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34px] h-[34px] rounded-full bg-white"
                  style={{ boxShadow: 'none', border: '1px solid hsl(var(--border))' }}
                />
              )}
              <Icon className="w-4 h-4 relative z-10" strokeWidth={isActive ? 2 : 1.5} />
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;