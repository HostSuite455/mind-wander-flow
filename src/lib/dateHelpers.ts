import { isToday, isTomorrow, isYesterday, formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

export const getRelativeDateString = (date: Date): string => {
  if (isToday(date)) return 'Oggi';
  if (isTomorrow(date)) return 'Domani';
  if (isYesterday(date)) return 'Ieri';
  
  return formatDistanceToNow(date, { 
    addSuffix: true, 
    locale: it 
  });
};

export const getDateStatus = (date: Date): 'past' | 'today' | 'tomorrow' | 'future' => {
  if (isToday(date)) return 'today';
  if (isTomorrow(date)) return 'tomorrow';
  if (date < new Date()) return 'past';
  return 'future';
};

export const formatTimeRange = (checkIn: string, checkOut: string): string => {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
  const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return `${nights} notte${nights !== 1 ? 'i' : ''}`;
};

export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
};

export const getSeasonFromDate = (date: Date): 'spring' | 'summer' | 'autumn' | 'winter' => {
  const month = date.getMonth() + 1;
  
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
};

export const getDaysBetween = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const timeDiff = end.getTime() - start.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};