import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ForecastProvider } from "@/context/ForecastContext";
import { ChatProvider } from "@/context/ChatContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages & Layouts
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import Forecaster from "./pages/dashboard/Forecaster";
import DocAssistant from "./pages/dashboard/DocAssistant";
import History from "./pages/dashboard/History";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute"; // Import baru

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ForecastProvider>
      <ChatProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              
              {/* PERBAIKAN: Membungkus Dashboard rute dengan proteksi */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardHome />} />
                <Route path="forecaster" element={<Forecaster />} />
                <Route path="assistant" element={<DocAssistant />} />
                <Route path="history" element={<History />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ChatProvider>
    </ForecastProvider>
  </QueryClientProvider>
);

export default App;
