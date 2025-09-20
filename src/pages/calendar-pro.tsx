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
import HostNavbar from "@/components/HostNavbar";
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
  const [view, setView] = useState<'multi' | 'single'>('multi');
  const [properties, setProperties] = useState<Property[]>([]);
  const [icalUrls, setIcalUrls] = useState<IcalUrl[]>([]);
  const [events, setEvents] = useState<IcsEventEnriched[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const { id: activePropertyId } = useActiveProperty();
  const { toast: toastHook } = useToast();

  useEffect(() => {
    loadCalendarData();
  }, []);

  const loadCalendarData = async () => {
    try {
      setIsLoading(true);
      
      // Load properties, iCal URLs, and bookings from database
      const [propertiesResult, icalUrlsResult, bookingsResult] = await Promise.all([
        supaSelect<Property>('properties', '*'),
        supaSelect<IcalUrl>('ical_urls', `
          id, url, source, is_active, ical_config_id,
          ical_configs!inner(
            property_id, is_active,
            properties:property_id(id, nome)
          )
        `),
        supabase.from('bookings').select('*').order('check_in', { ascending: true })
      ]);

      const props = propertiesResult.data || [];
      const urls = icalUrlsResult.data || [];
      const dbBookings = bookingsResult.data || [];
      
      setProperties(props);
      setIcalUrls(urls);
      setBookings(dbBookings);

      // Fetch and parse all iCal feeds
      const allEvents: IcsEventEnriched[] = [];
      
      for (const url of urls.slice(0, 10)) { // Limit to prevent too many requests
        try {
          const response = await fetch(url.url, { mode: 'cors' });
          if (response.ok) {
            const icsText = await response.text();
            const parsedEvents = parseAndEnrichICS(icsText);
            
            // Add property info to events
            const propertyId = url.ical_configs?.property_id;
            const property = props.find(p => p.id === propertyId);
            
            parsedEvents.forEach(event => {
              (event as any).propertyId = propertyId;
              (event as any).propertyName = property ? pickName(property) : 'Unknown';
              (event as any).source = url.source || 'Unknown';
            });
            
            allEvents.push(...parsedEvents);
          }
        } catch (err) {
          console.warn('Failed to fetch iCal:', url.url, err);
        }
      }
      
      setEvents(allEvents);
      
    } catch (err) {
      console.error('Error loading calendar data:', err);
      toastHook({
        variant: "destructive",
        title: "Errore",
        description: "Errore nel caricamento del calendario",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSmoobuSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncSmoobuBookings();
      if (result.success) {
        toast.success(result.message);
        // Reload calendar data to show updated bookings
        loadCalendarData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Errore durante la sincronizzazione");
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Filter events and bookings by active property and selected property
  const filteredEvents = useMemo(() => {
    const effectiveFilter = activePropertyId === 'all' ? selectedProperty : activePropertyId;
    
    return events.filter(event => {
      if (effectiveFilter === 'all') return true;
      return (event as any).propertyId === effectiveFilter;
    });
  }, [events, activePropertyId, selectedProperty]);

  const filteredBookings = useMemo(() => {
    const effectiveFilter = activePropertyId === 'all' ? selectedProperty : activePropertyId;
    
    return bookings.filter(booking => {
      if (effectiveFilter === 'all') return true;
      return booking.property_id === effectiveFilter;
    });
  }, [bookings, activePropertyId, selectedProperty]);

  // Heuristic: Smoobu 'Not available' feed without guest details
  const hasLimitedDetails = useMemo(() => {
    if (!filteredEvents.length) return false;
    const blocked = filteredEvents.filter(ev => (ev.summary || '').toLowerCase() === 'not available' && !ev.guestName);
    return blocked.length / filteredEvents.length > 0.6;
  }, [filteredEvents]);

  // Prepare resources for timeline view
  const resources = useMemo(() => {
    const effectiveFilter = activePropertyId === 'all' ? selectedProperty : activePropertyId;
    
    let availableProperties = properties;
    if (effectiveFilter !== 'all') {
      availableProperties = properties.filter(p => p.id === effectiveFilter);
    }
    
    return availableProperties.map(property => ({
      id: property.id,
      title: pickName(property),
      city: property.city
    }));
  }, [properties, activePropertyId, selectedProperty]);

  // Helper function for channel colors
  const getChannelColor = (channel?: string, border = false) => {
    const colors = {
      'airbnb': border ? '#FF385C' : '#FF385C20',
      'booking.com': border ? '#003580' : '#00358020',
      'vrbo': border ? '#1866B4' : '#1866B420',
      'smoobu': border ? '#FF6B35' : '#FF6B3520',
      'other': border ? '#6B7280' : '#6B728020'
    };
    return colors[channel as keyof typeof colors] || colors.other;
  };

  // Convert events and bookings to FullCalendar format
  const fcEvents = useMemo(() => {
    const icalEvents = filteredEvents.map((event, index) => {
      const title = event.guestName || (
        event.summary && event.summary.toLowerCase() !== 'not available'
          ? event.summary
          : 'Occupato'
      );
      return {
        id: event.uid || `ical-event-${index}`,
        title,
        start: event.start,
        end: event.end,
        resourceId: (event as any).propertyId,
        extendedProps: {
          type: 'ical',
          guestName: event.guestName,
          guestsCount: event.guestsCount,
          channel: event.channel,
          status: event.statusHuman,
          unit: event.unitName,
          source: (event as any).source,
          summary: event.summary
        },
        className: `calendar-event calendar-event-${event.channel || 'other'}`
      };
    });

    const bookingEvents = filteredBookings.map((booking, index) => {
      return {
        id: `booking-${booking.id}`,
        title: booking.guest_name || 'Prenotazione',
        start: booking.check_in,
        end: booking.check_out,
        resourceId: booking.property_id,
        extendedProps: {
          type: 'booking',
          guestName: booking.guest_name,
          guestEmail: booking.guest_email,
          guestPhone: booking.guest_phone,
          guestsCount: booking.guests_count,
          adultsCount: booking.adults_count,
          childrenCount: booking.children_count,
          channel: booking.channel,
          status: booking.booking_status,
          reference: booking.booking_reference,
          totalPrice: booking.total_price,
          currency: booking.currency,
          specialRequests: booking.special_requests,
          source: 'database'
        },
        className: `calendar-event calendar-event-${booking.channel || 'other'}`
      };
    });

    return [...icalEvents, ...bookingEvents];
  }, [filteredEvents, filteredBookings]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <HostNavbar />
        <div className="pt-16">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Skeleton className="h-16 w-full mb-6" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <HostNavbar />
      <div className="pt-16">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
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
                selectable={false}
                resourceAreaWidth="220px"
                resourceAreaHeaderContent="Proprietà"
                slotMinWidth={40}
                nowIndicator={true}
                locale="it"
                firstDay={1}
                weekends={true}
                dayMaxEvents={false}
                eventDisplay="block"
                eventContent={(arg) => {
                  const props = arg.event.extendedProps as any;
                  const { guestName, guestsCount, channel, status, unit, type, reference, totalPrice, currency } = props;
                  const ch = (channel || 'other') as string;
                  const initial = ch.startsWith('booking') ? 'B' : ch.startsWith('airbnb') ? 'A' : ch.startsWith('vrbo') ? 'V' : 'S';
                  const title = guestName || arg.event.title;
                  
                  // Enhanced tooltip for database bookings
                  const tooltip = [
                    guestName ? `Ospite: ${guestName}` : '',
                    typeof guestsCount === 'number' ? `Ospiti: ${guestsCount}` : '',
                    status ? `Stato: ${status}` : '',
                    unit ? `Alloggio: ${unit}` : '',
                    reference ? `Riferimento: ${reference}` : '',
                    totalPrice && currency ? `Prezzo: ${totalPrice} ${currency}` : '',
                    type === 'booking' ? 'Fonte: Database Smoobu' : 'Fonte: iCal'
                  ].filter(Boolean).join('\n');
                  
                  return (
                    <div className="flex items-center gap-2 px-2 py-1" title={tooltip}>
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold chip-${ch} ${type === 'booking' ? 'ring-2 ring-green-400' : ''}`}>{initial}</span>
                      <span className="truncate text-xs font-medium">{title}</span>
                      {typeof guestsCount === 'number' && <span className="text-[10px] text-muted-foreground ml-1">({guestsCount})</span>}
                      {type === 'booking' && <span className="text-[8px] bg-green-100 text-green-700 px-1 rounded">DB</span>}
                    </div>
                  );
                }}
              />
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Legenda Canali</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {[
                  { channel: 'airbnb', name: 'Airbnb' },
                  { channel: 'booking.com', name: 'Booking.com' },
                  { channel: 'vrbo', name: 'VRBO' },
                  { channel: 'smoobu', name: 'Smoobu' },
                  { channel: 'other', name: 'Altri' }
                ].map(({ channel, name }) => (
                  <div key={channel} className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: getChannelColor(channel) }}
                    />
                    <span className="text-sm text-hostsuite-text">{name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CalendarPro;