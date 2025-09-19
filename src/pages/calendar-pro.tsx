import { useState, useEffect, useMemo } from "react";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Calendar as CalendarIcon, 
  RefreshCw, 
  BarChart3,
  Grid3X3,
  Info,
  AlertCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import HostNavbar from "@/components/HostNavbar";
import PropertySwitch from "@/components/PropertySwitch";
import { useActiveProperty } from "@/hooks/useActiveProperty";
import { supaSelect } from "@/lib/supaSafe";
import { listIcalUrls, type IcalUrl } from "@/lib/supaIcal";
import { parseAndEnrichICS, IcsEventEnriched } from "@/lib/ics-parse";

interface Property {
  id: string;
  nome: string;
  city?: string;
  status?: string;
}

interface CalendarEvent extends IcsEventEnriched {
  id: string;
  title: string;
  start: string;
  end?: string;
  resourceId?: string;
  extendedProps: {
    guests?: number;
    unit?: string;
    channel?: string;
    status?: string;
    guestName?: string;
  };
}

const CalendarPro = () => {
  const { id: activePropertyId } = useActiveProperty();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [icalUrls, setIcalUrls] = useState<IcalUrl[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [corsErrors, setCorsErrors] = useState<string[]>([]);
  
  // View state
  const [viewMode, setViewMode] = useState<'single' | 'multi'>('single');
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  useEffect(() => {
    loadCalendarData();
  }, [activePropertyId]);

  const loadCalendarData = async () => {
    setLoading(true);
    setError(null);
    setCorsErrors([]);
    
    try {
      // Load properties
      const { data: propertiesData, error: propertiesError } = await supaSelect<Property>(
        'properties', 
        'id,nome,city,status'
      );
      if (propertiesError) throw propertiesError;
      setProperties(propertiesData || []);

      // Load iCal URLs (filtered by active property if not 'all')
      const { data: urlsData, error: urlsError } = await listIcalUrls(
        activePropertyId !== 'all' ? activePropertyId : undefined
      );
      if (urlsError) throw urlsError;
      
      const activeUrls = (urlsData || []).filter(url => url.is_active);
      setIcalUrls(activeUrls);

      // Fetch and parse iCal data
      await fetchAllIcalData(activeUrls);

    } catch (err) {
      console.error('Error loading calendar data:', err);
      setError('Errore nel caricamento dei dati del calendario');
      toast({
        title: "Errore",
        description: "Errore nel caricamento dei dati",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllIcalData = async (urls: IcalUrl[]) => {
    const allEvents: CalendarEvent[] = [];
    const corsErrorUrls: string[] = [];

    for (const url of urls) {
      try {
        // Try with CORS first
        let response = await fetch(url.url, { mode: 'cors' });
        
        if (!response.ok) {
          // Retry with no-cors - but this won't give us the actual content
          response = await fetch(url.url, { mode: 'no-cors' });
          if (!response.ok) {
            throw new Error('CORS blocked');
          }
        }
        
        const text = await response.text();
        const parsedEvents = parseAndEnrichICS(text);
        
        // Convert to FullCalendar format
        const calendarEvents: CalendarEvent[] = parsedEvents.map(event => ({
          ...event,
          id: event.uid || `${url.id}-${event.start}`,
          title: event.guestName || event.summary || 'Prenotazione',
          start: event.start || '',
          end: event.end,
          resourceId: getPropertyIdFromUrl(url),
          extendedProps: {
            guests: event.guestsCount,
            unit: event.unitName,
            channel: event.channel,
            status: event.status,
            guestName: event.guestName
          }
        }));
        
        allEvents.push(...calendarEvents);
        
      } catch (err) {
        console.error(`Failed to fetch iCal from ${url.source}:`, err);
        corsErrorUrls.push(url.source || url.url);
      }
    }
    
    setEvents(allEvents);
    setCorsErrors(corsErrorUrls);
  };

  const getPropertyIdFromUrl = (url: IcalUrl): string => {
    // Get property_id from the related ical_config
    return (url as any).ical_configs?.property_id || 'unknown';
  };

  // Filter events for active properties only
  const filteredEvents = useMemo(() => {
    if (!showActiveOnly) return events;
    
    const activePropertyIds = properties
      .filter(p => p.status === 'active')
      .map(p => p.id);
    
    return events.filter(event => 
      activePropertyIds.includes(event.resourceId || '')
    );
  }, [events, properties, showActiveOnly]);

  // Prepare resources for timeline view
  const resources = useMemo(() => {
    return properties.map(property => ({
      id: property.id,
      title: property.nome,
      extendedProps: {
        city: property.city,
        status: property.status
      }
    }));
  }, [properties]);

  const eventContent = (eventInfo: any) => {
    const { event } = eventInfo;
    const { guests, channel, guestName } = event.extendedProps;
    
    return (
      <div className="p-1 text-xs">
        <div className="font-medium truncate">{guestName || event.title}</div>
        <div className="flex items-center gap-1 mt-1">
          {guests && (
            <span className="bg-white/20 px-1 rounded">{guests}👥</span>
          )}
          {channel && (
            <span className="bg-white/20 px-1 rounded capitalize">{channel}</span>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <HostNavbar />
        <div className="pt-20 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <HostNavbar />
      <div className="pt-20 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-hostsuite-primary flex items-center gap-3">
                <CalendarIcon className="w-8 h-8" />
                Calendario Pro
              </h1>
              <p className="text-hostsuite-text/60 mt-2">
                Vista calendario avanzata delle prenotazioni sincronizzate
              </p>
            </div>
            <Button onClick={loadCalendarData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Aggiorna
            </Button>
          </div>
        </div>

        {/* CORS Errors Alert */}
        {corsErrors.length > 0 && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              CORS bloccato per: {corsErrors.join(', ')}. 
              Configura CORS lato sorgente o usa un proxy Edge Function.
            </AlertDescription>
          </Alert>
        )}

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-6">
              
              {/* View Mode Toggle */}
              <div className="flex items-center gap-4">
                <Label className="text-sm font-medium">Vista:</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'single' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('single')}
                    className="flex items-center gap-2"
                  >
                    <Grid3X3 className="w-4 h-4" />
                    Mensile
                  </Button>
                  <Button
                    variant={viewMode === 'multi' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('multi')}
                    className="flex items-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Timeline
                  </Button>
                </div>
              </div>

              {/* Active Only Filter */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="active-only"
                  checked={showActiveOnly}
                  onCheckedChange={setShowActiveOnly}
                />
                <Label htmlFor="active-only" className="text-sm">
                  Solo proprietà attive
                </Label>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-hostsuite-text/60">
                <span>{filteredEvents.length} prenotazioni</span>
                <span>{properties.length} proprietà</span>
                <span>{icalUrls.length} feed iCal</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {viewMode === 'single' ? (
                <>
                  <Grid3X3 className="w-5 h-5" />
                  Vista Mensile
                </>
              ) : (
                <>
                  <BarChart3 className="w-5 h-5" />
                  Timeline Proprietà
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="w-16 h-16 text-hostsuite-primary/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-hostsuite-text mb-2">
                  Nessuna prenotazione
                </h3>
                <p className="text-hostsuite-text/60">
                  {icalUrls.length === 0 
                    ? 'Configura i link iCal per vedere le prenotazioni' 
                    : 'Controlla i filtri o verifica i feed iCal'
                  }
                </p>
              </div>
            ) : (
              <div className="calendar-container">
                <FullCalendar
                  plugins={[dayGridPlugin, resourceTimelinePlugin, interactionPlugin]}
                  initialView={viewMode === 'single' ? 'dayGridMonth' : 'resourceTimelineMonth'}
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: viewMode === 'single' ? 'dayGridMonth,dayGridWeek' : 'resourceTimelineMonth,resourceTimelineWeek'
                  }}
                  resources={viewMode === 'multi' ? resources : undefined}
                  events={filteredEvents}
                  eventContent={eventContent}
                  height="auto"
                  locale="it"
                  firstDay={1} // Monday
                  eventClassNames="cursor-pointer"
                  eventClick={(info) => {
                    const { event } = info;
                    const props = event.extendedProps;
                    
                    toast({
                      title: event.title,
                      description: `
                        ${props.guestName ? `Ospite: ${props.guestName}` : ''}
                        ${props.guests ? ` • ${props.guests} ospiti` : ''}
                        ${props.channel ? ` • ${props.channel}` : ''}
                        ${props.unit ? ` • ${props.unit}` : ''}
                      `.trim()
                    });
                  }}
                  eventDidMount={(info) => {
                    const { event } = info;
                    const { channel } = event.extendedProps;
                    
                    // Color events by channel
                    const colors = {
                      airbnb: '#FF5A5F',
                      'booking.com': '#003580',
                      vrbo: '#7B2CBF',
                      smoobu: '#FF8C00',
                      other: '#6B7280'
                    };
                    
                    info.el.style.backgroundColor = colors[channel as keyof typeof colors] || colors.other;
                    info.el.style.borderColor = colors[channel as keyof typeof colors] || colors.other;
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Channel Legend */}
        {filteredEvents.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Legenda Canali</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Badge style={{ backgroundColor: '#FF5A5F', color: 'white' }}>
                  Airbnb
                </Badge>
                <Badge style={{ backgroundColor: '#003580', color: 'white' }}>
                  Booking.com
                </Badge>
                <Badge style={{ backgroundColor: '#7B2CBF', color: 'white' }}>
                  VRBO
                </Badge>
                <Badge style={{ backgroundColor: '#FF8C00', color: 'white' }}>
                  Smoobu
                </Badge>
                <Badge style={{ backgroundColor: '#6B7280', color: 'white' }}>
                  Altro
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
};

export default CalendarPro;