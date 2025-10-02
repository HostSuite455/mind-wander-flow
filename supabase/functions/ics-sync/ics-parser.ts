// Robust iCal parser for calendar events
export interface CalendarEvent {
  uid?: string;
  start: string;
  end?: string;
  duration?: string; // ISO 8601 duration format (e.g., P1D, PT2H30M)
  summary?: string;
  description?: string;
  status?: string;
  dtstamp?: string;
}

export function parseICS(icsData: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const lines = icsData.split(/\r\n|\n|\r/).map(line => line.trim());
  
  let currentEvent: Partial<CalendarEvent> = {};
  let inEvent = false;
  let i = 0;
  
  while (i < lines.length) {
    let line = lines[i];
    
    // Handle line folding (lines that start with space or tab are continuations)
    while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
      i++;
      line += lines[i].substring(1); // Remove the leading space/tab
    }
    
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
    } else if (line === 'END:VEVENT') {
      if (inEvent && currentEvent.start) {
        events.push(currentEvent as CalendarEvent);
      }
      inEvent = false;
      currentEvent = {};
    } else if (inEvent && line.includes(':')) {
      const colonIndex = line.indexOf(':');
      const property = line.substring(0, colonIndex);
      const value = line.substring(colonIndex + 1);
      
      // Parse property name and parameters
      const [propName] = property.split(';');
      
      switch (propName.toUpperCase()) {
        case 'UID':
          currentEvent.uid = value;
          break;
        case 'DTSTART':
          currentEvent.start = parseDate(value, property);
          break;
        case 'DTEND':
          currentEvent.end = parseDate(value, property);
          break;
        case 'DURATION':
          currentEvent.duration = value; // Store raw ISO 8601 duration
          break;
        case 'SUMMARY':
          currentEvent.summary = unescapeText(value);
          break;
        case 'DESCRIPTION':
          currentEvent.description = unescapeText(value);
          break;
        case 'STATUS':
          currentEvent.status = value;
          break;
        case 'DTSTAMP':
          currentEvent.dtstamp = parseDate(value, property);
          break;
      }
    }
    
    i++;
  }
  
  return events;
}

function parseDate(value: string, property: string): string {
  if (!value) return '';
  
  // Check if it's a DATE-only value (YYYYMMDD)
  if (property.includes('VALUE=DATE') || /^\d{8}$/.test(value)) {
    // DATE format: YYYYMMDD -> YYYY-MM-DD
    if (value.length === 8) {
      return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
    }
  }
  
  // Handle DATETIME format: YYYYMMDDTHHMMSS[Z] -> YYYY-MM-DDTHH:MM:SS[Z]
  if (/^\d{8}T\d{6}Z?$/.test(value)) {
    const year = value.slice(0, 4);
    const month = value.slice(4, 6);
    const day = value.slice(6, 8);
    const hour = value.slice(9, 11);
    const minute = value.slice(11, 13);
    const second = value.slice(13, 15);
    const timezone = value.endsWith('Z') ? 'Z' : '';
    
    return `${year}-${month}-${day}T${hour}:${minute}:${second}${timezone}`;
  }
  
  // If it's already in a valid format, return as-is
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value;
  }
  
  // Try to parse as ISO date
  try {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]; // Return just the date part
    }
  } catch {
    // Ignore parsing errors
  }
  
  console.warn('Could not parse date:', value);
  return value; // Return original value if parsing fails
}

function unescapeText(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\')
    .replace(/\\;/g, ';')
    .replace(/\\,/g, ',');
}

// Parse ISO 8601 duration to days (used for calculating end date)
// Supports formats like: P1D, P7D, PT2H, PT90M, P1DT12H30M
export function parseDuration(duration: string): number {
  if (!duration || !duration.startsWith('P')) return 1; // Default 1 day
  
  let days = 0;
  let hours = 0;
  let minutes = 0;
  
  // Extract days: P(\d+)D
  const dayMatch = duration.match(/P(\d+)D/);
  if (dayMatch) days = parseInt(dayMatch[1]);
  
  // Extract time component after T
  const timeMatch = duration.match(/T(.+)/);
  if (timeMatch) {
    const timePart = timeMatch[1];
    
    // Extract hours: (\d+)H
    const hourMatch = timePart.match(/(\d+)H/);
    if (hourMatch) hours = parseInt(hourMatch[1]);
    
    // Extract minutes: (\d+)M
    const minMatch = timePart.match(/(\d+)M/);
    if (minMatch) minutes = parseInt(minMatch[1]);
  }
  
  // Convert everything to days (rounding up partial days)
  const totalDays = days + (hours / 24) + (minutes / 1440);
  return Math.max(1, Math.ceil(totalDays)); // Minimum 1 day
}