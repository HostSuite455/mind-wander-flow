import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SB_URL")!,
  Deno.env.get("SB_SERVICE_ROLE_KEY")!
);

const d = (iso: string) => iso.replaceAll("-", ""); // YYYY-MM-DD -> YYYYMMDD
const ts = () =>
  new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z").replace("T","T");

serve(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const property_id = searchParams.get("property_id");
    const token = searchParams.get("token");
    if (!property_id || !token) return new Response("Missing params", { status: 400 });

    // property (host_id)
    const { data: prop, error: e1 } = await supabase
      .from("properties").select("id,host_id").eq("id", property_id).single();
    if (e1 || !prop) return new Response("Property not found", { status: 404 });

    // token valido per quell'host
    const { data: acc, error: e2 } = await supabase
      .from("channel_accounts").select("id").eq("host_id", prop.host_id).eq("ics_export_token", token).maybeSingle();
    if (e2 || !acc) return new Response("Forbidden", { status: 403 });

    const { data: resvs } = await supabase
      .from("reservations").select("id,start_date,end_date,guest_name").eq("property_id", property_id);
    const { data: blocks } = await supabase
      .from("availability_blocks").select("id,start_date,end_date,reason").eq("property_id", property_id);

    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//HostSuite AI//ICS Export//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ];
    const now = ts();

    for (const r of resvs || []) {
      lines.push(
        "BEGIN:VEVENT",
        `UID:res-${r.id}@hostsuite.ai`,
        `DTSTAMP:${now}`,
        `DTSTART;VALUE=DATE:${d(r.start_date)}`,
        `DTEND;VALUE=DATE:${d(r.end_date)}`,
        `SUMMARY:Booking${r.guest_name ? " - " + r.guest_name : ""}`,
        "END:VEVENT",
      );
    }
    for (const b of blocks || []) {
      lines.push(
        "BEGIN:VEVENT",
        `UID:blk-${b.id}@hostsuite.ai`,
        `DTSTAMP:${now}`,
        `DTSTART;VALUE=DATE:${d(b.start_date)}`,
        `DTEND;VALUE=DATE:${d(b.end_date)}`,
        `SUMMARY:Blocked${b.reason ? " - " + b.reason : ""}`,
        "END:VEVENT",
      );
    }

    lines.push("END:VCALENDAR");
    const body = lines.join("\r\n");
    return new Response(body, {
      headers: {
        "content-type": "text/calendar; charset=utf-8",
        "content-disposition": 'attachment; filename="hostsuite.ics"',
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    return new Response("Server error: " + String(e), { status: 500 });
  }
});