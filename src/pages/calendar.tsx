import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/Badges";
import { 
  Calendar as CalendarIcon, 
  RefreshCw, 
  Search, 
  Filter,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supaSelect, pickName } from "@/lib/supaSafe";
import HostNavbar from "@/components/HostNavbar";

interface Property {
  id: string;
  host_id: string;
  nome?: string;
  name?: string;
  city?: string;
  status?: string;
}

interface IcalConfig {
  id: string;
  property_id: string;
  channel_manager_name?: string;
  config_type?: string;
  is_active?: boolean;
  last_sync_at?: string;
  created_at: string;
  status?: string;
}

interface IcalUrl {
  id: string;
  property_id?: string;
  url: string;
  source?: string;
  is_active?: boolean;
  last_sync_at?: string;
  created_at: string;
}

const Calendar = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [icalConfigs, setIcalConfigs] = useState<IcalConfig[]>([]);
  const [icalUrls, setIcalUrls] = useState<IcalUrl[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProperty, setSelectedProperty] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all"); // all, active, inactive
  
  const { toast } = useToast();

  useEffect(() => {
    loadCalendarData();
  }, []);

  const loadCalendarData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [propertiesResult, icalConfigsResult, icalUrlsResult] = await Promise.all([
        supaSelect<Property>('properties', 'id, host_id, city, status, nome, name'),
        supaSelect<IcalConfig>('ical_configs', 'id, property_id, channel_manager_name, config_type, is_active, last_sync_at, created_at, status'),
        supaSelect<IcalUrl>('ical_urls', 'id, property_id, url, source, is_active, last_sync_at, created_at')
      ]);

      setProperties(propertiesResult.data || []);
      setIcalConfigs(icalConfigsResult.data || []);
      setIcalUrls(icalUrlsResult.data || []);

      if (propertiesResult.error || icalConfigsResult.error || icalUrlsResult.error) {
        setError("Errore nel caricamento di alcuni dati");
      }

    } catch (err) {
      console.error('Error loading calendar data:', err);
      setError("Errore nel caricamento dei dati del calendario");
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Errore nel caricamento dei dati del calendario",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered data
  const filteredData = useMemo(() => {
    const term = (searchTerm ?? '').toLowerCase();
    const propId = selectedProperty === 'all' ? null : selectedProperty;
    
    let filteredProps = properties.filter(prop => {
      const name = pickName(prop).toLowerCase();
      const matchesSearch = name.includes(term);
      const matchesProperty = !propId || prop.id === propId;
      return matchesSearch && matchesProperty;
    });

    // Filter by active status if needed
    if (activeFilter !== 'all') {
      const isActiveFilter = activeFilter === 'active';
      filteredProps = filteredProps.filter(prop => {
        const hasConfigs = icalConfigs.some(config => 
          config.property_id === prop.id && config.is_active === isActiveFilter
        );
        const hasUrls = icalUrls.some(url => 
          url.property_id === prop.id && url.is_active === isActiveFilter
        );
        return hasConfigs || hasUrls;
      });
    }

    return filteredProps;
  }, [properties, icalConfigs, icalUrls, searchTerm, selectedProperty, activeFilter]);

  const getPropertyConfigs = (propertyId: string) => {
    return icalConfigs
      .filter(config => config.property_id === propertyId)
      .slice(0, 10); // Latest 10
  };

  const getPropertyUrls = (propertyId: string) => {
    return icalUrls
      .filter(url => url.property_id === propertyId)
      .slice(0, 10); // Latest 10
  };

  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return `${urlObj.hostname}…`;
    } catch {
      return url.length > 30 ? `${url.substring(0, 30)}…` : url;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <HostNavbar />
        <div className="pt-16">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-6">
              <Skeleton className="h-16 w-full" />
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <Skeleton className="h-96 w-full" />
                <div className="lg:col-span-3">
                  <Skeleton className="h-96 w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <HostNavbar />
      <div className="pt-16">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
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

          {error && (
            <div className="mb-6">
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-red-700">
                    <XCircle className="w-5 h-5" />
                    <p>{error}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Sidebar Filters */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filtri
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Search */}
                  <div>
                    <label className="text-sm font-medium text-hostsuite-text mb-2 block">
                      Cerca proprietà
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-hostsuite-text/50" />
                      <Input
                        placeholder="Nome proprietà..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Property Filter */}
                  <div>
                    <label className="text-sm font-medium text-hostsuite-text mb-2 block">
                      Proprietà
                    </label>
                    <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tutte le proprietà" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutte le proprietà</SelectItem>
                        {properties.map((prop) => (
                          <SelectItem key={prop.id} value={prop.id}>
                            {pickName(prop)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Active Filter */}
                  <div>
                    <label className="text-sm font-medium text-hostsuite-text mb-2 block">
                      Stato
                    </label>
                    <Select value={activeFilter} onValueChange={setActiveFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutti</SelectItem>
                        <SelectItem value="active">Solo attivi</SelectItem>
                        <SelectItem value="inactive">Solo inattivi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Stats */}
                  <div className="pt-4 border-t">
                    <div className="text-sm text-hostsuite-text/60 space-y-1">
                      <div>Proprietà: {filteredData.length}</div>
                      <div>Configurazioni: {icalConfigs.length}</div>
                      <div>URL iCal: {icalUrls.length}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {filteredData.length === 0 ? (
                <EmptyState
                  icon={<CalendarIcon className="w-16 h-16 text-hostsuite-primary/30" />}
                  title={searchTerm || selectedProperty !== 'all' ? "Nessuna proprietà trovata" : "Nessuna configurazione disponibile"}
                  description={searchTerm || selectedProperty !== 'all' ? "Prova a modificare i filtri di ricerca" : "Configura le prime sincronizzazioni iCal per le tue proprietà"}
                />
              ) : (
                <div className="space-y-6" aria-busy={isLoading}>
                  {filteredData.map((property) => {
                    const configs = getPropertyConfigs(property.id);
                    const urls = getPropertyUrls(property.id);
                    
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
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-6">
                          
                          {/* iCal Configs */}
                          {configs.length > 0 && (
                            <div>
                              <h4 className="font-medium text-hostsuite-primary mb-3 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Configurazioni iCal ({configs.length})
                              </h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Tipo/Manager</TableHead>
                                    <TableHead>Stato</TableHead>
                                    <TableHead>Ultima Sync</TableHead>
                                    <TableHead>Creato</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {configs.map((config) => (
                                    <TableRow key={config.id}>
                                      <TableCell>
                                        {config.channel_manager_name || config.config_type || '—'}
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant={config.is_active ? "default" : "secondary"}>
                                          {config.is_active ? "Attivo" : "Inattivo"}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          <Clock className="w-3 h-3 text-hostsuite-text/50" />
                                          {formatDate(config.last_sync_at)}
                                        </div>
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
                          {urls.length > 0 && (
                            <div>
                              <h4 className="font-medium text-hostsuite-primary mb-3 flex items-center gap-2">
                                <ExternalLink className="w-4 h-4" />
                                URL iCal ({urls.length})
                              </h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Origine</TableHead>
                                    <TableHead>URL</TableHead>
                                    <TableHead>Stato</TableHead>
                                    <TableHead>Ultima Sync</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {urls.map((url) => (
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
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}

                          {configs.length === 0 && urls.length === 0 && (
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
        </div>
      </div>
    </div>
  );
};

export default Calendar;