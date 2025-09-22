import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Link as LinkIcon, Shield, Calendar, CheckCircle, XCircle, Edit2, Trash2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Property = { id: string; nome: string };

type ChannelAccount = {
  id: string;
  host_id: string;
  property_id?: string;
  kind: string;
  name: string;
  ics_pull_url: string | null;
  ics_export_token: string | null;
  last_sync_at: string | null;
  last_sync_status: string | null;
};

export default function ChannelsPage() {
  const [accounts, setAccounts] = useState<ChannelAccount[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyId, setPropertyId] = useState<string>("");
  const [name, setName] = useState("");
  const [pullUrl, setPullUrl] = useState("");
  const [exportToken, setExportToken] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [eName, setEName] = useState("");
  const [ePull, setEPull] = useState("");
  const [eToken, setEToken] = useState("");
  const [ePropertyId, setEPropertyId] = useState("");
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  async function load() {
    const { data } = await supabase.from("channel_accounts").select("*").order("created_at", { ascending: false });
    setAccounts((data as ChannelAccount[]) || []);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: props } = await supabase.from("properties").select("id,nome").eq("host_id", user.id).order("created_at",{ascending:false});
      setProperties((props as any) || []);
    }
  }

  useEffect(() => { document.title = "Channels • HostSuite AI"; load(); }, []);

  async function addAccount() {
    setErr(null);
    if (!propertyId) { setErr("Seleziona un appartamento"); return; }
    if (!name) { setErr("Inserisci un nome"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErr("Devi effettuare l'accesso"); return; }
    const { error } = await supabase.from("channel_accounts").insert({
      host_id: user.id,
      // @ts-ignore
      property_id: propertyId,
      name,
      kind: "ics",
      ics_pull_url: pullUrl || null,
      ics_export_token: exportToken || null,
    });
    if (error) { setErr(error.message); return; }
    setName(""); setPullUrl(""); setExportToken("");
    // @ts-ignore
    setPropertyId("");
    load();
  }

  async function testSync(id: string) {
    if (!id) {
      toast({
        title: "Errore",
        description: "ID account non valido",
        variant: "destructive",
      });
      return;
    }

    // Find the account to check if it has a pull URL
    const account = accounts.find(a => a.id === id);
    if (!account?.ics_pull_url) {
      toast({
        title: "Configurazione mancante",
        description: "Questo canale non ha un URL ICS configurato per il pull",
        variant: "destructive",
      });
      return;
    }

    setSyncingIds(prev => new Set(prev).add(id));
    
    try {
      const base = import.meta.env.VITE_SUPABASE_URL!;
      const url = `${base.replace(".co", ".co/functions/v1")}/ics-sync?account_id=${id}`;
      
      const response = await fetch(url, { 
        method: "POST", 
        headers: { 
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY!}`,
          'Content-Type': 'application/json'
        } 
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.ok) {
        toast({
          title: "Sync completato",
          description: `Sincronizzati ${result.processed || 0} account con successo`,
        });
      } else {
        throw new Error(result.error || "Errore sconosciuto durante il sync");
      }
      
      // Reload data to show updated sync status
      await load();
      
    } catch (error) {
      console.error("Sync error:", error);
      toast({
        title: "Errore durante il sync",
        description: error instanceof Error ? error.message : "Errore sconosciuto",
        variant: "destructive",
      });
    } finally {
      setSyncingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  }

  function startEdit(a: any) {
    setErr(null);
    setEditId(a.id);
    setEName(a.name || "");
    setEPull(a.ics_pull_url || "");
    setEToken(a.ics_export_token || "");
    setEPropertyId(a.property_id || "");
  }
  function cancelEdit() { setEditId(null); }
  async function saveEdit() {
    setErr(null);
    if (!editId) return;
    if (!ePropertyId) { setErr("Seleziona un appartamento"); return; }
    if (!eName.trim()) { setErr("Inserisci un nome"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErr("Devi effettuare l'accesso"); return; }
    const { error } = await supabase.from("channel_accounts").update({
      // @ts-ignore
      property_id: ePropertyId,
      name: eName.trim(),
      ics_pull_url: ePull.trim() || null,
      ics_export_token: eToken.trim() || null,
      updated_at: new Date().toISOString(),
    }).eq("id", editId).eq("host_id", user.id);
    if (error) { setErr(error.message); return; }
    setEditId(null); load();
  }
  async function deleteAccount(id: string) {
    setErr(null);
    if (!confirm("Eliminare questo canale? I blocchi già creati restano.")) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErr("Devi effettuare l'accesso"); return; }
    const { error } = await supabase.from("channel_accounts").delete().eq("id", id).eq("host_id", user.id);
    if (error) { setErr(error.message); return; }
    load();
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Channel Manager (ICS)</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Aggiungi canale ICS</CardTitle>
          {err && <p className="text-sm text-red-600 mb-2">{err}</p>}
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-3">
          <select 
            className="w-full rounded-md border p-2 text-sm" 
            value={propertyId} 
            onChange={(e)=>setPropertyId(e.target.value)}
          >
            <option value="">Seleziona appartamento…</option>
            {properties.map(p=>(
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
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
                 {editId === a.id ? (
                   <div className="flex-1 space-y-2">
                     <div className="grid md:grid-cols-4 gap-2">
                       <select className="rounded-md border p-2 text-sm" value={ePropertyId} onChange={(e)=>setEPropertyId(e.target.value)}>
                         <option value="">Seleziona appartamento…</option>
                         {properties.map(p=>(
                           <option key={p.id} value={p.id}>{p.nome}</option>
                         ))}
                       </select>
                       <Input placeholder="Nome" value={eName} onChange={e=>setEName(e.target.value)} />
                       <Input placeholder="ICS pull URL" value={ePull} onChange={e=>setEPull(e.target.value)} />
                       <Input placeholder="Export token" value={eToken} onChange={e=>setEToken(e.target.value)} />
                     </div>
                     <div className="text-xs text-gray-500">
                       Ultimo sync: {a.last_sync_at ? new Date(a.last_sync_at).toLocaleString() : "mai"} ({a.last_sync_status ?? "—"})
                     </div>
                   </div>
                 ) : (
                   <div className="flex-1">
                     <div className="font-semibold">{a.name} <Badge variant="outline">ICS</Badge></div>
                     <div className="text-xs text-gray-500">
                       Appartamento: {properties.find(p=>p.id===((a as any).property_id))?.nome ?? "—"}
                     </div>
                     <div className="text-sm text-gray-600">
                       Pull: {a.ics_pull_url ? <a className="underline" href={a.ics_pull_url} target="_blank">{a.ics_pull_url}</a> : <span className="opacity-60">—</span>}
                       {" • "}Export URL: {a.ics_export_token ? <code className="bg-gray-50 px-1 py-0.5 rounded">{`/functions/v1/ics-export?property_id=<id>&token=${a.ics_export_token}`}</code> : <span className="opacity-60">—</span>}
                     </div>
                     <div className="text-xs text-gray-500 mt-1">
                       Ultimo sync: {a.last_sync_at ? new Date(a.last_sync_at).toLocaleString() : "mai"} ({a.last_sync_status ?? "—"})
                     </div>
                   </div>
                 )}

                 <div className="flex items-center gap-2">
                   {editId === a.id ? (
                     <>
                       <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={saveEdit}><Save className="h-4 w-4 mr-1" /> Salva</Button>
                       <Button variant="outline" onClick={cancelEdit}><X className="h-4 w-4 mr-1" /> Annulla</Button>
                     </>
                   ) : (
                     <>
                       <Button variant="outline" onClick={() => startEdit(a)}><Edit2 className="h-4 w-4 mr-1" /> Edit</Button>
                       <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => deleteAccount(a.id)}><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>
                       <Button variant="outline" onClick={() => testSync(a.id)}><RefreshCw className="h-4 w-4 mr-1" /> Sync</Button>
                       {a.ics_pull_url && <a className="text-sm underline flex items-center gap-1" href={a.ics_pull_url} target="_blank"><LinkIcon className="h-4 w-4" /> Apri ICS</a>}
                     </>
                   )}
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