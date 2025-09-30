import { useState, useEffect } from 'react';

export interface Property {
  id: string;
  nome: string;
  city: string;
  address: string;
  country: string;
  guests: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  base_price: number;
  currency: string;
  status: string;
  host_id: string;
}

export interface Booking {
  id: string;
  property_id: string;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  currency: string;
  status: string;
  booking_reference: string;
}

export interface CalendarBlock {
  id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  block_type: 'maintenance' | 'owner_use' | 'unavailable';
  reason: string;
}

export const useMockCalendarData = (userId: string | undefined) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    // Simula un caricamento asincrono
    setTimeout(() => {
      try {
        // Proprietà mock
        const mockProperties: Property[] = [
          {
            id: 'prop-1',
            nome: 'Appartamento con terrazza nel cuore di SIENA',
            city: 'Siena',
            address: 'Via del Campo 15',
            country: 'Italia',
            guests: 4,
            max_guests: 4,
            bedrooms: 2,
            beds: 2,
            bathrooms: 1,
            base_price: 120.00,
            currency: 'EUR',
            status: 'active',
            host_id: userId
          },
          {
            id: 'prop-2',
            nome: 'Via esterna di Fontebranda',
            city: 'Siena',
            address: 'Via Fontebranda 25',
            country: 'Italia',
            guests: 2,
            max_guests: 2,
            bedrooms: 1,
            beds: 1,
            bathrooms: 1,
            base_price: 85.00,
            currency: 'EUR',
            status: 'active',
            host_id: userId
          }
        ];

        // Bookings mock
        const today = new Date();
        const mockBookings: Booking[] = [
          {
            id: 'book-1',
            property_id: 'prop-1',
            guest_name: 'Marco Rossi',
            guest_email: 'marco.rossi@email.com',
            check_in: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            check_out: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            guests: 2,
            total_price: 360.00,
            currency: 'EUR',
            status: 'confirmed',
            booking_reference: 'BK000001'
          },
          {
            id: 'book-2',
            property_id: 'prop-1',
            guest_name: 'Anna Bianchi',
            guest_email: 'anna.bianchi@email.com',
            check_in: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            check_out: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            guests: 4,
            total_price: 480.00,
            currency: 'EUR',
            status: 'confirmed',
            booking_reference: 'BK000002'
          },
          {
            id: 'book-3',
            property_id: 'prop-2',
            guest_name: 'Giuseppe Verdi',
            guest_email: 'giuseppe.verdi@email.com',
            check_in: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            check_out: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            guests: 2,
            total_price: 255.00,
            currency: 'EUR',
            status: 'confirmed',
            booking_reference: 'BK000003'
          }
        ];

        // Calendar blocks mock
        const mockBlocks: CalendarBlock[] = [
          {
            id: 'block-1',
            property_id: 'prop-1',
            start_date: new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end_date: new Date(today.getTime() + 23 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            block_type: 'maintenance',
            reason: 'Manutenzione programmata'
          },
          {
            id: 'block-2',
            property_id: 'prop-2',
            start_date: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end_date: new Date(today.getTime() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            block_type: 'owner_use',
            reason: 'Uso personale proprietario'
          }
        ];

        setProperties(mockProperties);
        setBookings(mockBookings);
        setBlocks(mockBlocks);
        setError(null);
      } catch (err) {
        setError('Errore nel caricamento dei dati mock');
        console.error('Mock data error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 1000); // Simula 1 secondo di caricamento
  }, [userId]);

  return {
    properties,
    bookings,
    blocks,
    isLoading,
    error,
    refetch: () => {
      // Mock refetch function
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 500);
    }
  };
};