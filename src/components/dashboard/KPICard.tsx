import { cn } from '@/lib/utils';
import { 
  Phone, 
  FileText, 
  Users, 
  Calendar, 
  Building, 
  Briefcase, 
  Home, 
  Euro,
  LucideIcon 
} from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number | string;
  target?: number;
  delta?: number;
  icon: string;
  format?: 'number' | 'currency';
}

const iconMap: Record<string, LucideIcon> = {
  phone: Phone,
  fileText: FileText,
  users: Users,
  calendar: Calendar,
  building: Building,
  briefcase: Briefcase,
  home: Home,
  euro: Euro,
};

const KPICard = ({ title, value, target, delta, icon, format = 'number' }: KPICardProps) => {
  const Icon = iconMap[icon] || FileText;
  
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;
    if (format === 'currency') {
      return new Intl.NumberFormat('it-IT', { 
        style: 'currency', 
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val);
    }
    return val.toLocaleString('it-IT');
  };

  const formatDelta = (d: number) => {
    const prefix = d > 0 ? '+' : '';
    if (format === 'currency') {
      return `${prefix}${new Intl.NumberFormat('it-IT', { 
        style: 'currency', 
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(d)}`;
    }
    return `${prefix}${d}`;
  };

  return (
    <div className="group relative bg-card rounded-xl p-5 border border-border hover:border-accent/30 transition-all duration-300 hover:shadow-lg animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm text-muted-foreground font-medium tracking-wide">{title}</span>
        <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground group-hover:bg-accent/10 group-hover:text-accent transition-colors">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      
      <div className="mb-3">
        <span className="font-serif text-3xl font-bold text-foreground">
          {formatValue(value)}
        </span>
      </div>
      
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          Target: <span className="font-medium">{target !== undefined ? formatValue(target) : '-'}</span>
        </span>
        {delta !== undefined && (
          <span className={cn(
            'font-medium px-2 py-1 rounded',
            delta > 0 ? 'text-success bg-success/10' : delta < 0 ? 'text-destructive bg-destructive/10' : 'text-muted-foreground bg-muted'
          )}>
            {formatDelta(delta)}
          </span>
        )}
      </div>
    </div>
  );
};

export default KPICard;
