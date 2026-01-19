import { cn } from '@/lib/utils';
import { LayoutGrid, PlusCircle, TrendingUp } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const tabs = [
    { id: 'numeri', label: 'I miei Numeri', icon: LayoutGrid },
    { id: 'inserisci', label: 'Inserisci Dati', icon: PlusCircle },
    { id: 'andamento', label: 'Andamento Sede', icon: TrendingUp },
  ];

  return (
    <nav className="flex items-center justify-center gap-2 px-6 py-3 bg-card border-b border-border">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              isActive
                ? 'text-accent border-b-2 border-accent bg-accent/5'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="tracking-wide">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default Navigation;
