import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Calendar, 
  MapPin, 
  Users, 
  FileText, 
  Euro, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Edit3,
  Clock,
  Wifi,
  Car,
  Utensils,
  Tv,
  Wind,
  Waves,
  Coffee,
  Dumbbell,
  Gamepad2,
  Baby,
  PawPrint,
  Cigarette,
  Shield
} from 'lucide-react';

interface PropertyData {
  id?: string;
  title: string;
  description: string;
  address: string;
  city: string;
  country: string;
  price_per_night: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities: string[];
  platforms: string[];
  ical_url?: string;
}

const AMENITIES = {
  wifi: { label: 'Wi-Fi', icon: Wifi },
  parking: { label: 'Parcheggio', icon: Car },
  kitchen: { label: 'Cucina', icon: Utensils },
  tv: { label: 'TV', icon: Tv },
  ac: { label: 'Aria condizionata', icon: Wind },
  pool: { label: 'Piscina', icon: Waves },
  breakfast: { label: 'Colazione', icon: Coffee },
  gym: { label: 'Palestra', icon: Dumbbell },
  games: { label: 'Giochi', icon: Gamepad2 },
  baby_friendly: { label: 'Adatto ai bambini', icon: Baby },
  pet_friendly: { label: 'Animali ammessi', icon: PawPrint },
  smoking: { label: 'Fumo consentito', icon: Cigarette },
  security: { label: 'Sicurezza', icon: Shield }
};

const PLATFORMS = [
  { id: 'airbnb', name: 'Airbnb', color: 'bg-red-500', icalPlaceholder: 'https://www.airbnb.it/calendar/ical/...' },
  { id: 'booking', name: 'Booking.com', color: 'bg-blue-600', icalPlaceholder: 'https://admin.booking.com/hotel/hoteladmin/ical/...' },
  { id: 'vrbo', name: 'VRBO', color: 'bg-yellow-500', icalPlaceholder: 'https://www.vrbo.com/icalendar/...' },
  { id: 'simple', name: 'Link iCal Semplice', color: 'bg-gray-600', icalPlaceholder: 'https://calendar.google.com/calendar/ical/...' }
];

export default function PropertyWizard() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const totalSteps = 5;
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [icalUrl, setIcalUrl] = useState('');
  const [isIcalValid, setIsIcalValid] = useState(false);

  const [data, setData] = useState<PropertyData>({
    title: '',
    description: '',
    address: '',
    city: '',
    country: 'Italia',
    price_per_night: 50,
    max_guests: 2,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    amenities: [],
    platforms: []
  });

  const validateIcalUrl = (url: string) => {
    const icalPattern = /^https?:\/\/.+\.(ics|ical)(\?.*)?$|^https?:\/\/.+\/ical\/.+$/i;
    const isValid = icalPattern.test(url) && url.length > 10;
    setIsIcalValid(isValid);
    return isValid;
  };

  const handleIcalChange = (value: string) => {
    setIcalUrl(value);
    validateIcalUrl(value);
  };

  const handlePlatformSelect = (platformId: string) => {
    setSelectedPlatform(platformId);
    setIcalUrl('');
    setIsIcalValid(false);
  };

  const getSelectedPlatformData = () => {
    return PLATFORMS.find(p => p.id === selectedPlatform);
  };

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      // Simulate loading existing property
      setTimeout(() => {
        setData(prev => ({ ...prev, id }));
        setIsLoading(false);
      }, 1000);
    }
  }, [id]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    setTimeout(() => {
      setIsSaving(false);
      navigate('/properties');
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Caricamento proprietà...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col min-h-screen">
        {/* Header */}
        <div className="border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Nuova Proprietà</h1>
              <p className="text-gray-600 mt-2">Passaggio {currentStep} di {totalSteps}</p>
            </div>
            <button 
              onClick={() => window.history.back()}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>
        
        {/* Draft Banner */}
        {data.id && (
          <div className="bg-amber-50 border-b border-amber-200">
            <div className="px-8 py-3">
              <div className="flex items-center gap-2 text-amber-800">
                <Edit3 className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Stai completando una bozza salvata
                </span>
                <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-100 ml-2">
                  <Clock className="w-3 h-3 mr-1" />
                  Bozza
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 px-8 py-6 overflow-y-auto">
          {/* Step 1: Platforms */}
          {currentStep === 1 && (
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-4">Nuovo proprietà</h1>
                <p className="text-muted-foreground">Passaggio 1 di 5</p>
              </div>
              
              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Platform Selection */}
                <div className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-semibold mb-4">Piattaforme Supportate</h2>
                      <p className="text-sm text-muted-foreground mb-6">
                        Seleziona la piattaforma da cui vuoi sincronizzare il calendario
                      </p>
                      
                      <div className="space-y-3">
                        {PLATFORMS.map((platform) => (
                          <button
                            key={platform.id}
                            onClick={() => handlePlatformSelect(platform.id)}
                            className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                              selectedPlatform === platform.id
                                ? 'border-teal-500 bg-teal-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 ${platform.color} rounded flex items-center justify-center text-white text-sm font-bold`}>
                                {platform.name.charAt(0)}
                              </div>
                              <span className="font-medium text-gray-900">{platform.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* iCal URL Input - Shows only when platform is selected */}
                  {selectedPlatform && (
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-3">
                          Link iCal - {getSelectedPlatformData()?.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Inserisci il link iCal per sincronizzare automaticamente le prenotazioni
                        </p>
                        
                        <div className="space-y-3">
                          <Input
                            type="url"
                            value={icalUrl}
                            onChange={(e) => handleIcalChange(e.target.value)}
                            placeholder={getSelectedPlatformData()?.icalPlaceholder}
                            className={`${
                              icalUrl && !isIcalValid ? 'border-red-300' : ''
                            }`}
                          />
                          
                          {icalUrl && !isIcalValid && (
                            <p className="text-red-600 text-sm">
                              Inserisci un URL iCal valido (deve terminare con .ics o contenere /ical/)
                            </p>
                          )}
                          
                          {isIcalValid && (
                            <p className="text-green-600 text-sm flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              URL iCal valido
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
                
                {/* Right Column - Calendar Information */}
                <div className="space-y-6">
                  <Card className="bg-gradient-to-br from-teal-50 to-blue-50 border-teal-200">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-teal-900 mb-2">Calendario delle prenotazioni</h3>
                          <p className="text-sm text-teal-700 leading-relaxed">
                            Sincronizza automaticamente le prenotazioni dai tuoi canali di vendita. 
                            Il sistema aggiornerà in tempo reale la disponibilità e previene le doppie prenotazioni.
                          </p>
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center text-xs text-teal-600">
                              <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-2"></div>
                              Sincronizzazione automatica ogni 15 minuti
                            </div>
                            <div className="flex items-center text-xs text-teal-600">
                              <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-2"></div>
                              Prevenzione doppie prenotazioni
                            </div>
                            <div className="flex items-center text-xs text-teal-600">
                              <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-2"></div>
                              Supporto per tutti i principali OTA
                            </div>
                          </div>
                          
                          {selectedPlatform && (
                            <div className="mt-6 p-4 bg-white rounded-lg border border-teal-200">
                              <h4 className="font-medium text-teal-800 mb-2">
                                Come trovare il link iCal su {getSelectedPlatformData()?.name}:
                              </h4>
                              <div className="text-sm text-teal-700">
                                {selectedPlatform === 'airbnb' && (
                                  <ol className="list-decimal list-inside space-y-1">
                                    <li>Vai su Airbnb Host Dashboard</li>
                                    <li>Seleziona "Calendario" → "Disponibilità"</li>
                                    <li>Clicca su "Esporta calendario"</li>
                                    <li>Copia il link iCal generato</li>
                                  </ol>
                                )}
                                {selectedPlatform === 'booking' && (
                                  <ol className="list-decimal list-inside space-y-1">
                                    <li>Accedi al tuo Extranet Booking.com</li>
                                    <li>Vai su "Calendario" → "Sincronizzazione"</li>
                                    <li>Genera il link di esportazione iCal</li>
                                    <li>Copia il link fornito</li>
                                  </ol>
                                )}
                                {selectedPlatform === 'vrbo' && (
                                  <ol className="list-decimal list-inside space-y-1">
                                    <li>Accedi al tuo account VRBO</li>
                                    <li>Vai su "Calendario" → "Sincronizza calendari"</li>
                                    <li>Seleziona "Esporta calendario"</li>
                                    <li>Copia il link iCal</li>
                                  </ol>
                                )}
                                {selectedPlatform === 'simple' && (
                                  <div>
                                    <p>Inserisci qualsiasi link iCal valido da:</p>
                                    <ul className="list-disc list-inside mt-2 space-y-1">
                                      <li>Google Calendar</li>
                                      <li>Outlook Calendar</li>
                                      <li>Altri servizi di calendario</li>
                                      <li>Sistemi di gestione proprietà</li>
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {data.platforms.length > 0 && (
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="font-semibold mb-3">Piattaforme selezionate</h3>
                        <div className="space-y-2">
                          {data.platforms.map((platformId) => {
                            const platform = PLATFORMS.find(p => p.id === platformId);
                            return platform ? (
                              <div key={platformId} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                                <div className={`w-6 h-6 ${platform.color} rounded flex items-center justify-center text-white text-xs font-bold`}>
                                  {platform.name.charAt(0)}
                                </div>
                                <span className="text-sm">{platform.name}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">Dove si trova la tua proprietà?</h1>
                <p className="text-muted-foreground">Inserisci l'indirizzo completo della proprietà per configurare i servizi di pulizia e i pagamenti.</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Address Form */}
                <div className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-4">Informazioni sulla posizione</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="address">Indirizzo completo</Label>
                          <Input
                            id="address"
                            value={data.address}
                            onChange={(e) => setData({...data, address: e.target.value})}
                            placeholder="Via Roma 123"
                            className="mt-1"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="city">Città</Label>
                            <Input
                              id="city"
                              value={data.city}
                              onChange={(e) => setData({...data, city: e.target.value})}
                              placeholder="Milano"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="country">Paese</Label>
                            <Input
                              id="country"
                              value={data.country}
                              onChange={(e) => setData({...data, country: e.target.value})}
                              placeholder="Italia"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Explanatory Information Cards */}
                  <div className="space-y-4">
                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-blue-900 mb-1">Servizi di pulizia</h4>
                            <p className="text-sm text-blue-800">
                              Utilizziamo l'indirizzo della proprietà per far sapere agli addetti alle pulizie dove devono andare e per programmare i progetti al momento giusto in base al fuso orario della proprietà.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-green-200 bg-green-50">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <Euro className="w-5 h-5 text-green-600 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-green-900 mb-1">Pagamenti personalizzati</h4>
                            <p className="text-sm text-green-800">
                              Se paghi i tuoi addetti alle pulizie tramite la nostra piattaforma, invieremo i pagamenti nella valuta che scegli per ogni proprietà.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-purple-200 bg-purple-50">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-5 h-5 bg-purple-600 rounded mt-0.5"></div>
                          <div>
                            <h4 className="font-semibold text-purple-900 mb-1">Identificazione rapida</h4>
                            <p className="text-sm text-purple-800">
                              Per identificare rapidamente ogni proprietà, si utilizza un colore specifico per ciascuna di esse nel calendario e negli elenchi dei progetti.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-orange-200 bg-orange-50">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <Users className="w-5 h-5 text-orange-600 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-orange-900 mb-1">Gruppi di proprietà</h4>
                            <p className="text-sm text-orange-800">
                              I gruppi di proprietà sono utili per visualizzare insieme le proprietà collegate, ad esempio in base alla zona.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Right Column - Interactive Map */}
                <div className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-4">Posizione sulla mappa</h3>
                      <div className="bg-gray-100 rounded-lg h-80 flex items-center justify-center relative overflow-hidden">
                        {data.address || data.city ? (
                          <iframe
                            src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dOWTgHz-y-2b8s&q=${encodeURIComponent(`${data.address} ${data.city} ${data.country}`)}`}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            className="rounded-lg"
                          />
                        ) : (
                          <div className="text-center text-gray-500">
                            <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm">La mappa apparirà qui quando inserisci l'indirizzo</p>
                          </div>
                        )}
                      </div>
                      {data.address && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">
                            <MapPin className="w-4 h-4 inline mr-1" />
                            {data.address}, {data.city}, {data.country}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-indigo-200 bg-indigo-50">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-indigo-900 mb-2">Perché abbiamo bisogno di queste informazioni?</h4>
                      <ul className="text-sm text-indigo-800 space-y-1">
                        <li>• Coordinamento efficace del personale di pulizia</li>
                        <li>• Gestione automatica dei fusi orari</li>
                        <li>• Pagamenti nella valuta locale appropriata</li>
                        <li>• Organizzazione geografica delle proprietà</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {currentStep === 3 && (
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-4">Condividi alcune informazioni di base</h1>
                <p className="text-muted-foreground">Descrivi il tuo spazio per gli ospiti.</p>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <Label>Ospiti</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setData({...data, max_guests: Math.max(1, data.max_guests - 1)})}
                        disabled={data.max_guests <= 1}
                      >
                        -
                      </Button>
                      <span className="w-12 text-center">{data.max_guests}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setData({...data, max_guests: data.max_guests + 1})}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Camere da letto</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setData({...data, bedrooms: Math.max(1, data.bedrooms - 1)})}
                        disabled={data.bedrooms <= 1}
                      >
                        -
                      </Button>
                      <span className="w-12 text-center">{data.bedrooms}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setData({...data, bedrooms: data.bedrooms + 1})}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Letti</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setData({...data, beds: Math.max(1, data.beds - 1)})}
                        disabled={data.beds <= 1}
                      >
                        -
                      </Button>
                      <span className="w-12 text-center">{data.beds}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setData({...data, beds: data.beds + 1})}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Bagni</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setData({...data, bathrooms: Math.max(1, data.bathrooms - 1)})}
                        disabled={data.bathrooms <= 1}
                      >
                        -
                      </Button>
                      <span className="w-12 text-center">{data.bathrooms}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setData({...data, bathrooms: data.bathrooms + 1})}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Servizi</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {Object.entries(AMENITIES).map(([key, amenity]) => {
                      const IconComponent = amenity.icon;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            const newAmenities = data.amenities.includes(key)
                              ? data.amenities.filter(a => a !== key)
                              : [...data.amenities, key];
                            setData({...data, amenities: newAmenities});
                          }}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            data.amenities.includes(key)
                              ? 'border-teal-500 bg-teal-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <IconComponent className="h-5 w-5" />
                            <span className="text-sm">{amenity.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Description */}
          {currentStep === 4 && (
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">Crea il tuo titolo</h1>
                <p className="text-muted-foreground">Descrivi brevemente il tuo spazio per attirare gli ospiti giusti.</p>
              </div>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="title">Titolo</Label>
                  <Input
                    id="title"
                    value={data.title}
                    onChange={(e) => setData({...data, title: e.target.value})}
                    placeholder="Appartamento moderno nel centro di Milano"
                    maxLength={50}
                  />
                  <p className="text-sm text-muted-foreground mt-1">{data.title.length}/50 caratteri</p>
                </div>
                <div>
                  <Label htmlFor="description">Descrizione</Label>
                  <Textarea
                    id="description"
                    value={data.description}
                    onChange={(e) => setData({...data, description: e.target.value})}
                    placeholder="Descrivi il tuo spazio, cosa lo rende speciale e cosa possono aspettarsi gli ospiti..."
                    rows={6}
                    maxLength={500}
                  />
                  <p className="text-sm text-muted-foreground mt-1">{data.description.length}/500 caratteri</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Pricing */}
          {currentStep === 5 && (
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">Imposta il tuo prezzo</h1>
                <p className="text-muted-foreground">Puoi sempre modificarlo in seguito.</p>
              </div>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="price">Prezzo per notte (€)</Label>
                  <div className="relative mt-2">
                    <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="price"
                      type="number"
                      value={data.price_per_night}
                      onChange={(e) => setData({...data, price_per_night: parseInt(e.target.value) || 0})}
                      className="pl-10"
                      min="1"
                    />
                  </div>
                </div>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Anteprima guadagni</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>€{data.price_per_night} x 1 notte</span>
                        <span>€{data.price_per_night}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Commissione servizio (3%)</span>
                        <span>-€{Math.round(data.price_per_night * 0.03)}</span>
                      </div>
                      <hr />
                      <div className="flex justify-between font-semibold">
                        <span>Guadagno netto</span>
                        <span>€{data.price_per_night - Math.round(data.price_per_night * 0.03)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-8 py-6">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Indietro
            </Button>
            {currentStep === totalSteps ? (
              <Button onClick={handleSave} className="flex items-center">
                Salva Proprietà
              </Button>
            ) : (
              <Button 
                onClick={() => {
                  if (currentStep === 1) {
                    // Validate Step 1 before proceeding
                    if (!selectedPlatform || !isIcalValid) {
                      alert('Seleziona una piattaforma e inserisci un URL iCal valido per continuare');
                      return;
                    }
                    // Save the data
                    setData(prev => ({
                      ...prev,
                      platforms: [selectedPlatform],
                      ical_url: icalUrl
                    }));
                  }
                  handleNext();
                }}
                disabled={currentStep === 1 && (!selectedPlatform || !isIcalValid)}
                className="flex items-center"
              >
                Avanti
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Auto-save indicator */}
      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Salvataggio in corso...
          </div>
        </div>
      )}
      </div>
    </div>
  );
}