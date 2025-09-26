import { useState, useEffect, useCallback } from 'react';
import { supaSelect } from '@/lib/supaSafe';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

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

export const useCalendarData = (userId: string | undefined) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    // Guardia: non eseguire fetch finché non ho userId
    if (!userId) {
      console.log('useCalendarData: skipping fetch, no userId');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch properties con filtro server-side usando direttamente supabase
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('host_id', userId)
        .order('nome', { ascending: true });
      
      if (propertiesError) {
        throw propertiesError;
      }
      
      if (propertiesData && Array.isArray(propertiesData)) {
        setProperties(propertiesData);
      }

      // Fetch bookings for the next 12 months
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(startDate.getFullYear() + 1);

      // Get property IDs for filtering
      const propertyIds = (propertiesData && Array.isArray(propertiesData)) ? 
        propertiesData.map(p => p.id) : [];
      
      if (propertyIds.length > 0) {
        // Fetch bookings con filtro server-side
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .in('property_id', propertyIds)
          .gte('check_in', startDate.toISOString().split('T')[0])
          .lte('check_out', endDate.toISOString().split('T')[0]);
        
        if (bookingsError) {
          console.warn('Error fetching bookings:', bookingsError);
        } else if (bookingsData) {
          setBookings(bookingsData);
        }

        // Fetch calendar blocks con filtro server-side
        const { data: blocksData, error: blocksError } = await supabase
          .from('calendar_blocks')
          .select('*')
          .in('property_id', propertyIds)
          .gte('start_date', startDate.toISOString().split('T')[0])
          .lte('end_date', endDate.toISOString().split('T')[0]);
        
        if (blocksError) {
          console.warn('Error fetching blocks:', blocksError);
        } else if (blocksData) {
          setBlocks(blocksData);
        }
      }
    } catch (err) {
      console.error('Error fetching calendar data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto';
      setError(errorMessage);
      toast({
        title: "Errore",
        description: "Impossibile caricare i dati del calendario",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Calculate date range for calendar display
  const rangeStart = new Date();
  const rangeEnd = new Date();
  rangeEnd.setFullYear(rangeStart.getFullYear() + 1);

  return {
    properties,
    bookings,
    blocks,
    isLoading,
    error,
    refetch,
    rangeStart,
    rangeEnd
  };
};

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