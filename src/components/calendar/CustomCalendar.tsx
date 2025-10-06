import React from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
  differenceInDays,
  getDay
} from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight,
  Calendar as CalendarIcon,
  Plane,
  Building2,
  Users
} from 'lucide-react';
import { BookingDetailsPopover } from './BookingDetailsPopover';

// Types
interface Property {
  id: string;
  name: string;
  address?: string;
}

interface Booking {
  id: string;
  property_id: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  total_amount?: number;
}

interface CalendarBlock {
  id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  source: string;
  is_active: boolean;
  guest_name?: string | null;
  total_guests?: number | null;
}

export interface CustomCalendarProps {
  properties: Property[];
  bookings: Booking[];
  blocks: CalendarBlock[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  selectedPropertyId?: string | null;
  onPropertyChange: (propertyId: string | null) => void;
}

type BookingOrBlock = CalendarBlock | (Booking & { start_date: string; end_date: string; source: string; reason?: string; guest_name: string; total_guests?: number | null });

// Helper functions
const getSourceColor = (source: string): string => {
  const lowerSource = source?.toLowerCase() || '';
  if (lowerSource.includes('airbnb')) return 'bg-[#FF5A5F]';
  if (lowerSource.includes('booking')) return 'bg-[#003580]';
  if (lowerSource.includes('vrbo') || lowerSource.includes('homeaway')) return 'bg-[#006FB9]';
  if (lowerSource.includes('smoobu')) return 'bg-[#5B21B6]';
  return 'bg-slate-600';
};

const getSourceIcon = (source: string) => {
  const lowerSource = source?.toLowerCase() || '';
  if (lowerSource.includes('airbnb')) return Plane;
  if (lowerSource.includes('booking')) return Building2;
  return CalendarIcon;
};

const CustomCalendar: React.FC<CustomCalendarProps> = ({
  properties,
  bookings,
  blocks,
  currentDate,
  onDateChange,
  selectedPropertyId
}) => {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(currentDate || new Date());

  React.useEffect(() => {
    if (currentDate && !isNaN(currentDate.getTime())) {
      setCurrentMonth(currentDate);
    }
  }, [currentDate]);

  // Generate 4 consecutive months
  const months = Array.from({ length: 4 }, (_, i) => addMonths(currentMonth, i));

  // Normalize bookings and blocks to unified format
  const normalizedEvents: BookingOrBlock[] = [
    ...bookings.map(b => ({
      ...b,
      start_date: b.check_in,
      end_date: b.check_out,
      source: 'booking.com',
      guest_name: b.guest_name,
      total_guests: null
    })),
    ...blocks.filter(b => b.is_active !== false && !!b.start_date && !!b.end_date)
  ];

  const handlePrevMonth = () => {
    const newDate = subMonths(currentMonth, 1);
    setCurrentMonth(newDate);
    onDateChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = addMonths(currentMonth, 1);
    setCurrentMonth(newDate);
    onDateChange(newDate);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onDateChange(today);
  };

  // Render a single booking/block bar positioned across days
  const renderEventBar = (event: BookingOrBlock, monthStart: Date, monthEnd: Date) => {
    // Hotel logic: check-in Oct 9 → bar starts from 50% of Oct 9
    // check-out Oct 11 → bar ends at 50% of Oct 11
    const eventStart = parseISO(event.start_date);
    const eventEnd = parseISO(event.end_date);
    
    // Calculate boundaries for this month
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    // Skip if event doesn't overlap with this month's view
    if (eventEnd < calendarStart || eventStart > calendarEnd) return null;

    const visibleStart = eventStart < calendarStart ? calendarStart : eventStart;
    const visibleEnd = eventEnd > calendarEnd ? calendarEnd : eventEnd;

    // Calculate day index within the month grid (0-based from calendar start)
    const startDayIndex = differenceInDays(visibleStart, calendarStart);
    const endDayIndex = differenceInDays(visibleEnd, calendarStart);

    // Calculate row and column positions
    const startRow = Math.floor(startDayIndex / 7);
    const startCol = startDayIndex % 7;
    const endRow = Math.floor(endDayIndex / 7);
    const endCol = endDayIndex % 7;

    // For now, only render single-row events (multi-row would need separate handling)
    if (startRow !== endRow) {
      // Render first segment ending at end of week
      const firstSegmentEnd = (startRow + 1) * 7 - 1;
      const SourceIcon = getSourceIcon(event.source);
      
      return (
        <BookingDetailsPopover
          key={`${event.id}-${startRow}`}
          booking={{
            id: event.id,
            guest_name: event.guest_name || event.reason || 'Ospite',
            total_guests: event.total_guests,
            start_date: event.start_date,
            end_date: event.end_date,
            source: event.source || 'manual',
            reason: event.reason
          }}
          property={{ 
            name: properties.find(p => p.id === event.property_id)?.name || 'Proprietà', 
            address: properties.find(p => p.id === event.property_id)?.address || '' 
          }}
          isHost={true}
          onEdit={() => console.log('Edit', event.id)}
          onCancel={() => console.log('Cancel', event.id)}
        >
          <div
            className={`
              h-7 flex items-center px-2 text-white text-[10px] font-medium
              ${getSourceColor(event.source)}
              rounded-l-full hover:opacity-90 transition-opacity cursor-pointer shadow-sm
            `}
            style={{
              gridRow: startRow + 2,
              gridColumn: `${startCol + 1} / 8`,
              alignSelf: 'center',
              marginLeft: eventStart >= calendarStart ? '50%' : '0',
              marginRight: '0',
              zIndex: 10
            }}
          >
            <SourceIcon className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate">{event.guest_name || event.reason}</span>
            {event.total_guests && (
              <span className="ml-1 flex items-center">
                <Users className="w-3 h-3 mr-0.5" />
                {event.total_guests}
              </span>
            )}
          </div>
        </BookingDetailsPopover>
      );
    }

    const SourceIcon = getSourceIcon(event.source);
    const isStartVisible = eventStart >= calendarStart;
    const isEndVisible = eventEnd <= calendarEnd;

    return (
      <BookingDetailsPopover
        key={event.id}
          booking={{
            id: event.id,
            guest_name: event.guest_name || event.reason || 'Ospite',
            total_guests: event.total_guests,
            start_date: event.start_date,
            end_date: event.end_date,
            source: event.source || 'manual',
            reason: event.reason
          }}
          property={{ 
            name: properties.find(p => p.id === event.property_id)?.name || 'Proprietà', 
            address: properties.find(p => p.id === event.property_id)?.address || '' 
          }}
        isHost={true}
        onEdit={() => console.log('Edit', event.id)}
        onCancel={() => console.log('Cancel', event.id)}
      >
        <div
          className={`
            h-7 flex items-center px-2 text-white text-[10px] font-medium
            ${getSourceColor(event.source)}
            ${isStartVisible && isEndVisible ? 'rounded-full' : ''}
            ${isStartVisible && !isEndVisible ? 'rounded-l-full' : ''}
            ${!isStartVisible && isEndVisible ? 'rounded-r-full' : ''}
            hover:opacity-90 transition-opacity cursor-pointer shadow-sm
          `}
          style={{
            gridRow: startRow + 2,
            gridColumn: `${startCol + 1} / ${endCol + 2}`,
            alignSelf: 'center',
            marginLeft: isStartVisible ? '50%' : '0',
            marginRight: isEndVisible ? '50%' : '0',
            zIndex: 10
          }}
        >
          <SourceIcon className="w-3 h-3 mr-1 flex-shrink-0" />
          <span className="truncate">{event.guest_name || event.reason}</span>
          {event.total_guests && (
            <span className="ml-1 flex items-center flex-shrink-0">
              <Users className="w-3 h-3 mr-0.5" />
              {event.total_guests}
            </span>
          )}
        </div>
      </BookingDetailsPopover>
    );
  };

  return (
    <div className="bg-background">
      {/* Navigation Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-t-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-semibold capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: it })} - {format(addMonths(currentMonth, 3), 'MMMM yyyy', { locale: it })}
            </h2>
            
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <button
            onClick={handleToday}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
          >
            Oggi
          </button>
        </div>
      </div>

      {/* 4-Month Grid */}
      <div className="grid grid-cols-4 gap-4">
        {months.map((month, monthIndex) => {
          const monthStart = startOfMonth(month);
          const monthEnd = endOfMonth(month);
          const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
          const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

          // Generate all days for this month's calendar grid
          const days: Date[] = [];
          let currentDay = calendarStart;
          while (currentDay <= calendarEnd) {
            days.push(currentDay);
            currentDay = addDays(currentDay, 1);
          }

          const weeks = Math.ceil(days.length / 7);

          return (
            <div key={monthIndex} className="flex flex-col">
              {/* Month Title */}
              <div className="text-center mb-2">
                <h3 className="text-sm font-semibold capitalize text-foreground">
                  {format(month, 'MMMM yyyy', { locale: it })}
                </h3>
              </div>

              {/* Calendar Grid */}
              <div 
                className="relative bg-card rounded-lg border border-border overflow-hidden"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gridTemplateRows: `auto repeat(${weeks}, 56px)`,
                  gap: '1px',
                  backgroundColor: 'hsl(var(--border))'
                }}
              >
                {/* Weekday Headers */}
                {['lu', 'ma', 'me', 'gi', 've', 'sa', 'do'].map((day, i) => (
                  <div
                    key={day}
                    className="bg-muted text-muted-foreground text-center text-[10px] font-semibold uppercase py-1"
                    style={{ gridColumn: i + 1, gridRow: 1 }}
                  >
                    {day}
                  </div>
                ))}

                {/* Day Cells */}
                {days.map((date, dayIndex) => {
                  const isCurrentMonth = isSameMonth(date, month);
                  const isToday = isSameDay(date, new Date());
                  const row = Math.floor(dayIndex / 7) + 2; // +2 because row 1 is header
                  const col = (dayIndex % 7) + 1;

                  return (
                    <div
                      key={date.toISOString()}
                      className={`
                        relative bg-background p-1
                        ${!isCurrentMonth ? 'text-muted-foreground/40' : 'text-foreground'}
                        ${isToday ? 'ring-1 ring-primary ring-inset' : ''}
                      `}
                      style={{ gridRow: row, gridColumn: col }}
                    >
                      <div className="text-[11px] font-medium">
                        {format(date, 'd')}
                      </div>
                    </div>
                  );
                })}

                {/* Event Bars Overlay */}
                {normalizedEvents.map(event => renderEventBar(event, monthStart, monthEnd))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CustomCalendar;
