import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Link as LinkIcon, Shield, Calendar } from "lucide-react";

type ChannelAccount = {
  id: string;
  host_id: string;
  kind: string;
  name: string;
  ics_pull_url: string | null;
  ics_export_token: string | null;
  last_sync_at: string | null;
  last_sync_status: string | null;
};

export default function ChannelsPage() {
  const [accounts, setAccounts] = useState<ChannelAccount[]>([]);
  const [name, setName] = useState("");
  const [pullUrl, setPullUrl] = useState("");
  const [exportToken, setExportToken] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase.from("channel_accounts").select("*").order("created_at", { ascending: false });
    setAccounts((data as ChannelAccount[]) || []);
  }

  useEffect(() => { document.title = "Channels • HostSuite AI"; load(); }, []);

  async function addAccount() {
    setErr(null);
    if (!name) { setErr("Inserisci un nome"); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErr("Devi effettuare l'accesso"); return; }

    const { error } = await supabase.from("channel_accounts").insert({
      host_id: user.id,
      name,
      kind: "ics",
      ics_pull_url: pullUrl || null,
      ics_export_token: exportToken || null,
    });

    if (error) { setErr(error.message); return; }

    setName(""); setPullUrl(""); setExportToken("");
    load();
  }

  async function testSync(id: string) {
    const base = import.meta.env.VITE_SUPABASE_URL!;
    const url = `${base.replace(".co", ".co/functions/v1")}/ics-sync?account_id=${id}`;
    await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY!}` } });
    load();
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Channel Manager (ICS)</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Aggiungi canale ICS</CardTitle>
          {err && <p className="text-sm text-red-600 mt-1">{err}</p>}
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-3">
          <Input placeholder="Nome (es. Airbnb Pisa)" value={name} onChange={(e)=>setName(e.target.value)} />
          <Input placeholder="ICS pull URL (opzionale)" value={pullUrl} onChange={(e)=>setPullUrl(e.target.value)} />
          <div className="flex gap-2">
            <Input placeholder="Export token (opzionale)" value={exportToken} onChange={(e)=>setExportToken(e.target.value)} />
            <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={addAccount}>Salva</Button>
          </div>
          <p className="text-sm text-gray-500 md:col-span-3 flex items-center gap-2">
            <Shield className="h-4 w-4" /> Con il token puoi pubblicare un feed ICS pubblico solo per questa property/account.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Canali collegati</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {accounts.map(a=>(
              <div key={a.id} className="rounded-xl border p-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">{a.name} <Badge variant="outline">ICS</Badge></div>
                  <div className="text-sm text-gray-600">
                    Pull: {a.ics_pull_url ? <a className="underline" href={a.ics_pull_url} target="_blank">{a.ics_pull_url}</a> : <span className="opacity-60">—</span>}
                    {" • "}Export URL: {a.ics_export_token ? <code className="bg-gray-50 px-1 py-0.5 rounded">{`/functions/v1/ics-export?property_id=<id>&token=${a.ics_export_token}`}</code> : <span className="opacity-60">—</span>}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Ultimo sync: {a.last_sync_at ? new Date(a.last_sync_at).toLocaleString() : "mai"} ({a.last_sync_status ?? "—"})</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={()=>testSync(a.id)}><RefreshCw className="h-4 w-4 mr-1" />Sync</Button>
                  {a.ics_pull_url && <a className="text-sm underline flex items-center gap-1" href={a.ics_pull_url} target="_blank"><LinkIcon className="h-4 w-4" />Apri ICS</a>}
                </div>
              </div>
            ))}
            {accounts.length===0 && <div className="text-sm text-gray-500">Nessun canale collegato.</div>}
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 p-4 rounded-xl border bg-orange-50 text-sm text-gray-700 flex items-start gap-2">
        <Calendar className="h-4 w-4 mt-0.5 text-orange-600" />
        <p>ICS è soggetto a ritardi di aggiornamento. Per multi-canale usa blocchi manuali finché non abiliti un connettore certificato.</p>
      </div>
    </div>
  );
}