// Advanced ICS parsing utilities for extracting booking metadata
import { CalendarEvent } from "@/lib/ics";

export interface IcsEventRaw {
  uid?: string;
  start?: string;
  end?: string;
  summary?: string;
  description?: string;
  status?: string;
  location?: string;
  // New fields for enhanced parsing
  attendees?: string[];   // ATTENDEE;CN=...
  organizer?: string;     // ORGANIZER;CN=...
  rawLines?: string[];    // for debug matching
}

export interface IcsEventEnriched extends IcsEventRaw {
  guestName?: string;
  guestsCount?: number;
  unitName?: string;
  channel?: 'airbnb' | 'booking.com' | 'vrbo' | 'smoobu' | 'other';
  statusHuman?: 'Confermato' | 'Provvisorio' | 'Cancellato' | 'Sconosciuto';
}

// Legacy interface for backward compatibility
export interface ParsedIcsEvent extends CalendarEvent {
  guest_name?: string;
  guests_count?: number;
  listing_title?: string;
  source_ref?: string;
  description?: string;
  attendees?: string[];
}

// Enhanced regex patterns for robust parsing (localized)
const rx = {
  // Lines in DESCRIPTION (common localizations)
  guestLine: /(guest(?: name)?|ospite|name)\s*[:=]\s*([^\n]+)/i,
  pax: /(guests?|ospiti|pax|persons?)\s*[:=]\s*(\d+)/i,
  adults: /adults?\s*[:=]\s*(\d+)/i,
  children: /child(?:ren)?|bambin[io]\s*[:=]\s*(\d+)/i,
  unit: /(apartment|appartamento|alloggio|unit|property|camera)\s*[:=]\s*([^\n]+)/i,
  // From SUMMARY: "Booking.com - Joanna Starczewska", "Airbnb: Mario Rossi"
  fromSummary: /(?:airbnb|booking\.com|vrbo|smoobu)\s*[-:]\s*([A-Za-zÀ-ÖØ-öø-ÿ''. \-]+)/i,
  // CN= Name from ATTENDEE/ORGANIZER
  cn: /CN=([^;:]+)/,
  bookingStyle: /^(.+?)\s*\((\d+)\)\s*$/i, // "Name (2)" format
  airbnbConfirmed: /reservation\s+confirmed\s*[–-]\s*(.+)/i,
};

function detectChannel(summary?: string, desc?: string, location?: string): IcsEventEnriched['channel'] {
  const s = `${summary ?? ''} ${desc ?? ''} ${location ?? ''}`.toLowerCase();
  if (s.includes('booking.com')) return 'booking.com';
  if (s.includes('airbnb')) return 'airbnb';
  if (s.includes('vrbo')) return 'vrbo';
  if (s.includes('smoobu')) return 'smoobu';
  return 'other';
}

function mapStatus(status?: string): IcsEventEnriched['statusHuman'] {
  const s = (status || '').toLowerCase();
  if (s.includes('cancel')) return 'Cancellato';
  if (s.includes('tent')) return 'Provvisorio';
  if (s) return 'Confermato';
  return 'Sconosciuto';
}

export function enrichIcsEvent(ev: IcsEventRaw): IcsEventEnriched {
  const channel = detectChannel(ev.summary, ev.description, ev.location);
  const desc = (ev.description || '').replace(/\\n/g, '\n');

  // 1) guestName from ATTENDEE/ORGANIZER (CN=...)
  let guestName: string | undefined;
  const searchCN = (lines?: string[]) => {
    if (!lines) return undefined;
    for (const ln of lines) {
      if (ln.startsWith('ATTENDEE') || ln.startsWith('ORGANIZER')) {
        const m = ln.match(rx.cn);
        if (m) return m[1].trim();
      }
    }
    return undefined;
  };
  guestName = searchCN(ev.rawLines);

  // 2) fallback: from DESCRIPTION
  if (!guestName) {
    const m = desc.match(rx.guestLine);
    if (m) guestName = m[2].trim();
  }

  // 3) fallback: from SUMMARY "Channel - Name"
  if (!guestName && ev.summary) {
    const m = ev.summary.match(rx.fromSummary);
    if (m) guestName = m[1].trim();
  }

  // 4) Try Booking.com style "Name (2)" 
  if (!guestName && ev.summary) {
    const bookingMatch = ev.summary.match(rx.bookingStyle);
    if (bookingMatch) guestName = bookingMatch[1].trim();
  }
  
  // 5) Try Airbnb confirmed style
  if (!guestName && ev.summary) {
    const airbnbMatch = ev.summary.match(rx.airbnbConfirmed);
    if (airbnbMatch) guestName = airbnbMatch[1].trim();
  }

  // 6) For "Not available" events, try to extract from location or show as blocked
  if (!guestName && ev.summary === 'Not available') {
    guestName = 'Occupato';
  }

  // guests count
  let guestsCount: number | undefined;
  const mPax = desc.match(rx.pax);
  if (mPax) guestsCount = parseInt(mPax[2], 10);
  else {
    let tot = 0;
    const a = desc.match(rx.adults);
    const c = desc.match(rx.children);
    if (a) tot += parseInt(a[1], 10);
    if (c) tot += parseInt(c[1], 10);
    if (tot > 0) guestsCount = tot;
  }

  // unit name
  let unitName: string | undefined;
  const mUnit = desc.match(rx.unit);
  if (mUnit) unitName = mUnit[2].trim();

  return {
    ...ev,
    channel,
    guestName,
    guestsCount,
    unitName,
    statusHuman: mapStatus(ev.status),
  };
}

// Legacy function for backward compatibility
export function enrichIcsEventLegacy(rawEvent: CalendarEvent, description?: string, attendees?: string[]): ParsedIcsEvent {
  const enriched = enrichIcsEvent({
    ...rawEvent,
    description
  });
  
  return {
    ...rawEvent,
    guest_name: enriched.guestName,
    guests_count: enriched.guestsCount,
    listing_title: enriched.unitName,
    description,
    attendees
  };
}

function extractGuestName(summary: string, description: string, attendees: string[]): string | undefined {
  const text = [summary, description].join(' ');
  
  // Try attendee CN field first (most reliable)
  for (const attendee of attendees) {
    const cnMatch = attendee.match(/CN=([^;:]+)/i);
    if (cnMatch) {
      return cnMatch[1].trim();
    }
  }
  
  // Try ORGANIZER CN field
  const organizerMatch = text.match(/ORGANIZER[^:]*CN=([^;:]+)/i);
  if (organizerMatch) {
    return organizerMatch[1].trim();
  }
  
  // Booking.com style: "Name (2)" in summary
  const bookingStyleMatch = summary.match(/^(.+?)\s*\((\d+)\)\s*$/i);
  if (bookingStyleMatch && bookingStyleMatch[1]) {
    const name = bookingStyleMatch[1].trim();
    if (name.length >= 2 && name.length <= 50) {
      return name;
    }
  }
  
  // Airbnb confirmed style: "Reservation confirmed – John Doe"
  const airbnbConfirmedMatch = summary.match(/reservation\s+confirmed\s*[–-]\s*(.+)/i);
  if (airbnbConfirmedMatch && airbnbConfirmedMatch[1]) {
    return airbnbConfirmedMatch[1].trim();
  }
  
  // Common patterns for guest names
  const patterns = [
    /primary\s+guest:?\s*([a-zA-ZÀ-ÿ\s]+?)(?:\n|$|,|\d)/i,
    /guest:?\s*([a-zA-ZÀ-ÿ\s]+?)(?:\n|$|,|\d)/i,
    /ospite:?\s*([a-zA-ZÀ-ÿ\s]+?)(?:\n|$|,|\d)/i,
    /prenotazione\s+di:?\s*([a-zA-ZÀ-ÿ\s]+?)(?:\n|$|,|\d)/i,
    /booked\s+by:?\s*([a-zA-ZÀ-ÿ\s]+?)(?:\n|$|,|\d)/i,
    /name:?\s*([a-zA-ZÀ-ÿ\s]+?)(?:\n|$|,|\d)/i,
    /nome:?\s*([a-zA-ZÀ-ÿ\s]+?)(?:\n|$|,|\d)/i,
    // Airbnb pattern: "Guest Name - Listing Name"
    /^([a-zA-ZÀ-ÿ\s]+?)\s*-\s*[^-]+$/i,
    // Generic start pattern for name-like strings
    /^([a-zA-ZÀ-ÿ\s]{2,30}?)(?:\s*-|\s*\d|\s*\(|$)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      // Filter out common false positives
      if (name.length >= 2 && name.length <= 50 && 
          !name.match(/^(apartment|listing|booking|guest|ospite|prenotazione|confirmed|reservation)$/i)) {
        return name;
      }
    }
  }
  
  return undefined;
}

function extractGuestCount(text: string): number | undefined {
  // Check for Booking.com style: "Name (2)" in summary first
  const bookingStyleMatch = text.match(/\((\d+)\)/);
  if (bookingStyleMatch) {
    const count = parseInt(bookingStyleMatch[1], 10);
    if (count > 0 && count <= 50) {
      return count;
    }
  }
  
  const patterns = [
    /number\s+of\s+guests?:?\s*(\d+)/i,
    /guests?:?\s*(\d+)/i,
    /ospiti:?\s*(\d+)/i,
    /adults?:?\s*(\d+)/i,
    /pax:?\s*(\d+)/i,
    /persone:?\s*(\d+)/i,
    /(\d+)\s*guests?/i,
    /(\d+)\s*ospiti/i,
    /(\d+)\s*adults?/i,
    /(\d+)\s*pax/i,
    /(\d+)\s+people/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const count = parseInt(match[1], 10);
      if (count > 0 && count <= 50) { // Reasonable range
        return count;
      }
    }
  }
  
  return undefined;
}

function extractListingTitle(summary: string, description: string): string | undefined {
  const text = [summary, description].join(' ');
  
  const patterns = [
    /listing:?\s*([^,\n]+)/i,
    /appartamento:?\s*([^,\n]+)/i,
    /property:?\s*([^,\n]+)/i,
    /proprietà:?\s*([^,\n]+)/i,
    // Smoobu pattern: often "Listing Name: Guest Details"
    /^([^:]+?):\s*\w+/i,
    // Airbnb pattern: "Guest Name - Listing Name"
    /^[^-]+-\s*(.+)$/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const title = match[1].trim();
      if (title.length >= 3 && title.length <= 100) {
        return title;
      }
    }
  }
  
  // If no specific pattern matches, try to use first part of summary if it looks like a property name
  const summaryParts = summary.split(/[-:]/);
  if (summaryParts.length > 1) {
    const firstPart = summaryParts[0].trim();
    if (firstPart.length >= 3 && firstPart.length <= 50 && 
        !firstPart.match(/^\d+$/) && // Not just numbers
        !firstPart.match(/^(guest|ospite|booking|prenotazione)$/i)) {
      return firstPart;
    }
  }
  
  return undefined;
}

function extractSourceRef(text: string): string | undefined {
  const patterns = [
    /reservation:?\s*([A-Z0-9\-_]+)/i,
    /booking:?\s*([A-Z0-9\-_]+)/i,
    /codice:?\s*([A-Z0-9\-_]+)/i,
    /ref:?\s*([A-Z0-9\-_]+)/i,
    /id:?\s*([A-Z0-9\-_]+)/i,
    /confirmation:?\s*([A-Z0-9\-_]+)/i,
    /conferma:?\s*([A-Z0-9\-_]+)/i,
    // Common booking ID patterns
    /\b([A-Z]{2,4}\d{6,12})\b/,
    /\b(HM\w{8,})\b/, // Airbnb pattern
    /\b(\d{8,12})\b/, // Numeric booking IDs
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const ref = match[1].trim();
      if (ref.length >= 4 && ref.length <= 50) {
        return ref;
      }
    }
  }
  
  return undefined;
}

// Enhanced ICS parser with ATTENDEE/ORGANIZER + raw lines
function parseICS(text: string): IcsEventRaw[] {
  const events: IcsEventRaw[] = [];
  const lines = text.split('\n').map(line => line.trim());
  
  let currentEvent: Partial<IcsEventRaw> = {};
  let inEvent = false;
  let description = '';
  let attendees: string[] = [];
  let organizer = '';
  let rawLines: string[] = [];
  
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
      description = '';
      attendees = [];
      organizer = '';
      rawLines = [];
      continue;
    }
    
    if (line === 'END:VEVENT') {
      if (currentEvent.start) {
        // Add all collected data to event
        const completeEvent: IcsEventRaw = {
          ...currentEvent,
          description,
          attendees: attendees.length > 0 ? attendees : undefined,
          organizer: organizer || undefined,
          rawLines: rawLines.length > 0 ? rawLines : undefined
        } as IcsEventRaw;
        
        events.push(completeEvent);
      }
      inEvent = false;
      currentEvent = {};
      continue;
    }
    
    if (!inEvent) continue;
    
    // Save raw line for debug
    rawLines.push(line);
    
    const [key, ...valueParts] = line.split(':');
    const value = valueParts.join(':');
    const keyBase = key.split(';')[0];
    
    switch (keyBase) {
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
      case 'LOCATION':
        currentEvent.location = value;
        break;
      case 'DESCRIPTION':
        description = value.replace(/\\n/g, '\n').replace(/\\,/g, ',');
        break;
      case 'ATTENDEE':
        attendees.push(line);
        break;
      case 'ORGANIZER':
        organizer = line;
        break;
    }
  }
  
  return events;
}

// API di comodo: parse + enrich
export function parseAndEnrichICS(text: string): IcsEventEnriched[] {
  const base = parseICS(text);
  return base.map(enrichIcsEvent);
}

// Legacy function for backward compatibility
export function parseICSWithMetadata(text: string): ParsedIcsEvent[] {
  const enriched = parseAndEnrichICS(text);
  return enriched.map(ev => ({
    uid: ev.uid,
    start: ev.start,
    end: ev.end,
    summary: ev.summary,
    status: ev.status,
    dtstamp: ev.start, // fallback
    guest_name: ev.guestName,
    guests_count: ev.guestsCount,
    listing_title: ev.unitName,
    description: ev.description,
    attendees: []
  }));
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