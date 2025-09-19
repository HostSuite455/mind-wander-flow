import { useState, useEffect } from "react";
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
import { IcsPreview } from "@/components/IcsPreview";
import { useActiveProperty } from "@/hooks/useActiveProperty";
import { supaSelect } from "@/lib/supaSafe";
import { 
  listIcalUrls, 
  listIcalConfigs, 
  deleteIcalUrl, 
  formatUrl, 
  getSourceIcon, 
  createIcalConfig,
  type IcalUrl,
  type IcalConfig 
} from "@/lib/supaIcal";

const HostIcalConfig = () => {
  const { id: activePropertyId } = useActiveProperty();
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
  
  // Preview modal
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  // Load initial data
  useEffect(() => {
    loadData();
  }, [activePropertyId]);

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
        activePropertyId !== 'all' ? activePropertyId : undefined
      );
      if (configsError) throw configsError;
      setIcalConfigs(configsData || []);

      // Load iCal URLs
      const { data: urlsData, error: urlsError } = await listIcalUrls(
        activePropertyId !== 'all' ? activePropertyId : undefined
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

  // Get active property info
  const activeProperty = properties.find(p => p.id === activePropertyId);
  const activePropertyName = activeProperty?.nome;

  // Check if active property has channel manager
  const hasChannelManager = icalConfigs.some(
    config => config.property_id === activePropertyId && 
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

  // Group URLs by property
  const urlsByProperty = filteredIcalUrls.reduce((acc, url) => {
    // For now, we'll group by ical_config_id since we don't have direct access to property info in the url
    const key = url.ical_config_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(url);
    return acc;
  }, {} as Record<string, IcalUrl[]>);

  const handleCreateUrl = () => {
    if (activePropertyId === 'all') {
      toast({
        title: "Seleziona una proprietà",
        description: "Devi selezionare una proprietà specifica per aggiungere un link iCal",
        variant: "destructive"
      });
      return;
    }

    // Find or create config for active property
    let config = icalConfigs.find(c => c.property_id === activePropertyId && c.is_active);
    
    if (!config) {
      // Create new config
      const createConfig = async () => {
        const { data: newConfig } = await createIcalConfig({
          property_id: activePropertyId,
          config_type: 'ota_direct',
          is_active: true
        });
        
        if (newConfig) {
          setSelectedConfigId(newConfig.id);
          setModalMode('create');
          setSelectedIcalUrl(null);
          setIsModalOpen(true);
          loadData(); // Reload to get the new config
        }
      };
      createConfig();
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
            
            {/* Active property badge */}
            {activePropertyId !== 'all' && activePropertyName && (
              <div className="mt-4 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <Info className="w-3 h-3 mr-1" />
                  Filtrato per: {activePropertyName}
                </Badge>
              </div>
            )}
          </div>

          {/* Channel Manager Warning */}
          {hasChannelManager && activePropertyId !== 'all' && (
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Questa proprietà usa un Channel Manager — utilizza un solo link iCal master.
              </AlertDescription>
            </Alert>
          )}

          {/* Add New iCal */}
          <Card className="border-hostsuite-primary/20 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-hostsuite-primary">
                <Plus className="w-6 h-6" />
                Aggiungi Nuovo iCal
              </CardTitle>
              <CardDescription>
                Collega una nuova fonte di calendario per sincronizzare le prenotazioni
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Label>Proprietà Attiva</Label>
                  <div className="text-sm text-hostsuite-text">
                    {activePropertyId === 'all' 
                      ? 'Seleziona una proprietà specifica per aggiungere iCal'
                      : activePropertyName || 'Proprietà selezionata'
                    }
                  </div>
                </div>
                
                <Button 
                  onClick={handleCreateUrl}
                  disabled={activePropertyId === 'all'}
                  className="bg-hostsuite-primary hover:bg-hostsuite-primary/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Aggiungi iCal
                </Button>
              </div>
              
              {activePropertyId === 'all' && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Seleziona una proprietà specifica dal menu sopra per aggiungere link iCal.
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
                {filteredIcalUrls.length === 0 ? (
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
                            {/* Show config type for debugging/support */}
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                              OTA Diretto
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
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* iCal URL Modal */}
      <IcalUrlModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
        icalUrl={selectedIcalUrl}
        icalConfigId={selectedConfigId}
        mode={modalMode}
      />

      {/* ICS Preview Modal */}
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