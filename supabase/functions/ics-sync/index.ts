import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { parseICS, parseDuration } from "./ics-parser.ts";

const supabase = createClient(
  Deno.env.get("SB_URL")!,
  Deno.env.get("SB_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ical_url_id, account_id } = await req.json();
    
    console.log(`[iCal Sync] Starting sync for ical_url_id: ${ical_url_id}, account_id: ${account_id}`);
    
    let icalUrl;
    
    // Get iCal URL data
    if (ical_url_id) {
      const { data, error } = await supabase
        .from('ical_urls')
        .select(`
          *,
          ical_configs!inner (
            property_id,
            properties!inner (
              id,
              nome,
              host_id
            )
          )
        `)
        .eq('id', ical_url_id)
        .single();
        
      if (error || !data) {
        console.error('[iCal Sync] iCal URL not found:', error);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'iCal URL not found',
          debug: { ical_url_id, error: error?.message }
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      icalUrl = data;
    } else if (account_id) {
      // Legacy support for channel_accounts
      const { data, error } = await supabase
        .from('channel_accounts')
        .select('*')
        .eq('id', account_id)
        .single();
        
      if (error || !data || !data.ics_pull_url) {
        console.error('[iCal Sync] Channel account not found or no iCal URL configured:', error);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Account not found or no iCal URL configured',
          debug: { account_id, error: error?.message }
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Convert to ical_urls format for compatibility
      icalUrl = {
        id: data.id,
        url: data.ics_pull_url,
        source: 'channel_manager',
        ical_configs: {
          property_id: data.property_id,
          properties: { id: data.property_id, host_id: data.host_id }
        }
      };
    } else {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing ical_url_id or account_id parameter',
        debug: { received_params: { ical_url_id, account_id } }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[iCal Sync] Fetching iCal data from: ${icalUrl.url}`);
    
    // Update sync status to 'running'
    if (ical_url_id) {
      await supabase
        .from('ical_urls')
        .update({ 
          last_sync_at: new Date().toISOString(),
          last_sync_status: 'running' 
        })
        .eq('id', ical_url_id);
    } else if (account_id) {
      await supabase
        .from('channel_accounts')
        .update({ 
          last_sync_at: new Date().toISOString(),
          last_sync_status: 'running' 
        })
        .eq('id', account_id);
    }

    try {
      // Fetch iCal data with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const icsResponse = await fetch(icalUrl.url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'HostSuite-Calendar-Sync/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!icsResponse.ok) {
        throw new Error(`Failed to fetch iCal: ${icsResponse.status} ${icsResponse.statusText}`);
      }

      const icsData = await icsResponse.text();
      console.log(`[iCal Sync] Fetched iCal data, length: ${icsData.length} chars`);
      
      if (!icsData || icsData.length < 50) {
        throw new Error('Invalid or empty iCal data received');
      }

      // Parse iCal data using the robust parser
      const events = parseICS(icsData);
      console.log(`[iCal Sync] Parsed ${events.length} events from iCal`);
      
      if (events.length === 0) {
        console.log('[iCal Sync] No events found in iCal data - this is normal for empty calendars');
        
        // Still update sync status to success even with no events
        const syncUpdate = {
          last_sync_status: 'success',
          last_sync_at: new Date().toISOString()
        };
        
        if (ical_url_id) {
          await supabase
            .from('ical_urls')
            .update(syncUpdate)
            .eq('id', ical_url_id);
        } else if (account_id) {
          await supabase
            .from('channel_accounts')
            .update(syncUpdate)
            .eq('id', account_id);
        }

        return new Response(JSON.stringify({ 
          success: true, 
          processed: 0,
          created: 0,
          updated: 0,
          message: 'Sync completato: calendario vuoto (normale per nuove configurazioni)' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const propertyId = icalUrl.ical_configs?.property_id;
      const hostId = icalUrl.ical_configs?.properties?.host_id;
      if (!propertyId || !hostId) {
        throw new Error('Property ID or Host ID not found for iCal configuration');
      }

      // Get existing blocks from this source to detect duplicates and updates
      const { data: existingBlocks } = await supabase
        .from('calendar_blocks')
        .select('id, start_date, end_date, source, external_id, reason, is_active')
        .eq('property_id', propertyId)
        .eq('source', `ical_${icalUrl.source}`);

      let createdCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      const skipReasons: Record<string, number> = {};
      const sampleEvents = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      
      // Helper function for robust upsert with fallback
      const doSafeUpsert = async (blockData: any) => {
        try {
          // Attempt standard upsert
          const { error: upsertError } = await supabase
            .from('calendar_blocks')
            .upsert(blockData, {
              onConflict: 'property_id,source,external_id',
              ignoreDuplicates: false
            });

          if (!upsertError) {
            return { success: true, method: 'upsert' };
          }

          // If 42P10 (no matching constraint) or 23505 (unique violation), try fallback
          if (upsertError.code === '42P10' || upsertError.code === '23505') {
            console.log(`[iCal Sync] Upsert failed with ${upsertError.code}, trying fallback for external_id: ${blockData.external_id}`);
            
            // Check if record exists
            const { data: existing } = await supabase
              .from('calendar_blocks')
              .select('id')
              .eq('property_id', blockData.property_id)
              .eq('source', blockData.source)
              .eq('external_id', blockData.external_id)
              .maybeSingle();

            if (existing) {
              // UPDATE existing record
              const { error: updateError } = await supabase
                .from('calendar_blocks')
                .update({
                  start_date: blockData.start_date,
                  end_date: blockData.end_date,
                  reason: blockData.reason,
                  is_active: blockData.is_active
                })
                .eq('id', existing.id);

              if (updateError) {
                console.error('[iCal Sync] Fallback UPDATE failed:', updateError);
                return { success: false, error: updateError, method: 'fallback_update' };
              }
              return { success: true, method: 'fallback_update', existed: true };
            } else {
              // INSERT new record
              const { error: insertError } = await supabase
                .from('calendar_blocks')
                .insert(blockData);

              if (insertError) {
                console.error('[iCal Sync] Fallback INSERT failed:', insertError);
                return { success: false, error: insertError, method: 'fallback_insert' };
              }
              return { success: true, method: 'fallback_insert', existed: false };
            }
          }

          // Other errors
          console.error('[iCal Sync] Upsert error:', upsertError);
          return { success: false, error: upsertError, method: 'upsert' };

        } catch (err) {
          console.error('[iCal Sync] doSafeUpsert exception:', err);
          return { success: false, error: err, method: 'exception' };
        }
      };
      
      // Process events with robust deduplication via upsert
      for (const event of events) {
        // Log first 3 events for debugging
        if (sampleEvents.length < 3) {
          sampleEvents.push({
            startDate: event.start,
            endDate: event.end,
            duration: event.duration,
            summary: event.summary,
            status: event.status,
            uid: event.uid
          });
        }

        // Must have start date
        if (!event.start) {
          skippedCount++;
          skipReasons['missing_start_date'] = (skipReasons['missing_start_date'] || 0) + 1;
          continue;
        }

        // Convert iCal date format to ISO date
        const startDate = event.start.includes('T') ? event.start.split('T')[0] : event.start;
        
        // Calculate end date: use DTEND if available, else calculate from DURATION, else default +1 day
        let endDate: string;
        if (event.end) {
          endDate = event.end.includes('T') ? event.end.split('T')[0] : event.end;
        } else if (event.duration) {
          // Calculate end from start + duration
          const durationDays = parseDuration(event.duration);
          const startDateObj = new Date(startDate);
          startDateObj.setDate(startDateObj.getDate() + durationDays);
          endDate = startDateObj.toISOString().split('T')[0];
        } else {
          // Default: end = start + 1 day
          const startDateObj = new Date(startDate);
          startDateObj.setDate(startDateObj.getDate() + 1);
          endDate = startDateObj.toISOString().split('T')[0];
        }
        
        // Skip if dates are invalid format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
          skippedCount++;
          skipReasons['invalid_date_format'] = (skipReasons['invalid_date_format'] || 0) + 1;
          continue;
        }

        // Skip if end < start (data inconsistency)
        if (endDate < startDate) {
          skippedCount++;
          skipReasons['end_before_start'] = (skipReasons['end_before_start'] || 0) + 1;
          continue;
        }

        // FILTER: Import only future/active events (end_date >= today)
        const endDateObj = new Date(endDate);
        if (endDateObj < today) {
          skippedCount++;
          skipReasons['past_event'] = (skipReasons['past_event'] || 0) + 1;
          continue;
        }

        // Generate external_id: use event.uid if available, otherwise create hash
        let externalId = event.uid;
        if (!externalId) {
          const hashInput = `${startDate}_${endDate}_${event.summary || 'block'}`;
          externalId = `hash_${hashInput.replace(/[^a-zA-Z0-9]/g, '_')}`;
        }

        // Check if existed before upsert to count properly
        const existed = existingBlocks?.some(
          (block: any) => block.external_id === externalId
        );
        
        // Map STATUS:CANCELLED to is_active = false
        const isActive = event.status?.toUpperCase() !== 'CANCELLED';
        
        // Normalize source to lowercase for consistency
        const normalizedSource = `ical_${icalUrl.source}`.toLowerCase().trim();
        
        const blockData = {
          property_id: propertyId,
          host_id: hostId,
          start_date: startDate,
          end_date: endDate,
          reason: event.summary || 'Imported booking',
          source: normalizedSource,
          external_id: externalId.trim(),
          is_active: isActive,
          created_by: null
        };

        // Use safe upsert with fallback mechanism
        const result = await doSafeUpsert(blockData);

        if (!result.success) {
          skippedCount++;
          const errorCode = result.error?.code || 'unknown';
          skipReasons[`upsert_${errorCode}`] = (skipReasons[`upsert_${errorCode}`] || 0) + 1;
        } else {
          // Track which method worked
          if (result.method.includes('fallback')) {
            skipReasons[`${result.method}_used`] = (skipReasons[`${result.method}_used`] || 0) + 1;
          }
          
          if (result.existed || existed) {
            updatedCount++;
          } else {
            createdCount++;
          }
        }
      }

      console.log('[iCal Sync] Sample events processed:', JSON.stringify(sampleEvents, null, 2));
      console.log('[iCal Sync] Skip reasons breakdown:', JSON.stringify(skipReasons, null, 2));

      // Update sync status to 'success'
      const syncUpdate = {
        last_sync_status: 'success',
        last_sync_at: new Date().toISOString()
      };
      
      if (ical_url_id) {
        await supabase
          .from('ical_urls')
          .update(syncUpdate)
          .eq('id', ical_url_id);
      } else if (account_id) {
        await supabase
          .from('channel_accounts')
          .update(syncUpdate)
          .eq('id', account_id);
      }

      console.log(`[iCal Sync] Sync completed: total parsed ${events.length}, created ${createdCount}, updated ${updatedCount}, skipped ${skippedCount}`);
      
      return new Response(JSON.stringify({ 
        success: true, 
        processed: events.length,
        created: createdCount,
        updated: updatedCount,
        skipped: skippedCount,
        skipReasons,
        message: `Sync completato: ${createdCount} nuovi eventi, ${updatedCount} aggiornati${skippedCount > 0 ? `, ${skippedCount} saltati (${skipReasons.past_event || 0} passati)` : ''}` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (syncError) {
      console.error('[iCal Sync] Sync error:', syncError);
      
      // Update sync status to 'error'
      const errorMessage = syncError instanceof Error ? syncError.message : String(syncError);
      const errorUpdate = {
        last_sync_status: `error: ${errorMessage}`,
        last_sync_at: new Date().toISOString()
      };
      
      if (ical_url_id) {
        await supabase
          .from('ical_urls')
          .update(errorUpdate)
          .eq('id', ical_url_id);
      } else if (account_id) {
        await supabase
          .from('channel_accounts')
          .update(errorUpdate)
          .eq('id', account_id);
      }

      return new Response(JSON.stringify({ 
        success: false, 
        error: errorMessage,
        message: `Errore di sincronizzazione: ${errorMessage}`,
        debug: { 
          url: icalUrl.url,
          error_type: syncError.constructor.name,
          stack: syncError instanceof Error ? syncError.stack : undefined
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('[iCal Sync] Function error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error),
      message: 'Errore interno del server',
      debug: {
        error_type: error instanceof Error ? error.constructor.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});