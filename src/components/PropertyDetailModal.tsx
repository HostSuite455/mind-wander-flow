import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, SourceBadge } from "@/components/ui/Badges";
import { EmptyState } from "@/components/ui/EmptyState";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { 
  X, 
  Home, 
  Calendar, 
  Wifi, 
  Eye, 
  EyeOff,
  AlertCircle,
  HelpCircle,
  Settings
} from "lucide-react";

interface PropertyDetailModalProps {
  open: boolean;
  onClose: () => void;
  propertyId: string;
}

interface PropertyDetail {
  id: string;
  nome: string;
  created_at: string;
}

interface IcalConfig {
  id: string;
  channel_manager_name?: string;
  config_type: string;
  is_active: boolean;
  created_at: string;
}

interface UnansweredQuestion {
  id: string;
  question: string;
  created_at: string;
  guest_code: string;
}

interface PropertyAiData {
  wifi_name?: string;
  wifi_password?: string;
  access_info?: string;
  smoking_rules?: string;
  extra_notes?: string;
}

const PropertyDetailModal = ({ open, onClose, propertyId }: PropertyDetailModalProps) => {
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [icalConfigs, setIcalConfigs] = useState<IcalConfig[]>([]);
  const [questions, setQuestions] = useState<UnansweredQuestion[]>([]);
  const [aiData, setAiData] = useState<PropertyAiData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWifiPassword, setShowWifiPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && propertyId) {
      loadPropertyDetails();
    }
  }, [open, propertyId]);

  const loadPropertyDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load all property-related data in parallel
      const [propertyResult, icalResult, questionsResult, aiDataResult] = await Promise.all([
        supabase
          .from('properties')
          .select('id, nome, created_at')
          .eq('id', propertyId)
          .maybeSingle(),
        supabase
          .from('ical_configs')
          .select('id, channel_manager_name, config_type, is_active, created_at')
          .eq('property_id', propertyId)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('unanswered_questions')
          .select('id, question, created_at, guest_code')
          .eq('property_id', propertyId)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('property_ai_data')
          .select('wifi_name, wifi_password, access_info, smoking_rules, extra_notes')
          .eq('property_id', propertyId)
          .maybeSingle()
      ]);

      if (propertyResult.error) {
        throw new Error('Errore nel caricamento della proprietà');
      }

      if (icalResult.error) {
        console.error('Error loading iCal configs:', icalResult.error);
      }

      if (questionsResult.error) {
        console.error('Error loading questions:', questionsResult.error);
      }

      if (aiDataResult.error) {
        console.error('Error loading AI data:', aiDataResult.error);
      }

      setProperty(propertyResult.data);
      setIcalConfigs(icalResult.data || []);
      setQuestions(questionsResult.data || []);
      setAiData(aiDataResult.data);

    } catch (err) {
      console.error('Error in loadPropertyDetails:', err);
      setError(err instanceof Error ? err.message : "Errore nel caricamento");
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Errore nel caricamento dei dettagli proprietà",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setShowWifiPassword(false);
    onClose();
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [open]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="property-detail-title"
      >
        <DialogHeader>
          <DialogTitle id="property-detail-title" className="text-xl text-hostsuite-primary">
            {isLoading ? "Caricamento..." : property?.nome || "Dettagli Proprietà"}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4"
            onClick={handleClose}
            aria-label="Chiudi modal"
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        {error && (
          <div className="mb-4">
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
                    onClick={loadPropertyDetails}
                    className="ml-auto"
                  >
                    Riprova
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overview Section */}
          <Card className="border-hostsuite-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-hostsuite-primary">
                <Home className="w-5 h-5" />
                Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-6 w-24" />
                </div>
              ) : property ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-hostsuite-text">Nome Proprietà</p>
                    <p className="font-medium text-hostsuite-primary">{property.nome}</p>
                  </div>
                  <div>
                    <p className="text-sm text-hostsuite-text">Data Creazione</p>
                    <p className="text-hostsuite-text">{new Date(property.created_at).toLocaleDateString('it-IT')}</p>
                  </div>
                  <div>
                    <StatusBadge status="active" />
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="Proprietà non trovata"
                  description="Impossibile caricare i dettagli"
                />
              )}
            </CardContent>
          </Card>

          {/* iCal Configurations */}
          <Card className="border-hostsuite-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-hostsuite-primary">
                <Calendar className="w-5 h-5" />
                Configurazioni iCal
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : icalConfigs.length === 0 ? (
                <EmptyState
                  icon={<Settings className="w-12 h-12 text-hostsuite-primary/30" />}
                  title="Nessuna configurazione iCal"
                  description="Configura i tuoi calendari per sincronizzare le prenotazioni"
                />
              ) : (
                <div className="space-y-2">
                  {icalConfigs.map((config) => (
                    <div key={config.id} className="flex items-center justify-between p-2 border border-hostsuite-primary/20 rounded">
                      <div>
                        <p className="font-medium text-sm">{config.channel_manager_name || config.config_type}</p>
                        <p className="text-xs text-hostsuite-text">
                          {new Date(config.created_at).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                      <StatusBadge status={config.is_active ? "active" : "inactive"} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Guest Info */}
          <Card className="border-hostsuite-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-hostsuite-primary">
                <Wifi className="w-5 h-5" />
                Info Ospiti
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : aiData ? (
                <div className="space-y-4">
                  {aiData.wifi_name && aiData.wifi_password && (
                    <div>
                      <p className="text-sm text-hostsuite-text mb-1">Wi-Fi</p>
                      <div className="p-2 bg-hostsuite-light/20 rounded">
                        <p className="font-medium">{aiData.wifi_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm">
                            Password: {showWifiPassword ? aiData.wifi_password : '••••••••'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowWifiPassword(!showWifiPassword)}
                            className="h-6 w-6 p-0"
                            aria-label={showWifiPassword ? "Nascondi password" : "Mostra password"}
                          >
                            {showWifiPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {aiData.access_info && (
                    <div>
                      <p className="text-sm text-hostsuite-text mb-1">Check-in/Check-out</p>
                      <p className="text-sm">{aiData.access_info}</p>
                    </div>
                  )}
                  
                  {aiData.smoking_rules && (
                    <div>
                      <p className="text-sm text-hostsuite-text mb-1">Regole</p>
                      <p className="text-sm">{aiData.smoking_rules}</p>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState
                  title="Nessuna informazione disponibile"
                  description="Configura le informazioni per gli ospiti"
                />
              )}
            </CardContent>
          </Card>

          {/* Recent Questions */}
          <Card className="border-hostsuite-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-hostsuite-primary">
                <HelpCircle className="w-5 h-5" />
                Ultime Domande
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : questions.length === 0 ? (
                <EmptyState
                  icon={<HelpCircle className="w-12 h-12 text-hostsuite-primary/30" />}
                  title="Nessuna domanda recente"
                  description="Le domande degli ospiti appariranno qui"
                />
              ) : (
                <div className="space-y-3">
                  {questions.map((question) => (
                    <div key={question.id} className="p-3 border border-hostsuite-primary/20 rounded">
                      <p className="text-sm mb-2">{question.question}</p>
                      <div className="flex items-center justify-between">
                        <SourceBadge source={question.guest_code} />
                        <span className="text-xs text-hostsuite-text">
                          {new Date(question.created_at).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleClose} className="bg-gradient-hostsuite">
            Chiudi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyDetailModal;