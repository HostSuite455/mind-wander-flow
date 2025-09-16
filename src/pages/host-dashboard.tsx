import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import HostNavbar from "@/components/HostNavbar";
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
  Building
} from "lucide-react";

// Dummy data for demo
const dummyProperties = [
  {
    id: 1,
    name: "Casa Siena Centro",
    city: "Siena",
    guests: 4,
    status: "active",
    rating: 4.8,
    bookings: 12
  },
  {
    id: 2,
    name: "Appartamento Firenze",
    city: "Firenze", 
    guests: 2,
    status: "maintenance",
    rating: 4.9,
    bookings: 8
  }
];

const HostDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  // TODO: Supabase auth here - check user session
  // TODO: Fetch real data from Supabase

  const filteredProperties = dummyProperties.filter(property => {
    const matchesSearch = property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || property.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
                  <div>
                    <h1 className="text-3xl font-bold text-hostsuite-primary">Dashboard Overview</h1>
                    <p className="text-hostsuite-text mt-1">Monitora le performance delle tue proprietà</p>
                  </div>
                  
                  <Button disabled className="bg-gradient-hostsuite opacity-50 cursor-not-allowed">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuova Proprietà
                  </Button>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <KPICard
                  title="Occupancy Rate"
                  value="87%"
                  change={5.2}
                  icon={TrendingUp}
                  isLoading={isLoading}
                />
                <KPICard
                  title="ADR (Tariffa Media)"
                  value="€125"
                  change={-2.1}
                  icon={Users}
                  isLoading={isLoading}
                />
                <KPICard
                  title="RevPAR"
                  value="€109"
                  change={3.8}
                  icon={TrendingUp}
                  isLoading={isLoading}
                />
                <KPICard
                  title="Prossimi Check-in"
                  value="5"
                  change={0}
                  icon={Calendar}
                  isLoading={isLoading}
                />
              </div>

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
                        <SelectItem value="all">Tutti gli stati</SelectItem>
                        <SelectItem value="active">Attivo</SelectItem>
                        <SelectItem value="maintenance">Manutenzione</SelectItem>
                        <SelectItem value="inactive">Inattivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {filteredProperties.length === 0 ? (
                    // Empty State
                    <div className="text-center py-12">
                      <Home className="w-16 h-16 text-hostsuite-primary/30 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-hostsuite-text mb-2">
                        Nessuna proprietà trovata
                      </h3>
                      <p className="text-hostsuite-text/60 mb-6">
                        {searchTerm || statusFilter !== "all" 
                          ? "Prova a modificare i filtri di ricerca" 
                          : "Inizia aggiungendo la tua prima proprietà"}
                      </p>
                      <Button disabled className="bg-gradient-hostsuite opacity-50">
                        <Plus className="w-4 h-4 mr-2" />
                        Aggiungi Proprietà
                      </Button>
                    </div>
                  ) : (
                    // Properties Table - Responsive
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-hostsuite-primary/20">
                            <th className="text-left py-3 px-2 text-hostsuite-text font-medium">Nome</th>
                            <th className="text-left py-3 px-2 text-hostsuite-text font-medium hidden sm:table-cell">Città</th>
                            <th className="text-left py-3 px-2 text-hostsuite-text font-medium">Ospiti</th>
                            <th className="text-left py-3 px-2 text-hostsuite-text font-medium">Stato</th>
                            <th className="text-left py-3 px-2 text-hostsuite-text font-medium hidden lg:table-cell">Rating</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProperties.map((property) => (
                            <tr key={property.id} className="border-b border-gray-100 hover:bg-hostsuite-light/10 transition-colors">
                              <td className="py-4 px-2">
                                <div className="font-medium text-hostsuite-primary">{property.name}</div>
                                <div className="text-sm text-hostsuite-text sm:hidden">{property.city}</div>
                              </td>
                              <td className="py-4 px-2 hidden sm:table-cell">
                                <div className="flex items-center text-hostsuite-text">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {property.city}
                                </div>
                              </td>
                              <td className="py-4 px-2 text-hostsuite-text">
                                {property.guests} ospiti
                              </td>
                              <td className="py-4 px-2">
                                <Badge 
                                  variant={property.status === "active" ? "default" : "secondary"}
                                  className={
                                    property.status === "active" 
                                      ? "bg-green-100 text-green-800" 
                                      : property.status === "maintenance"
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-gray-100 text-gray-800"
                                  }
                                >
                                  {property.status === "active" ? "Attivo" : 
                                   property.status === "maintenance" ? "Manutenzione" : "Inattivo"}
                                </Badge>
                              </td>
                              <td className="py-4 px-2 hidden lg:table-cell">
                                <div className="flex items-center text-hostsuite-text">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                                  {property.rating}
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
    </div>
  );
};

export default HostDashboard;