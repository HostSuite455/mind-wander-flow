import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, LayoutDashboard, Bot, Calendar, MessageSquare, Settings, HelpCircle, LogOut, User, RefreshCw, Bell } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User as SupabaseUser } from "@supabase/supabase-js";
import logoImage from "@/assets/logo.png";

const HostNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/dashboard/properties", label: "Proprietà", icon: Settings },
    { path: "/dashboard/calendar", label: "Calendario", icon: Calendar },
    { path: "/host-unanswered-questions", label: "Domande", icon: HelpCircle },
  ];

  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadUnreadCount();
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          loadUnreadCount();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);
  
  // Subscribe to notification changes
  useEffect(() => {
    if (!user?.id) return;
    
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'host_notifications',
        filter: `host_id=eq.${user.id}`
      }, () => {
        loadUnreadCount();
        toast({
          title: "Nuova notifica",
          description: "Hai una nuova notifica dal team di pulizia",
        });
      })
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);
  
  async function loadUnreadCount() {
    if (!user?.id) return;
    
    const { count } = await supabase
      .from('host_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('host_id', user.id)
      .eq('read', false);
    
    setUnreadCount(count || 0);
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logout effettuato",
        description: "Arrivederci!",
      });
      navigate("/host-login");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Errore durante il logout",
      });
    }
  };

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
          <div className="hidden lg:flex items-center justify-between flex-1">
            <div className="flex items-center space-x-1">
            {navLinks.map((link) => {
              const IconComponent = link.icon;
              return (
                <Link 
                  key={link.path}
                  to={link.path} 
                      className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-hostsuite-primary focus:ring-offset-2 relative ${
                        isActive(link.path) 
                          ? 'text-hostsuite-primary bg-hostsuite-primary/10 font-semibold' 
                          : 'text-hostsuite-text hover:text-hostsuite-primary hover:bg-hostsuite-primary/5 hover:underline decoration-2 underline-offset-4 hover:decoration-hostsuite-primary'
                      }`}
                >
                  <IconComponent className="w-4 h-4 inline mr-2" />
                  {link.label}
                </Link>
              );
            })}
            </div>
            
            {/* User Menu */}
            {user && (
              <div className="flex items-center gap-2">
                {/* Notification Bell */}
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
                
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-hostsuite-primary/10">
                  <User className="w-4 h-4 text-hostsuite-primary" />
                  <span className="text-sm text-hostsuite-primary font-medium">
                    {user.email?.split('@')[0]}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-hostsuite-text hover:text-hostsuite-primary"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Esci
                </Button>
              </div>
            )}
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
                
                {/* Mobile User Menu */}
                {user && (
                  <div className="border-t border-hostsuite-primary/20 pt-4 mt-4">
                    <div className="px-6 py-2 flex items-center gap-3">
                      <User className="w-5 h-5 text-hostsuite-primary" />
                      <span className="text-hostsuite-primary font-medium">
                        {user.email?.split('@')[0]}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        closeMenu();
                        handleSignOut();
                      }}
                      className="w-full px-6 py-3 text-left flex items-center gap-3 text-hostsuite-text hover:bg-hostsuite-primary/5 hover:text-hostsuite-primary transition-all duration-200"
                    >
                      <LogOut className="w-5 h-5" />
                      Esci
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default HostNavbar;