import { useState, useEffect } from "react";
import { Property } from "@/lib/properties";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Plus, Mail, Phone, Star, Activity, UserPlus, MessageCircle } from "lucide-react";

interface Props {
  property: Property;
}

interface Cleaner {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  whatsapp_number?: string;
  avatar_url?: string;
  skills?: string[];
  notification_preferences?: {
    whatsapp: boolean;
    email: boolean;
  };
}

interface CleanerAssignment {
  cleaner_id: string;
  weight: number;
  active: boolean;
}

export function PropertyEditTeam({ property }: Props) {
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [assignments, setAssignments] = useState<CleanerAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [newCleaner, setNewCleaner] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp_number: "",
  });

  useEffect(() => {
    loadTeamData();
  }, [property.id]);

  async function loadTeamData() {
    try {
      // Carica tutti i cleaners dell'host
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: cleanersData, error: cleanersError } = await supabase
        .from("cleaners")
        .select("*")
        .eq("owner_id", user.id);

      if (cleanersError) throw cleanersError;

      // Carica assignments per questa property
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("cleaner_assignments")
        .select("*")
        .eq("property_id", property.id);

      if (assignmentsError) throw assignmentsError;

      setCleaners(cleanersData || []);
      setAssignments(assignmentsData || []);
    } catch (error) {
      console.error("Error loading team data:", error);
      toast.error("Errore nel caricamento del team");
    } finally {
      setLoading(false);
    }
  }

  async function inviteCleaner() {
    if (!newCleaner.name || !newCleaner.phone) {
      toast.error("Inserisci almeno nome e telefono");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Crea cleaner
      const { data: createdCleaner, error: cleanerError } = await supabase
        .from("cleaners")
        .insert({
          owner_id: user.id,
          name: newCleaner.name,
          email: newCleaner.email || null,
          phone: newCleaner.phone,
          whatsapp_number: newCleaner.whatsapp_number || newCleaner.phone,
          notification_preferences: {
            whatsapp: true,
            email: !!newCleaner.email,
          },
        })
        .select()
        .single();

      if (cleanerError) throw cleanerError;

      // Assegna automaticamente alla property corrente
      const { error: assignmentError } = await supabase
        .from("cleaner_assignments")
        .insert({
          property_id: property.id,
          cleaner_id: createdCleaner.id,
          weight: 1,
          active: true,
        });

      if (assignmentError) throw assignmentError;

      toast.success(`${newCleaner.name} invitato al team! 👋`);
      setShowInviteDialog(false);
      setNewCleaner({ name: "", email: "", phone: "", whatsapp_number: "" });
      loadTeamData();
    } catch (error) {
      console.error("Error inviting cleaner:", error);
      toast.error("Errore nell'invito dell'addetto");
    }
  }

  async function toggleAssignment(cleanerId: string) {
    try {
      const existing = assignments.find((a) => a.cleaner_id === cleanerId);

      if (existing) {
        // Rimuovi assignment
        const { error } = await supabase
          .from("cleaner_assignments")
          .delete()
          .eq("property_id", property.id)
          .eq("cleaner_id", cleanerId);

        if (error) throw error;
        toast.success("Addetto rimosso dalla proprietà");
      } else {
        // Aggiungi assignment
        const { error } = await supabase.from("cleaner_assignments").insert({
          property_id: property.id,
          cleaner_id: cleanerId,
          weight: 1,
          active: true,
        });

        if (error) throw error;
        toast.success("Addetto assegnato alla proprietà");
      }

      loadTeamData();
    } catch (error) {
      console.error("Error toggling assignment:", error);
      toast.error("Errore nell'assegnazione");
    }
  }

  const isAssigned = (cleanerId: string) => {
    return assignments.some((a) => a.cleaner_id === cleanerId && a.active);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Stats */}
      {cleaners.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Team Totale</p>
                  <p className="text-2xl font-bold">{cleaners.length}</p>
                </div>
                <Users className="w-8 h-8 text-muted-foreground opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Assegnati qui</p>
                  <p className="text-2xl font-bold text-primary">
                    {assignments.filter((a) => a.active).length}
                  </p>
                </div>
                <Star className="w-8 h-8 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">WhatsApp Attivo</p>
                  <p className="text-2xl font-bold text-green-500">
                    {
                      cleaners.filter(
                        (c) =>
                          c.notification_preferences?.whatsapp && c.whatsapp_number
                      ).length
                    }
                  </p>
                </div>
                <MessageCircle className="w-8 h-8 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Team Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestione Team</CardTitle>
              <CardDescription>
                Invita e gestisci gli addetti per questa proprietà
              </CardDescription>
            </div>
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invita Addetto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invita Nuovo Addetto</DialogTitle>
                  <DialogDescription>
                    Inserisci i dettagli dell'addetto per inviare l'invito
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome Completo *</Label>
                    <Input
                      placeholder="es. Mario Rossi"
                      value={newCleaner.name}
                      onChange={(e) =>
                        setNewCleaner({ ...newCleaner, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="mario@example.com"
                      value={newCleaner.email}
                      onChange={(e) =>
                        setNewCleaner({ ...newCleaner, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefono *</Label>
                    <Input
                      type="tel"
                      placeholder="+39 123 456 7890"
                      value={newCleaner.phone}
                      onChange={(e) =>
                        setNewCleaner({ ...newCleaner, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp</Label>
                    <Input
                      type="tel"
                      placeholder="+39 123 456 7890 (se diverso)"
                      value={newCleaner.whatsapp_number}
                      onChange={(e) =>
                        setNewCleaner({ ...newCleaner, whatsapp_number: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Lascia vuoto per usare il numero di telefono principale
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                    Annulla
                  </Button>
                  <Button onClick={inviteCleaner}>Invia Invito</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {cleaners.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
              <h3 className="text-lg font-medium mb-2">Inizia a costruire il tuo team!</h3>
              <p className="text-muted-foreground mb-6">
                Invita il primo addetto per iniziare a gestire le pulizie
              </p>
              <Button onClick={() => setShowInviteDialog(true)} size="lg">
                <UserPlus className="w-4 h-4 mr-2" />
                Invita Primo Addetto
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {cleaners.map((cleaner) => {
                const assigned = isAssigned(cleaner.id);

                return (
                  <Card
                    key={cleaner.id}
                    className={`transition-all ${
                      assigned ? "border-primary bg-primary/5" : "hover:shadow-md"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-14 h-14">
                          <AvatarImage src={cleaner.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/50 text-white">
                            {getInitials(cleaner.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{cleaner.name}</h4>
                            {assigned && (
                              <Badge className="bg-primary">Assegnato</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            {cleaner.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {cleaner.email}
                              </div>
                            )}
                            {cleaner.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {cleaner.phone}
                              </div>
                            )}
                            {cleaner.whatsapp_number && (
                              <div className="flex items-center gap-1 text-green-600">
                                <MessageCircle className="w-3 h-3" />
                                WhatsApp
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant={assigned ? "outline" : "default"}
                          onClick={() => toggleAssignment(cleaner.id)}
                        >
                          {assigned ? "Rimuovi" : "Assegna"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
