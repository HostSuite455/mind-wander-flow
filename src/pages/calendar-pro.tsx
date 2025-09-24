import { useState, useEffect, useMemo } from "react";
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, RefreshCw, Users, Building, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supaSelect, pickName } from "@/lib/supaSafe";
import { parseAndEnrichICS, IcsEventEnriched } from "@/lib/ics-parse";
import { useActiveProperty } from "@/hooks/useActiveProperty";
import { syncSmoobuBookings } from "@/lib/smoobuSync";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import "@/styles/fullcalendar.css";

interface Property {
  id: string;
  nome?: string;
  name?: string;
  city?: string;
  status?: string;
}

interface IcalUrl {
  id: string;
  ical_config_id: string;
  url: string;
  source?: string;
  is_active?: boolean;
  ical_configs?: {
    property_id: string;
    is_active: boolean;
    properties?: Property;
  };
}

interface Booking {
  id: string;
  property_id: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  check_in: string;
  check_out: string;
  guests_count?: number;
  adults_count?: number;
  children_count?: number;
  channel?: string;
  booking_status?: string;
  total_price?: number;
  currency?: string;
  booking_reference?: string;
  special_requests?: string;
}

const CalendarPro = () => {
  const { activePropertyId } = useActiveProperty();
  const { toast: toastHook } = useToast();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [icalsData, setIcalsData] = useState<IcsEventEnriched[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [view, setView] = useState<'multi' | 'single'>('multi');
  const [selectedProperty, setSelectedProperty] = useState<string>('all');

  const loadCalendarData = async () => {
    setIsLoading(true);
    try {
      // Load properties
      const propertiesData = await supaSelect('properties', {
        select: 'id, nome, name, city, status',
        filter: activePropertyId !== 'all' ? { id: activePropertyId } : undefined
      });
      setProperties(propertiesData || []);

      // Load iCal URLs and parse them
      const icalsQuery = await supaSelect('ical_urls', {
        select: `
          id, ical_config_id, url, source, is_active,
          ical_configs!inner(
            property_id, is_active,
            properties!inner(id, nome, name, city, status)
          )
        `,
        filter: { is_active: true }
      });

      if (icalsQuery) {
        const allEvents: IcsEventEnriched[] = [];
        for (const icalUrl of icalsQuery) {
          if (icalUrl.ical_configs?.is_active && icalUrl.ical_configs.properties) {
            try {
              const events = await parseAndEnrichICS(icalUrl.url, icalUrl.ical_configs.properties);
              allEvents.push(...events);
            } catch (error) {
              console.error(`Error parsing iCal ${icalUrl.url}:`, error);
            }
          }
        }
        setIcalsData(allEvents);
      }

      // Load Smoobu bookings
      const bookingsData = await supaSelect('bookings', {
        select: '*',
        filter: activePropertyId !== 'all' ? { property_id: activePropertyId } : undefined
      });
      setBookings(bookingsData || []);

    } catch (error) {
      console.error('Error loading calendar data:', error);
      toastHook({
        title: "Errore",
        description: "Errore nel caricamento dei dati del calendario",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSmoobuSync = async () => {
    setIsSyncing(true);
    try {
      await syncSmoobuBookings();
      toast.success("Sincronizzazione Smoobu completata");
      await loadCalendarData();
    } catch (error) {
      console.error('Sync error:', error);
      toast.error("Errore durante la sincronizzazione Smoobu");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadCalendarData();
  }, [activePropertyId]);

  // Filter events and bookings based on selected property
  const filteredEvents = useMemo(() => {
    if (selectedProperty === 'all') return icalsData;
    return icalsData.filter(event => event.property?.id === selectedProperty);
  }, [icalsData, selectedProperty]);

  const filteredBookings = useMemo(() => {
    if (selectedProperty === 'all') return bookings;
    return bookings.filter(booking => booking.property_id === selectedProperty);
  }, [bookings, selectedProperty]);

  // Prepare resources for multi-property view
  const resources = useMemo(() => {
    const propertiesToShow = selectedProperty === 'all' ? properties : properties.filter(p => p.id === selectedProperty);
    return propertiesToShow.map(property => ({
      id: property.id,
      title: pickName(property)
    }));
  }, [properties, selectedProperty]);

  // Prepare events for FullCalendar
  const fcEvents = useMemo(() => {
    const events: any[] = [];

    // Add iCal events
    filteredEvents.forEach(event => {
      events.push({
        id: `ical-${event.uid}`,
        title: event.summary || 'Occupato',
        start: event.start,
        end: event.end,
        resourceId: view === 'multi' ? event.property?.id : undefined,
        backgroundColor: '#ef4444',
        borderColor: '#dc2626',
        textColor: 'white',
        extendedProps: {
          type: 'ical',
          source: 'iCal',
          property: event.property
        }
      });
    });

    // Add Smoobu bookings
    filteredBookings.forEach(booking => {
      events.push({
        id: `booking-${booking.id}`,
        title: booking.guest_name || 'Prenotazione Smoobu',
        start: booking.check_in,
        end: booking.check_out,
        resourceId: view === 'multi' ? booking.property_id : undefined,
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        textColor: 'white',
        extendedProps: {
          type: 'booking',
          source: 'Smoobu',
          booking: booking
        }
      });
    });

    return events;
  }, [filteredEvents, filteredBookings, view]);

  // Check if we have limited details (availability-only iCal)
  const hasLimitedDetails = useMemo(() => {
    return filteredEvents.some(event => 
      !event.summary || 
      event.summary.toLowerCase().includes('not available') ||
      event.summary.toLowerCase().includes('non disponibile')
    );
  }, [filteredEvents]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-hostsuite-primary flex items-center gap-3">
              <CalendarIcon className="w-8 h-8" />
              Calendario Prenotazioni
            </h1>
            <p className="text-hostsuite-text/60 mt-2">
              Vista calendario in stile Smoobu delle tue prenotazioni
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSmoobuSync} disabled={isSyncing} variant="outline">
              <RotateCcw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizzando...' : 'Sync Smoobu'}
            </Button>
            <Button onClick={loadCalendarData} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Aggiorna
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* View Toggle */}
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                variant={view === 'multi' ? "default" : "ghost"}
                size="sm"
                onClick={() => setView('multi')}
                className="text-xs"
              >
                <Building className="w-4 h-4 mr-1" />
                Multi
              </Button>
              <Button
                variant={view === 'single' ? "default" : "ghost"}
                size="sm"
                onClick={() => setView('single')}
                className="text-xs"
              >
                <Users className="w-4 h-4 mr-1" />
                Singola
              </Button>
            </div>

            {/* Property Filter */}
            {activePropertyId === 'all' && (
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tutte le proprietà" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le proprietà</SelectItem>
                  {properties.map((prop) => (
                    <SelectItem key={prop.id} value={prop.id}>
                      {pickName(prop)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-hostsuite-text/60">
            <span>{filteredEvents.length + filteredBookings.length} prenotazioni</span>
            <span>{filteredBookings.length} da Smoobu</span>
            <span>{resources.length} proprietà</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      {hasLimitedDetails && (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <CardContent className="py-4 text-amber-800 text-sm">
            Il link iCal Smoobu in uso sembra essere l'ICS di disponibilità (solo "Not available"). Non contiene nomi/ospiti. Per vedere i dettagli usa l'ICS "Prenotazioni" in Smoobu oppure collega l'API. Nel frattempo mostriamo "Occupato".
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardContent className="p-6">
          <FullCalendar
            plugins={[resourceTimelinePlugin, dayGridPlugin, interactionPlugin]}
            initialView={view === 'multi' ? 'resourceTimelineMonth' : 'dayGridMonth'}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: view === 'multi' ? 'resourceTimelineMonth,resourceTimelineWeek' : 'dayGridMonth,dayGridWeek'
            }}
            resources={view === 'multi' ? resources : []}
            events={fcEvents}
            height="auto"
            locale="it"
            firstDay={1}
            weekends={true}
            eventDisplay="block"
            resourceAreaHeaderContent="Proprietà"
            resourceAreaWidth="200px"
            slotMinWidth={50}
            eventClick={(info) => {
              const { extendedProps } = info.event;
              if (extendedProps.type === 'booking') {
                console.log('Booking clicked:', extendedProps.booking);
              } else {
                console.log('iCal event clicked:', extendedProps);
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Legenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm">Prenotazioni Smoobu</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm">Eventi iCal</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarPro;