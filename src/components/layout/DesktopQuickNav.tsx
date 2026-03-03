import { CalendarDays, Newspaper, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface DesktopQuickNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const shortcuts = [
  { id: 'calendario', icon: CalendarDays, label: 'Calendario', path: '/calendario' },
  { id: 'notizie', icon: Newspaper, label: 'Notizie', path: '/notizie' },
  { id: 'clienti', icon: Briefcase, label: 'Buyers', path: '/clienti' },
];

const DesktopQuickNav = ({ activeTab, onTabChange }: DesktopQuickNavProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Only render on desktop/tablet
  if (isMobile) return null;

  const handleClick = (tabId: string, path: string) => {
    triggerHaptic('selection');
    onTabChange?.(tabId);
    navigate(path);
  };

  return (
    <div className="fixed right-3 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
      {shortcuts.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleClick(item.id, item.path)}
            className={cn(
              "group relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 border border-border",
              isActive
                ? "bg-foreground text-background scale-110"
                : "bg-background/80 text-muted-foreground hover:bg-foreground hover:text-background hover:scale-110"
            )}
            title={item.label}
            aria-label={item.label}
          >
            <Icon className="w-4 h-4" strokeWidth={isActive ? 2.2 : 1.5} />
            {/* Tooltip on hover */}
            <span className="absolute right-full mr-2 px-2 py-1 rounded-md bg-foreground text-background text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default DesktopQuickNav;
