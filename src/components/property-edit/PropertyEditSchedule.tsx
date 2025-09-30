import { useState } from "react";
import { Property } from "@/lib/properties";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Clock } from "lucide-react";

interface Props {
  property: Property;
  onUpdate: () => void;
}

export function PropertyEditSchedule({ property, onUpdate }: Props) {
  const [checkInFrom, setCheckInFrom] = useState(property.check_in_from || "15:00");
  const [checkOutUntil, setCheckOutUntil] = useState(property.check_out_until || "11:00");
  const [cleaningDuration, setCleaningDuration] = useState(
    property.default_turnover_duration_min || 120
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("properties")
        .update({
          check_in_from: checkInFrom,
          check_out_until: checkOutUntil,
          default_turnover_duration_min: cleaningDuration,
        })
        .eq("id", property.id);

      if (error) throw error;

      toast.success("Orari aggiornati con successo");
      onUpdate();
    } catch (error) {
      console.error("Error updating schedule:", error);
      toast.error("Errore nell'aggiornamento degli orari");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Orari Check-in / Check-out</CardTitle>
          <CardDescription>
            Configura gli orari standard per i tuoi ospiti
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="checkIn">Check-in dalle</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="checkIn"
                  type="time"
                  value={checkInFrom}
                  onChange={(e) => setCheckInFrom(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkOut">Check-out fino alle</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="checkOut"
                  type="time"
                  value={checkOutUntil}
                  onChange={(e) => setCheckOutUntil(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configurazione Pulizia</CardTitle>
          <CardDescription>
            Imposta la durata standard per le pulizie di cambio turno
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="cleaningDuration">
              Durata pulizia standard (minuti)
            </Label>
            <Input
              id="cleaningDuration"
              type="number"
              min="30"
              step="15"
              value={cleaningDuration}
              onChange={(e) => setCleaningDuration(parseInt(e.target.value))}
            />
            <p className="text-sm text-muted-foreground">
              Tempo stimato: {Math.floor(cleaningDuration / 60)}h{" "}
              {cleaningDuration % 60}min
            </p>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Nota:</strong> La pulizia inizierà automaticamente dopo il
              check-out e dovrà essere completata prima del prossimo check-in.
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} size="lg">
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Salvataggio...
                </>
              ) : (
                <>
                  <Save className="mr-2 w-5 h-5" />
                  Salva Orari
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
