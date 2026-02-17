import { useState, useMemo } from 'react';
import { format, parseISO, startOfWeek, addWeeks, subWeeks, getMonth, getYear } from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Users, Filter, Pencil, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useMeetings, getWeekInfo } from '@/hooks/useMeetings';
import { useAuth } from '@/hooks/useAuth';
import { MeetingDetail } from './MeetingDetail';
import { cn } from '@/lib/utils';

const MONTHS = [
{ value: '0', label: 'Gennaio' },
{ value: '1', label: 'Febbraio' },
{ value: '2', label: 'Marzo' },
{ value: '3', label: 'Aprile' },
{ value: '4', label: 'Maggio' },
{ value: '5', label: 'Giugno' },
{ value: '6', label: 'Luglio' },
{ value: '7', label: 'Agosto' },
{ value: '8', label: 'Settembre' },
{ value: '9', label: 'Ottobre' },
{ value: '10', label: 'Novembre' },
{ value: '11', label: 'Dicembre' }];


export const MeetingsPage = () => {
  const { profile } = useAuth();
  const isCoordinator = profile?.role === 'coordinatore' || profile?.role === 'admin';
  const sede = profile?.sede || 'AREZZO';

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>(String(getYear(new Date())));
  const [editingMeeting, setEditingMeeting] = useState<{id: string;title: string;weekStart: Date;} | null>(null);
  const [deletingMeetingId, setDeletingMeetingId] = useState<string | null>(null);

  const { meetings, isLoading, createOrGetMeeting, updateMeeting, deleteMeeting, duplicateMeeting } = useMeetings(sede);

  const currentWeek = getWeekInfo(selectedDate);

  // Find meeting for current week
  const currentMeeting = meetings?.find((m) => m.week_start === currentWeek.weekStart);

  // Get available years from meetings
  const availableYears = useMemo(() => {
    if (!meetings) return [String(getYear(new Date()))];
    const years = [...new Set(meetings.map((m) => String(m.year)))];
    if (!years.includes(String(getYear(new Date())))) {
      years.push(String(getYear(new Date())));
    }
    return years.sort((a, b) => Number(b) - Number(a));
  }, [meetings]);

  // Filter meetings by month and year
  const filteredMeetings = useMemo(() => {
    if (!meetings) return [];

    return meetings.filter((m) => {
      const meetingDate = parseISO(m.week_start);
      const meetingYear = getYear(meetingDate);
      const meetingMonth = getMonth(meetingDate);

      if (String(meetingYear) !== filterYear) return false;
      if (filterMonth !== 'all' && meetingMonth !== Number(filterMonth)) return false;

      return true;
    });
  }, [meetings, filterMonth, filterYear]);

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
        title: `Riunione ${currentWeek.label}`
      });
      setSelectedMeetingId(id);
    }
  };

  if (selectedMeetingId) {
    return (
      <MeetingDetail
        meetingId={selectedMeetingId}
        onBack={() => setSelectedMeetingId(null)} />);


  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header with week navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="tracking-wide uppercase text-xl font-medium">Riunioni Settimanali</h1>
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
            <CalendarIcon className="h-4 w-4 mr-2" />
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
        onClick={handleOpenMeeting}>

        {isLoading ?
        <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div> :
        currentMeeting ?
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
          </div> :

        <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium">Nessuna riunione per questa settimana</h3>
            {isCoordinator ?
          <p className="text-sm text-muted-foreground mt-1">
                Tocca per creare la riunione
              </p> :

          <p className="text-sm text-muted-foreground mt-1">
                Il coordinatore non ha ancora creato la riunione
              </p>
          }
          </div>
        }
      </Card>

      {/* Filters and meetings list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium text-base">Riunioni</h2>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue placeholder="Mese" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i mesi</SelectItem>
                {MONTHS.map((m) =>
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                )}
              </SelectContent>
            </Select>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-[90px] h-9">
                <SelectValue placeholder="Anno" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((y) =>
                <SelectItem key={y} value={y}>{y}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          {isLoading ?
          Array.from({ length: 3 }).map((_, i) =>
          <Card key={i} className="p-4">
                <Skeleton className="h-5 w-40" />
              </Card>
          ) :
          filteredMeetings.length > 0 ?
          filteredMeetings.map((meeting) =>
          <Card
            key={meeting.id}
            className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setSelectedMeetingId(meeting.id)}>

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
                  <div className="flex items-center gap-1">
                    <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Duplica per questa settimana"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const newId = await duplicateMeeting.mutateAsync(meeting.id);
                    if (newId) setSelectedMeetingId(newId);
                  }}>

                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingMeeting({
                      id: meeting.id,
                      title: meeting.title || `Riunione Settimana ${meeting.week_number}`,
                      weekStart: parseISO(meeting.week_start)
                    });
                  }}>

                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingMeetingId(meeting.id);
                  }}>

                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Card>
          ) :

          <Card className="p-6 text-center text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nessuna riunione per {filterMonth === 'all' ? 'questo periodo' : MONTHS[Number(filterMonth)]?.label + ' ' + filterYear}</p>
            </Card>
          }
        </div>
      </div>

      {/* Edit Meeting Dialog */}
      <Dialog open={!!editingMeeting} onOpenChange={() => setEditingMeeting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Riunione</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titolo</Label>
              <Input
                value={editingMeeting?.title || ''}
                onChange={(e) => setEditingMeeting((prev) => prev ? { ...prev, title: e.target.value } : null)}
                placeholder="Titolo riunione" />

            </div>
            <div className="space-y-2">
              <Label>Settimana</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editingMeeting?.weekStart ?
                    <>
                        {format(startOfWeek(editingMeeting.weekStart, { weekStartsOn: 1 }), "d MMM", { locale: it })} - 
                        {format(addWeeks(startOfWeek(editingMeeting.weekStart, { weekStartsOn: 1 }), 1), " d MMM yyyy", { locale: it })}
                      </> :

                    <span>Seleziona settimana</span>
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editingMeeting?.weekStart}
                    onSelect={(date) => {
                      if (date) {
                        setEditingMeeting((prev) => prev ? { ...prev, weekStart: date } : null);
                      }
                    }}
                    locale={it}
                    className={cn("p-3 pointer-events-auto")} />

                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Seleziona un giorno qualsiasi della settimana desiderata
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMeeting(null)}>Annulla</Button>
            <Button
              onClick={() => {
                if (editingMeeting) {
                  const weekInfo = getWeekInfo(editingMeeting.weekStart);
                  updateMeeting.mutate({
                    id: editingMeeting.id,
                    title: editingMeeting.title,
                    week_start: weekInfo.weekStart,
                    week_number: weekInfo.weekNumber,
                    year: weekInfo.year
                  });
                  setEditingMeeting(null);
                }
              }}>

              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Meeting Confirmation */}
      <AlertDialog open={!!deletingMeetingId} onOpenChange={() => setDeletingMeetingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questa riunione?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione è irreversibile. Tutti gli elementi della riunione verranno eliminati.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingMeetingId) {
                  deleteMeeting.mutate(deletingMeetingId);
                  setDeletingMeetingId(null);
                }
              }}>

              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);

};