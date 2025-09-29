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

      // Use profiles table instead of auth.users for security
      const { data, error } = await supaSelect('profiles', '*');

      if (error) {
        console.error('Error loading users:', error);
        setError("Errore nel caricamento degli utenti");
        toast({
          variant: "destructive",
          title: "Errore",
          description: "Errore nel caricamento degli utenti",
        });
      } else {
        setUsers(data || []);
      }
    } catch (err) {
      console.error('Error loading users:', err);
      setError("Errore nel caricamento degli utenti");
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Errore nel caricamento degli utenti",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const term = (searchTerm ?? '').toLowerCase();
    
    return users.filter(user => {
      const email = (user.email || '').toLowerCase();
      const firstName = (user.first_name || '').toLowerCase();
      const lastName = (user.last_name || '').toLowerCase();
      const phone = (user.phone || '').toLowerCase();
      
      return email.includes(term) || 
             firstName.includes(term) || 
             lastName.includes(term) || 
             phone.includes(term);
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

  const getStatusBadge = (isActive?: boolean) => {
    if (isActive === undefined) {
      return <Badge variant="secondary">Non definito</Badge>;
    }
    
    return isActive ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        Attivo
      </Badge>
    ) : (
      <Badge variant="destructive">
        Inattivo
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
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
              <Users className="w-8 h-8" />
              Gestione Utenti
            </h1>
            <p className="text-hostsuite-text/60 mt-2">
              Visualizza e gestisci tutti gli utenti registrati
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

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="w-5 h-5" />
            Ricerca Utenti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-hostsuite-text/50" />
            <Input
              placeholder="Cerca per email, nome, cognome o telefono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="mt-2 text-sm text-hostsuite-text/60">
            Totale utenti: {users.length} | Filtrati: {filteredUsers.length}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <EmptyState
          icon={<Users className="w-16 h-16 text-hostsuite-primary/30" />}
          title={searchTerm ? "Nessun utente trovato" : "Nessun utente disponibile"}
          description={searchTerm ? "Prova a modificare i termini di ricerca" : "Non ci sono utenti registrati nel sistema"}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Utenti Registrati</span>
              <Badge variant="secondary" className="bg-hostsuite-primary/10 text-hostsuite-primary">
                {filteredUsers.length} {filteredUsers.length === 1 ? 'utente' : 'utenti'}
              </Badge>
            </CardTitle>
            <CardDescription>
              Lista completa degli utenti registrati nel sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utente</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefono</TableHead>
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
                          <User className="w-4 h-4 text-hostsuite-primary" />
                          <div>
                            <div className="font-medium">
                              {user.first_name || user.last_name 
                                ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                                : 'Nome non disponibile'
                              }
                            </div>
                            <div className="text-sm text-hostsuite-text/60">
                              ID: {user.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.email || <span className="text-hostsuite-text/50">—</span>}
                      </TableCell>
                      <TableCell>
                        {user.phone || <span className="text-hostsuite-text/50">—</span>}
                      </TableCell>
                      <TableCell>
                        {user.role ? (
                          <Badge variant="outline">{user.role}</Badge>
                        ) : (
                          <span className="text-hostsuite-text/50">—</span>
                        )}
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
  );
};

export default AdminUsers;