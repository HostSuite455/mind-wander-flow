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
              </Route>
              
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
