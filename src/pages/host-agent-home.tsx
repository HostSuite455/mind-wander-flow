import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Settings, MessageSquare, BarChart3 } from "lucide-react";
import HostNavbar from "@/components/HostNavbar";

const HostAgentHome = () => {
  return (
    <div className="min-h-screen bg-background">
      <HostNavbar />
      <div className="pt-20 container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-hostsuite-primary mb-2">iAgent Home</h1>
          <p className="text-hostsuite-text">Centro di controllo per l'assistente AI delle tue proprietà</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-hostsuite-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-hostsuite-primary">
                <MessageSquare className="w-5 h-5" />
                Conversazioni
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-hostsuite-primary">127</div>
              <p className="text-sm text-hostsuite-text">Questo mese</p>
            </CardContent>
          </Card>
          
          <Card className="border-hostsuite-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-hostsuite-primary">
                <BarChart3 className="w-5 h-5" />
                Tasso Risposta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-hostsuite-primary">94%</div>
              <p className="text-sm text-hostsuite-text">Media mensile</p>
            </CardContent>
          </Card>

          <Card className="border-hostsuite-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-hostsuite-primary">
                <Bot className="w-5 h-5" />
                Agent Attivi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-hostsuite-primary">3</div>
              <p className="text-sm text-hostsuite-text">Proprietà connesse</p>
            </CardContent>
          </Card>

          <Card className="border-hostsuite-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-hostsuite-primary">
                <Settings className="w-5 h-5" />
                Configurazioni
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-hostsuite-primary">12</div>
              <p className="text-sm text-hostsuite-text">Template attivi</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Agent Management */}
          <div className="lg:col-span-2">
            <Card className="border-hostsuite-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-hostsuite-primary">
                  <Bot className="w-6 h-6" />
                  Gestione iAgent
                </CardTitle>
                <CardDescription>
                  Configura e monitora gli assistenti AI per le tue proprietà
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border border-hostsuite-primary/20 rounded-lg">
                    <h3 className="font-semibold text-hostsuite-primary mb-2">Casa Siena Centro</h3>
                    <p className="text-sm text-hostsuite-text mb-3">Agent attivo - Ultimo aggiornamento: 2 ore fa</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" disabled>
                        <Settings className="w-3 h-3 mr-1" />
                        Configura
                      </Button>
                      <Button size="sm" variant="outline" disabled>
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Chat Log
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-hostsuite-primary/20 rounded-lg opacity-60">
                    <h3 className="font-semibold text-hostsuite-text mb-2">Appartamento Roma</h3>
                    <p className="text-sm text-hostsuite-text mb-3">Agent non configurato</p>
                    <Button size="sm" disabled>
                      <Settings className="w-3 h-3 mr-1" />
                      Configura Agent
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card className="border-hostsuite-primary/20">
              <CardHeader>
                <CardTitle className="text-hostsuite-primary">Azioni Rapide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline" disabled>
                  <Bot className="w-4 h-4 mr-2" />
                  Nuovo Agent
                </Button>
                <Button className="w-full justify-start" variant="outline" disabled>
                  <Settings className="w-4 h-4 mr-2" />
                  Template Globali
                </Button>
                <Button className="w-full justify-start" variant="outline" disabled>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Report Attività
                </Button>
              </CardContent>
            </Card>

            <Card className="border-hostsuite-primary/20">
              <CardHeader>
                <CardTitle className="text-hostsuite-primary">Notifiche</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-hostsuite-text">
                  Nessuna notifica al momento. Gli agent stanno funzionando correttamente.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostAgentHome;