import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Home as HomeIcon, User, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useActiveProperty } from "@/hooks/useActiveProperty";
import { supaSelect } from "@/lib/supaSafe";
import PropertySwitch from "./PropertySwitch";
import logoImage from "@/assets/logo.png";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [properties, setProperties] = useState<{ id: string; nome: string }[]>([]);
  const location = useLocation();
  const { id: activePropertyId } = useActiveProperty();
  
  const isActive = (path: string) => location.pathname === path;

  // Load properties for authenticated users
  useEffect(() => {
    const loadProperties = async () => {
      const { data } = await supaSelect('properties', 'id,nome');
      setProperties(data || []);
    };
    loadProperties();
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-white/20">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={logoImage} alt="HostSuite" className="h-8 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`transition-colors font-medium ${
                isActive('/') 
                  ? 'text-hostsuite-primary font-semibold' 
                  : 'text-hostsuite-text hover:text-hostsuite-primary'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/host-login" 
              className={`transition-colors font-medium ${
                isActive('/host-login') || isActive('/login/host')
                  ? 'text-hostsuite-primary font-semibold' 
                  : 'text-hostsuite-text hover:text-hostsuite-primary'
              }`}
            >
              Login Host
            </Link>
            <Link 
              to="/guest" 
              className={`transition-colors font-medium ${
                isActive('/guest') || isActive('/login/guest')
                  ? 'text-hostsuite-primary font-semibold' 
                  : 'text-hostsuite-text hover:text-hostsuite-primary'
              }`}
            >
              Login Guest
            </Link>
          </div>

          {/* Property Switch - visible for authenticated routes */}
          {(location.pathname.startsWith('/host-') || location.pathname === '/properties' || location.pathname === '/calendar' || location.pathname === '/export') && properties.length > 0 && (
            <div className="hidden sm:block">
              <PropertySwitch 
                items={properties}
                label=""
                className="w-auto"
              />
            </div>
          )}

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <Button 
              asChild 
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl px-4 py-2 shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2"
              aria-label="Accedi Host"
            >
              <Link to="/host-login">
                <HomeIcon className="w-4 h-4 mr-2" />
                Accedi Host
              </Link>
            </Button>
            <Button 
              asChild 
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-xl"
              aria-label="Accedi Guest"
            >
              <Link to="/guest">
                <Users className="w-4 h-4 mr-2" />
                Accedi Guest
              </Link>
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
            <Link 
              to="/" 
              className={`block px-4 py-2 transition-colors font-medium ${
                isActive('/') 
                  ? 'text-hostsuite-primary bg-hostsuite-light/30 font-semibold' 
                  : 'text-hostsuite-text hover:bg-hostsuite-light/20'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <HomeIcon className="w-4 h-4 inline mr-2" />
              Home
            </Link>
            <Link 
              to="/host-login" 
              className={`block px-4 py-2 transition-colors font-medium ${
                isActive('/host-login') || isActive('/login/host')
                  ? 'text-hostsuite-primary bg-hostsuite-light/30 font-semibold' 
                  : 'text-hostsuite-text hover:bg-hostsuite-light/20'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <HomeIcon className="w-4 h-4 inline mr-2" />
              Login Host
            </Link>
            <Link 
              to="/guest" 
              className={`block px-4 py-2 transition-colors font-medium ${
                isActive('/guest') || isActive('/login/guest')
                  ? 'text-hostsuite-primary bg-hostsuite-light/30 font-semibold' 
                  : 'text-hostsuite-text hover:bg-hostsuite-light/20'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Login Guest
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;