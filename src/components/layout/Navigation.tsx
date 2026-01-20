import { cn } from '@/lib/utils';
import { LayoutGrid, PlusCircle, Users, Settings } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const tabs = [
    { id: 'numeri', icon: LayoutGrid },
    { id: 'inserisci', icon: PlusCircle },
    { id: 'andamento', icon: Users },
  ];

  return (
    <nav className="flex flex-col items-center gap-6 py-6 bg-background">
      {/* Pill Navigation */}
      <div className="pill-nav">
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <>
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'pill-nav-item',
                  isActive && 'active'
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.5} />
              </button>
              {index === 2 && (
                <div key="separator" className="w-px h-8 bg-border mx-1" />
              )}
            </>
          );
        })}
        <button className="pill-nav-item">
          <Settings className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </div>

      {/* Report Button */}
      <button className="btn-pink flex items-center gap-3">
        <span className="text-lg">✦</span>
        <span className="text-sm tracking-[0.3em]">REPORT</span>
        <span className="text-lg">✦</span>
      </button>
    </nav>
  );
};

export default Navigation;