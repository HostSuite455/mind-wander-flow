import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, LayoutDashboard, Settings, Calendar, RefreshCw, Download, Building, LogOut, User, Bot, MessageSquare, BookOpen, Users, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User as SupabaseUser } from "@supabase/supabase-js";
import logoImage from "@/assets/logo.png";
import squareLogoImage from "@/assets/cropped-property_logo_icon_square.png";

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navLinks = [
    { path: "/dashboard", label: "Panoramica", icon: LayoutDashboard, exact: true },
    { path: "/dashboard/properties", label: "Proprietà", icon: Building },
    { path: "/dashboard/calendar-pro", label: "Calendario", icon: Calendar },
    { path: "/dashboard/pulizie", label: "Pulizie", icon: Sparkles },
    { path: "/dashboard/export", label: "Export", icon: Download },
    { path: "/dashboard/host-agent-home", label: "iAgent Home", icon: Bot },
    { path: "/dashboard/host-agent-config", label: "Config Agent", icon: Settings },
    { path: "/dashboard/host-bookings", label: "Prenotazioni", icon: BookOpen },
    { path: "/dashboard/host-unanswered-questions", label: "Domande", icon: MessageSquare },
    { path: "/dashboard/admin-users", label: "Admin Users", icon: Users },
  ];

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logout effettuato",
        description: "Sei stato disconnesso con successo.",
      });
      navigate("/");
    } catch (error) {
      console.error("Errore durante il logout:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il logout.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col z-40
        ${isSidebarOpen ? 'w-64' : 'w-16'}
      `}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          {isSidebarOpen ? (
            // Layout orizzontale quando aperta
            <div className="flex items-center justify-between">
              <Link to="/dashboard" className="flex items-center gap-2">
                <img src={logoImage} alt="HostSuite" className="h-8 w-auto" />
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            // Layout verticale quando chiusa - logo sopra, burger sotto
            <div className="flex flex-col items-center gap-3">
              <Link to="/dashboard" className="flex items-center justify-center">
                <img 
                  src={squareLogoImage} 
                  alt="HostSuite" 
                  className="h-14 w-14 sm:h-16 sm:w-16 object-contain transition-all duration-200 hover:scale-105" 
                  title="HostSuite"
                />
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-1 w-8 h-8 flex items-center justify-center"
              >
                <Menu className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = link.exact 
              ? location.pathname === link.path
              : isActive(link.path);
            
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                } ${!isSidebarOpen && 'justify-center'}`}
                title={!isSidebarOpen ? link.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && <span>{link.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          {user && isSidebarOpen && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <User className="w-4 h-4" />
              <span className="truncate">{user.email}</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className={`w-full text-gray-600 hover:text-gray-900 ${!isSidebarOpen && 'justify-center'}`}
            title={!isSidebarOpen ? "Logout" : undefined}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {isSidebarOpen && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`min-h-screen overflow-auto transition-all duration-300 ease-in-out ${
        isSidebarOpen ? 'ml-64' : 'ml-16'
      }`}>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;