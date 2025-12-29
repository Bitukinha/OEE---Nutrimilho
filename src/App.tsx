import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner, toast } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Producao from "./pages/Producao";
import Equipamentos from "./pages/Equipamentos";
import Paradas from "./pages/Paradas";
import Qualidade from "./pages/Qualidade";
import Historico from "./pages/Historico";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminProfile from "./pages/AdminProfile";
import { AuthProvider } from "@/context/AuthContext";
import { useEffect } from "react";
import { initNotifications } from "@/lib/notifications";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const unsub = initNotifications(({ table, event }) => {
      toast(`${table} ${event}`);
    });

    return () => unsub();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/producao" element={<Producao />} />
              <Route path="/equipamentos" element={<Equipamentos />} />
              <Route path="/paradas" element={<Paradas />} />
              <Route path="/qualidade" element={<Qualidade />} />
              <Route path="/historico" element={<Historico />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin/profile" element={<AdminProfile />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
