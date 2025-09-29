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

type WizardStep = 'type' | 'provider' | 'ical-input';

// Channel Manager integrato (Channex.io)
const INTEGRATED_CHANNEL_MANAGER = {
  id: 'channex',
  name: 'Channex.io',
  icon: '⚡',
  description: 'Channel manager integrato per gestione automatica delle prenotazioni',
  apiEndpoint: 'https://api.channex.io/v1',
  apiKeyName: 'CHANNEX_API_KEY',
  requiresConfig: false
};

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

  const [icalUrl, setIcalUrl] = useState('');

  const selectedOTA = OTA_DIRECT.find(ota => ota.id === selectedProvider);

  const handleNext = () => {
    if (currentStep === 'provider' && selectedProvider) {
      setCurrentStep('ical-input');
    } else if (currentStep === 'ical-input' && icalUrl.trim()) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep === 'provider') {
      setCurrentStep('type');
    } else if (currentStep === 'ical-input') {
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
      };

      const { data: configResult, error: configError } = await createIcalConfig(configData);
      
      if (configError) {
        throw new Error(configError.message || 'Errore durante la creazione della configurazione');
      }

      // Create the iCal URL
      const { createIcalUrl } = await import('@/lib/supaIcal');
      const { data: urlResult, error: urlError } = await createIcalUrl({
        ical_config_id: configResult.id,
        url: icalUrl,
        source: selectedProvider,
        is_primary: true,
        is_active: true
      });

      if (urlError) {
        throw new Error(urlError.message || 'Errore durante la creazione del link iCal');
      }

      toast({
        title: "Configurazione creata",
        description: `${selectedOTA?.name} configurato con successo`
      });

      // Reset wizard state
      setCurrentStep('type');
      setSelectedType(null);
      setSelectedProvider('');
      setProviderConfig({});
      setIcalUrl('');
      
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
      setIcalUrl('');
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

        {/* Step 1: Directly to OTA Selection */}
        {currentStep === 'type' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-lg font-semibold text-primary">
                <Building2 className="w-6 h-6" />
                Channex.io Channel Manager
                <Badge variant="secondary">Integrato</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Il tuo channel manager è già configurato. Aggiungi i link iCal delle OTA per sincronizzare le prenotazioni.
              </p>
            </div>
            
            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚡</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-800">Channex.io Channel Manager</h3>
                    <p className="text-sm text-green-700">Sincronizzazione automatica attiva con tutte le principali OTA</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Attivo</Badge>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button
                onClick={() => {
                  setSelectedType('ota_direct');
                  setCurrentStep('provider');
                }}
                className="bg-primary hover:bg-primary/90"
              >
                <Globe className="w-4 h-4 mr-2" />
                Aggiungi Link iCal OTA
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: OTA Selection */}
        {currentStep === 'provider' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
              Seleziona la piattaforma OTA da collegare
            </div>
            
            <div className="grid gap-3">
              {OTA_DIRECT.map(ota => (
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


        {/* Step 3: iCal URL Input */}
        {currentStep === 'ical-input' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
              Inserisci il link iCal per {selectedOTA?.name}
            </div>
            
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{selectedOTA?.icon}</span>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedOTA?.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedOTA?.description}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ical-url" className="text-sm font-medium">
                      Link iCal *
                    </Label>
                    <Input
                      id="ical-url"
                      type="url"
                      placeholder="https://www.airbnb.it/calendar/ical/..."
                      value={icalUrl}
                      onChange={(e) => setIcalUrl(e.target.value)}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Inserisci il link iCal fornito da {selectedOTA?.name}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
              (currentStep === 'provider' && !selectedProvider) ||
              (currentStep === 'ical-input' && !icalUrl.trim())
            }
            className="bg-primary hover:bg-primary/90"
          >
            {isSubmitting 
              ? 'Creando configurazione...' 
              : currentStep === 'ical-input' 
                ? 'Crea Configurazione OTA'
                : 'Continua'
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}