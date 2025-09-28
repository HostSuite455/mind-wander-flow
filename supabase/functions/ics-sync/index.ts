import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { parseICS } from "./ics-parser.ts";

const supabase = createClient(
  Deno.env.get("SB_URL")!,
  Deno.env.get("SB_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple iCal parser for VEVENT blocks
function parseICalData(icsData: string) {
  const events = [];
  const lines = icsData.split('\n').map(line => line.trim());
  
  let currentEvent: any = null;
  
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      currentEvent = {};
    } else if (line === 'END:VEVENT' && currentEvent) {
      if (currentEvent.dtstart && currentEvent.dtend) {
        events.push(currentEvent);
      }
      currentEvent = null;
    } else if (currentEvent && line.includes(':')) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':');
      
      switch (key.toUpperCase()) {
        case 'DTSTART':
        case 'DTSTART;VALUE=DATE':
          currentEvent.dtstart = parseICalDate(value);
          break;
        case 'DTEND':
        case 'DTEND;VALUE=DATE':
          currentEvent.dtend = parseICalDate(value);
          break;
        case 'SUMMARY':
          currentEvent.summary = value;
          break;
        case 'DESCRIPTION':
          currentEvent.description = value;
          break;
        case 'UID':
          currentEvent.uid = value;
          break;
      }
    }
  }
  
  return events;
}

// Parse iCal date format (YYYYMMDD or YYYYMMDDTHHMMSSZ)
function parseICalDate(dateStr: string): string {
  // Remove any timezone info and take first 8 characters for date
  const cleanDate = dateStr.replace(/[TZ]/g, '').substring(0, 8);
  
  if (cleanDate.length === 8) {
    const year = cleanDate.substring(0, 4);
    const month = cleanDate.substring(4, 6);
    const day = cleanDate.substring(6, 8);
    return `${year}-${month}-${day}`;
  }
  
  return new Date().toISOString().split('T')[0]; // fallback to today
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ical_url_id, account_id } = await req.json();
    
    console.log(`Sync request for ical_url_id: ${ical_url_id}, account_id: ${account_id}`);
    
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
        console.error('iCal URL not found:', error);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'iCal URL not found' 
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const icsData = await icsResponse.text();
      console.log(`Fetched ICS data, length: ${icsData.length} chars`);

      // Parse ICS data
      const events = parseICalData(icsData);
      console.log(`Parsed ${events.length} events from iCal data`);

      if (events.length > 0) {
        // Get property_id from account (assuming there's a property_id field)
        const propertyId = account.property_id;
        
        if (!propertyId) {
          throw new Error('No property_id associated with this account');
        }

        // Delete existing blocks from this source to avoid duplicates
        await supabase
          .from('calendar_blocks')
          .delete()
          .eq('property_id', propertyId)
          .eq('source', `ical_${accountId}`);

        // Create calendar blocks from parsed events
        const calendarBlocks = events.map(event => ({
          host_id: account.host_id,
          property_id: propertyId,
          start_date: event.dtstart,
          end_date: event.dtend,
          reason: event.summary || event.description || 'Blocked via iCal sync',
          source: `ical_${accountId}`,
          is_active: true,
          created_by: account.host_id
        }));

        // Insert new blocks
        const { data: insertedBlocks, error: insertError } = await supabase
          .from('calendar_blocks')
          .insert(calendarBlocks)
          .select();

        if (insertError) {
          throw new Error(`Failed to insert calendar blocks: ${insertError.message}`);
        }

        console.log(`Successfully created ${insertedBlocks?.length || 0} calendar blocks`);
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
        console.error('Channel account not found or no iCal URL configured:', error);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Account not found or no iCal URL configured' 
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
        error: 'Missing ical_url_id or account_id parameter' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Fetching iCal data from: ${icalUrl.url}`);
    
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
      console.log(`Fetched iCal data, length: ${icsData.length} chars`);
      
      if (!icsData || icsData.length < 50) {
        throw new Error('Invalid or empty iCal data received');
      }

      // Parse iCal data
      const events = parseICS(icsData);
      console.log(`Parsed ${events.length} events from iCal`);
      
      if (events.length === 0) {
        console.log('No events found in iCal data - this is normal for empty calendars');
        
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
      if (!propertyId) {
        throw new Error('Property ID not found for iCal configuration');
      }

      // Get existing blocks from this source to avoid duplicates
      const { data: existingBlocks } = await supabase
        .from('calendar_blocks')
        .select('id, start_date, end_date, source, external_id')
        .eq('property_id', propertyId)
        .eq('source', `ical_${icalUrl.source}`);

      const existingBlocksMap = new Map();
      existingBlocks?.forEach(block => {
        const key = `${block.start_date}_${block.end_date}_${block.external_id}`;
        existingBlocksMap.set(key, block);
      });

      let createdCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      
      // Process events and create/update calendar blocks
      for (const event of events) {
        if (!event.start || !event.end) {
          console.log('Skipping event without start/end date:', event.uid);
          skippedCount++;
          continue;
        }

        // Convert iCal date format to ISO date
        const startDate = event.start.includes('T') ? event.start.split('T')[0] : event.start;
        const endDate = event.end.includes('T') ? event.end.split('T')[0] : event.end;
        
        // Skip if dates are invalid
        if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
          console.log('Skipping event with invalid date format:', { startDate, endDate, uid: event.uid });
          skippedCount++;
          continue;
        }

        // Skip past events (older than 7 days)
        const startDateObj = new Date(startDate);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        if (startDateObj < sevenDaysAgo) {
          console.log('Skipping past event:', { startDate, uid: event.uid });
          skippedCount++;
          continue;
        }

        const blockKey = `${startDate}_${endDate}_${event.uid}`;
        const existingBlock = existingBlocksMap.get(blockKey);
        
        const blockData = {
          property_id: propertyId,
          start_date: startDate,
          end_date: endDate,
          reason: event.summary || 'Imported booking',
          source: `ical_${icalUrl.source}`,
          external_id: event.uid,
          is_active: true,
          created_by: null // System created
        };

        if (existingBlock) {
          // Update existing block only if something changed
          const needsUpdate = 
            existingBlock.reason !== blockData.reason ||
            !existingBlock.is_active;
            
          if (needsUpdate) {
            const { error: updateError } = await supabase
              .from('calendar_blocks')
              .update({
                reason: blockData.reason,
                is_active: true
              })
              .eq('id', existingBlock.id);
              
            if (updateError) {
              console.error('Error updating block:', updateError);
            } else {
              updatedCount++;
            }
          }
        } else {
          // Create new block
          const { error: insertError } = await supabase
            .from('calendar_blocks')
            .insert([blockData]);
            
          if (insertError) {
            console.error('Error creating block:', insertError);
          } else {
            createdCount++;
          }
        }
      }

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

      console.log(`Sync completed: processed ${events.length}, created ${createdCount}, updated ${updatedCount}, skipped ${skippedCount}`);
      
      return new Response(JSON.stringify({ 
        success: true, 
        processed: events.length,
        created: createdCount,
        updated: updatedCount,
        skipped: skippedCount,
        message: `Sync completato: ${createdCount} nuovi eventi, ${updatedCount} aggiornati${skippedCount > 0 ? `, ${skippedCount} saltati` : ''}` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (syncError) {
      console.error('Sync error:', syncError);
      
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
        message: `Errore di sincronizzazione: ${errorMessage}`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error),
      message: 'Errore interno del server'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});