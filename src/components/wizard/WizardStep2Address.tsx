import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, ChevronLeft, Upload, MapPin, AlertCircle } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface Props {
  onNext: (data: {
    address: string;
    city: string;
    country: string;
    unitNumber: string;
    lat: number;
    lng: number;
    propertyName: string;
    imageUrl?: string;
    currency: string;
  }) => void;
  onBack: () => void;
  initialData?: Partial<{
    address: string;
    city: string;
    country: string;
    unitNumber: string;
    propertyName: string;
    currency: string;
  }>;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

const CURRENCIES = [
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
];

export default function WizardStep2Address({ onNext, onBack, initialData }: Props) {
  const [address, setAddress] = useState(initialData?.address || "");
  const [city, setCity] = useState(initialData?.city || "");
  const [country, setCountry] = useState(initialData?.country || "Italia");
  const [unitNumber, setUnitNumber] = useState(initialData?.unitNumber || "");
  const [propertyName, setPropertyName] = useState(initialData?.propertyName || "");
  const [currency, setCurrency] = useState(initialData?.currency || "EUR");
  const [cannotFindAddress, setCannotFindAddress] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([43.7696, 11.2558]); // Florence default
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Real geocoding with Nominatim API
  useEffect(() => {
    if (!address || !city || cannotFindAddress) return;

    const timeoutId = setTimeout(async () => {
      try {
        const query = `${address}, ${city}, ${country}`;
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          setMapCenter([lat, lng]);
        }
      } catch (error) {
        console.error("Geocoding error:", error);
      }
    }, 800); // Debounce geocoding requests

    return () => clearTimeout(timeoutId);
  }, [address, city, country, cannotFindAddress]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!address.trim() && !cannotFindAddress) {
      newErrors.address = "L'indirizzo è obbligatorio";
    }
    if (!city.trim()) {
      newErrors.city = "La città è obbligatoria";
    }
    if (!country.trim()) {
      newErrors.country = "Lo stato è obbligatorio";
    }
    if (!propertyName.trim()) {
      newErrors.propertyName = "Il nome della proprietà è obbligatorio";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateForm()) return;

    onNext({
      address,
      city,
      country,
      unitNumber,
      lat: mapCenter[0],
      lng: mapCenter[1],
      propertyName,
      imageUrl: imagePreview,
      currency,
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-foreground">Nome, indirizzo e dati</h2>
        <span className="text-sm text-muted-foreground">Passo 2 di 3</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column - Form Fields */}
        <div className="space-y-4">
          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">
              Indirizzo della proprietà <span className="text-destructive">*</span>
            </Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Via Roma, 123"
              disabled={cannotFindAddress}
              className={errors.address ? "border-destructive" : ""}
            />
            {errors.address && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.address}
              </p>
            )}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="cannotFind"
                checked={cannotFindAddress}
                onCheckedChange={(checked) => setCannotFindAddress(checked as boolean)}
              />
              <label htmlFor="cannotFind" className="text-sm text-muted-foreground cursor-pointer">
                Non posso trovare il mio indirizzo
              </label>
            </div>
          </div>

          {/* City & Country */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">
                Città <span className="text-destructive">*</span>
              </Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Milano"
                className={errors.city ? "border-destructive" : ""}
              />
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">
                Stato <span className="text-destructive">*</span>
              </Label>
              <Input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Italia"
                className={errors.country ? "border-destructive" : ""}
              />
            </div>
          </div>

          {/* Unit Number */}
          <div className="space-y-2">
            <Label htmlFor="unitNumber">N° dell'unità, nome dell'edificio</Label>
            <Input
              id="unitNumber"
              value={unitNumber}
              onChange={(e) => setUnitNumber(e.target.value)}
              placeholder="Appartamento 5, Scala B"
            />
          </div>

          {/* Property Name */}
          <div className="space-y-2">
            <Label htmlFor="propertyName">
              Alias (nome proprietà) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="propertyName"
              value={propertyName}
              onChange={(e) => setPropertyName(e.target.value)}
              placeholder="Villa al Mare"
              className={errors.propertyName ? "border-destructive" : ""}
            />
            {errors.propertyName && (
              <p className="text-sm text-destructive">{errors.propertyName}</p>
            )}
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label htmlFor="currency">Valuta</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((curr) => (
                  <SelectItem key={curr.code} value={curr.code}>
                    {curr.symbol} {curr.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Immagine della proprietà</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="imageUpload"
              />
              <label htmlFor="imageUpload" className="cursor-pointer">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded-lg"
                  />
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Trascina un'immagine o clicca per caricare
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Right Column - Map */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-5 h-5" />
            <span className="text-sm font-medium">Posizione sulla mappa</span>
          </div>
          <div className="h-96 rounded-lg overflow-hidden border border-border shadow-sm">
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
              className="z-0"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <Marker position={mapCenter} />
              <MapUpdater center={mapCenter} />
            </MapContainer>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onBack} size="lg">
          <ChevronLeft className="mr-2 w-5 h-5" />
          Indietro
        </Button>
        <Button onClick={handleNext} size="lg">
          Avanti
          <ChevronRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
