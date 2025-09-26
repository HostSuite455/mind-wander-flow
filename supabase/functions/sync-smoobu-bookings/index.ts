import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const smoobuApiKey = Deno.env.get('SMOOBU_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface SmoobuBooking {
  id: number;
  apartment: {
    id: number;
    name: string;
  };
  arrival: string;
  departure: string;
  adults: number;
  children: number;
  channel: {
    id: number;
    name: string;
  };
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  price: number;
  currency: string;
  status: string;
  reference: string;
  notice: string;
  created_at: string;
  updated_at: string;
}

async function fetchSmoobuBookings(propertyId?: string): Promise<SmoobuBooking[]> {
  try {
    let url = 'https://login.smoobu.com/api/reservations';
    if (propertyId) {
      url += `?apartment[]=${propertyId}`;
    }

    console.log(`Fetching bookings from Smoobu: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Api-Key': smoobuApiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Smoobu API error: ${response.status} - ${errorText}`);
      throw new Error(`Smoobu API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Fetched ${data.data?.length || 0} bookings from Smoobu`);
    
    return data.data || [];
  } catch (error) {
    console.error('Error fetching Smoobu bookings:', error);
    throw error;
  }
}

async function syncBookingToSupabase(booking: SmoobuBooking, hostId: string) {
  try {
    // Find the property in our database based on Smoobu apartment ID or name
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id')
      .eq('host_id', hostId)
      .ilike('nome', `%${booking.apartment.name}%`)
      .single();

    if (propertyError || !property) {
      console.warn(`Property not found for Smoobu apartment: ${booking.apartment.name}`);
      return;
    }

    const bookingData = {
      property_id: property.id,
      host_id: hostId,
      external_booking_id: booking.id.toString(),
      guest_name: booking.guestName || null,
      guest_email: booking.guestEmail || null,
      guest_phone: booking.guestPhone || null,
      check_in: booking.arrival,
      check_out: booking.departure,
      guests_count: booking.adults + booking.children,
      adults_count: booking.adults,
      children_count: booking.children,
      channel: booking.channel?.name || 'Unknown',
      booking_status: booking.status || 'confirmed',
      total_price: booking.price || null,
      currency: booking.currency || 'EUR',
      booking_reference: booking.reference || null,
      special_requests: booking.notice || null,
      last_sync_at: new Date().toISOString(),
    };

    // Upsert booking (insert or update if exists)
    const { error: upsertError } = await supabase
      .from('bookings')
      .upsert(bookingData, {
        onConflict: 'external_booking_id,property_id',
      });

    if (upsertError) {
      console.error('Error upserting booking:', upsertError);
    } else {
      console.log(`Synced booking ${booking.id} to database`);
    }
  } catch (error) {
    console.error('Error syncing booking to Supabase:', error);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { propertyId } = await req.json().catch(() => ({}));

    // Get user from JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Starting Smoobu sync for user: ${user.id}`);

    // Fetch bookings from Smoobu
    const smoobuBookings = await fetchSmoobuBookings(propertyId);

    // Sync each booking to our database
    let syncedCount = 0;
    for (const booking of smoobuBookings) {
      await syncBookingToSupabase(booking, user.id);
      syncedCount++;
    }

    console.log(`Sync completed: ${syncedCount} bookings processed`);

    return new Response(JSON.stringify({ 
      success: true, 
      syncedCount,
      message: `Successfully synced ${syncedCount} bookings from Smoobu`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in sync-smoobu-bookings function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error) 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});