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
      className="fixed bottom-3 left-3 right-3 z-40 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-[58px] px-1 bg-foreground/95 backdrop-blur-xl rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.3)]">
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
                'flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-xl transition-all active:scale-95',
                active ? 'text-background' : 'text-background/40'
              )}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center transition-all',
                  active && 'bg-background/20'
                )}
              >
                <tab.icon
                  className={cn('w-[18px] h-[18px]', active && 'text-background')}
                  strokeWidth={active ? 2.2 : 1.5}
                />
              </div>
              <span
                className={cn(
                  'text-[8px] leading-none tracking-wide uppercase',
                  active ? 'font-bold' : 'font-medium'
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
