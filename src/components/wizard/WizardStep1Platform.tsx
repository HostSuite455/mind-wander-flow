import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronRight } from "lucide-react";

interface PlatformOption {
  id: string;
  name: string;
  icon: string;
  color: string;
  instructions: string;
}

const PLATFORMS: PlatformOption[] = [
  {
    id: "airbnb",
    name: "Airbnb",
    icon: "🏠",
    color: "from-pink-500 to-red-500",
    instructions: "Per trovare il link iCal del tuo annuncio Airbnb: vai su Calendario > Disponibilità e prezzi > Importa/Esporta calendario > Esporta calendario. Copia il link visualizzato.",
  },
  {
    id: "booking",
    name: "Booking.com",
    icon: "🔵",
    color: "from-blue-600 to-blue-700",
    instructions: "Per trovare il link iCal su Booking.com: accedi alla extranet > Calendario > Sincronizzazione calendario > Esporta calendario. Copia il link iCal fornito.",
  },
  {
    id: "vrbo",
    name: "VRBO",
    icon: "🌐",
    color: "from-sky-500 to-blue-600",
    instructions: "Per trovare il link iCal su VRBO: vai su Calendario > Importa/Esporta > Esporta calendario. Copia il link iCal generato per la tua proprietà.",
  },
  {
    id: "ical",
    name: "Link iCal",
    icon: "📅",
    color: "from-teal-500 to-emerald-600",
    instructions: "Inserisci qui il tuo link iCal che può essere estratto dal tuo attuale channel manager o da qualsiasi altra piattaforma che fornisce feed iCal.",
  },
];

interface Props {
  onNext: (data: { platform: string; icalUrl: string }) => void;
}

export default function WizardStep1Platform({ onNext }: Props) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>("airbnb");
  const [icalUrl, setIcalUrl] = useState("");
  const [error, setError] = useState("");

  const handleNext = () => {
    if (!icalUrl.trim()) {
      setError("Il link iCal è obbligatorio per procedere");
      return;
    }

    // Basic validation
    if (!icalUrl.includes("http")) {
      setError("Inserisci un URL valido (deve iniziare con http:// o https://)");
      return;
    }

    onNext({ platform: selectedPlatform, icalUrl: icalUrl.trim() });
  };

  const selectedPlatformData = PLATFORMS.find((p) => p.id === selectedPlatform);

  return (
    <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
      {/* Left Column - Platform Selection */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground mb-6">
          Seleziona la tua piattaforma
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {PLATFORMS.map((platform) => (
            <Card
              key={platform.id}
              className={`
                cursor-pointer transition-all duration-200 p-4 hover:shadow-lg
                ${
                  selectedPlatform === platform.id
                    ? "ring-2 ring-primary shadow-lg scale-105"
                    : "hover:scale-102"
                }
              `}
              onClick={() => {
                setSelectedPlatform(platform.id);
                setError("");
              }}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div
                  className={`w-16 h-16 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center text-3xl shadow-md`}
                >
                  {platform.icon}
                </div>
                <span className="font-medium text-foreground">{platform.name}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* iCal URL Input */}
        <div className="mt-6 space-y-2">
          <label className="text-sm font-medium text-foreground block">
            Link iCal <span className="text-destructive">*</span>
          </label>
          <Input
            type="url"
            placeholder="https://..."
            value={icalUrl}
            onChange={(e) => {
              setIcalUrl(e.target.value);
              setError("");
            }}
            className={error ? "border-destructive" : ""}
          />
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="mt-6">
          <Button onClick={handleNext} className="w-full" size="lg">
            Avanti
            <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Right Column - Instructions */}
      <div className="bg-muted/30 rounded-2xl p-6 border border-border">
        <h3 className="text-xl font-semibold text-foreground mb-4">
          Calendario delle prenotazioni
        </h3>
        
        <div className="space-y-4 text-muted-foreground">
          <p className="leading-relaxed">
            Per sincronizzare il calendario delle tue prenotazioni, hai bisogno del link iCal
            della piattaforma dove gestisci gli annunci.
          </p>

          {selectedPlatformData && (
            <div className="bg-background rounded-lg p-4 border border-border">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg bg-gradient-to-br ${selectedPlatformData.color} flex items-center justify-center text-xl flex-shrink-0`}
                >
                  {selectedPlatformData.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground mb-2">
                    Come trovare il link su {selectedPlatformData.name}
                  </h4>
                  <p className="text-sm leading-relaxed">{selectedPlatformData.instructions}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">Nota importante</p>
                <p>
                  In questa fase inserisci un solo link iCal. Potrai aggiungere altri calendari
                  successivamente dalla gestione della proprietà.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
