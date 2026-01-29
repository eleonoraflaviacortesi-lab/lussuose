import { memo } from 'react';
import { ClienteActivity, ClienteActivityType } from '@/types';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  Phone, 
  Mail, 
  Calendar, 
  Home, 
  ArrowRightLeft, 
  UserCheck, 
  MessageSquare,
  Loader2 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityLogProps {
  activities: ClienteActivity[];
  isLoading?: boolean;
}

const activityConfig: Record<ClienteActivityType, { 
  icon: React.ElementType; 
  color: string; 
  bgColor: string;
  label: string;
}> = {
  call: { 
    icon: Phone, 
    color: 'text-green-600', 
    bgColor: 'bg-green-100',
    label: 'Chiamata' 
  },
  email: { 
    icon: Mail, 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-100',
    label: 'Email' 
  },
  visit: { 
    icon: Calendar, 
    color: 'text-purple-600', 
    bgColor: 'bg-purple-100',
    label: 'Visita' 
  },
  proposal: { 
    icon: Home, 
    color: 'text-amber-600', 
    bgColor: 'bg-amber-100',
    label: 'Proposta' 
  },
  status_change: { 
    icon: ArrowRightLeft, 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-100',
    label: 'Stato' 
  },
  assignment: { 
    icon: UserCheck, 
    color: 'text-pink-600', 
    bgColor: 'bg-pink-100',
    label: 'Assegnazione' 
  },
  comment: { 
    icon: MessageSquare, 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-100',
    label: 'Commento' 
  },
};

const ActivityItem = memo(({ activity }: { activity: ClienteActivity }) => {
  const config = activityConfig[activity.activity_type] || activityConfig.comment;
  const Icon = config.icon;

  return (
    <div className="flex gap-3 py-2">
      {/* Icon */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        config.bgColor
      )}>
        <Icon className={cn("w-4 h-4", config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium truncate">{activity.title}</span>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {format(new Date(activity.created_at), 'dd MMM HH:mm', { locale: it })}
          </span>
        </div>
        
        {activity.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {activity.description}
          </p>
        )}
        
        {activity.author_name && (
          <span className="text-[10px] text-muted-foreground">
            {activity.author_emoji} {activity.author_name}
          </span>
        )}
      </div>
    </div>
  );
});
ActivityItem.displayName = 'ActivityItem';

export const ActivityLog = memo(({ activities, isLoading }: ActivityLogProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        Nessuna attività registrata
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {activities.map(activity => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
});
ActivityLog.displayName = 'ActivityLog';

export default ActivityLog;
