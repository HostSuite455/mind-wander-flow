// Deno Edge Function: parse ICS per ogni sorgente attiva e upsert in reservations
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // impostare in dashboard
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function parseICS(ics: string) {
  const events: Array<{
    uid: string | null;
    dtStart: string | null;
    dtEnd: string | null;
    status: string;
    summary: string;
    desc: string;
    guest_count: number;
  }> = [];
  const blocks = ics.split("BEGIN:VEVENT").slice(1);
  for (const b of blocks) {
    const seg = b.split("END:VEVENT")[0];
    const get = (k: string) => {
      const m = seg.match(new RegExp(`${k}(?:;[^\\n]*)?:(.+)`));
      return m ? m[1].trim() : null;
    };
    const uid = get("UID");
    const dtStart = get("DTSTART");
    const dtEnd = get("DTEND");
    const status = (get("STATUS") || "CONFIRMED").toUpperCase();
    const summary = get("SUMMARY") || "";
    const desc = get("DESCRIPTION") || "";
    const txt = `${summary}\n${desc}`;
    const gmatch = txt.match(/(Guests|Ospiti)\\s*[:=]\\s*(\\d+)/i);
    const guest_count = gmatch ? parseInt(gmatch[2]) : 2;
    events.push({ uid, dtStart, dtEnd, status, summary, desc, guest_count });
  }
  return events;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const propertyId = url.searchParams.get("property_id");
    const all = url.searchParams.get("all") === "true";

    let propertyIds: string[] = [];
    if (all) {
      const { data: props, error } = await supabase.from("properties").select("id");
      if (error) throw error;
      propertyIds = (props ?? []).map((p) => p.id);
    } else if (propertyId) {
      propertyIds = [propertyId];
    } else {
      return new Response(JSON.stringify({ ok: false, error: "missing property_id or all=true" }), { 
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" }
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
        const res = await fetch(s.url);
        const ics = await res.text();
        const evs = parseICS(ics);

        for (const ev of evs) {
          if (!ev.uid || !ev.dtStart || !ev.dtEnd) continue;
          
          const status = ev.status === "CANCELLED" ? "canceled" : "booked";
          
          // Parse date strings - handle both DATE and DATETIME formats
          let checkIn: Date;
          let checkOut: Date;
          
          try {
            if (ev.dtStart.includes('T')) {
              // DATETIME format
              checkIn = new Date(ev.dtStart.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6'));
            } else {
              // DATE format
              checkIn = new Date(ev.dtStart.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'));
            }
            
            if (ev.dtEnd.includes('T')) {
              checkOut = new Date(ev.dtEnd.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6'));
            } else {
              checkOut = new Date(ev.dtEnd.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'));
            }
          } catch (dateError) {
            console.error(`Error parsing dates for event ${ev.uid}:`, dateError);
            continue;
          }

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
            guest_name: ev.summary?.slice(0, 120) || null,
            guest_count: ev.guest_count,
            check_in: checkIn.toISOString(),
            check_out: checkOut.toISOString(),
            status,
          };

          if (existing) {
            const { error: updateError } = await supabase
              .from("reservations")
              .update(reservationData)
              .eq("id", existing.id);
            
            if (updateError) throw updateError;
            if (status === "canceled") canceled++;
            else updated++;
          } else {
            const { error: insertError } = await supabase
              .from("reservations")
              .insert(reservationData);
            
            if (insertError) throw insertError;
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
    console.error("Function error:", e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { 
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }
});