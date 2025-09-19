// Advanced ICS parsing utilities for extracting booking metadata
import { CalendarEvent } from "@/lib/ics";

export interface ParsedIcsEvent extends CalendarEvent {
  guest_name?: string;
  guests_count?: number;
  listing_title?: string;
  source_ref?: string;
  description?: string;
  attendees?: string[];
}

export function enrichIcsEvent(rawEvent: CalendarEvent, description?: string, attendees?: string[]): ParsedIcsEvent {
  const event: ParsedIcsEvent = { ...rawEvent };
  
  // Combine all text fields for pattern matching (case-insensitive)
  const allText = [
    rawEvent.summary || '',
    description || '',
    ...(attendees || [])
  ].join(' ').toLowerCase();
  
  const summary = rawEvent.summary || '';
  const desc = description || '';
  
  // Extract guest name using various patterns
  event.guest_name = extractGuestName(summary, desc, attendees || []);
  
  // Extract guest count
  event.guests_count = extractGuestCount(allText);
  
  // Extract listing title
  event.listing_title = extractListingTitle(summary, desc);
  
  // Extract booking reference/ID
  event.source_ref = extractSourceRef(allText);
  
  // Store original description and attendees
  event.description = description;
  event.attendees = attendees;
  
  return event;
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

// Enhanced ICS parser that captures more fields
export function parseICSWithMetadata(text: string): ParsedIcsEvent[] {
  const events: ParsedIcsEvent[] = [];
  const lines = text.split('\n').map(line => line.trim());
  
  let currentEvent: Partial<ParsedIcsEvent> = {};
  let inEvent = false;
  let description = '';
  let attendees: string[] = [];
  
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
      description = '';
      attendees = [];
      continue;
    }
    
    if (line === 'END:VEVENT') {
      if (currentEvent.start) {
        // Enrich the event with extracted metadata
        const enriched = enrichIcsEvent(currentEvent as CalendarEvent, description, attendees);
        events.push(enriched);
      }
      inEvent = false;
      currentEvent = {};
      continue;
    }
    
    if (!inEvent) continue;
    
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
      case 'DTSTAMP':
        currentEvent.dtstamp = formatDate(value);
        break;
      case 'DESCRIPTION':
        description = value.replace(/\\n/g, '\n').replace(/\\,/g, ',');
        break;
      case 'ATTENDEE':
        attendees.push(value);
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