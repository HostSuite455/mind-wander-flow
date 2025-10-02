import { useEffect, useState } from "react";
import { Property } from "@/lib/properties";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Calendar, AlertCircle, RefreshCw, Trash2 } from "lucide-react";
import { 
  listIcalConfigs, 
  listIcalUrls, 
  createIcalConfig, 
  deleteIcalConfig, 
  deleteIcalUrl,
  syncIcalUrl,
  type IcalConfig,
  type IcalUrl 
} from "@/lib/supaIcal";
import IcalUrlModal from "@/components/IcalUrlModal";

interface Props {
  property: Property;
}

export function PropertyEditSync({ property }: Props) {
  const [configs, setConfigs] = useState<IcalConfig[]>([]);
  const [urls, setUrls] = useState<IcalUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<IcalConfig | null>(null);
  const [editingUrl, setEditingUrl] = useState<IcalUrl | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [property.id]);

  async function loadData() {
    try {
      setLoading(true);
      const [configsResult, urlsResult] = await Promise.all([
        listIcalConfigs(property.id),
        listIcalUrls(property.id)
      ]);

      if (configsResult.error) throw configsResult.error;
      if (urlsResult.error) throw urlsResult.error;

      setConfigs(configsResult.data || []);
      setUrls(urlsResult.data || []);
    } catch (error: any) {
      console.error('Error loading iCal data:', error);
      toast.error('Errore nel caricamento delle configurazioni iCal');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateOtaConfig() {
    try {
      const { data, error } = await createIcalConfig({
        property_id: property.id,
        config_type: 'ota_direct',
      });

      if (error) throw error;
      if (data) {
        toast.success('Configurazione OTA creata');
        await loadData();
        setSelectedConfig(data);
        setShowUrlModal(true);
      }
    } catch (error: any) {
      console.error('Error creating OTA config:', error);
      toast.error(error.message || 'Errore nella creazione della configurazione');
    }
  }

  async function handleDeleteConfig(configId: string) {
    if (!confirm('Eliminare questa configurazione e tutti i suoi URL?')) return;
    
    try {
      const { error } = await deleteIcalConfig(configId);
      if (error) throw error;
      
      toast.success('Configurazione eliminata');
      await loadData();
    } catch (error: any) {
      console.error('Error deleting config:', error);
      toast.error('Errore nell\'eliminazione della configurazione');
    }
  }

  async function handleDeleteUrl(urlId: string) {
    if (!confirm('Eliminare questo URL iCal?')) return;
    
    try {
      const { error } = await deleteIcalUrl(urlId);
      if (error) throw error;
      
      toast.success('URL eliminato');
      await loadData();
    } catch (error: any) {
      console.error('Error deleting URL:', error);
      toast.error('Errore nell\'eliminazione dell\'URL');
    }
  }

  async function handleSyncUrl(urlId: string) {
    try {
      setSyncing(urlId);
      const { error } = await syncIcalUrl(urlId);
      if (error) throw error;
      
      toast.success('Sincronizzazione avviata');
      setTimeout(() => loadData(), 2000);
    } catch (error: any) {
      console.error('Error syncing URL:', error);
      toast.error('Errore nella sincronizzazione');
    } finally {
      setSyncing(null);
    }
  }

  function handleUrlModalSuccess() {
    setShowUrlModal(false);
    setEditingUrl(null);
    setSelectedConfig(null);
    loadData();
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Caricamento configurazioni...</p>
        </CardContent>
      </Card>
    );
  }

  const otaConfig = configs.find(c => c.config_type === 'ota_direct');
  const otaUrls = urls.filter(u => otaConfig && u.ical_config_id === otaConfig.id);

  return (
    <div className="space-y-6">
      {/* Configurazioni iCal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Sincronizzazione Calendari
              </CardTitle>
              <CardDescription>
                Gestisci le fonti iCal per sincronizzare prenotazioni e blocchi
              </CardDescription>
            </div>
            {!otaConfig ? (
              <Button onClick={handleCreateOtaConfig}>
                <Plus className="h-4 w-4 mr-2" />
                Configura iCal
              </Button>
            ) : (
              <Button onClick={() => {
                setSelectedConfig(otaConfig);
                setEditingUrl(null);
                setShowUrlModal(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi URL
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!otaConfig ? (
            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Nessuna configurazione iCal. Clicca "Configura iCal" per iniziare.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Info configurazione */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">OTA Direct</p>
                  <p className="text-sm text-muted-foreground">
                    {otaUrls.length} URL configurati
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={otaConfig.is_active ? 'default' : 'secondary'}>
                    {otaConfig.is_active ? 'Attivo' : 'Inattivo'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteConfig(otaConfig.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Lista URL con pulsante sync */}
              {otaUrls.length === 0 ? (
                <div className="flex items-center gap-2 p-4 border rounded-lg border-dashed">
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Nessun URL configurato. Clicca "Aggiungi URL" per iniziare.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium">URL configurati:</p>
                  {otaUrls.map((url) => (
                    <div key={url.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{url.source || 'iCal'}</p>
                          {url.is_primary && (
                            <Badge variant="outline" className="text-xs">Primary</Badge>
                          )}
                          <Badge variant={url.is_active ? 'default' : 'secondary'} className="text-xs">
                            {url.is_active ? 'Attivo' : 'Inattivo'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-1">{url.url}</p>
                        {url.last_sync_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Ultima sync: {new Date(url.last_sync_at).toLocaleString('it-IT')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSyncUrl(url.id)}
                          disabled={syncing === url.id}
                        >
                          <RefreshCw className={`h-4 w-4 ${syncing === url.id ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUrl(url.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal per aggiungere/modificare URL */}
      {selectedConfig && (
        <IcalUrlModal
          isOpen={showUrlModal}
          onClose={() => {
            setShowUrlModal(false);
            setEditingUrl(null);
            setSelectedConfig(null);
          }}
          onSuccess={handleUrlModalSuccess}
          icalUrl={editingUrl || undefined}
          icalConfigId={selectedConfig.id}
          configType={selectedConfig.config_type}
          mode={editingUrl ? 'edit' : 'create'}
        />
      )}
    </div>
  );
}
