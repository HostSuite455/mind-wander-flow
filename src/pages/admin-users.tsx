import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, 
  RefreshCw, 
  Search, 
  AlertTriangle,
  User,
  Calendar,
  Clock,
  Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supaSelect } from "@/lib/supaSafe";
import HostNavbar from "@/components/HostNavbar";

interface User {
  id: string;
  email?: string;
  created_at?: string;
  role?: string;
  last_sign_in_at?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: usersError } = await supaSelect<User>(
        'users', 
        'id, email, created_at, role, last_sign_in_at, phone, first_name, last_name, is_active'
      );

      if (usersError) {
        setError("Errore nel caricamento degli utenti (RLS attivo)");
        console.warn('Users query error:', usersError);
      } else {
        setUsers(data || []);
      }

    } catch (err) {
      console.error('Error loading users:', err);
      setError("Errore nel caricamento degli utenti");
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    const term = (searchTerm ?? '').toLowerCase();
    
    return users.filter(user => {
      const email = (user.email ?? '').toLowerCase();
      const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.toLowerCase().trim();
      const phone = (user.phone ?? '').toLowerCase();
      
      return email.includes(term) || fullName.includes(term) || phone.includes(term);
    });
  }, [users, searchTerm]);

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

  const roleLabel = (role?: string) => (role?.toLowerCase() || "host");

  const getStatusBadge = (isActive?: boolean) => (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
      {isActive ? "Attivo" : "Inattivo"}
    </span>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <HostNavbar />
        <div className="pt-16">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-6">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-96 w-full" />
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
                  <Users className="w-8 h-8" />
                  Utenti
                </h1>
                <p className="text-hostsuite-text/60 mt-2">
                  Visualizzazione read-only degli utenti del sistema
                </p>
              </div>
              <Button onClick={loadUsers} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Aggiorna
              </Button>
            </div>
          </div>

          {/* RLS Warning */}
          <div className="mb-6">
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-amber-800">
                  <Shield className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Modalità Read-only (RLS)</p>
                    <p className="text-sm">
                      I dati mostrati sono limitati dalle policy di Row Level Security. 
                      Potresti vedere solo i tuoi dati o nessun dato se non hai i permessi necessari.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {error && (
            <div className="mb-6">
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="w-5 h-5" />
                    <p>{error}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search and Filters */}
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ricerca Utenti</CardTitle>
                <CardDescription>
                  Cerca per email, nome o telefono
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-hostsuite-text/50" />
                    <Input
                      placeholder="Cerca utenti..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Badge variant="secondary" className="bg-hostsuite-primary/10 text-hostsuite-primary">
                    {filteredUsers.length} risultati
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          {filteredUsers.length === 0 ? (
            <EmptyState
              icon={<Users className="w-16 h-16 text-hostsuite-primary/30" />}
              title={searchTerm ? "Nessun utente trovato" : "Nessun utente disponibile"}
              description={searchTerm ? "Prova a modificare i termini di ricerca" : "Non ci sono utenti visibili con i permessi attuali"}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Elenco Utenti</span>
                  <Badge variant="secondary" className="bg-hostsuite-primary/10 text-hostsuite-primary">
                    {filteredUsers.length} {filteredUsers.length === 1 ? 'utente' : 'utenti'}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Visualizzazione in sola lettura. Nessuna modifica possibile.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[250px]">Email</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Ruolo</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead>Registrato</TableHead>
                        <TableHead>Ultimo Accesso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-hostsuite-text/50" />
                              <span className="font-medium">
                                {user.email || '—'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.first_name || user.last_name ? (
                              <span>
                                {user.first_name} {user.last_name}
                              </span>
                            ) : (
                              <span className="text-hostsuite-text/50">—</span>
                            )}
                          </TableCell>
                           <TableCell>
                             <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                               {roleLabel(user.role)}
                             </span>
                           </TableCell>
                          <TableCell>
                            {getStatusBadge(user.is_active)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-hostsuite-text/60">
                              <Calendar className="w-3 h-3" />
                              {formatDate(user.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-hostsuite-text/60">
                              <Clock className="w-3 h-3" />
                              {formatDate(user.last_sign_in_at)}
                            </div>
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
  );
};

export default AdminUsers;