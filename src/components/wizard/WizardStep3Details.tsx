import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Save, AlertCircle } from "lucide-react";

interface Props {
  onSubmit: (data: {
    bedrooms: number;
    beds: number;
    bathrooms: number;
    sizeSqm?: number;
    sizeUnit: "sqm" | "sqft";
    unknownSize: boolean;
    checkInFrom: string;
    checkOutUntil: string;
    description: string;
  }) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export default function WizardStep3Details({ onSubmit, onBack, isSubmitting }: Props) {
  const [bedrooms, setBedrooms] = useState<number>(1);
  const [beds, setBeds] = useState<number>(1);
  const [bathrooms, setBathrooms] = useState<number>(1);
  const [sizeSqm, setSizeSqm] = useState<string>("");
  const [sizeUnit, setSizeUnit] = useState<"sqm" | "sqft">("sqm");
  const [unknownSize, setUnknownSize] = useState(false);
  const [checkInFrom, setCheckInFrom] = useState("15:00");
  const [checkOutUntil, setCheckOutUntil] = useState("11:00");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!unknownSize && !sizeSqm) {
      newErrors.size = "Inserisci le dimensioni o seleziona 'Non conosco le dimensioni'";
    }

    if (!checkInFrom) {
      newErrors.checkIn = "L'orario di check-in è obbligatorio";
    }

    if (!checkOutUntil) {
      newErrors.checkOut = "L'orario di check-out è obbligatorio";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const sizeValue = unknownSize ? undefined : parseFloat(sizeSqm);
    const finalSizeInSqm =
      sizeValue && sizeUnit === "sqft" ? Math.round(sizeValue * 0.092903) : sizeValue;

    onSubmit({
      bedrooms,
      beds,
      bathrooms,
      sizeSqm: finalSizeInSqm,
      sizeUnit,
      unknownSize,
      checkInFrom,
      checkOutUntil,
      description,
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-foreground">Camere, dimensioni e orari</h2>
        <span className="text-sm text-muted-foreground">Passo 3 di 3</span>
      </div>

      {/* Room Configuration */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bedrooms">Camere/da letto</Label>
          <Select value={bedrooms.toString()} onValueChange={(val) => setBedrooms(parseInt(val))}>
            <SelectTrigger id="bedrooms">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num} {num === 1 ? "camera" : "camere"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="beds">Letti/i</Label>
          <Select value={beds.toString()} onValueChange={(val) => setBeds(parseInt(val))}>
            <SelectTrigger id="beds">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num} {num === 1 ? "letto" : "letti"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bathrooms">Bagno/i</Label>
          <Select
            value={bathrooms.toString()}
            onValueChange={(val) => setBathrooms(parseInt(val))}
          >
            <SelectTrigger id="bathrooms">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num} {num === 1 ? "bagno" : "bagni"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Size Configuration */}
      <div className="space-y-3">
        <Label htmlFor="size">Dimensioni</Label>
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              id="size"
              type="number"
              value={sizeSqm}
              onChange={(e) => setSizeSqm(e.target.value)}
              placeholder="100"
              disabled={unknownSize}
              className={errors.size ? "border-destructive" : ""}
            />
          </div>
          <Select
            value={sizeUnit}
            onValueChange={(val: "sqm" | "sqft") => setSizeUnit(val)}
            disabled={unknownSize}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sqm">m²</SelectItem>
              <SelectItem value="sqft">ft²</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {errors.size && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.size}
          </p>
        )}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="unknownSize"
            checked={unknownSize}
            onCheckedChange={(checked) => {
              setUnknownSize(checked as boolean);
              if (checked) setErrors((prev) => ({ ...prev, size: "" }));
            }}
          />
          <label htmlFor="unknownSize" className="text-sm text-muted-foreground cursor-pointer">
            Non conosco le dimensioni
          </label>
        </div>
      </div>

      {/* Check-in/out Times */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="checkIn">
            Check-in dalle <span className="text-destructive">*</span>
          </Label>
          <Input
            id="checkIn"
            type="time"
            value={checkInFrom}
            onChange={(e) => setCheckInFrom(e.target.value)}
            className={errors.checkIn ? "border-destructive" : ""}
          />
          {errors.checkIn && <p className="text-sm text-destructive">{errors.checkIn}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="checkOut">
            Check-out fino alle <span className="text-destructive">*</span>
          </Label>
          <Input
            id="checkOut"
            type="time"
            value={checkOutUntil}
            onChange={(e) => setCheckOutUntil(e.target.value)}
            className={errors.checkOut ? "border-destructive" : ""}
          />
          {errors.checkOut && <p className="text-sm text-destructive">{errors.checkOut}</p>}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">
          Descrizione della proprietà <span className="text-sm text-muted-foreground">(visibile agli addetti)</span>
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Inserisci dettagli utili per gli addetti alle pulizie: dove si trovano chiavi, Wi-Fi, note particolari..."
          rows={5}
          maxLength={1000}
          className="resize-none"
        />
        <div className="text-right text-xs text-muted-foreground">
          {description.length}/1000 caratteri
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onBack} size="lg" disabled={isSubmitting}>
          <ChevronLeft className="mr-2 w-5 h-5" />
          Indietro
        </Button>
        <Button onClick={handleSubmit} size="lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Salvataggio...
            </>
          ) : (
            <>
              <Save className="mr-2 w-5 h-5" />
              Salvare La Proprietà
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
