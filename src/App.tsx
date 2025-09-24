import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ActivePropertyProvider } from "@/hooks/useActiveProperty";
import Navigation from "@/components/Navigation";
import DashboardLayout from "@/layouts/DashboardLayout";
import Home from "./pages/Home";
import Mission from "./pages/Mission";
import Pricing from "./pages/Pricing";
import HostLogin from "./pages/HostLogin";
import GuestLogin from "./pages/GuestLogin";
import GuestDashboard from "./pages/guest-dashboard";
import GuestCodeDemo from "./pages/guest-code-demo";
import WelcomeBooklet from "./pages/welcome-booklet";
import AdminUsers from "./pages/admin-users";
import DashboardOverview from "@/pages/dashboard/DashboardOverview";
import PropertiesList from "@/pages/dashboard/PropertiesList";
import PropertiesNewPage from "@/pages/dashboard/PropertiesNewPage";
import CalendarPage from "@/pages/dashboard/CalendarPage";
import ChannelsPage from "@/pages/dashboard/ChannelsPage";
import ExportPage from "@/pages/dashboard/ExportPage";
import PropertyWizard from "@/pages/dashboard/PropertyWizard";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestGuard from "./components/GuestGuard";
// Legacy imports for backward compatibility
import HostDashboard from "./pages/host-dashboard";
import Properties from "./pages/properties";
import Calendar from "./pages/calendar";
import CalendarPro from "./pages/calendar-pro";
import Export from "./pages/export";
import HostAgentHome from "./pages/host-agent-home";
import HostAgentConfig from "./pages/host-agent-config";
import HostBookings from "./pages/host-bookings";
import HostIcalConfig from "./pages/host-ical-config";
import HostUnansweredQuestions from "./pages/host-unanswered-questions";
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
              <Routes>
              {/* Public Routes */}
              <Route path="/" element={<><Navigation /><Home /></>} />
              <Route path="/mission" element={<><Navigation /><Mission /></>} />
              <Route path="/pricing" element={<><Navigation /><Pricing /></>} />
              <Route path="/host-login" element={<><Navigation /><HostLogin /></>} />
              <Route path="/login/host" element={<Navigate to="/host-login" replace />} />
              <Route path="/guest" element={<><Navigation /><GuestLogin /></>} />
              <Route path="/login/guest" element={<><Navigation /><GuestLogin /></>} />
              <Route path="/guest-code-demo" element={<><Navigation /><GuestCodeDemo /></>} />
              
              {/* Dashboard Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<DashboardOverview />} />
                <Route path="overview" element={<DashboardOverview />} />
                <Route path="properties" element={<PropertiesList />} />
                <Route path="properties/new" element={<PropertiesNewPage />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="channels" element={<ChannelsPage />} />
                <Route path="export" element={<ExportPage />} />
                <Route path="host-agent-home" element={<HostAgentHome />} />
                <Route path="host-agent-config" element={<HostAgentConfig />} />
                <Route path="host-bookings" element={<HostBookings />} />
                <Route path="host-unanswered-questions" element={<HostUnansweredQuestions />} />
                <Route path="admin-users" element={<AdminUsers />} />
              </Route>

              {/* Legacy Host Routes - keeping for backward compatibility but using DashboardLayout */}
              <Route path="/host-dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<HostDashboard />} />
              </Route>
              <Route path="/properties" element={<ProtectedRoute><Properties /></ProtectedRoute>} />
              <Route path="/properties/new" element={<ProtectedRoute><PropertyWizard /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
              <Route path="/calendar-pro" element={<ProtectedRoute><CalendarPro /></ProtectedRoute>} />
              <Route path="/export" element={<ProtectedRoute><Export /></ProtectedRoute>} />
              <Route path="/host-agent-home" element={<ProtectedRoute><HostAgentHome /></ProtectedRoute>} />
              <Route path="/host-agent-config" element={<ProtectedRoute><HostAgentConfig /></ProtectedRoute>} />
              <Route path="/host-bookings" element={<ProtectedRoute><HostBookings /></ProtectedRoute>} />
              <Route path="/host-ical-config" element={<ProtectedRoute><HostIcalConfig /></ProtectedRoute>} />
              <Route path="/host-unanswered-questions" element={<ProtectedRoute><HostUnansweredQuestions /></ProtectedRoute>} />
              <Route path="/channels" element={<ProtectedRoute><ChannelsPage /></ProtectedRoute>} />
              <Route path="/dashboard/properties/new" element={<ProtectedRoute><PropertyWizard /></ProtectedRoute>} />
              
              {/* Protected Guest Routes */}
              <Route path="/guest-dashboard" element={<GuestGuard><GuestDashboard /></GuestGuard>} />
              <Route path="/welcome-booklet" element={<WelcomeBooklet />} />
              
              {/* Admin Routes */}
              <Route path="/admin-users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
              
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
