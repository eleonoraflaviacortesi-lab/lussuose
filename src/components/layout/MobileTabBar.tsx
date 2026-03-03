import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, CalendarDays, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';

const tabs = [
  { label: 'Home', icon: LayoutDashboard, path: '/' },
  { label: 'Notizie', icon: Building2, path: '/properties' },
  { label: 'Buyers', icon: Users, path: '/contacts' },
  { label: 'Agenda', icon: CalendarDays, path: '/activities' },
  { label: 'Impost.', icon: Settings, path: '/settings' },
];

export default function MobileTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card/95 backdrop-blur-lg border-t border-border/30"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-14 px-2">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => {
                triggerHaptic('selection');
                navigate(tab.path);
              }}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg transition-colors',
                active ? 'text-foreground' : 'text-muted-foreground'
              )}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                active && 'bg-foreground'
              )}>
                <tab.icon className={cn('w-4 h-4', active && 'text-background')} strokeWidth={active ? 2.2 : 1.5} />
              </div>
              <span className={cn('text-[9px] leading-none', active ? 'font-semibold' : 'font-medium')}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
