// Lightweight client-side ICS parser
export interface CalendarEvent {
  uid?: string;
  start: string;
  end?: string;
  summary?: string;
  status?: string;
  dtstamp?: string;
}

export function parseICS(text: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const lines = text.split('\n').map(line => line.trim());
  
  let currentEvent: Partial<CalendarEvent> = {};
  let inEvent = false;
  
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
      continue;
    }
    
    if (line === 'END:VEVENT') {
      if (currentEvent.start) {
        events.push(currentEvent as CalendarEvent);
      }
      inEvent = false;
      currentEvent = {};
      continue;
    }
    
    if (!inEvent) continue;
    
    const [key, ...valueParts] = line.split(':');
    const value = valueParts.join(':');
    
    switch (key.split(';')[0]) {
      case 'UID':
        currentEvent.uid = value;
        break;
      case 'DTSTART':
        currentEvent.start = formatDate(value);
        break;
      case 'DTEND':
        currentEvent.end = formatDate(value);
        break;
      case 'SUMMARY':
        currentEvent.summary = value;
        break;
      case 'STATUS':
        currentEvent.status = value;
        break;
      case 'DTSTAMP':
        currentEvent.dtstamp = formatDate(value);
        break;
    }
  }
  
  return events;
}

function formatDate(dateString: string): string {
  // Handle various date formats: YYYYMMDD, YYYYMMDDTHHMMSS, YYYYMMDDTHHMMSSZ
  if (!dateString) return '';
  
  // Remove timezone info for simple parsing
  const cleanDate = dateString.replace(/[TZ]/g, match => match === 'T' ? 'T' : '');
  
  if (cleanDate.length === 8) {
    // YYYYMMDD
    return `${cleanDate.slice(0, 4)}-${cleanDate.slice(4, 6)}-${cleanDate.slice(6, 8)}`;
  } else if (cleanDate.length >= 15) {
    // YYYYMMDDTHHMMSS
    return `${cleanDate.slice(0, 4)}-${cleanDate.slice(4, 6)}-${cleanDate.slice(6, 8)}T${cleanDate.slice(9, 11)}:${cleanDate.slice(11, 13)}:${cleanDate.slice(13, 15)}`;
  }
  
  return dateString;
}