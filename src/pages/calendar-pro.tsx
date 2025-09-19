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
import { CalendarIcon, RefreshCw, Users, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supaSelect, pickName } from "@/lib/supaSafe";
import { parseAndEnrichICS, IcsEventEnriched } from "@/lib/ics-parse";
import HostNavbar from "@/components/HostNavbar";
import { useActiveProperty } from "@/hooks/useActiveProperty";
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

const CalendarPro = () => {
  const [view, setView] = useState<'multi' | 'single'>('multi');
  const [properties, setProperties] = useState<Property[]>([]);
  const [icalUrls, setIcalUrls] = useState<IcalUrl[]>([]);
  const [events, setEvents] = useState<IcsEventEnriched[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const { id: activePropertyId } = useActiveProperty();
  const { toast } = useToast();

  useEffect(() => {
    loadCalendarData();
  }, []);

  const loadCalendarData = async () => {
    try {
      setIsLoading(true);
      
      // Load properties and iCal URLs
      const [propertiesResult, icalUrlsResult] = await Promise.all([
        supaSelect<Property>('properties', '*'),
        supaSelect<IcalUrl>('ical_urls', `
          id, url, source, is_active, ical_config_id,
          ical_configs!inner(
            property_id, is_active,
            properties:property_id(id, nome)
          )
        `)
      ]);

      const props = propertiesResult.data || [];
      const urls = icalUrlsResult.data || [];
      
      setProperties(props);
      setIcalUrls(urls);

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
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Errore nel caricamento del calendario",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter events by active property and selected property
  const filteredEvents = useMemo(() => {
    const effectiveFilter = activePropertyId === 'all' ? selectedProperty : activePropertyId;
    
    return events.filter(event => {
      if (effectiveFilter === 'all') return true;
      return (event as any).propertyId === effectiveFilter;
    });
  }, [events, activePropertyId, selectedProperty]);

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

  // Convert events to FullCalendar format
  const fcEvents = useMemo(() => {
    return filteredEvents.map((event, index) => {
      const title = event.guestName || (
        event.summary && event.summary.toLowerCase() !== 'not available'
          ? event.summary
          : 'Occupato'
      );
      return {
        id: event.uid || `event-${index}`,
        title,
        start: event.start,
        end: event.end,
        resourceId: (event as any).propertyId,
        extendedProps: {
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
  }, [filteredEvents]);

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
              <Button onClick={loadCalendarData} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Aggiorna
              </Button>
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
                <span>{filteredEvents.length} prenotazioni</span>
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
                  const { guestName, guestsCount, channel, status, unit } = arg.event.extendedProps as any;
                  const ch = (channel || 'other') as string;
                  const initial = ch.startsWith('booking') ? 'B' : ch.startsWith('airbnb') ? 'A' : ch.startsWith('vrbo') ? 'V' : 'S';
                  const title = guestName || arg.event.title;
                  // Tooltip text
                  const tooltip = [
                    guestName ? `Ospite: ${guestName}` : '',
                    typeof guestsCount === 'number' ? `Ospiti: ${guestsCount}` : '',
                    status ? `Stato: ${status}` : '',
                    unit ? `Alloggio: ${unit}` : ''
                  ].filter(Boolean).join('\n');
                  return (
                    <div className="flex items-center gap-2 px-2 py-1" title={tooltip}>
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold chip-${ch}`}>{initial}</span>
                      <span className="truncate text-xs font-medium">{title}</span>
                      {typeof guestsCount === 'number' && <span className="text-[10px] text-muted-foreground ml-1">({guestsCount})</span>}
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