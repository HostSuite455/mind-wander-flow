import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';

// Types based on Supabase schema
export type Property = Tables<'properties'>;
export type Booking = Tables<'bookings'>;
export type CalendarBlock = Tables<'calendar_blocks'>;

// Extended types for calendar display
export interface CalendarBooking extends Booking {
  property?: Property;
}

export interface CalendarEvent {
  id: string;
  type: 'check-in' | 'check-out' | 'booking';
  title: string;
  date: Date;
  property: string;
  guest?: string;
  price?: number;
  status?: string;
}

export interface CalendarData {
  properties: Property[];
  bookings: CalendarBooking[];
  blocks: CalendarBlock[];
  upcomingEvents: CalendarEvent[];
  recentBookings: CalendarBooking[];
  loading: boolean;
  error: string | null;
}

export interface UseCalendarDataOptions {
  selectedPropertyId?: string;
  currentDate: Date;
  hostId?: string;
}

export function useCalendarData({ 
  selectedPropertyId, 
  currentDate, 
  hostId 
}: UseCalendarDataOptions): CalendarData {
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate date range for current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Fetch properties
  const fetchProperties = async () => {
    try {
      let query = supabase
        .from('properties')
        .select('*');

      if (hostId) {
        query = query.eq('host_id', hostId);
      }

      // Filter by status if the column exists, otherwise get all properties
      query = query.or('status.eq.active,status.is.null');

      const { data, error } = await query.order('nome');

      if (error) throw error;
      setProperties(data || []);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Errore nel caricamento delle proprietà');
    }
  };

  // Fetch bookings for the current month
  const fetchBookings = async () => {
    try {
      let query = supabase
        .from('bookings')
        .select('*')
        .gte('check_in', format(monthStart, 'yyyy-MM-dd'))
        .lte('check_out', format(monthEnd, 'yyyy-MM-dd'));

      if (hostId) {
        query = query.eq('host_id', hostId);
      }

      if (selectedPropertyId && selectedPropertyId !== 'all') {
        query = query.eq('property_id', selectedPropertyId);
      }

      const { data: bookingsData, error } = await query.order('check_in');

      if (error) throw error;

      // Fetch properties separately and merge with bookings
      if (bookingsData && bookingsData.length > 0) {
        const propertyIds = [...new Set(bookingsData.map(b => b.property_id))];
        const { data: propertiesData } = await supabase
          .from('properties')
          .select('*')
          .in('id', propertyIds);

        // Create a map of properties for quick lookup
        const propertiesMap = new Map(propertiesData?.map(p => [p.id, p]) || []);

        // Merge bookings with their properties
        const bookingsWithProperties = bookingsData.map(booking => ({
          ...booking,
          property: propertiesMap.get(booking.property_id)
        }));

        setBookings(bookingsWithProperties);
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Errore nel caricamento delle prenotazioni');
    }
  };

  // Fetch calendar blocks for the current month
  const fetchBlocks = async () => {
    try {
      let query = supabase
        .from('calendar_blocks')
        .select('*')
        .eq('is_active', true)
        .gte('start_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('end_date', format(monthEnd, 'yyyy-MM-dd'));

      if (hostId) {
        query = query.eq('host_id', hostId);
      }

      if (selectedPropertyId && selectedPropertyId !== 'all') {
        query = query.eq('property_id', selectedPropertyId);
      }

      const { data, error } = await query.order('start_date');

      if (error) throw error;
      setBlocks(data || []);
    } catch (err) {
      console.error('Error fetching calendar blocks:', err);
      setError('Errore nel caricamento dei blocchi calendario');
    }
  };

  // Load all data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchProperties(),
        fetchBookings(),
        fetchBlocks()
      ]);
    } catch (err) {
      console.error('Error loading calendar data:', err);
      setError('Errore nel caricamento dei dati del calendario');
    } finally {
      setLoading(false);
    }
  };

  // Effect to load data when dependencies change
  useEffect(() => {
    loadData();
  }, [selectedPropertyId, currentDate, hostId]);

  // Generate upcoming events from bookings
  const upcomingEvents = useMemo((): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    bookings.forEach(booking => {
      const checkInDate = parseISO(booking.check_in);
      const checkOutDate = parseISO(booking.check_out);
      const propertyName = booking.property?.nome || 'Proprietà sconosciuta';

      // Check-in events
      if (isWithinInterval(checkInDate, { start: today, end: nextWeek })) {
        events.push({
          id: `checkin-${booking.id}`,
          type: 'check-in',
          title: `Check-in: ${booking.guest_name || 'Ospite'}`,
          date: checkInDate,
          property: propertyName,
          guest: booking.guest_name || undefined,
          price: booking.total_price || undefined,
          status: booking.booking_status || undefined
        });
      }

      // Check-out events
      if (isWithinInterval(checkOutDate, { start: today, end: nextWeek })) {
        events.push({
          id: `checkout-${booking.id}`,
          type: 'check-out',
          title: `Check-out: ${booking.guest_name || 'Ospite'}`,
          date: checkOutDate,
          property: propertyName,
          guest: booking.guest_name || undefined,
          price: booking.total_price || undefined,
          status: booking.booking_status || undefined
        });
      }
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [bookings]);

  // Get recent bookings (last 30 days)
  const recentBookings = useMemo((): CalendarBooking[] => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return bookings
      .filter(booking => {
        const createdAt = booking.created_at ? parseISO(booking.created_at) : null;
        return createdAt && createdAt >= thirtyDaysAgo;
      })
      .sort((a, b) => {
        const dateA = a.created_at ? parseISO(a.created_at) : new Date(0);
        const dateB = b.created_at ? parseISO(b.created_at) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 10); // Limit to 10 most recent
  }, [bookings]);

  return {
    properties,
    bookings,
    blocks,
    upcomingEvents,
    recentBookings,
    loading,
    error
  };
}

// Helper function to get bookings for a specific date
export function getBookingsForDate(
  bookings: CalendarBooking[], 
  date: Date
): CalendarBooking[] {
  const dateStr = format(date, 'yyyy-MM-dd');
  
  return bookings.filter(booking => {
    const checkIn = booking.check_in;
    const checkOut = booking.check_out;
    
    return dateStr >= checkIn && dateStr < checkOut;
  });
}

// Helper function to get blocks for a specific date
export function getBlocksForDate(
  blocks: CalendarBlock[], 
  date: Date
): CalendarBlock[] {
  const dateStr = format(date, 'yyyy-MM-dd');
  
  return blocks.filter(block => {
    const startDate = block.start_date;
    const endDate = block.end_date;
    
    return dateStr >= startDate && dateStr <= endDate;
  });
}

// Helper function to get booking status color
export function getBookingStatusColor(status?: string | null): string {
  switch (status?.toLowerCase()) {
    case 'confirmed':
      return '#3b82f6'; // Blue
    case 'pending':
      return '#f59e0b'; // Orange
    case 'cancelled':
      return '#ef4444'; // Red
    case 'completed':
      return '#10b981'; // Green
    default:
      return '#6b7280'; // Gray
  }
}

// Helper function to get block type color
export function getBlockTypeColor(reason?: string | null): string {
  switch (reason?.toLowerCase()) {
    case 'maintenance':
      return '#6b7280'; // Gray
    case 'personal':
      return '#8b5cf6'; // Purple
    case 'unavailable':
      return '#ef4444'; // Red
    case 'blocked':
      return '#f59e0b'; // Orange
    default:
      return '#94a3b8'; // Light gray
  }
}