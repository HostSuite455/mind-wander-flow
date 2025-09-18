import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Link as LinkIcon, Plus, Settings, Trash2 } from "lucide-react";
import HostNavbar from "@/components/HostNavbar";

// Dummy iCal configuration data
const icalConfigs = [
  {
    id: "1",
    name: "Airbnb - Casa Siena",
    url: "https://airbnb.com/calendar/ical/xxx",
    property: "Casa Siena Centro",
    status: "active",
    lastSync: "2024-03-15 10:30"
  },
  {
    id: "2",
    name: "Booking.com - Roma Apt",
    url: "https://booking.com/calendar/ical/yyy", 
    property: "Appartamento Roma",
    status: "error",
    lastSync: "2024-03-14 15:20"
  }
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge className="bg-green-100 text-green-800">Attivo</Badge>;
    case "error":
      return <Badge className="bg-red-100 text-red-800">Errore</Badge>;
    case "syncing":
      return <Badge className="bg-blue-100 text-blue-800">Sincronizzazione</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const HostIcalConfig = () => {
  return (
    <div className="min-h-screen bg-background">
      <HostNavbar />
      <div className="pt-20 container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-hostsuite-primary mb-2">Configurazione iCal</h1>
          <p className="text-hostsuite-text">Sincronizza i calendari delle tue proprietà con le piattaforme di booking</p>
        </div>

        {/* Add New iCal */}
        <Card className="border-hostsuite-primary/20 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-hostsuite-primary">
              <Plus className="w-6 h-6" />
              Aggiungi Nuovo iCal
            </CardTitle>
            <CardDescription>
              Collega una nuova fonte di calendario per sincronizzare le prenotazioni
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="configName">Nome Configurazione</Label>
                <Input 
                  id="configName" 
                  placeholder="es. Airbnb - Casa Siena"
                  disabled 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="propertySelect">Proprietà</Label>
                <Input 
                  id="propertySelect" 
                  placeholder="Seleziona proprietà..."
                  disabled 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="icalUrl">URL iCal</Label>
              <Input 
                id="icalUrl" 
                placeholder="https://airbnb.com/calendar/ical/..."
                disabled 
              />
            </div>

            <Button disabled>
              <LinkIcon className="w-4 h-4 mr-2" />
              Aggiungi iCal
            </Button>
          </CardContent>
        </Card>

        {/* Current Configurations */}
        <Card className="border-hostsuite-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-hostsuite-primary">
              <Calendar className="w-6 h-6" />
              Configurazioni Esistenti
            </CardTitle>
            <CardDescription>
              Gestisci le tue configurazioni iCal attive
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {icalConfigs.map((config) => (
                <div 
                  key={config.id}
                  className="p-4 border border-hostsuite-primary/20 rounded-lg"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-hostsuite-primary">{config.name}</h3>
                        {getStatusBadge(config.status)}
                      </div>
                      <div className="space-y-1 text-sm text-hostsuite-text">
                        <div className="flex items-center gap-2">
                          <LinkIcon className="w-3 h-3" />
                          <span className="font-mono text-xs break-all">{config.url}</span>
                        </div>
                        <div>Proprietà: {config.property}</div>
                        <div>Ultima sincronizzazione: {config.lastSync}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" disabled>
                        <Settings className="w-3 h-3 mr-1" />
                        Configura
                      </Button>
                      <Button size="sm" variant="outline" disabled>
                        <Calendar className="w-3 h-3 mr-1" />
                        Sincronizza
                      </Button>
                      <Button size="sm" variant="outline" disabled>
                        <Trash2 className="w-3 h-3 mr-1" />
                        Elimina
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {icalConfigs.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-hostsuite-primary/30 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-hostsuite-text mb-2">
                    Nessuna configurazione iCal
                  </h3>
                  <p className="text-hostsuite-text/60">
                    Aggiungi la tua prima configurazione iCal per sincronizzare i calendari
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HostIcalConfig;