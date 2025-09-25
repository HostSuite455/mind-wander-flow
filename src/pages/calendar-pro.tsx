import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, RefreshCw, Users, Building, RotateCcw, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { pickName } from "@/lib/supaSafe";
import { parseAndEnrichICS, IcsEventEnriched } from "@/lib/ics-parse";
import { useActiveProperty } from "@/hooks/useActiveProperty";
import { syncSmoobuBookings } from "@/lib/smoobuSync";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  createCalendarBlock, 
  updateCalendarBlock, 
  deleteCalendarBlock, 
  CalendarBlock 
} from "@/lib/supaBlocks";
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

interface EnrichedIcsEvent extends IcsEventEnriched {
  property_id?: string;
}

type EventFilter = 'all' | 'blocks' | 'bookings';

const CalendarPro = () => {
  const { id: activePropertyId } = useActiveProperty();
  const { toast: toastHook } = useToast();
  const calendarRef = useRef<FullCalendar>(null);
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [icalsData, setIcalsData] = useState<EnrichedIcsEvent[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [calendarBlocks, setCalendarBlocks] = useState<CalendarBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [view, setView] = useState<'multi' | 'single'>('multi');
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<EventFilter>('all');

  const loadCalendarData = async () => {
    setIsLoading(true);
    try {
      // Load properties
      const { data: propertiesData } = await supabase
        .from('properties')
        .select('id, nome, city, status')
        .eq('host_id', (await supabase.auth.getUser()).data.user?.id || '');
      
      setProperties(propertiesData || []);

      // Load calendar blocks
      let blocksQuery = supabase
        .from('calendar_blocks')
        .select('*');
      
      if (selectedProperty && selectedProperty !== 'all') {
        blocksQuery = blocksQuery.eq('property_id', selectedProperty);
      }
      
      const { data: blocksData } = await blocksQuery;
      setCalendarBlocks(blocksData || []);

      // Load bookings
      let bookingsQuery = supabase
        .from('bookings')
        .select('*');
      
      if (selectedProperty && selectedProperty !== 'all') {
        bookingsQuery = bookingsQuery.eq('property_id', selectedProperty);
      }
      
      const { data: bookingsData } = await bookingsQuery;
      setBookings(bookingsData || []);

      // Load iCal data
      const { data: icalsQuery } = await supabase
        .from('ical_urls')
        .select(`
          id, ical_config_id, url, source, is_active,
          ical_configs!inner(
            property_id, is_active,
            properties!inner(id, nome, city, status)
          )
        `)
        .eq('is_active', true);

      if (icalsQuery) {
        const allEvents: EnrichedIcsEvent[] = [];
        for (const icalUrl of icalsQuery) {
          if (icalUrl.ical_configs?.is_active && icalUrl.ical_configs.properties) {
            try {
              const events = await parseAndEnrichICS(icalUrl.url);
              // Add property_id to each event
              const eventsWithProperty = events.map(event => ({
                ...event,
                property_id: icalUrl.ical_configs!.property_id
              }));
              allEvents.push(...eventsWithProperty);
            } catch (error) {
              console.error(`Error parsing iCal ${icalUrl.url}:`, error);
            }
          }
        }
        setIcalsData(allEvents);
      }

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
  }, [selectedProperty]);

  // Filter events and bookings based on selected property
  const filteredEvents = useMemo(() => {
    if (selectedProperty === 'all') return icalsData;
    return icalsData.filter(event => event.property_id === selectedProperty);
  }, [icalsData, selectedProperty]);

  const filteredBookings = useMemo(() => {
    if (selectedProperty === 'all') return bookings;
    return bookings.filter(booking => booking.property_id === selectedProperty);
  }, [bookings, selectedProperty]);

  const filteredCalendarBlocks = useMemo(() => {
    if (selectedProperty === 'all') return calendarBlocks;
    return calendarBlocks.filter(block => block.property_id === selectedProperty);
  }, [calendarBlocks, selectedProperty]);

  // Prepare resources for multi-property view
  const resources = useMemo(() => {
    const propertiesToShow = selectedProperty === 'all' ? properties : properties.filter(p => p.id === selectedProperty);
    return propertiesToShow.map(property => ({
      id: property.id,
      title: pickName(property)
    }));
  }, [properties, selectedProperty]);

  // Prepare events for FullCalendar with filtering
  const fcEvents = useMemo(() => {
    let events: any[] = [];

    // Apply event filter
    const shouldIncludeBlocks = eventFilter === 'all' || eventFilter === 'blocks';
    const shouldIncludeBookings = eventFilter === 'all' || eventFilter === 'bookings';

    // Add iCal events (treated as reservations)
    if (shouldIncludeBookings) {
      filteredEvents.forEach(event => {
        events.push({
          id: `ical-${event.uid}`,
          title: event.summary || 'Occupato',
          start: event.start,
          end: event.end,
          resourceId: view === 'multi' ? event.property_id : undefined,
          backgroundColor: '#ef4444',
          borderColor: '#dc2626',
          textColor: 'white',
          editable: false,
          extendedProps: {
            type: 'reservation',
            source: 'ical',
            propertyId: event.property_id
          }
        });
      });
    }

    // Add Smoobu bookings
    if (shouldIncludeBookings) {
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
          editable: false,
          extendedProps: {
            type: 'reservation',
            source: 'smoobu',
            booking: booking
          }
        });
      });
    }

    // Add calendar blocks
    if (shouldIncludeBlocks) {
      filteredCalendarBlocks.forEach(block => {
        const isManual = block.source === 'manual';
        events.push({
          id: `block-${block.id}`,
          title: block.reason || 'Blocco Manuale',
          start: block.start_date,
          end: block.end_date,
          resourceId: view === 'multi' ? block.property_id : undefined,
          backgroundColor: '#8b5cf6',
          borderColor: '#7c3aed',
          textColor: 'white',
          editable: isManual,
          extendedProps: {
            type: 'block',
            source: block.source,
            isManual,
            block: block
          }
        });
      });
    }

    return events;
  }, [filteredEvents, filteredBookings, filteredCalendarBlocks, view, eventFilter]);

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
              Vista calendario interattiva - crea, modifica ed elimina blocchi
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

            {/* Event Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-hostsuite-text/60" />
              <Select value={eventFilter} onValueChange={(value: EventFilter) => setEventFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutto</SelectItem>
                  <SelectItem value="blocks">Solo Blocchi</SelectItem>
                  <SelectItem value="bookings">Solo Prenotazioni</SelectItem>
                </SelectContent>
              </Select>
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
            <span>{fcEvents.filter(e => e.extendedProps.type === 'reservation').length} prenotazioni</span>
            <span>{fcEvents.filter(e => e.extendedProps.type === 'block').length} blocchi</span>
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
            ref={calendarRef}
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
            timeZone="Europe/Rome"
            firstDay={1}
            weekends={true}
            eventDisplay="block"
            resourceAreaHeaderContent="Proprietà"
            resourceAreaWidth="200px"
            slotMinWidth={50}
            selectable={true}
            selectMirror={true}
            unselectAuto={true}
            longPressDelay={0}
            editable={true}
            eventResizableFromStart={true}
            selectAllow={(selectInfo) => {
              // Allow selection on any area
              return true;
            }}
            eventAllow={(dropLocation, draggedEvent) => {
              // Only allow drag/resize for manual blocks
              return draggedEvent.extendedProps.type === 'block' && draggedEvent.extendedProps.isManual;
            }}
            select={async (selectInfo) => {
              try {
                const propertyId = selectInfo.resource?.id || selectedProperty === 'all' ? 
                  (activePropertyId === 'all' ? null : activePropertyId) : 
                  selectedProperty;
                
                if (!propertyId || propertyId === 'all') {
                  toast.error('Seleziona una proprietà specifica per creare un blocco');
                  return;
                }

                const result = await createCalendarBlock({
                  property_id: propertyId,
                  start_date: selectInfo.startStr,
                  end_date: selectInfo.endStr,
                  reason: 'Blocco Manuale'
                });

                if (result.data) {
                  toast.success('Blocco calendario creato con successo');
                  loadCalendarData();
                } else {
                  toast.error('Errore nella creazione del blocco');
                }
              } catch (error) {
                console.error('Error creating calendar block:', error);
                toast.error('Errore nella creazione del blocco');
              }
            }}
            eventDrop={async (dropInfo) => {
              const { event } = dropInfo;
              if (event.extendedProps.type !== 'block' || !event.extendedProps.isManual) {
                dropInfo.revert();
                return;
              }

              try {
                const blockId = event.id.replace('block-', '');
                await updateCalendarBlock(blockId, {
                  start_date: event.startStr,
                  end_date: event.endStr || event.startStr
                });
                toast.success('Blocco aggiornato con successo');
                loadCalendarData();
              } catch (error) {
                console.error('Error updating calendar block:', error);
                toast.error('Errore nell\'aggiornamento del blocco');
                dropInfo.revert();
              }
            }}
            eventResize={async (resizeInfo) => {
              const { event } = resizeInfo;
              if (event.extendedProps.type !== 'block' || !event.extendedProps.isManual) {
                resizeInfo.revert();
                return;
              }

              try {
                const blockId = event.id.replace('block-', '');
                await updateCalendarBlock(blockId, {
                  start_date: event.startStr,
                  end_date: event.endStr || event.startStr
                });
                toast.success('Blocco ridimensionato con successo');
                loadCalendarData();
              } catch (error) {
                console.error('Error resizing calendar block:', error);
                toast.error('Errore nel ridimensionamento del blocco');
                resizeInfo.revert();
              }
            }}
            eventClick={async (info) => {
              const { event } = info;
              const { extendedProps } = event;
              
              if (extendedProps.type === 'block' && extendedProps.isManual) {
                // Show delete confirmation for manual blocks
                if (confirm('Vuoi eliminare questo blocco?')) {
                  try {
                    const blockId = event.id.replace('block-', '');
                    const result = await deleteCalendarBlock(blockId);
                    if (!result.error) {
                      toast.success('Blocco eliminato con successo');
                      loadCalendarData();
                    }
                  } catch (error) {
                    console.error('Error deleting calendar block:', error);
                    toast.error('Errore nell\'eliminazione del blocco');
                  }
                }
              } else if (extendedProps.type === 'reservation') {
                // Show booking details for reservations
                console.log('Reservation clicked:', extendedProps);
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Legend & Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="text-sm">Blocchi Manuali</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Istruzioni</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-hostsuite-text/80 space-y-2">
            <p>• <strong>Crea blocco:</strong> Trascina il mouse per selezionare date</p>
            <p>• <strong>Modifica blocco:</strong> Trascina o ridimensiona i blocchi viola</p>
            <p>• <strong>Elimina blocco:</strong> Clicca su un blocco viola per eliminarlo</p>
            <p>• <strong>Prenotazioni:</strong> Sola lettura, non modificabili</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CalendarPro;