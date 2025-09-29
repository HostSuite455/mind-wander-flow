import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

type ReqBody = { property_id?: string; all?: boolean };

function parseDt(raw: string | null): string | null {
  if (!raw) return null;
  
  try {
    // Support: DTSTART:20250926, DTSTART;VALUE=DATE:20250926, DTSTART;TZID=Europe/Rome:20250926T100000
    const [, meta, val] = raw.match(/^([^:]*):(.*)$/) ?? [null, null, raw];
    const tzMatch = meta?.match(/TZID=([^;]+)/);
    const isDateOnly = /VALUE=DATE/i.test(meta ?? '');
    
    if (isDateOnly) {
      // Treat date as checkout at 10:00 local time for MVP consistency
      return new Date(`${val}T10:00:00`).toISOString();
    }
    
    if (tzMatch) {
      // Keep declared time, browser/Node doesn't apply ICS TZ → best-effort
      return new Date(val.replace(/Z?$/, '')).toISOString();
    }
    
    // Default: ISO/Z supported
    return new Date(val).toISOString();
  } catch (e) {
    console.error('Date parsing error for:', raw, e);
    return null;
  }
}

function parseICS(ics: string) {
  const events: Array<{
    uid: string;
    start: string | null;
    end: string | null;
    status: string;
    summary: string;
    desc: string;
    guest_count: number;
  }> = [];
  
  const blocks = ics.split('BEGIN:VEVENT').slice(1);
  
  for (const b of blocks) {
    const seg = b.split('END:VEVENT')[0];
    
    const get = (k: string) => {
      const m = seg.match(new RegExp(`${k}(?:;[^\\n]*)?:(.+)`));
      return m ? m[1].trim() : null;
    };
    
    const meta = (k: string) => (seg.match(new RegExp(`(${k}[^\\n]*)`))?.[1] ?? null);
    
    const uid = get('UID') || crypto.randomUUID();
    const dtStart = meta('DTSTART');
    const dtEnd = meta('DTEND');
    const status = (get('STATUS') || 'CONFIRMED').toUpperCase();
    const summary = get('SUMMARY') || '';
    const desc = get('DESCRIPTION') || '';
    const txt = `${summary}\n${desc}`;
    const gmatch = txt.match(/(Guests|Ospiti)\s*[:=]\s*(\d+)/i);
    const guest_count = gmatch ? parseInt(gmatch[2]) : 2;
    
    const startDate = parseDt(dtStart);
    const endDate = parseDt(dtEnd);
    
    if (startDate && endDate) {
      events.push({
        uid,
        start: startDate,
        end: endDate,
        status,
        summary,
        desc,
        guest_count,
      });
    }
  }
  
  return events;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { 
        status: 405, 
        headers: { ...corsHeaders, 'content-type': 'application/json' }
      });
    }

    const body = (await req.json().catch(() => ({}))) as ReqBody;
    const propertyId = body.property_id;
    const all = !!body.all;

    // Input validation
    if (propertyId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(propertyId)) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid property_id format" }), { 
        status: 400, 
        headers: { ...corsHeaders, 'content-type': 'application/json' }
      });
    }

    let propertyIds: string[] = [];
    if (all) {
      const { data: props, error } = await supabase.from("properties").select("id");
      if (error) throw error;
      propertyIds = (props ?? []).map((p) => p.id);
    } else if (propertyId) {
      propertyIds = [propertyId];
    } else {
      return new Response(JSON.stringify({ ok: false, error: "missing property_id or all:true" }), { 
        status: 400, 
        headers: { ...corsHeaders, 'content-type': 'application/json' }
      });
    }

    const { data: sources, error: srcErr } = await supabase
      .from("ical_sources")
      .select("id, property_id, url")
      .eq("active", true)
      .in("property_id", propertyIds);

    if (srcErr) throw srcErr;

    let inserted = 0, updated = 0, canceled = 0;

    for (const s of sources ?? []) {
      console.log(`Syncing iCal from ${s.url} for property ${s.property_id}`);
      
      try {
        // Validate URL to prevent SSRF attacks
        const sourceUrl = new URL(s.url);
        if (!['http:', 'https:'].includes(sourceUrl.protocol)) {
          console.error(`Invalid protocol for source ${s.id}: ${sourceUrl.protocol}`);
          continue;
        }

        const res = await fetch(s.url, { 
          headers: { 'User-Agent': 'HostSuiteSync/1.0' }
        });
        
        if (!res.ok) {
          console.error(`Failed to fetch iCal for source ${s.id}: ${res.status}`);
          await supabase
            .from('ical_sources')
            .update({ 
              last_status: 'fetch_error', 
              last_error: `HTTP ${res.status}`,
              last_sync_at: new Date().toISOString()
            })
            .eq('id', s.id);
          continue;
        }

        const ics = await res.text();
        const evs = parseICS(ics);

        console.log(`Parsed ${evs.length} events from ${s.url}`);

        for (const ev of evs) {
          if (!ev.uid || !ev.start || !ev.end) {
            console.warn('Skipping invalid event:', ev);
            continue;
          }

          const status = ev.status === "CANCELLED" ? "canceled" : "booked";
          
          const { data: existing } = await supabase
            .from("reservations")
            .select("id")
            .eq("property_id", s.property_id)
            .eq("ext_uid", ev.uid)
            .maybeSingle();

          const reservationData = {
            property_id: s.property_id,
            source_id: s.id,
            ext_uid: ev.uid,
            guest_name: ev.summary.slice(0, 120) || null,
            guest_count: ev.guest_count,
            start_date: ev.start,
            end_date: ev.end,
            status,
          };

          if (existing) {
            const { error: updateError } = await supabase
              .from("reservations")
              .update(reservationData)
              .eq("id", existing.id);
            
            if (updateError) {
              console.error('Update error:', updateError);
              continue;
            }
            if (status === "canceled") canceled++;
            else updated++;
          } else {
            const { error: insertError } = await supabase
              .from("reservations")
              .insert(reservationData);
            
            if (insertError) {
              console.error('Insert error:', insertError);
              continue;
            }
            if (status === "canceled") canceled++;
            else inserted++;
          }
        }

        await supabase
          .from("ical_sources")
          .update({ 
            last_sync_at: new Date().toISOString(), 
            last_status: "ok", 
            last_error: null 
          })
          .eq("id", s.id);

      } catch (sourceError) {
        console.error(`Error syncing source ${s.id}:`, sourceError);
        await supabase
          .from("ical_sources")
          .update({ 
            last_sync_at: new Date().toISOString(), 
            last_status: "error", 
            last_error: String(sourceError) 
          })
          .eq("id", s.id);
      }
    }

    return new Response(JSON.stringify({ ok: true, inserted, updated, canceled }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (e) {
    console.error('Function error:', e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' }
    });
  }
});
