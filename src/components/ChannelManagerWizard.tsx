import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ArrowRight, Building2, Globe, Key, Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createIcalConfig, type IcalConfigType } from "@/lib/supaIcal";

interface ChannelManagerWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  propertyId: string;
  propertyName: string;
}

type WizardStep = 'type' | 'provider' | 'configuration';

// Channel Manager definitions
const CHANNEL_MANAGERS = [
  {
    id: 'smoobu',
    name: 'Smoobu',
    icon: '📊',
    description: 'Channel manager per gestire multiple piattaforme',
    apiEndpoint: 'https://login.smoobu.com/api',
    apiKeyName: 'SMOOBU_API_KEY',
    requiresConfig: false
  },
  {
    id: 'hostfully',
    name: 'Hostfully',
    icon: '🏢',
    description: 'Property management system completo',
    apiEndpoint: 'https://api.hostfully.com/v2',
    apiKeyName: 'HOSTFULLY_API_KEY',
    requiresConfig: true
  },
  {
    id: 'guesty',
    name: 'Guesty',
    icon: '🎯',
    description: 'Piattaforma per gestione proprietà professionali',
    apiEndpoint: 'https://api.guesty.com/v1',
    apiKeyName: 'GUESTY_API_KEY',
    requiresConfig: true
  },
  {
    id: 'lodgify',
    name: 'Lodgify',
    icon: '🏠',
    description: 'Website builder e channel manager',
    apiEndpoint: 'https://api.lodgify.com/v1',
    apiKeyName: 'LODGIFY_API_KEY',
    requiresConfig: true
  },
  {
    id: 'rentals_united',
    name: 'Rentals United',
    icon: '🌐',
    description: 'Network globale per vacation rentals',
    apiEndpoint: 'https://www.rentalsunited.com/api',
    apiKeyName: 'RENTALS_UNITED_API_KEY',
    requiresConfig: true
  }
];

// OTA Direct definitions
const OTA_DIRECT = [
  {
    id: 'airbnb',
    name: 'Airbnb',
    icon: '🏠',
    description: 'Connessione diretta ad Airbnb via iCal',
    type: 'ical' as const
  },
  {
    id: 'booking',
    name: 'Booking.com',
    icon: '🔵',
    description: 'Connessione diretta a Booking.com via iCal',
    type: 'ical' as const
  },
  {
    id: 'vrbo',
    name: 'VRBO/Expedia',
    icon: '🏖️',
    description: 'Connessione diretta a VRBO via iCal',
    type: 'ical' as const
  },
  {
    id: 'agoda',
    name: 'Agoda',
    icon: '🌏',
    description: 'Connessione diretta ad Agoda via iCal',
    type: 'ical' as const
  },
  {
    id: 'tripadvisor',
    name: 'TripAdvisor',
    icon: '🦉',
    description: 'Connessione diretta a TripAdvisor via iCal',
    type: 'ical' as const
  }
];

export default function ChannelManagerWizard({ 
  isOpen, 
  onClose, 
  onSuccess, 
  propertyId, 
  propertyName 
}: ChannelManagerWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('type');
  const [selectedType, setSelectedType] = useState<IcalConfigType | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [providerConfig, setProviderConfig] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedChannelManager = CHANNEL_MANAGERS.find(cm => cm.id === selectedProvider);
  const selectedOTA = OTA_DIRECT.find(ota => ota.id === selectedProvider);

  const handleNext = () => {
    if (currentStep === 'type' && selectedType) {
      setCurrentStep('provider');
    } else if (currentStep === 'provider' && selectedProvider) {
      if (selectedType === 'channel_manager' && selectedChannelManager?.requiresConfig) {
        setCurrentStep('configuration');
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep === 'provider') {
      setCurrentStep('type');
    } else if (currentStep === 'configuration') {
      setCurrentStep('provider');
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const configData = {
        property_id: propertyId,
        config_type: selectedType!,
        is_active: isActive,
        ...(selectedType === 'channel_manager' && selectedChannelManager && {
          channel_manager_name: selectedChannelManager.name,
          api_endpoint: selectedChannelManager.apiEndpoint,
          api_key_name: selectedChannelManager.apiKeyName,
          provider_config: providerConfig
        })
      };

      const { data, error } = await createIcalConfig(configData);
      
      if (error) {
        throw new Error(error.message || 'Errore durante la creazione della configurazione');
      }

      toast({
        title: "Configurazione creata",
        description: `${selectedType === 'channel_manager' ? 'Channel Manager' : 'OTA Direct'} configurato con successo`
      });

      // Reset wizard state
      setCurrentStep('type');
      setSelectedType(null);
      setSelectedProvider('');
      setProviderConfig({});
      
      onSuccess();
      onClose();
      
    } catch (error) {
      console.error('Error creating configuration:', error);
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore durante la creazione della configurazione",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      // Reset state when closing
      setCurrentStep('type');
      setSelectedType(null);
      setSelectedProvider('');
      setProviderConfig({});
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurazione Calendario - {propertyName}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Type Selection */}
        {currentStep === 'type' && (
          <div className="space-y-6">
            <div className="text-sm text-muted-foreground">
              Scegli il tipo di integrazione per sincronizzare il calendario della tua proprietà.
            </div>
            
            <div className="grid gap-4">
              <Card 
                className={`cursor-pointer transition-all border-2 ${
                  selectedType === 'channel_manager' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedType('channel_manager')}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-base">
                    <Building2 className="w-5 h-5 text-primary" />
                    Channel Manager
                    <Badge variant="secondary">API</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription>
                    Integrazione avanzata con API per dati completi delle prenotazioni.
                    Un solo channel manager per proprietà con accesso a informazioni dettagliate
                    degli ospiti, prezzi e comunicazioni.
                  </CardDescription>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {CHANNEL_MANAGERS.slice(0, 3).map(cm => (
                      <Badge key={cm.id} variant="outline" className="text-xs">
                        {cm.icon} {cm.name}
                      </Badge>
                    ))}
                    <Badge variant="outline" className="text-xs">+{CHANNEL_MANAGERS.length - 3} altri</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all border-2 ${
                  selectedType === 'ota_direct' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedType('ota_direct')}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-base">
                    <Globe className="w-5 h-5 text-primary" />
                    OTA Dirette
                    <Badge variant="secondary">iCal</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription>
                    Connessioni dirette tramite link iCal dalle piattaforme di prenotazione.
                    Puoi aggiungere fino a 5 piattaforme diverse con sincronizzazione
                    automatica delle date occupate.
                  </CardDescription>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {OTA_DIRECT.slice(0, 4).map(ota => (
                      <Badge key={ota.id} variant="outline" className="text-xs">
                        {ota.icon} {ota.name}
                      </Badge>
                    ))}
                    <Badge variant="outline" className="text-xs">+{OTA_DIRECT.length - 4} altre</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step 2: Provider Selection */}
        {currentStep === 'provider' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
              {selectedType === 'channel_manager' ? 'Seleziona Channel Manager' : 'Seleziona Piattaforma OTA'}
            </div>
            
            <div className="grid gap-3">
              {selectedType === 'channel_manager' && CHANNEL_MANAGERS.map(cm => (
                <Card 
                  key={cm.id}
                  className={`cursor-pointer transition-all border-2 ${
                    selectedProvider === cm.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedProvider(cm.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{cm.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold">{cm.name}</h3>
                        <p className="text-sm text-muted-foreground">{cm.description}</p>
                      </div>
                      {cm.requiresConfig && (
                        <Badge variant="outline" className="text-xs">
                          <Key className="w-3 h-3 mr-1" />
                          API Key
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {selectedType === 'ota_direct' && OTA_DIRECT.map(ota => (
                <Card 
                  key={ota.id}
                  className={`cursor-pointer transition-all border-2 ${
                    selectedProvider === ota.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedProvider(ota.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{ota.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold">{ota.name}</h3>
                        <p className="text-sm text-muted-foreground">{ota.description}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        iCal URL
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Configuration (only for Channel Managers that require it) */}
        {currentStep === 'configuration' && selectedChannelManager && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
              Configurazione {selectedChannelManager.name}
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Configurazione Attiva</Label>
                <Switch
                  id="is_active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>

              <div className="space-y-2">
                <Label>Endpoint API</Label>
                <Input
                  value={selectedChannelManager.apiEndpoint}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label>Nome Secret API Key</Label>
                <Input
                  value={selectedChannelManager.apiKeyName}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Assicurati di aver configurato questo secret nelle impostazioni del progetto
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additional_config">Configurazione Aggiuntiva (JSON)</Label>
                <Textarea
                  id="additional_config"
                  placeholder='{"property_id": "your-property-id", "webhook_url": "optional"}'
                  value={JSON.stringify(providerConfig, null, 2)}
                  onChange={(e) => {
                    try {
                      setProviderConfig(JSON.parse(e.target.value || '{}'));
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  className="font-mono text-sm"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Configurazione opzionale specifica per {selectedChannelManager.name}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={currentStep === 'type' ? handleClose : handleBack}
            disabled={isSubmitting}
          >
            {currentStep === 'type' ? 'Annulla' : 'Indietro'}
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={
              isSubmitting ||
              (currentStep === 'type' && !selectedType) ||
              (currentStep === 'provider' && !selectedProvider)
            }
            className="bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? 'Creando...' : (
              currentStep === 'configuration' || 
              (currentStep === 'provider' && (!selectedChannelManager?.requiresConfig)) 
                ? 'Crea Configurazione' 
                : 'Avanti'
            )}
            {currentStep !== 'configuration' && !isSubmitting && (
              <ArrowRight className="w-4 h-4 ml-2" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}