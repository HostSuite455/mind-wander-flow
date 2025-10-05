import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Calendar, ExternalLink, Edit, Trash2 } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { it } from 'date-fns/locale';

interface BookingDetailsPopoverProps {
  booking: {
    id: string;
    guest_name: string | null;
    total_guests: number | null;
    start_date: string;
    end_date: string;
    source: string;
    reason?: string;
  };
  property: {
    nome: string;
    address?: string;
  };
  isHost: boolean;
  onEdit?: () => void;
  onCancel?: () => void;
  children: React.ReactNode;
}

export function BookingDetailsPopover({
  booking,
  property,
  isHost,
  onEdit,
  onCancel,
  children
}: BookingDetailsPopoverProps) {
  const checkIn = parseISO(booking.start_date);
  const checkOut = parseISO(booking.end_date);
  const nights = differenceInDays(checkOut, checkIn);
  
  // Map source to badge + color
  const getSourceInfo = (source: string) => {
    const lowerSource = source.toLowerCase();
    if (lowerSource.includes('airbnb')) return { label: 'Airbnb', color: 'bg-[#FF5A5F]' };
    if (lowerSource.includes('booking')) return { label: 'Booking.com', color: 'bg-[#003580]' };
    if (lowerSource.includes('vrbo')) return { label: 'Vrbo', color: 'bg-[#006FB9]' };
    if (lowerSource.includes('ical')) return { label: 'iCal', color: 'bg-primary' };
    return { label: 'Manuale', color: 'bg-secondary' };
  };
  
  const sourceInfo = getSourceInfo(booking.source);
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-4" side="right" align="start">
        <div className="space-y-3">
          {/* Header con guest + portale */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">
                {booking.guest_name || 'Ospite non specificato'}
              </h3>
              <p className="text-sm text-muted-foreground">{property.nome}</p>
            </div>
            <Badge 
              className={`${sourceInfo.color} text-white border-0`}
            >
              {sourceInfo.label}
            </Badge>
          </div>
          
          {/* Info ospiti */}
          {booking.total_guests && booking.total_guests > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{booking.total_guests} ospit{booking.total_guests === 1 ? 'e' : 'i'}</span>
            </div>
          )}
          
          {/* Date check-in/out */}
          <div className="grid grid-cols-2 gap-3 py-3 border-y">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Check-in</label>
              <p className="font-medium">{format(checkIn, 'dd MMM yyyy', { locale: it })}</p>
              <p className="text-sm text-muted-foreground">{format(checkIn, 'EEEE', { locale: it })}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Check-out</label>
              <p className="font-medium">{format(checkOut, 'dd MMM yyyy', { locale: it })}</p>
              <p className="text-sm text-muted-foreground">{format(checkOut, 'EEEE', { locale: it })}</p>
            </div>
          </div>
          
          {/* Durata soggiorno */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{nights} nott{nights === 1 ? 'e' : 'i'}</span>
          </div>
          
          {/* Reason/notes se presenti */}
          {booking.reason && (
            <div className="text-sm text-muted-foreground border-t pt-2">
              {booking.reason}
            </div>
          )}
          
          {/* Azioni Host */}
          {isHost && (
            <div className="flex flex-col gap-2 pt-3 border-t">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <ExternalLink className="h-4 w-4 mr-2" />
                Visualizza dettagli
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={onEdit}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifica
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="flex-1"
                  onClick={onCancel}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Cancella
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
