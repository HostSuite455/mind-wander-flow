import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SB_URL');
    const supabaseKey = Deno.env.get('SB_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing required environment variables');
      return new Response('Server configuration error', { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const url = new URL(req.url);
    const propertyId = url.searchParams.get('property_id');
    const token = url.searchParams.get('token');

    if (!propertyId || !token) {
      return new Response('Missing required parameters: property_id and token', { 
        status: 400 
      });
    }

    console.log(`Export request for property: ${propertyId}`);

    // Verify token exists and is valid for the property
    const { data: account, error: accountError } = await supabase
      .from('channel_accounts')
      .select('*')
      .eq('property_id', propertyId)
      .eq('ics_export_token', token)
      .single();

    if (accountError || !account) {
      console.error('Invalid token or property:', accountError);
      return new Response('Unauthorized', { status: 401 });
    }

    // TODO: Generate actual ICS calendar data
    // For now, return a basic ICS stub
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//HostSuite AI//Channel Manager//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${account.name} - Property Calendar
X-WR-CALDESC:Exported calendar for property ${propertyId}
BEGIN:VEVENT
UID:stub-event-001@hostsuite.ai
DTSTART:20250101T000000Z
DTEND:20250102T000000Z
SUMMARY:TODO: Implement actual calendar export
DESCRIPTION:This is a stub response. Actual calendar data will be implemented.
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    console.log(`Returning ICS export for property: ${propertyId}`);

    return new Response(icsContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${account.name}-calendar.ics"`,
      },
    });

  } catch (error) {
    console.error('Export function error:', error);
    return new Response('Internal server error', { status: 500 });
  }
});