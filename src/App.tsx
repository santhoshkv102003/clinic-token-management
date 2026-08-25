import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { QueueProvider } from "./QueueContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

import Home                  from "./pages/Home";
import ClinicDetail          from "./pages/ClinicDetail";
import AdminLogin            from "./pages/Admin";
import AdminPanel            from "./pages/AdminPanel";          // Super Admin
import ClinicAdminDashboard  from "./pages/ClinicAdminDashboard"; // Clinic Admin
import AdminClinics          from "./pages/AdminClinics";
import AdminBooking          from "./pages/AdminBooking";
import AdminCall             from "./pages/AdminCall";
import AdminActivity         from "./pages/AdminActivity";
import NotFound              from "./pages/NotFound";

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
              {/* ── Public ── */}
              <Route path="/"                  element={<Home />} />
              <Route path="/clinic/:clinicId"  element={<ClinicDetail />} />

              {/* ── Auth ── */}
              <Route path="/admin/login"       element={<AdminLogin />} />
              {/* Legacy /admin route kept for backward compat */}
              <Route path="/admin"             element={<Navigate to="/admin/login" replace />} />

              {/* ── Super Admin ── */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute role="SUPER_ADMIN"><AdminPanel /></ProtectedRoute>
              } />
              <Route path="/admin/clinics" element={
                <ProtectedRoute role="SUPER_ADMIN"><AdminClinics /></ProtectedRoute>
              } />

              {/* ── Clinic Admin ── */}
              <Route path="/admin/clinic" element={
                <ProtectedRoute role="CLINIC_ADMIN"><ClinicAdminDashboard /></ProtectedRoute>
              } />

              {/* ── Legacy admin sub-routes (still work) ── */}
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
