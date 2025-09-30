import { useEffect, useState } from "react";
import { Property } from "@/lib/properties";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Calendar, Link as LinkIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface IcalSource {
  id: string;
  channel: string;
  url: string;
  active: boolean;
  last_sync_at: string | null;
  last_status: string | null;
}

interface Props {
  property: Property;
}

const PLATFORMS = [
  { id: "airbnb", name: "Airbnb", color: "bg-[#FF5A5F]" },
  { id: "booking", name: "Booking.com", color: "bg-[#003580]" },
  { id: "vrbo", name: "VRBO", color: "bg-[#006AFF]" },
  { id: "tripadvisor", name: "TripAdvisor", color: "bg-[#00AF87]" },
  { id: "ical", name: "iCal Link", color: "bg-primary" },
  { id: "pms", name: "PMS", color: "bg-secondary" },
];

export function PropertyEditSync({ property }: Props) {
  const [icalSources, setIcalSources] = useState<IcalSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newSource, setNewSource] = useState({ channel: "", url: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadIcalSources();
  }, [property.id]);

  async function loadIcalSources() {
    try {
      const { data, error } = await supabase
        .from("ical_sources")
        .select("*")
        .eq("property_id", property.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setIcalSources(data || []);
    } catch (error) {
      console.error("Error loading iCal sources:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSource() {
    if (!newSource.channel || !newSource.url) {
      toast.error("Compila tutti i campi");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("ical_sources").insert({
        property_id: property.id,
        channel: newSource.channel,
        url: newSource.url,
        active: true,
      });

      if (error) throw error;

      toast.success("Link iCal aggiunto con successo");
      setShowAddDialog(false);
      setNewSource({ channel: "", url: "" });
      loadIcalSources();
    } catch (error) {
      console.error("Error adding iCal source:", error);
      toast.error("Errore nell'aggiunta del link iCal");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSource(id: string) {
    try {
      const { error } = await supabase
        .from("ical_sources")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Link iCal eliminato");
      loadIcalSources();
    } catch (error) {
      console.error("Error deleting iCal source:", error);
      toast.error("Errore nell'eliminazione del link iCal");
    }
  }

  if (loading) {
    return <div className="animate-pulse">Caricamento...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Piattaforme di Prenotazione</CardTitle>
          <CardDescription>
            Connetti le tue piattaforme di prenotazione tramite link iCal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {PLATFORMS.map((platform) => (
              <button
                key={platform.id}
                onClick={() => {
                  setNewSource({ ...newSource, channel: platform.name });
                  setShowAddDialog(true);
                }}
                className={`${platform.color} text-white p-4 rounded-lg hover:opacity-90 transition-opacity text-center font-medium`}
              >
                {platform.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Calendari Collegati</CardTitle>
              <CardDescription>
                Gestisci i tuoi link iCal per sincronizzare le prenotazioni
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Aggiungi Link iCal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {icalSources.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>Nessun calendario collegato</p>
              <p className="text-sm mt-2">
                Aggiungi il tuo primo link iCal per sincronizzare le prenotazioni
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {icalSources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <LinkIcon className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{source.channel}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {source.url}
                      </div>
                    </div>
                    <Badge variant={source.active ? "default" : "secondary"}>
                      {source.active ? "Attivo" : "Inattivo"}
                    </Badge>
                    {source.last_sync_at && (
                      <span className="text-xs text-muted-foreground">
                        Ultima sincronizzazione:{" "}
                        {new Date(source.last_sync_at).toLocaleDateString("it-IT")}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSource(source.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add iCal Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi Link iCal</DialogTitle>
            <DialogDescription>
              Collega una piattaforma di prenotazione tramite il link iCal
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="channel">Piattaforma</Label>
              <Select
                value={newSource.channel}
                onValueChange={(val) => setNewSource({ ...newSource, channel: val })}
              >
                <SelectTrigger id="channel">
                  <SelectValue placeholder="Seleziona piattaforma" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((platform) => (
                    <SelectItem key={platform.id} value={platform.name}>
                      {platform.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">Link iCal</Label>
              <Input
                id="url"
                type="url"
                value={newSource.url}
                onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annulla
            </Button>
            <Button onClick={handleAddSource} disabled={saving}>
              {saving ? "Aggiunta..." : "Aggiungi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
