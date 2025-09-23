import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  ArrowRight, 
  Home, 
  Users, 
  Bed, 
  Wifi, 
  Euro, 
  Calendar,
  CheckCircle,
  MapPin,
  Ruler,
  Bath,
  Car,
  Tv,
  AirVent,
  ChefHat,
  ExternalLink
} from "lucide-react";
import { logError, logInfo } from "@/lib/log";

interface PropertyData {
  id?: string;
  nome: string;
  city: string;
  country: string;
  address?: string;
  lat?: number;
  lng?: number;
  size_sqm?: number;
  max_guests?: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  amenities: Record<string, boolean>;
  base_price?: number;
  cleaning_fee?: number;
  currency: string;
  check_in_from?: string;
  check_out_until?: string;
}

const STEPS = [
  { id: 1, title: "Info Base", icon: Home },
  { id: 2, title: "Capacità", icon: Users },
  { id: 3, title: "Servizi", icon: Wifi },
  { id: 4, title: "Prezzi & Regole", icon: Euro },
  { id: 5, title: "Calendario/ICS", icon: Calendar },
  { id: 6, title: "Review", icon: CheckCircle }
];

const AMENITIES = [
  { key: 'wifi', label: 'Wi-Fi', icon: Wifi },
  { key: 'air_conditioning', label: 'Aria Condizionata', icon: AirVent },
  { key: 'kitchen', label: 'Cucina', icon: ChefHat },
  { key: 'tv', label: 'TV', icon: Tv },
  { key: 'parking', label: 'Parcheggio', icon: Car },
];

const CURRENCIES = [
  { value: 'EUR', label: '€ Euro' },
  { value: 'USD', label: '$ US Dollar' },
  { value: 'GBP', label: '£ British Pound' },
];

export default function PropertyWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [data, setData] = useState<PropertyData>({
    nome: '',
    city: '',
    country: '',
    address: '',
    lat: undefined,
    lng: undefined,
    size_sqm: undefined,
    max_guests: 2,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    amenities: {},
    base_price: undefined,
    cleaning_fee: undefined,
    currency: 'EUR',
    check_in_from: '15:00',
    check_out_until: '11:00',
  });

  useEffect(() => {
    loadDraft();
  }, []);

  const loadDraft = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/host-login');
        return;
      }

      // Check for existing draft
      const { data: draft, error } = await supabase
        .from('properties')
        .select('*')
        .eq('host_id', user.id)
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        logError("Failed to load draft", error, { component: "PropertyWizard" });
      } else if (draft && draft.length > 0) {
        const property = draft[0];
        setData({
          id: property.id,
          nome: property.nome || '',
          city: property.city || '',
          country: property.country || '',
          address: property.address || '',
          lat: property.lat || undefined,
          lng: property.lng || undefined,
          size_sqm: property.size_sqm || undefined,
          max_guests: property.max_guests || 2,
          bedrooms: property.bedrooms || 1,
          beds: property.beds || 1,
          bathrooms: property.bathrooms || 1,
          amenities: property.amenities && typeof property.amenities === 'object' ? property.amenities as Record<string, boolean> : {},
          base_price: property.base_price || undefined,
          cleaning_fee: property.cleaning_fee || undefined,
          currency: property.currency || 'EUR',
          check_in_from: property.check_in_from || '15:00',
          check_out_until: property.check_out_until || '11:00',
        });
        
        toast({
          title: "Bozza caricata",
          description: "Continua da dove avevi interrotto",
        });
      }
    } catch (error) {
      logError("Unexpected error loading draft", error, { component: "PropertyWizard" });
    }
    setIsLoading(false);
  };

  const saveDraft = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const propertyData = {
        host_id: user.id,
        nome: data.nome || 'Proprietà senza nome',
        city: data.city,
        country: data.country,
        address: data.address,
        lat: data.lat,
        lng: data.lng,
        size_sqm: data.size_sqm,
        max_guests: data.max_guests,
        bedrooms: data.bedrooms,
        beds: data.beds,
        bathrooms: data.bathrooms,
        amenities: data.amenities,
        base_price: data.base_price,
        cleaning_fee: data.cleaning_fee,
        currency: data.currency,
        check_in_from: data.check_in_from,
        check_out_until: data.check_out_until,
        status: 'draft',
        updated_at: new Date().toISOString(),
      };

      let result;
      if (data.id) {
        // Update existing draft
        result = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', data.id)
          .select()
          .single();
      } else {
        // Create new draft
        result = await supabase
          .from('properties')
          .insert(propertyData)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      if (result.data && !data.id) {
        setData(prev => ({ ...prev, id: result.data.id }));
      }

      logInfo("Draft saved successfully", { component: "PropertyWizard", propertyId: result.data?.id });
    } catch (error) {
      logError("Failed to save draft", error, { component: "PropertyWizard" });
      toast({
        title: "Errore nel salvataggio",
        description: "Non è stato possibile salvare la bozza",
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };

  const createProperty = async () => {
    if (!data.nome.trim() || !data.city.trim()) {
      toast({
        title: "Campi obbligatori",
        description: "Nome e città sono obbligatori",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (!data.id) {
        await saveDraft();
      }

      const { error } = await supabase
        .from('properties')
        .update({ status: 'active' })
        .eq('id', data.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Proprietà creata!",
        description: "La tua proprietà è stata creata con successo",
      });

      logInfo("Property created successfully", { component: "PropertyWizard", propertyId: data.id });
      navigate(`/properties`);
    } catch (error) {
      logError("Failed to create property", error, { component: "PropertyWizard" });
      toast({
        title: "Errore nella creazione",
        description: "Non è stato possibile creare la proprietà",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      saveDraft();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
    saveDraft();
  };

  const updateData = (field: keyof PropertyData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const updateAmenity = (key: string, checked: boolean) => {
    setData(prev => ({
      ...prev,
      amenities: { ...prev.amenities, [key]: checked }
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.nome.trim() && data.city.trim();
      case 2:
        return data.max_guests && data.max_guests > 0;
      default:
        return true;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <Link to="/properties" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna alle proprietà
        </Link>
        <h1 className="text-3xl font-bold mb-2">Crea la tua proprietà</h1>
        <p className="text-muted-foreground">Segui i passaggi per configurare la tua proprietà</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <Progress value={(currentStep / STEPS.length) * 100} className="mb-4" />
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <button
                  key={step.id}
                  onClick={() => goToStep(step.id)}
                  className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : isCompleted 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">{step.title}</span>
                </button>
              );
            })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {(() => {
              const Icon = STEPS[currentStep - 1].icon;
              return <Icon className="h-5 w-5 mr-2" />;
            })()}
            Step {currentStep}: {STEPS[currentStep - 1].title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome proprietà *</Label>
                  <Input
                    id="nome"
                    value={data.nome}
                    onChange={(e) => updateData('nome', e.target.value)}
                    placeholder="es. Appartamento nel centro storico"
                  />
                </div>
                <div>
                  <Label htmlFor="city">Città *</Label>
                  <Input
                    id="city"
                    value={data.city}
                    onChange={(e) => updateData('city', e.target.value)}
                    placeholder="es. Roma"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country">Paese</Label>
                  <Input
                    id="country"
                    value={data.country}
                    onChange={(e) => updateData('country', e.target.value)}
                    placeholder="es. Italia"
                  />
                </div>
                <div>
                  <Label htmlFor="size_sqm">Metri quadri</Label>
                  <Input
                    id="size_sqm"
                    type="number"
                    value={data.size_sqm || ''}
                    onChange={(e) => updateData('size_sqm', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="es. 80"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Indirizzo completo</Label>
                <Input
                  id="address"
                  value={data.address}
                  onChange={(e) => updateData('address', e.target.value)}
                  placeholder="es. Via Roma, 123"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lat">Latitudine (opzionale)</Label>
                  <Input
                    id="lat"
                    type="number"
                    step="any"
                    value={data.lat || ''}
                    onChange={(e) => updateData('lat', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="es. 41.9028"
                  />
                </div>
                <div>
                  <Label htmlFor="lng">Longitudine (opzionale)</Label>
                  <Input
                    id="lng"
                    type="number"
                    step="any"
                    value={data.lng || ''}
                    onChange={(e) => updateData('lng', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="es. 12.4964"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Capacity */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_guests">Numero massimo ospiti *</Label>
                  <Input
                    id="max_guests"
                    type="number"
                    min="1"
                    value={data.max_guests || ''}
                    onChange={(e) => updateData('max_guests', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <Label htmlFor="bedrooms">Numero di camere da letto</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    min="0"
                    value={data.bedrooms || ''}
                    onChange={(e) => updateData('bedrooms', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="beds">Numero di letti</Label>
                  <Input
                    id="beds"
                    type="number"
                    min="0"
                    value={data.beds || ''}
                    onChange={(e) => updateData('beds', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="bathrooms">Numero di bagni</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    step="0.5"
                    min="0"
                    value={data.bathrooms || ''}
                    onChange={(e) => updateData('bathrooms', parseFloat(e.target.value) || 0)}
                    placeholder="es. 1.5 per un bagno e mezzo"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Amenities */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Seleziona i servizi disponibili nella tua proprietà:</p>
              <div className="grid md:grid-cols-2 gap-4">
                {AMENITIES.map((amenity) => {
                  const Icon = amenity.icon;
                  return (
                    <div key={amenity.key} className="flex items-center space-x-2 p-3 border rounded-lg">
                      <Checkbox
                        id={amenity.key}
                        checked={data.amenities[amenity.key] || false}
                        onCheckedChange={(checked) => updateAmenity(amenity.key, !!checked)}
                      />
                      <Icon className="h-4 w-4" />
                      <Label htmlFor={amenity.key} className="flex-1">{amenity.label}</Label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Prices & Rules */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="base_price">Prezzo base per notte</Label>
                  <Input
                    id="base_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={data.base_price || ''}
                    onChange={(e) => updateData('base_price', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="es. 80.00"
                  />
                </div>
                <div>
                  <Label htmlFor="cleaning_fee">Costo pulizie</Label>
                  <Input
                    id="cleaning_fee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={data.cleaning_fee || ''}
                    onChange={(e) => updateData('cleaning_fee', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="es. 25.00"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Valuta</Label>
                  <Select value={data.currency} onValueChange={(value) => updateData('currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="check_in_from">Check-in dalle</Label>
                  <Input
                    id="check_in_from"
                    type="time"
                    value={data.check_in_from}
                    onChange={(e) => updateData('check_in_from', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="check_out_until">Check-out entro le</Label>
                  <Input
                    id="check_out_until"
                    type="time"
                    value={data.check_out_until}
                    onChange={(e) => updateData('check_out_until', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Calendar/ICS */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Configurazione Calendario</h3>
                <p className="text-muted-foreground mb-6">
                  Per sincronizzare i tuoi calendari con altri canali (Airbnb, Booking.com, ecc.), 
                  puoi configurare i collegamenti iCal dopo aver creato la proprietà.
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Cosa potrai fare dopo:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Collegare i calendari dei canali di vendita</li>
                    <li>• Sincronizzazione automatica delle disponibilità</li>
                    <li>• Gestione centralizzata del calendario</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Review */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium flex items-center mb-2">
                      <MapPin className="h-4 w-4 mr-2" />
                      Informazioni base
                    </h4>
                    <div className="text-sm space-y-1">
                      <p><span className="font-medium">Nome:</span> {data.nome}</p>
                      <p><span className="font-medium">Città:</span> {data.city}</p>
                      {data.country && <p><span className="font-medium">Paese:</span> {data.country}</p>}
                      {data.address && <p><span className="font-medium">Indirizzo:</span> {data.address}</p>}
                      {data.size_sqm && <p><span className="font-medium">Superficie:</span> {data.size_sqm} m²</p>}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium flex items-center mb-2">
                      <Users className="h-4 w-4 mr-2" />
                      Capacità
                    </h4>
                    <div className="text-sm space-y-1">
                      <p><span className="font-medium">Ospiti massimi:</span> {data.max_guests}</p>
                      <p><span className="font-medium">Camere:</span> {data.bedrooms || 0}</p>
                      <p><span className="font-medium">Letti:</span> {data.beds || 0}</p>
                      <p><span className="font-medium">Bagni:</span> {data.bathrooms || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium flex items-center mb-2">
                      <Wifi className="h-4 w-4 mr-2" />
                      Servizi
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(data.amenities).filter(([_, enabled]) => enabled).map(([key]) => {
                        const amenity = AMENITIES.find(a => a.key === key);
                        return amenity ? (
                          <span key={key} className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            <amenity.icon className="h-3 w-3 mr-1" />
                            {amenity.label}
                          </span>
                        ) : null;
                      })}
                      {Object.values(data.amenities).every(v => !v) && (
                        <span className="text-sm text-muted-foreground">Nessun servizio selezionato</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium flex items-center mb-2">
                      <Euro className="h-4 w-4 mr-2" />
                      Prezzi & Regole
                    </h4>
                    <div className="text-sm space-y-1">
                      {data.base_price && <p><span className="font-medium">Prezzo base:</span> {data.base_price} {data.currency}/notte</p>}
                      {data.cleaning_fee && <p><span className="font-medium">Pulizie:</span> {data.cleaning_fee} {data.currency}</p>}
                      <p><span className="font-medium">Check-in:</span> dalle {data.check_in_from}</p>
                      <p><span className="font-medium">Check-out:</span> entro le {data.check_out_until}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={prevStep} 
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>

            <div className="flex gap-2">
              {isSaving && (
                <Button variant="ghost" disabled>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Salvataggio...
                </Button>
              )}
              
              {currentStep === STEPS.length ? (
                <Button onClick={createProperty} disabled={isLoading || !canProceed()}>
                  {isLoading ? "Creazione..." : "Crea Proprietà"}
                  <CheckCircle className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={nextStep} disabled={!canProceed()}>
                  Avanti
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>

          {/* Calendar link in step 5 */}
          {currentStep === 5 && data.id && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">
                💡 <strong>Suggerimento:</strong> Dopo aver creato la proprietà, potrai configurare 
                immediatamente i canali iCal per la sincronizzazione automatica.
              </p>
              <Link 
                to={`/channels?property_id=${data.id}`}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Vai alla configurazione canali
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}