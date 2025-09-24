import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Calendar, Plus, Edit2, Trash2, Save, X, Copy, Key } from "lucide-react";
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
  const { toast } = useToast();

  async function load() {
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
    }
  }

  useEffect(() => { 
    document.title = "Channels • HostSuite AI"; 
    load(); 
  }, []);

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
        ics_export_token: crypto.randomUUID().replace(/-/g, ''),
      });

      if (error) { 
        logError("Failed to create channel account", error, { component: "ChannelsPage" });
        setErr(error.message); 
        return; 
      }

      setChannelName("");
      setPropertyId("");
      
      toast({
        title: "Account canale creato",
        description: "L'account del canale è stato creato con successo",
      });

      load();
    } catch (error) {
      logError("Unexpected error creating channel account", error, { component: "ChannelsPage" });
      setErr("Errore imprevisto durante la creazione");
    }
  }

  async function generateToken(accountId: string) {
    try {
      const { error } = await supabase
        .from("channel_accounts")
        .update({ 
          ics_export_token: crypto.randomUUID().replace(/-/g, ''),
          updated_at: new Date().toISOString()
        })
        .eq("id", accountId);

      if (error) {
        logError("Failed to generate token", error, { component: "ChannelsPage" });
        toast({
          title: "Errore",
          description: "Errore nella generazione del token",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Token generato",
        description: "Token di esportazione generato con successo",
      });

      load();
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
      const { error } = await supabase
        .from("channel_accounts")
        .update({ 
          property_id: newPropertyId,
          updated_at: new Date().toISOString()
        })
        .eq("id", accountId);

      if (error) {
        logError("Failed to update property", error, { component: "ChannelsPage" });
        toast({
          title: "Errore",
          description: "Errore nell'aggiornamento della proprietà",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Proprietà aggiornata",
        description: "Proprietà associata con successo",
      });

      load();
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
    setErr(null);
    setEditAccountId(account.id);
    setEditData({
      name: account.name,
      property_id: account.property_id,
      ics_pull_url: account.ics_pull_url,
    });
  }

  function cancelEdit() { 
    setEditAccountId(null); 
    setEditData({});
  }

  async function saveEdit() {
    setErr(null);
    if (!editAccountId) return;
    if (!editData.name?.trim()) { setErr("Inserisci un nome"); return; }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setErr("Devi effettuare l'accesso"); return; }

      const { error } = await supabase.from("channel_accounts").update({
        name: editData.name?.trim(),
        property_id: editData.property_id,
        ics_pull_url: editData.ics_pull_url,
        updated_at: new Date().toISOString(),
      }).eq("id", editAccountId);

      if (error) { 
        logError("Failed to update channel account", error, { component: "ChannelsPage" });
        setErr(error.message); 
        return; 
      }

      setEditAccountId(null); 
      setEditData({});
      
      toast({
        title: "Account aggiornato",
        description: "Le modifiche sono state salvate con successo",
      });

      load();
    } catch (error) {
      logError("Unexpected error updating account", error, { component: "ChannelsPage" });
      setErr("Errore imprevisto durante l'aggiornamento");
    }
  }

  async function deleteAccount(id: string) {
    setErr(null);
    if (!confirm("Eliminare questo account canale?")) return;

    try {
      const { error } = await supabase.from("channel_accounts").delete().eq("id", id);
      if (error) { 
        logError("Failed to delete channel account", error, { component: "ChannelsPage" });
        setErr(error.message); 
        return; 
      }

      toast({
        title: "Account eliminato",
        description: "L'account del canale è stato rimosso con successo",
      });

      load();
    } catch (error) {
      logError("Unexpected error deleting account", error, { component: "ChannelsPage" });
      setErr("Errore imprevisto durante l'eliminazione");
    }
  }

  async function copyExportUrl(account: ChannelAccount) {
    if (!account.property_id || !account.ics_export_token) return;
    
    const url = `${getFnsBase()}/ics-export?property_id=${account.property_id}&token=${account.ics_export_token}`;
    
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "URL copiato",
        description: "Export URL copiato negli appunti",
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
            {accounts.map(account => {
              const isEditing = editAccountId === account.id;
              const property = properties.find(p => p.id === account.property_id);
              
              return (
                <div key={account.id} className="rounded-xl border p-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid md:grid-cols-3 gap-2">
                        <select 
                          className="rounded-md border p-2 text-sm" 
                          value={editData.property_id || ""} 
                          onChange={(e) => setEditData({ ...editData, property_id: e.target.value })}
                        >
                          <option value="">Seleziona appartamento…</option>
                          {properties.map(p => (
                            <option key={p.id} value={p.id}>{p.nome}</option>
                          ))}
                        </select>
                        <Input 
                          placeholder="Nome canale" 
                          value={editData.name || ""} 
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })} 
                        />
                        <Input 
                          placeholder="URL import iCal (opzionale)" 
                          value={editData.ics_pull_url || ""} 
                          onChange={(e) => setEditData({ ...editData, ics_pull_url: e.target.value })} 
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={saveEdit}>
                          <Save className="h-4 w-4 mr-1" /> Salva
                        </Button>
                        <Button variant="outline" onClick={cancelEdit}>
                          <X className="h-4 w-4 mr-1" /> Annulla
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{account.name}</h3>
                          <Badge variant="outline">
                            {account.kind.toUpperCase()}
                          </Badge>
                          <Badge variant="default" className="bg-green-100 text-green-800">Attivo</Badge>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          Appartamento: {property?.nome || "—"}
                        </div>
                        
                        {account.ics_pull_url && (
                          <div className="text-sm text-gray-500 mb-2">
                            Import URL: <code className="text-xs bg-gray-100 px-1 rounded">{account.ics_pull_url.substring(0, 50)}...</code>
                          </div>
                        )}
                        
                        {account.last_sync_at && (
                          <div className="mt-2 text-xs text-gray-400">
                            Ultimo sync: {new Date(account.last_sync_at).toLocaleString()}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Button variant="outline" onClick={() => startEdit(account)}>
                          <Edit2 className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="text-red-600 border-red-200 hover:bg-red-50" 
                          onClick={() => deleteAccount(account.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                        
                        {/* Copy Export URL - shown only if both property_id and token exist */}
                        {account.property_id && account.ics_export_token ? (
                          <Button 
                            variant="outline" 
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => copyExportUrl(account)}
                          >
                            <Copy className="h-4 w-4 mr-1" /> Copia Export URL
                          </Button>
                        ) : (
                          <>
                            {!account.ics_export_token && (
                              <Button 
                                variant="outline"
                                className="text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => generateToken(account.id)}
                              >
                                <Key className="h-4 w-4 mr-1" /> Genera Token
                              </Button>
                            )}
                            
                            {!account.property_id && (
                              <div className="flex gap-1 items-center">
                                <select 
                                  className="text-xs border rounded px-2 py-1" 
                                  onChange={(e) => e.target.value && updatePropertyId(account.id, e.target.value)}
                                  defaultValue=""
                                >
                                  <option value="">Associa proprietà...</option>
                                  {properties.map(p => (
                                    <option key={p.id} value={p.id}>{p.nome}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {accounts.length === 0 && (
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
    </div>
  );
}