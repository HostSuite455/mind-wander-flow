/**
 * Channel color mappings for calendar events
 * Based on fullcalendar.css design tokens
 */

export interface ChannelColorConfig {
  name: string;
  icon: string;
  color: string; // HSL value for border
  bgColor: string; // HSL value with alpha for background
  textColor: string;
}

// Channel color definitions matching fullcalendar.css
export const CHANNEL_COLORS: Record<string, ChannelColorConfig> = {
  airbnb: {
    name: 'Airbnb',
    icon: '🏠',
    color: 'hsl(350, 84%, 60%)',
    bgColor: 'hsl(350, 84%, 60%, 0.18)',
    textColor: 'hsl(350, 84%, 40%)',
  },
  'booking.com': {
    name: 'Booking.com',
    icon: '🔵',
    color: 'hsl(223, 100%, 35%)',
    bgColor: 'hsl(223, 100%, 35%, 0.18)',
    textColor: 'hsl(223, 100%, 25%)',
  },
  vrbo: {
    name: 'Vrbo',
    icon: '🏖️',
    color: 'hsl(210, 65%, 40%)',
    bgColor: 'hsl(210, 65%, 40%, 0.18)',
    textColor: 'hsl(210, 65%, 30%)',
  },
  expedia: {
    name: 'Expedia',
    icon: '🏖️',
    color: 'hsl(210, 65%, 40%)',
    bgColor: 'hsl(210, 65%, 40%, 0.18)',
    textColor: 'hsl(210, 65%, 30%)',
  },
  smoobu: {
    name: 'Smoobu',
    icon: '🔄',
    color: 'hsl(262, 83%, 58%)', // var(--hostsuite-secondary)
    bgColor: 'hsl(262, 83%, 58%, 0.18)',
    textColor: 'hsl(262, 83%, 40%)',
  },
  agoda: {
    name: 'Agoda',
    icon: '🌏',
    color: 'hsl(215, 15%, 58%)',
    bgColor: 'hsl(215, 15%, 58%, 0.18)',
    textColor: 'hsl(215, 15%, 40%)',
  },
  tripadvisor: {
    name: 'TripAdvisor',
    icon: '🦉',
    color: 'hsl(215, 15%, 58%)',
    bgColor: 'hsl(215, 15%, 58%, 0.18)',
    textColor: 'hsl(215, 15%, 40%)',
  },
  other: {
    name: 'Altro',
    icon: '📅',
    color: 'hsl(215, 15%, 58%)',
    bgColor: 'hsl(215, 15%, 58%, 0.18)',
    textColor: 'hsl(215, 15%, 40%)',
  },
  manual: {
    name: 'Manuale',
    icon: '✏️',
    color: 'hsl(215, 15%, 58%)',
    bgColor: 'hsl(215, 15%, 58%, 0.18)',
    textColor: 'hsl(215, 15%, 40%)',
  },
};

/**
 * Detect channel from various sources
 */
export function detectChannel(
  source?: string,
  channel?: string,
  otaName?: string
): string {
  const searchStr = `${source} ${channel} ${otaName}`.toLowerCase();
  
  if (searchStr.includes('airbnb')) return 'airbnb';
  if (searchStr.includes('booking')) return 'booking.com';
  if (searchStr.includes('vrbo')) return 'vrbo';
  if (searchStr.includes('expedia')) return 'expedia';
  if (searchStr.includes('smoobu')) return 'smoobu';
  if (searchStr.includes('agoda')) return 'agoda';
  if (searchStr.includes('tripadvisor')) return 'tripadvisor';
  if (searchStr.includes('manual') || searchStr.includes('manuale')) return 'manual';
  
  return 'other';
}

/**
 * Get channel color config
 */
export function getChannelColor(channelKey: string): ChannelColorConfig {
  return CHANNEL_COLORS[channelKey] || CHANNEL_COLORS.other;
}

/**
 * Get CSS class for channel event
 */
export function getChannelEventClass(channelKey: string): string {
  const normalizedKey = channelKey.toLowerCase().replace(/\s+/g, '');
  return `calendar-event-${normalizedKey}`;
}

/**
 * Get all available channels as array
 */
export function getAllChannels(): ChannelColorConfig[] {
  return Object.values(CHANNEL_COLORS);
}
