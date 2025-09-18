import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, Filter, Search, Users, MapPin } from "lucide-react";
import HostNavbar from "@/components/HostNavbar";

// Dummy booking data
const bookings = [
  {
    id: "1",
    guestName: "Marco Rossi",
    property: "Casa Siena Centro",
    checkIn: "2024-03-15",
    checkOut: "2024-03-18",
    guests: 2,
    status: "confirmed"
  },
  {
    id: "2", 
    guestName: "Anna Verdi",
    property: "Appartamento Roma",
    checkIn: "2024-03-20",
    checkOut: "2024-03-25",
    guests: 4,
    status: "pending"
  },
  {
    id: "3",
    guestName: "Luigi Bianchi",
    property: "Villa Toscana",
    checkIn: "2024-03-22",
    checkOut: "2024-03-29",
    guests: 6,
    status: "cancelled"
  }
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "confirmed":
      return <Badge className="bg-green-100 text-green-800">Confermata</Badge>;
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-800">In Attesa</Badge>;
    case "cancelled":
      return <Badge className="bg-red-100 text-red-800">Annullata</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const HostBookings = () => {
  return (
    <div className="min-h-screen bg-background">
      <HostNavbar />
      <div className="pt-20 container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-hostsuite-primary mb-2">Prenotazioni</h1>
          <p className="text-hostsuite-text">Gestisci tutte le prenotazioni delle tue proprietà</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-hostsuite-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-hostsuite-text">Totale Prenotazioni</p>
                  <p className="text-2xl font-bold text-hostsuite-primary">24</p>
                </div>
                <Calendar className="w-8 h-8 text-hostsuite-primary/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-hostsuite-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-hostsuite-text">Questo Mese</p>
                  <p className="text-2xl font-bold text-hostsuite-primary">8</p>
                </div>
                <Calendar className="w-8 h-8 text-hostsuite-secondary/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-hostsuite-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-hostsuite-text">Tasso Occupazione</p>
                  <p className="text-2xl font-bold text-hostsuite-primary">76%</p>
                </div>
                <Users className="w-8 h-8 text-hostsuite-primary/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-hostsuite-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-hostsuite-text">Revenue</p>
                  <p className="text-2xl font-bold text-hostsuite-primary">€3.2k</p>
                </div>
                <Calendar className="w-8 h-8 text-green-500/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="border-hostsuite-primary/20 mb-8">
          <CardHeader>
            <CardTitle className="text-hostsuite-primary">Filtri e Ricerca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-hostsuite-text/50" />
                  <Input 
                    placeholder="Cerca per nome ospite o proprietà..." 
                    className="pl-10"
                    disabled
                  />
                </div>
              </div>
              <Button variant="outline" disabled>
                <Filter className="w-4 h-4 mr-2" />
                Filtri
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bookings List */}
        <Card className="border-hostsuite-primary/20">
          <CardHeader>
            <CardTitle className="text-hostsuite-primary">Prenotazioni Recenti</CardTitle>
            <CardDescription>
              Panoramica delle prenotazioni più recenti
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div 
                  key={booking.id}
                  className="p-4 border border-hostsuite-primary/20 rounded-lg hover:bg-hostsuite-primary/5 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-hostsuite-primary">{booking.guestName}</h3>
                        {getStatusBadge(booking.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-hostsuite-text">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {booking.property}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {booking.checkIn} - {booking.checkOut}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {booking.guests} ospiti
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" disabled>
                        Dettagli
                      </Button>
                      <Button size="sm" disabled>
                        Contatta
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {bookings.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-hostsuite-primary/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-hostsuite-text mb-2">
                  Nessuna prenotazione trovata
                </h3>
                <p className="text-hostsuite-text/60">
                  Le prenotazioni appariranno qui quando saranno disponibili
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HostBookings;