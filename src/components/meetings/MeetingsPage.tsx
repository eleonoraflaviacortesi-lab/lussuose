import { useState } from 'react';
import { format, parseISO, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMeetings, getWeekInfo } from '@/hooks/useMeetings';
import { useAuth } from '@/hooks/useAuth';
import { MeetingDetail } from './MeetingDetail';
import { cn } from '@/lib/utils';

export const MeetingsPage = () => {
  const { profile } = useAuth();
  const isCoordinator = profile?.role === 'coordinatore' || profile?.role === 'admin';
  const sede = profile?.sede || 'AREZZO';
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  
  const { meetings, isLoading, createOrGetMeeting } = useMeetings(sede);
  
  const currentWeek = getWeekInfo(selectedDate);
  
  // Find meeting for current week
  const currentMeeting = meetings?.find(m => m.week_start === currentWeek.weekStart);

  const handlePrevWeek = () => setSelectedDate(subWeeks(selectedDate, 1));
  const handleNextWeek = () => setSelectedDate(addWeeks(selectedDate, 1));
  const handleToday = () => setSelectedDate(new Date());

  const handleOpenMeeting = async () => {
    if (currentMeeting) {
      setSelectedMeetingId(currentMeeting.id);
    } else if (isCoordinator) {
      // Create new meeting for this week
      const id = await createOrGetMeeting.mutateAsync({
        sede,
        week_start: currentWeek.weekStart,
        week_number: currentWeek.weekNumber,
        year: currentWeek.year,
        title: `Riunione ${currentWeek.label}`,
      });
      setSelectedMeetingId(id);
    }
  };

  if (selectedMeetingId) {
    return (
      <MeetingDetail
        meetingId={selectedMeetingId}
        onBack={() => setSelectedMeetingId(null)}
      />
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header with week navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Riunioni Settimanali</h1>
          <p className="text-muted-foreground text-sm">
            Gestione operativa e task per settimana
          </p>
        </div>
      </div>

      {/* Week selector */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={handlePrevWeek}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="text-center">
            <div className="text-lg font-semibold">
              {currentWeek.label}
            </div>
            <div className="text-sm text-muted-foreground">
              {format(parseISO(currentWeek.weekStart), "d MMMM", { locale: it })} - 
              {format(addWeeks(parseISO(currentWeek.weekStart), 1), " d MMMM yyyy", { locale: it })}
            </div>
          </div>
          
          <Button variant="ghost" size="icon" onClick={handleNextWeek}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex justify-center mt-3">
          <Button variant="outline" size="sm" onClick={handleToday}>
            <Calendar className="h-4 w-4 mr-2" />
            Questa settimana
          </Button>
        </div>
      </Card>

      {/* Current week meeting card */}
      <Card 
        className={cn(
          "p-6 cursor-pointer transition-all hover:shadow-lg",
          currentMeeting ? "border-primary/50" : "border-dashed"
        )}
        onClick={handleOpenMeeting}
      >
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : currentMeeting ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">
                {currentMeeting.title || `Riunione ${currentWeek.label}`}
              </h3>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Creata il {format(parseISO(currentMeeting.created_at), "d MMM yyyy", { locale: it })}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium">Nessuna riunione per questa settimana</h3>
            {isCoordinator ? (
              <p className="text-sm text-muted-foreground mt-1">
                Tocca per creare la riunione
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">
                Il coordinatore non ha ancora creato la riunione
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Recent meetings list */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Riunioni recenti</h2>
        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-5 w-40" />
              </Card>
            ))
          ) : meetings && meetings.length > 0 ? (
            meetings.slice(0, 8).map(meeting => (
              <Card
                key={meeting.id}
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedMeetingId(meeting.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      Settimana {meeting.week_number}, {meeting.year}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(parseISO(meeting.week_start), "d MMM", { locale: it })} - 
                      {format(addWeeks(parseISO(meeting.week_start), 1), " d MMM", { locale: it })}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-6 text-center text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nessuna riunione passata</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
