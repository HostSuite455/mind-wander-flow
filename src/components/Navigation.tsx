import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, MapPin, Compass, User, Globe } from "lucide-react";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-white/20">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="bg-gradient-ocean p-2 rounded-lg">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-seafoam">Mindtrip</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#destinations" className="text-seafoam hover:text-ocean transition-colors font-medium">
              Destinations
            </a>
            <a href="#how-it-works" className="text-seafoam hover:text-ocean transition-colors font-medium">
              How it Works
            </a>
            <a href="#pricing" className="text-seafoam hover:text-ocean transition-colors font-medium">
              Pricing
            </a>
            <a href="#about" className="text-seafoam hover:text-ocean transition-colors font-medium">
              About
            </a>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" className="text-seafoam hover:text-ocean">
              Sign In
            </Button>
            <Button className="bg-gradient-ocean hover:scale-105 transition-transform shadow-soft">
              <MapPin className="w-4 h-4 mr-2" />
              Start Planning
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
              <X className="w-6 h-6 text-seafoam" />
            ) : (
              <Menu className="w-6 h-6 text-seafoam" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-lg border-t border-gray-200 py-4 space-y-4">
            <a 
              href="#destinations" 
              className="block px-4 py-2 text-seafoam hover:bg-seafoam-light/20 transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              <Globe className="w-4 h-4 inline mr-2" />
              Destinations
            </a>
            <a 
              href="#how-it-works" 
              className="block px-4 py-2 text-seafoam hover:bg-seafoam-light/20 transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              How it Works
            </a>
            <a 
              href="#pricing" 
              className="block px-4 py-2 text-seafoam hover:bg-seafoam-light/20 transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </a>
            <a 
              href="#about" 
              className="block px-4 py-2 text-seafoam hover:bg-seafoam-light/20 transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </a>
            <div className="border-t border-gray-200 pt-4 px-4 space-y-2">
              <Button variant="ghost" className="w-full text-seafoam justify-start">
                <User className="w-4 h-4 mr-2" />
                Sign In
              </Button>
              <Button className="w-full bg-gradient-ocean">
                <MapPin className="w-4 h-4 mr-2" />
                Start Planning
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;