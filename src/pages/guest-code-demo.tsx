import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supaSelect, pickName } from '@/lib/supaSafe';
import { Calendar, Clock, Copy, LogOut, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

const GuestCodeDemo = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [validityDays, setValidityDays] = useState<number>(3);
  const [isLoading, setIsLoading] = useState(true);
  const [existingSession, setExistingSession] = useState<GuestSession | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    checkExistingSession();
  }, []);

  const loadData = async () => {
    try {
      const { data: props } = await supaSelect<Property>('properties', 'id, nome');
      setProperties(props);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkExistingSession = () => {
    try {
      const sessionData = localStorage.getItem('guest_session');
      if (sessionData) {
        const session: GuestSession = JSON.parse(sessionData);
        const expiresAt = new Date(session.expires_at);
        const now = new Date();
        
        if (now < expiresAt) {
          setExistingSession(session);
        } else {
          localStorage.removeItem('guest_session');
        }
      }
    } catch (error) {
      localStorage.removeItem('guest_session');
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'HS-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const createDemoSession = () => {
    if (!selectedPropertyId) {
      toast({
        title: "Errore",
        description: "Seleziona una proprietà",
        variant: "destructive"
      });
      return;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);
    
    const session: GuestSession = {
      code: generateCode(),
      property_id: selectedPropertyId,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString()
    };

    localStorage.setItem('guest_session', JSON.stringify(session));
    setExistingSession(session);

    toast({
      title: "Codice creato!",
      description: `Codice demo: ${session.code}`,
    });
  };

  const terminateSession = () => {
    localStorage.removeItem('guest_session');
    setExistingSession(null);
    toast({
      title: "Sessione terminata",
      description: "Codice demo rimosso",
    });
  };

  const copyCode = async () => {
    if (existingSession) {
      try {
        await navigator.clipboard.writeText(existingSession.code);
        toast({
          title: "Copiato!",
          description: "Codice copiato negli appunti",
        });
      } catch (error) {
        console.error('Copy failed:', error);
      }
    }
  };

  const getRemainingDays = () => {
    if (!existingSession) return 0;
    const now = new Date();
    const expires = new Date(existingSession.expires_at);
    const diffTime = expires.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getPropertyName = () => {
    if (!existingSession) return '';
    const property = properties.find(p => p.id === existingSession.property_id);
    return property ? pickName(property) : 'Proprietà non trovata';
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Demo Codice Ospite</h1>
          <p className="text-muted-foreground mt-2">
            Genera un codice ospite fittizio per testare la dashboard senza prenotazione reale
          </p>
        </div>

        {existingSession ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Sessione Demo Attiva
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Codice</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="px-3 py-2 bg-muted rounded font-mono text-sm">
                      {existingSession.code}
                    </code>
                    <Button size="sm" variant="outline" onClick={copyCode}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Giorni rimanenti</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{getRemainingDays()}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Proprietà</Label>
                <p className="mt-1 font-medium">{getPropertyName()}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button onClick={() => navigate('/guest-dashboard')} className="flex-1">
                  <Play className="w-4 h-4 mr-2" />
                  Vai alla Dashboard Ospite
                </Button>
                <Button variant="outline" onClick={terminateSession} className="flex-1">
                  <LogOut className="w-4 h-4 mr-2" />
                  Termina Sessione
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Genera Nuovo Codice Demo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="property-select">Proprietà</Label>
                <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona proprietà" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {pickName(property)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="validity-days">Giorni di validità</Label>
                <Input
                  id="validity-days"
                  type="number"
                  min="1"
                  max="30"
                  value={validityDays}
                  onChange={(e) => setValidityDays(parseInt(e.target.value) || 3)}
                  placeholder="3"
                />
              </div>

              <Button 
                onClick={createDemoSession} 
                disabled={!selectedPropertyId}
                className="w-full"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Genera Codice Demo
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                  Solo per Test e Demo
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Questo codice è puramente fittizio e salvato nel browser. Non influisce sui dati reali 
                  del sistema o sulle prenotazioni esistenti.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GuestCodeDemo;