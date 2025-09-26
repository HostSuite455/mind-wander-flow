import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  addMonths, 
  subMonths, 
  isSameMonth, 
  isToday,
  parseISO,
  isWithinInterval,
  addDays
} from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Users, 
  Home,
  Clock,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  MousePointer2
} from 'lucide-react';
import '../../styles/calendar.css';

// Types
interface Property {
  id: string;
  name: string;
  address?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
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
  updated_at: string;
}

interface CalendarBlock {
  id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  block_type: 'maintenance' | 'personal' | 'unavailable';
  reason?: string;
  created_at: string;
  updated_at: string;
}

interface UpcomingEvent {
  id: string;
  type: 'check-in' | 'check-out';
  date: Date;
  guest: string;
  property: string;
  isToday: boolean;
}

interface RecentBooking {
  id: string;
  guest: string;
  property: string;
  dates: string;
  amount: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  createdAt: Date;
  isNew: boolean;
}

interface CustomCalendarProps {
  properties: Property[];
  bookings: Booking[];
  blocks: CalendarBlock[];
  onRefresh?: () => void;
}

// Utility functions
const getInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'confirmed': return '#4299e1';
    case 'pending': return '#ed8936';
    case 'cancelled': return '#e53e3e';
    default: return '#718096';
  }
};

const getBlockColor = (type: string): string => {
  switch (type) {
    case 'maintenance': return '#718096';
    case 'personal': return '#805ad5';
    case 'unavailable': return '#e53e3e';
    default: return '#718096';
  }
};

// Components
const ViewModeToggle: React.FC<{
  viewMode: 'single' | 'multi';
  onViewModeChange: (mode: 'single' | 'multi') => void;
}> = ({ viewMode, onViewModeChange }) => (
  <div className="view-toggle">
    <button
      className={viewMode === 'single' ? 'active' : ''}
      onClick={() => onViewModeChange('single')}
    >
      Singola
    </button>
    <button
      className={viewMode === 'multi' ? 'active' : ''}
      onClick={() => onViewModeChange('multi')}
    >
      Multiple
    </button>
  </div>
);

const PropertySelector: React.FC<{
  properties: Property[];
  selectedPropertyId: string | null;
  onPropertyChange: (propertyId: string | null) => void;
}> = ({ properties, selectedPropertyId, onPropertyChange }) => (
  <div className="property-selector">
    <select
      value={selectedPropertyId || 'all'}
      onChange={(e) => onPropertyChange(e.target.value === 'all' ? null : e.target.value)}
      className="property-select"
    >
      <option value="all">Tutte le proprietà</option>
      {properties.map(property => (
        <option key={property.id} value={property.id}>
          {property.name}
        </option>
      ))}
    </select>
  </div>
);

const CalendarHeader: React.FC<{
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}> = ({ currentDate, onPrevMonth, onNextMonth, onToday }) => (
  <div className="calendar-header">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="flex items-center gap-3">
          <CalendarIcon className="h-8 w-8" />
          Calendario Prenotazioni
        </h1>
        <p className="subtitle">
          {format(currentDate, 'MMMM yyyy', { locale: it })}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button className="nav-button" onClick={onPrevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button className="nav-button" onClick={onToday}>
          Oggi
        </button>
        <button className="nav-button" onClick={onNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
);

const BookingBlock: React.FC<{
  booking: Booking;
  property?: Property;
  onClick?: () => void;
}> = ({ booking, property, onClick }) => (
  <div
    className={`booking-block ${booking.status}`}
    onClick={onClick}
    style={{ backgroundColor: getStatusColor(booking.status) }}
  >
    <div className="booking-initials">
      {getInitials(booking.guest_name)}
    </div>
    <div className="booking-name">
      {booking.guest_name}
    </div>
  </div>
);

const CalendarCell: React.FC<{
  date: Date;
  currentDate: Date;
  bookings: Booking[];
  blocks: CalendarBlock[];
  properties: Property[];
  onDateClick?: (date: Date) => void;
}> = ({ date, currentDate, bookings, blocks, properties, onDateClick }) => {
  const dayBookings = bookings.filter(booking => {
    const checkIn = parseISO(booking.check_in);
    const checkOut = parseISO(booking.check_out);
    return isWithinInterval(date, { start: checkIn, end: addDays(checkOut, -1) });
  });

  const dayBlocks = blocks.filter(block => {
    const startDate = parseISO(block.start_date);
    const endDate = parseISO(block.end_date);
    return isWithinInterval(date, { start: startDate, end: endDate });
  });

  const isCurrentMonth = isSameMonth(date, currentDate);
  const isTodayDate = isToday(date);

  return (
    <div
      className={`calendar-cell ${!isCurrentMonth ? 'other-month' : ''} ${isTodayDate ? 'today' : ''}`}
      onClick={() => onDateClick?.(date)}
    >
      <div className="calendar-cell-date">
        {format(date, 'd')}
      </div>
      
      {dayBookings.map((booking, index) => {
        const property = properties.find(p => p.id === booking.property_id);
        return (
          <BookingBlock
            key={booking.id}
            booking={booking}
            property={property}
            onClick={() => console.log('Booking clicked:', booking)}
          />
        );
      })}
      
      {dayBlocks.map((block, index) => (
        <div
          key={block.id}
          className={`calendar-block ${block.block_type}`}
          style={{ 
            backgroundColor: getBlockColor(block.block_type),
            top: `${2 + (dayBookings.length * 1.5)}rem`
          }}
        >
          {block.block_type}
        </div>
      ))}
    </div>
  );
};

const PropertyRow: React.FC<{
  property: Property;
  dates: Date[];
  bookings: Booking[];
  blocks: CalendarBlock[];
  properties: Property[];
}> = ({ property, dates, bookings, blocks, properties }) => (
  <>
    <div className="property-label">
      <div>
        <div className="font-medium">{property.name}</div>
        {property.address && (
          <div className="text-xs text-gray-500 mt-1">{property.address}</div>
        )}
      </div>
    </div>
    {dates.map(date => (
      <CalendarCell
        key={date.toISOString()}
        date={date}
        currentDate={new Date()}
        bookings={bookings.filter(b => b.property_id === property.id)}
        blocks={blocks.filter(b => b.property_id === property.id)}
        properties={properties}
      />
    ))}
  </>
);

const SinglePropertyView: React.FC<{
  currentDate: Date;
  bookings: Booking[];
  blocks: CalendarBlock[];
  properties: Property[];
}> = ({ currentDate, bookings, blocks, properties }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  return (
    <div className="calendar-grid">
      <div className="calendar-weekdays">
        {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
          <div key={day} className="calendar-weekday">{day}</div>
        ))}
      </div>
      
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} className="grid grid-cols-7">
          {week.map(date => (
            <CalendarCell
              key={date.toISOString()}
              date={date}
              currentDate={currentDate}
              bookings={bookings}
              blocks={blocks}
              properties={properties}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

const MultiPropertyView: React.FC<{
  currentDate: Date;
  properties: Property[];
  bookings: Booking[];
  blocks: CalendarBlock[];
}> = ({ currentDate, properties, bookings, blocks }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <div className="calendar-grid">
      <div className="multi-property-grid">
        <div className="calendar-weekday"></div>
        {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
          <div key={day} className="calendar-weekday">{day}</div>
        ))}
        
        {properties.map(property => (
          <PropertyRow
            key={property.id}
            property={property}
            dates={calendarDays}
            bookings={bookings}
            blocks={blocks}
            properties={properties}
          />
        ))}
      </div>
    </div>
  );
};

const UpcomingEvents: React.FC<{ events: UpcomingEvent[] }> = ({ events }) => (
  <div className="event-panel">
    <div className="event-panel-header">
      <Clock className="h-5 w-5 text-blue-600" />
      <h3 className="event-panel-title">Prossimi Eventi</h3>
    </div>
    
    <div className="event-list">
      {events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">Nessun evento</div>
          <div className="empty-state-description">
            Non ci sono eventi nei prossimi 7 giorni
          </div>
        </div>
      ) : (
        events.map(event => (
          <div key={event.id} className="event-item">
            <div className={`event-icon ${event.type}`}>
              {event.type === 'check-in' ? (
                <ArrowDownRight className="h-4 w-4" />
              ) : (
                <ArrowUpRight className="h-4 w-4" />
              )}
            </div>
            <div className="event-content">
              <div className="event-title">
                {event.guest}
                <span className={`event-badge ${event.isToday ? 'today' : 'normal'}`}>
                  {event.isToday ? 'Oggi' : format(event.date, 'dd/MM', { locale: it })}
                </span>
              </div>
              <div className="event-subtitle">{event.property}</div>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

const RecentBookings: React.FC<{ bookings: RecentBooking[] }> = ({ bookings }) => (
  <div className="event-panel">
    <div className="event-panel-header">
      <TrendingUp className="h-5 w-5 text-green-600" />
      <h3 className="event-panel-title">Prenotazioni Recenti</h3>
    </div>
    
    <div className="event-list">
      {bookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">Nessuna prenotazione</div>
          <div className="empty-state-description">
            Non ci sono prenotazioni recenti
          </div>
        </div>
      ) : (
        bookings.map(booking => (
          <div key={booking.id} className="booking-item">
            <div className="booking-avatar">
              {getInitials(booking.guest)}
            </div>
            <div className="booking-details">
              <div className="booking-guest">
                {booking.guest}
                {booking.isNew && (
                  <span className="status-badge new-booking-badge">Nuovo</span>
                )}
              </div>
              <div className="booking-property">{booking.property}</div>
              <div className="booking-dates">{booking.dates}</div>
            </div>
            <div className="booking-price">
              <div className="booking-amount">€{booking.amount}</div>
              <div className={`status-badge ${booking.status}`}>
                {booking.status === 'confirmed' ? 'Confermata' : 
                 booking.status === 'pending' ? 'In attesa' : 'Annullata'}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

// Empty state component for when no property is selected or no events exist
const CalendarEmptyState: React.FC<{ 
  selectedPropertyId: string | null; 
  properties: Property[];
  hasEvents: boolean;
}> = ({ selectedPropertyId, properties, hasEvents }) => {
  if (!selectedPropertyId && properties.length > 0) {
    return (
      <div className="empty-state-panel">
        <div className="empty-state-content">
          <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Seleziona una proprietà</h3>
          <p className="text-gray-600 mb-4">
            Scegli una proprietà dal menu a tendina per visualizzare il calendario delle prenotazioni.
          </p>
        </div>
      </div>
    );
  }

  if (selectedPropertyId && !hasEvents) {
    const selectedProperty = properties.find(p => p.id === selectedPropertyId);
    return (
      <div className="empty-state-panel">
        <div className="empty-state-content">
          <MousePointer2 className="h-16 w-16 text-blue-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Inizia a gestire il calendario</h3>
          <p className="text-gray-600 mb-4">
            Seleziona un intervallo sul calendario trascinando il mouse per creare un blocco manuale.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={`/dashboard/channels${selectedPropertyId ? `?propertyId=${selectedPropertyId}` : ''}`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Settings className="h-4 w-4 mr-2" />
              Gestisci canali ICS
            </Link>
          </div>
          {selectedProperty && (
            <p className="text-sm text-gray-500 mt-4">
              Proprietà selezionata: <strong>{selectedProperty.name}</strong>
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
};

// Main Component
const CustomCalendar: React.FC<CustomCalendarProps> = ({ 
  properties, 
  bookings, 
  blocks, 
  onRefresh 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'single' | 'multi'>('multi');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  
  // Querystring support
  const [searchParams] = useSearchParams();
  const qsProp = searchParams.get("propertyId") || null;
  
  // Set property from querystring
  useEffect(() => {
    if (qsProp) {
      setSelectedPropertyId(qsProp);
    }
  }, [qsProp]);
  
  // Automatic fallback to first property
  useEffect(() => {
    if (!selectedPropertyId && properties.length > 0) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId]);

  const filteredBookings = useMemo(() => {
    if (selectedPropertyId && selectedPropertyId !== 'all') {
      return bookings.filter(booking => booking.property_id === selectedPropertyId);
    }
    return bookings;
  }, [bookings, selectedPropertyId]);

  const filteredBlocks = useMemo(() => {
    if (selectedPropertyId === 'all') return blocks;
    return blocks.filter(block => block.property_id === selectedPropertyId);
  }, [blocks, selectedPropertyId]);

  const upcomingEvents = useMemo((): UpcomingEvent[] => {
    const today = new Date();
    const nextWeek = addDays(today, 7);
    const events: UpcomingEvent[] = [];

    filteredBookings.forEach(booking => {
      const checkIn = parseISO(booking.check_in);
      const checkOut = parseISO(booking.check_out);
      const property = properties.find(p => p.id === booking.property_id);

      if (isWithinInterval(checkIn, { start: today, end: nextWeek })) {
        events.push({
          id: `checkin-${booking.id}`,
          type: 'check-in',
          date: checkIn,
          guest: booking.guest_name,
          property: property?.name || 'Proprietà sconosciuta',
          isToday: isToday(checkIn)
        });
      }

      if (isWithinInterval(checkOut, { start: today, end: nextWeek })) {
        events.push({
          id: `checkout-${booking.id}`,
          type: 'check-out',
          date: checkOut,
          guest: booking.guest_name,
          property: property?.name || 'Proprietà sconosciuta',
          isToday: isToday(checkOut)
        });
      }
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [filteredBookings, properties]);

  const recentBookings = useMemo((): RecentBooking[] => {
    const thirtyDaysAgo = addDays(new Date(), -30);
    
    return filteredBookings
      .filter(booking => {
        const createdAt = parseISO(booking.created_at);
        return createdAt >= thirtyDaysAgo;
      })
      .map(booking => {
        const property = properties.find(p => p.id === booking.property_id);
        const createdAt = parseISO(booking.created_at);
        const checkIn = parseISO(booking.check_in);
        const checkOut = parseISO(booking.check_out);
        
        return {
          id: booking.id,
          guest: booking.guest_name,
          property: property?.name || 'Proprietà sconosciuta',
          dates: `${format(checkIn, 'dd/MM', { locale: it })} - ${format(checkOut, 'dd/MM', { locale: it })}`,
          amount: booking.total_price || 0,
          status: booking.status,
          createdAt,
          isNew: addDays(createdAt, 3) >= new Date()
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);
  }, [filteredBookings, properties]);

  const handlePrevMonth = useCallback(() => {
    setCurrentDate(prev => subMonths(prev, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate(prev => addMonths(prev, 1));
  }, []);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Check if there are events in the current view
  const hasEvents = useMemo(() => {
    if (viewMode === 'single' && selectedPropertyId) {
      return filteredBookings.length > 0 || filteredBlocks.length > 0;
    }
    return bookings.length > 0 || blocks.length > 0;
  }, [viewMode, selectedPropertyId, filteredBookings, filteredBlocks, bookings, blocks]);

  return (
    <div className="calendar-container">
      <CalendarHeader
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
      />
      
      <div className="calendar-nav">
        <ViewModeToggle
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        
        {viewMode === 'single' && (
          <PropertySelector
          properties={properties}
          selectedPropertyId={selectedPropertyId || 'all'}
          onPropertyChange={setSelectedPropertyId}
        />
        )}
        
        <div className="flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Home className="h-4 w-4" />
            {properties.length} proprietà
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            {filteredBookings.length} prenotazioni
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
        <div className="lg:col-span-3">
          {/* Show empty state if no property selected in single mode or no events */}
          {(viewMode === 'single' && !selectedPropertyId) || 
           (viewMode === 'single' && selectedPropertyId && !hasEvents) ? (
            <CalendarEmptyState
              selectedPropertyId={selectedPropertyId}
              properties={properties}
              hasEvents={hasEvents}
            />
          ) : viewMode === 'single' && selectedPropertyId ? (
            <SinglePropertyView
              property={properties.find(p => p.id === selectedPropertyId)!}
              bookings={filteredBookings}
              blocks={blocks}
              currentDate={currentDate}
            />
          ) : (
            <MultiPropertyView
              currentDate={currentDate}
              properties={properties}
              bookings={filteredBookings}
              blocks={filteredBlocks}
            />
          )}
        </div>
        
        <div className="space-y-6">
          <UpcomingEvents events={upcomingEvents} />
          <RecentBookings bookings={recentBookings} />
        </div>
      </div>
    </div>
  );
};

export default CustomCalendar;