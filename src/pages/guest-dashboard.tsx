import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Wifi, 
  Clock, 
  Home, 
  Phone,
  MapPin,
  Utensils,
  Camera,
  Wine,
  Building,
  LogOut
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Dummy data for guest stay
const stayInfo = {
  propertyName: "Casa Siena Centro",
  checkIn: "15 Marzo 2024",
  checkOut: "18 Marzo 2024",
  guests: 2
};

const quickInfo = [
  {
    title: "Regole della casa",
    description: "Check-in dopo le 15:00, no fumo, animali benvenuti",
    icon: Home
  },
  {
    title: "Wi-Fi",
    description: "HostSuite_Guest | Password: siena2024",
    icon: Wifi
  },
  {
    title: "Check-in/Check-out",
    description: "Check-in: 15:00 | Check-out: 11:00",
    icon: Clock
  },
  {
    title: "Assistenza 24/7",
    description: "WhatsApp: +39 123 456 7890",
    icon: Phone
  }
];

const localRecommendations = [
  {
    name: "Osteria del Borgo",
    type: "Ristorante",
    description: "Cucina toscana autentica a 5 minuti a piedi",
    distance: "350m",
    icon: Utensils
  },
  {
    name: "Piazza del Campo",
    type: "Attrazione",
    description: "La famosa piazza medievale di Siena",
    distance: "800m",
    icon: Camera
  },
  {
    name: "Museo dell'Opera",
    type: "Museo",
    description: "Arte e storia senese",
    distance: "600m", 
    icon: Building
  },
  {
    name: "Enoteca Italiana",
    type: "Wine Bar",
    description: "Selezione di vini toscani",
    distance: "450m",
    icon: Wine
  }
];

const GuestDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGuestLogout = () => {
    localStorage.removeItem('guest_session');
    toast({
      title: "Logout effettuato",
      description: "Arrivederci!",
    });
    navigate("/guest");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Area */}
        <div className="mb-8">
          <Card className="border-hostsuite-primary/20 bg-gradient-to-r from-hostsuite-primary/5 to-hostsuite-secondary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-hostsuite-primary flex items-center gap-2">
                    <Home className="w-6 h-6" />
                    Benvenuto al {stayInfo.propertyName}
                  </CardTitle>
                  <CardDescription className="text-lg">
                    <div className="flex flex-wrap gap-4 mt-2">
                      <span>📅 {stayInfo.checkIn} - {stayInfo.checkOut}</span>
                      <span>👥 {stayInfo.guests} ospiti</span>
                    </div>
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGuestLogout}
                  className="text-hostsuite-text hover:text-hostsuite-primary"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Esci
                </Button>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Info Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-hostsuite-primary mb-4">Informazioni Utili</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickInfo.map((info, index) => {
              const IconComponent = info.icon;
              return (
                <Card key={index} className="hover:shadow-soft transition-shadow border-hostsuite-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-hostsuite-primary">
                      <IconComponent className="w-5 h-5" />
                      {info.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-hostsuite-text">{info.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Local Recommendations */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-hostsuite-primary">Consigli Locali</h2>
            <Badge variant="secondary" className="bg-hostsuite-primary/10 text-hostsuite-primary">
              Selezionati per te
            </Badge>
          </div>
          
          {localRecommendations.length === 0 ? (
            // Empty State
            <Card className="border-hostsuite-primary/20">
              <CardContent className="text-center py-8">
                <MapPin className="w-12 h-12 text-hostsuite-primary/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-hostsuite-text mb-2">
                  Nessun consiglio disponibile
                </h3>
                <p className="text-hostsuite-text/60">
                  I consigli locali saranno disponibili a breve
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {localRecommendations.map((recommendation, index) => {
                const IconComponent = recommendation.icon;
                return (
                  <Card key={index} className="hover:shadow-soft transition-all duration-300 hover:scale-105 border-hostsuite-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <div className="flex items-center gap-2 text-hostsuite-primary">
                          <IconComponent className="w-5 h-5" />
                          {recommendation.name}
                        </div>
                        <Badge variant="outline" className="text-xs border-hostsuite-primary/30">
                          {recommendation.distance}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-sm font-medium text-hostsuite-secondary">
                        {recommendation.type}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-hostsuite-text text-sm mb-3">
                        {recommendation.description}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full border-hostsuite-primary/30 text-hostsuite-primary hover:bg-hostsuite-primary hover:text-white transition-all"
                        disabled
                      >
                        <MapPin className="w-3 h-3 mr-1" />
                        Visualizza su mappa
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Support Section */}
        <Card className="border-hostsuite-primary/20">
          <CardHeader>
            <CardTitle className="text-hostsuite-primary flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Hai bisogno di aiuto?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-hostsuite-text mb-4">
              Il nostro team è sempre disponibile per assisterti durante il tuo soggiorno.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button disabled className="flex-1 bg-green-600 hover:bg-green-700 text-white opacity-50">
                <Phone className="w-4 h-4 mr-2" />
                WhatsApp Support
              </Button>
              <Button disabled variant="outline" className="flex-1 border-hostsuite-primary text-hostsuite-primary opacity-50">
                <Phone className="w-4 h-4 mr-2" />
                Chiamata diretta
              </Button>
            </div>
            <p className="text-xs text-hostsuite-text/60 mt-3 text-center">
              Servizio attivo 24/7 durante il tuo soggiorno
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GuestDashboard;