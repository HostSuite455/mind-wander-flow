import { useState, useEffect, useMemo } from "react";
import { parseICSWithMetadata, ParsedIcsEvent } from "@/lib/ics-parse";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, SearchIcon } from "lucide-react";

interface IcsPreviewProps {
  url: string;
}

export const IcsPreview = ({ url }: IcsPreviewProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<ParsedIcsEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
        const parsedEvents = parseICSWithMetadata(text).slice(0, 50);
        setEvents(parsedEvents);
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
        (event.summary?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
      const eventDate = event.start?.split('T')[0] || event.start;
      const matchesDateRange = (!startDate || eventDate >= startDate) && 
                              (!endDate || eventDate <= endDate);
      
      return matchesSearch && matchesDateRange;
    });
  }, [events, searchTerm, startDate, endDate]);

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
                placeholder="Cerca per titolo..."
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
                  <th className="text-left py-2 px-3">Stato</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event, index) => (
                  <tr key={event.uid || index} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-3">
                      {event.start ? new Date(event.start).toLocaleDateString('it-IT') : '—'}
                    </td>
                    <td className="py-2 px-3">
                      {event.end ? new Date(event.end).toLocaleDateString('it-IT') : '—'}
                    </td>
                    <td className="py-2 px-3 max-w-xs truncate" title={event.summary}>
                      {event.summary || '—'}
                    </td>
                    <td className="py-2 px-3 max-w-xs truncate" title={event.guest_name}>
                      {event.guest_name || '—'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {event.guests_count || '—'}
                    </td>
                    <td className="py-2 px-3 max-w-xs truncate" title={event.listing_title}>
                      {event.listing_title || '—'}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        event.status?.toLowerCase() === 'confirmed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {event.status || 'Sconosciuto'}
                      </span>
                    </td>
                  </tr>
                ))}
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