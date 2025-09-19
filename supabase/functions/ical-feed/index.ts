import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const propertyId = url.pathname.split('/').pop();

    if (!propertyId) {
      return new Response('Property ID required', { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify property exists and get host_id for logging
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, nome, host_id')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      console.log('Property not found:', propertyId);
      return new Response('Property not found', { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }

    console.log('Generating iCal feed for property:', property.nome);

    // Get active calendar blocks for the property
    // Range: 1 year ago to 1.5 years forward
    const startRange = new Date();
    startRange.setFullYear(startRange.getFullYear() - 1);
    const endRange = new Date();
    endRange.setFullYear(endRange.getFullYear() + 1);
    endRange.setMonth(endRange.getMonth() + 6);

    const { data: blocks, error: blocksError } = await supabase
      .from('calendar_blocks')
      .select('*')
      .eq('property_id', propertyId)
      .eq('is_active', true)
      .gte('end_date', startRange.toISOString().split('T')[0])
      .lte('start_date', endRange.toISOString().split('T')[0])
      .order('start_date');

    if (blocksError) {
      console.error('Error fetching blocks:', blocksError);
      return new Response('Internal server error', { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }

    console.log(`Found ${blocks?.length || 0} active blocks`);

    // Generate iCal content
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    let icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//HostSuite//Calendar Feed//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${property.nome} - Blocchi HostSuite`,
      'X-WR-CALDESC:Blocchi calendario generati da HostSuite'
    ];

    // Add events for each block
    if (blocks && blocks.length > 0) {
      for (const block of blocks) {
        const startDate = new Date(block.start_date + 'T00:00:00');
        const endDate = new Date(block.end_date + 'T00:00:00');
        // Add one day to end date for exclusive end (iCal standard for all-day events)
        endDate.setDate(endDate.getDate() + 1);

        const dtstart = startDate.toISOString().split('T')[0].replace(/-/g, '');
        const dtend = endDate.toISOString().split('T')[0].replace(/-/g, '');

        icalContent.push(
          'BEGIN:VEVENT',
          `UID:hostsuite-block-${block.id}`,
          `DTSTAMP:${timestamp}`,
          `DTSTART;VALUE=DATE:${dtstart}`,
          `DTEND;VALUE=DATE:${dtend}`,
          'SUMMARY:BLOCKED (HostSuite)',
          `DESCRIPTION:${block.reason || 'Blocco calendario da HostSuite'}`,
          'STATUS:CONFIRMED',
          'TRANSP:OPAQUE',
          'END:VEVENT'
        );
      }
    }

    icalContent.push('END:VCALENDAR');

    const icalString = icalContent.join('\r\n');
    
    // Generate ETag for caching
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(icalString));
    const etag = Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .substring(0, 16);

    console.log('Generated iCal feed with ETag:', etag);

    return new Response(icalString, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/calendar; charset=utf-8',
        'Cache-Control': 'public, s-maxage=300', // 5 minutes cache
        'ETag': `"${etag}"`,
        'Content-Disposition': `inline; filename="${property.nome.replace(/[^a-zA-Z0-9]/g, '_')}_blocks.ics"`
      }
    });
    
  } catch (error) {
    console.error('Error generating iCal feed:', error);
    return new Response('Internal server error', { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
  }
});