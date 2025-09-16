import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Calendar, TrendingUp, Home as HomeIcon, Building2, Users, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-travel.jpg";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-hostsuite-primary/10 to-hostsuite-secondary/10" />
        <div 
          className="absolute inset-0 opacity-20 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="relative container mx-auto text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold text-hostsuite-primary mb-6">
            Gestisci case vacanza in modo intelligente
          </h1>
          <p className="text-xl md:text-2xl text-hostsuite-text mb-8 max-w-3xl mx-auto">
            Messaggi, pulizie, biancheria, prezzi dinamici e dashboard AI. Tutto in un unico posto.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-hostsuite hover:scale-105 transition-transform">
              <Link to="/login/host">
                <HomeIcon className="w-5 h-5 mr-2" />
                Accedi Host
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-hostsuite-primary text-hostsuite-primary hover:bg-hostsuite-primary hover:text-white">
              <Link to="/login/guest">
                <Users className="w-5 h-5 mr-2" />
                Accedi Guest
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Come Funziona */}
      <section className="py-20 px-6 bg-hostsuite-light/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-hostsuite-primary mb-4">
              Come funziona
            </h2>
            <p className="text-lg text-hostsuite-text max-w-2xl mx-auto">
              Automatizza ogni aspetto della gestione delle tue proprietà
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-soft transition-shadow border-hostsuite-primary/20">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-hostsuite rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-hostsuite-primary">Automazioni AI</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-hostsuite-text">
                  Template smart per check-in/out e FAQ ricorrenti.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-soft transition-shadow border-hostsuite-primary/20">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-hostsuite rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-hostsuite-primary">Pulizie & biancheria</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-hostsuite-text">
                  Planner turni, checklist e tracciamento biancheria.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-soft transition-shadow border-hostsuite-primary/20">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-hostsuite rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-hostsuite-primary">Prezzi dinamici</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-hostsuite-text">
                  Strategie stagionali e adeguamenti automatici.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Per Chi */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-hostsuite-primary mb-4">
              Per chi
            </h2>
            <p className="text-lg text-hostsuite-text">
              Soluzioni su misura per ogni tipo di gestione
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="hover:shadow-soft transition-shadow border-hostsuite-primary/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-hostsuite rounded-lg flex items-center justify-center">
                    <HomeIcon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-hostsuite-primary">Host singolo</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-hostsuite-text text-base">
                  Semplifica le attività quotidiane e riduci i costi fissi.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-soft transition-shadow border-hostsuite-primary/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-hostsuite rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-hostsuite-primary">Property manager</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-hostsuite-text text-base">
                  Scala operazioni multi-città con processi standardizzati.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust / Proof */}
      <section className="py-20 px-6 bg-hostsuite-light/20">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-hostsuite-primary mb-2">+1.000</div>
              <div className="text-hostsuite-text">proprietà gestite</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-hostsuite-primary mb-2">+25k</div>
              <div className="text-hostsuite-text">host attivi</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-hostsuite-primary mb-2">95%</div>
              <div className="text-hostsuite-text">automazione</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-hostsuite-primary/20">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-hostsuite-text">
              © 2024 HostSuite. Tutti i diritti riservati.
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-hostsuite-text hover:text-hostsuite-primary transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-hostsuite-text hover:text-hostsuite-primary transition-colors">
                Termini di Servizio
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;