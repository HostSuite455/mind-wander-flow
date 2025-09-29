import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

type ReqBody = { property_id?: string; all?: boolean; debug?: boolean };

function unfoldICS(ics: string) {
  // Unfold RFC5545: lines starting with space/tab are continuations
  return ics.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
}

function getProp(seg: string, key: string) {
  // Returns { meta, value } where meta includes params (e.g., TZID, VALUE=DATE)
  const re = new RegExp(`^(${key}[^:\\n]*):(.+)$`, "mi");
  const m = seg.match(re);
  return m ? { meta: m[1], value: m[2].trim() } : null;
}

function parseDt(meta: string | null, val: string | null): string | null {
  if (!val) return null;
  const isDateOnly = !!(meta && /VALUE=DATE/i.test(meta));
  // Accept formats like 20250926 or 20250926T100000Z or 20250926T100000
  if (isDateOnly) {
    // MVP: trattiamo la data-only come checkout ore 10:00 locali
    return new Date(`${val}T10:00:00`).toISOString();
  }
  // If TZID present, lasciamo l'orario così com'è e convertiamo a ISO.
  // JS non applica TZ ICS → best effort: interpretiamo come "local time" del runtime Edge.
  // È sufficiente per MVP (turnover day-logic), non per schedule millimetrico cross-TZ.
  return new Date(val.replace(/Z?$/,"")).toISOString();
}

function parseICS(icsRaw: string) {
  const ics = unfoldICS(icsRaw);
  const out: Array<{
    uid: string;
    start: string | null;
    end: string | null;
    status: string;
    summary: string;
    desc: string;
    guest_count: number;
  }> = [];
  const blocks = ics.split(/BEGIN:VEVENT/i).slice(1);
  for (const b of blocks) {
    const seg = b.split(/END:VEVENT/i)[0];

    const uid = (seg.match(/^UID:(.+)$/mi)?.[1] ?? crypto.randomUUID()).trim();
    const dtStart = getProp(seg, "DTSTART");
    const dtEnd   = getProp(seg, "DTEND");
    const status  = (seg.match(/^STATUS:(.+)$/mi)?.[1] ?? "CONFIRMED").toUpperCase().trim();
    const summary = (seg.match(/^SUMMARY:(.+)$/mi)?.[1] ?? "").trim();
    const desc    = (seg.match(/^DESCRIPTION:(.+)$/mi)?.[1] ?? "").trim();

    // Guest count heuristics (Airbnb/Smoobu spesso in summary/description)
    const txt = `${summary}\n${desc}`;
    const g = txt.match(/(Guests|Ospiti)\s*[:=]\s*(\d+)/i);
    const guest_count = g ? parseInt(g[2]) : 2;

    out.push({
      uid,
      start: parseDt(dtStart?.meta ?? null, dtStart?.value ?? null),
      end:   parseDt(dtEnd?.meta ?? null,   dtEnd?.value ?? null),
      status,
      summary,
      desc,
      guest_count,
    });
  }
  return out;
}

serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "POST,OPTIONS" }});
    }
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: { "access-control-allow-origin": "*"}});
    }
    const body = (await req.json().catch(()=> ({}))) as ReqBody;
    const propertyId = body.property_id;
    const all = !!body.all;
    const debug = !!body.debug;

    let propertyIds: string[] = [];
    if (all) {
      const { data: props, error } = await supabase.from("properties").select("id");
      if (error) throw error;
      propertyIds = (props ?? []).map(p=>p.id);
    } else if (propertyId) {
      propertyIds = [propertyId];
    } else {
      return new Response(JSON.stringify({ ok:false, error:"missing property_id or all:true" }), { status:400, headers:{ "content-type":"application/json", "access-control-allow-origin":"*" }});
    }

    const { data: sources, error: srcErr } = await supabase
      .from("ical_sources")
      .select("id, property_id, url")
      .eq("active", true)
      .in("property_id", propertyIds);
    if (srcErr) throw srcErr;

    let inserted=0, updated=0, canceled=0;
    const debugReport: any[] = [];

    for (const s of sources ?? []) {
      const res = await fetch(s.url, { headers: { "User-Agent":"HostSuiteSync/1.1" }});
      if (!res.ok) {
        await supabase.from("ical_sources").update({ last_status:"fetch_error", last_error:`HTTP ${res.status}` }).eq("id", s.id);
        if (debug) debugReport.push({ source:s.id, error:`HTTP ${res.status}` });
        continue;
      }
      const ics = await res.text();
      const evs = parseICS(ics);

      if (debug) {
        debugReport.push({ source:s.id, parsed: evs.length, sample: evs.slice(0,3) });
      }

      for (const ev of evs) {
        const status = ev.status === "CANCELLED" ? "canceled" : "booked";
        const up = await supabase
          .from("reservations")
          .upsert({
            property_id: s.property_id,
            source_id: s.id,
            ext_uid: ev.uid,
            guest_name: ev.summary.slice(0,120),
            guest_count: ev.guest_count,
            start_date: ev.start,
            end_date: ev.end,
            status,
          }, { onConflict:"property_id,ext_uid" })
          .select("id,status");
        if (up.error) throw up.error;
        if (status === "canceled") canceled++;
        else if (up.data && up.data.length === 0) updated++;
        else inserted++;
      }

      await supabase.from("ical_sources")
        .update({ last_sync_at: new Date().toISOString(), last_status:"ok", last_error:null })
        .eq("id", s.id);
    }

    return new Response(JSON.stringify({ ok:true, inserted, updated, canceled, debug: debug ? debugReport : undefined }), {
      headers: { "content-type":"application/json", "access-control-allow-origin":"*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:String(e) }), {
      status:500, headers: { "content-type":"application/json", "access-control-allow-origin":"*" }
    });
  }
});
