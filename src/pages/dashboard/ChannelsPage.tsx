import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RefreshCw, Calendar, Plus, Edit2, Trash2, Save, X, Copy, Key, Loader2, Check, AlertCircle, Link as LinkIcon, Settings, Info, Filter, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getFnsBase } from "@/lib/supaFns";
import { logError, logInfo, logWarn } from "@/lib/log";
import PropertySwitch from "@/components/PropertySwitch";
import IcalUrlModal from "@/components/IcalUrlModal";
import ChannelManagerWizard from "@/components/ChannelManagerWizard";
import { IcsPreview } from "@/components/IcsPreview";
import { CalendarBlocksCard } from "@/components/CalendarBlocksCard";
import { useActiveProperty } from "@/hooks/useActiveProperty";
import { supaSelect } from "@/lib/supaSafe";
import { 
  listIcalUrls, 
  listIcalConfigs, 
  deleteIcalUrl, 
  createIcalConfig,
  deleteIcalConfig,
  createIcalUrl,
  updateIcalUrl,
  syncIcalUrl,
  formatUrl,
  getSourceIcon,
  type IcalUrl,
  type IcalConfig 
} from "@/lib/supaIcal";

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
  const { id: activePropertyId } = useActiveProperty();
  
  // Local property selector (independent from global)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | 'all'>(() => {
    const stored = localStorage.getItem('ical_selected_property_id');
    return stored || activePropertyId;
  });
  
  const [accounts, setAccounts] = useState<ChannelAccount[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [icalUrls, setIcalUrls] = useState<IcalUrl[]>([]);
  const [icalConfigs, setIcalConfigs] = useState<IcalConfig[]>([]);
  const [propertyId, setPropertyId] = useState<string>("");
  const [channelName, setChannelName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [editAccountId, setEditAccountId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<ChannelAccount>>({});
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Modal states for iCal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedIcalUrl, setSelectedIcalUrl] = useState<IcalUrl | null>(null);
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
  
  // Wizard states
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  
  // Preview modal
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  // Initialize selectedPropertyId from global on mount (only once)
  useEffect(() => {
    if (!localStorage.getItem('ical_selected_property_id')) {
      setSelectedPropertyId(activePropertyId);
    }
  }, [activePropertyId]);

  // Save selectedPropertyId to localStorage
  useEffect(() => {
    if (selectedPropertyId === 'all') {
      localStorage.removeItem('ical_selected_property_id');
    } else {
      localStorage.setItem('ical_selected_property_id', selectedPropertyId);
    }
  }, [selectedPropertyId]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      // Load properties
      const { data: propsData, error: propsError } = await supaSelect(
        supabase.from("properties").select("id, nome")
      );
      if (propsError) throw propsError;
      setProperties(propsData || []);

      // Load channel accounts
      const { data: accountsData, error: accountsError } = await supaSelect(
        supabase.from("channel_accounts").select("*")
      );
      if (accountsError) throw accountsError;
      setAccounts(accountsData || []);

      // Load iCal URLs
      const { data: urlsData, error: urlsError } = await listIcalUrls(
        selectedPropertyId !== 'all' ? selectedPropertyId : undefined
      );
      if (urlsError) throw urlsError;
      setIcalUrls(urlsData || []);

      // Load iCal configs
      const { data: configsData, error: configsError } = await listIcalConfigs(
        selectedPropertyId !== 'all' ? selectedPropertyId : undefined
      );
      if (configsError) throw configsError;
      setIcalConfigs(configsData || []);

    } catch (error) {
      logError("Failed to load data", error, { component: "ChannelsPage" });
      setErr(error instanceof Error ? error.message : "Errore nel caricamento dei dati");
    } finally {
      setLoading(false);
    }
  }

  // Reload when selectedPropertyId changes
  useEffect(() => {
    load();
  }, [selectedPropertyId]);

  const handleCreateConfig = async () => {
    if (selectedPropertyId === 'all') {
      toast({
        title: "Errore",
        description: "Seleziona una proprietà specifica per creare una configurazione iCal",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await createIcalConfig({ property_id: selectedPropertyId });
      if (error) throw error;
      
      toast({
        title: "Successo",
        description: "Configurazione iCal creata con successo",
      });
      
      await load(); // Reload data
    } catch (error) {
      logError("Failed to create iCal config", error, { component: "ChannelsPage" });
      toast({
        title: "Errore",
        description: "Errore nella creazione della configurazione iCal",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfig = async (configId: string) => {
    try {
      const { error } = await deleteIcalConfig(configId);
      if (error) throw error;
      
      toast({
        title: "Successo",
        description: "Configurazione iCal eliminata con successo",
      });
      
      await load(); // Reload data
    } catch (error) {
      logError("Failed to delete iCal config", error, { component: "ChannelsPage" });
      toast({
        title: "Errore",
        description: "Errore nell'eliminazione della configurazione iCal",
        variant: "destructive",
      });
    }
  };

  const handleCreateUrl = async (data: { url: string; source: string; is_active: boolean; is_primary: boolean }) => {
    if (!selectedConfigId) {
      toast({
        title: "Errore",
        description: "Seleziona una configurazione per aggiungere un URL",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await createIcalUrl({
        ical_config_id: selectedConfigId,
        ...data
      });
      if (error) throw error;
      
      toast({
        title: "Successo",
        description: "URL iCal aggiunto con successo",
      });
      
      setIsModalOpen(false);
      await load(); // Reload data
    } catch (error) {
      logError("Failed to create iCal URL", error, { component: "ChannelsPage" });
      toast({
        title: "Errore",
        description: "Errore nell'aggiunta dell'URL iCal",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUrl = async (data: { url: string; source: string; is_active: boolean; is_primary: boolean }) => {
    if (!selectedIcalUrl) return;

    try {
      const { error } = await updateIcalUrl(selectedIcalUrl.id, data);
      if (error) throw error;
      
      toast({
        title: "Successo",
        description: "URL iCal aggiornato con successo",
      });
      
      setIsModalOpen(false);
      await load(); // Reload data
    } catch (error) {
      logError("Failed to update iCal URL", error, { component: "ChannelsPage" });
      toast({
        title: "Errore",
        description: "Errore nell'aggiornamento dell'URL iCal",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUrl = async (urlId: string) => {
    try {
      const { error } = await deleteIcalUrl(urlId);
      if (error) throw error;
      
      toast({
        title: "Successo",
        description: "URL iCal eliminato con successo",
      });
      
      await load(); // Reload data
    } catch (error) {
      logError("Failed to delete iCal URL", error, { component: "ChannelsPage" });
      toast({
        title: "Errore",
        description: "Errore nell'eliminazione dell'URL iCal",
        variant: "destructive",
      });
    }
  };

  const handleSyncUrl = async (urlId: string) => {
    try {
      setSyncingId(urlId);
      const { error } = await syncIcalUrl(urlId);
      if (error) throw error;
      
      toast({
        title: "Successo",
        description: "Sincronizzazione completata con successo",
      });
      
      await load(); // Reload data
    } catch (error) {
      logError("Failed to sync iCal URL", error, { component: "ChannelsPage" });
      toast({
        title: "Errore",
        description: "Errore nella sincronizzazione dell'URL iCal",
        variant: "destructive",
      });
    } finally {
      setSyncingId(null);
    }
  };

  async function createChannel() {
    if (!propertyId || !channelName) {
      setErr("Seleziona una proprietà e inserisci un nome per il canale");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("channel_accounts")
        .insert({
          property_id: propertyId,
          name: channelName,
          kind: "manual",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Canale creato con successo",
      });

      setPropertyId("");
      setChannelName("");
      await load();
    } catch (error) {
      logError("Failed to create channel", error, { component: "ChannelsPage" });
      setErr(error instanceof Error ? error.message : "Errore nella creazione del canale");
    }
  }

  async function saveEdit(accountId: string) {
    try {
      const { error } = await supabase
        .from("channel_accounts")
        .update(editData)
        .eq("id", accountId);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Account aggiornato con successo",
      });

      setEditAccountId(null);
      setEditData({});
      await load();
    } catch (error) {
      logError("Failed to update account", error, { component: "ChannelsPage" });
      setErr(error instanceof Error ? error.message : "Errore nell'aggiornamento dell'account");
    }
  }

  async function deleteAccount(accountId: string) {
    try {
      const { error } = await supabase
        .from("channel_accounts")
        .delete()
        .eq("id", accountId);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Account eliminato con successo",
      });

      await load();
    } catch (error) {
      logError("Failed to delete account", error, { component: "ChannelsPage" });
      setErr(error instanceof Error ? error.message : "Errore nell'eliminazione dell'account");
    }
  }

  async function syncAccount(accountId: string) {
    setSyncingId(accountId);
    try {
      const fnsBase = getFnsBase();
      const response = await fetch(`${fnsBase}/sync-smoobu-bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel_account_id: accountId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Sync failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      logInfo("Sync completed", result, { component: "ChannelsPage" });

      toast({
        title: "Successo",
        description: "Sincronizzazione completata con successo",
      });

      await load();
    } catch (error) {
      logError("Failed to sync account", error, { component: "ChannelsPage" });
      toast({
        title: "Errore",
        description: "Errore nella sincronizzazione",
        variant: "destructive",
      });
    } finally {
      setSyncingId(null);
    }
  }

  function startEdit(account: ChannelAccount) {
    setEditAccountId(account.id);
    setEditData({
      name: account.name,
      property_id: account.property_id,
      ics_export_token: account.ics_export_token,
      ics_pull_url: account.ics_pull_url,
    });
  }

  function cancelEdit() {
    setEditAccountId(null);
    setEditData({});
  }

  const getPropertyName = (propertyId?: string) => {
    if (!propertyId) return "Nessuna proprietà";
    const property = properties.find(p => p.id === propertyId);
    return property?.nome || "Proprietà sconosciuta";
  };

  const getStatusBadge = (account: ChannelAccount) => {
    if (account.last_sync_status === 'success') {
      return <Badge variant="default" className="bg-green-100 text-green-800">Attivo</Badge>;
    } else if (account.last_sync_status === 'error') {
      return <Badge variant="destructive">Errore</Badge>;
    } else {
      return <Badge variant="secondary">Non sincronizzato</Badge>;
    }
  };

  const formatLastSync = (lastSyncAt?: string) => {
    if (!lastSyncAt) return "Mai";
    return new Date(lastSyncAt).toLocaleString('it-IT');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiato",
      description: "Testo copiato negli appunti",
    });
  };

  const openCreateModal = (configId: string) => {
    setSelectedConfigId(configId);
    setModalMode('create');
    setSelectedIcalUrl(null);
    setIsModalOpen(true);
  };

  const openEditModal = (url: IcalUrl) => {
    setSelectedIcalUrl(url);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  // Filter iCal URLs based on filters
  const filteredIcalUrls = useMemo(() => {
    return icalUrls.filter(url => {
      if (statusFilter !== 'all') {
        const isActive = url.is_active;
        if (statusFilter === 'active' && !isActive) return false;
        if (statusFilter === 'inactive' && isActive) return false;
      }
      
      if (sourceFilter !== 'all' && url.source !== sourceFilter) {
        return false;
      }
      
      return true;
    });
  }, [icalUrls, statusFilter, sourceFilter]);

  // Get unique sources for filter
  const uniqueSources = useMemo(() => {
    const sources = [...new Set(icalUrls.map(url => url.source))];
    return sources.sort();
  }, [icalUrls]);

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Caricamento...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Channel Manager</h1>
          <p className="text-muted-foreground mt-2">
            Gestisci i tuoi canali di prenotazione e le configurazioni iCal
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsWizardOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi nuovo canale
          </Button>
        </div>
      </div>

      {err && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      )}

      {/* Property Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Seleziona Proprietà
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleziona una proprietà" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte le proprietà</SelectItem>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* iCal Configurations Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Configurazioni iCal
              </CardTitle>
              <CardDescription>
                Gestisci le configurazioni iCal per importare prenotazioni da fonti esterne
              </CardDescription>
            </div>
            <Button 
              onClick={handleCreateConfig}
              disabled={selectedPropertyId === 'all'}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuova Configurazione
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {icalConfigs.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna configurazione iCal</h3>
              <p className="text-gray-500 mb-4">
                Crea la prima configurazione iCal per gestire le prenotazioni
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {icalConfigs.map((config) => (
                <div key={config.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">
                          Configurazione per {getPropertyName(config.property_id)}
                        </span>
                      </div>
                      <Badge variant={config.is_active ? "default" : "secondary"}>
                        {config.is_active ? "Attiva" : "Inattiva"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openCreateModal(config.id)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Aggiungi URL
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteConfig(config.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* URLs for this config */}
                  <div className="space-y-2">
                    {filteredIcalUrls
                      .filter(url => url.ical_config_id === config.id)
                      .map((url) => (
                        <div key={url.id} className="bg-gray-50 rounded p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <span className="text-2xl">{getSourceIcon(url.source)}</span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{url.source}</span>
                                  {url.is_primary && (
                                    <Badge variant="outline" className="text-xs">
                                      Primario
                                    </Badge>
                                  )}
                                  <Badge variant={url.is_active ? "default" : "secondary"} className="text-xs">
                                    {url.is_active ? "Attivo" : "Inattivo"}
                                  </Badge>
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {formatUrl(url.url)}
                                </div>
                                {url.last_sync_at && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Ultima sincronizzazione: {formatLastSync(url.last_sync_at)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(url.url)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSyncUrl(url.id)}
                                disabled={syncingId === url.id}
                              >
                                {syncingId === url.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditModal(url)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteUrl(url.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      {icalUrls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="status-filter">Stato</Label>
                <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}>
                  <SelectTrigger id="status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti</SelectItem>
                    <SelectItem value="active">Attivi</SelectItem>
                    <SelectItem value="inactive">Inattivi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="source-filter">Fonte</Label>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger id="source-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le fonti</SelectItem>
                    {uniqueSources.map((source) => (
                      <SelectItem key={source} value={source}>
                        {getSourceIcon(source)} {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar Blocks Card */}
      {selectedPropertyId !== 'all' && (
        <CalendarBlocksCard propertyId={selectedPropertyId} />
      )}

      {/* Account canali configurati */}
      <Card>
        <CardHeader>
          <CardTitle>Account canali configurati</CardTitle>
          <CardDescription>
            Gestisci account canali intelligenti. Aggiungi nuovi account sopra.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-8">
              <Info className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nessun account canale intelligente configurato</p>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => (
                <div key={account.id} className="border rounded-lg p-4">
                  {editAccountId === account.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit-name">Nome</Label>
                          <Input
                            id="edit-name"
                            value={editData.name || ""}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-property">Proprietà</Label>
                          <Select
                            value={editData.property_id || ""}
                            onValueChange={(value) => setEditData({ ...editData, property_id: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona proprietà" />
                            </SelectTrigger>
                            <SelectContent>
                              {properties.map((property) => (
                                <SelectItem key={property.id} value={property.id}>
                                  {property.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit-token">Token Export ICS</Label>
                          <Input
                            id="edit-token"
                            value={editData.ics_export_token || ""}
                            onChange={(e) => setEditData({ ...editData, ics_export_token: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-pull-url">URL Pull ICS</Label>
                          <Input
                            id="edit-pull-url"
                            value={editData.ics_pull_url || ""}
                            onChange={(e) => setEditData({ ...editData, ics_pull_url: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => saveEdit(account.id)} size="sm">
                          <Save className="h-4 w-4 mr-2" />
                          Salva
                        </Button>
                        <Button onClick={cancelEdit} variant="outline" size="sm">
                          <X className="h-4 w-4 mr-2" />
                          Annulla
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">{account.name}</h3>
                          {getStatusBadge(account)}
                          <Badge variant="outline">{account.kind}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Proprietà: {getPropertyName(account.property_id)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Ultima sincronizzazione: {formatLastSync(account.last_sync_at)}
                        </p>
                        {account.ics_export_token && (
                          <div className="flex items-center gap-2 mt-2">
                            <Key className="h-4 w-4 text-gray-400" />
                            <span className="text-xs text-gray-500">Token configurato</span>
                          </div>
                        )}
                        {account.ics_pull_url && (
                          <div className="flex items-center gap-2">
                            <LinkIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-xs text-gray-500 truncate max-w-xs">
                              {account.ics_pull_url}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(account.ics_pull_url!)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => syncAccount(account.id)}
                          disabled={syncingId === account.id}
                          size="sm"
                          variant="outline"
                        >
                          {syncingId === account.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                        <Button onClick={() => startEdit(account)} size="sm" variant="outline">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => deleteAccount(account.id)} size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Functionality Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Calendar className="h-5 w-5" />
              Funzionalità calendario
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-900">Copy Export URL iCal</p>
                <p className="text-sm text-blue-700">Copia l'URL iCal per permettere ai canali esterni di leggere disponibilità</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-900">Import prenotazioni iCal</p>
                <p className="text-sm text-blue-700">Importa prenotazioni dai canali esterni via URL iCal</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-900">Ogni canale può avere associata una singola proprietà</p>
                <p className="text-sm text-blue-700">Ogni canale può essere associato a una singola proprietà</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-100 border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="h-5 w-5" />
              Funzionalità mancanti
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <X className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-900">ICS è oggetto di stub e non implementato</p>
                <p className="text-sm text-amber-700">Gli endpoint ICS per l'export non sono ancora implementati</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <X className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-900">Ogni canale può essere associato a una singola proprietà</p>
                <p className="text-sm text-amber-700">Non è possibile associare un canale a più proprietà</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <IcalUrlModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        onSubmit={modalMode === 'create' ? handleCreateUrl : handleUpdateUrl}
        initialData={selectedIcalUrl}
      />

      <ChannelManagerWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={() => {
          setIsWizardOpen(false);
          load();
        }}
        properties={properties}
      />

      {previewUrl && (
        <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Anteprima ICS</DialogTitle>
            </DialogHeader>
            <IcsPreview url={previewUrl} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}