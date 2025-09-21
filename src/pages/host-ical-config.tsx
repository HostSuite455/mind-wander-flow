import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Link as LinkIcon, Plus, Settings, Trash2, Copy, RefreshCw, Info } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import HostNavbar from "@/components/HostNavbar";
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
  formatUrl,
  getSourceIcon,
  type IcalUrl,
  type IcalConfig 
} from "@/lib/supaIcal";

const HostIcalConfig = () => {
  const { id: activePropertyId } = useActiveProperty();
  
  // Local property selector (independent from global)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | 'all'>(() => {
    const stored = localStorage.getItem('ical_selected_property_id');
    return stored || activePropertyId;
  });
  
  const [properties, setProperties] = useState<any[]>([]);
  const [icalUrls, setIcalUrls] = useState<IcalUrl[]>([]);
  const [icalConfigs, setIcalConfigs] = useState<IcalConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
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

  // Load initial data when selectedPropertyId changes
  useEffect(() => {
    loadData();
  }, [selectedPropertyId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load properties
      const { data: propertiesData, error: propertiesError } = await supaSelect('properties', 'id,nome');
      if (propertiesError) throw propertiesError;
      setProperties(propertiesData || []);

      // Load iCal configurations
      const { data: configsData, error: configsError } = await listIcalConfigs(
        selectedPropertyId !== 'all' ? selectedPropertyId : undefined
      );
      if (configsError) throw configsError;
      setIcalConfigs(configsData || []);

      // Load iCal URLs
      const { data: urlsData, error: urlsError } = await listIcalUrls(
        selectedPropertyId !== 'all' ? selectedPropertyId : undefined
      );
      if (urlsError) throw urlsError;
      setIcalUrls(urlsData || []);

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  // Get selected property info
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  const selectedPropertyName = selectedProperty?.nome;

  // Check if selected property has channel manager
  const hasChannelManager = icalConfigs.some(
    config => config.property_id === selectedPropertyId && 
               config.config_type === 'channel_manager' && 
               config.is_active
  );

  // Filter iCal URLs
  const filteredIcalUrls = icalUrls.filter(url => {
    if (statusFilter === 'active' && !url.is_active) return false;
    if (statusFilter === 'inactive' && url.is_active) return false;
    if (sourceFilter !== 'all' && url.source !== sourceFilter) return false;
    return true;
  });

  // Group URLs by property (when showing all)
  const urlsByProperty = useMemo(() => {
    if (selectedPropertyId !== 'all') return {};
    
    return filteredIcalUrls.reduce((acc, url) => {
      // Use property_id from the nested config as the key
      const propertyId = (url as any).ical_configs?.property_id;
      if (propertyId) {
        if (!acc[propertyId]) acc[propertyId] = [];
        acc[propertyId].push(url);
      }
      return acc;
    }, {} as Record<string, IcalUrl[]>);
  }, [filteredIcalUrls, selectedPropertyId]);

  const handleCreateConfiguration = () => {
    if (selectedPropertyId === 'all') {
      toast({
        title: "Seleziona una proprietà",
        description: "Devi selezionare una proprietà specifica per creare una configurazione",
        variant: "destructive"
      });
      return;
    }

    setIsWizardOpen(true);
  };

  const handleCreateUrl = () => {
    if (selectedPropertyId === 'all') {
      toast({
        title: "Seleziona una proprietà",
        description: "Devi selezionare una proprietà specifica per aggiungere un link iCal",
        variant: "destructive"
      });
      return;
    }

    // Find or create config for selected property
    let config = icalConfigs.find(c => c.property_id === selectedPropertyId && c.is_active);
    
    if (!config) {
      // Redirect to wizard for new configuration
      handleCreateConfiguration();
      return;
    }

    setSelectedConfigId(config.id);
    setModalMode('create');
    setSelectedIcalUrl(null);
    setIsModalOpen(true);
  };

  const handleEditUrl = (icalUrl: IcalUrl) => {
    setSelectedIcalUrl(icalUrl);
    setSelectedConfigId(icalUrl.ical_config_id);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteUrl = async (icalUrl: IcalUrl) => {
    if (!confirm('Sei sicuro di voler eliminare questo link iCal?')) {
      return;
    }

    const { error } = await deleteIcalUrl(icalUrl.id);
    if (!error) {
      loadData();
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Copiato",
        description: "URL copiato negli appunti"
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        title: "Errore",
        description: "Impossibile copiare l'URL",
        variant: "destructive"
      });
    }
  };

  const handleSyncPreview = (url: string) => {
    setPreviewUrl(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <HostNavbar />
        <div className="pt-20 container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <HostNavbar />
        <div className="pt-20 container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-hostsuite-primary mb-2">Configurazione iCal</h1>
            <p className="text-hostsuite-text">Sincronizza i calendari delle tue proprietà con le piattaforme di booking</p>
          </div>

          {/* Local Property Selector */}
          <div className="mb-6">
            <PropertySwitch
              value={selectedPropertyId}
              onChange={setSelectedPropertyId}
              items={properties}
              label="Proprietà"
              className="max-w-md"
            />
            
            {/* Selected property info */}
            {selectedPropertyId !== 'all' && selectedPropertyName && (
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <Info className="w-3 h-3 mr-1" />
                  Proprietà attiva: {selectedPropertyName}
                </Badge>
              </div>
            )}
          </div>

          {/* Channel Manager Warning */}
          {hasChannelManager && selectedPropertyId !== 'all' && (
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Questa proprietà usa un Channel Manager — utilizza un solo link iCal master.
              </AlertDescription>
            </Alert>
          )}

          {/* Add New Configuration */}
          <Card className="border-hostsuite-primary/20 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-hostsuite-primary">
                <Plus className="w-6 h-6" />
                Nuova Configurazione Calendario
              </CardTitle>
              <CardDescription>
                Configura un Channel Manager o aggiungi piattaforme OTA dirette
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Label>Proprietà Selezionata</Label>
                  <div className="text-sm text-hostsuite-text">
                    {selectedPropertyId === 'all' 
                      ? 'Seleziona una proprietà specifica per configurare'
                      : selectedPropertyName || 'Proprietà selezionata'
                    }
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCreateConfiguration}
                    disabled={selectedPropertyId === 'all'}
                    className="bg-hostsuite-primary hover:bg-hostsuite-primary/90 disabled:opacity-50"
                    title={selectedPropertyId === 'all' ? 'Seleziona una proprietà per configurare' : ''}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configura
                  </Button>
                  
                  <Button 
                    onClick={handleCreateUrl}
                    disabled={selectedPropertyId === 'all' || !icalConfigs.some(c => c.property_id === selectedPropertyId && c.is_active)}
                    variant="outline"
                    title={
                      selectedPropertyId === 'all' 
                        ? 'Seleziona una proprietà per aggiungere iCal' 
                        : !icalConfigs.some(c => c.property_id === selectedPropertyId && c.is_active)
                        ? 'Crea prima una configurazione'
                        : 'Aggiungi URL iCal a configurazione esistente'
                    }
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Aggiungi iCal
                  </Button>
                </div>
              </div>
              
              {selectedPropertyId === 'all' && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Seleziona una proprietà specifica dal menu sopra per iniziare la configurazione.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Filters */}
          <Card className="border-hostsuite-primary/20 mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Stato:</Label>
                  <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti</SelectItem>
                      <SelectItem value="active">Solo attivi</SelectItem>
                      <SelectItem value="inactive">Solo inattivi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="text-sm">Sorgente:</Label>
                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutte</SelectItem>
                      <SelectItem value="Airbnb">Airbnb</SelectItem>
                      <SelectItem value="Booking.com">Booking.com</SelectItem>
                      <SelectItem value="VRBO">VRBO</SelectItem>
                      <SelectItem value="Smoobu">Smoobu</SelectItem>
                      <SelectItem value="Other">Altro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Configurations */}
          <Card className="border-hostsuite-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-hostsuite-primary">
                <Calendar className="w-6 h-6" />
                Configurazioni Esistenti
              </CardTitle>
              <CardDescription>
                Gestisci le tue configurazioni iCal attive
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedPropertyId === 'all' ? (
                  // Show grouped view when "all" properties selected
                  Object.keys(urlsByProperty).length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-hostsuite-primary/30 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-hostsuite-text mb-2">
                        Nessuna configurazione iCal
                      </h3>
                      <p className="text-hostsuite-text/60">
                        Seleziona una proprietà e aggiungi la tua prima configurazione iCal
                      </p>
                    </div>
                  ) : (
                    Object.entries(urlsByProperty).map(([propertyId, urls]: [string, IcalUrl[]]) => {
                      const property = properties.find(p => p.id === propertyId);
                      return (
                        <div key={propertyId} className="space-y-3">
                          <div className="flex items-center gap-2 border-b pb-2">
                            <h4 className="font-semibold text-hostsuite-primary">
                              {property?.nome || 'Proprietà sconosciuta'}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {urls.length} iCal
                            </Badge>
                          </div>
                          {urls.map((icalUrl) => (
                            <div 
                              key={icalUrl.id}
                              className="p-4 border border-hostsuite-primary/20 rounded-lg ml-4"
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className="text-lg">{getSourceIcon(icalUrl.source)}</span>
                                    <h3 className="font-semibold text-hostsuite-primary">
                                      {icalUrl.source}
                                    </h3>
                                    <Badge 
                                      variant={icalUrl.is_active ? "default" : "secondary"}
                                      className={icalUrl.is_active ? "bg-green-100 text-green-800" : ""}
                                    >
                                      {icalUrl.is_active ? 'Attivo' : 'Inattivo'}
                                    </Badge>
                                    {icalUrl.is_primary && (
                                      <Badge variant="outline" className="text-xs">
                                        Principale
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                      {(icalUrl as any).ical_configs?.config_type === 'channel_manager' ? 'Channel Manager' : 'OTA Diretto'}
                                    </Badge>
                                  </div>
                                  <div className="space-y-1 text-sm text-hostsuite-text">
                                    <div className="flex items-center gap-2">
                                      <LinkIcon className="w-3 h-3" />
                                      <span className="font-mono text-xs break-all">
                                        {formatUrl(icalUrl.url)}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={() => handleCopyUrl(icalUrl.url)}
                                      >
                                        <Copy className="w-3 h-3" />
                                      </Button>
                                    </div>
                                    {icalUrl.last_sync_at && (
                                      <div>Ultima sincronizzazione: {new Date(icalUrl.last_sync_at).toLocaleString()}</div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleEditUrl(icalUrl)}
                                  >
                                    <Settings className="w-3 h-3 mr-1" />
                                    Modifica
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleSyncPreview(icalUrl.url)}
                                  >
                                    <RefreshCw className="w-3 h-3 mr-1" />
                                    Anteprima
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleDeleteUrl(icalUrl)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-3 h-3 mr-1" />
                                    Elimina
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })
                  )
                ) : (
                  // Show filtered view for specific property
                  filteredIcalUrls.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-hostsuite-primary/30 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-hostsuite-text mb-2">
                        {icalUrls.length === 0 
                          ? 'Nessuna configurazione iCal'
                          : 'Nessun risultato trovato'
                        }
                      </h3>
                      <p className="text-hostsuite-text/60">
                        {icalUrls.length === 0 
                          ? 'Aggiungi la tua prima configurazione iCal per sincronizzare i calendari'
                          : 'Modifica i filtri per vedere altre configurazioni'
                        }
                      </p>
                    </div>
                  ) : (
                    filteredIcalUrls.map((icalUrl) => (
                      <div 
                        key={icalUrl.id}
                        className="p-4 border border-hostsuite-primary/20 rounded-lg"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-lg">{getSourceIcon(icalUrl.source)}</span>
                              <h3 className="font-semibold text-hostsuite-primary">
                                {icalUrl.source}
                              </h3>
                              <Badge 
                                variant={icalUrl.is_active ? "default" : "secondary"}
                                className={icalUrl.is_active ? "bg-green-100 text-green-800" : ""}
                              >
                                {icalUrl.is_active ? 'Attivo' : 'Inattivo'}
                              </Badge>
                              {icalUrl.is_primary && (
                                <Badge variant="outline" className="text-xs">
                                  Principale
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                {(icalUrl as any).ical_configs?.config_type === 'channel_manager' ? 'Channel Manager' : 'OTA Diretto'}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm text-hostsuite-text">
                              <div className="flex items-center gap-2">
                                <LinkIcon className="w-3 h-3" />
                                <span className="font-mono text-xs break-all">
                                  {formatUrl(icalUrl.url)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleCopyUrl(icalUrl.url)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                              {icalUrl.last_sync_at && (
                                <div>Ultima sincronizzazione: {new Date(icalUrl.last_sync_at).toLocaleString()}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditUrl(icalUrl)}
                            >
                              <Settings className="w-3 h-3 mr-1" />
                              Modifica
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleSyncPreview(icalUrl.url)}
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Anteprima
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleDeleteUrl(icalUrl)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Elimina
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Single property view with calendar blocks */}
          {selectedPropertyId !== 'all' && (
            <CalendarBlocksCard 
              propertyId={selectedPropertyId}
              propertyName={selectedPropertyName || 'Proprietà'}
            />
          )}
        </div>
      </div>

      {/* Configuration Wizard */}
      <ChannelManagerWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={loadData}
        propertyId={selectedPropertyId}
        propertyName={selectedPropertyName || 'Proprietà selezionata'}
      />

      {/* Add/Edit iCal URL Modal */}
      <IcalUrlModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
        icalUrl={selectedIcalUrl}
        icalConfigId={selectedConfigId}
        mode={modalMode}
      />

      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Anteprima Calendario</h3>
              <Button variant="ghost" size="sm" onClick={() => setPreviewUrl(null)}>
                ✕
              </Button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
              <IcsPreview url={previewUrl} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HostIcalConfig;