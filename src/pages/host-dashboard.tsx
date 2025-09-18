import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, SourceBadge } from "@/components/ui/Badges";
import { EmptyState } from "@/components/ui/EmptyState";
import HostNavbar from "@/components/HostNavbar";
import PropertyDetailModal from "@/components/PropertyDetailModal";
import CreatePropertyModal from "@/components/CreatePropertyModal";
import PropertySwitch from "@/components/PropertySwitch";
import KpiTrend from "@/components/KpiTrend";
import { supabase } from "@/lib/supabase";
import { createProperty, type NewProperty } from "@/lib/properties";
import { useToast } from "@/hooks/use-toast";
import { useActiveProperty } from "@/hooks/useActiveProperty";
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
  const [createForm, setCreateForm] = useState({
    nome: "",
    city: "",
    max_guests: undefined as number | undefined,
    status: "active" as "active" | "inactive",
    address: ""
  });
  
  // Global active property state
  const { id: activePropertyId, setId: setActivePropertyId } = useActiveProperty();
  
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
      setPropertiesError(null);

      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userRes?.user) throw new Error("Utente non autenticato");
      const hostId = userRes.user.id;

      const [propertiesResult, unansweredResult, icalResult] = await Promise.all([
        supabase
          .from("properties")
          .select("id, nome, city, address, max_guests, status, host_id, created_at")
          .eq("host_id", hostId)
          .order("created_at", { ascending: false }),

        // Filter by property if not 'all'
        (async () => {
          let q = supabase
            .from("unanswered_questions")
            .select("id, question, property_id, guest_code, created_at, status")
            .order("created_at", { ascending: false })
            .limit(25);
          if (activePropertyId && activePropertyId !== 'all') q = q.eq("property_id", activePropertyId);
          return await q;
        })(),

        supabase.from("ical_configs").select("id", { count: "exact", head: true }),
      ]);

      if (propertiesResult.error) setPropertiesError(propertiesResult.error.message || "Errore caricamento proprietà");
      const propertiesData = propertiesResult.data || [];
      setProperties(propertiesData);

      const unansweredData = unansweredResult.data || [];
      setUnansweredQuestions(unansweredData);

      const adr = propertiesData.length ? Math.round(70 + propertiesData.length * 5) : 0;
      const occupancy = propertiesData.length ? Math.min(95, 50 + propertiesData.length * 3) : 0;

      setStats({
        propertiesCount: propertiesData.length,
        unansweredCount: unansweredData.length,
        icalCount: icalResult.count || 0,
        adr,
        occupancy,
      });
    } catch (err: any) {
      setError(err?.message || "Errore nel caricamento");
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
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      
      if (authErr || !user) {
        throw new Error("Utente non autenticato");
      }

      const { data, error } = await createProperty(createForm);
      
      if (error) {
        console.error('Property creation error:', error);
        
        // Debug mode error display
        const debugMode = localStorage.getItem('debug') === '1';
        const errorMessage = debugMode 
          ? `RLS error: ${error.message}` 
          : error.message || "Errore nella creazione della proprietà";
          
        throw new Error(errorMessage);
      }

      if (data) {
        // Optimistic update
        setProperties(prev => [data, ...prev]);
        
        // Set as active property if it's the first one
        if (properties.length === 0) {
          setActivePropertyId(data.id);
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

  const handlePropertyChange = (propertyId: string | 'all') => {
    setActivePropertyId(propertyId);
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
                    <PrimaryButton 
                      onClick={retryLoad}
                      disabled={isLoading}
                      size="sm"
                      aria-label="Aggiorna dashboard"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                      Aggiorna
                    </PrimaryButton>
                  </div>
                  
                  {/* Right actions */}
                  <div className="ml-auto flex items-center gap-3">
                    {properties.length > 0 && (
                      <div className="min-w-[200px]">
                        <PropertySwitch
                          value={activePropertyId}
                          onChange={handlePropertyChange}
                          items={properties.map(p => ({ id: p.id, nome: p.nome }))}
                          storageKey="hd_active_property_id"
                          className="w-full sm:w-auto"
                        />
                      </div>
                    )}

                    <PrimaryButton
                      onClick={() => setIsCreateModalOpen(true)}
                      aria-label="Crea nuova proprietà"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nuova Proprietà
                    </PrimaryButton>
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

              {error && (
                <div className="mb-8">
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="w-5 h-5" />
                        <p>{error}</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={retryLoad}
                          className="ml-auto"
                        >
                          Riprova
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Filter Status */}
              {activePropertyId && activePropertyId !== 'all' && (
                <div className="mb-6">
                  <Badge variant="outline" className="bg-hostsuite-primary/10 text-hostsuite-primary border-hostsuite-primary/30">
                    <Filter className="w-3 h-3 mr-1" />
                    Filtrato per: {properties.find(p => p.id === activePropertyId)?.nome || 'Proprietà'}
                  </Badge>
                </div>
              )}

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-8">
                <KPICard
                  title="Proprietà"
                  value={stats.propertiesCount}
                  change={15}
                  icon={Building}
                  isLoading={isLoading}
                />
                <KPICard
                  title="Domande"
                  value={stats.unansweredCount}
                  change={-8}
                  icon={HelpCircle}
                  isLoading={isLoading}
                />
                <KPICard
                  title="iCal Config"
                  value={stats.icalCount}
                  change={22}
                  icon={Calendar}
                  isLoading={isLoading}
                />
                <KPICard
                  title="ADR"
                  value={`€${stats.adr}`}
                  change={12}
                  icon={TrendingUp}
                  isLoading={isLoading}
                />
                <KPICard
                  title="Occupancy"
                  value={`${stats.occupancy}%`}
                  change={5}
                  icon={Users}
                  isLoading={isLoading}
                />
              </div>

              {/* Performance Trends */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Tasso di Occupazione</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.occupancy}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>ADR (Tariffa Media)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">€{stats.adr}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Properties Section */}
              <div className="mb-8">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-hostsuite-primary">
                        <Building className="h-5 w-5" />
                        Le Tue Proprietà
                        {properties.length > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {properties.length}
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            placeholder="Cerca proprietà..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-64"
                          />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : filteredProperties.length === 0 ? (
                      <EmptyState
                        icon={<Building className="w-16 h-16 text-hostsuite-primary/30" />}
                        title={searchTerm ? "Nessuna proprietà trovata" : "Nessuna proprietà disponibile"}
                        description={searchTerm ? "Prova a modificare il termine di ricerca" : "Inizia aggiungendo la tua prima proprietà"}
                      />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="text-left border-b border-gray-200">
                              <th className="py-3 px-2 font-medium text-hostsuite-text">Proprietà</th>
                              <th className="py-3 px-2 font-medium text-hostsuite-text hidden md:table-cell">Città</th>
                              <th className="py-3 px-2 font-medium text-hostsuite-text hidden lg:table-cell">Ospiti</th>
                              <th className="py-3 px-2 font-medium text-hostsuite-text hidden sm:table-cell">Stato</th>
                              <th className="py-3 px-2 font-medium text-hostsuite-text hidden sm:table-cell">Creata il</th>
                              <th className="py-3 px-2 font-medium text-hostsuite-text">Azioni</th>
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

              {/* Unanswered Questions Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-hostsuite-primary">
                      <HelpCircle className="h-5 w-5" />
                      Domande Non Risposte
                      {unansweredQuestions.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {unansweredQuestions.length}
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Cerca domande..."
                          value={questionSearch}
                          onChange={(e) => setQuestionSearch(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : filteredQuestions.length === 0 ? (
                    <EmptyState
                      icon={<HelpCircle className="w-16 h-16 text-hostsuite-primary/30" />}
                      title={questionSearch ? "Nessuna domanda trovata" : "Nessuna domanda in sospeso"}
                      description={questionSearch ? "Prova a modificare il termine di ricerca" : "Ottimo! Non ci sono domande in attesa di risposta"}
                    />
                  ) : (
                    <div className="space-y-3">
                      {filteredQuestions.map((question) => (
                        <div key={question.id} className="p-4 border border-gray-200 rounded-lg hover:border-hostsuite-primary/50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-hostsuite-text font-medium mb-2">{question.question}</p>
                              <div className="flex items-center gap-4 text-sm text-hostsuite-text/60">
                                <span>Codice: {question.guest_code}</span>
                                <span>{new Date(question.created_at).toLocaleDateString('it-IT')}</span>
                                <span>{new Date(question.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={question.status as any} />
                              <SourceBadge source={question.source || question.guest_code || 'Unknown'} />
                            </div>
                          </div>
                        </div>
                      ))}
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

      {/* Create Property Modal */}
      <CreatePropertyModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onConfirm={handleCreateProperty}
        creating={isCreating}
        form={createForm}
        setForm={setCreateForm}
      />
    </div>
  );
};

export default HostDashboard;
