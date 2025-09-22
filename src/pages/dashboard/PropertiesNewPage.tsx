import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PropertyWizard from "@/components/PropertyWizard";
import { ArrowLeft, Plus } from "lucide-react";

export default function PropertiesNewPage() {
  const [isWizardOpen, setIsWizardOpen] = useState(true);
  const navigate = useNavigate();

  const handleWizardClose = () => {
    setIsWizardOpen(false);
    navigate('/properties');
  };

  const handleWizardSuccess = () => {
    setIsWizardOpen(false);
    navigate('/properties');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/properties')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alle Proprietà
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Crea Nuova Proprietà</h1>
            <p className="text-muted-foreground">
              Utilizza il wizard per aggiungere una nuova proprietà al tuo portfolio
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Wizard Creazione Proprietà
            </CardTitle>
            <CardDescription>
              Il wizard ti guiderà attraverso 6 semplici passaggi per configurare la tua proprietà.
              I tuoi progressi vengono salvati automaticamente come bozza.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Button onClick={() => setIsWizardOpen(true)} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Inizia Wizard
              </Button>
            </div>
          </CardContent>
        </Card>

        <PropertyWizard
          isOpen={isWizardOpen}
          onClose={handleWizardClose}
          onSuccess={handleWizardSuccess}
        />
      </div>
    </div>
  );
}