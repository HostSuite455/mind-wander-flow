import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, SourceBadge } from "@/components/ui/Badges";
import { EmptyState } from "@/components/ui/EmptyState";
import HostNavbar from "@/components/HostNavbar";
import PropertyDetailModal from "@/components/PropertyDetailModal";
import KpiTrend from "@/components/KpiTrend";
import { supabase, getUserSafe } from "@/lib/supabase";
import { createProperty, type NewProperty } from "@/lib/properties";
import { useToast } from "@/hooks/use-toast";
import { 
  LayoutDashboard, 
  Home, 
  TrendingUp, 
  Users, 
  Calendar,
  Search,
  Plus,
  MapPin,
  Star,
  Building,
  AlertCircle,
  RefreshCw,
  HelpCircle,
  Filter,
  Eye
} from "lucide-react";

// Types for our data
interface Property {
  id: string;
  nome: string;
  host_id: string;
  created_at: string;
  city?: string;
  max_guests?: number;
  status?: string;
  address?: string;
}

interface UnansweredQuestion {
  id: string;
  question: string;
  property_id: string;
  guest_code: string;
  source?: string;
  created_at: string;
  status: string;
}

interface DashboardStats {
  propertiesCount: number;
  unansweredCount: number;
  icalCount: number;
  adr: number;
  occupancy: number;
}

const HostDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [questionSearch, setQuestionSearch] = useState("");
  const [questionSourceFilter, setQuestionSourceFilter] = useState("all");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New property creation modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<NewProperty>({
    nome: "",
    city: "",
    max_guests: undefined,
    status: "active",
    address: ""
  });
  
  // Multi-property selection
  const [activePropertyId, setActivePropertyId] = useState<string | null>(() => {
    return localStorage.getItem("active_property_id");
  });
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [unansweredQuestions, setUnansweredQuestions] = useState<UnansweredQuestion[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ 
    propertiesCount: 0, 
    unansweredCount: 0, 
    icalCount: 0,
    adr: 0,
    occupancy: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [propertiesError, setPropertiesError] = useState<any>(null);
  const { toast } = useToast();

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if user is authenticated
      const user = await getUserSafe();
      if (!user) {
        setError("Utente non autenticato");
        return;
      }

      // Load all data in parallel
      let unansweredQuery = supabase
        .from('unanswered_questions')
        .select('id, question, property_id, guest_code, created_at, status');
      
      if (activePropertyId) {
        unansweredQuery = unansweredQuery.eq('property_id', activePropertyId);
      }
      
      const [propertiesResult, unansweredResult, icalResult] = await Promise.all([
        supabase
          .from('properties')
          .select('id, nome, host_id, created_at, city, max_guests, status, address')
          .order('created_at', { ascending: false }),
        unansweredQuery
          .order('created_at', { ascending: false })
          .limit(25),
        supabase.from('ical_configs').select('id', { count: 'exact', head: true })
      ]);

      if (propertiesResult.error) {
        console.error('Error loading properties:', propertiesResult.error);
        setPropertiesError(propertiesResult.error);
      } else {
        setPropertiesError(null);
      }

      if (unansweredResult.error) {
        console.error('Error loading unanswered questions:', unansweredResult.error);
        // Don't return early, just log the error and use empty array
      }

      const propertiesData = propertiesResult.data || [];
      const unansweredData: UnansweredQuestion[] = unansweredResult.error ? [] : (unansweredResult.data || []);

      // Calculate client-side KPIs
      const adr = propertiesData.length * 5 + 70;  // Placeholder calculation
      const occupancy = Math.min(95, 50 + propertiesData.length * 3);

      setProperties(propertiesData);
      setUnansweredQuestions(unansweredData);
      setStats({
        propertiesCount: propertiesData.length,
        unansweredCount: unansweredData.length,
        icalCount: icalResult.count || 0,
        adr,
        occupancy,
      });

    } catch (err) {
      console.error('Error in loadDashboardData:', err);
      setError("Errore nel caricamento dei dati");
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Errore nel caricamento della dashboard",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const retryLoad = () => {
    loadDashboardData();
  };

  // Property creation functions
  const handleCreateProperty = async () => {
    if (!createForm.nome.trim()) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Il nome della proprietà è obbligatorio",
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await createProperty(createForm);
      
      if (error) {
        throw error;
      }

      if (data) {
        // Optimistic update
        setProperties(prev => [data, ...prev]);
        
        // Set as active property if it's the first one
        if (properties.length === 0) {
          setActivePropertyId(data.id);
          localStorage.setItem("active_property_id", data.id);
        }
        
        toast({
          title: "Successo",
          description: "Proprietà creata con successo",
        });
        
        // Reset form and close modal
        setCreateForm({
          nome: "",
          city: "",
          max_guests: undefined,
          status: "active",
          address: ""
        });
        setIsCreateModalOpen(false);
        
        // Reload data to get updated stats
        loadDashboardData();
      }
    } catch (error: any) {
      console.error('Error creating property:', error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Errore nella creazione della proprietà",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handlePropertyChange = (propertyId: string) => {
    if (propertyId === "all") {
      setActivePropertyId(null);
      localStorage.removeItem("active_property_id");
    } else {
      setActivePropertyId(propertyId);
      localStorage.setItem("active_property_id", propertyId);
    }
    loadDashboardData(); // Reload with new filter
  };

  // Generate trend data (client-side placeholder)
  const trendData = useMemo(() => {
    if (stats.occupancy === 0 || stats.adr === 0) {
      return { occupancyTrend: [], adrTrend: [] };
    }

    // Generate 7 days of data with realistic variations
    const generateTrendData = (baseValue: number, variance: number, min: number, max: number) => {
      const data = [];
      let currentValue = baseValue;
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Add some randomness but keep it realistic
        const change = (Math.random() - 0.5) * variance;
        currentValue = Math.max(min, Math.min(max, currentValue + change));
        
        data.push({
          day: date.toLocaleDateString('it-IT', { weekday: 'short' }),
          value: Math.round(currentValue)
        });
      }
      
      return data;
    };

    return {
      occupancyTrend: generateTrendData(stats.occupancy, 10, 30, 95),
      adrTrend: generateTrendData(stats.adr, 20, 50, 180)
    };
  }, [stats.occupancy, stats.adr]);

  const handlePropertyDetail = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPropertyId(null);
  };

  // Memoized filtered data for performance
  const filteredProperties = useMemo(() => {
    const list = properties ?? [];
    const term = (searchTerm ?? '').toLowerCase();
    return list.filter(property => {
      const propertyName = (property?.nome ?? '').toLowerCase();
      return propertyName.includes(term);
    });
  }, [properties, searchTerm]);

  const filteredQuestions = useMemo(() => {
    const list = unansweredQuestions ?? [];
    const term = (questionSearch ?? '').toLowerCase();
    const src = (questionSourceFilter ?? 'all').toLowerCase();

    return list.filter(question => {
      const qText = (question?.question ?? '').toLowerCase();
      const matchesSearch = qText.includes(term);
      // Use 'source' first, fallback to 'guest_code' for backward compatibility
      const qSource = (question?.source ?? question?.guest_code ?? '').toLowerCase();
      const matchesSource = src === 'all' || qSource === src || qSource.includes(src);
      return matchesSearch && matchesSource;
    });
  }, [unansweredQuestions, questionSearch, questionSourceFilter]);

  const KPICard = ({ title, value, change, icon: Icon, isLoading }: any) => (
    <Card className="hover:shadow-soft transition-shadow border-hostsuite-primary/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-hostsuite-text">{title}</CardTitle>
        <Icon className="h-4 w-4 text-hostsuite-primary" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24 mb-1" />
        ) : (
          <>
            <div className="text-2xl font-bold text-hostsuite-primary">{value}</div>
            <p className="text-xs text-muted-foreground">
              <span className={change >= 0 ? "text-green-600" : "text-red-600"}>
                {change >= 0 ? "+" : ""}{change}%
              </span>
              {" dal mese scorso"}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <HostNavbar />
      
      <div className="pt-16"> {/* Account for fixed navbar */}
        <div className="flex">
          {/* Sidebar - Hidden on mobile, shown on desktop */}
          <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-16 lg:border-r lg:border-hostsuite-primary/20 lg:bg-white/50">
            <div className="flex-1 flex flex-col min-h-0 pt-6 pb-4">
              <div className="flex-1 flex flex-col overflow-y-auto px-4">
                <nav className="space-y-2">
                  <div className="px-3 py-2 text-xs font-semibold text-hostsuite-text uppercase tracking-wider">
                    Menu Principale
                  </div>
                  <Button variant="ghost" className="w-full justify-start text-hostsuite-primary bg-hostsuite-primary/10">
                    <LayoutDashboard className="mr-3 h-4 w-4" />
                    Dashboard Overview
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-hostsuite-text">
                    <Home className="mr-3 h-4 w-4" />
                    Proprietà
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-hostsuite-text">
                    <Calendar className="mr-3 h-4 w-4" />
                    Calendario
                  </Button>
                </nav>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 lg:pl-64">
            <div className="container max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              
              {/* Topbar with Breadcrumb */}
              <div className="mb-8">
                <nav className="text-sm breadcrumbs mb-4">
                  <span className="text-hostsuite-text">Dashboard</span>
                  <span className="mx-2 text-hostsuite-text">/</span>
                  <span className="text-hostsuite-primary font-medium">Overview</span>
                </nav>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-hostsuite-primary">Dashboard Overview</h1>
                    <Button 
                      onClick={retryLoad} 
                      variant="outline" 
                      size="sm"
                      disabled={isLoading}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                      Aggiorna
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Property Selector */}
                    {properties.length > 0 && (
                      <Select value={activePropertyId || "all"} onValueChange={handlePropertyChange}>
                        <SelectTrigger className="w-48 border-hostsuite-primary/20">
                          <SelectValue placeholder="Seleziona proprietà" />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-50">
                          <SelectItem value="all">Tutte le proprietà</SelectItem>
                          {properties.map((property) => (
                            <SelectItem key={property.id} value={property.id}>
                              {property.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    
                    {/* Create Property Button */}
                    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-hostsuite hover:opacity-90">
                          <Plus className="w-4 h-4 mr-2" />
                          Nuova Proprietà
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md bg-white">
                        <DialogHeader>
                          <DialogTitle>Crea Nuova Proprietà</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="nome">Nome Proprietà *</Label>
                            <Input
                              id="nome"
                              value={createForm.nome}
                              onChange={(e) => setCreateForm(prev => ({ ...prev, nome: e.target.value }))}
                              placeholder="Es. Villa Sunset"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="city">Città</Label>
                            <Input
                              id="city"
                              value={createForm.city}
                              onChange={(e) => setCreateForm(prev => ({ ...prev, city: e.target.value }))}
                              placeholder="Es. Roma"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="address">Indirizzo</Label>
                            <Input
                              id="address"
                              value={createForm.address}
                              onChange={(e) => setCreateForm(prev => ({ ...prev, address: e.target.value }))}
                              placeholder="Es. Via Roma 123"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="max_guests">Ospiti Max</Label>
                              <Input
                                id="max_guests"
                                type="number"
                                min="1"
                                value={createForm.max_guests || ""}
                                onChange={(e) => setCreateForm(prev => ({ 
                                  ...prev, 
                                  max_guests: e.target.value ? parseInt(e.target.value) : undefined 
                                }))}
                                placeholder="Es. 4"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="status">Stato</Label>
                              <Select 
                                value={createForm.status} 
                                onValueChange={(value) => setCreateForm(prev => ({ 
                                  ...prev, 
                                  status: value as "active" | "inactive"
                                }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white z-50">
                                  <SelectItem value="active">Attiva</SelectItem>
                                  <SelectItem value="inactive">Inattiva</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div className="flex justify-end gap-2 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsCreateModalOpen(false)}
                              disabled={isCreating}
                            >
                              Annulla
                            </Button>
                            <Button
                              type="button"
                              onClick={handleCreateProperty}
                              disabled={isCreating}
                              className="bg-gradient-hostsuite hover:opacity-90"
                            >
                              {isCreating ? "Creazione..." : "Crea Proprietà"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>

              {propertiesError && (
                <div className="mb-8">
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="w-5 h-5" />
                        <div>
                          <p className="font-medium">Errore nel caricamento delle proprietà</p>
                          <p className="text-sm">Problema di accesso ai dati delle proprietà</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={loadDashboardData}
                          className="ml-auto"
                        >
                          Riprova
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8" aria-live="polite">
                <KPICard
                  title="Proprietà"
                  value={stats.propertiesCount.toString()}
                  change={0}
                  icon={Building}
                  isLoading={isLoading}
                />
                <KPICard
                  title="Domande in Sospeso"
                  value={stats.unansweredCount.toString()}
                  change={0}
                  icon={HelpCircle}
                  isLoading={isLoading}
                />
                <KPICard
                  title="Configurazioni iCal"
                  value={stats.icalCount.toString()}
                  change={0}
                  icon={Calendar}
                  isLoading={isLoading}
                />
                <KPICard
                  title="ADR (Tariffa Media)"
                  value={stats.adr > 0 ? `€${stats.adr}` : "—"}
                  change={0}
                  icon={TrendingUp}
                  isLoading={isLoading}
                />
                <KPICard
                  title="Occupancy Rate"
                  value={stats.occupancy > 0 ? `${stats.occupancy}%` : "—"}
                  change={0}
                  icon={Users}
                  isLoading={isLoading}
                />
              </div>

              {/* Trend Charts */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-hostsuite-primary mb-4">Trend 7 giorni</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <KpiTrend 
                    data={trendData.occupancyTrend}
                    label="Occupancy"
                    suffix="%"
                  />
                  <KpiTrend 
                    data={trendData.adrTrend}
                    label="ADR"
                    prefix="€"
                  />
                </div>
              </div>
              <Card className="border-hostsuite-primary/20 mb-8">
                <CardHeader>
                  <CardTitle className="text-hostsuite-primary flex items-center gap-2">
                    <HelpCircle className="w-5 h-5" />
                    Domande Non Risposte
                  </CardTitle>
                  
                  {/* Question Filters */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-hostsuite-text w-4 h-4" />
                      <Input
                        placeholder="Cerca nelle domande..."
                        value={questionSearch}
                        onChange={(e) => setQuestionSearch(e.target.value)}
                        className="pl-10 border-hostsuite-primary/20 focus:border-hostsuite-primary"
                      />
                    </div>
                    
                    <Select value={questionSourceFilter} onValueChange={setQuestionSourceFilter}>
                      <SelectTrigger className="w-full sm:w-48 border-hostsuite-primary/20">
                        <SelectValue placeholder="Filtra per origine" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutte le origini</SelectItem>
                        <SelectItem value="airbnb">Airbnb</SelectItem>
                        <SelectItem value="booking">Booking.com</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {(filteredQuestions ?? []).length === 0 ? (
                    <EmptyState
                      icon={<HelpCircle className="w-16 h-16 text-hostsuite-primary/30" />}
                      title={questionSearch || questionSourceFilter !== "all" 
                        ? "Nessuna domanda trovata" 
                        : "Nessuna domanda in sospeso"}
                      description={questionSearch || questionSourceFilter !== "all"
                        ? "Prova a modificare i filtri di ricerca"
                        : "Tutte le domande degli ospiti hanno ricevuto risposta"}
                    />
                  ) : (
                    <div className="space-y-4">
                      {filteredQuestions.map((question) => (
                        <div key={question.id} className="p-4 border border-hostsuite-primary/20 rounded-lg hover:bg-hostsuite-primary/5 transition-colors">
                          <div className="flex flex-col gap-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="font-medium text-hostsuite-primary mb-2">
                                  {question.question}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-hostsuite-text">
                                  <SourceBadge source={question.guest_code} />
                                  <span>{new Date(question.created_at).toLocaleDateString('it-IT')}</span>
                                </div>
                              </div>
                              
                              <Button 
                                size="sm" 
                                disabled 
                                className="opacity-50"
                                title="Disponibile in modalità operativa"
                              >
                                Segna come gestita
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Properties Section */}
              <Card className="border-hostsuite-primary/20">
                <CardHeader>
                  <CardTitle className="text-hostsuite-primary flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Le Tue Proprietà
                  </CardTitle>
                  
                  {/* Toolbar */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-hostsuite-text w-4 h-4" />
                      <Input
                        placeholder="Cerca proprietà..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-hostsuite-primary/20 focus:border-hostsuite-primary"
                      />
                    </div>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-48 border-hostsuite-primary/20">
                        <SelectValue placeholder="Filtra per stato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutte le proprietà</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {filteredProperties.length === 0 ? (
                    <EmptyState
                      icon={<Home className="w-16 h-16 text-hostsuite-primary/30" />}
                      title={searchTerm 
                        ? "Nessuna proprietà trovata" 
                        : "Nessuna proprietà disponibile"}
                      description={searchTerm 
                        ? "Prova a modificare il termine di ricerca" 
                        : "Inizia aggiungendo la tua prima proprietà"}
                    >
                      <Button disabled className="bg-gradient-hostsuite opacity-50">
                        <Plus className="w-4 h-4 mr-2" />
                        Aggiungi Proprietà
                      </Button>
                    </EmptyState>
                  ) : (
                     // Properties Table - Responsive
                     <div className="overflow-x-auto">
                       <table className="w-full">
                         <thead>
                           <tr className="border-b border-hostsuite-primary/20">
                             <th className="text-left py-3 px-2 text-hostsuite-text font-medium">Nome</th>
                             <th className="text-left py-3 px-2 text-hostsuite-text font-medium hidden md:table-cell">Città</th>
                             <th className="text-left py-3 px-2 text-hostsuite-text font-medium hidden lg:table-cell">Ospiti</th>
                             <th className="text-left py-3 px-2 text-hostsuite-text font-medium hidden sm:table-cell">Stato</th>
                             <th className="text-left py-3 px-2 text-hostsuite-text font-medium hidden sm:table-cell">Data Creazione</th>
                             <th className="text-left py-3 px-2 text-hostsuite-text font-medium">Azioni</th>
                           </tr>
                         </thead>
                         <tbody>
                           {filteredProperties.map((property) => (
                             <tr key={property.id} className="border-b border-gray-100 hover:bg-hostsuite-light/10 transition-colors">
                               <td className="py-4 px-2">
                                 <div className="font-medium text-hostsuite-primary">{property.nome}</div>
                                 {property.address && (
                                   <div className="text-sm text-hostsuite-text">{property.address}</div>
                                 )}
                                 <div className="text-sm text-hostsuite-text sm:hidden">
                                   {new Date(property.created_at).toLocaleDateString('it-IT')}
                                 </div>
                               </td>
                               <td className="py-4 px-2 text-hostsuite-text hidden md:table-cell">
                                 {property.city || "—"}
                               </td>
                               <td className="py-4 px-2 text-hostsuite-text hidden lg:table-cell">
                                 {property.max_guests ? `${property.max_guests} ospiti` : "—"}
                               </td>
                               <td className="py-4 px-2 hidden sm:table-cell">
                                 <StatusBadge status={(property.status === "active" || property.status === "inactive") ? property.status : "active"} />
                               </td>
                               <td className="py-4 px-2 text-hostsuite-text hidden sm:table-cell">
                                 {new Date(property.created_at).toLocaleDateString('it-IT')}
                               </td>
                               <td className="py-4 px-2">
                                 <Button 
                                   size="sm" 
                                   variant="outline"
                                   onClick={() => handlePropertyDetail(property.id)}
                                   className="border-hostsuite-primary/30 text-hostsuite-primary hover:bg-hostsuite-primary/10"
                                 >
                                   <Eye className="w-4 h-4 mr-1" />
                                   Dettagli
                                 </Button>
                               </td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                      </div>
                   )}
                 </CardContent>
               </Card>
             </div>
           </main>
         </div>
       </div>
 
       {/* Property Detail Modal */}
       {selectedPropertyId && (
         <PropertyDetailModal 
           open={isModalOpen}
           onClose={handleCloseModal}
           propertyId={selectedPropertyId}
         />
       )}
     </div>
   );
 };

export default HostDashboard;