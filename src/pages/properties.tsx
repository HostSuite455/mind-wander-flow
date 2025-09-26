import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/Badges";
import PropertyDetailModal from "@/components/PropertyDetailModal";
import CreatePropertyModal from "@/components/CreatePropertyModal";
import { 
  Building, 
  RefreshCw, 
  Search, 
  Filter,
  Eye,
  MapPin,
  Users,
  Calendar,
  Plus,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { createProperty, type NewProperty } from "@/lib/properties";

import { useActiveProperty } from "@/hooks/useActiveProperty";

interface Property {
  id: string;
  host_id: string;
  nome?: string;
  name?: string;
  city?: string;
  status?: string;
  guests?: number;
  created_at: string;
}

const Properties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { id: activePropertyId } = useActiveProperty();
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    nome: "",
    city: "",
    guests: 2,
    status: "active" as const
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProperties(data || []);
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

  // Filtered data
  const filteredProperties = useMemo(() => {
    const term = (searchTerm ?? '').toLowerCase();
    
    let filtered = properties.filter(prop => {
      const name = (prop.nome || prop.name || '').toLowerCase();
      const city = (prop.city || '').toLowerCase();
      const matchesSearch = name.includes(term) || city.includes(term);
      const matchesCity = selectedCity === 'all' || prop.city === selectedCity;
      const matchesStatus = statusFilter === 'all' || prop.status === statusFilter;
      
      return matchesSearch && matchesCity && matchesStatus;
    });

    // Apply active property filter
    if (activePropertyId && activePropertyId !== 'all') {
      filtered = filtered.filter(prop => prop.id === activePropertyId);
    }

    return filtered;
  }, [properties, searchTerm, selectedCity, statusFilter, activePropertyId]);

  const uniqueCities = useMemo(() => {
    const cities = properties
      .map(prop => prop.city)
      .filter(Boolean)
      .filter((city, index, arr) => arr.indexOf(city) === index);
    return cities.sort();
  }, [properties]);

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

  const handleCreateProperty = async (propertyData: NewProperty) => {
    try {
      setIsCreating(true);
      await createProperty(propertyData);
      
      toast({
        title: "Successo",
        description: "Proprietà creata con successo",
      });
      
      setIsCreateModalOpen(false);
      setCreateForm({ nome: "", city: "", guests: 2, status: "active" as const });
      loadProperties();
    } catch (error) {
      console.error('Error creating property:', error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Errore nella creazione della proprietà",
      });
    } finally {
      setIsCreating(false);
    }
  };

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
              <Building className="w-8 h-8" />
              Proprietà
            </h1>
            <p className="text-hostsuite-text/60 mt-2">
              Gestisci tutte le tue proprietà in un unico posto
            </p>
            {activePropertyId && activePropertyId !== 'all' && (
              <Badge variant="outline" className="flex items-center gap-2 w-fit mt-2">
                <Info className="h-3 w-3" />
                Filtro attivo: {activePropertyId}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={loadProperties} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Aggiorna
            </Button>
            <PrimaryButton onClick={() => navigate("/dashboard/properties/new")}>
              <Plus className="w-4 h-4 mr-2" />
              Nuova Proprietà
            </PrimaryButton>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700">
                <Info className="w-5 h-5" />
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
                    placeholder="Nome o città..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* City Filter */}
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

              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium text-hostsuite-text mb-2 block">
                  Stato
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti</SelectItem>
                    <SelectItem value="active">Attive</SelectItem>
                    <SelectItem value="inactive">Inattive</SelectItem>
                    <SelectItem value="draft">Bozze</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Stats */}
              <div className="pt-4 border-t">
                <div className="text-sm text-hostsuite-text/60 space-y-1">
                  <div>Totale: {properties.length}</div>
                  <div>Filtrate: {filteredProperties.length}</div>
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
              title={searchTerm || selectedCity !== 'all' || statusFilter !== 'all' ? "Nessuna proprietà trovata" : "Nessuna proprietà disponibile"}
              description={searchTerm || selectedCity !== 'all' || statusFilter !== 'all' ? "Prova a modificare i filtri di ricerca" : "Inizia creando la tua prima proprietà"}
            >
              {!searchTerm && selectedCity === 'all' && statusFilter === 'all' && (
                <PrimaryButton onClick={() => navigate("/dashboard/properties/new")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crea Prima Proprietà
                </PrimaryButton>
              )}
            </EmptyState>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Proprietà ({filteredProperties.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Città</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead>Ospiti Max</TableHead>
                        <TableHead>Data Creazione</TableHead>
                        <TableHead className="text-right">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProperties.map((property) => (
                        <TableRow key={property.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-hostsuite-primary" />
                              {property.nome || property.name || 'Senza nome'}
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
                            {property.status ? (
                              <StatusBadge status={property.status as any} />
                            ) : (
                              <Badge variant="secondary">Non definito</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {property.guests ? (
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3 text-hostsuite-text/50" />
                                {property.guests}
                              </div>
                            ) : (
                              <span className="text-hostsuite-text/50">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-hostsuite-text/60">
                              <Calendar className="w-3 h-3" />
                              {formatDate(property.created_at)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <PrimaryButton
                              size="sm"
                              onClick={() => openModal(property.id)}
                              aria-label={`Visualizza dettagli di ${property.nome || property.name || 'Proprietà'}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Dettagli
                            </PrimaryButton>
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

      {/* Property Detail Modal */}
      {modalOpen && selectedPropertyId && (
        <PropertyDetailModal
          open={modalOpen}
          onClose={closeModal}
          propertyId={selectedPropertyId}
        />
      )}
      
      {/* Create Property Modal */}
      <CreatePropertyModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onConfirm={() => handleCreateProperty(createForm)}
        creating={isCreating}
        form={createForm}
        setForm={setCreateForm}
      />
    </div>
  );
};

export default Properties;