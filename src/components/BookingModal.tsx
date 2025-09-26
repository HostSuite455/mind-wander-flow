import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Euro, 
  Users, 
  Clock,
  Edit3,
  Save,
  X,
  AlertCircle
} from 'lucide-react';
import { CalendarBooking } from '@/hooks/useCalendarData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BookingModalProps {
  booking: CalendarBooking | null;
  isOpen: boolean;
  onClose: () => void;
  onBookingUpdated?: (booking: CalendarBooking) => void;
  readOnly?: boolean;
}

export function BookingModal({ 
  booking, 
  isOpen, 
  onClose, 
  onBookingUpdated,
  readOnly = false 
}: BookingModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<CalendarBooking>>({});
  const { toast } = useToast();

  // Initialize form data when booking changes
  useEffect(() => {
    if (booking) {
      setFormData({
        guest_name: booking.guest_name || '',
        guest_email: booking.guest_email || '',
        guest_phone: booking.guest_phone || '',
        guests_count: booking.guests_count || 1,
        adults_count: booking.adults_count || 1,
        children_count: booking.children_count || 0,
        total_price: booking.total_price || 0,
        special_requests: booking.special_requests || '',
        booking_status: booking.booking_status || 'confirmed'
      });
    }
  }, [booking]);

  const handleSave = async () => {
    if (!booking) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({
          guest_name: formData.guest_name,
          guest_email: formData.guest_email,
          guest_phone: formData.guest_phone,
          guests_count: formData.guests_count,
          adults_count: formData.adults_count,
          children_count: formData.children_count,
          total_price: formData.total_price,
          special_requests: formData.special_requests,
          booking_status: formData.booking_status,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id)
        .select()
        .single();

      if (error) throw error;

      const updatedBooking = { ...booking, ...data };
      onBookingUpdated?.(updatedBooking);
      setIsEditing(false);
      
      toast({
        title: "Prenotazione aggiornata",
        description: "Le modifiche sono state salvate con successo.",
      });
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Errore",
        description: "Impossibile salvare le modifiche. Riprova.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (booking) {
      setFormData({
        guest_name: booking.guest_name || '',
        guest_email: booking.guest_email || '',
        guest_phone: booking.guest_phone || '',
        guests_count: booking.guests_count || 1,
        adults_count: booking.adults_count || 1,
        children_count: booking.children_count || 0,
        total_price: booking.total_price || 0,
        special_requests: booking.special_requests || '',
        booking_status: booking.booking_status || 'confirmed'
      });
    }
    setIsEditing(false);
  };

  const getStatusBadgeVariant = (status?: string | null) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      case 'completed':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status?: string | null) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'text-green-600';
      case 'pending':
        return 'text-orange-600';
      case 'cancelled':
        return 'text-red-600';
      case 'completed':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!booking) return null;

  const checkInDate = parseISO(booking.check_in);
  const checkOutDate = parseISO(booking.check_out);
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Dettagli Prenotazione
            {!readOnly && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="ml-auto"
              >
                {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                {isEditing ? 'Annulla' : 'Modifica'}
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Booking Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={getStatusBadgeVariant(booking.booking_status)}>
                {booking.booking_status?.toUpperCase() || 'SCONOSCIUTO'}
              </Badge>
              {booking.channel && (
                <Badge variant="outline">
                  {booking.channel}
                </Badge>
              )}
            </div>
            {booking.booking_reference && (
              <span className="text-sm text-gray-500">
                Rif: {booking.booking_reference}
              </span>
            )}
          </div>

          {/* Property and Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Proprietà
              </Label>
              <p className="font-medium">{booking.property?.nome || 'Proprietà sconosciuta'}</p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Durata
              </Label>
              <p className="font-medium">{nights} {nights === 1 ? 'notte' : 'notti'}</p>
            </div>
          </div>

          {/* Check-in and Check-out */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Check-in</Label>
              <p className="font-medium">
                {format(checkInDate, 'EEEE, d MMMM yyyy', { locale: it })}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Check-out</Label>
              <p className="font-medium">
                {format(checkOutDate, 'EEEE, d MMMM yyyy', { locale: it })}
              </p>
            </div>
          </div>

          <Separator />

          {/* Guest Information */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              Informazioni Ospite
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guest_name">Nome</Label>
                {isEditing ? (
                  <Input
                    id="guest_name"
                    value={formData.guest_name || ''}
                    onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                    placeholder="Nome ospite"
                  />
                ) : (
                  <p className="font-medium">{booking.guest_name || 'Non specificato'}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="guest_email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                {isEditing ? (
                  <Input
                    id="guest_email"
                    type="email"
                    value={formData.guest_email || ''}
                    onChange={(e) => setFormData({ ...formData, guest_email: e.target.value })}
                    placeholder="email@esempio.com"
                  />
                ) : (
                  <p className="font-medium">{booking.guest_email || 'Non specificata'}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest_phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Telefono
              </Label>
              {isEditing ? (
                <Input
                  id="guest_phone"
                  value={formData.guest_phone || ''}
                  onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                  placeholder="+39 123 456 7890"
                />
              ) : (
                <p className="font-medium">{booking.guest_phone || 'Non specificato'}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Guest Count and Pricing */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" />
              Ospiti e Prezzo
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guests_count">Totale Ospiti</Label>
                {isEditing ? (
                  <Input
                    id="guests_count"
                    type="number"
                    min="1"
                    value={formData.guests_count || 1}
                    onChange={(e) => setFormData({ ...formData, guests_count: parseInt(e.target.value) || 1 })}
                  />
                ) : (
                  <p className="font-medium">{booking.guests_count || 1}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adults_count">Adulti</Label>
                {isEditing ? (
                  <Input
                    id="adults_count"
                    type="number"
                    min="1"
                    value={formData.adults_count || 1}
                    onChange={(e) => setFormData({ ...formData, adults_count: parseInt(e.target.value) || 1 })}
                  />
                ) : (
                  <p className="font-medium">{booking.adults_count || 1}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="children_count">Bambini</Label>
                {isEditing ? (
                  <Input
                    id="children_count"
                    type="number"
                    min="0"
                    value={formData.children_count || 0}
                    onChange={(e) => setFormData({ ...formData, children_count: parseInt(e.target.value) || 0 })}
                  />
                ) : (
                  <p className="font-medium">{booking.children_count || 0}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="total_price" className="flex items-center gap-2">
                  <Euro className="w-4 h-4" />
                  Prezzo Totale
                </Label>
                {isEditing ? (
                  <Input
                    id="total_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.total_price || 0}
                    onChange={(e) => setFormData({ ...formData, total_price: parseFloat(e.target.value) || 0 })}
                  />
                ) : (
                  <p className="font-medium">
                    €{booking.total_price?.toFixed(2) || '0.00'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Special Requests */}
          {(booking.special_requests || isEditing) && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="special_requests" className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Richieste Speciali
                </Label>
                {isEditing ? (
                  <Textarea
                    id="special_requests"
                    value={formData.special_requests || ''}
                    onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                    placeholder="Inserisci eventuali richieste speciali..."
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-gray-600">
                    {booking.special_requests || 'Nessuna richiesta speciale'}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Booking Metadata */}
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
            <div>
              <strong>ID Prenotazione:</strong> {booking.external_booking_id}
            </div>
            {booking.created_at && (
              <div>
                <strong>Creata il:</strong> {format(parseISO(booking.created_at), 'dd/MM/yyyy HH:mm')}
              </div>
            )}
            {booking.updated_at && (
              <div>
                <strong>Aggiornata il:</strong> {format(parseISO(booking.updated_at), 'dd/MM/yyyy HH:mm')}
              </div>
            )}
            {booking.last_sync_at && (
              <div>
                <strong>Ultima sincronizzazione:</strong> {format(parseISO(booking.last_sync_at), 'dd/MM/yyyy HH:mm')}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          {isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Annulla
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salva Modifiche
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={onClose}>
              Chiudi
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}