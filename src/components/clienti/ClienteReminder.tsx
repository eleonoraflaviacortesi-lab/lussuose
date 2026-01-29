import { memo, useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bell, Calendar as CalendarIcon, Clock, ExternalLink, X, AlertCircle } from 'lucide-react';
import { format, differenceInDays, isPast, isToday, isTomorrow } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ClienteReminderProps {
  clienteId: string;
  clienteName: string;
  clientePhone?: string | null;
  clientePaese?: string | null;
  reminderDate: string | null;
  lastContactDate: string | null;
  onUpdateReminder: (date: string | null) => void;
}

// Generate Google Calendar URL for cliente reminder
function generateClienteCalendarUrl(cliente: {
  name: string;
  phone?: string | null;
  paese?: string | null;
  reminderDate: Date;
}): string {
  const formatDateForGoogle = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
  };

  const eventEndDate = new Date(cliente.reminderDate.getTime() + 30 * 60 * 1000);
  const dates = `${formatDateForGoogle(cliente.reminderDate)}/${formatDateForGoogle(eventEndDate)}`;

  const descriptionParts: string[] = [];
  if (cliente.phone) descriptionParts.push(`📞 ${cliente.phone}`);
  if (cliente.paese) descriptionParts.push(`🌍 ${cliente.paese}`);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `🏠 Follow-up: ${cliente.name}`,
    dates,
  });

  if (descriptionParts.length > 0) {
    params.append('details', descriptionParts.join('\n'));
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

const timeOptions = [
  { value: '09:00', label: '09:00' },
  { value: '10:00', label: '10:00' },
  { value: '11:00', label: '11:00' },
  { value: '12:00', label: '12:00' },
  { value: '14:00', label: '14:00' },
  { value: '15:00', label: '15:00' },
  { value: '16:00', label: '16:00' },
  { value: '17:00', label: '17:00' },
  { value: '18:00', label: '18:00' },
];

export const ClienteReminder = memo(({
  clienteId,
  clienteName,
  clientePhone,
  clientePaese,
  reminderDate,
  lastContactDate,
  onUpdateReminder,
}: ClienteReminderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    reminderDate ? new Date(reminderDate) : undefined
  );
  const [selectedTime, setSelectedTime] = useState(
    reminderDate ? format(new Date(reminderDate), 'HH:00') : '10:00'
  );

  const handleSave = useCallback(() => {
    if (selectedDate) {
      const [hours] = selectedTime.split(':').map(Number);
      const dateWithTime = new Date(selectedDate);
      dateWithTime.setHours(hours, 0, 0, 0);
      onUpdateReminder(dateWithTime.toISOString());
    }
    setIsOpen(false);
  }, [selectedDate, selectedTime, onUpdateReminder]);

  const handleRemove = useCallback(() => {
    setSelectedDate(undefined);
    onUpdateReminder(null);
    setIsOpen(false);
  }, [onUpdateReminder]);

  // Calculate days since last contact
  const daysSinceContact = useMemo(() => {
    if (!lastContactDate) return null;
    return differenceInDays(new Date(), new Date(lastContactDate));
  }, [lastContactDate]);

  // Reminder status
  const reminderStatus = useMemo(() => {
    if (!reminderDate) return null;
    const date = new Date(reminderDate);
    if (isPast(date) && !isToday(date)) return 'overdue';
    if (isToday(date)) return 'today';
    if (isTomorrow(date)) return 'tomorrow';
    return 'scheduled';
  }, [reminderDate]);

  const reminderBadge = useMemo(() => {
    if (!reminderStatus) return null;
    
    switch (reminderStatus) {
      case 'overdue':
        return { label: 'Scaduto', variant: 'destructive' as const };
      case 'today':
        return { label: 'Oggi', variant: 'default' as const };
      case 'tomorrow':
        return { label: 'Domani', variant: 'secondary' as const };
      case 'scheduled':
        return { 
          label: format(new Date(reminderDate!), 'dd MMM', { locale: it }), 
          variant: 'outline' as const 
        };
      default:
        return null;
    }
  }, [reminderStatus, reminderDate]);

  return (
    <div className="space-y-3">
      {/* Last contact indicator */}
      {daysSinceContact !== null && daysSinceContact > 7 && (
        <div className="flex items-center gap-2 text-amber-600 text-xs bg-amber-50 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            Cliente non contattato da <strong>{daysSinceContact}</strong> giorni
          </span>
        </div>
      )}

      {/* Current reminder */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className={cn(
            "w-4 h-4",
            reminderStatus === 'overdue' ? 'text-destructive' : 
            reminderStatus === 'today' ? 'text-primary' : 'text-muted-foreground'
          )} />
          <span className="text-sm font-medium">Promemoria</span>
          {reminderBadge && (
            <Badge variant={reminderBadge.variant} className="text-[10px]">
              {reminderBadge.label}
            </Badge>
          )}
        </div>

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs">
              {reminderDate ? (
                <>
                  <CalendarIcon className="w-3 h-3 mr-1" />
                  {format(new Date(reminderDate), 'dd/MM HH:mm', { locale: it })}
                </>
              ) : (
                <>
                  <CalendarIcon className="w-3 h-3 mr-1" />
                  Imposta
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="end">
            <div className="space-y-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={it}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                className="rounded-md border"
              />
              
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger className="w-full h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                {reminderDate && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-destructive"
                    onClick={handleRemove}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Rimuovi
                  </Button>
                )}
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={handleSave}
                  disabled={!selectedDate}
                >
                  Salva
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Google Calendar button */}
      {reminderDate && (
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs h-8"
          onClick={() => {
            const url = generateClienteCalendarUrl({
              name: clienteName,
              phone: clientePhone,
              paese: clientePaese,
              reminderDate: new Date(reminderDate),
            });
            window.open(url, '_blank');
          }}
        >
          <ExternalLink className="w-3 h-3 mr-2" />
          Aggiungi a Google Calendar
        </Button>
      )}

      {/* Last contact info */}
      {lastContactDate && (
        <div className="text-[10px] text-muted-foreground">
          Ultimo contatto: {format(new Date(lastContactDate), 'dd MMM yyyy', { locale: it })}
        </div>
      )}
    </div>
  );
});
ClienteReminder.displayName = 'ClienteReminder';

export default ClienteReminder;
