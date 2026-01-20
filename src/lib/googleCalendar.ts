import { format } from 'date-fns';

interface CalendarEventParams {
  title: string;
  emoji?: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
  location?: string;
}

/**
 * Generates a Google Calendar URL with pre-filled event details
 */
export function generateGoogleCalendarUrl(params: CalendarEventParams): string {
  const { title, emoji, startDate, endDate, description, location } = params;
  
  // Format title with emoji if provided
  const eventTitle = emoji ? `${emoji} ${title}` : title;
  
  // Format dates for Google Calendar (YYYYMMDDTHHmmss format)
  const formatDateForGoogle = (date: Date) => {
    return format(date, "yyyyMMdd'T'HHmmss");
  };
  
  // Default to 30 minute event if no end date provided
  const eventEndDate = endDate || new Date(startDate.getTime() + 30 * 60 * 1000);
  
  const dates = `${formatDateForGoogle(startDate)}/${formatDateForGoogle(eventEndDate)}`;
  
  // Build URL parameters
  const params_obj = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventTitle,
    dates: dates,
  });
  
  if (description) {
    params_obj.append('details', description);
  }
  
  if (location) {
    params_obj.append('location', location);
  }
  
  return `https://calendar.google.com/calendar/render?${params_obj.toString()}`;
}

/**
 * Generates a Google Calendar URL specifically for a notizia reminder
 */
export function generateNotiziaCalendarUrl(notizia: {
  name: string;
  emoji?: string;
  zona?: string;
  type?: string;
  notes?: string;
  reminder_date: Date;
}): string {
  // Build description from notizia details
  const descriptionParts: string[] = [];
  
  if (notizia.zona) {
    descriptionParts.push(`📍 Zona: ${notizia.zona}`);
  }
  
  if (notizia.type) {
    descriptionParts.push(`🏠 Tipo: ${notizia.type}`);
  }
  
  if (notizia.notes) {
    descriptionParts.push(`\n📝 Note:\n${notizia.notes}`);
  }
  
  return generateGoogleCalendarUrl({
    title: notizia.name,
    emoji: notizia.emoji,
    startDate: notizia.reminder_date,
    description: descriptionParts.length > 0 ? descriptionParts.join('\n') : undefined,
    location: notizia.zona,
  });
}
