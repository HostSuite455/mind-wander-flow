// src/lib/calendarUtils.ts
// Utility functions for calendar operations

import { startOfWeek, endOfWeek, eachDayOfInterval, format, isWithinInterval, addDays, differenceInDays } from 'date-fns';
import { it } from 'date-fns/locale';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface BookingPosition {
  left: number;
  width: number;
  top: number;
  zIndex: number;
}

/**
 * Generate calendar weeks for a given month
 */
export const getCalendarWeeks = (date: Date): Date[][] => {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(date, { weekStartsOn: 1 });
  
  const days = eachDayOfInterval({ start, end });
  const weeks: Date[][] = [];
  
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  
  return weeks;
};

/**
 * Check if two date ranges overlap
 */
export const dateRangesOverlap = (range1: DateRange, range2: DateRange): boolean => {
  return range1.start <= range2.end && range2.start <= range1.end;
};

/**
 * Calculate booking position on calendar grid
 */
export const calculateBookingPosition = (
  booking: { check_in: string; check_out: string },
  weekStart: Date,
  weekEnd: Date
): BookingPosition | null => {
  const checkIn = new Date(booking.check_in);
  const checkOut = new Date(booking.check_out);
  
  // Check if booking intersects with this week
  if (!isWithinInterval(checkIn, { start: weekStart, end: weekEnd }) && 
      !isWithinInterval(checkOut, { start: weekStart, end: weekEnd }) &&
      !(checkIn <= weekStart && checkOut >= weekEnd)) {
    return null;
  }
  
  const displayStart = checkIn < weekStart ? weekStart : checkIn;
  const displayEnd = checkOut > weekEnd ? weekEnd : checkOut;
  
  const startDayIndex = differenceInDays(displayStart, weekStart);
  const duration = differenceInDays(displayEnd, displayStart) + 1;
  
  return {
    left: (startDayIndex / 7) * 100,
    width: (duration / 7) * 100,
    top: 0,
    zIndex: 10
  };
};

/**
 * Format date for Italian locale
 */
export const formatDateIT = (date: Date, formatString: string = 'dd/MM/yyyy'): string => {
  return format(date, formatString, { locale: it });
};

/**
 * Get days between two dates
 */
export const getDaysBetween = (startDate: string, endDate: string): number => {
  return differenceInDays(new Date(endDate), new Date(startDate));
};

/**
 * Check if booking conflicts with existing bookings
 */
export const checkBookingConflicts = (
  newBooking: { check_in: string; check_out: string; property_id: string },
  existingBookings: Array<{ check_in: string; check_out: string; property_id: string; id: string }>,
  excludeId?: string
): boolean => {
  const newCheckIn = new Date(newBooking.check_in);
  const newCheckOut = new Date(newBooking.check_out);
  
  return existingBookings.some(booking => {
    if (excludeId && booking.id === excludeId) return false;
    if (booking.property_id !== newBooking.property_id) return false;
    
    const existingCheckIn = new Date(booking.check_in);
    const existingCheckOut = new Date(booking.check_out);
    
    return dateRangesOverlap(
      { start: newCheckIn, end: newCheckOut },
      { start: existingCheckIn, end: existingCheckOut }
    );
  });
};

/**
 * Generate color for booking based on status
 */
export const getBookingStatusColor = (status: string): { bg: string; text: string; border: string } => {
  switch (status) {
    case 'confirmed':
      return { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600' };
    case 'pending':
      return { bg: 'bg-yellow-500', text: 'text-white', border: 'border-yellow-600' };
    case 'cancelled':
      return { bg: 'bg-red-500', text: 'text-white', border: 'border-red-600' };
    default:
      return { bg: 'bg-gray-500', text: 'text-white', border: 'border-gray-600' };
  }
};

/**
 * Calculate revenue for a date range
 */
export const calculateRevenue = (
  bookings: Array<{ total_price?: number; status: string }>,
  includeStatuses: string[] = ['confirmed']
): number => {
  return bookings
    .filter(booking => includeStatuses.includes(booking.status))
    .reduce((total, booking) => total + (booking.total_price || 0), 0);
};

// ---

// src/components/calendar/CalendarStats.tsx
// Statistics component for calendar

import React from 'react';
import { TrendingUp, Calendar, Users, Euro } from 'lucide-react';

interface CalendarStatsProps {
  bookings: Array<{
    status: string;
    total_price?: number;
    check_in: string;
    check_out: string;
  }>;
  currentMonth: Date;
}

export const CalendarStats: React.FC<CalendarStatsProps> = ({ bookings, currentMonth }) => {
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  
  const monthBookings = bookings.filter(booking => {
    const checkIn = new Date(booking.check_in);
    return checkIn >= monthStart && checkIn <= monthEnd;
  });
  
  const confirmedBookings = monthBookings.filter(b => b.status === 'confirmed');
  const pendingBookings = monthBookings.filter(b => b.status === 'pending');
  const totalRevenue = calculateRevenue(monthBookings);
  const occupancyRate = monthBookings.length > 0 ? 
    Math.round((confirmedBookings.length / monthBookings.length) * 100) : 0;

  const stats = [
    {
      name: 'Prenotazioni Totali',
      value: monthBookings.length,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Prenotazioni Confermate',
      value: confirmedBookings.length,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Ricavi Totali',
      value: `€${totalRevenue.toFixed(2)}`,
      icon: Euro,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      name: 'Tasso Occupazione',
      value: `${occupancyRate}%`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <div key={stat.name} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">{stat.name}</p>
              <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ---

// src/components/calendar/CalendarLegend.tsx
// Legend component showing booking types and colors

import React from 'react';

export const CalendarLegend: React.FC = () => {
  const legendItems = [
    { label: 'Confermata', color: 'bg-blue-500', textColor: 'text-blue-700' },
    { label: 'In Attesa', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
    { label: 'Cancellata', color: 'bg-red-500', textColor: 'text-red-700' },
    { label: 'Manutenzione', color: 'bg-gray-400 bg-stripes', textColor: 'text-gray-700' },
    { label: 'Uso Personale', color: 'bg-purple-400', textColor: 'text-purple-700' },
    { label: 'Non Disponibile', color: 'bg-red-400', textColor: 'text-red-700' }
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Legenda</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded ${item.color}`} />
            <span className={`text-xs font-medium ${item.textColor}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---

// src/components/calendar/CalendarFilters.tsx
// Advanced filtering component

import React, { useState } from 'react';
import { Filter, X, Search, Calendar } from 'lucide-react';

interface FilterState {
  status: string[];
  propertyIds: string[];
  dateRange: { start: string; end: string } | null;
  guestName: string;
  minPrice: number;
  maxPrice: number;
}

interface CalendarFiltersProps {
  properties: Array<{ id: string; name: string }>;
  onFiltersChange: (filters: FilterState) => void;
  initialFilters?: Partial<FilterState>;
}

export const CalendarFilters: React.FC<CalendarFiltersProps> = ({
  properties,
  onFiltersChange,
  initialFilters = {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    propertyIds: [],
    dateRange: null,
    guestName: '',
    minPrice: 0,
    maxPrice: 10000,
    ...initialFilters
  });

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleStatusToggle = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    handleFilterChange('status', newStatus);
  };

  const handlePropertyToggle = (propertyId: string) => {
    const newPropertyIds = filters.propertyIds.includes(propertyId)
      ? filters.propertyIds.filter(id => id !== propertyId)
      : [...filters.propertyIds, propertyId];
    handleFilterChange('propertyIds', newPropertyIds);
  };

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      status: [],
      propertyIds: [],
      dateRange: null,
      guestName: '',
      minPrice: 0,
      maxPrice: 10000
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = filters.status.length > 0 || 
                          filters.propertyIds.length > 0 ||
                          filters.dateRange ||
                          filters.guestName.trim() ||
                          filters.minPrice > 0 ||
                          filters.maxPrice < 10000;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
          hasActiveFilters 
            ? 'bg-blue-100 text-blue-700 border-blue-200' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-transparent'
        } border`}
      >
        <Filter className="h-4 w-4" />
        <span>Filtri</span>
        {hasActiveFilters && (
          <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
            {[...filters.status, ...filters.propertyIds].length + 
             (filters.dateRange ? 1 : 0) + 
             (filters.guestName ? 1 : 0) + 
             (filters.minPrice > 0 || filters.maxPrice < 10000 ? 1 : 0)}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Filtri</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Search by guest name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="h-4 w-4 inline mr-1" />
                Nome Ospite
              </label>
              <input
                type="text"
                value={filters.guestName}
                onChange={(e) => handleFilterChange('guestName', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Cerca per nome..."
              />
            </div>

            {/* Status filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="space-y-2">
                {[
                  { value: 'confirmed', label: 'Confermata', color: 'bg-green-100 text-green-800' },
                  { value: 'pending', label: 'In Attesa', color: 'bg-yellow-100 text-yellow-800' },
                  { value: 'cancelled', label: 'Cancellata', color: 'bg-red-100 text-red-800' }
                ].map(status => (
                  <label key={status.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(status.value)}
                      onChange={() => handleStatusToggle(status.value)}
                      className="mr-2 rounded border-gray-300"
                    />
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Property filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Proprietà</label>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {properties.map(property => (
                  <label key={property.id} className="flex items-start">
                    <input
                      type="checkbox"
                      checked={filters.propertyIds.includes(property.id)}
                      onChange={() => handlePropertyToggle(property.id)}
                      className="mr-2 mt-1 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 line-clamp-2">{property.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Periodo
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={filters.dateRange?.start || ''}
                  onChange={(e) => handleFilterChange('dateRange', {
                    ...filters.dateRange,
                    start: e.target.value
                  })}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                  placeholder="Da"
                />
                <input
                  type="date"
                  value={filters.dateRange?.end || ''}
                  onChange={(e) => handleFilterChange('dateRange', {
                    ...filters.dateRange,
                    end: e.target.value
                  })}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                  placeholder="A"
                />
              </div>
            </div>

            {/* Price range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prezzo (€)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                  placeholder="Min"
                  min="0"
                />
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                  placeholder="Max"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancella tutto
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Applica
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ---

// src/components/calendar/ExportCalendar.tsx
// Export functionality component

import React, { useState } from 'react';
import { Download, FileText, Calendar, Printer } from 'lucide-react';
import { format } from 'date-fns';

interface ExportCalendarProps {
  bookings: Array<{
    id: string;
    guest_name: string;
    property_id: string;
    check_in: string;
    check_out: string;
    status: string;
    total_price?: number;
  }>;
  properties: Array<{ id: string; name: string }>;
  currentDate: Date;
}

export const ExportCalendar: React.FC<ExportCalendarProps> = ({
  bookings,
  properties,
  currentDate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf' | 'ical' | 'print'>('csv');

  const exportToCSV = () => {
    const headers = [
      'Data Check-in',
      'Data Check-out',
      'Nome Ospite',
      'Proprietà',
      'Status',
      'Prezzo'
    ];

    const csvData = bookings.map(booking => {
      const property = properties.find(p => p.id === booking.property_id);
      return [
        booking.check_in,
        booking.check_out,
        booking.guest_name,
        property?.name || '',
        booking.status,
        booking.total_price?.toString() || '0'
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `calendario-${format(currentDate, 'yyyy-MM')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToICAL = () => {
    const icalHeader = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Your Company//Calendar Pro//EN'
    ];

    const icalEvents = bookings.map(booking => {
      const property = properties.find(p => p.id === booking.property_id);
      return [
        'BEGIN:VEVENT',
        `UID:${booking.id}@yourcompany.com`,
        `DTSTART:${booking.check_in.replace(/-/g, '')}`,
        `DTEND:${booking.check_out.replace(/-/g, '')}`,
        `SUMMARY:${booking.guest_name} - ${property?.name || ''}`,
        `DESCRIPTION:Status: ${booking.status}${booking.total_price ? ` - €${booking.total_price}` : ''}`,
        'END:VEVENT'
      ].join('\n');
    });

    const icalFooter = 'END:VCALENDAR';
    const icalContent = [...icalHeader, ...icalEvents, icalFooter].join('\n');

    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `calendario-${format(currentDate, 'yyyy-MM')}.ics`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = () => {
    switch (exportFormat) {
      case 'csv':
        exportToCSV();
        break;
      case 'ical':
        exportToICAL();
        break;
      case 'print':
        window.print();
        break;
      case 'pdf':
        // This would typically use a library like jsPDF
        console.log('PDF export not implemented yet');
        break;
    }
    setIsOpen(false);
  };

  const exportOptions = [
    { value: 'csv', label: 'Excel/CSV', icon: FileText, description: 'Esporta come file CSV' },
    { value: 'ical', label: 'Calendar (iCal)', icon: Calendar, description: 'Esporta come file iCal' },
    { value: 'print', label: 'Stampa', icon: Printer, description: 'Stampa calendario' },
    { value: 'pdf', label: 'PDF', icon: FileText, description: 'Esporta come PDF (presto)' }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
      >
        <Download className="h-4 w-4" />
        <span>Esporta</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
          <h3 className="font-medium text-gray-900 mb-3">Esporta Calendario</h3>
          
          <div className="space-y-2 mb-4">
            {exportOptions.map(option => (
              <label key={option.value} className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="exportFormat"
                  value={option.value}
                  checked={exportFormat === option.value}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                  className="mt-1 mr-3 text-blue-600"
                />
                <div className="flex-1">
                  <div className="flex items-center">
                    <option.icon className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="font-medium text-gray-900">{option.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-gray-200">
            <button
              onClick={() => setIsOpen(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Annulla
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              disabled={exportFormat === 'pdf'}
            >
              Esporta
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ---

// src/lib/dateHelpers.ts
// Additional date utility functions

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
  const nights = getDaysBetween(checkIn, checkOut);
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

// ---

// src/components/calendar/KeyboardShortcuts.tsx
// Component to show keyboard shortcuts

import React, { useState, useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';

export const KeyboardShortcuts: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const shortcuts = [
    { keys: ['?'], description: 'Mostra questa guida' },
    { keys: ['Esc'], description: 'Chiudi modali/menu' },
    { keys: ['Ctrl/Cmd', 'N'], description: 'Nuova prenotazione' },
    { keys: ['Ctrl/Cmd', '←'], description: 'Mese precedente' },
    { keys: ['Ctrl/Cmd', '→'], description: 'Mese successivo' },
    { keys: ['Ctrl/Cmd', 'F'], description: 'Cerca prenotazioni' },
    { keys: ['Ctrl/Cmd', 'P'], description: 'Stampa calendario' },
    { keys: ['T'], description: 'Vai a oggi' },
    { keys: ['V'], description: 'Cambia vista (single/multi)' }
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors z-40"
        title="Scorciatoie tastiera (?)"
      >
        <Keyboard className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Scorciatoie Tastiera</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-3">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{shortcut.description}</span>
              <div className="flex space-x-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <React.Fragment key={keyIndex}>
                    {keyIndex > 0 && <span className="text-gray-400 text-xs">+</span>}
                    <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
                      {key}
                    </kbd>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <p className="text-xs text-gray-500 text-center">
            Premi <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">?</kbd> in qualsiasi momento per aprire questa guida
          </p>
        </div>
      </div>
    </div>
  );
};
            