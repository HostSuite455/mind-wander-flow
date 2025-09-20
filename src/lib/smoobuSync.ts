import { supabase } from "@/integrations/supabase/client";

export interface SyncResult {
  success: boolean;
  syncedCount?: number;
  message: string;
  error?: string;
}

export async function syncSmoobuBookings(propertyId?: string): Promise<SyncResult> {
  try {
    const { data, error } = await supabase.functions.invoke('sync-smoobu-bookings', {
      body: { propertyId }
    });

    if (error) {
      console.error('Error calling sync function:', error);
      return {
        success: false,
        message: 'Errore durante la sincronizzazione con Smoobu',
        error: error.message
      };
    }

    return data;
  } catch (error) {
    console.error('Error syncing Smoobu bookings:', error);
    return {
      success: false,
      message: 'Errore di connessione durante la sincronizzazione',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getBookingsFromDatabase(propertyId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('property_id', propertyId)
    .order('check_in', { ascending: true });
  
  if (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
  
  return data || [];
}