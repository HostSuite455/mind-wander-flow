// supabase/functions/ics-sync/index.ts
// Deno Edge Function per sincronizzare ICS su tabelle MVP
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SB_URL")!,
  Deno.env.get("SB_SERVICE_ROLE_KEY")!
);

// Parser minimale: prende DTSTART/DTEND/UID/SUMMARY (date-only)
function parseICS(text: string) {
  const events: Array<{ uid?: string; start: string; end: string; summary?: string }> = [];
  const blocks = text.split("BEGIN:VEVENT").slice(1);
  for (const blk of blocks) {
    const seg = blk.split("END:VEVENT")[0];
    const lines = seg.split(/\r?\n/).map(l => l.trim());
    const get = (k: string) => lines.find(l => l.startsWith(k));
    const DTSTART = get("DTSTART");
    const DTEND = get("DTEND");
    if (!DTSTART || !DTEND) continue;
    const UID = get("UID")?.split(":")[1];
    const SUMMARY = get("SUMMARY")?.split(":")[1];
    const date = (raw: string) => (raw.split(":")[1] || "").substring(0,8); // YYYYMMDD
    const s = date(DTSTART);
    const e = date(DTEND);
    if (s && e) events.push({ uid: UID, start: s, end: e, summary: SUMMARY });
  }
  return events;
}

async function log(account_id: string, level: string, message: string) {
  await supabase.from("sync_logs").insert({ account_id, level, message });
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const accountId = url.searchParams.get("account_id");

    // Prendi tutti gli account ICS o uno specifico
    const query = supabase.from("channel_accounts").select("*").eq("kind", "ics");
    const { data: accounts, error } = accountId
      ? await query.eq("id", accountId)
      : await query;
    if (error) throw error;

    const list = accounts || [];
    let processed = 0;

    for (const acc of list) {
      if (!acc?.ics_pull_url) continue;

      const res = await fetch(acc.ics_pull_url);
      const ics = await res.text();
      const events = parseICS(ics);

      // --- nuovo: se l'account ha property_id, usa solo quella; altrimenti fallback a tutte ---
      let props: Array<{ id: string }> = [];
      if (acc.property_id) {
        props = [{ id: acc.property_id }];
      } else {
        const { data: all } = await supabase
          .from("properties")
          .select("id")
          .eq("host_id", acc.host_id);
        props = (all as any) || [];
      }

      for (const p of props || []) {
        // pulizia dei record provenienti da questo account
        await supabase.from("availability_blocks")
          .delete().like("source", `ics:${acc.id}%`).eq("property_id", p.id);
        await supabase.from("reservations")
          .delete().like("source", `ics:${acc.id}%`).eq("property_id", p.id);

        const toReserve = events.filter(e => /book|reserva|prenota/i.test(e.summary || ""));
        const toBlock   = events.filter(e => !/book|reserva|prenota/i.test(e.summary || ""));

        const dateFmt = (yyyymmdd: string) =>
          `${yyyymmdd.substring(0,4)}-${yyyymmdd.substring(4,6)}-${yyyymmdd.substring(6,8)}`;

        if (toReserve.length) {
          await supabase.from("reservations").insert(
            toReserve.map(e => ({
              property_id: p.id,
              source: `ics:${acc.id}`,
              uid: e.uid ?? null,
              start_date: dateFmt(e.start),
              end_date: dateFmt(e.end),
              guest_name: e.summary ?? null
            }))
          );
        }

        if (toBlock.length) {
          await supabase.from("availability_blocks").insert(
            toBlock.map(e => ({
              property_id: p.id,
              source: `ics:${acc.id}`,
              start_date: dateFmt(e.start),
              end_date: dateFmt(e.end),
              reason: e.summary ?? "ICS"
            }))
          );
        }
      }

      await supabase.from("channel_accounts").update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: `ok:${events.length}`
      }).eq("id", acc.id);

      await log(acc.id, "info", `Synced ${events.length} events`);
      processed++;
    }

    return new Response(JSON.stringify({ ok: true, processed }), {
      headers: { "content-type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
});
