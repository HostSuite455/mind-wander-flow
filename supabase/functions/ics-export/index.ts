import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SB_URL")!,
  Deno.env.get("SB_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to format date as YYYYMMDD
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toISOString().slice(0, 10).replace(/-/g, '');
};

// Helper to get current timestamp in iCal format
const getTimestamp = (): string => {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchParams } = new URL(req.url);
    const property_id = searchParams.get("property_id");
    const token = searchParams.get("token");
    
    console.log(`Export request for property: ${property_id}, token: ${token}`);
    
    if (!property_id || !token) {
      console.error('Missing required parameters:', { property_id, token });
      return new Response("Missing property_id or token parameter", { 
        status: 400,
        headers: corsHeaders
      });
    }

    // Verify property exists and get host_id
    const { data: property, error: propError } = await supabase
      .from("properties")
      .select("id, host_id, nome")
      .eq("id", property_id)
      .single();
    
    if (propError || !property) {
      console.error('Property not found:', propError);
      return new Response("Property not found", { 
        status: 404,
        headers: corsHeaders
      });
    }

    // Verify token is valid for this host (check channel_accounts table)
    const { data: account, error: tokenError } = await supabase
      .from("channel_accounts")
      .select("id, host_id")
      .eq("host_id", property.host_id)
      .eq("ics_export_token", token)
      .maybeSingle();
    
    if (tokenError || !account) {
      console.error('Invalid token or access denied:', tokenError);
      return new Response("Forbidden - invalid token", { 
        status: 403,
        headers: corsHeaders
      });
    }

    console.log(`Token verified for host: ${property.host_id}`);

    // Get calendar blocks (availability blocks) for this property
    const { data: blocks, error: blocksError } = await supabase
      .from("calendar_blocks")
      .select("id, start_date, end_date, reason, is_active")
      .eq("property_id", property_id)
      .eq("is_active", true)
      .gte("end_date", new Date().toISOString().split('T')[0]); // Only future/current blocks
    
    if (blocksError) {
      console.error('Error fetching blocks:', blocksError);
      throw blocksError;
    }

    console.log(`Found ${blocks?.length || 0} active blocks for property ${property_id}`);

    // Build iCal content
    const now = getTimestamp();
    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//HostSuite AI//iCal Export//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VTIMEZONE",
      "TZID:Europe/Rome",
      "BEGIN:DAYLIGHT", 
      "DTSTART:20230326T020000",
      "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
      "TZNAME:CEST",
      "TZOFFSETFROM:+0100",
      "TZOFFSETTO:+0200",
      "END:DAYLIGHT",
      "BEGIN:STANDARD",
      "DTSTART:20231029T030000", 
      "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
      "TZNAME:CET",
      "TZOFFSETFROM:+0200",
      "TZOFFSETTO:+0100",
      "END:STANDARD",
      "END:VTIMEZONE",
    ];

    // Add events for each calendar block
    for (const block of blocks || []) {
      const summary = block.reason || "Non disponibile";
      lines.push(
        "BEGIN:VEVENT",
        `UID:block-${block.id}@hostsuite.ai`,
        `DTSTAMP:${now}`,
        `DTSTART;VALUE=DATE:${formatDate(block.start_date)}`,
        `DTEND;VALUE=DATE:${formatDate(block.end_date)}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:Periodo bloccato - ${property.nome}`,
        "TRANSP:OPAQUE",
        "STATUS:CONFIRMED",
        "END:VEVENT",
      );
    }

    lines.push("END:VCALENDAR");
    
    const icalContent = lines.join("\r\n");
    
    console.log(`Generated iCal with ${blocks?.length || 0} events, content length: ${icalContent.length}`);
    
    return new Response(icalContent, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${property.nome.replace(/[^a-zA-Z0-9]/g, '_')}_calendar.ics"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });

  } catch (error) {
    console.error('iCal export error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }), 
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});