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
import PropertyDetailModal from "@/components/PropertyDetailModal";
import { 
  Building, 
  RefreshCw, 
  Search, 
  Filter,
  Eye,
  MapPin,
  Users,
  Calendar
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
  max_guests?: number;
  created_at: string;
}

const Properties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  
  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: propertiesError } = await supaSelect<Property>(
        'properties', 
        'id, host_id, city, status, max_guests, created_at, nome, name'
      );

      if (propertiesError) {
        setError("Errore nel caricamento delle proprietà");
        toast({
          variant: "destructive",
          title: "Errore",
          description: "Errore nel caricamento delle proprietà",
        });
      } else {
        setProperties(data || []);
      }

    } catch (err) {
      console.error('Error loading properties:', err);
      setError("Errore nel caricamento delle proprietà");
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Errore nel caricamento delle proprietà",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Extract unique cities for filter
  const uniqueCities = useMemo(() => {
    const cities = properties
      .map(prop => prop.city)
      .filter(city => city && city.trim())
      .map(city => city!.trim());
    return [...new Set(cities)].sort();
  }, [properties]);

  // Extract unique statuses for filter  
  const uniqueStatuses = useMemo(() => {
    const statuses = properties
      .map(prop => prop.status)
      .filter(status => status && status.trim())
      .map(status => status!.trim());
    return [...new Set(statuses)].sort();
  }, [properties]);

  // Filtered properties
  const filteredProperties = useMemo(() => {
    const term = (searchTerm ?? '').toLowerCase();
    const city = selectedCity === 'all' ? null : selectedCity;
    const status = selectedStatus === 'all' ? null : selectedStatus;
    
    return properties.filter(prop => {
      const name = pickName(prop).toLowerCase();
      const matchesSearch = name.includes(term);
      const matchesCity = !city || prop.city === city;
      const matchesStatus = !status || prop.status === status;
      
      return matchesSearch && matchesCity && matchesStatus;
    });
  }, [properties, searchTerm, selectedCity, selectedStatus]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const openModal = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedPropertyId(null);
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
                <Skeleton className="h-64 w-full" />
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
                  <Building className="w-8 h-8" />
                  Proprietà
                </h1>
                <p className="text-hostsuite-text/60 mt-2">
                  Gestisci tutte le tue proprietà in un unico posto
                </p>
              </div>
              <Button onClick={loadProperties} disabled={isLoading}>
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
                    <Building className="w-5 h-5" />
                    <p>{error}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Filters Sidebar */}
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
                      Cerca per nome
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

                  {/* City Filter */}
                  {uniqueCities.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-hostsuite-text mb-2 block">
                        Città
                      </label>
                      <Select value={selectedCity} onValueChange={setSelectedCity}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tutte le città" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tutte le città</SelectItem>
                          {uniqueCities.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Status Filter */}
                  {uniqueStatuses.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-hostsuite-text mb-2 block">
                        Stato
                      </label>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tutti gli stati" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tutti gli stati</SelectItem>
                          {uniqueStatuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="pt-4 border-t">
                    <div className="text-sm text-hostsuite-text/60 space-y-1">
                      <div>Totale: {properties.length}</div>
                      <div>Filtrate: {filteredProperties.length}</div>
                      {uniqueCities.length > 0 && (
                        <div>Città: {uniqueCities.length}</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {filteredProperties.length === 0 ? (
                <EmptyState
                  icon={<Building className="w-16 h-16 text-hostsuite-primary/30" />}
                  title={searchTerm || selectedCity !== 'all' || selectedStatus !== 'all' ? "Nessuna proprietà trovata" : "Nessuna proprietà disponibile"}
                  description={searchTerm || selectedCity !== 'all' || selectedStatus !== 'all' ? "Prova a modificare i filtri di ricerca" : "Aggiungi la tua prima proprietà per iniziare"}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Elenco Proprietà</span>
                      <Badge variant="secondary" className="bg-hostsuite-primary/10 text-hostsuite-primary">
                        {filteredProperties.length} {filteredProperties.length === 1 ? 'proprietà' : 'proprietà'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Clicca su "Dettagli" per visualizzare informazioni complete di ogni proprietà
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[200px]">Nome</TableHead>
                            <TableHead>Città</TableHead>
                            <TableHead>Ospiti</TableHead>
                            {filteredProperties.length > 0 && 'status' in filteredProperties[0] && <TableHead>Stato</TableHead>}
                            <TableHead>Creato il</TableHead>
                            <TableHead className="text-right">Azioni</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody aria-busy={isLoading}>
                          {filteredProperties.map((property) => (
                            <TableRow key={property.id}>
                              <TableCell>
                                <div className="font-medium text-hostsuite-primary">
                                  {pickName(property)}
                                </div>
                              </TableCell>
                              <TableCell>
                                {property.city ? (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-hostsuite-text/50" />
                                    {property.city}
                                  </div>
                                ) : (
                                  <span className="text-hostsuite-text/50">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {property.max_guests ? (
                                  <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3 text-hostsuite-text/50" />
                                    {property.max_guests}
                                  </div>
                                ) : (
                                  <span className="text-hostsuite-text/50">—</span>
                                )}
                              </TableCell>
                               {'status' in property && (
                                 <TableCell>
                                   {property.status ? (
                                     <StatusBadge status={property.status as any} />
                                   ) : (
                                     <span className="text-hostsuite-text/50">—</span>
                                   )}
                                 </TableCell>
                               )}
                              <TableCell>
                                <div className="flex items-center gap-1 text-hostsuite-text/60">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(property.created_at)}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openModal(property.id)}
                                  className="hover:bg-hostsuite-primary/5"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Dettagli
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Property Detail Modal */}
      {modalOpen && selectedPropertyId && (
        <PropertyDetailModal
          open={modalOpen}
          onClose={closeModal}
          propertyId={selectedPropertyId}
        />
      )}
    </div>
  );
};

export default Properties;