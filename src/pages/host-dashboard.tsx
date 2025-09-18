import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, SourceBadge } from "@/components/ui/Badges";
import { EmptyState } from "@/components/ui/EmptyState";
import HostNavbar from "@/components/HostNavbar";
import PropertyDetailModal from "@/components/PropertyDetailModal";
import KpiTrend from "@/components/KpiTrend";
import { supabase, getUserSafe } from "@/lib/supabase";
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
}

interface UnansweredQuestion {
  id: string;
  question: string;
  property_id: string;
  guest_code: string;
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
      const [propertiesResult, unansweredResult, icalResult] = await Promise.all([
        supabase
          .from('properties')
          .select('id, nome, host_id, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('unanswered_questions')
          .select('id, question, property_id, guest_code, created_at, status')
          .order('created_at', { ascending: false })
          .limit(25),
        supabase.from('ical_configs').select('id', { count: 'exact', head: true })
      ]);

      if (propertiesResult.error) {
        console.error('Error loading properties:', propertiesResult.error);
        setError("Errore nel caricamento delle proprietà");
        return;
      }

      if (unansweredResult.error) {
        console.error('Error loading unanswered questions:', unansweredResult.error);
        setError("Errore nel caricamento delle domande");
        return;
      }

      const propertiesData = propertiesResult.data || [];
      const unansweredData = unansweredResult.data || [];

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
      const qSource = (question?.guest_code ?? '').toLowerCase();
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
                  
                  <Button disabled className="bg-gradient-hostsuite opacity-50 cursor-not-allowed">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuova Proprietà
                  </Button>
                </div>
              </div>

              {error && (
                <div className="mb-8">
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="w-5 h-5" />
                        <div>
                          <p className="font-medium">Errore nel caricamento</p>
                          <p className="text-sm">{error}</p>
                        </div>
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
                            <th className="text-left py-3 px-2 text-hostsuite-text font-medium hidden sm:table-cell">Data Creazione</th>
                            <th className="text-left py-3 px-2 text-hostsuite-text font-medium">Azioni</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProperties.map((property) => (
                            <tr key={property.id} className="border-b border-gray-100 hover:bg-hostsuite-light/10 transition-colors">
                              <td className="py-4 px-2">
                                <div className="font-medium text-hostsuite-primary">{property.nome}</div>
                                <div className="text-sm text-hostsuite-text sm:hidden">
                                  {new Date(property.created_at).toLocaleDateString('it-IT')}
                                </div>
                              </td>
                              <td className="py-4 px-2 hidden sm:table-cell text-hostsuite-text">
                                {new Date(property.created_at).toLocaleDateString('it-IT')}
                              </td>
                              <td className="py-4 px-2">
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handlePropertyDetail(property.id)}
                                    className="text-hostsuite-primary hover:bg-hostsuite-primary hover:text-white"
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    Dettagli
                                  </Button>
                                </div>
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