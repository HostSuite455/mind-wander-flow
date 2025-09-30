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
import CalendarPage from "@/pages/dashboard/CalendarPage";
import CalendarioPage from "@/pages/CalendarioPage";
import ExportPage from "@/pages/dashboard/ExportPage";
import PropertyWizard from "@/components/wizard/PropertyWizard";
import PropertyEditPage from "@/pages/PropertyEditPage";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestGuard from "./components/GuestGuard";
// Legacy imports for backward compatibility
import HostDashboard from "./pages/host-dashboard";
import Properties from "./pages/properties";
import Calendar from "./pages/calendar";
import CalendarPro from "./pages/calendar-pro";
import Export from "./pages/export";
import HostAgentConfig from "./pages/host-agent-config";
import HostBookings from "./pages/host-bookings";
import HostUnansweredQuestions from "./pages/host-unanswered-questions";
import PuliziePage from "./pages/PuliziePage";
import CleanerTasksPage from "./pages/CleanerTasksPage";
import CleanerLogin from "./pages/CleanerLogin";
import CleanerGuard from "./components/cleaning/CleanerGuard";
import CleanerInviteAccept from "./pages/CleanerInviteAccept";
import CleanerDashboard from "./pages/CleanerDashboard";
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
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
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
                <Route path="properties" element={<Properties />} />
                <Route path="properties/new" element={<PropertyWizard />} />
                <Route path="properties/:id/edit" element={<PropertyEditPage />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="calendar-pro" element={<Navigate to="/dashboard/calendar" replace />} />
                <Route path="export" element={<ExportPage />} />
                <Route path="host-agent-config" element={<HostAgentConfig />} />
                <Route path="host-bookings" element={<HostBookings />} />
                <Route path="host-unanswered-questions" element={<HostUnansweredQuestions />} />
                <Route path="pulizie" element={<PuliziePage />} />
                <Route path="admin-users" element={<AdminUsers />} />
              </Route>
              
              {/* Nuova rotta calendario semplificato */}
              <Route path="/calendario" element={<ProtectedRoute><CalendarioPage /></ProtectedRoute>} />

              {/* Legacy Host Routes - keeping for backward compatibility but using DashboardLayout */}
              <Route path="/host-dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<HostDashboard />} />
              </Route>
              <Route path="/properties" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<Properties />} />
              </Route>
              <Route path="/calendar" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<Calendar />} />
              </Route>
              <Route path="/calendar-pro" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<CalendarPro />} />
              </Route>
              <Route path="/export" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<Export />} />
              </Route>
              <Route path="/host-agent-config" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<HostAgentConfig />} />
              </Route>
              <Route path="/host-bookings" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<HostBookings />} />
              </Route>
              <Route path="/host-unanswered-questions" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<HostUnansweredQuestions />} />
              </Route>
              <Route path="/dashboard/properties/new" element={<ProtectedRoute><PropertyWizard /></ProtectedRoute>} />
              
              {/* Protected Guest Routes */}
              <Route path="/guest-dashboard" element={<GuestGuard><GuestDashboard /></GuestGuard>} />
              <Route path="/welcome-booklet" element={<WelcomeBooklet />} />

              {/* Cleaner Portal Routes */}
              <Route path="/cleaner-login" element={<><Navigation /><CleanerLogin /></>} />
              <Route path="/invite/cleaner/:invitationCode" element={<CleanerInviteAccept />} />
              <Route path="/cleaner-dashboard" element={<CleanerGuard><CleanerDashboard /></CleanerGuard>} />
              <Route path="/cleaner-tasks" element={<CleanerGuard><CleanerTasksPage /></CleanerGuard>} />
              <Route path="/cleaner" element={<CleanerGuard><CleanerTasksPage /></CleanerGuard>} />
              
              {/* Additional Cleaning Routes */}
              <Route path="/pulizie" element={<ProtectedRoute><PuliziePage /></ProtectedRoute>} />
              
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
