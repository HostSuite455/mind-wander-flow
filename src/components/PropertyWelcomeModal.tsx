import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Building2, CheckCircle } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onAddProperty: () => void;
}

export default function PropertyWelcomeModal({ open, onClose, onAddProperty }: Props) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
        <div className="relative">
          {/* Header with gradient */}
          <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground p-12 text-center">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-bold mb-3">Aggiungi proprietà</h2>
            <p className="text-primary-foreground/90 text-lg">
              Gestisci le tue proprietà in modo semplice ed efficace
            </p>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    Sincronizzazione automatica del calendario
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Collega i tuoi calendari da Airbnb, Booking.com, VRBO o altri canali tramite
                    link iCal per evitare doppie prenotazioni.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    Gestione automatica delle pulizie
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Il sistema crea automaticamente task di pulizia per ogni prenotazione e li
                    assegna al tuo team di addetti.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Tutto in un unico posto</h3>
                  <p className="text-sm text-muted-foreground">
                    Visualizza prenotazioni, blocchi calendario e task di pulizia in un'interfaccia
                    chiara e intuitiva.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t">
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Dopo
                </Button>
                <Button onClick={onAddProperty} className="flex-1" size="lg">
                  <Building2 className="w-4 h-4 mr-2" />
                  Aggiungi Proprietà
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
