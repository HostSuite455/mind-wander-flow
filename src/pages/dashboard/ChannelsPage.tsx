import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Link as LinkIcon, Shield, Calendar, Plus, Edit2, Trash2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { buildFunctionUrl, createFunctionHeaders } from "@/lib/supaFns";
import { logError, logInfo, logWarn } from "@/lib/log";

type Property = { id: string; nome: string };

type IcalConfig = {
  id: string;
  property_id: string;
  host_id?: string;
  config_type: string;
  channel_manager_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  api_endpoint?: string;
  api_key_name?: string;
};

type IcalUrl = {
  id: string;
  ical_config_id: string;
  url: string;
  ota_name: string;
  is_active: boolean;
  last_sync_at?: string;
  last_sync_status?: string;
};

export default function ChannelsPage() {
  const [configs, setConfigs] = useState<IcalConfig[]>([]);
  const [urls, setUrls] = useState<IcalUrl[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyId, setPropertyId] = useState<string>("");
  const [configType, setConfigType] = useState<string>("ota_direct");
  const [channelName, setChannelName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [editConfigId, setEditConfigId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<IcalConfig>>({});
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
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

      // Load iCal configurations
      const { data: configsData, error: configsError } = await supabase
        .from("ical_configs")
        .select("*")
        .eq("host_id", user.id)
        .order("created_at", { ascending: false });

      if (configsError) {
        logError("Failed to load iCal configs", configsError, { component: "ChannelsPage" });
        setErr("Errore nel caricamento delle configurazioni");
        return;
      }

      setConfigs((configsData as IcalConfig[]) || []);

      // Load iCal URLs for all configs
      if (configsData && configsData.length > 0) {
        const configIds = configsData.map(c => c.id);
        const { data: urlsData, error: urlsError } = await supabase
          .from("ical_urls")
          .select("*")
          .in("ical_config_id", configIds)
          .order("created_at", { ascending: false });

        if (urlsError) {
          logError("Failed to load iCal URLs", urlsError, { component: "ChannelsPage" });
        } else {
          setUrls((urlsData as IcalUrl[]) || []);
        }
      }

      logInfo("Successfully loaded channel data", { 
        component: "ChannelsPage", 
        configsCount: configsData?.length || 0,
        urlsCount: urls.length 
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

  async function addConfiguration() {
    setErr(null);
    if (!propertyId) { setErr("Seleziona un appartamento"); return; }
    if (!channelName) { setErr("Inserisci un nome per il canale"); return; }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setErr("Devi effettuare l'accesso"); return; }

      const { error } = await supabase.from("ical_configs").insert({
        property_id: propertyId,
        host_id: user.id,
        config_type: configType,
        channel_manager_name: channelName,
        is_active: true,
      });

      if (error) { 
        logError("Failed to create iCal config", error, { component: "ChannelsPage" });
        setErr(error.message); 
        return; 
      }

      setChannelName("");
      setPropertyId("");
      setConfigType("ota_direct");
      
      toast({
        title: "Configurazione creata",
        description: "La configurazione del canale è stata creata con successo",
      });

      load();
    } catch (error) {
      logError("Unexpected error creating configuration", error, { component: "ChannelsPage" });
      setErr("Errore imprevisto durante la creazione");
    }
  }

  async function testSync(configId: string) {
    if (!configId) {
      toast({
        title: "Errore",
        description: "ID configurazione non valido",
        variant: "destructive",
      });
      return;
    }

    // Check if config has any URLs to sync
    const configUrls = urls.filter(u => u.ical_config_id === configId && u.is_active);
    if (configUrls.length === 0) {
      toast({
        title: "Configurazione incompleta",
        description: "Aggiungi almeno un URL iCal per eseguire la sincronizzazione",
        variant: "destructive",
      });
      return;
    }

    setSyncingIds(prev => new Set(prev).add(configId));
    
    try {
      // For now, we'll use a simplified sync approach
      // In the future, this should call the actual ics-sync function
      const functionUrl = buildFunctionUrl('ics-sync');
      const headers = createFunctionHeaders();
      
      const response = await fetch(`${functionUrl}?config_id=${configId}`, { 
        method: "POST", 
        headers 
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.ok) {
        toast({
          title: "Sync completato",
          description: `Sincronizzazione completata con successo`,
        });
      } else {
        throw new Error(result.error || "Errore sconosciuto durante il sync");
      }
      
      // Reload data to show updated sync status
      await load();
      
    } catch (error) {
      logError("Sync failed", error, { component: "ChannelsPage", configId });
      toast({
        title: "Errore durante il sync",
        description: error instanceof Error ? error.message : "Errore sconosciuto",
        variant: "destructive",
      });
    } finally {
      setSyncingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(configId);
        return newSet;
      });
    }
  }

  function startEdit(config: IcalConfig) {
    setErr(null);
    setEditConfigId(config.id);
    setEditData({
      property_id: config.property_id,
      channel_manager_name: config.channel_manager_name,
      config_type: config.config_type,
    });
  }

  function cancelEdit() { 
    setEditConfigId(null); 
    setEditData({});
  }

  async function saveEdit() {
    setErr(null);
    if (!editConfigId) return;
    if (!editData.property_id) { setErr("Seleziona un appartamento"); return; }
    if (!editData.channel_manager_name?.trim()) { setErr("Inserisci un nome"); return; }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setErr("Devi effettuare l'accesso"); return; }

      const { error } = await supabase.from("ical_configs").update({
        property_id: editData.property_id,
        channel_manager_name: editData.channel_manager_name?.trim(),
        config_type: editData.config_type,
        updated_at: new Date().toISOString(),
      }).eq("id", editConfigId);

      if (error) { 
        logError("Failed to update iCal config", error, { component: "ChannelsPage" });
        setErr(error.message); 
        return; 
      }

      setEditConfigId(null); 
      setEditData({});
      
      toast({
        title: "Configurazione aggiornata",
        description: "Le modifiche sono state salvate con successo",
      });

      load();
    } catch (error) {
      logError("Unexpected error updating configuration", error, { component: "ChannelsPage" });
      setErr("Errore imprevisto durante l'aggiornamento");
    }
  }

  async function deleteConfiguration(id: string) {
    setErr(null);
    if (!confirm("Eliminare questa configurazione? Tutti gli URL associati saranno rimossi.")) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setErr("Devi effettuare l'accesso"); return; }

      // First delete associated URLs
      await supabase.from("ical_urls").delete().eq("ical_config_id", id);

      // Then delete the configuration
      const { error } = await supabase.from("ical_configs").delete().eq("id", id);
      if (error) { 
        logError("Failed to delete iCal config", error, { component: "ChannelsPage" });
        setErr(error.message); 
        return; 
      }

      toast({
        title: "Configurazione eliminata",
        description: "La configurazione è stata rimossa con successo",
      });

      load();
    } catch (error) {
      logError("Unexpected error deleting configuration", error, { component: "ChannelsPage" });
      setErr("Errore imprevisto durante l'eliminazione");
    }
  }

  function getConfigUrls(configId: string): IcalUrl[] {
    return urls.filter(u => u.ical_config_id === configId);
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Channel Manager (ICS)</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Aggiungi configurazione canale</CardTitle>
          {err && <p className="text-sm text-red-600 mb-2">{err}</p>}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
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
            
            <select 
              className="w-full rounded-md border p-2 text-sm" 
              value={configType} 
              onChange={(e) => setConfigType(e.target.value)}
            >
              <option value="ota_direct">OTA Diretti</option>
              <option value="channel_manager">Channel Manager</option>
            </select>
            
            <Input 
              placeholder="Nome canale (es. Airbnb, Booking.com)" 
              value={channelName} 
              onChange={(e) => setChannelName(e.target.value)} 
            />
          </div>
          
          <Button 
            className="bg-orange-600 hover:bg-orange-700 text-white" 
            onClick={addConfiguration}
            disabled={!propertyId || !channelName}
          >
            <Plus className="h-4 w-4 mr-2" />
            Crea Configurazione
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configurazioni canali</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {configs.map(config => {
              const configUrls = getConfigUrls(config.id);
              const isEditing = editConfigId === config.id;
              const property = properties.find(p => p.id === config.property_id);
              
              return (
                <div key={config.id} className="rounded-xl border p-4">
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
                          value={editData.channel_manager_name || ""} 
                          onChange={(e) => setEditData({ ...editData, channel_manager_name: e.target.value })} 
                        />
                        <select 
                          className="rounded-md border p-2 text-sm" 
                          value={editData.config_type || "ota_direct"} 
                          onChange={(e) => setEditData({ ...editData, config_type: e.target.value })}
                        >
                          <option value="ota_direct">OTA Diretti</option>
                          <option value="channel_manager">Channel Manager</option>
                        </select>
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
                          <h3 className="font-semibold">{config.channel_manager_name}</h3>
                          <Badge variant="outline">
                            {config.config_type === 'channel_manager' ? 'Channel Manager' : 'OTA Diretti'}
                          </Badge>
                          {config.is_active ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">Attivo</Badge>
                          ) : (
                            <Badge variant="secondary">Inattivo</Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          Appartamento: {property?.nome || "—"}
                        </div>
                        
                        <div className="text-sm text-gray-500">
                          URL configurati: {configUrls.length}
                          {configUrls.length > 0 && (
                            <span className="ml-2">
                              Attivi: {configUrls.filter(u => u.is_active).length}
                            </span>
                          )}
                        </div>
                        
                        {configUrls.length > 0 && (
                          <div className="mt-2 text-xs text-gray-400">
                            Ultimo sync: {
                              configUrls.find(u => u.last_sync_at)?.last_sync_at 
                                ? new Date(configUrls.find(u => u.last_sync_at)!.last_sync_at!).toLocaleString() 
                                : "mai"
                            }
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => startEdit(config)}>
                          <Edit2 className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          className="text-red-600 border-red-200 hover:bg-red-50" 
                          onClick={() => deleteConfiguration(config.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => testSync(config.id)}
                          disabled={syncingIds.has(config.id) || configUrls.length === 0}
                        >
                          <RefreshCw className={`h-4 w-4 mr-1 ${syncingIds.has(config.id) ? 'animate-spin' : ''}`} />
                          Sync
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {configs.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-8">
                Nessuna configurazione canale creata. Aggiungi la prima configurazione sopra.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 p-4 rounded-xl border bg-orange-50 text-sm text-gray-700 flex items-start gap-2">
        <Calendar className="h-4 w-4 mt-0.5 text-orange-600" />
        <div>
          <p className="font-medium mb-1">Informazioni importanti:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>ICS è soggetto a ritardi di aggiornamento (fino a 24 ore)</li>
            <li>Per risultati immediati, usa blocchi manuali o connettori API certificati</li>
            <li>Ogni configurazione può contenere più URL iCal per diversi canali</li>
          </ul>
        </div>
      </div>
    </div>
  );
}