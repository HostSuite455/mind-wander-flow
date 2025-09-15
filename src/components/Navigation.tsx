import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Home, User, Settings, BarChart } from "lucide-react";
import logoImage from "@/assets/logo.png";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-white/20">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src={logoImage} alt="HostSuite" className="h-8 w-auto" />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#dashboard" className="text-hostsuite-primary hover:text-hostsuite-primary-dark transition-colors font-medium">
              Dashboard
            </a>
            <a href="#properties" className="text-hostsuite-primary hover:text-hostsuite-primary-dark transition-colors font-medium">
              Proprietà
            </a>
            <a href="#guests" className="text-hostsuite-primary hover:text-hostsuite-primary-dark transition-colors font-medium">
              Ospiti
            </a>
            <a href="#analytics" className="text-hostsuite-primary hover:text-hostsuite-primary-dark transition-colors font-medium">
              Analytics
            </a>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" className="text-hostsuite-primary hover:text-hostsuite-primary-dark">
              Accedi
            </Button>
            <Button className="bg-gradient-hostsuite hover:scale-105 transition-transform shadow-soft">
              <Home className="w-4 h-4 mr-2" />
              Inizia Ora
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-hostsuite-primary" />
            ) : (
              <Menu className="w-6 h-6 text-hostsuite-primary" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-lg border-t border-gray-200 py-4 space-y-4">
            <a 
              href="#dashboard" 
              className="block px-4 py-2 text-hostsuite-primary hover:bg-hostsuite-light/20 transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              <BarChart className="w-4 h-4 inline mr-2" />
              Dashboard
            </a>
            <a 
              href="#properties" 
              className="block px-4 py-2 text-hostsuite-primary hover:bg-hostsuite-light/20 transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              <Home className="w-4 h-4 inline mr-2" />
              Proprietà
            </a>
            <a 
              href="#guests" 
              className="block px-4 py-2 text-hostsuite-primary hover:bg-hostsuite-light/20 transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              <User className="w-4 h-4 inline mr-2" />
              Ospiti
            </a>
            <a 
              href="#analytics" 
              className="block px-4 py-2 text-hostsuite-primary hover:bg-hostsuite-light/20 transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Analytics
            </a>
            <div className="border-t border-gray-200 pt-4 px-4 space-y-2">
              <Button variant="ghost" className="w-full text-hostsuite-primary justify-start">
                <User className="w-4 h-4 mr-2" />
                Accedi
              </Button>
              <Button className="w-full bg-gradient-hostsuite">
                <Home className="w-4 h-4 mr-2" />
                Inizia Ora
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;