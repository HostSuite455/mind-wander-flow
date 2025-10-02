import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting automatic iCal sync...');

    // Fetch all active iCal URLs
    const { data: icalUrls, error: fetchError } = await supabase
      .from('ical_urls')
      .select('id, ical_config_id, ota_name, is_active')
      .eq('is_active', true);

    if (fetchError) {
      console.error('❌ Error fetching iCal URLs:', fetchError);
      throw fetchError;
    }

    if (!icalUrls || icalUrls.length === 0) {
      console.log('ℹ️ No active iCal URLs found');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No active iCal URLs to sync',
          synced: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Found ${icalUrls.length} active iCal URLs to sync`);

    // Sync each URL by invoking ics-sync function
    const syncResults = [];
    let successCount = 0;
    let failureCount = 0;

    for (const url of icalUrls) {
      try {
        console.log(`🔄 Syncing: ${url.ota_name} (ID: ${url.id})`);

        const { data: syncResult, error: syncError } = await supabase.functions.invoke('ics-sync', {
          body: { ical_url_id: url.id },
        });

        if (syncError) {
          console.error(`❌ Sync failed for ${url.ota_name}:`, syncError);
          failureCount++;
          syncResults.push({
            id: url.id,
            name: url.ota_name,
            success: false,
            error: syncError.message,
          });
        } else {
          console.log(`✅ Sync successful for ${url.ota_name}`);
          successCount++;
          syncResults.push({
            id: url.id,
            name: url.ota_name,
            success: true,
            data: syncResult,
          });
        }
      } catch (err) {
        console.error(`❌ Exception syncing ${url.ota_name}:`, err);
        failureCount++;
        syncResults.push({
          id: url.id,
          name: url.ota_name,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    console.log(`✅ Sync completed: ${successCount} successful, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${icalUrls.length} iCal URLs`,
        successCount,
        failureCount,
        results: syncResults,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Auto-sync error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
