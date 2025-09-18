import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
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
  Shield,
  ExternalLink,
  MessageCircle,
  PhoneCall,
  AlertTriangle,
  Copy,
  CheckCircle,
  FileText
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
  const [copiedWifi, setCopiedWifi] = useState(false);

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

  const copyWifiPassword = async () => {
    if (!propertyInfo?.wifi_password) return;
    
    try {
      await navigator.clipboard.writeText(propertyInfo.wifi_password);
      setCopiedWifi(true);
      toast({
        title: "Password copiata!",
        description: "Password Wi-Fi copiata negli appunti",
      });
      setTimeout(() => setCopiedWifi(false), 2000);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile copiare la password",
      });
    }
  };

  const sanitizePhoneNumber = (phone: string): string | null => {
    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // Check if it's a valid phone number (at least 10 digits)
    if (cleaned.length < 10) return null;
    
    return cleaned;
  };

  const extractCheckInOutTimes = (accessInfo: string): { checkIn?: string; checkOut?: string } => {
    // Simple regex to find times in format HH:MM
    const timeRegex = /\b(\d{1,2}:\d{2})\b/g;
    const matches = accessInfo.match(timeRegex);
    
    if (!matches) return {};
    
    // Assume first time is check-in, second is check-out (if available)
    return {
      checkIn: matches[0],
      checkOut: matches[1]
    };
  };

  // Build info cards based on available data
  const buildInfoCards = () => {
    const cards = [];

    // Wi-Fi card with copy functionality
    if (propertyInfo?.wifi_name && propertyInfo?.wifi_password) {
      cards.push({
        title: "Wi-Fi",
        description: propertyInfo.wifi_name,
        password: propertyInfo.wifi_password,
        icon: Wifi,
        hasPassword: true
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

    // Access info card with time extraction
    if (propertyInfo?.access_info) {
      const times = extractCheckInOutTimes(propertyInfo.access_info);
      let displayText = propertyInfo.access_info;
      
      if (times.checkIn || times.checkOut) {
        displayText = `Check-in ${times.checkIn ? `dalle ${times.checkIn}` : 'da definire'} / Check-out ${times.checkOut ? `entro le ${times.checkOut}` : 'da definire'}`;
      }
      
      cards.push({
        title: "Check-in/Check-out",
        description: displayText,
        icon: Clock,
        highlightTimes: true
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

  // Build quick actions based on available data with improved phone formatting
  const buildQuickActions = () => {
    const actions = [];

    // Support phone actions with better validation
    if (propertyInfo?.extra_notes) {
      const phoneMatch = propertyInfo.extra_notes.match(/([\+\d\s\(\)\-]{10,})/);
      if (phoneMatch) {
        const rawPhone = phoneMatch[1];
        const sanitizedPhone = sanitizePhoneNumber(rawPhone);
        
        if (sanitizedPhone) {
          actions.push({
            title: "Chiama assistenza",
            href: `tel:${sanitizedPhone}`,
            icon: PhoneCall,
            variant: "outline" as const
          });

          // WhatsApp with proper formatting
          const whatsappPhone = sanitizedPhone.replace(/^\+/, '').replace(/\s/g, '');
          actions.push({
            title: "WhatsApp",
            href: `https://wa.me/${whatsappPhone}`,
            icon: MessageCircle,
            variant: "default" as const
          });
        } else {
          // Show action but with warning tooltip
          actions.push({
            title: "Numero non formattato",
            href: "#",
            icon: PhoneCall,
            variant: "outline" as const,
            disabled: true,
            tooltip: "Il numero di telefono necessita di formattazione"
          });
        }
      }
    }

    return actions;
  };

  // Check if session is near expiry (less than 12 hours)
  const isSessionNearExpiry = useMemo(() => {
    if (!guestSession) return false;
    const expiresAt = new Date(guestSession.expires_at);
    const now = new Date();
    const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilExpiry > 0 && hoursUntilExpiry < 12;
  }, [guestSession]);

  const infoCards = buildInfoCards();
  const quickActions = buildQuickActions();

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
                      {isSessionNearExpiry && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          Sessione in scadenza
                        </Badge>
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

        {/* Offline Info Banner */}
        <div className="mb-6">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg" role="note" aria-live="polite">
            <p className="text-sm text-blue-800 text-center">
              💡 <strong>Suggerimento:</strong> Puoi trovare queste informazioni anche offline facendo screenshot.
            </p>
          </div>
        </div>
        {quickActions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-hostsuite-primary mb-4">Azioni Rapide</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <Button
                    key={index}
                    variant={action.variant}
                    className="h-auto p-4 justify-start"
                    disabled={action.disabled}
                    title={action.tooltip || (action.disabled ? "Numero non valido" : undefined)}
                    asChild={!action.disabled}
                  >
                    {action.disabled ? (
                      <div className="flex items-center gap-3 opacity-50">
                        <IconComponent className="w-5 h-5" />
                        <span>{action.title}</span>
                      </div>
                    ) : (
                      <a 
                        href={action.href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-3"
                      >
                        <IconComponent className="w-5 h-5" />
                        <span>{action.title}</span>
                        <ExternalLink className="w-3 h-3 ml-auto" />
                      </a>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Info Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-hostsuite-primary mb-4">Informazioni Utili</h2>
          {infoCards.length === 0 ? (
            <EmptyState
              icon={<Shield className="w-12 h-12 text-hostsuite-primary/30" />}
              title="Informazioni non disponibili"
              description="Le informazioni per questa proprietà saranno disponibili a breve"
            />
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
                      <p className="text-hostsuite-text mb-3">{info.description}</p>
                      
                      {/* Wi-Fi Password Copy Feature */}
                      {info.hasPassword && info.password && (
                        <div className="p-2 bg-hostsuite-light/20 rounded">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-mono">{info.password}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={copyWifiPassword}
                              className="h-8 px-2"
                              title={copiedWifi ? "Copiato!" : "Copia password"}
                              aria-pressed={copiedWifi}
                              aria-label={copiedWifi ? "Password copiata" : "Copia password Wi-Fi"}
                            >
                              {copiedWifi ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Emergency Information */}
        <div className="mb-8">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Numeri di Emergenza
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-red-700">
                <p className="font-medium">🚨 Emergenze: 112 (numero unico europeo)</p>
                <p>🚑 Pronto Soccorso: 118</p>
                <p>🚓 Polizia: 113</p>
                <p>🚒 Vigili del Fuoco: 115</p>
                <div className="mt-4 p-3 bg-red-100 rounded-lg">
                  <p className="text-sm font-medium">
                    💡 Per problemi non urgenti relativi all'alloggio, contatta prima il gestore tramite i pulsanti sopra
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Booklet */}
        <div className="mb-8">
          <Card className="border-hostsuite-primary/20">
            <CardHeader>
              <CardTitle className="text-hostsuite-primary flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Libretto di Benvenuto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-hostsuite-text mb-4">
                Scarica o stampa il libretto di benvenuto con tutte le informazioni importanti per il tuo soggiorno.
              </p>
              <Button 
                onClick={() => navigate('/welcome-booklet')} 
                className="w-full bg-gradient-to-r from-hostsuite-secondary to-hostsuite-primary hover:scale-105 transition-transform"
              >
                <FileText className="w-4 h-4 mr-2" />
                Apri Welcome Booklet (PDF)
              </Button>
            </CardContent>
          </Card>
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