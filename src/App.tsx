import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import AdminBooking from "./pages/AdminBooking";
import AdminCall from "./pages/AdminCall";
import AdminActivity from "./pages/AdminActivity";
import AdminPanel from "./pages/AdminPanel";
import { QueueProvider } from "./QueueContext";

const queryClient = new QueryClient();

// Simple fallback component
const LoadingFallback = () => (
  <div style={{ 
    padding: '20px', 
    textAlign: 'center', 
    color: 'white', 
    fontSize: '18px',
    background: 'rgba(0,0,0,0.7)',
    borderRadius: '8px',
    margin: '20px'
  }}>
    <h1>Clinic Token System</h1>
    <p>Loading...</p>
  </div>
);

const App = () => {
  try {
    return (
      <QueueProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/panel" element={<AdminPanel />} />
                <Route path="/admin/booking" element={<AdminBooking />} />
                <Route path="/admin/call" element={<AdminCall />} />
                <Route path="/admin/activity" element={<AdminActivity />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </QueueProvider>
    );
  } catch (error) {
    console.error("Error loading App:", error);
    return <LoadingFallback />;
  }
};

export default App;
