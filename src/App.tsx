import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { QueueProvider } from "./QueueContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

import LandingPage           from "./pages/LandingPage";
import AdminPortalLanding     from "./pages/AdminPortalLanding";
import SuperAdminLogin        from "./pages/SuperAdminLogin";
import ClinicAdminLogin       from "./pages/ClinicAdminLogin";
import TokenTracking          from "./pages/TokenTracking";
import Home                   from "./pages/Home";
import ClinicDetail           from "./pages/ClinicDetail";
import AdminLogin             from "./pages/Admin";
import AdminPanel             from "./pages/AdminPanel";          // Super Admin
import ClinicAdminDashboard   from "./pages/ClinicAdminDashboard"; // Clinic Admin
import AdminClinics           from "./pages/AdminClinics";
import AdminBooking           from "./pages/AdminBooking";
import AdminCall              from "./pages/AdminCall";
import AdminActivity          from "./pages/AdminActivity";
import NotFound               from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <AuthProvider>
    <QueueProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* ── Public Landing & Patient Flow ── */}
              <Route path="/"                            element={<LandingPage />} />
              <Route path="/patient"                     element={<Home />} />
              <Route path="/patient/clinic/:clinicId"    element={<ClinicDetail />} />
              <Route path="/clinic/:clinicId"            element={<ClinicDetail />} />
              <Route path="/patient/token/:tokenId"      element={<TokenTracking />} />

              {/* ── Admin Portal Selection & Auth ── */}
              <Route path="/admin"                       element={<AdminPortalLanding />} />
              <Route path="/admin/super/login"           element={<SuperAdminLogin />} />
              <Route path="/admin/clinic/login"          element={<ClinicAdminLogin />} />
              <Route path="/admin/login"                 element={<Navigate to="/admin" replace />} />

              {/* ── Super Admin Dashboard ── */}
              <Route path="/admin/super/dashboard" element={
                <ProtectedRoute role="SUPER_ADMIN"><AdminPanel /></ProtectedRoute>
              } />
              <Route path="/admin/dashboard" element={
                <ProtectedRoute role="SUPER_ADMIN"><AdminPanel /></ProtectedRoute>
              } />
              <Route path="/admin/clinics" element={
                <ProtectedRoute role="SUPER_ADMIN"><AdminClinics /></ProtectedRoute>
              } />

              {/* ── Clinic Admin Dashboard ── */}
              <Route path="/admin/clinic/dashboard" element={
                <ProtectedRoute role="CLINIC_ADMIN"><ClinicAdminDashboard /></ProtectedRoute>
              } />
              <Route path="/admin/clinic" element={
                <ProtectedRoute role="CLINIC_ADMIN"><ClinicAdminDashboard /></ProtectedRoute>
              } />

              {/* ── Legacy admin sub-routes ── */}
              <Route path="/admin/panel"    element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/booking"  element={<AdminBooking />} />
              <Route path="/admin/call"     element={<AdminCall />} />
              <Route path="/admin/activity" element={<AdminActivity />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </QueueProvider>
  </AuthProvider>
);

export default App;
