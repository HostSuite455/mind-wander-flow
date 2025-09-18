import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  LogOut,
  AlertCircle,
  Shield
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

// Types for our data
interface GuestSession {
  code: string;
  property_id: string;
  expires_at: string;
}

interface PropertyInfo {
  property_id: string;
  wifi_name?: string;
  wifi_password?: string;
  access_info?: string;
  extra_notes?: string;
  smoking_rules?: string;
  heating_instructions?: string;
  trash_rules?: string;
}

const GuestDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [propertyInfo, setPropertyInfo] = useState<PropertyInfo | null>(null);
  const [guestSession, setGuestSession] = useState<GuestSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    loadGuestData();
  }, []);

  const loadGuestData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get guest session from localStorage
      const guestSessionData = localStorage.getItem('guest_session');
      if (!guestSessionData) {
        navigate('/guest');
        return;
      }

      const session: GuestSession = JSON.parse(guestSessionData);
      setGuestSession(session);

      // Verify session is still valid
      const expiresAt = new Date(session.expires_at);
      const now = new Date();
      
      if (now > expiresAt) {
        localStorage.removeItem('guest_session');
        navigate('/guest');
        return;
      }

      // Load property info
      const { data: info, error: infoError } = await supabase
        .from('property_ai_data')
        .select('property_id, wifi_name, wifi_password, access_info, extra_notes, smoking_rules, heating_instructions, trash_rules')
        .eq('property_id', session.property_id)
        .maybeSingle();

      if (infoError) {
        console.error('Error loading property info:', infoError);
        setError("Errore nel caricamento delle informazioni");
        return;
      }

      setPropertyInfo(info);

    } catch (err) {
      console.error('Error in loadGuestData:', err);
      setError("Errore nel caricamento dei dati");
      toast({
        variant: "destructive", 
        title: "Errore",
        description: "Errore nel caricamento delle informazioni ospite",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const retryLoad = () => {
    loadGuestData();
  };

  const handleGuestLogout = () => {
    localStorage.removeItem('guest_session');
    toast({
      title: "Logout effettuato",
      description: "Arrivederci!",
    });
    navigate("/guest");
  };

  // Build info cards based on available data
  const buildInfoCards = () => {
    const cards = [];

    // Wi-Fi card
    if (propertyInfo?.wifi_name && propertyInfo?.wifi_password) {
      cards.push({
        title: "Wi-Fi",
        description: `${propertyInfo.wifi_name} | Password: ${propertyInfo.wifi_password}`,
        icon: Wifi
      });
    }

    // House rules card
    if (propertyInfo?.smoking_rules) {
      cards.push({
        title: "Regole della casa", 
        description: propertyInfo.smoking_rules,
        icon: Home
      });
    }

    // Access info card
    if (propertyInfo?.access_info) {
      cards.push({
        title: "Check-in/Check-out",
        description: propertyInfo.access_info,
        icon: Clock
      });
    }

    // Heating instructions card
    if (propertyInfo?.heating_instructions) {
      cards.push({
        title: "Riscaldamento",
        description: propertyInfo.heating_instructions,
        icon: Building
      });
    }

    return cards;
  };

  const infoCards = buildInfoCards();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {error && (
          <div className="mb-8">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Errore nel caricamento</p>
                    <p className="text-sm">{error}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={retryLoad}
                    className="ml-auto"
                  >
                    Riprova
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Welcome Area */}
        <div className="mb-8">
          <Card className="border-hostsuite-primary/20 bg-gradient-to-r from-hostsuite-primary/5 to-hostsuite-secondary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-hostsuite-primary flex items-center gap-2">
                    <Home className="w-6 h-6" />
                    Benvenuto alla proprietà
                  </CardTitle>
                  <CardDescription className="text-lg">
                    <div className="flex flex-wrap gap-4 mt-2">
                      <span>🏠 Guest Code: {guestSession?.code}</span>
                      {guestSession && (
                        <span>📅 Scade: {new Date(guestSession.expires_at).toLocaleDateString('it-IT')}</span>
                      )}
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
          {infoCards.length === 0 ? (
            <Card className="border-hostsuite-primary/20">
              <CardContent className="text-center py-8">
                <Shield className="w-12 h-12 text-hostsuite-primary/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-hostsuite-text mb-2">
                  Informazioni non disponibili
                </h3>
                <p className="text-hostsuite-text/60">
                  Le informazioni per questa proprietà saranno disponibili a breve
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {infoCards.map((info, index) => {
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
          )}
        </div>

        {/* Local Recommendations */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-hostsuite-primary">Consigli Locali</h2>
            <Badge variant="secondary" className="bg-hostsuite-primary/10 text-hostsuite-primary">
              In arrivo
            </Badge>
          </div>
          
          <Card className="border-hostsuite-primary/20">
            <CardContent className="text-center py-8">
              <MapPin className="w-12 h-12 text-hostsuite-primary/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-hostsuite-text mb-2">
                Consigli locali in preparazione
              </h3>
              <p className="text-hostsuite-text/60">
                Stiamo preparando dei consigli personalizzati per la tua zona
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Support Section */}
        {propertyInfo?.extra_notes && (
          <Card className="border-hostsuite-primary/20">
            <CardHeader>
              <CardTitle className="text-hostsuite-primary flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Note aggiuntive
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-hostsuite-text mb-4">
                {propertyInfo.extra_notes}
              </p>
            </CardContent>
          </Card>
        )}

        {!propertyInfo?.extra_notes && (
          <Card className="border-hostsuite-primary/20">
            <CardHeader>
              <CardTitle className="text-hostsuite-primary flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Hai bisogno di aiuto?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-hostsuite-text mb-4">
                Per qualsiasi necessità durante il tuo soggiorno, non esitare a contattarci.
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
                Servizio di supporto in arrivo
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GuestDashboard;