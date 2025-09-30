import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Property } from "@/lib/properties";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { PropertyEditGeneral } from "@/components/property-edit/PropertyEditGeneral";
import { PropertyEditSync } from "@/components/property-edit/PropertyEditSync";
import { PropertyEditSchedule } from "@/components/property-edit/PropertyEditSchedule";
import { PropertyEditChecklists } from "@/components/property-edit/PropertyEditChecklists";
import { PropertyEditInventory } from "@/components/property-edit/PropertyEditInventory";
import { PropertyEditTeam } from "@/components/property-edit/PropertyEditTeam";
import { PropertyEditPayments } from "@/components/property-edit/PropertyEditPayments";

export default function PropertyEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("generale");

  useEffect(() => {
    if (id) {
      loadProperty(id);
    }
  }, [id]);

  async function loadProperty(propertyId: string) {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", propertyId)
        .single();

      if (error) throw error;
      setProperty(data);
    } catch (error) {
      console.error("Error loading property:", error);
      toast.error("Errore nel caricamento della proprietà");
      navigate("/dashboard/properties");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!property) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Breadcrumb */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard/properties")}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Proprietà
            </Button>
            <div className="text-muted-foreground">/</div>
            <h1 className="text-xl font-semibold">{property.nome}</h1>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 h-auto">
            <TabsTrigger value="generale" className="px-4 py-3">
              Generale
            </TabsTrigger>
            <TabsTrigger value="sincronizzare" className="px-4 py-3">
              Sincronizzare
            </TabsTrigger>
            <TabsTrigger value="programmazione" className="px-4 py-3">
              Programmazione
            </TabsTrigger>
            <TabsTrigger value="liste" className="px-4 py-3">
              Liste di controllo
            </TabsTrigger>
            <TabsTrigger value="inventario" className="px-4 py-3">
              Inventario
            </TabsTrigger>
            <TabsTrigger value="addetti" className="px-4 py-3">
              Addetti
            </TabsTrigger>
            <TabsTrigger value="pagamenti" className="px-4 py-3">
              Pagamenti
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generale" className="mt-6">
            <PropertyEditGeneral property={property} onUpdate={() => loadProperty(property.id)} />
          </TabsContent>

          <TabsContent value="sincronizzare" className="mt-6">
            <PropertyEditSync property={property} />
          </TabsContent>

          <TabsContent value="programmazione" className="mt-6">
            <PropertyEditSchedule property={property} onUpdate={() => loadProperty(property.id)} />
          </TabsContent>

          <TabsContent value="liste" className="mt-6">
            <PropertyEditChecklists property={property} />
          </TabsContent>

          <TabsContent value="inventario" className="mt-6">
            <PropertyEditInventory property={property} />
          </TabsContent>

          <TabsContent value="addetti" className="mt-6">
            <PropertyEditTeam property={property} />
          </TabsContent>

          <TabsContent value="pagamenti" className="mt-6">
            <PropertyEditPayments property={property} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
