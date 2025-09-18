import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Bot, Save, TestTube } from "lucide-react";
import HostNavbar from "@/components/HostNavbar";

const HostAgentConfig = () => {
  return (
    <div className="min-h-screen bg-background">
      <HostNavbar />
      <div className="pt-20 container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-hostsuite-primary mb-2">Configurazione iAgent</h1>
          <p className="text-hostsuite-text">Personalizza il comportamento dell'assistente AI per le tue proprietà</p>
        </div>

        <div className="space-y-8">
          {/* Agent Settings */}
          <Card className="border-hostsuite-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-hostsuite-primary">
                <Bot className="w-6 h-6" />
                Impostazioni Agent
              </CardTitle>
              <CardDescription>
                Configura le caratteristiche principali dell'assistente AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="agentName">Nome Agent</Label>
                  <Input 
                    id="agentName" 
                    placeholder="es. Sofia - Assistant Siena" 
                    disabled 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="propertySelect">Proprietà</Label>
                  <Input 
                    id="propertySelect" 
                    value="Casa Siena Centro" 
                    disabled 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agentPersonality">Personalità Agent</Label>
                <Textarea 
                  id="agentPersonality"
                  placeholder="Descrivi come dovrebbe comportarsi l'agent (es. cordiale, professionale, informativo...)"
                  rows={3}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">Messaggio di Benvenuto</Label>
                <Textarea 
                  id="welcomeMessage"
                  placeholder="Messaggio automatico inviato ai nuovi ospiti"
                  rows={2}
                  disabled
                />
              </div>
            </CardContent>
          </Card>

          {/* Response Templates */}
          <Card className="border-hostsuite-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-hostsuite-primary">
                <Settings className="w-6 h-6" />
                Template Risposte
              </CardTitle>
              <CardDescription>
                Configura le risposte automatiche per domande comuni
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 border border-hostsuite-primary/20 rounded-lg">
                  <Label className="text-sm font-medium text-hostsuite-primary">Check-in</Label>
                  <Textarea 
                    placeholder="Template per informazioni check-in..."
                    rows={2}
                    className="mt-2"
                    disabled
                  />
                </div>

                <div className="p-4 border border-hostsuite-primary/20 rounded-lg">
                  <Label className="text-sm font-medium text-hostsuite-primary">Wi-Fi</Label>
                  <Textarea 
                    placeholder="Template per credenziali Wi-Fi..."
                    rows={2}
                    className="mt-2"
                    disabled
                  />
                </div>

                <div className="p-4 border border-hostsuite-primary/20 rounded-lg">
                  <Label className="text-sm font-medium text-hostsuite-primary">Consigli Locali</Label>
                  <Textarea 
                    placeholder="Template per raccomandazioni locali..."
                    rows={2}
                    className="mt-2"
                    disabled
                  />
                </div>
              </div>

              <Button variant="outline" disabled className="w-full">
                + Aggiungi Nuovo Template
              </Button>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button disabled className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Salva Configurazione
            </Button>
            <Button variant="outline" disabled className="flex-1">
              <TestTube className="w-4 h-4 mr-2" />
              Testa Agent
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostAgentConfig;