import React, { useState, useEffect } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  parseISO, 
  isWithinInterval, 
  addDays,
  addMonths,
  subMonths
} from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Home,
  Eye,
  EyeOff,
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

// Helper functions
const getBookingColor = (status: string): string => {
  switch (status) {
    case 'confirmed': return 'bg-emerald-500';
    case 'pending': return 'bg-amber-500';
    case 'cancelled': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

const getBlockColor = (reason: string): string => {
  switch (reason.toLowerCase()) {
    case 'maintenance': return 'bg-gray-500';
    case 'personal': return 'bg-purple-500';
    case 'unavailable': return 'bg-red-500';
    case 'blocked': return 'bg-orange-500';
    default: return 'bg-gray-500';
  }
};

const getSourceColor = (source: string): string => {
  const lowerSource = source.toLowerCase();
  if (lowerSource.includes('airbnb')) return 'bg-pink-500';
  if (lowerSource.includes('booking')) return 'bg-blue-600';
  if (lowerSource.includes('vrbo') || lowerSource.includes('homeaway')) return 'bg-cyan-500';
  if (lowerSource.includes('smoobu')) return 'bg-purple-600';
  return 'bg-gray-600';
};

const getSourceIcon = (source: string) => {
  const lowerSource = source.toLowerCase();
  if (lowerSource.includes('airbnb')) return Plane;
  if (lowerSource.includes('booking')) return Building2;
  return CalendarIcon;
};

// Components
const BookingBlock: React.FC<{
  booking: Booking;
  property?: Property;
}> = ({ booking, property }) => (
  <div
    className={`
      text-xs p-1 rounded text-white truncate cursor-pointer
      ${getBookingColor(booking.status)}
      hover:opacity-80 transition-opacity
    `}
    title={`${booking.guest_name} - ${property?.name || 'Proprietà'} (${booking.status})`}
  >
    {booking.guest_name}
  </div>
);

// Smoobu-style booking/block component with half-cell positioning
const SmoobuStyleBlock: React.FC<{
  block: CalendarBlock;
  startDate: Date;
  endDate: Date;
  weekStart: Date;
  weekEnd: Date;
}> = ({ block, startDate, endDate, weekStart, weekEnd }) => {
  const SourceIcon = getSourceIcon(block.source);
  
  // Calculate which days this block spans in this week
  const visibleStart = startDate < weekStart ? weekStart : startDate;
  const visibleEnd = endDate > weekEnd ? weekEnd : endDate;
  
  // Calculate grid column positioning (1-indexed)
  const gridStart = Math.floor((visibleStart.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const gridEnd = Math.floor((visibleEnd.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)) + 2;
  
  const isStartVisible = startDate >= weekStart;
  const isEndVisible = endDate <= weekEnd;
  
  return (
    <div
      className={`
        absolute flex items-center px-2 py-1 text-white text-xs font-medium
        ${getSourceColor(block.source)}
        ${isStartVisible && isEndVisible ? 'rounded-lg inset-x-[12.5%]' : ''}
        ${isStartVisible && !isEndVisible ? 'rounded-l-lg left-[12.5%] right-0' : ''}
        ${!isStartVisible && isEndVisible ? 'rounded-r-lg left-0 right-[12.5%]' : ''}
        ${!isStartVisible && !isEndVisible ? 'left-0 right-0' : ''}
        hover:opacity-90 transition-opacity cursor-pointer shadow-md pointer-events-auto
      `}
      style={{
        gridColumn: `${gridStart} / ${gridEnd}`,
        top: '50%',
        transform: 'translateY(-50%)',
        height: '32px',
        zIndex: 10
      }}
      title={`${block.guest_name || block.reason}${block.total_guests ? ` (${block.total_guests} ospiti)` : ''} - ${block.source}`}
    >
      <SourceIcon className="w-3 h-3 mr-1.5 flex-shrink-0" />
      <span className="truncate flex-1">{block.guest_name || block.reason}</span>
      {block.total_guests && (
        <span className="ml-1.5 flex items-center flex-shrink-0">
          <Users className="w-3 h-3 mr-0.5" />
          {block.total_guests}
        </span>
      )}
    </div>
  );
};

const CalendarBlock: React.FC<{
  block: CalendarBlock;
}> = ({ block }) => (
  <div
    className={`
      text-xs p-1 rounded text-white truncate cursor-pointer
      ${getBlockColor(block.reason)}
      hover:opacity-80 transition-opacity
    `}
    title={`${block.reason} - ${block.source}`}
  >
    {block.guest_name || block.reason}
    {block.total_guests && ` (${block.total_guests})`}
  </div>
);

const CalendarCell: React.FC<{
  date: Date;
  bookings: Booking[];
  blocks: CalendarBlock[];
  currentDate: Date;
  properties: Property[];
  compact?: boolean;
}> = ({ date, bookings, blocks, currentDate, properties, compact = false }) => {
  const dayBookings = bookings.filter(booking => {
    const checkIn = parseISO(booking.check_in);
    const checkOut = parseISO(booking.check_out);
    return isWithinInterval(date, { start: checkIn, end: addDays(checkOut, -1) });
  });

  const dayBlocks = blocks.filter(block => {
    if (!block.start_date || !block.end_date) return false;
    const startDate = parseISO(block.start_date);
    const endDate = parseISO(block.end_date);
    return isWithinInterval(date, { start: startDate, end: endDate });
  });

  const isCurrentMonth = isSameMonth(date, currentDate);
  const isTodayDate = isToday(date);
  const hasEvents = dayBookings.length > 0 || dayBlocks.length > 0;

  if (compact) {
    return (
      <div
        className={`
          w-full h-full rounded-sm border transition-all duration-200
          ${!isCurrentMonth ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'} 
          ${isTodayDate ? 'bg-blue-100 border-blue-400' : ''} 
          ${hasEvents ? 'bg-green-100 border-green-400' : ''}
          ${dayBlocks.length > 0 ? 'bg-red-100 border-red-400' : ''}
        `}
        title={`${format(date, 'dd/MM/yyyy')} - ${dayBookings.length} prenotazioni, ${dayBlocks.length} blocchi`}
      />
    );
  }

  return (
    <div
      className={`
        relative min-h-[120px] p-2 border border-gray-200 cursor-pointer transition-all duration-200 rounded-lg
        ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white hover:bg-gray-50'} 
        ${isTodayDate ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200' : ''} 
        ${hasEvents ? 'border-l-4 border-l-blue-500' : ''}
      `}
    >
      <div className={`text-sm font-medium mb-2 ${isTodayDate ? 'text-blue-600' : ''}`}>
        {format(date, 'd')}
      </div>
      
      <div className="space-y-1">
        {dayBookings.slice(0, 2).map((booking) => {
          const property = properties.find(p => p.id === booking.property_id);
          return (
            <BookingBlock
              key={booking.id}
              booking={booking}
              property={property}
            />
          );
        })}
        
        {dayBlocks.slice(0, 1).map((block) => (
          <CalendarBlock
            key={block.id}
            block={block}
          />
        ))}
      </div>
      
      {(dayBookings.length > 2 || dayBlocks.length > 1) && (
        <div className="absolute bottom-1 right-1 bg-gray-600 text-white text-xs px-2 py-1 rounded-full">
          +{(dayBookings.length + dayBlocks.length) - 2}
        </div>
      )}
    </div>
  );
};

const CalendarGrid: React.FC<{
  weeks: Date[][];
  bookings: Booking[];
  blocks: CalendarBlock[];
  currentDate: Date;
  properties: Property[];
}> = ({ weeks, bookings, blocks, currentDate, properties }) => {
  const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // Flatten all dates for grid calculation
  const allDates = weeks.flat();
  
  // Group blocks by their span for rendering
  const blockSpans = blocks
    .filter(block => {
      const isActive = block.is_active !== false;
      const isValid = !!block.start_date && !!block.end_date && isActive;
      if (!isValid) {
        console.log('🚫 Block filtered out:', {
          id: block.id,
          has_dates: !!block.start_date && !!block.end_date,
          is_active: block.is_active,
          is_active_check: isActive,
          guest_name: block.guest_name,
          source: block.source
        });
      }
      return isValid;
    })
    .map(block => {
      const startDate = parseISO(block.start_date);
      const endDate = parseISO(block.end_date);
      console.log('✅ Block span created:', {
        id: block.id,
        guest_name: block.guest_name,
        total_guests: block.total_guests,
        startDate: format(startDate, 'dd/MM/yyyy'),
        endDate: format(endDate, 'dd/MM/yyyy'),
        source: block.source
      });
      return { block, startDate, endDate };
    });
  
  console.log(`📊 CalendarGrid: ${blockSpans.length} blocks ready to render`);
  
  return (
    <div className="calendar-grid">
      {/* Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 bg-gray-50 rounded">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Body with relative positioning for absolute blocks */}
      <div className="space-y-1">
        {weeks.map((week, weekIndex) => {
          const weekStart = week[0];
          const weekEnd = week[week.length - 1];
          
          // Find blocks that span across this week
          const weekBlocks = blockSpans.filter(({ startDate, endDate }) => {
            return !(endDate < weekStart || startDate > addDays(weekEnd, 1));
          });
          
          return (
            <div key={weekIndex} className="relative">
              {/* Grid layout for cells */}
              <div className="grid grid-cols-7 gap-2 relative" style={{ minHeight: '120px' }}>
                {week.map(date => {
                  const isCurrentMonth = isSameMonth(date, currentDate);
                  const isTodayDate = isToday(date);
                  
                  return (
                    <div
                      key={date.toISOString()}
                      className={`
                        relative p-2 border border-gray-200 rounded-lg transition-all duration-200
                        ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white hover:bg-gray-50'} 
                        ${isTodayDate ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200' : ''}
                      `}
                    >
                      <div className={`text-sm font-medium ${isTodayDate ? 'text-blue-600' : ''}`}>
                        {format(date, 'd')}
                      </div>
                    </div>
                  );
                })}
                
                {/* Smoobu-style blocks overlay with popover */}
                {weekBlocks.map(({ block, startDate, endDate }) => (
                  <BookingDetailsPopover
                    key={block.id}
                    booking={{
                      id: block.id,
                      guest_name: block.guest_name,
                      total_guests: block.total_guests,
                      start_date: block.start_date || '',
                      end_date: block.end_date || '',
                      source: block.source || 'manual',
                      reason: block.reason
                    }}
                    property={{ nome: properties[0]?.name || 'Proprietà', address: properties[0]?.address || '' }}
                    isHost={true}
                    onEdit={() => console.log('Edit booking', block.id)}
                    onCancel={() => console.log('Cancel booking', block.id)}
                  >
                    <SmoobuStyleBlock
                      block={block}
                      startDate={startDate}
                      endDate={endDate}
                      weekStart={weekStart}
                      weekEnd={weekEnd}
                    />
                  </BookingDetailsPopover>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SinglePropertyView: React.FC<{
  properties: Property[];
  bookings: Booking[];
  blocks: CalendarBlock[];
  weeks: Date[][];
  currentDate: Date;
}> = ({ properties, bookings, blocks, weeks, currentDate }) => {
  const property = properties[0];
  
  if (!property) {
    return (
      <div className="text-center py-12">
        <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna proprietà selezionata</h3>
        <p className="text-gray-500">Seleziona una proprietà per visualizzare il calendario</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Home className="w-5 h-5 mr-2 text-blue-500" />
          {property.name}
        </h3>
      </div>
      
      <div className="p-4">
        <CalendarGrid 
          weeks={weeks}
          bookings={bookings}
          blocks={blocks}
          currentDate={currentDate}
          properties={[property]}
        />
      </div>
    </div>
  );
};

const PropertyRow: React.FC<{
  property: Property;
  dates: Date[];
  bookings: Booking[];
  blocks: CalendarBlock[];
  currentDate: Date;
}> = ({ property, dates, bookings, blocks, currentDate }) => {
  return (
    <div className="flex space-x-1 overflow-x-auto pb-2">
      {dates.map(date => (
        <div key={date.toISOString()} className="flex-shrink-0 w-8 h-8">
          <CalendarCell
            date={date}
            bookings={bookings}
            blocks={blocks}
            currentDate={currentDate}
            properties={[property]}
            compact
          />
        </div>
      ))}
    </div>
  );
};

const MultiPropertyView: React.FC<{
  properties: Property[];
  bookings: Booking[];
  blocks: CalendarBlock[];
  dates: Date[];
  currentDate: Date;
}> = ({ properties, bookings, blocks, dates, currentDate }) => {
  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna proprietà disponibile</h3>
        <p className="text-gray-500">Aggiungi delle proprietà per visualizzare il calendario</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {properties.map(property => {
        const propertyBookings = bookings.filter(b => b.property_id === property.id);
        const propertyBlocks = blocks.filter(b => b.property_id === property.id);
        
        return (
          <div key={property.id} className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Home className="w-5 h-5 mr-2 text-blue-500" />
                {property.name}
                <span className="ml-auto text-sm text-gray-500">
                  {propertyBookings.length} prenotazioni
                </span>
              </h3>
            </div>
            
            <div className="p-4">
              <PropertyRow
                property={property}
                dates={dates}
                bookings={propertyBookings}
                blocks={propertyBlocks}
                currentDate={currentDate}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Funzione di validazione globale per le date
const validateDate = (dateValue: any, defaultValue: string = 'Data non valida'): string => {
  if (!dateValue || isNaN(dateValue.getTime())) {
    console.warn('Invalid date detected:', dateValue);
    return defaultValue;
  }
  return format(dateValue, 'MMMM yyyy', { locale: it });
};

const PropertySelector: React.FC<{
  properties: Property[];
  selectedPropertyId: string | null;
  onPropertyChange: (propertyId: string | null) => void;
}> = ({ properties, selectedPropertyId, onPropertyChange }) => {
  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium text-blue-100">Proprietà:</label>
      <select
        value={selectedPropertyId || ''}
        onChange={(e) => onPropertyChange(e.target.value || null)}
        className="px-3 py-1 bg-blue-800 text-white border border-blue-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        <option value="">Tutte le proprietà</option>
        {properties.map(property => (
          <option key={property.id} value={property.id}>
            {property.name}
          </option>
        ))}
      </select>
    </div>
  );
};

const ViewModeToggle: React.FC<{
  viewMode: 'single' | 'multi';
  onViewModeChange: (mode: 'single' | 'multi') => void;
}> = ({ viewMode, onViewModeChange }) => {
  return (
    <div className="flex items-center bg-blue-800 rounded-lg p-1">
      <button
        onClick={() => onViewModeChange('single')}
        className={`px-3 py-1 text-sm rounded-md transition-colors ${
          viewMode === 'single' 
            ? 'bg-white text-blue-600 font-medium' 
            : 'text-blue-100 hover:text-white'
        }`}
      >
        Singola
      </button>
      <button
        onClick={() => onViewModeChange('multi')}
        className={`px-3 py-1 text-sm rounded-md transition-colors ${
          viewMode === 'multi' 
            ? 'bg-white text-blue-600 font-medium' 
            : 'text-blue-100 hover:text-white'
        }`}
      >
        Multiple
      </button>
    </div>
  );
};

const MonthNavigation: React.FC<{
  currentDate: Date;
  onDateChange: (date: Date) => void;
}> = ({ currentDate, onDateChange }) => {
  // Debug per MonthNavigation
  console.log('MonthNavigation - currentDate:', currentDate);
  console.log('Type of currentDate:', typeof currentDate);
  console.log('Is valid date?', currentDate instanceof Date && !isNaN(currentDate.getTime()));

  // Aggiungi validazione all'inizio del componente
  if (!currentDate || isNaN(currentDate.getTime())) {
    console.error('MonthNavigation: Invalid currentDate:', currentDate);
    return (
      <div className="flex items-center justify-between mb-4">
        <span className="text-lg font-semibold text-white">Caricamento...</span>
      </div>
    );
  }

  const handlePrevMonth = () => {
    onDateChange(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    onDateChange(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  // Validazione aggiuntiva per il formato della data usando la funzione globale
  const monthYearText = validateDate(currentDate, 'Seleziona data');

  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={handlePrevMonth}
        className="p-2 text-white hover:bg-blue-800 rounded-lg transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <div className="flex items-center space-x-2">
        <h2 className="text-xl font-semibold text-white">
          {monthYearText}
        </h2>
        <button
          onClick={handleToday}
          className="px-3 py-1 text-xs bg-blue-800 text-white rounded-full hover:bg-blue-900 transition-colors"
        >
          Oggi
        </button>
      </div>
      
      <button
        onClick={handleNextMonth}
        className="p-2 text-white hover:bg-blue-800 rounded-lg transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

// Main CustomCalendar Component
const CustomCalendar: React.FC<CustomCalendarProps> = ({
  properties,
  bookings,
  blocks,
  currentDate,
  onDateChange,
  selectedPropertyId,
  onPropertyChange
}) => {
  const [viewMode, setViewMode] = useState<'single' | 'multi'>('single');
  
  // Inizializza currentMonth con new Date() se non definito
  const [currentMonth, setCurrentMonth] = useState<Date>(currentDate || new Date());
  
  // Debug per CustomCalendar
  useEffect(() => {
    console.log('=== CustomCalendar Debug ===');
    console.log('currentMonth:', currentMonth);
    console.log('currentMonth is Date?', currentMonth instanceof Date);
    console.log('currentMonth is valid?', currentMonth && !isNaN(currentMonth.getTime()));
    console.log('currentDate prop:', currentDate);
    console.log('properties:', properties);
    console.log('bookings:', bookings);
    console.log('blocks:', blocks);
    console.log('========================');
  }, [currentMonth, currentDate, properties, bookings, blocks]);

  // Aggiorna currentMonth quando currentDate cambia
  useEffect(() => {
    if (currentDate && !isNaN(currentDate.getTime())) {
      setCurrentMonth(currentDate);
    }
  }, [currentDate]);

  return (
    <div className="calendar-container">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <CalendarIcon className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Calendario Prenotazioni</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <PropertySelector
              properties={properties}
              selectedPropertyId={selectedPropertyId}
              onPropertyChange={onPropertyChange}
            />
            <ViewModeToggle
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </div>
        </div>
        
        <MonthNavigation
          currentDate={currentMonth}
          onDateChange={(date) => {
            setCurrentMonth(date);
            onDateChange(date);
          }}
        />
      </div>

      {/* Calendar Body */}
      <div className="bg-white rounded-b-lg p-6">
        {(() => {
          // Filter properties based on selection
          const filteredProperties = selectedPropertyId 
            ? properties.filter(p => p.id === selectedPropertyId)
            : properties;

          // Generate calendar data usando currentMonth validato
          const validCurrentMonth = currentMonth && !isNaN(currentMonth.getTime()) ? currentMonth : new Date();
          const monthStart = startOfMonth(validCurrentMonth);
          const monthEnd = endOfMonth(validCurrentMonth);
          const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
          const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
          const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
          
          const weeks = [];
          for (let i = 0; i < calendarDays.length; i += 7) {
            weeks.push(calendarDays.slice(i, i + 7));
          }

          return viewMode === 'single' ? (
            <SinglePropertyView
              properties={filteredProperties}
              bookings={bookings}
              blocks={blocks}
              weeks={weeks}
              currentDate={validCurrentMonth}
            />
          ) : (
            <MultiPropertyView
              properties={filteredProperties}
              bookings={bookings}
              blocks={blocks}
              dates={calendarDays}
              currentDate={validCurrentMonth}
            />
          );
        })()}
      </div>

      {/* Legend */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Legenda</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Prenotazione confermata</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>Prenotazione in attesa</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Non disponibile</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-purple-500 rounded"></div>
            <span>Uso personale</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomCalendar;