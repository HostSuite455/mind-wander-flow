import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationData {
  lat: number;
  lng: number;
  display_name?: string;
}

interface PropertyLocationMapProps {
  city: string;
  country: string;
  address: string;
  onLocationFound?: (location: LocationData) => void;
}

// Free geocoding using Nominatim API (OpenStreetMap)
const geocodeAddress = async (city: string, country: string, address: string): Promise<LocationData | null> => {
  try {
    const query = `${address}, ${city}, ${country}`.trim();
    if (!query || query === ', , ') return null;
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`
    );
    
    if (!response.ok) return null;
    
    const results = await response.json();
    if (results && results.length > 0) {
      const result = results[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        display_name: result.display_name
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

const PropertyLocationMap: React.FC<PropertyLocationMapProps> = ({ 
  city, 
  country, 
  address, 
  onLocationFound 
}) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Only geocode if we have at least city and address
    if (!city.trim() || !address.trim()) {
      setLocation(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Debounce the geocoding request by 1 second
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await geocodeAddress(city, country, address);
        if (result) {
          setLocation(result);
          onLocationFound?.(result);
          setError(null);
        } else {
          setError('Indirizzo non trovato. Verifica che sia corretto.');
          setLocation(null);
        }
      } catch (err) {
        setError('Errore durante la ricerca dell\'indirizzo.');
        setLocation(null);
      } finally {
        setIsLoading(false);
      }
    }, 1000);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [city, country, address, onLocationFound]);

  // Default to Rome if no location found
  const defaultCenter: [number, number] = [41.9028, 12.4964];
  const mapCenter: [number, number] = location ? [location.lat, location.lng] : defaultCenter;

  if (!city.trim() || !address.trim()) {
    return (
      <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Inserisci città e indirizzo per visualizzare la mappa</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="h-64 rounded-lg overflow-hidden border border-gray-200">
        <MapContainer
          center={mapCenter}
          zoom={location ? 15 : 6}
          style={{ height: '100%', width: '100%' }}
          key={`${location?.lat}-${location?.lng}`} // Force re-render when location changes
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {location && (
            <Marker position={[location.lat, location.lng]}>
              <Popup>
                <div className="text-sm">
                  <p className="font-medium">{address}</p>
                  <p className="text-gray-600">{city}, {country}</p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
      
      {isLoading && (
        <div className="flex items-center justify-center text-sm text-gray-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
          Ricerca della posizione in corso...
        </div>
      )}
      
      {error && (
        <div className="text-sm text-red-600 text-center">
          {error}
        </div>
      )}
      
      {location && !isLoading && (
        <div className="text-sm text-green-600 text-center">
          ✓ Posizione trovata: {location.display_name}
        </div>
      )}
    </div>
  );
};

export default PropertyLocationMap;