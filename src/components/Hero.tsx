import { Button } from "@/components/ui/button";
import sienaDayImage from "@/assets/siena-day.png";
import hostAiImage from "@/assets/host-ai.png";
import { Home, Users, Bot, Sparkles } from "lucide-react";

const Hero = () => {
  const scrollToDashboard = () => {
    document.getElementById('host-dashboard')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${sienaDayImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-hostsuite-primary/80 via-hostsuite-secondary/60 to-hostsuite-accent/70" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-white/90 text-sm font-medium">AI per Host e Property Manager</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Gestisci la Tua
            <br />
            <span className="bg-gradient-to-r from-hostsuite-accent to-hostsuite-secondary bg-clip-text text-transparent">
              Proprietà con AI
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            La piattaforma completa per host e property manager. AI per ottimizzare prezzi, 
            automatizzare comunicazioni e migliorare l'esperienza degli ospiti.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg"
              onClick={scrollToDashboard}
              className="bg-white text-hostsuite-primary hover:bg-white/90 px-8 py-4 text-lg font-semibold shadow-glow transition-all duration-300 hover:scale-105"
            >
              <Home className="w-5 h-5 mr-2" />
              Inizia Ora
            </Button>
            
            <Button 
              variant="outline"
              size="lg"
              className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg backdrop-blur-sm"
            >
              Scopri le Funzioni
            </Button>
          </div>
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">1000+</div>
              <div className="text-white/80">Proprietà Gestite</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">25K+</div>
              <div className="text-white/80">Host Attivi</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">95%</div>
              <div className="text-white/80">Automazione</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-32 right-16 w-16 h-16 bg-hostsuite-accent/30 rounded-full blur-lg animate-pulse delay-1000" />
      <div className="absolute top-1/2 right-8 w-12 h-12 bg-hostsuite-secondary/20 rounded-full blur-md animate-pulse delay-500" />
      <img 
        src={hostAiImage} 
        alt="Host AI Assistant" 
        className="absolute top-32 right-32 w-24 h-24 opacity-20 animate-pulse"
      />
    </section>
  );
};

export default Hero;