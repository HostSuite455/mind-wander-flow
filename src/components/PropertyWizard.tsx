import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, Home, MapPin, Users, DollarSign, Clock, Star } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createProperty, updateProperty, getDraftProperty, type NewProperty } from "@/lib/properties";

interface PropertyWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type WizardStep = 'basic' | 'location' | 'capacity' | 'pricing' | 'checkin' | 'amenities';

const WIZARD_STEPS = [
  { id: 'basic', title: 'Informazioni Base', icon: Home, description: 'Nome e descrizione della proprietà' },
  { id: 'location', title: 'Posizione', icon: MapPin, description: 'Indirizzo e coordinate' },
  { id: 'capacity', title: 'Capacità', icon: Users, description: 'Ospiti, camere e bagni' },
  { id: 'pricing', title: 'Prezzi', icon: DollarSign, description: 'Tariffe e costi aggiuntivi' },
  { id: 'checkin', title: 'Check-in/out', icon: Clock, description: 'Orari di arrivo e partenza' },
  { id: 'amenities', title: 'Servizi', icon: Star, description: 'Comfort e servizi disponibili' }
] as const;

const AMENITIES_LIST = [
  { id: 'wifi', label: 'Wi-Fi gratuito' },
  { id: 'parking', label: 'Parcheggio' },
  { id: 'kitchen', label: 'Cucina attrezzata' },
  { id: 'washing_machine', label: 'Lavatrice' },
  { id: 'air_conditioning', label: 'Aria condizionata' },
  { id: 'heating', label: 'Riscaldamento' },
  { id: 'tv', label: 'TV' },
  { id: 'balcony', label: 'Balcone/Terrazza' },
  { id: 'pool', label: 'Piscina' },
  { id: 'gym', label: 'Palestra' },
  { id: 'pets_allowed', label: 'Animali ammessi' },
  { id: 'smoking_allowed', label: 'Fumo consentito' }
];

export default function PropertyWizard({ isOpen, onClose, onSuccess }: PropertyWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<NewProperty>>({
    nome: '',
    city: '',
    address: '',
    country: 'Italia',
    lat: null,
    lng: null,
    size_sqm: null,
    guests: 2,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    base_price: null,
    cleaning_fee: null,
    currency: 'EUR',
    check_in_from: '15:00',
    check_out_until: '11:00',
    amenities: {},
    status: 'draft'
  });

  // Load existing draft on mount
  useEffect(() => {
    if (isOpen) {
      loadDraft();
    }
  }, [isOpen]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!isOpen || !formData.nome) return;

    const interval = setInterval(() => {
      saveDraft();
    }, 30000);

    return () => clearInterval(interval);
  }, [isOpen, formData]);

  const loadDraft = async () => {
    try {
      const { data, error } = await getDraftProperty();
      if (error) {
        console.error('Error loading draft:', error);
        return;
      }
      
      if (data) {
        setDraftId(data.id);
        setFormData({
          nome: data.nome || '',
          city: data.city || '',
          address: data.address || '',
          country: data.country || 'Italia',
          lat: data.lat,
          lng: data.lng,
          size_sqm: data.size_sqm,
          guests: data.guests || 2,
          bedrooms: data.bedrooms || 1,
          beds: data.beds || 1,
          bathrooms: data.bathrooms || 1,
          base_price: data.base_price,
          cleaning_fee: data.cleaning_fee,
          currency: data.currency || 'EUR',
          check_in_from: data.check_in_from || '15:00',
          check_out_until: data.check_out_until || '11:00',
          amenities: data.amenities || {},
          status: 'draft'
        });
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };

  const saveDraft = async () => {
    if (!formData.nome?.trim()) return;

    try {
      if (draftId) {
        await updateProperty(draftId, formData);
      } else {
        const { data, error } = await createProperty(formData as NewProperty);
        if (error) {
          console.error('Error creating draft:', error);
          return;
        }
        if (data) {
          setDraftId(data.id);
        }
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const updateFormData = (field: keyof NewProperty, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateAmenity = (amenityId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [amenityId]: checked
      }
    }));
  };

  const getCurrentStepIndex = () => {
    return WIZARD_STEPS.findIndex(step => step.id === currentStep);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'basic':
        return formData.nome?.trim();
      case 'location':
        return formData.city?.trim() && formData.address?.trim();
      case 'capacity':
        return formData.guests && formData.bedrooms && formData.bathrooms;
      case 'pricing':
        return formData.base_price && formData.base_price > 0;
      case 'checkin':
        return formData.check_in_from && formData.check_out_until;
      case 'amenities':
        return true; // Amenities are optional
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (!canProceed()) return;

    // Save draft before proceeding
    await saveDraft();

    const currentIndex = getCurrentStepIndex();
    if (currentIndex < WIZARD_STEPS.length - 1) {
      setCurrentStep(WIZARD_STEPS[currentIndex + 1].id as WizardStep);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(WIZARD_STEPS[currentIndex - 1].id as WizardStep);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const finalData = { ...formData, status: 'active' as const };
      
      let result;
      if (draftId) {
        result = await updateProperty(draftId, finalData);
      } else {
        result = await createProperty(finalData as NewProperty);
      }

      if (result.error) {
        toast({
          title: "Errore",
          description: result.error.message || "Errore durante la creazione della proprietà",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Successo!",
        description: "Proprietà creata con successo",
      });

      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        nome: '',
        city: '',
        address: '',
        country: 'Italia',
        lat: null,
        lng: null,
        size_sqm: null,
        guests: 2,
        bedrooms: 1,
        beds: 1,
        bathrooms: 1,
        base_price: null,
        cleaning_fee: null,
        currency: 'EUR',
        check_in_from: '15:00',
        check_out_until: '11:00',
        amenities: {},
        status: 'draft'
      });
      setDraftId(null);
      setCurrentStep('basic');
      
    } catch (error) {
      console.error('Error submitting property:', error);
      toast({
        title: "Errore",
        description: "Errore durante la creazione della proprietà",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome della proprietà *</Label>
              <Input
                id="nome"
                value={formData.nome || ''}
                onChange={(e) => updateFormData('nome', e.target.value)}
                placeholder="es. Appartamento Centro Storico"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="size_sqm">Superficie (mq)</Label>
              <Input
                id="size_sqm"
                type="number"
                value={formData.size_sqm || ''}
                onChange={(e) => updateFormData('size_sqm', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="es. 80"
                className="mt-1"
              />
            </div>
          </div>
        );

      case 'location':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="address">Indirizzo *</Label>
              <Input
                id="address"
                value={formData.address || ''}
                onChange={(e) => updateFormData('address', e.target.value)}
                placeholder="es. Via Roma 123"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="city">Città *</Label>
              <Input
                id="city"
                value={formData.city || ''}
                onChange={(e) => updateFormData('city', e.target.value)}
                placeholder="es. Milano"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="country">Paese</Label>
              <Select value={formData.country || 'Italia'} onValueChange={(value) => updateFormData('country', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Italia">Italia</SelectItem>
                  <SelectItem value="Francia">Francia</SelectItem>
                  <SelectItem value="Spagna">Spagna</SelectItem>
                  <SelectItem value="Germania">Germania</SelectItem>
                  <SelectItem value="Regno Unito">Regno Unito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lat">Latitudine</Label>
                <Input
                  id="lat"
                  type="number"
                  step="any"
                  value={formData.lat || ''}
                  onChange={(e) => updateFormData('lat', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="es. 45.4642"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lng">Longitudine</Label>
                <Input
                  id="lng"
                  type="number"
                  step="any"
                  value={formData.lng || ''}
                  onChange={(e) => updateFormData('lng', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="es. 9.1900"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        );

      case 'capacity':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="guests">Numero massimo ospiti *</Label>
              <Input
                id="guests"
                type="number"
                min="1"
                value={formData.guests || ''}
                onChange={(e) => updateFormData('guests', e.target.value ? parseInt(e.target.value) : null)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="bedrooms">Camere da letto *</Label>
              <Input
                id="bedrooms"
                type="number"
                min="0"
                value={formData.bedrooms || ''}
                onChange={(e) => updateFormData('bedrooms', e.target.value ? parseInt(e.target.value) : null)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="beds">Letti</Label>
              <Input
                id="beds"
                type="number"
                min="0"
                value={formData.beds || ''}
                onChange={(e) => updateFormData('beds', e.target.value ? parseInt(e.target.value) : null)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="bathrooms">Bagni *</Label>
              <Input
                id="bathrooms"
                type="number"
                min="1"
                step="0.5"
                value={formData.bathrooms || ''}
                onChange={(e) => updateFormData('bathrooms', e.target.value ? parseFloat(e.target.value) : null)}
                className="mt-1"
              />
            </div>
          </div>
        );

      case 'pricing':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="base_price">Prezzo base per notte *</Label>
              <div className="flex mt-1">
                <Input
                  id="base_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.base_price || ''}
                  onChange={(e) => updateFormData('base_price', e.target.value ? parseFloat(e.target.value) : null)}
                  className="rounded-r-none"
                />
                <Select value={formData.currency || 'EUR'} onValueChange={(value) => updateFormData('currency', value)}>
                  <SelectTrigger className="w-20 rounded-l-none border-l-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="cleaning_fee">Costo pulizie</Label>
              <div className="flex mt-1">
                <Input
                  id="cleaning_fee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cleaning_fee || ''}
                  onChange={(e) => updateFormData('cleaning_fee', e.target.value ? parseFloat(e.target.value) : null)}
                  className="rounded-r-none"
                />
                <div className="px-3 py-2 bg-gray-50 border border-l-0 rounded-r-md text-sm text-gray-500">
                  {formData.currency || 'EUR'}
                </div>
              </div>
            </div>
          </div>
        );

      case 'checkin':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="check_in_from">Check-in dalle *</Label>
              <Input
                id="check_in_from"
                type="time"
                value={formData.check_in_from || ''}
                onChange={(e) => updateFormData('check_in_from', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="check_out_until">Check-out entro *</Label>
              <Input
                id="check_out_until"
                type="time"
                value={formData.check_out_until || ''}
                onChange={(e) => updateFormData('check_out_until', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        );

      case 'amenities':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {AMENITIES_LIST.map((amenity) => (
                <div key={amenity.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={amenity.id}
                    checked={!!formData.amenities?.[amenity.id]}
                    onCheckedChange={(checked) => updateAmenity(amenity.id, !!checked)}
                  />
                  <Label htmlFor={amenity.id} className="text-sm font-normal">
                    {amenity.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const currentStepData = WIZARD_STEPS.find(step => step.id === currentStep);
  const currentIndex = getCurrentStepIndex();
  const isLastStep = currentIndex === WIZARD_STEPS.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentStepData && <currentStepData.icon className="h-5 w-5" />}
            Crea Nuova Proprietà - {currentStepData?.title}
          </DialogTitle>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-6">
          {WIZARD_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentIndex;
            const isCompleted = index < currentIndex;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full border-2 
                  ${isActive ? 'border-blue-500 bg-blue-500 text-white' : 
                    isCompleted ? 'border-green-500 bg-green-500 text-white' : 
                    'border-gray-300 bg-white text-gray-400'}
                `}>
                  <Icon className="h-4 w-4" />
                </div>
                {index < WIZARD_STEPS.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
                )}
              </div>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{currentStepData?.title}</CardTitle>
            <CardDescription>{currentStepData?.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Indietro
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
          >
            {isSubmitting ? (
              "Salvando..."
            ) : isLastStep ? (
              "Crea Proprietà"
            ) : (
              <>
                Avanti
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}