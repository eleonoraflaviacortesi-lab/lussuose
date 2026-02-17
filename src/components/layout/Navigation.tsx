import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
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
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY < 10) {
        setVisible(true);
      } else if (currentY > lastScrollY.current + 4) {
        setVisible(false);
      } else if (currentY < lastScrollY.current - 4) {
        setVisible(true);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
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
      className={cn(
        "fixed left-0 right-0 z-[55] flex justify-center transition-all duration-300",
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
      )}
      style={{ top: 'calc(115px + env(safe-area-inset-top, 0px))' }}
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
                  style={{ boxShadow: '0 3px 8px rgba(0,0,0,0.18)' }}
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