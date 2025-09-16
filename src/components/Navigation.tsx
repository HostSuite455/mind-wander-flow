import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Home as HomeIcon, User, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import logoImage from "@/assets/logo.png";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

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

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Button asChild variant="ghost" className="text-hostsuite-primary hover:text-hostsuite-primary-dark">
              <Link to="/host-login">
                <HomeIcon className="w-4 h-4 mr-2" />
                Accedi Host
              </Link>
            </Button>
            <Button asChild className="bg-gradient-hostsuite hover:scale-105 transition-transform shadow-soft">
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