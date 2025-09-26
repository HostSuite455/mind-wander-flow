import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import CustomCalendar from '@/components/calendar/CustomCalendar';
import { useCalendarData } from '@/hooks/useCalendarData';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const CalendarProPage: React.FC = () => {
  // Stati per l'autenticazione stabilizzata
  const [authResolved, setAuthResolved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  
  // Usa dati reali dal feed iCal solo dopo auth
  const { properties, bookings, blocks, isLoading, error, refetch, rangeStart, rangeEnd } = useCalendarData(
    authResolved && userId ? userId : undefined
  );
  
  // useEffect unico per inizializzazione sessione e listener
  useEffect(() => {
    let unsub: { data: { subscription: { unsubscribe: () => void } } } | null = null;

    async function initAuth() {
      try {
        // 1) prova sessione attuale
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user?.id) {
          setUserId(sessionData.session.user.id);
        }
        
        // 2) ascolta variazioni auth (login/logout/refresh)
        unsub = supabase.auth.onAuthStateChange((_event, session) => {
          setUserId(session?.user?.id ?? null);
        });
        
        setAuthResolved(true);
      } catch (error) {
        console.error('Error initializing auth:', error);
        setAuthResolved(true); // Risolvi comunque per evitare loading infinito
      }
    }
    
    initAuth();

    return () => {
      if (unsub?.data?.subscription) {
        unsub.data.subscription.unsubscribe();
      }
    };
  }, []);

  // Fallback automatico per selectedPropertyId
  useEffect(() => {
    if (authResolved && userId && properties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [authResolved, userId, properties, selectedPropertyId]);
  
  // Debug logging migliorato
  useEffect(() => {
    if (authResolved) {
      console.log("CalendarPro Ready", { 
        authResolved, 
        userId, 
        propsCount: properties.length, 
        selectedPropertyId, 
        eventsCount: [...bookings, ...blocks].length 
      });
    }
  }, [authResolved, userId, properties.length, selectedPropertyId, bookings.length, blocks.length]);

  // Log per eventi
  useEffect(() => {
    console.log("CalendarPro → events", [...bookings, ...blocks].length, {rangeStart, rangeEnd});
  }, [bookings, blocks, rangeStart, rangeEnd]);

  // Contenitore del calendario con altezza fissa
  const calendarContainer = (
    <div className="h-[calc(100vh-220px)] min-h-[600px] w-full overflow-auto rounded-xl border bg-white">
      {!selectedPropertyId && properties.length > 0 ? (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <h3 className="text-xl font-medium text-gray-800 mb-2">Seleziona una proprietà</h3>
          <p className="text-gray-600 mb-4">Scegli una proprietà dal menu a tendina per visualizzare il calendario</p>
          <Button asChild>
            <Link to="/dashboard/properties">Gestisci proprietà</Link>
          </Button>
        </div>
      ) : properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <h3 className="text-xl font-medium text-gray-800 mb-2">Nessuna proprietà disponibile</h3>
          <p className="text-gray-600 mb-4">Aggiungi una proprietà per iniziare a utilizzare il calendario</p>
          <Button asChild>
            <Link to="/dashboard/properties/new">Aggiungi proprietà</Link>
          </Button>
        </div>
      ) : (
        <CustomCalendar
          properties={properties}
          bookings={bookings}
          blocks={blocks}
          onRefresh={refetch}
        />
      )}
    </div>
  );

  // Render-safety: mostra skeleton se auth non risolto
  if (!authResolved) {
    return (
      <DashboardLayout>
        <Card className="p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Caricamento autenticazione...</span>
          </div>
        </Card>
      </DashboardLayout>
    );
  }

  // Se auth risolto ma nessun userId, mostra messaggio
  if (!userId) {
    return (
      <DashboardLayout>
        <Card className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-yellow-800 font-medium mb-2">Accesso richiesto</h3>
            <p className="text-yellow-600">Effettua il login per accedere al calendario.</p>
          </div>
          {calendarContainer}
        </Card>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
          </div>
          <Card className="p-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Caricamento calendario...</span>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
          </div>
          <Card className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-red-800 font-medium mb-2">Errore nel caricamento</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={refetch} variant="destructive">
                Riprova
              </Button>
            </div>
            {calendarContainer}
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
          <div className="text-sm text-gray-500">
            {properties.length} proprietà • {bookings.length + blocks.length} eventi
          </div>
        </div>
        
        {[...bookings, ...blocks].length === 0 && selectedPropertyId && (
          <div className="mb-2 text-sm text-gray-600">
            Nessun evento nel periodo. Trascina col mouse per creare un blocco.
          </div>
        )}
        
        {calendarContainer}
      </div>
    </DashboardLayout>
  );
};

export default CalendarProPage;