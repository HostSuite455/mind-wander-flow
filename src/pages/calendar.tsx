import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CalendarIcon, RefreshCw, Settings, Clock, ExternalLink, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useActiveProperty } from '@/hooks/useActiveProperty';
import { pickName } from '@/lib/supaSafe';
import { StatusBadge } from '@/components/ui/Badges';
import { EmptyState } from '@/components/ui/EmptyState';
import { IcsPreview } from '@/components/IcsPreview';

interface Property {
  id: string;
  name?: string;
  nome?: string;
  city?: string;
  status?: string;
}

interface IcalConfig {
  id: string;
  property_id: string;
  channel_manager_name: string;
  config_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  host_id?: string;
  api_endpoint?: string;
  api_key_name?: string;
  max_ical_urls?: number;
  provider_config?: any;
  status?: string;
  subscription_tier?: string;
}

interface IcalUrl {
  id: string;
  ical_config_id: string;
  url: string;
  ota_name: string;
  source?: string;
  is_active: boolean;
  is_primary?: boolean;
  last_sync?: string;
  last_sync_at?: string;
  last_sync_status?: string;
  sync_frequency_minutes?: number;
  created_at: string;
  updated_at: string;
}

const Calendar = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [configs, setConfigs] = useState<IcalConfig[]>([]);
  const [urls, setUrls] = useState<IcalUrl[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { id: activeProperty } = useActiveProperty();

  const loadCalendarData = async () => {
    try {
      setIsLoading(true);
      
      // Load properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (propertiesError) throw propertiesError;

      // Load iCal configurations
      const { data: configsData, error: configsError } = await supabase
        .from('ical_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (configsError) throw configsError;

      // Load iCal URLs
      const { data: urlsData, error: urlsError } = await supabase
        .from('ical_urls')
        .select('*')
        .order('created_at', { ascending: false });

      if (urlsError) throw urlsError;

      setProperties(propertiesData || []);
      setConfigs(configsData || []);
      setUrls(urlsData || []);
    } catch (error) {
      console.error('Error loading calendar data:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i dati del calendario",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarData();
  }, []);

  const getPropertyConfigs = (propertyId: string) => {
    return configs.filter(config => config.property_id === propertyId);
  };

  const getPropertyUrls = (propertyId: string) => {
    return urls.filter(url => 
      configs.some(config => config.id === url.ical_config_id && config.property_id === propertyId)
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatUrl = (url: string) => {
    if (url.length > 50) {
      return url.substring(0, 50) + '...';
    }
    return url;
  };

  // Filter properties based on active property
  const filteredProperties = activeProperty && activeProperty !== 'all'
    ? properties.filter(p => p.id === activeProperty)
    : properties;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Skeleton className="h-96 w-full" />
          <div className="lg:col-span-3">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-hostsuite-primary flex items-center gap-3">
              <CalendarIcon className="w-8 h-8" />
              Calendario iCal
            </h1>
            <p className="text-hostsuite-text/60 mt-2">
              Gestisci le configurazioni di sincronizzazione calendario delle tue proprietà
            </p>
          </div>
          <Button onClick={loadCalendarData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Aggiorna
          </Button>
        </div>
      </div>

      {/* Properties List */}
      <div className="space-y-6">
        {filteredProperties.length === 0 ? (
          <EmptyState
            icon={<CalendarIcon className="w-12 h-12 text-hostsuite-primary/30" />}
            title="Nessuna proprietà trovata"
            description="Non ci sono proprietà disponibili per la configurazione del calendario"
          />
        ) : (
          <div className="space-y-6">
            {filteredProperties.map((property) => {
              const propertyConfigs = getPropertyConfigs(property.id);
              const propertyUrls = getPropertyUrls(property.id);
              
              return (
                <Card key={property.id} className="border-hostsuite-primary/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl text-hostsuite-primary">
                          {pickName(property)}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-1">
                          {property.city && (
                            <span>📍 {property.city}</span>
                          )}
                          {'status' in property && property.status && (
                            <StatusBadge status={property.status as any} />
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1">
                          <Settings className="w-3 h-3" />
                          {propertyConfigs.length} Config
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <ExternalLink className="w-3 h-3" />
                          {propertyUrls.length} URL
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Channel Manager Configurations */}
                    {propertyConfigs.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-medium text-hostsuite-primary mb-3 flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Configurazioni Channel Manager ({propertyConfigs.length})
                        </h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Canale</TableHead>
                              <TableHead>Stato</TableHead>
                              <TableHead>Data Creazione</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {propertyConfigs.map((config) => (
                              <TableRow key={config.id}>
                                <TableCell className="font-medium">
                                  {config.channel_manager_name}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={config.is_active ? "default" : "secondary"}>
                                    {config.is_active ? "Attivo" : "Inattivo"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-hostsuite-text/60">
                                  {formatDate(config.created_at)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {/* iCal URLs */}
                    {propertyUrls.length > 0 && (
                      <div>
                        <h4 className="font-medium text-hostsuite-primary mb-3 flex items-center gap-2">
                          <ExternalLink className="w-4 h-4" />
                          URL iCal ({propertyUrls.length})
                        </h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Origine</TableHead>
                              <TableHead>URL</TableHead>
                              <TableHead>Stato</TableHead>
                              <TableHead>Ultima Sync</TableHead>
                              <TableHead>Azioni</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {propertyUrls.map((url) => (
                              <TableRow key={url.id}>
                                <TableCell>
                                  {url.source || '—'}
                                </TableCell>
                                <TableCell>
                                  <code className="text-xs bg-hostsuite-light/20 px-2 py-1 rounded">
                                    {formatUrl(url.url)}
                                  </code>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={url.is_active ? "default" : "secondary"}>
                                    {url.is_active ? "Attivo" : "Inattivo"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-hostsuite-text/50" />
                                    {formatDate(url.last_sync_at)}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" size="sm" className="gap-1">
                                        <Eye className="h-3 w-3" />
                                        Preview
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                                      <DialogHeader>
                                        <DialogTitle>Preview Prenotazioni iCal</DialogTitle>
                                      </DialogHeader>
                                      <IcsPreview url={url.url} />
                                    </DialogContent>
                                  </Dialog>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {propertyConfigs.length === 0 && propertyUrls.length === 0 && (
                      <EmptyState
                        icon={<CalendarIcon className="w-12 h-12 text-hostsuite-primary/30" />}
                        title="Nessuna configurazione"
                        description="Questa proprietà non ha ancora configurazioni iCal attive"
                      />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;