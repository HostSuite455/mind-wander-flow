import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, LayoutDashboard, Bot, Calendar, MessageSquare, Settings, HelpCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import logoImage from "@/assets/logo.png";

const HostNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: "/host-dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/host-agent-home", label: "iAgent Home", icon: Bot },
    { path: "/host-agent-config", label: "Config Agent", icon: Settings },
    { path: "/host-bookings", label: "Prenotazioni", icon: Calendar },
    { path: "/host-ical-config", label: "iCal Config", icon: Settings },
    { path: "/host-unanswered-questions", label: "Domande", icon: HelpCircle },
  ];

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-hostsuite-primary/20 shadow-sm">
      <div className="container max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 transition-transform hover:scale-105">
            {/* TODO: switch logo to local asset */}
            <img src={logoImage} alt="HostSuite" className="h-8 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const IconComponent = link.icon;
              return (
                <Link 
                  key={link.path}
                  to={link.path} 
                  className={`relative px-4 py-2 rounded-lg transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-hostsuite-primary focus:ring-offset-2 ${
                    isActive(link.path) 
                      ? 'text-hostsuite-primary bg-hostsuite-primary/10 font-semibold after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-6 after:h-0.5 after:bg-hostsuite-primary after:rounded-full' 
                      : 'text-hostsuite-text hover:text-hostsuite-primary hover:bg-hostsuite-primary/5'
                  }`}
                >
                  <IconComponent className="w-4 h-4 inline mr-2" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden focus:ring-2 focus:ring-hostsuite-primary focus:ring-offset-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-hostsuite-primary" />
            ) : (
              <Menu className="w-6 h-6 text-hostsuite-primary" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation Overlay */}
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm lg:hidden"
              onClick={closeMenu}
            />
            
            {/* Slide-in Menu */}
            <div className="fixed top-16 left-0 right-0 bg-white/98 backdrop-blur-lg border-b border-hostsuite-primary/20 shadow-lg lg:hidden animate-in slide-in-from-top duration-200">
              <div className="py-4 space-y-2">
                {navLinks.map((link) => {
                  const IconComponent = link.icon;
                  return (
                    <Link 
                      key={link.path}
                      to={link.path} 
                      className={`block px-6 py-3 transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-hostsuite-primary focus:ring-inset ${
                        isActive(link.path) 
                          ? 'text-hostsuite-primary bg-hostsuite-primary/10 font-semibold border-r-2 border-hostsuite-primary' 
                          : 'text-hostsuite-text hover:bg-hostsuite-primary/5 hover:text-hostsuite-primary'
                      }`}
                      onClick={closeMenu}
                    >
                      <IconComponent className="w-5 h-5 inline mr-3" />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default HostNavbar;