import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Calendar, Plus, Edit2, Trash2, Save, X, Copy, Key, Loader2, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getFnsBase } from "@/lib/supaFns";
import { logError, logInfo, logWarn } from "@/lib/log";

type Property = { id: string; nome: string };

type ChannelAccount = {
  id: string;
  host_id: string;
  property_id?: string;
  ics_export_token?: string;
  ics_pull_url?: string;
  name: string;
  kind: string;
  last_sync_at?: string;
  last_sync_status?: string;
  created_at: string;
  updated_at: string;
};

export default function ChannelsPage() {
  const [accounts, setAccounts] = useState<ChannelAccount[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyId, setPropertyId] = useState<string>("");
  const [channelName, setChannelName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [editAccountId, setEditAccountId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<ChannelAccount>>({});
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function load() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        logWarn("User not authenticated", { component: "ChannelsPage" });
        return;
      }

      // Load properties
      const { data: props, error: propsError } = await supabase
        .from("properties")
        .select("id, nome")
        .eq("host_id", user.id)
        .order("created_at", { ascending: false });

      if (propsError) {
        logError("Failed to load properties", propsError, { component: "ChannelsPage" });
        setErr("Errore nel caricamento delle proprietà");
        return;
      }

      setProperties((props as Property[]) || []);

      // Load channel accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from("channel_accounts")
        .select("*")
        .eq("host_id", user.id)
        .order("created_at", { ascending: false });

      if (accountsError) {
        logError("Failed to load channel accounts", accountsError, { component: "ChannelsPage" });
        setErr("Errore nel caricamento degli account canale");
        return;
      } else {
        setAccounts((accountsData as ChannelAccount[]) || []);
      }

      logInfo("Successfully loaded channel data", { 
        component: "ChannelsPage", 
        accountsCount: accountsData?.length || 0
      });

    } catch (error) {
      logError("Unexpected error during load", error, { component: "ChannelsPage" });
      setErr("Errore imprevisto durante il caricamento");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { document.title = "Channels • HostSuite AI"; load(); }, []);

  async function addChannelAccount() {
    setErr(null);
    if (!propertyId) { setErr("Seleziona un appartamento"); return; }
    if (!channelName) { setErr("Inserisci un nome per il canale"); return; }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setErr("Devi effettuare l'accesso"); return; }

      const { error } = await supabase.from("channel_accounts").insert({
        host_id: user.id,
        property_id: propertyId,
        kind: 'ics',
        name: channelName,
      });

      if (error) {
        logError("Failed to create channel account", error, { component: "ChannelsPage" });
        setErr(error.message);
        return;
      }

      setPropertyId("");
      setChannelName("");
      load();

      toast({
        title: "Account canale creato",
        description: "L'account canale è stato creato con successo",
      });

    } catch (error) {
      logError("Unexpected error creating channel account", error, { component: "ChannelsPage" });
      setErr("Errore imprevisto durante la creazione");
    }
  }

  async function generateToken(accountId: string) {
    try {
      const token = crypto.randomUUID();
      const { error } = await supabase.from("channel_accounts").update({
        ics_export_token: token
      }).eq("id", accountId);

      if (error) {
        logError("Failed to generate token", error, { component: "ChannelsPage" });
        toast({
          title: "Errore",
          description: "Errore nella generazione del token",
          variant: "destructive",
        });
        return;
      }

      load();
      toast({
        title: "Token generato",
        description: "Token di export generato con successo",
      });

    } catch (error) {
      logError("Unexpected error generating token", error, { component: "ChannelsPage" });
      toast({
        title: "Errore",
        description: "Errore imprevisto nella generazione del token",
        variant: "destructive",
      });
    }
  }

  async function updatePropertyId(accountId: string, newPropertyId: string) {
    try {
      const { error } = await supabase.from("channel_accounts").update({
        property_id: newPropertyId || null
      }).eq("id", accountId);

      if (error) {
        logError("Failed to update property", error, { component: "ChannelsPage" });
        toast({
          title: "Errore",
          description: "Errore nell'aggiornamento della proprietà",
          variant: "destructive",
        });
        return;
      }

      load();
      toast({
        title: "Proprietà aggiornata",
        description: "Proprietà associata aggiornata con successo",
      });

    } catch (error) {
      logError("Unexpected error updating property", error, { component: "ChannelsPage" });
      toast({
        title: "Errore",
        description: "Errore imprevisto nell'aggiornamento",
        variant: "destructive",
      });
    }
  }

  function startEdit(account: ChannelAccount) {
    setEditAccountId(account.id);
    setEditData({
      name: account.name,
      ics_pull_url: account.ics_pull_url || "",
      property_id: account.property_id || "",
    });
  }

  function cancelEdit() { 
    setEditAccountId(null);
    setEditData({});
  }

  async function saveEdit() {
    if (!editAccountId) return;

    try {
      const { error } = await supabase.from("channel_accounts").update({
        name: editData.name,
        ics_pull_url: editData.ics_pull_url || null,
        property_id: editData.property_id || null,
      }).eq("id", editAccountId);

      if (error) {
        logError("Failed to update account", error, { component: "ChannelsPage" });
        toast({
          title: "Errore",
          description: "Errore nell'aggiornamento dell'account",
          variant: "destructive",
        });
        return;
      }

      setEditAccountId(null);
      setEditData({});
      load();

      toast({
        title: "Account aggiornato",
        description: "Account canale aggiornato con successo",
      });

    } catch (error) {
      logError("Unexpected error updating account", error, { component: "ChannelsPage" });
      toast({
        title: "Errore",
        description: "Errore imprevisto nell'aggiornamento",
        variant: "destructive",
      });
    }
  }

  async function deleteAccount(id: string) {
    if (!confirm("Sei sicuro di voler eliminare questo account canale?")) return;

    try {
      const { error } = await supabase.from("channel_accounts").delete().eq("id", id);

      if (error) {
        logError("Failed to delete account", error, { component: "ChannelsPage" });
        toast({
          title: "Errore",
          description: "Errore nell'eliminazione dell'account",
          variant: "destructive",
        });
        return;
      }

      load();
      toast({
        title: "Account eliminato",
        description: "Account canale eliminato con successo",
      });

    } catch (error) {
      logError("Unexpected error deleting account", error, { component: "ChannelsPage" });
      toast({
        title: "Errore",
        description: "Errore imprevisto nell'eliminazione",
        variant: "destructive",
      });
    }
  }

  async function handleSync(account: ChannelAccount) {
    if (!account.ics_pull_url) {
      toast({
        title: "URL mancante",
        description: "Configura prima un URL ICS per questo canale",
        variant: "destructive",
      });
      return;
    }

    setSyncingId(account.id);

    try {
      const base = getFnsBase();
      const url = `${base}/ics-sync`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          account_id: account.id,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      toast({
        title: "Sincronizzazione completata",
        description: result.message || "Sincronizzazione avvenuta con successo",
      });

      // Reload to get updated sync status
      load();

    } catch (error) {
      logError("Sync failed", error, { component: "ChannelsPage", accountId: account.id });
      toast({
        title: "Errore di sincronizzazione",
        description: error instanceof Error ? error.message : "Errore sconosciuto durante la sincronizzazione",
        variant: "destructive",
      });
    } finally {
      setSyncingId(null);
    }
  }

  async function copyExportUrl(account: ChannelAccount) {
    if (!account.property_id || !account.ics_export_token) return;

    const url = `${getFnsBase()}/ics-export?property_id=${account.property_id}&token=${account.ics_export_token}`;

    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "URL copiato",
        description: "URL di export copiato negli appunti",
      });
    } catch (error) {
      logError("Failed to copy URL", error, { component: "ChannelsPage" });
      toast({
        title: "Errore",
        description: "Errore nella copia dell'URL",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Channel Manager</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Aggiungi nuovo canale</CardTitle>
          {err && <p className="text-sm text-red-600 mb-2">{err}</p>}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <select 
              className="w-full rounded-md border p-2 text-sm" 
              value={propertyId} 
              onChange={(e) => setPropertyId(e.target.value)}
            >
              <option value="">Seleziona appartamento…</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
            
            <Input 
              placeholder="Nome canale (es. Airbnb, Booking.com)" 
              value={channelName} 
              onChange={(e) => setChannelName(e.target.value)} 
            />
          </div>
          
          <Button 
            className="bg-orange-600 hover:bg-orange-700 text-white" 
            onClick={addChannelAccount}
            disabled={!propertyId || !channelName}
          >
            <Plus className="h-4 w-4 mr-2" />
            Crea Account Canale
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account canali configurati</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border p-4">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))
            ) : (
              accounts.map(account => {
                const isEditing = editAccountId === account.id;
                const property = properties.find(p => p.id === account.property_id);
                const isSyncing = syncingId === account.id;

                return (
                  <div key={account.id} className="rounded-xl border p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {isEditing ? (
                          <div className="space-y-3">
                            <Input
                              value={editData.name || ""}
                              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                              placeholder="Nome canale"
                            />
                            <Input
                              value={editData.ics_pull_url || ""}
                              onChange={(e) => setEditData({ ...editData, ics_pull_url: e.target.value })}
                              placeholder="URL ICS pull (opzionale)"
                            />
                            <select
                              className="w-full rounded-md border p-2 text-sm"
                              value={editData.property_id || ""}
                              onChange={(e) => setEditData({ ...editData, property_id: e.target.value })}
                            >
                              <option value="">Seleziona appartamento…</option>
                              {properties.map(p => (
                                <option key={p.id} value={p.id}>{p.nome}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{account.name}</h3>
                              <Badge variant="outline">ICS</Badge>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>Appartamento: {property?.nome || "Non assegnato"}</div>
                              <div>Pull URL: {account.ics_pull_url || "Non configurato"}</div>
                              <div>Export Token: {account.ics_export_token ? "Configurato" : "Non generato"}</div>
                              <div className="flex items-center gap-2">
                                Ultimo sync: {account.last_sync_at ? new Date(account.last_sync_at).toLocaleString() : "Mai"}
                                {account.last_sync_status === 'success' && <Check className="h-4 w-4 text-green-600" />}
                                {account.last_sync_status === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {isEditing ? (
                          <>
                            <Button size="sm" onClick={saveEdit}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSync(account)}
                              disabled={isSyncing || !account.ics_pull_url}
                            >
                              {isSyncing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </Button>
                            
                            {!account.ics_export_token ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => generateToken(account.id)}
                              >
                                <Key className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyExportUrl(account)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(account)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteAccount(account.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            
            {!loading && accounts.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-8">
                Nessun account canale configurato. Aggiungi il primo account sopra.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 p-4 rounded-xl border bg-orange-50 text-sm text-gray-700 flex items-start gap-2">
        <Calendar className="h-4 w-4 mt-0.5 text-orange-600" />
        <div>
          <p className="font-medium mb-1">Funzionalità disponibili:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Copy Export URL</strong>: Copia l'URL ICS per sincronizzare le prenotazioni verso i canali</li>
            <li><strong>Import URL</strong>: Configura URL per importare prenotazioni dai canali (opzionale)</li>
            <li>Ogni canale può essere associato a una singola proprietà</li>
          </ul>
        </div>
      </div>
      
      <div className="mt-4 p-3 rounded-lg border bg-yellow-50 text-sm text-gray-600">
        <p>ICS è soggetto a ritardi di aggiornamento. Per multi-canale usa blocchi manuali finché non abiliti un connettore certificato.</p>
      </div>
    </div>
  );
}