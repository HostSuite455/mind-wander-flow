import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, isSameMonth, isToday } from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Home, Loader2 } from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import '../styles/calendario.css';

// Tipi
interface Property {
  id: string;
  nome: string;  // Changed from 'name' to 'nome' to match database
  address?: string;
  host_id: string;
}

interface Booking {
  id: string;
  property_id: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

interface CalendarBlock {
  id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  block_type: 'maintenance' | 'personal' | 'unavailable';
  reason?: string;
}

// Funzioni di utilità
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'confirmed': return '#4ade80'; // verde
    case 'pending': return '#f59e0b'; // giallo
    case 'cancelled': return '#ef4444'; // rosso
    default: return '#94a3b8'; // grigio
  }
};

const getBlockColor = (type: string): string => {
  switch (type) {
    case 'maintenance': return '#f97316'; // arancione
    case 'personal': return '#8b5cf6'; // viola
    case 'unavailable': return '#64748b'; // grigio scuro
    default: return '#94a3b8'; // grigio
  }
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export default function CalendarioPage() {
  console.log('🔥 CalendarioPage COMPONENT STARTED - ENTRY POINT');
  console.log('CIAO - TEST RENDERING');
  // Stati
  const [currentDate, setCurrentDate] = useState(new Date());
  const [authResolved, setAuthResolved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Querystring support
  const [searchParams] = useSearchParams();
  const qsProp = searchParams.get("propertyId") || null;

  // Autenticazione
  useEffect(() => {
    let unsub: { data: { subscription: { unsubscribe: () => void } } } | null = null;

    async function initAuth() {
      try {
        // 1) Prova sessione attuale
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user?.id) {
          setUserId(sessionData.session.user.id);
        }
        
        // 2) Ascolta variazioni auth (login/logout/refresh)
        unsub = supabase.auth.onAuthStateChange((_event, session) => {
          setUserId(session?.user?.id ?? null);
        });
        
        setAuthResolved(true);
      } catch (error) {
        console.error('Error initializing auth:', error);
        setAuthResolved(true); // Risolvi comunque per evitare loading infinito
      }
    }
    
    initAuth();

    return () => {
      if (unsub?.data?.subscription) {
        unsub.data.subscription.unsubscribe();
      }
    };
  }, []);

  // Set property from querystring
  useEffect(() => {
    if (qsProp) {
      setSelectedPropertyId(qsProp);
    }
  }, [qsProp]);

  // Carica dati
  useEffect(() => {
    if (!authResolved || !userId) return;
    
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('🔍 Fetching calendar data for user:', userId);

        // Fetch properties
        const { data: propertiesData, error: propertiesError } = await supabase
          .from('properties')
          .select('*')
          .eq('host_id', userId)
          .order('nome', { ascending: true });
        
        console.log('📊 Properties query result:', { 
          userId, 
          propertiesData, 
          propertiesCount: propertiesData?.length || 0,
          propertiesError 
        });
        
        if (!propertiesData || propertiesData.length === 0) {
          console.warn('⚠️ NO PROPERTIES FOUND for user:', userId);
          console.warn('⚠️ This is why the calendar is not visible!');
          console.warn('⚠️ You need to create properties for this user or run the test data script.');
        }
        
        if (propertiesError) throw propertiesError;
        
        if (propertiesData && Array.isArray(propertiesData)) {
          setProperties(propertiesData);
          console.log('🏠 Properties loaded:', propertiesData.length);
          
          // Automatic fallback to first property
          if (!selectedPropertyId && propertiesData.length > 0) {
            setSelectedPropertyId(propertiesData[0].id);
            console.log('🎯 Auto-selected property:', propertiesData[0].id);
          }
        }

        // Fetch bookings and blocks only if we have properties
        if (propertiesData && propertiesData.length > 0) {
          const propertyIds = propertiesData.map(p => p.id);
          
          // Fetch bookings
          const startDate = new Date();
          const endDate = new Date();
          endDate.setFullYear(startDate.getFullYear() + 1);
          
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

          // Fetch calendar blocks
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
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [authResolved, userId, selectedPropertyId]);

  // Debug logging
  useEffect(() => {
    if (authResolved) {
      console.log("Calendario Debug", { 
        authResolved, 
        userId, 
        propsCount: properties.length, 
        selectedPropertyId, 
        eventsCount: [...bookings, ...blocks].length,
        isLoading,
        error,
        properties: properties.map(p => ({ id: p.id, nome: p.nome }))
      });
    }
  }, [authResolved, userId, properties.length, selectedPropertyId, bookings.length, blocks.length, isLoading, error]);

  // Funzioni di navigazione
  const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));
  const handleToday = () => setCurrentDate(new Date());

  // Calcola giorni del mese
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Filtra eventi per proprietà selezionata
  const filteredBookings = selectedPropertyId 
    ? bookings.filter(b => b.property_id === selectedPropertyId)
    : bookings;
  
  const filteredBlocks = selectedPropertyId
    ? blocks.filter(b => b.property_id === selectedPropertyId)
    : blocks;

  // Contenitore del calendario con altezza fissa
  const calendarContainer = (
    <div className="h-[calc(100vh-220px)] min-h-[600px] w-full overflow-auto rounded-xl border bg-white">
      {!selectedPropertyId && properties.length > 0 ? (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <h3 className="text-xl font-medium text-gray-800 mb-2">Seleziona una proprietà</h3>
          <p className="text-gray-600 mb-4">Scegli una proprietà dal menu a tendina per visualizzare il calendario</p>
          <Button asChild>
            <Link to="/dashboard/properties">Gestisci proprietà</Link>
          </Button>
        </div>
      ) : properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <h3 className="text-xl font-medium text-gray-800 mb-2">Nessuna proprietà disponibile</h3>
          <p className="text-gray-600 mb-4">Aggiungi una proprietà per iniziare a utilizzare il calendario</p>
          <Button asChild>
            <Link to="/dashboard/properties/new">Aggiungi proprietà</Link>
          </Button>
        </div>
      ) : (
        <div className="calendar-simple">
          {/* Intestazione giorni della settimana */}
          <div className="calendar-header-row">
            <div className="calendar-header-cell">Dom</div>
            <div className="calendar-header-cell">Lun</div>
            <div className="calendar-header-cell">Mar</div>
            <div className="calendar-header-cell">Mer</div>
            <div className="calendar-header-cell">Gio</div>
            <div className="calendar-header-cell">Ven</div>
            <div className="calendar-header-cell">Sab</div>
          </div>
          
          {/* Griglia del calendario */}
          <div className="calendar-grid">
            {days.map(day => {
              // Filtra eventi per questo giorno
              const dayBookings = filteredBookings.filter(booking => {
                const checkIn = new Date(booking.check_in);
                const checkOut = new Date(booking.check_out);
                return day >= checkIn && day <= checkOut;
              });
              
              const dayBlocks = filteredBlocks.filter(block => {
                const startDate = new Date(block.start_date);
                const endDate = new Date(block.end_date);
                return day >= startDate && day <= endDate;
              });
              
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);
              
              return (
                <div 
                  key={day.toString()} 
                  className={`calendar-cell ${isCurrentMonth ? '' : 'other-month'} ${isCurrentDay ? 'today' : ''}`}
                >
                  <div className="calendar-date">{format(day, 'd')}</div>
                  <div className="calendar-events">
                    {dayBookings.map(booking => (
                      <div 
                        key={booking.id} 
                        className="calendar-event booking"
                        style={{ backgroundColor: getStatusColor(booking.status) }}
                      >
                        <span className="event-initials">{getInitials(booking.guest_name)}</span>
                        <span className="event-name">{booking.guest_name}</span>
                      </div>
                    ))}
                    
                    {dayBlocks.map(block => (
                      <div 
                        key={block.id} 
                        className="calendar-event block"
                        style={{ backgroundColor: getBlockColor(block.block_type) }}
                      >
                        <span className="event-name">{block.block_type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // Render-safety: mostra skeleton se auth non risolto
  if (!authResolved) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Caricamento autenticazione...</span>
        </div>
      </Card>
    );
  }

  // Se auth risolto ma nessun userId, mostra messaggio
  if (!userId) {
    return (
      <Card className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-yellow-800 font-medium mb-2">Accesso richiesto</h3>
          <p className="text-yellow-600">Effettua il login per accedere al calendario.</p>
        </div>
        {calendarContainer}
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
        </div>
        <Card className="p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Caricamento calendario...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
        </div>
        <Card className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-medium mb-2">Errore nel caricamento</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button variant="destructive" onClick={() => window.location.reload()}>
              Riprova
            </Button>
          </div>
          {calendarContainer}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div style={{fontSize: '24px', color: 'red', fontWeight: 'bold', padding: '20px', backgroundColor: 'yellow'}}>
        CIAO - TEST RENDERING
      </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
              <CalendarIcon className="h-8 w-8" />
              Calendario
            </h1>
            <p className="text-gray-500">
              {format(currentDate, 'MMMM yyyy', { locale: it })}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Oggi
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="property-selector">
            <select
              value={selectedPropertyId || ''}
              onChange={(e) => setSelectedPropertyId(e.target.value || null)}
              className="border rounded-md px-3 py-2 bg-white"
            >
              <option value="">Tutte le proprietà</option>
              {properties.map(property => (
                <option key={property.id} value={property.id}>
                  {property.nome}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Home className="h-4 w-4" />
              {properties.length} proprietà
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {filteredBookings.length + filteredBlocks.length} eventi
            </div>
          </div>
        </div>
        
        {filteredBookings.length + filteredBlocks.length === 0 && selectedPropertyId && (
          <div className="mb-2 text-sm text-gray-600">
            Nessun evento nel periodo. Trascina col mouse per creare un blocco.
          </div>
        )}
        
        {calendarContainer}
      </div>
    );
  }