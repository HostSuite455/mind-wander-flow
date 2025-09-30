import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Property } from "@/lib/properties";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PropertyWelcomeModal from "@/components/PropertyWelcomeModal";
import { Plus, Search, Edit, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function Properties() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deletePropertyId, setDeletePropertyId] = useState<string | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    loadProperties();
  }, []);

  async function loadProperties() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("host_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProperties(data || []);
      
      // Show welcome modal if no properties
      if (!data || data.length === 0) {
        setShowWelcomeModal(true);
      }
    } catch (error) {
      console.error("Error loading properties:", error);
      toast.error("Errore nel caricamento delle proprietà");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProperty(propertyId: string) {
    try {
      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", propertyId);

      if (error) throw error;

      toast.success("Proprietà eliminata con successo");
      loadProperties();
    } catch (error) {
      console.error("Error deleting property:", error);
      toast.error("Errore nell'eliminazione della proprietà");
    } finally {
      setDeletePropertyId(null);
    }
  }

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.address?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || property.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Le Tue Proprietà</h1>
          <p className="text-muted-foreground mt-1">
            Gestisci le tue proprietà e calendari
          </p>
        </div>
        <Button
          onClick={() => navigate("/dashboard/properties/new")}
          size="lg"
          className="gap-2"
        >
          <Plus className="w-5 h-5" />
          Aggiungi Proprietà
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Cerca proprietà per nome, città o indirizzo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Stato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte</SelectItem>
            <SelectItem value="active">Attive</SelectItem>
            <SelectItem value="inactive">Inattive</SelectItem>
            <SelectItem value="draft">Bozze</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Properties Grid */}
      {filteredProperties.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-muted-foreground mb-4">
            {searchQuery || statusFilter !== "all"
              ? "Nessuna proprietà trovata con i filtri selezionati"
              : "Non hai ancora aggiunto proprietà"}
          </div>
          {!searchQuery && statusFilter === "all" && (
            <Button onClick={() => navigate("/dashboard/properties/new")}>
              <Plus className="w-4 h-4 mr-2" />
              Aggiungi la Tua Prima Proprietà
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <Card
              key={property.id}
              className="group hover:shadow-lg transition-all cursor-pointer overflow-hidden"
            >
              <div
                className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 relative"
                style={
                  property.image_url
                    ? { backgroundImage: `url(${property.image_url})`, backgroundSize: "cover", backgroundPosition: "center" }
                    : {}
                }
              >
                {!property.image_url && (
                  <div className="absolute inset-0 flex items-center justify-center text-primary/40 text-6xl font-bold">
                    {property.nome.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0 bg-background/90 hover:bg-background"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/dashboard/properties/${property.id}/edit`);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8 w-8 p-0 bg-destructive/90 hover:bg-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletePropertyId(property.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardContent
                className="p-4"
                onClick={() => navigate(`/dashboard/properties/${property.id}/edit`)}
              >
                <h3 className="font-semibold text-lg mb-2 truncate">
                  {property.nome}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">
                    {property.city || property.address || "Indirizzo non specificato"}
                  </span>
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  {property.bedrooms && (
                    <span>{property.bedrooms} camere</span>
                  )}
                  {property.beds && (
                    <span>{property.beds} letti</span>
                  )}
                  {property.guests && (
                    <span>{property.guests} ospiti</span>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      property.status === "active"
                        ? "bg-primary/10 text-primary"
                        : property.status === "inactive"
                        ? "bg-muted text-muted-foreground"
                        : "bg-accent/10 text-accent"
                    }`}
                  >
                    {property.status === "active"
                      ? "Attiva"
                      : property.status === "inactive"
                      ? "Inattiva"
                      : "Bozza"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Welcome Modal */}
      <PropertyWelcomeModal
        open={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        onAddProperty={() => {
          setShowWelcomeModal(false);
          navigate("/dashboard/properties/new");
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePropertyId} onOpenChange={() => setDeletePropertyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questa proprietà?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. La proprietà e tutti i dati
              associati verranno eliminati permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePropertyId && handleDeleteProperty(deletePropertyId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
