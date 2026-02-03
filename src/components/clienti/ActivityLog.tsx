import { memo } from 'react';
import { ClienteActivity, ClienteActivityType } from '@/types';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  Phone, 
  Home, 
  ArrowRightLeft, 
  UserCheck, 
  MessageSquare,
  Link2,
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
    icon: MessageSquare, 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-100',
    label: 'Email' 
  },
  visit: { 
    icon: Home, 
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

// Map for new activity types (association, match_comment)
const extendedActivityConfig: Record<string, { 
  icon: React.ElementType; 
  color: string; 
  bgColor: string;
  label: string;
}> = {
  ...activityConfig,
  association: { 
    icon: Link2, 
    color: 'text-indigo-600', 
    bgColor: 'bg-indigo-100',
    label: 'Associazione' 
  },
  match_comment: { 
    icon: MessageSquare, 
    color: 'text-teal-600', 
    bgColor: 'bg-teal-100',
    label: 'Commento proprietà' 
  },
};

const ActivityItem = memo(({ activity }: { activity: ClienteActivity }) => {
  const config = extendedActivityConfig[activity.activity_type] || extendedActivityConfig.comment;
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

  // Sort: comments at top, then by date desc
  const sortedActivities = [...activities].sort((a, b) => {
    // Comments first
    const aIsComment = a.activity_type === 'comment' || (a.activity_type as string) === 'match_comment';
    const bIsComment = b.activity_type === 'comment' || (b.activity_type as string) === 'match_comment';
    if (aIsComment && !bIsComment) return -1;
    if (!aIsComment && bIsComment) return 1;
    // Then by date desc
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="divide-y divide-border">
      {sortedActivities.map(activity => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
});
ActivityLog.displayName = 'ActivityLog';

export default ActivityLog;
