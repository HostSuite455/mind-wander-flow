import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  ExternalLink,
  Building,
  Hotel,
  Tent,
  Ship,
  TreePine,
  Castle,
  Plus,
  Minus
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

interface PropertyType {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
}

const PROPERTY_TYPES: PropertyType[] = [
  { id: 'casa', label: 'Casa', icon: Home, description: 'Una casa completa' },
  { id: 'appartamento', label: 'Appartamento', icon: Building, description: 'Un appartamento in condominio' },
  { id: 'villa', label: 'Villa', icon: Castle, description: 'Una villa indipendente' },
  { id: 'b&b', label: 'B&B', icon: Bed, description: 'Bed & Breakfast' },
  { id: 'hotel', label: 'Hotel', icon: Hotel, description: 'Camera d\'hotel' },
  { id: 'barca', label: 'Barca', icon: Ship, description: 'Una barca o yacht' },
  { id: 'camping', label: 'Camping', icon: Tent, description: 'Tenda o camper' },
  { id: 'baita', label: 'Baita', icon: TreePine, description: 'Casa di montagna' },
];

const PRIVACY_TYPES = [
  {
    id: 'entire_place',
    title: 'Un alloggio intero',
    description: 'Gli ospiti hanno l\'intero alloggio solo per loro.',
    icon: Home
  },
  {
    id: 'private_room',
    title: 'Una stanza',
    description: 'Gli ospiti hanno la loro stanza in una casa, più l\'accesso agli spazi condivisi.',
    icon: Bed
  },
  {
    id: 'shared_room',
    title: 'Una stanza condivisa in un ostello',
    description: 'Gli ospiti dormono in una stanza condivisa in un ostello gestito da un professionista con personale in loco 24 ore su 24.',
    icon: Users
  }
];

const AMENITIES = [
  { key: 'wifi', label: 'Wi-Fi', icon: Wifi },
  { key: 'tv', label: 'TV', icon: Tv },
  { key: 'kitchen', label: 'Cucina', icon: ChefHat },
  { key: 'washer', label: 'Lavatrice', icon: Ruler },
  { key: 'parking_free', label: 'Parcheggio gratuito nella proprietà', icon: Car },
  { key: 'parking_paid', label: 'Parcheggio a pagamento in loco', icon: Car },
  { key: 'air_conditioning', label: 'Aria condizionata', icon: AirVent },
  { key: 'workspace', label: 'Spazio di lavoro dedicato', icon: Users },
];

const CURRENCIES = [
  { value: 'EUR', label: '€ Euro' },
  { value: 'USD', label: '$ US Dollar' },
  { value: 'GBP', label: '£ British Pound' },
];

interface CounterProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

const Counter: React.FC<CounterProps> = ({ label, value, onChange, min = 0, max = 16 }) => (
  <div className="flex items-center justify-between py-4 border-b border-border">
    <span className="font-medium">{label}</span>
    <div className="flex items-center gap-4">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="w-8 text-center font-medium">{value}</span>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

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
    max_guests: 1,
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

  const [selectedPropertyType, setSelectedPropertyType] = useState<string>('');
  const [selectedPrivacyType, setSelectedPrivacyType] = useState<string>('');

  const totalSteps = 8;

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
          max_guests: property.max_guests || 1,
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
    if (currentStep < totalSteps) {
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
        return selectedPropertyType !== '';
      case 2:
        return selectedPrivacyType !== '';
      case 3:
        return data.city.trim() !== '';
      case 4:
        return data.max_guests > 0;
      case 5:
        return data.nome.trim() !== '';
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="container mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/properties" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Esci
            </Link>
            <div className="text-sm text-muted-foreground">
              {currentStep} / {totalSteps}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-2xl px-6 py-12">
        <div className="space-y-8">
          {/* Step 1: Property Type */}
          {currentStep === 1 && (
            <div className="text-center space-y-8">
              <div>
                <h1 className="text-4xl font-bold mb-4">Quale di queste opzioni descrive meglio il tuo alloggio?</h1>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PROPERTY_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedPropertyType(type.id)}
                      className={`p-6 rounded-lg border-2 transition-all hover:border-primary/50 text-left ${
                        selectedPropertyType === type.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      }`}
                    >
                      <Icon className="h-8 w-8 mb-3" />
                      <h3 className="font-semibold mb-1">{type.label}</h3>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Privacy Type */}
          {currentStep === 2 && (
            <div className="text-center space-y-8">
              <div>
                <h1 className="text-4xl font-bold mb-4">A che tipo di alloggio avranno accesso gli ospiti?</h1>
              </div>
              
              <div className="space-y-4">
                {PRIVACY_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedPrivacyType(type.id)}
                      className={`w-full p-6 rounded-lg border-2 transition-all hover:border-primary/50 text-left ${
                        selectedPrivacyType === type.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <Icon className="h-8 w-8 mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold mb-2">{type.title}</h3>
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {currentStep === 3 && (
            <div className="text-center space-y-8">
              <div>
                <h1 className="text-4xl font-bold mb-4">Dove si trova il tuo alloggio?</h1>
                <p className="text-muted-foreground">Il tuo indirizzo viene condiviso con gli ospiti solo dopo che hanno effettuato una prenotazione.</p>
              </div>
              
              <div className="space-y-6 max-w-md mx-auto">
                <div>
                  <Input
                    value={data.city}
                    onChange={(e) => updateData('city', e.target.value)}
                    placeholder="Città"
                    className="text-lg py-4"
                  />
                </div>
                <div>
                  <Input
                    value={data.country}
                    onChange={(e) => updateData('country', e.target.value)}
                    placeholder="Paese"
                    className="text-lg py-4"
                  />
                </div>
                <div>
                  <Input
                    value={data.address}
                    onChange={(e) => updateData('address', e.target.value)}
                    placeholder="Indirizzo (opzionale)"
                    className="text-lg py-4"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Capacity */}
          {currentStep === 4 && (
            <div className="text-center space-y-8">
              <div>
                <h1 className="text-4xl font-bold mb-4">Condividi alcune informazioni di base sul tuo alloggio</h1>
                <p className="text-muted-foreground">Potrai aggiungere ulteriori dettagli in seguito, come i tipi di letto.</p>
              </div>
              
              <div className="bg-card p-8 rounded-lg border max-w-md mx-auto">
                <Counter
                  label="Ospiti"
                  value={data.max_guests || 1}
                  onChange={(value) => updateData('max_guests', value)}
                  min={1}
                />
                <Counter
                  label="Camere da letto"
                  value={data.bedrooms || 1}
                  onChange={(value) => updateData('bedrooms', value)}
                  min={0}
                />
                <Counter
                  label="Letti"
                  value={data.beds || 1}
                  onChange={(value) => updateData('beds', value)}
                  min={1}
                />
                <div className="flex items-center justify-between py-4">
                  <span className="font-medium">Bagni</span>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => updateData('bathrooms', Math.max(0.5, (data.bathrooms || 1) - 0.5))}
                      disabled={(data.bathrooms || 1) <= 0.5}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">{data.bathrooms || 1}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => updateData('bathrooms', Math.min(16, (data.bathrooms || 1) + 0.5))}
                      disabled={(data.bathrooms || 1) >= 16}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Property Name */}
          {currentStep === 5 && (
            <div className="text-center space-y-8">
              <div>
                <h1 className="text-4xl font-bold mb-4">Ora, dicci il nome del tuo alloggio</h1>
                <p className="text-muted-foreground">I nomi brevi sono più efficaci. Non preoccuparti, puoi sempre cambiarlo in seguito.</p>
              </div>
              
              <div className="max-w-md mx-auto">
                <Input
                  value={data.nome}
                  onChange={(e) => updateData('nome', e.target.value)}
                  placeholder="es. Appartamento luminoso nel centro storico"
                  className="text-lg py-4"
                />
                <p className="text-sm text-muted-foreground mt-2">{data.nome.length}/50</p>
              </div>
            </div>
          )}

          {/* Step 6: Amenities */}
          {currentStep === 6 && (
            <div className="text-center space-y-8">
              <div>
                <h1 className="text-4xl font-bold mb-4">Fai conoscere agli utenti tutti i servizi del tuo alloggio</h1>
                <p className="text-muted-foreground">Potrai aggiungerne degli altri dopo la pubblicazione dell'annuncio.</p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-6 text-left">I servizi più richiesti dagli ospiti:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {AMENITIES.map((amenity) => {
                    const Icon = amenity.icon;
                    const isSelected = data.amenities[amenity.key] || false;
                    return (
                      <button
                        key={amenity.key}
                        onClick={() => updateAmenity(amenity.key, !isSelected)}
                        className={`p-4 rounded-lg border-2 transition-all hover:border-primary/50 text-left ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-6 w-6" />
                          <span className="font-medium">{amenity.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Pricing */}
          {currentStep === 7 && (
            <div className="text-center space-y-8">
              <div>
                <h1 className="text-4xl font-bold mb-4">Ora, imposta il tuo prezzo</h1>
                <p className="text-muted-foreground">Puoi cambiarlo in qualsiasi momento.</p>
              </div>
              
              <div className="bg-card p-8 rounded-lg border max-w-md mx-auto space-y-6">
                <div>
                  <Label className="text-lg font-medium">Prezzo base per notte</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-2xl">€</span>
                    <Input
                      type="number"
                      value={data.base_price || ''}
                      onChange={(e) => updateData('base_price', parseFloat(e.target.value) || undefined)}
                      placeholder="0"
                      className="text-2xl py-4"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-lg font-medium">Costo di pulizia (opzionale)</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xl">€</span>
                    <Input
                      type="number"
                      value={data.cleaning_fee || ''}
                      onChange={(e) => updateData('cleaning_fee', parseFloat(e.target.value) || undefined)}
                      placeholder="0"
                      className="text-xl py-3"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 8: Review */}
          {currentStep === 8 && (
            <div className="text-center space-y-8">
              <div>
                <h1 className="text-4xl font-bold mb-4">Controlla il tuo annuncio</h1>
                <p className="text-muted-foreground">Ecco come apparirà agli ospiti. Assicurati che tutto sia come lo desideri.</p>
              </div>

              <div className="bg-card p-8 rounded-lg border text-left space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-2">{data.nome || 'Nome proprietà'}</h3>
                  <p className="text-muted-foreground">{selectedPropertyType} • {data.city}, {data.country}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>{data.max_guests} ospiti</div>
                  <div>{data.bedrooms} camere</div>
                  <div>{data.beds} letti</div>
                  <div>{data.bathrooms} bagni</div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Servizi:</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(data.amenities)
                      .filter(([_, selected]) => selected)
                      .map(([key, _]) => {
                        const amenity = AMENITIES.find(a => a.key === key);
                        return amenity ? (
                          <span key={key} className="px-3 py-1 bg-muted rounded-full text-sm">
                            {amenity.label}
                          </span>
                        ) : null;
                      })}
                  </div>
                </div>

                {data.base_price && (
                  <div>
                    <h4 className="font-semibold mb-2">Prezzo:</h4>
                    <div className="text-xl font-bold">€{data.base_price} a notte</div>
                    {data.cleaning_fee && (
                      <div className="text-sm text-muted-foreground">+ €{data.cleaning_fee} costo di pulizia</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
          <div className="container mx-auto max-w-2xl px-6 py-4">
            <div className="flex justify-between items-center">
              <Button
                variant="ghost"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="text-muted-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Indietro
              </Button>

              {currentStep === totalSteps ? (
                <Button
                  onClick={createProperty}
                  disabled={isLoading || !canProceed()}
                  size="lg"
                  className="min-w-[140px]"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    'Pubblica annuncio'
                  )}
                </Button>
              ) : (
                <Button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  size="lg"
                  className="min-w-[100px]"
                >
                  Avanti
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Auto-save indicator */}
        {isSaving && (
          <div className="fixed top-20 right-4 bg-muted text-muted-foreground px-4 py-2 rounded-lg shadow-lg border">
            <div className="flex items-center gap-2 text-sm">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
              Salvataggio automatico...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}