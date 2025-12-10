import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ReportIncident from "./pages/ReportIncident";
import RequestDocument from "./pages/RequestDocument";
import AdminEnhanced from "./pages/AdminEnhanced";
import PollsEnhanced from "./pages/PollsEnhanced";
import Profile from "./pages/Profile";
import NotificationsEnhanced from "./pages/NotificationsEnhanced";
import SmsAlerts from "./pages/SmsAlerts";
import Announcements from "./pages/Announcements";
import ForgotPassword from "./pages/ForgotPassword";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin/login"
            element={<Navigate to="/login" replace />}
          />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/report-incident" element={<ReportIncident />} />
          <Route path="/request-document" element={<RequestDocument />} />
          <Route path="/polls" element={<PollsEnhanced />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<NotificationsEnhanced />} />
          <Route path="/sms-alerts" element={<NotificationsEnhanced />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/admin" element={<AdminEnhanced />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/support" element={<Support />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
