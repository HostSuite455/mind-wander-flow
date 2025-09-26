import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix per le icone di Leaflet in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapProps {
  address: string;
  city: string;
  country: string;
  onLocationFound?: (lat: number, lng: number) => void;
}

interface GeocodeResult {
  lat: string;
  lon: string;
  display_name: string;
}

export const AddressMap: React.FC<MapProps> = ({ address, city, country, onLocationFound }) => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const geocodeAddress = async (fullAddress: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Usa Nominatim (OpenStreetMap) per la geocodifica gratuita
      const encodedAddress = encodeURIComponent(fullAddress);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`
      );
      
      if (!response.ok) {
        throw new Error('Errore nella ricerca dell\'indirizzo');
      }
      
      const data: GeocodeResult[] = await response.json();
      
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setPosition([lat, lng]);
        onLocationFound?.(lat, lng);
      } else {
        setError('Indirizzo non trovato. Verifica che sia corretto.');
      }
    } catch (err) {
      setError('Errore durante la ricerca dell\'indirizzo');
      console.error('Geocoding error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (address && city && country) {
      const fullAddress = `${address}, ${city}, ${country}`;
      geocodeAddress(fullAddress);
    }
  }, [address, city, country]);

  if (loading) {
    return (
      <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Caricamento mappa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center p-4">
          <p className="text-sm text-destructive mb-2">{error}</p>
          <p className="text-xs text-muted-foreground">
            Verifica che l'indirizzo sia completo e corretto
          </p>
        </div>
      </div>
    );
  }

  if (!position) {
    return (
      <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Inserisci un indirizzo completo per visualizzare la mappa
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-64 rounded-lg overflow-hidden border">
      <MapContainer
        center={position}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>
            <div className="text-sm">
              <strong>Posizione della proprietà</strong>
              <br />
              {address}, {city}, {country}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};