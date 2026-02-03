import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { Calendar, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useEntityMeetings } from '@/hooks/useMeetings';

interface EntityMeetingsWidgetProps {
  entityType: 'notizia' | 'cliente';
  entityId: string;
  onMeetingClick?: (meetingId: string) => void;
}

/**
 * Widget to show which meetings an entity (notizia/cliente) was discussed in.
 * Use this in NotiziaDetail or ClienteDetail pages.
 */
export const EntityMeetingsWidget = ({ 
  entityType, 
  entityId,
  onMeetingClick 
}: EntityMeetingsWidgetProps) => {
  const { data: items, isLoading } = useEntityMeetings(entityType, entityId);

  if (isLoading) {
    return (
      <Card className="p-4">
        <Skeleton className="h-5 w-32 mb-3" />
        <Skeleton className="h-12 w-full" />
      </Card>
    );
  }

  if (!items || items.length === 0) {
    return null; // Don't show widget if no meetings
  }

  // Group by meeting
  const meetingsMap = new Map<string, { meeting: any; items: any[] }>();
  items.forEach(item => {
    const meeting = (item as any).meetings;
    if (!meetingsMap.has(meeting.id)) {
      meetingsMap.set(meeting.id, { meeting, items: [] });
    }
    meetingsMap.get(meeting.id)!.items.push(item);
  });

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-medium text-sm">Discusso in riunioni</h3>
      </div>

      <div className="space-y-2">
        {Array.from(meetingsMap.values()).map(({ meeting, items }) => (
          <button
            key={meeting.id}
            className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            onClick={() => onMeetingClick?.(meeting.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">
                  Settimana {meeting.week_number}, {meeting.year}
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(parseISO(meeting.week_start), "d MMM", { locale: it })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {items.length} {items.length === 1 ? 'voce' : 'voci'}
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
};
