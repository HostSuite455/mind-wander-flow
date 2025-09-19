import { useState, useEffect, useMemo } from "react";
import { parseAndEnrichICS, IcsEventEnriched } from "@/lib/ics-parse";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CalendarIcon, SearchIcon, FilterIcon, ChevronDownIcon, InfoIcon } from "lucide-react";

interface IcsPreviewProps {
  url: string;
}

export const IcsPreview = ({ url }: IcsPreviewProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<IcsEventEnriched[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [showRawDetails, setShowRawDetails] = useState(false);
  const [selectedEventForRaw, setSelectedEventForRaw] = useState<string | null>(null);

  useEffect(() => {
    const fetchICS = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Try with CORS first
        let response = await fetch(url, { mode: 'cors' });
        
        if (!response.ok) {
          // Retry with no-cors
          response = await fetch(url, { mode: 'no-cors' });
        }
        
        const text = await response.text();
        const parsedEvents = parseAndEnrichICS(text).slice(0, 200);
        setEvents(parsedEvents);
        
        // Debug logging if enabled
        if (localStorage.getItem('debug') === '2') {
          console.log('Parsed events (debug):', parsedEvents.slice(0, 2));
        }
      } catch (err) {
        console.error('Failed to fetch ICS:', err);
        setError('CORS bloccato: configura un Edge Function proxy (TODO) o abilita CORS lato sorgente');
      } finally {
        setLoading(false);
      }
    };

    if (url) {
      fetchICS();
    }
  }, [url]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = !searchTerm || 
        (event.summary?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (event.guestName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (event.unitName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
      const eventDate = event.start?.split('T')[0] || event.start;
      const matchesDateRange = (!startDate || eventDate >= startDate) && 
                              (!endDate || eventDate <= endDate);
      
      const matchesChannel = channelFilter === 'all' || event.channel === channelFilter;
      
      return matchesSearch && matchesDateRange && matchesChannel;
    });
  }, [events, searchTerm, startDate, endDate, channelFilter]);

  const StatusBadge = ({ value }: { value?: string }) => {
    const status = value?.toLowerCase();
    const className = status?.includes('cancel') ? 'bg-red-100 text-red-800'
      : status?.includes('provv') ? 'bg-yellow-100 text-yellow-800'
      : status?.includes('conferm') ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
        {value || 'Sconosciuto'}
      </span>
    );
  };

  const ChannelBadge = ({ channel }: { channel?: string }) => {
    const getChannelColor = (ch?: string) => {
      switch (ch) {
        case 'airbnb': return 'bg-pink-100 text-pink-800';
        case 'booking.com': return 'bg-blue-100 text-blue-800';
        case 'vrbo': return 'bg-purple-100 text-purple-800';
        case 'smoobu': return 'bg-orange-100 text-orange-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };
    
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getChannelColor(channel)}`}>
        {channel || 'other'}
      </span>
    );
  };

  const RawEventDetails = ({ event }: { event: IcsEventEnriched }) => (
    <div className="bg-gray-50 p-3 rounded text-xs font-mono space-y-2">
      <div>
        <strong>Summary:</strong> {event.summary || '—'}
      </div>
      <div>
        <strong>Status:</strong> {event.status || '—'}
      </div>
      {event.description && (
        <div>
          <strong>Description (primi 200 char):</strong>
          <div className="bg-white p-2 rounded mt-1 whitespace-pre-wrap">
            {event.description.substring(0, 200)}
            {event.description.length > 200 && '...'}
          </div>
        </div>
      )}
      {event.attendees && event.attendees.length > 0 && (
        <div>
          <strong>Attendees:</strong>
          <ul className="bg-white p-2 rounded mt-1">
            {event.attendees.map((att, i) => (
              <li key={i}>{att}</li>
            ))}
          </ul>
        </div>
      )}
      {event.organizer && (
        <div>
          <strong>Organizer:</strong>
          <div className="bg-white p-2 rounded mt-1">{event.organizer}</div>
        </div>
      )}
      {event.rawLines && (
        <div>
          <strong>Raw Lines (prime 10):</strong>
          <ul className="bg-white p-2 rounded mt-1 max-h-32 overflow-y-auto">
            {event.rawLines.slice(0, 10).map((line, i) => (
              <li key={i} className="text-xs">{line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Caricamento prenotazioni...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Prenotazioni iCal ({events.length})
        </CardTitle>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 pt-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per titolo, ospite o alloggio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              type="date"
              placeholder="Da"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
            />
            <Input
              type="date"
              placeholder="A"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i canali</SelectItem>
                <SelectItem value="airbnb">Airbnb</SelectItem>
                <SelectItem value="booking.com">Booking.com</SelectItem>
                <SelectItem value="vrbo">VRBO</SelectItem>
                <SelectItem value="smoobu">Smoobu</SelectItem>
                <SelectItem value="other">Altro</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRawDetails(!showRawDetails)}
              className="flex items-center gap-2"
            >
              <InfoIcon className="w-4 h-4" />
              {showRawDetails ? 'Nascondi Raw' : 'Mostra Raw'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {events.length === 0 ? 'Nessuna prenotazione trovata' : 'Nessun risultato per i filtri applicati'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Check-in</th>
                  <th className="text-left py-2 px-3">Check-out</th>
                  <th className="text-left py-2 px-3">Titolo</th>
                  <th className="text-left py-2 px-3">Ospite</th>
                  <th className="text-left py-2 px-3">Ospiti</th>
                  <th className="text-left py-2 px-3">Alloggio</th>
                  <th className="text-left py-2 px-3">Canale</th>
                  <th className="text-left py-2 px-3">Stato</th>
                  {showRawDetails && <th className="text-left py-2 px-3">Debug</th>}
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event, index) => {
                  const eventKey = event.uid || index;
                  return (
                    <>
                      <tr key={eventKey} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3 whitespace-nowrap">
                          {event.start ? new Date(event.start).toLocaleDateString('it-IT') : '—'}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {event.end ? new Date(event.end).toLocaleDateString('it-IT') : '—'}
                        </td>
                        <td className="py-2 px-3 max-w-xs truncate" title={event.summary}>
                          {event.summary || '—'}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap" title={event.guestName}>
                          {event.guestName || '—'}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {typeof event.guestsCount === 'number' ? event.guestsCount : '—'}
                        </td>
                        <td className="py-2 px-3 truncate max-w-[220px]" title={event.unitName}>
                          {event.unitName || '—'}
                        </td>
                        <td className="py-2 px-3">
                          <ChannelBadge channel={event.channel} />
                        </td>
                        <td className="py-2 px-3">
                          <StatusBadge value={event.statusHuman || 'Sconosciuto'} />
                        </td>
                        {showRawDetails && (
                          <td className="py-2 px-3">
                            <Collapsible>
                              <CollapsibleTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <ChevronDownIcon className="w-4 h-4" />
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="mt-2">
                                <RawEventDetails event={event} />
                              </CollapsibleContent>
                            </Collapsible>
                          </td>
                        )}
                      </tr>
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Add default export for compatibility
export default IcsPreview;