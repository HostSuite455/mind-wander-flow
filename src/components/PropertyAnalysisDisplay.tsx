import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Euro, 
  Calendar, 
  Users, 
  Bot, 
  CheckCircle, 
  Target,
  BarChart3,
  Lightbulb,
  Download
} from "lucide-react";

interface PropertyAnalysisDisplayProps {
  analysis: {
    propertyName: string;
    location: string;
    propertyType: string;
    guests: number;
    pricing: {
      suggestedRate: string;
      weeklyDiscount: string;
      monthlyDiscount: string;
      seasonalAdjustment: string;
    };
    optimization: {
      occupancyRate: string;
      avgDailyRate: string;
      revenuePotential: string;
      improvements: string[];
    };
    automation: {
      autoCheckin: string;
      guestCommunication: string;
      cleaningSchedule: string;
      priceOptimization: string;
    };
  };
}

const PropertyAnalysisDisplay = ({ analysis }: PropertyAnalysisDisplayProps) => {
  return (
    <section className="py-20 bg-gradient-to-br from-secondary/10 to-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-hostsuite-primary to-hostsuite-secondary bg-clip-text text-transparent">
            Analisi AI Completata
          </h2>
          <p className="text-xl text-muted-foreground">
            Ecco l'analisi dettagliata per <strong>{analysis.propertyName}</strong>
          </p>
        </div>

        {/* Panoramica Proprietà */}
        <div className="mb-8 p-6 bg-gradient-to-r from-hostsuite-primary/10 to-hostsuite-secondary/10 rounded-lg border border-hostsuite-primary/20">
          <div className="grid md:grid-cols-4 gap-4 text-center">
            <div>
              <h4 className="font-semibold text-hostsuite-primary">Proprietà</h4>
              <p className="text-sm text-muted-foreground">{analysis.propertyType}</p>
            </div>
            <div>
              <h4 className="font-semibold text-hostsuite-primary">Località</h4>
              <p className="text-sm text-muted-foreground">{analysis.location}</p>
            </div>
            <div>
              <h4 className="font-semibold text-hostsuite-primary">Capacità</h4>
              <p className="text-sm text-muted-foreground">{analysis.guests} ospiti</p>
            </div>
            <div>
              <h4 className="font-semibold text-hostsuite-primary">Status</h4>
              <Badge className="bg-green-100 text-green-800">Analizzata</Badge>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Pricing Strategy */}
          <Card className="shadow-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-hostsuite-primary">
                <Euro className="w-5 h-5" />
                Strategia Prezzi AI
              </CardTitle>
              <CardDescription>
                Raccomandazioni per massimizzare i ricavi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-hostsuite-primary/5 rounded-lg">
                  <h4 className="font-semibold text-hostsuite-primary mb-2">Tariffa Base</h4>
                  <p className="text-2xl font-bold">{analysis.pricing.suggestedRate}</p>
                </div>
                <div className="p-4 bg-hostsuite-secondary/5 rounded-lg">
                  <h4 className="font-semibold text-hostsuite-secondary mb-2">Sconto Settimanale</h4>
                  <p className="text-2xl font-bold">{analysis.pricing.weeklyDiscount}</p>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-r from-hostsuite-accent/10 to-hostsuite-primary/10 rounded-lg">
                <h4 className="font-semibold mb-2">Adeguamenti Stagionali</h4>
                <p className="text-sm">{analysis.pricing.seasonalAdjustment}</p>
              </div>
              <div className="p-4 bg-hostsuite-secondary/5 rounded-lg">
                <h4 className="font-semibold text-hostsuite-secondary mb-2">Sconto Mensile</h4>
                <p className="text-xl font-bold">{analysis.pricing.monthlyDiscount}</p>
              </div>
            </CardContent>
          </Card>

          {/* Performance Optimization */}
          <Card className="shadow-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-hostsuite-secondary">
                <BarChart3 className="w-5 h-5" />
                Ottimizzazione Performance
              </CardTitle>
              <CardDescription>
                Metriche e potenziale di crescita
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-green-50 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">Occupazione</p>
                  <p className="text-xl font-bold text-green-600">{analysis.optimization.occupancyRate}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Euro className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">ADR</p>
                  <p className="text-xl font-bold text-blue-600">{analysis.optimization.avgDailyRate}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Target className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">Ricavo Mensile</p>
                  <p className="text-xl font-bold text-purple-600">{analysis.optimization.revenuePotential}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Automation Features */}
          <Card className="shadow-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-hostsuite-accent">
                <Bot className="w-5 h-5" />
                Automazione AI
              </CardTitle>
              <CardDescription>
                Funzionalità automatiche già attive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Check-in Automatico</span>
                  </div>
                  <Badge variant="secondary">{analysis.automation.autoCheckin}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Comunicazioni AI</span>
                  </div>
                  <Badge variant="secondary">Attivo</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">Pulizie</span>
                  </div>
                  <Badge variant="secondary">Automatico</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                    <span className="font-medium">Dynamic Pricing</span>
                  </div>
                  <Badge variant="secondary">Attivo</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Improvement Suggestions */}
          <Card className="shadow-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-hostsuite-primary">
                <Lightbulb className="w-5 h-5" />
                Suggerimenti AI
              </CardTitle>
              <CardDescription>
                Raccomandazioni per migliorare le performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.optimization.improvements.map((improvement, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-hostsuite-primary/5 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-hostsuite-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{improvement}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="mt-12 text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-hostsuite text-white">
              <Bot className="w-5 h-5 mr-2" />
              Implementa Suggerimenti
            </Button>
            <Button variant="outline" size="lg">
              <Download className="w-5 h-5 mr-2" />
              Scarica Report
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PropertyAnalysisDisplay;