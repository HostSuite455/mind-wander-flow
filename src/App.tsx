import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Home from "./pages/Home";
import HostLogin from "./pages/HostLogin";
import GuestLogin from "./pages/GuestLogin";
import HostDashboard from "./pages/host-dashboard";
import GuestDashboard from "./pages/guest-dashboard";
import HostAgentHome from "./pages/host-agent-home";
import HostAgentConfig from "./pages/host-agent-config";
import HostBookings from "./pages/host-bookings";
import HostIcalConfig from "./pages/host-ical-config";
import HostUnansweredQuestions from "./pages/host-unanswered-questions";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestGuard from "./components/GuestGuard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Navigation />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/host-login" element={<HostLogin />} />
            <Route path="/login/host" element={<HostLogin />} />
            <Route path="/guest" element={<GuestLogin />} />
            <Route path="/login/guest" element={<GuestLogin />} />
            
            {/* Protected Host Routes */}
            <Route path="/host-dashboard" element={<ProtectedRoute><HostDashboard /></ProtectedRoute>} />
            <Route path="/host-agent-home" element={<ProtectedRoute><HostAgentHome /></ProtectedRoute>} />
            <Route path="/host-agent-config" element={<ProtectedRoute><HostAgentConfig /></ProtectedRoute>} />
            <Route path="/host-bookings" element={<ProtectedRoute><HostBookings /></ProtectedRoute>} />
            <Route path="/host-ical-config" element={<ProtectedRoute><HostIcalConfig /></ProtectedRoute>} />
            <Route path="/host-unanswered-questions" element={<ProtectedRoute><HostUnansweredQuestions /></ProtectedRoute>} />
            
            {/* Protected Guest Routes */}
            <Route path="/guest-dashboard" element={<GuestGuard><GuestDashboard /></GuestGuard>} />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
