import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Home, Users, Calendar, Bot, TrendingUp, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import guestAiImage from "@/assets/guest-ai.png";
import hostAiImage from "@/assets/host-ai.png";

interface HostDashboardProps {
  onAnalysisGenerated: (analysis: any) => void;
}

const HostDashboard = ({ onAnalysisGenerated }: HostDashboardProps) => {
  const [propertyName, setPropertyName] = useState("");
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [guests, setGuests] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simula analisi AI
    setTimeout(() => {
      // Mock analysis rimosso
      
      // Mock analysis call rimossa
      toast({
        title: "Analisi Completata!",
        description: "La tua proprietà è stata analizzata con successo.",
      });
      setIsLoading(false);
    }, 2000);
  };

  return (
    <section id="host-dashboard" className="py-20 bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-hostsuite-primary to-hostsuite-secondary bg-clip-text text-transparent">
            Dashboard Host AI
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ottimizza la gestione della tua proprietà con l'intelligenza artificiale. 
            Prezzi dinamici, automazione completa e analisi predittive.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Form Section */}
          <Card className="shadow-glow border-hostsuite-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-hostsuite-primary">
                <Home className="w-5 h-5" />
                Analizza la Tua Proprietà
              </CardTitle>
              <CardDescription>
                Inserisci i dettagli per ricevere un'analisi AI completa e raccomandazioni personalizzate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="propertyName">Nome Proprietà</Label>
                    <Input
                      id="propertyName"
                      placeholder="Nome della proprietà"
                      value={propertyName}
                      onChange={(e) => setPropertyName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Località</Label>
                    <Input
                      id="location"
                      placeholder="Città, Regione"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="propertyType">Tipo Proprietà</Label>
                    <Select value={propertyType} onValueChange={setPropertyType} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="apartment">Appartamento</SelectItem>
                        <SelectItem value="house">Casa Intera</SelectItem>
                        <SelectItem value="villa">Villa</SelectItem>
                        <SelectItem value="room">Stanza Privata</SelectItem>
                        <SelectItem value="bnb">B&B</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guests">Ospiti Massimi</Label>
                    <Select value={guests} onValueChange={setGuests} required>
                      <SelectTrigger>
                        <SelectValue placeholder="N. ospiti" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Ospite</SelectItem>
                        <SelectItem value="2">2 Ospiti</SelectItem>
                        <SelectItem value="4">4 Ospiti</SelectItem>
                        <SelectItem value="6">6 Ospiti</SelectItem>
                        <SelectItem value="8">8+ Ospiti</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrizione & Amenities</Label>
                  <Textarea
                    id="description"
                    placeholder="Descrivi la tua proprietà, servizi offerti, posizione strategica..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-hostsuite text-white hover:scale-105 transition-all duration-300"
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Bot className="w-5 h-5 mr-2 animate-spin" />
                      Analizzando con AI...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Analizza Proprietà
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Features Section */}
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-hostsuite-primary/10 to-hostsuite-secondary/10 border-hostsuite-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-hostsuite-primary">
                  <Bot className="w-5 h-5" />
                  AI per Host
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <img src={hostAiImage} alt="Host AI" className="w-16 h-16" />
                  <div>
                    <h4 className="font-semibold text-hostsuite-primary">Assistente Intelligente</h4>
                    <p className="text-sm text-muted-foreground">
                      Ottimizza prezzi, gestisce comunicazioni e automatizza operazioni
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-hostsuite-primary" />
                    Dynamic Pricing & Revenue Management
                  </li>
                  <li className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-hostsuite-primary" />
                    Gestione Automatica Prenotazioni
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-hostsuite-primary" />
                    Comunicazione AI con Ospiti
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-hostsuite-secondary/10 to-hostsuite-accent/10 border-hostsuite-secondary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-hostsuite-secondary">
                  <Users className="w-5 h-5" />
                  AI per Ospiti
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <img src={guestAiImage} alt="Guest AI" className="w-16 h-16" />
                  <div>
                    <h4 className="font-semibold text-hostsuite-secondary">Concierge Virtuale</h4>
                    <p className="text-sm text-muted-foreground">
                      Assiste i tuoi ospiti 24/7 con raccomandazioni personalizzate
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-hostsuite-secondary" />
                    Raccomandazioni Locali Personalizzate
                  </li>
                  <li className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-hostsuite-secondary" />
                    Supporto Istantaneo H24
                  </li>
                  <li className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-hostsuite-secondary" />
                    Guida Automatica alla Proprietà
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HostDashboard;