import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { supaSelect, pickName } from '@/lib/supaSafe';
import { useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, Wifi, Home, Clock, Phone, Shield, Thermometer } from 'lucide-react';
import '../styles/print.css';

interface PropertyAiData {
  id: string;
  property_id: string;
  wifi_name?: string;
  wifi_password?: string;
  access_info?: string;
  heating_instructions?: string;
  smoking_rules?: string;
  extra_notes?: string;
}

interface Property {
  id: string;
  nome: string;
}

interface GuestSession {
  code: string;
  property_id: string;
  created_at: string;
  expires_at: string;
}

const WelcomeBooklet = () => {
  const [propertyData, setPropertyData] = useState<PropertyAiData | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [guestSession, setGuestSession] = useState<GuestSession | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkSessionAndLoadData();
  }, []);

  const checkSessionAndLoadData = async () => {
    try {
      const sessionData = localStorage.getItem('guest_session');
      if (!sessionData) {
        navigate('/guest');
        return;
      }

      const session: GuestSession = JSON.parse(sessionData);
      const expiresAt = new Date(session.expires_at);
      const now = new Date();

      if (now > expiresAt) {
        localStorage.removeItem('guest_session');
        navigate('/guest');
        return;
      }

      setGuestSession(session);
      await loadPropertyData(session.property_id);
    } catch (error) {
      console.error('Error loading session:', error);
      navigate('/guest');
    }
  };

  const loadPropertyData = async (propertyId: string) => {
    try {
      const [{ data: properties }, { data: aiData }] = await Promise.all([
        supaSelect<Property>('properties', 'id, nome'),
        supaSelect<PropertyAiData>('property_ai_data', '*')
      ]);

      const propertyInfo = properties.find(p => p.id === propertyId);
      const propertyAiInfo = aiData.find(p => p.property_id === propertyId);

      setProperty(propertyInfo || null);
      setPropertyData(propertyAiInfo || null);
    } catch (error) {
      console.error('Error loading property data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const extractCheckInOutTimes = (accessInfo?: string) => {
    if (!accessInfo) return { checkIn: '—', checkOut: '—' };
    
    const timeRegex = /(\d{1,2}):?(\d{2})/g;
    const matches = [...accessInfo.matchAll(timeRegex)];
    
    if (matches.length >= 2) {
      const checkIn = `${matches[0][1]}:${matches[0][2]}`;
      const checkOut = `${matches[1][1]}:${matches[1][2]}`;
      return { checkIn, checkOut };
    }
    
    return { checkIn: '—', checkOut: '—' };
  };

  const extractPhoneNumber = (text?: string) => {
    if (!text) return null;
    
    const phoneRegex = /(?:\+39\s?)?(?:3[0-9]{2}\s?\d{3}\s?\d{4}|\d{3}\s?\d{3}\s?\d{4})/;
    const match = text.match(phoneRegex);
    return match ? match[0] : null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  const { checkIn, checkOut } = extractCheckInOutTimes(propertyData?.access_info);
  const supportPhone = extractPhoneNumber(propertyData?.extra_notes);
  const propertyName = property ? pickName(property) : 'Proprietà ospite';

  return (
    <>
      {/* Screen-only controls */}
      <div className="print:hidden bg-background border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/guest-dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alla Dashboard
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Stampa / Salva PDF
          </Button>
        </div>
      </div>

      {/* Printable content */}
      <div className="welcome-booklet bg-background min-h-screen">
        {/* Header */}
        <div className="booklet-header border-b-2 border-primary pb-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-primary mb-2">
                Benvenuto
              </h1>
              <h2 className="text-2xl font-semibold text-foreground">
                {propertyName}
              </h2>
            </div>
            <div className="booklet-qr-placeholder">
              <div className="w-20 h-20 border-2 border-dashed border-muted-foreground rounded flex items-center justify-center text-xs text-muted-foreground text-center">
                QR<br/>Code
              </div>
            </div>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Codice ospite: <code className="font-mono bg-muted px-2 py-1 rounded">{guestSession?.code}</code>
          </div>
        </div>

        {/* WiFi Section */}
        <div className="booklet-section">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Wifi className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Connessione Wi-Fi</h3>
          </div>
          <div className="booklet-card">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Nome rete</p>
                <p className="font-mono text-lg">{propertyData?.wifi_name || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Password</p>
                <p className="font-mono text-lg">{propertyData?.wifi_password || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Check-in/out Section */}
        <div className="booklet-section">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Orari Check-in / Check-out</h3>
          </div>
          <div className="booklet-card">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Check-in dalle</p>
                <p className="text-2xl font-bold text-primary">{checkIn}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Check-out entro le</p>
                <p className="text-2xl font-bold text-primary">{checkOut}</p>
              </div>
            </div>
            {propertyData?.access_info && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Istruzioni di accesso</p>
                <p className="text-sm leading-relaxed">{propertyData.access_info}</p>
              </div>
            )}
          </div>
        </div>

        {/* House Rules */}
        {propertyData?.smoking_rules && (
          <div className="booklet-section">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Regole della Casa</h3>
            </div>
            <div className="booklet-card">
              <p className="text-sm leading-relaxed">{propertyData.smoking_rules}</p>
            </div>
          </div>
        )}

        {/* Heating */}
        {propertyData?.heating_instructions && (
          <div className="booklet-section">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Thermometer className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Riscaldamento</h3>
            </div>
            <div className="booklet-card">
              <p className="text-sm leading-relaxed">{propertyData.heating_instructions}</p>
            </div>
          </div>
        )}

        {/* Support */}
        <div className="booklet-section">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Assistenza</h3>
          </div>
          <div className="booklet-card">
            {supportPhone ? (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Numero di assistenza</p>
                <p className="text-lg font-semibold text-primary">{supportPhone}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Per assistenza, utilizza il sistema di messaggistica nella dashboard ospite.
              </p>
            )}
            
            {propertyData?.extra_notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Note aggiuntive</p>
                <p className="text-sm leading-relaxed">{propertyData.extra_notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="booklet-footer mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>Generato da HostSuite • Buon soggiorno!</p>
        </div>
      </div>
    </>
  );
};

export default WelcomeBooklet;