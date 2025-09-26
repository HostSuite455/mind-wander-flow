import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, Clock, AlertCircle, Plus, Filter, Search, Eye, EyeOff } from 'lucide-react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, isAfter, isBefore } from 'date-fns';
import { it } from 'date-fns/locale';

// Types
interface Property {
  id: string;
  name: string;
  address?: string;
  user_id: string;
}

interface Booking {
  id: string;
  property_id: string;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  total_price?: number;
  created_at: string;
}

interface CalendarBlock {
  id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  block_type: 'maintenance' | 'personal' | 'unavailable';
  reason?: string;
}

interface UpcomingEvent {
  id: string;
  type: 'check-in' | 'check-out';
  date: string;
  guestName: string;
  propertyName: string;
  bookingId: string;
  daysFromToday: number;
}

interface RecentBooking extends Booking {
  propertyName: string;
  isNew?: boolean;
}

type ViewMode = 'single' | 'multi';

// Mock data for demonstration
const mockProperties: Property[] = [
  { id: '1', name: 'Appartamento con terrazza nel cuore di SIENA', user_id: 'user1' },
  { id: '2', name: 'Via esterna di Fontebranda', user_id: 'user1' },
  { id: '3', name: 'Viale Sardegna', user_id: 'user1' },
  { id: '4', name: 'Vicolo del leone', user_id: 'user1' },
  { id: '5', name: 'Palazzo Angelica', user_id: 'user1' }
];

const mockBookings: Booking[] = [
  {
    id: '1',
    property_id: '1',
    guest_name: 'Jerry Wozniak',
    guest_email: 'jerry@email.com',
    check_in: '2025-09-08',
    check_out: '2025-09-12',
    status: 'confirmed',
    total_price: 450,
    created_at: '2025-09-01T10:00:00Z'
  },
  {
    id: '2', 
    property_id: '1',
    guest_name: 'Joanna Starczewska',
    guest_email: 'joanna@email.com',
    check_in: '2025-09-26',
    check_out: '2025-09-30',
    status: 'confirmed',
    total_price: 380,
    created_at: '2025-09-15T14:30:00Z'
  },
  {
    id: '3',
    property_id: '2',
    guest_name: 'Anjo Peeters',
    guest_email: 'anjo@email.com',
    check_in: '2025-10-01',
    check_out: '2025-10-07',
    status: 'confirmed',
    total_price: 520,
    created_at: '2025-09-20T09:15:00Z'
  },
  {
    id: '4',
    property_id: '1',
    guest_name: 'Monica Tita',
    guest_email: 'monica@email.com',
    check_in: '2025-10-10',
    check_out: '2025-10-15',
    status: 'confirmed',
    total_price: 420,
    created_at: '2025-09-25T16:45:00Z'
  }
];

const mockBlocks: CalendarBlock[] = [
  {
    id: '1',
    property_id: '5',
    start_date: '2025-09-01',
    end_date: '2025-12-31',
    block_type: 'maintenance',
    reason: 'Ristrutturazione'
  }
];

// Utility functions
const getDaysInMonth = (date: Date) => {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return eachDayOfInterval({ start, end });
};

const getBookingColor = (status: string) => {
  switch (status) {
    case 'confirmed': return 'bg-blue-500 hover:bg-blue-600';
    case 'pending': return 'bg-yellow-500 hover:bg-yellow-600';
    case 'cancelled': return 'bg-red-500 hover:bg-red-600';
    default: return 'bg-gray-500 hover:bg-gray-600';
  }
};

const getBlockColor = (blockType: string) => {
  switch (blockType) {
    case 'maintenance': return 'bg-gray-400 bg-stripes';
    case 'personal': return 'bg-purple-400';
    case 'unavailable': return 'bg-red-400';
    default: return 'bg-gray-400';
  }
};

// Components
const ViewModeToggle: React.FC<{
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}> = ({ viewMode, onViewModeChange }) => (
  <div className="inline-flex rounded-md bg-gray-100 p-1">
    <button
      onClick={() => onViewModeChange('multi')}
      className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
        viewMode === 'multi'
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      Multi
    </button>
    <button
      onClick={() => onViewModeChange('single')}
      className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
        viewMode === 'single'
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      Singola
    </button>
  </div>
);

const PropertySelector: React.FC<{
  properties: Property[];
  selectedPropertyId: string | null;
  onPropertyChange: (propertyId: string) => void;
  disabled?: boolean;
}> = ({ properties, selectedPropertyId, onPropertyChange, disabled }) => {
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  
  return (
    <div className="relative">
      <select
        value={selectedPropertyId || ''}
        onChange={(e) => onPropertyChange(e.target.value)}
        disabled={disabled}
        className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-900 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:text-gray-500"
      >
        <option value="">Seleziona proprietà</option>
        {properties.map(property => (
          <option key={property.id} value={property.id}>
            {property.name}
          </option>
        ))}
      </select>
      <ChevronRight className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 rotate-90 pointer-events-none" />
    </div>
  );
};

const CalendarHeader: React.FC<{
  currentDate: Date;
  onDateChange: (date: Date) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  properties: Property[];
  selectedPropertyId: string | null;
  onPropertyChange: (propertyId: string) => void;
}> = ({
  currentDate,
  onDateChange,
  viewMode,
  onViewModeChange,
  properties,
  selectedPropertyId,
  onPropertyChange
}) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onDateChange(subMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">
              {format(currentDate, 'MMMM yyyy', { locale: it })}
            </span>
          </div>
          
          <button
            onClick={() => onDateChange(addMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        
        {viewMode === 'single' && (
          <PropertySelector
            properties={properties}
            selectedPropertyId={selectedPropertyId}
            onPropertyChange={onPropertyChange}
          />
        )}
        
        <button className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
          <Filter className="h-4 w-4" />
          <span>Filtri</span>
        </button>
      </div>
      
      <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
    </div>
  );
};

const BookingBlock: React.FC<{
  booking: Booking;
  startDate: Date;
  endDate: Date;
  onClick?: () => void;
}> = ({ booking, onClick }) => {
  const initials = booking.guest_name.split(' ').map(n => n[0]).join('').toUpperCase();
  
  return (
    <div
      onClick={onClick}
      className={`absolute left-1 right-1 h-6 rounded-sm flex items-center px-2 text-xs font-medium text-white cursor-pointer transition-all z-10 ${getBookingColor(booking.status)}`}
      style={{ top: '4px' }}
    >
      <div className="w-4 h-4 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-2 text-xs font-bold">
        {initials}
      </div>
      <span className="truncate">{booking.guest_name}</span>
    </div>
  );
};

const CalendarCell: React.FC<{
  date: Date;
  isCurrentMonth: boolean;
  bookings: Booking[];
  blocks: CalendarBlock[];
  onClick?: (date: Date) => void;
}> = ({ date, isCurrentMonth, bookings, blocks, onClick }) => {
  const dayOfMonth = date.getDate();
  const isCurrentDay = isToday(date);
  
  return (
    <div
      onClick={() => onClick?.(date)}
      className={`
        relative border-r border-gray-100 min-h-[60px] p-1 cursor-pointer transition-colors
        ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white hover:bg-gray-50'}
        ${isCurrentDay ? 'bg-blue-50 border-2 border-blue-200' : ''}
      `}
    >
      <div className={`text-sm font-medium ${isCurrentDay ? 'text-blue-600' : ''}`}>
        {dayOfMonth}
      </div>
      
      {/* Calendar blocks */}
      {blocks.map(block => (
        <div
          key={block.id}
          className={`absolute inset-x-1 top-6 h-4 rounded-sm ${getBlockColor(block.block_type)} flex items-center justify-center text-xs text-white font-medium`}
        >
          {block.block_type === 'maintenance' && '///'}
        </div>
      ))}
      
      {/* Bookings */}
      {bookings.map((booking, index) => (
        <BookingBlock
          key={booking.id}
          booking={booking}
          startDate={date}
          endDate={date}
          onClick={() => console.log('Booking clicked:', booking)}
        />
      ))}
    </div>
  );
};

const PropertyRow: React.FC<{
  property: Property;
  days: Date[];
  bookings: Booking[];
  blocks: CalendarBlock[];
  onCellClick?: (date: Date, propertyId: string) => void;
}> = ({ property, days, bookings, blocks, onCellClick }) => {
  const propertyBookings = bookings.filter(b => b.property_id === property.id);
  const propertyBlocks = blocks.filter(b => b.property_id === property.id);
  
  return (
    <div className="grid grid-cols-8 gap-0 border-b border-gray-100 min-h-[60px]">
      <div className="sticky left-0 bg-gray-50 p-3 border-r border-gray-200 font-medium text-sm flex items-center">
        <div className="truncate" title={property.name}>
          {property.name}
        </div>
      </div>
      
      {days.map(day => {
        const dayBookings = propertyBookings.filter(booking => {
          const checkIn = new Date(booking.check_in);
          const checkOut = new Date(booking.check_out);
          return day >= checkIn && day < checkOut;
        });
        
        const dayBlocks = propertyBlocks.filter(block => {
          const startDate = new Date(block.start_date);
          const endDate = new Date(block.end_date);
          return day >= startDate && day <= endDate;
        });
        
        return (
          <CalendarCell
            key={day.toISOString()}
            date={day}
            isCurrentMonth={isSameMonth(day, days[Math.floor(days.length / 2)])}
            bookings={dayBookings}
            blocks={dayBlocks}
            onClick={(date) => onCellClick?.(date, property.id)}
          />
        );
      })}
    </div>
  );
};

const SinglePropertyView: React.FC<{
  property: Property;
  days: Date[];
  bookings: Booking[];
  blocks: CalendarBlock[];
  onCellClick?: (date: Date, propertyId: string) => void;
}> = ({ property, days, bookings, blocks, onCellClick }) => {
  const weekDays = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];
  
  // Create calendar grid (6 weeks x 7 days)
  const firstDay = days[0];
  const startOfCalendar = new Date(firstDay);
  const dayOfWeek = firstDay.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startOfCalendar.setDate(firstDay.getDate() - mondayOffset);
  
  const calendarDays = [];
  for (let i = 0; i < 42; i++) {
    const day = new Date(startOfCalendar);
    day.setDate(startOfCalendar.getDate() + i);
    calendarDays.push(day);
  }
  
  const weeks = [];
  for (let i = 0; i < 6; i++) {
    weeks.push(calendarDays.slice(i * 7, (i + 1) * 7));
  }
  
  const propertyBookings = bookings.filter(b => b.property_id === property.id);
  const propertyBlocks = blocks.filter(b => b.property_id === property.id);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Calendar header */}
      <div className="grid grid-cols-7 gap-0 border-b border-gray-200 bg-gray-50">
        {weekDays.map(day => (
          <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 uppercase">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-rows-6 gap-0">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-0">
            {week.map(day => {
              const dayBookings = propertyBookings.filter(booking => {
                const checkIn = new Date(booking.check_in);
                const checkOut = new Date(booking.check_out);
                return day >= checkIn && day < checkOut;
              });
              
              const dayBlocks = propertyBlocks.filter(block => {
                const startDate = new Date(block.start_date);
                const endDate = new Date(block.end_date);
                return day >= startDate && day <= endDate;
              });
              
              return (
                <CalendarCell
                  key={day.toISOString()}
                  date={day}
                  isCurrentMonth={isSameMonth(day, days[Math.floor(days.length / 2)])}
                  bookings={dayBookings}
                  blocks={dayBlocks}
                  onClick={(date) => onCellClick?.(date, property.id)}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

const MultiPropertyView: React.FC<{
  properties: Property[];
  days: Date[];
  bookings: Booking[];
  blocks: CalendarBlock[];
  onCellClick?: (date: Date, propertyId: string) => void;
}> = ({ properties, days, bookings, blocks, onCellClick }) => {
  const weekDays = ['', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-8 gap-0 border-b border-gray-200 bg-gray-50">
        {weekDays.map((day, index) => (
          <div key={index} className="p-3 text-center text-sm font-medium text-gray-600 uppercase">
            {day}
          </div>
        ))}
      </div>
      
      {/* Property rows */}
      <div className="divide-y divide-gray-100">
        {properties.map(property => (
          <PropertyRow
            key={property.id}
            property={property}
            days={days}
            bookings={bookings}
            blocks={blocks}
            onCellClick={onCellClick}
          />
        ))}
      </div>
    </div>
  );
};

const UpcomingEvents: React.FC<{
  events: UpcomingEvent[];
  onEventClick: (bookingId: string) => void;
}> = ({ events, onEventClick }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
        <CalendarIcon className="h-4 w-4 text-gray-600" />
        <h3 className="font-medium text-gray-900">Prossimi eventi</h3>
      </div>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {events.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Nessun evento prossimo</p>
        ) : (
          events.map(event => {
            const isUrgent = event.daysFromToday <= 1;
            const isToday = event.daysFromToday === 0;
            
            return (
              <div
                key={event.id}
                onClick={() => onEventClick(event.bookingId)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm ${
                  event.type === 'check-in' ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {event.type === 'check-in' ? '→' : '←'}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">
                      {event.type === 'check-in' ? 'Check-in' : 'Check-out'}
                    </p>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      isToday ? 'bg-green-100 text-green-700' :
                      isUrgent ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {isToday ? 'Oggi' : 
                       isUrgent ? 'Domani' :
                       format(new Date(event.date), 'dd/MM/yyyy')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{event.guestName}</p>
                  <p className="text-xs text-gray-500 truncate">{event.propertyName}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const RecentBookings: React.FC<{
  bookings: RecentBooking[];
  onBookingClick: (bookingId: string) => void;
}> = ({ bookings, onBookingClick }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
        <Clock className="h-4 w-4 text-gray-600" />
        <h3 className="font-medium text-gray-900">Ultime attività</h3>
      </div>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {bookings.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Nessuna attività recente</p>
        ) : (
          bookings.map(booking => {
            const initials = booking.guest_name.split(' ').map(n => n[0]).join('').toUpperCase();
            
            return (
              <div
                key={booking.id}
                onClick={() => onBookingClick(booking.id)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm">
                  {initials}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">{booking.guest_name}</p>
                    {booking.isNew && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                        Nuova prenotazione
                      </span>
                    )}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {booking.status === 'confirmed' ? '✓' : 
                       booking.status === 'pending' ? '⏳' : '✗'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{booking.propertyName}</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(booking.check_in), 'dd/MM/yyyy')} - {format(new Date(booking.check_out), 'dd/MM/yyyy')}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    €{booking.total_price}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(booking.created_at), 'dd/MM')}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// Main Calendar Component
const CustomCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('multi');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [properties] = useState<Property[]>(mockProperties);
  const [bookings] = useState<Booking[]>(mockBookings);
  const [blocks] = useState<CalendarBlock[]>(mockBlocks);

  // Calculate upcoming events
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const events: UpcomingEvent[] = [];
    
    const relevantBookings = viewMode === 'single' && selectedPropertyId
      ? bookings.filter(b => b.property_id === selectedPropertyId)
      : bookings;
    
    relevantBookings.forEach(booking => {
      const checkIn = new Date(booking.check_in);
      const checkOut = new Date(booking.check_out);
      const property = properties.find(p => p.id === booking.property_id);
      
      if (checkIn >= now) {
        const daysFromToday = Math.ceil((checkIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        events.push({
          id: `${booking.id}-checkin`,
          type: 'check-in',
          date: booking.check_in,
          guestName: booking.guest_name,
          propertyName: property?.name || '',
          bookingId: booking.id,
          daysFromToday
        });
      }
      
      if (checkOut >= now) {
        const daysFromToday = Math.ceil((checkOut.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        events.push({
          id: `${booking.id}-checkout`,
          type: 'check-out',
          date: booking.check_out,
          guestName: booking.guest_name,
          propertyName: property?.name || '',
          bookingId: booking.id,
          daysFromToday
        });
      }
    });
    
    return events
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 10);
  }, [bookings, properties, viewMode, selectedPropertyId]);

  // Calculate recent bookings
  const recentBookings = useMemo(() => {
    const relevantBookings = viewMode === 'single' && selectedPropertyId
      ? bookings.filter(b => b.property_id === selectedPropertyId)
      : bookings;
    
    return relevantBookings
      .map(booking => ({
        ...booking,
        propertyName: properties.find(p => p.id === booking.property_id)?.name || '',
        isNew: new Date(booking.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
  }, [bookings, properties, viewMode, selectedPropertyId]);

  const displayProperties = useMemo(() => {
    if (viewMode === 'single' && selectedPropertyId) {
      return properties.filter(p => p.id === selectedPropertyId);
    }
    return properties;
  }, [viewMode, selectedPropertyId, properties]);

  const days = useMemo(() => getDaysInMonth(currentDate), [currentDate]);

  const handleCellClick = useCallback((date: Date, propertyId: string) => {
    console.log('Cell clicked:', { date, propertyId });
    // Here you would typically open a booking creation modal
  }, []);

  const handleEventClick = useCallback((bookingId: string) => {
    console.log('Event clicked:', bookingId);
    // Here you would typically open the booking details modal
  }, []);

  const handleBookingClick = useCallback((bookingId: string) => {
    console.log('Booking clicked:', bookingId);
    // Here you would typically open the booking details modal
  }, []);

  // Handle view mode changes
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'single' && !selectedPropertyId && properties.length > 0) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [selectedPropertyId, properties]);

  return (
    <div className="max-w-full mx-auto p-6 space-y-6">
      {/* Calendar Header */}
      <CalendarHeader
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        properties={properties}
        selectedPropertyId={selectedPropertyId}
        onPropertyChange={setSelectedPropertyId}
      />

      {/* Calendar Grid */}
      <div className="space-y-4">
        {viewMode === 'single' ? (
          selectedPropertyId ? (
            <SinglePropertyView
              property={properties.find(p => p.id === selectedPropertyId)!}
              days={days}
              bookings={bookings}
              blocks={blocks}
              onCellClick={handleCellClick}
            />
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Seleziona una proprietà</h3>
              <p className="text-gray-500">Scegli una proprietà dal menu a tendina per visualizzare il calendario.</p>
            </div>
          )
        ) : (
          <MultiPropertyView
            properties={displayProperties}
            days={days}
            bookings={bookings}
            blocks={blocks}
            onCellClick={handleCellClick}
          />
        )}
      </div>

      {/* Events Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingEvents
          events={upcomingEvents}
          onEventClick={handleEventClick}
        />
        <RecentBookings
          bookings={recentBookings}
          onBookingClick={handleBookingClick}
        />
      </div>
    </div>
  );
};

export default CustomCalendar;