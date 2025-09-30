import { useState } from "react";
import { Property } from "@/lib/properties";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Upload } from "lucide-react";

interface Props {
  property: Property;
  onUpdate: () => void;
}

export function PropertyEditGeneral({ property, onUpdate }: Props) {
  const [formData, setFormData] = useState({
    nome: property.nome || "",
    address: property.address || "",
    city: property.city || "",
    country: property.country || "Italia",
    unit_number: property.unit_number || "",
    currency: property.currency || "EUR",
    bedrooms: property.bedrooms || 1,
    beds: property.beds || 1,
    bathrooms: property.bathrooms || 1,
    size_sqm: property.size_sqm || "",
    guests: property.guests || 1,
    max_guests: property.max_guests || 1,
    description: property.description || "",
  });
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(property.image_url || "");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function handleSave() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("properties")
        .update({
          nome: formData.nome,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          unit_number: formData.unit_number,
          currency: formData.currency,
          bedrooms: formData.bedrooms,
          beds: formData.beds,
          bathrooms: formData.bathrooms,
          size_sqm: formData.size_sqm ? parseInt(formData.size_sqm.toString()) : null,
          guests: formData.guests,
          max_guests: formData.max_guests,
          description: formData.description,
          image_url: imagePreview,
        })
        .eq("id", property.id);

      if (error) throw error;

      toast.success("Proprietà aggiornata con successo");
      onUpdate();
    } catch (error) {
      console.error("Error updating property:", error);
      toast.error("Errore nell'aggiornamento della proprietà");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informazioni Generali</CardTitle>
          <CardDescription>
            Aggiorna i dettagli principali della tua proprietà
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Property Name */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome della Proprietà *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Villa al Mare"
            />
          </div>

          {/* Address */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address">Indirizzo</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Via Roma, 123"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit_number">N° Unità</Label>
              <Input
                id="unit_number"
                value={formData.unit_number}
                onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                placeholder="Appartamento 5"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Città</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Milano"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Stato</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Italia"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Valuta</Label>
              <Select value={formData.currency} onValueChange={(val) => setFormData({ ...formData, currency: val })}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">€ Euro</SelectItem>
                  <SelectItem value="USD">$ US Dollar</SelectItem>
                  <SelectItem value="GBP">£ British Pound</SelectItem>
                  <SelectItem value="CHF">CHF Swiss Franc</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Rooms */}
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Camere</Label>
              <Input
                id="bedrooms"
                type="number"
                min="1"
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="beds">Letti</Label>
              <Input
                id="beds"
                type="number"
                min="1"
                value={formData.beds}
                onChange={(e) => setFormData({ ...formData, beds: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bathrooms">Bagni</Label>
              <Input
                id="bathrooms"
                type="number"
                min="1"
                value={formData.bathrooms}
                onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="size">Dimensioni (m²)</Label>
              <Input
                id="size"
                type="number"
                value={formData.size_sqm}
                onChange={(e) => setFormData({ ...formData, size_sqm: e.target.value })}
                placeholder="100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guests">Ospiti</Label>
              <Input
                id="guests"
                type="number"
                min="1"
                value={formData.guests}
                onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_guests">Ospiti Massimi</Label>
              <Input
                id="max_guests"
                type="number"
                min="1"
                value={formData.max_guests}
                onChange={(e) => setFormData({ ...formData, max_guests: parseInt(e.target.value) })}
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Immagine della Proprietà</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="imageUpload"
              />
              <label htmlFor="imageUpload" className="cursor-pointer">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded-lg"
                  />
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Trascina un'immagine o clicca per caricare
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrizione</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Inserisci dettagli utili per gli addetti alle pulizie..."
              rows={5}
              maxLength={1000}
            />
            <div className="text-right text-xs text-muted-foreground">
              {formData.description.length}/1000 caratteri
            </div>
          </div>

          {/* Save Button */}
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
                  Salva Modifiche
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
