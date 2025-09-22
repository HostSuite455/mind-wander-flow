import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ActivePropertyProvider } from "@/hooks/useActiveProperty";
import Navigation from "@/components/Navigation";
import Home from "./pages/Home";
import Mission from "./pages/Mission";
import Pricing from "./pages/Pricing";
import HostLogin from "./pages/HostLogin";
import GuestLogin from "./pages/GuestLogin";
import HostDashboard from "./pages/host-dashboard";
import GuestDashboard from "./pages/guest-dashboard";
import HostAgentHome from "./pages/host-agent-home";
import HostAgentConfig from "./pages/host-agent-config";
import HostBookings from "./pages/host-bookings";
import HostIcalConfig from "./pages/host-ical-config";
import CalendarPro from "./pages/calendar-pro";
import HostUnansweredQuestions from "./pages/host-unanswered-questions";
import Calendar from "./pages/calendar";
import Properties from "./pages/properties";
import Export from "./pages/export";
import GuestCodeDemo from "./pages/guest-code-demo";
import WelcomeBooklet from "./pages/welcome-booklet";
import AdminUsers from "./pages/admin-users";
import ChannelsPage from "@/pages/dashboard/ChannelsPage";
import PropertiesNewPage from "@/pages/dashboard/PropertiesNewPage";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestGuard from "./components/GuestGuard";
import NotFound from "./pages/NotFound";
import AppErrorBoundary from "./components/AppErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <AppErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ActivePropertyProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen bg-background">
              <Navigation />
              <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/mission" element={<Mission />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/host-login" element={<HostLogin />} />
              <Route path="/login/host" element={<Navigate to="/host-login" replace />} />
              <Route path="/guest" element={<GuestLogin />} />
              <Route path="/login/guest" element={<GuestLogin />} />
              <Route path="/guest-code-demo" element={<GuestCodeDemo />} />
              
              {/* Protected Host Routes */}
              <Route path="/host-dashboard" element={<ProtectedRoute><HostDashboard /></ProtectedRoute>} />
              <Route path="/properties" element={<ProtectedRoute><Properties /></ProtectedRoute>} />
              <Route path="/properties/new" element={<ProtectedRoute><PropertiesNewPage /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
              <Route path="/calendar-pro" element={<ProtectedRoute><CalendarPro /></ProtectedRoute>} />
              <Route path="/export" element={<ProtectedRoute><Export /></ProtectedRoute>} />
              <Route path="/host-agent-home" element={<ProtectedRoute><HostAgentHome /></ProtectedRoute>} />
              <Route path="/host-agent-config" element={<ProtectedRoute><HostAgentConfig /></ProtectedRoute>} />
              <Route path="/host-bookings" element={<ProtectedRoute><HostBookings /></ProtectedRoute>} />
              <Route path="/host-ical-config" element={<ProtectedRoute><HostIcalConfig /></ProtectedRoute>} />
              <Route path="/host-unanswered-questions" element={<ProtectedRoute><HostUnansweredQuestions /></ProtectedRoute>} />
              <Route path="/channels" element={<ProtectedRoute><ChannelsPage /></ProtectedRoute>} />
              <Route path="/admin-users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
              
              {/* Protected Guest Routes */}
              <Route path="/guest-dashboard" element={<GuestGuard><GuestDashboard /></GuestGuard>} />
              <Route path="/welcome-booklet" element={<WelcomeBooklet />} />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </BrowserRouter>
        </ActivePropertyProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </AppErrorBoundary>
);

export default App;
